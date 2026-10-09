import {createHash,createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {courseEventSchema,type CourseEvent} from '@/lib/course-evidence';
import {payPolicySchema,type PayPolicy} from '@/lib/intelligence';
import {AppError,type Actor} from './auth';
import {transaction,type Query} from './db';
import type {Decision,Action} from '@/lib/types';
import {normalizeLmsExport} from './lms-connectors';

export async function courseEvents(q:Query){return (await q<{payload:CourseEvent}>("SELECT payload FROM course_events WHERE owner_id=current_setting('app.user_id',true) ORDER BY created_at DESC")).rows.map(r=>r.payload);}
export async function importCourseEvents(a:Actor,input:unknown,channel:CourseEvent['channel']='reviewer import'){
 const rows=z.array(courseEventSchema).min(1).max(100).parse(input);
 return transaction(a.id,async q=>{
  let inserted=0;
  for(const row of rows){
   const d=(await q<{payload:Decision}>('SELECT d.payload FROM decisions d JOIN requirements r ON r.id=d.requirement_id WHERE d.id=$1 AND r.owner_id=$2',[row.decisionId,a.id])).rows[0]?.payload;
   if(!d)throw new AppError(404,'Decision not found.');
   if(d.outcome==='Rejected'||Date.parse(row.observedAt)<Date.parse(d.createdAt))throw new AppError(422,'Course evidence must follow an accepted decision.');
   const actions=(await q<{payload:Action}>("SELECT payload FROM actions WHERE decision_id=$1 AND strategy='BUILD'",[d.id])).rows.map(r=>r.payload);
   if(!actions.some(action=>Array.isArray(action.details.personIds)&&action.details.personIds.includes(row.personId)))throw new AppError(422,'Learner must be assigned to this decision’s build plan.');
   const key=createHash('sha256').update(JSON.stringify([row.provider,row.eventId])).digest('hex');
   const saved:CourseEvent={...row,id:randomUUID(),receivedAt:new Date().toISOString(),channel};
   const result=await q('INSERT INTO course_events(id,owner_id,decision_id,event_key,payload) VALUES($1,$2,$3,$4,$5) ON CONFLICT(owner_id,event_key) DO NOTHING RETURNING id',[saved.id,a.id,d.id,key,JSON.stringify(saved)]);
   if(!result.rows.length){
    const old=(await q<{payload:CourseEvent}>('SELECT payload FROM course_events WHERE owner_id=$1 AND event_key=$2',[a.id,key])).rows[0].payload;
    if(JSON.stringify(courseEventSchema.parse(old))!==JSON.stringify(row))throw new AppError(409,'Event ID was already used for different evidence. Send a new event ID for corrections.');
   }else inserted++;
  }
  return {inserted,duplicates:rows.length-inserted};
 });
}

export async function importLmsExport(a:Actor,input:unknown,channel:CourseEvent['channel']='reviewer import'){
 const rows=normalizeLmsExport(input);
 return importCourseEvents(a,rows,channel);
}

// A server-side connector fixes the tenant; request bodies cannot select another owner.
export function connectorActor(headers:Headers,raw:string,now=Date.now()):Actor{
 const secret=process.env.LEARNING_CONNECTOR_SECRET,owner=process.env.LEARNING_CONNECTOR_OWNER_ID;
 if(!secret||secret.length<32||!owner)throw new AppError(503,'Learning connector is not configured.');
 const timestamp=headers.get('x-workforce-timestamp')??'',signature=headers.get('x-workforce-signature')??'';
 if(!/^\d{10}$/.test(timestamp)||Math.abs(now-Number(timestamp)*1000)>300000||!/^sha256=[a-f0-9]{64}$/.test(signature))throw new AppError(401,'Invalid or expired connector signature.');
 const expected=createHmac('sha256',secret).update(timestamp+'.'+raw).digest();
 if(!timingSafeEqual(expected,Buffer.from(signature.slice(7),'hex')))throw new AppError(401,'Invalid connector signature.');
 return {id:owner,name:'Learning evidence connector',role:'reviewer'};
}

export async function importPayPolicies(a:Actor,input:unknown){
 const rows=z.array(payPolicySchema).min(1).max(100).parse(input);
 return transaction(a.id,async q=>{
  // Serialize imports for this owner, including concurrent retries.
  await q('SELECT pg_advisory_xact_lock(hashtext($1))',[a.id+':pay-import']);
  const existing=(await q<{payload:PayPolicy}>('SELECT payload FROM pay_policies WHERE owner_id=$1',[a.id])).rows.map(r=>JSON.stringify(payPolicySchema.parse(r.payload)));
  const seen=new Set(existing);let inserted=0;
  for(const row of rows){const key=JSON.stringify(row);if(seen.has(key))continue;const p={...row,id:randomUUID(),createdAt:new Date().toISOString()};await q('INSERT INTO pay_policies(id,owner_id,payload) VALUES($1,$2,$3)',[p.id,a.id,JSON.stringify(p)]);seen.add(key);inserted++;}
  return {inserted,duplicates:rows.length-inserted};
 });
}
