import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {connectorActor,importCourseEvents,importLmsExport,importPayPolicies,courseEvents} from '../src/server/evidence-connectors';
import {latestCourses} from '../src/lib/course-evidence';
import {decisionChallenge,recordOutcome} from '../src/server/intelligence';
import {createRequirement,decide,workspace} from '../src/server/repository';
import {importRecords} from '../src/server/imports';
import {transaction} from '../src/server/db';
import {defaultInput} from './fixtures/catalogue';
Object.assign(process.env,{LOCAL_SANDBOX:'1',LOCAL_DATABASE_PATH:'memory://',NODE_ENV:'test'});delete process.env.DATABASE_URL;
const a={id:'connector-owner',name:'Reviewer',role:'admin' as const},other={...a,id:'other-owner'};
after(async()=>{const local=(globalThis as unknown as {advisoryLocal?:Promise<{close:()=>Promise<void>}>}).advisoryLocal;if(local)await(await local).close();});

test('signed connector rejects tampering, stale signatures and unset configuration',()=>{
 process.env.LEARNING_CONNECTOR_SECRET='a'.repeat(32);process.env.LEARNING_CONNECTOR_OWNER_ID=a.id;
 const raw='[]',timestamp=String(Math.floor(Date.now()/1000));
 const signature='sha256='+createHmac('sha256',process.env.LEARNING_CONNECTOR_SECRET).update(timestamp+'.'+raw).digest('hex');
 const headers=new Headers({'x-workforce-timestamp':timestamp,'x-workforce-signature':signature});
 assert.equal(connectorActor(headers,raw).id,a.id);
 assert.throws(()=>connectorActor(headers,'[{}]'),/signature/);
 assert.throws(()=>connectorActor(headers,raw,Date.now()+600000),/expired/);
 delete process.env.LEARNING_CONNECTOR_SECRET;assert.throws(()=>connectorActor(headers,raw),/not configured/);
});

test('course imports are atomic, owner scoped, replay safe and included in later reviews',{timeout:90000},async()=>{
 await importRecords(a,{source:'Assessed employee record',authority:'Authorized synthetic test',observedAt:new Date().toISOString(),confirm:true,records:[{externalId:'learner',name:'Learner',kind:'employee',role:'Backend Engineer',location:'Bengaluru',experience:5,salary:10,rate:0,availability:0,performance:80,learning:0,promotionEligible:false,skills:{Python:90},projects:[],certifications:[]}]});
 const r=await createRequirement(a,{...defaultInput,headcount:1,mandatorySkills:['Python'],optionalSkills:[],skillWeights:{Python:100}});
 const d=await decide(a,r.id,'Approved','BUILD','Approved assessed learning plan.');
 const personId=(await workspace(a)).people[0].id;
 const row={eventId:'event-1',decisionId:d.id,personId,courseId:'course-1',name:'Data pipelines',provider:'Coursera' as const,completed:true,observedAt:new Date().toISOString(),evidence:'Completion certificate reference 123'};
 assert.deepEqual(await importCourseEvents(a,[row]),{inserted:1,duplicates:0});
 assert.deepEqual(await importCourseEvents(a,[row]),{inserted:0,duplicates:1});
 await assert.rejects(()=>importCourseEvents(a,[{...row,completed:false}]),/already used/);
 await assert.rejects(()=>importCourseEvents(other,[row]),/not found/);
 await assert.rejects(()=>importCourseEvents(a,[{...row,eventId:'atomic'},{...row,eventId:'invalid',personId:'unassigned'}]),/Learner/);
 let events=await transaction(a.id,courseEvents);assert.equal(events.length,1);
 await assert.rejects(()=>transaction(a.id,q=>q('DELETE FROM course_events WHERE id=$1',[events[0].id])),/immutable/);
 assert.equal((await transaction(other.id,courseEvents)).length,0);
 const outcome=await recordOutcome(a,{decisionId:d.id,observedAt:row.observedAt.slice(0,10),successful:true,retained:true,deliveredOnTime:true,actualCost:1000000,actualDays:20,courses:[],evidence:'Verified actual costs and delivery in project records.'});
 assert.equal(outcome.courses.length,1);assert.equal(outcome.courses[0].provider,'Coursera');
 await importCourseEvents(a,[{...row,eventId:'event-2',completed:false,observedAt:new Date(Date.now()+1).toISOString()}]);
 events=await transaction(a.id,courseEvents);assert.equal(latestCourses(events,d.id)[0].completed,false);
 assert.equal(outcome.courses[0].completed,true);
 const before=JSON.stringify((await workspace(a)).decisions);
 const report=await decisionChallenge(a,r.id);assert.equal(report.cases.length,4);assert.equal(report.selected,'BUILD');assert.equal(report.approvedForecast?.cost,d.snapshot.cost);
 assert.equal(JSON.stringify((await workspace(a)).decisions),before);
 await assert.rejects(()=>decisionChallenge(other,r.id),/not found/);
});

