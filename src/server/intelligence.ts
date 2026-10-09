import {challengeDecision} from '@/lib/challenger';
import {courseEvents} from './evidence-connectors';
import {latestCourses} from '@/lib/course-evidence';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {transaction,type Query} from './db';
import {AppError,type Actor} from './auth';
import {catalogue,owned} from './repository';
import {comparePay,checkResume,levels,roleKey,roleLevel,cityKey,outcomeSchema,payPolicySchema,type Outcome,type PayPolicy} from '@/lib/intelligence';
import type {Decision} from '@/lib/types';
import type {Profile,RecruitmentJob} from '@/lib/recruitment';

export async function outcomes(q:Query){return (await q<{payload:Outcome}>("SELECT payload FROM workforce_outcomes WHERE owner_id=current_setting('app.user_id',true) ORDER BY created_at DESC")).rows.map(r=>r.payload);}
export async function intelligenceWorkspace(a:Actor){return transaction(a.id,async q=>({courses:await courseEvents(q),outcomes:await outcomes(q),policies:(await q<{payload:PayPolicy}>('SELECT payload FROM pay_policies WHERE owner_id=$1 ORDER BY created_at DESC',[a.id])).rows.map(r=>r.payload)}));}
export async function recordOutcome(a:Actor,input:unknown){const v=outcomeSchema.parse(input);return transaction(a.id,async q=>{
 const d=(await q<{payload:Decision}>('SELECT d.payload FROM decisions d JOIN requirements r ON r.id=d.requirement_id WHERE d.id=$1 AND r.owner_id=$2',[v.decisionId,a.id])).rows[0]?.payload;
 if(!d)throw new AppError(404,'Decision not found.');if(d.outcome==='Rejected')throw new AppError(422,'Rejected decisions have no execution outcome.');
 if(v.observedAt<d.createdAt.slice(0,10))throw new AppError(422,'Observation precedes the decision.');
 const r=await owned(q,d.requirementId,a.id);
 const synced=latestCourses(await courseEvents(q),d.id,Date.parse(v.observedAt+'T23:59:59.999Z'));
 if(v.courses.length+synced.length>100)throw new AppError(422,'Too many course records for one review (maximum 100).');
 const o:Outcome={...v,courses:[...v.courses,...synced.map(c=>({name:c.name,provider:c.provider,completed:c.completed,evidence:`${c.personId}: ${c.evidence} [${c.channel}; event ${c.eventId}]`.slice(0,1000)}))],id:randomUUID(),createdAt:new Date().toISOString(),actor:a.name,requirementId:r.id,role:r.role,city:d.snapshot.location,headcount:d.snapshot.headcount,durationMonths:d.snapshot.durationMonths,baseCost:d.snapshot.calibration?.baseCost??d.snapshot.cost,baseDays:d.snapshot.calibration?.baseDays??d.snapshot.days,strategy:d.selected,predictedCost:d.snapshot.cost,predictedDays:d.snapshot.days};
 await q('INSERT INTO workforce_outcomes(id,owner_id,decision_id,payload) VALUES($1,$2,$3,$4)',[o.id,a.id,d.id,JSON.stringify(o)]);return o;
 });}
export async function savePayPolicy(a:Actor,input:unknown){const p:PayPolicy={...payPolicySchema.parse(input),id:randomUUID(),createdAt:new Date().toISOString()};await transaction(a.id,q=>q('INSERT INTO pay_policies(id,owner_id,payload) VALUES($1,$2,$3)',[p.id,a.id,JSON.stringify(p)]));return p;}
export async function payComparison(a:Actor,input:unknown){const v=z.object({company:z.string().trim().min(2),role:z.string().trim().min(2),level:z.enum(levels),city:z.string().trim().min(2),budgetMonthly:z.number().positive(),currentMonthly:z.number().nonnegative().nullable().optional()}).parse(input);return transaction(a.id,async q=>{const policies=(await q<{payload:PayPolicy}>('SELECT payload FROM pay_policies WHERE owner_id=$1',[a.id])).rows.map(r=>r.payload);return comparePay(policies,(await catalogue(q)).people,v);});}
export async function applicationChecks(a:Actor,profileId:string,jobId:string){return transaction(a.id,async q=>{
 const p=(await q<{payload:Profile}>('SELECT payload FROM talent_profiles WHERE id=$1 AND owner_id=$2',[profileId,a.id])).rows[0]?.payload;
 const job=(await q<{payload:RecruitmentJob}>('SELECT payload FROM recruitment_jobs WHERE id=$1 AND owner_id=$2',[jobId,a.id])).rows[0]?.payload;
 if(!p||!job)throw new AppError(404,'Profile or requisition not found.');const r=await owned(q,job.requirementId,a.id);
 const targetLevel=job.level??roleLevel(r.role,r.experienceMin);
 const peers=(await catalogue(q)).people.filter(person=>person.kind==='employee'&&!!job.company&&person.company?.toLowerCase()===job.company.toLowerCase()&&roleKey(person.role)===roleKey(r.role)&&(person.level??roleLevel(person.role,person.experience))===targetLevel);
 const policies=(await q<{payload:PayPolicy}>('SELECT payload FROM pay_policies WHERE owner_id=$1',[a.id])).rows.map(row=>row.payload);
 return {...checkResume(p,r.experienceMin),targetLevel,company:job.company??null,peerCount:peers.length,skillComparison:peers.length>=3?r.mandatorySkills.map(skill=>({skill,claimed:p.skills.some(s=>s.toLowerCase()===skill.toLowerCase()),internalAverage:Math.round(peers.reduce((sum,person)=>sum+(person.skills[skill]??0),0)/peers.length)})):[],pay:job.company&&targetLevel?comparePay(policies,(await catalogue(q)).people,{company:job.company,role:r.role,level:targetLevel,city:job.location,budgetMonthly:r.budget*100000/12}):null};
 });}

export async function decisionChallenge(a:Actor,id:string){return transaction(a.id,async q=>{const r=await owned(q,id,a.id);const c=await catalogue(q,id);const d=(await q<{payload:Decision}>('SELECT payload FROM decisions WHERE requirement_id=$1 ORDER BY created_at DESC LIMIT 1',[id])).rows[0]?.payload;return challengeDecision(r,c.people,c.skills,await outcomes(q),d);});}