test('lms exports normalize Coursera, Microsoft Learn and AWS Skill Builder records',async()=>{
 const w=await workspace(a);
 let personId=w.people[0]?.id;
 let decisionId=w.decisions.find(d=>d.outcome!=='Rejected'&&w.actions.some(x=>x.decisionId===d.id&&x.strategy==='BUILD'))?.id;
 if(!personId||!decisionId){
  await importRecords(a,{source:'Assessed employee record',authority:'Authorized synthetic test',observedAt:new Date().toISOString(),confirm:true,records:[{externalId:'lms-learner',name:'LMS Learner',kind:'employee',role:'Data Engineer',location:'Bengaluru',experience:4,salary:8,rate:0,availability:0,performance:80,learning:0,promotionEligible:false,skills:{Python:90},projects:[],certifications:[]}]});
  const r=await createRequirement(a,{...defaultInput,headcount:1,mandatorySkills:['Python'],optionalSkills:[],skillWeights:{Python:100}});
  const d=await decide(a,r.id,'Approved','BUILD','Approved learning evidence bridge.');
  personId=((await workspace(a)).actions.find(x=>x.decisionId===d.id&&x.strategy==='BUILD')!.details.personIds as string[])[0];
  decisionId=d.id;
 }
 const observedAt=new Date().toISOString();
 const providers=[
  {provider:'Coursera',records:[{enrollmentId:'c-1',courseId:'course-c',courseName:'Coursera Data Engineering',completionStatus:'Completed',completedAt:observedAt,certificateUrl:'https://coursera.example/cert'}]},
  {provider:'Microsoft Learn',records:[{uid:'m-1',title:'Azure data pipelines',status:'Completed',completedDate:observedAt,url:'https://learn.microsoft.com/training/modules/example'}]},
  {provider:'AWS Skill Builder',records:[{transcriptId:'a-1',courseId:'course-a',courseTitle:'AWS data analytics',status:'Completed',completionDate:observedAt,certificateUrl:'https://skillbuilder.aws/cert'}]},
 ] as const;
 for(const payload of providers)assert.equal((await importLmsExport(a,{...payload,decisionId,personId})).inserted,1);
 assert.equal((await importLmsExport(a,{...providers[0],decisionId,personId})).duplicates,1);
 const events=await transaction(a.id,courseEvents);
 assert.ok(events.some(e=>e.provider==='Coursera'&&e.name==='Coursera Data Engineering'&&e.completed));
 assert.ok(events.some(e=>e.provider==='Microsoft Learn'&&e.courseId==='m-1'));
 assert.ok(events.some(e=>e.provider==='AWS Skill Builder'&&e.evidence.includes('skillbuilder.aws')));
 await assert.rejects(()=>importLmsExport(a,{provider:'Coursera',decisionId,personId,records:[{courseId:'missing-name',completedAt:observedAt}]}),/course name/);
});

test('bulk pay imports validate atomically and skip duplicates',async()=>{
 const band={company:'Example',role:'Engineer',city:'Bangalore',level:'Senior',monthlyMin:35000,monthlyMax:45000,livingBudget:30000,observedAt:'2026-01-01',source:'Approved compensation and budget evidence'};
 assert.deepEqual(await importPayPolicies(a,[band,band]),{inserted:1,duplicates:1});
 assert.deepEqual(await importPayPolicies(a,[band]),{inserted:0,duplicates:1});
 await assert.rejects(()=>importPayPolicies(a,[{...band,company:'Atomic'},{...band,monthlyMax:1}]));
 const count=await transaction(a.id,q=>q('SELECT id FROM pay_policies WHERE owner_id=$1',[a.id]));assert.equal(count.rows.length,1);
});
