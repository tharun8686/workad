import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {z} from 'zod';
import {levels} from '@/lib/intelligence';
import {AppError,type Actor} from './auth';
import {transaction,pool} from './db';
import {owned} from './repository';
import {profileSchema,stages,type Profile,type RecruitmentJob,type Application,type RecruitmentStage,type RecruitmentWorkspace} from '@/lib/recruitment';
export async function recruitmentWorkspace(a:Actor):Promise<RecruitmentWorkspace>{return transaction(a.id,async q=>({
 profiles:(await q<{payload:Profile}>('SELECT payload FROM talent_profiles WHERE owner_id=$1 ORDER BY created_at DESC',[a.id])).rows.map(r=>r.payload),
 jobs:(await q<{payload:RecruitmentJob}>('SELECT payload FROM recruitment_jobs WHERE owner_id=$1 ORDER BY created_at DESC',[a.id])).rows.map(r=>r.payload),
 applications:(await q<{payload:Application}>('SELECT payload FROM recruitment_applications WHERE owner_id=$1 ORDER BY created_at DESC',[a.id])).rows.map(r=>r.payload),
}));}
function profile(input:unknown):Profile{return {...profileSchema.parse(input),id:randomUUID(),createdAt:new Date().toISOString(),claimsStatus:'Self-reported / not assessed'};}
export async function registerProfile(a:Actor,input:unknown){const p=profile(input);await transaction(a.id,q=>q('INSERT INTO talent_profiles(id,owner_id,payload) VALUES($1,$2,$3)',[p.id,a.id,JSON.stringify(p)]));return p;}
export async function inviteProfile(a:Actor){const token=randomBytes(32).toString('hex');await transaction(a.id,q=>q("INSERT INTO profile_invitations(token_hash,owner_id,expires_at) VALUES($1,$2,now()+interval '7 days')",[createHash('sha256').update(token).digest('hex'),a.id]));return {path:'/register#'+token,expiresIn:'7 days; single use'};}
export async function acceptInvitation(token:string,input:unknown){
 if(!/^[a-f0-9]{64}$/.test(token))throw new AppError(422,'Invalid invitation.');
 const p=profile(input);
 try{await pool().query('SELECT submit_invited_profile($1,$2,$3::jsonb)',[createHash('sha256').update(token).digest('hex'),p.id,JSON.stringify(p)]);}catch{throw new AppError(409,'Invitation expired, was already used, or is unavailable. Request a new link.');}
 return {saved:true};
}
export async function createJob(a:Actor,input:unknown){const v=z.object({company:z.string().trim().min(2).max(160).optional(),level:z.enum(levels).optional(),requirementId:z.string(),description:z.string().trim().min(20).max(8000)}).parse(input);return transaction(a.id,async q=>{
 const r=await owned(q,v.requirementId,a.id,true);if(r.status!=='Approved')throw new AppError(409,'Approve the workforce decision before creating a recruitment requisition.');
 const decision=(await q<{payload:{selected:string}}>('SELECT payload FROM decisions WHERE requirement_id=$1 ORDER BY created_at DESC LIMIT 1',[r.id])).rows[0];
 if(!['BUY','RELOCATE','AUTOMATE'].includes(decision?.payload.selected??''))throw new AppError(409,'The approved plan does not include external hiring.');
 const existing=await q('SELECT id FROM recruitment_jobs WHERE owner_id=$1 AND requirement_id=$2',[a.id,r.id]);if(existing.rows.length)throw new AppError(409,'A recruitment requisition already exists for this requirement.');
 const headcount=decision.payload.selected==='AUTOMATE'?r.headcount-Math.floor(r.headcount*r.repetitivePct/100):r.headcount;
 if(headcount<1)throw new AppError(409,'This plan has no residual hiring requirement.');
 const job:RecruitmentJob={company:v.company,level:v.level,id:randomUUID(),requirementId:r.id,title:r.role,location:(await q<{payload:{snapshot?:{location?:string}}}>('SELECT payload FROM decisions WHERE requirement_id=$1 ORDER BY created_at DESC LIMIT 1',[r.id])).rows[0]?.payload.snapshot?.location??r.location,description:v.description,status:'Draft',createdAt:new Date().toISOString(),openedAt:null,headcount};
 await q('INSERT INTO recruitment_jobs(id,owner_id,requirement_id,payload) VALUES($1,$2,$3,$4)',[job.id,a.id,r.id,JSON.stringify(job)]);return job;
});}
export async function changeJob(a:Actor,id:string,input:unknown){const v=z.object({status:z.enum(['Open','Closed'])}).parse(input);return transaction(a.id,async q=>{
 const j=(await q<{payload:RecruitmentJob}>('SELECT payload FROM recruitment_jobs WHERE id=$1 AND owner_id=$2 FOR UPDATE',[id,a.id])).rows[0]?.payload;if(!j)throw new AppError(404,'Requisition not found.');
 if(j.status==='Closed')throw new AppError(409,'Closed requisitions cannot be reopened.');j.status=v.status;if(v.status==='Open')j.openedAt??=new Date().toISOString();
 await q('UPDATE recruitment_jobs SET payload=$1 WHERE id=$2',[JSON.stringify(j),id]);return j;
});}
export async function addApplication(a:Actor,input:unknown){const v=z.object({jobId:z.string(),profileId:z.string(),channel:z.string().trim().min(2).max(120)}).parse(input);return transaction(a.id,async q=>{
 const j=(await q<{payload:RecruitmentJob}>('SELECT payload FROM recruitment_jobs WHERE id=$1 AND owner_id=$2 FOR UPDATE',[v.jobId,a.id])).rows[0]?.payload;if(!j||j.status!=='Open')throw new AppError(409,'Select an open requisition.');
 const p=await q('SELECT id FROM talent_profiles WHERE id=$1 AND owner_id=$2',[v.profileId,a.id]);if(!p.rows.length)throw new AppError(404,'Profile not found.');
 if((await q('SELECT id FROM recruitment_applications WHERE job_id=$1 AND profile_id=$2',[v.jobId,v.profileId])).rows.length)throw new AppError(409,'This profile already has an application.');
 const now=new Date().toISOString();const app:Application={...v,id:randomUUID(),stage:'Applied',createdAt:now,updatedAt:now,hiredAt:null,history:[{stage:'Applied',at:now,actor:a.name,note:'Application recorded with source channel '+v.channel}]};
 await q('INSERT INTO recruitment_applications(id,owner_id,job_id,profile_id,payload) VALUES($1,$2,$3,$4,$5)',[app.id,a.id,v.jobId,v.profileId,JSON.stringify(app)]);return app;
});}
export async function advanceApplication(a:Actor,id:string,input:unknown){const v=z.object({stage:z.enum(stages),note:z.string().trim().min(10).max(4000)}).parse(input);return transaction(a.id,async q=>{
 const app=(await q<{payload:Application}>('SELECT payload FROM recruitment_applications WHERE id=$1 AND owner_id=$2 FOR UPDATE',[id,a.id])).rows[0]?.payload;if(!app)throw new AppError(404,'Application not found.');
 const transitions:Record<RecruitmentStage,RecruitmentStage[]>={Applied:['Screening','Rejected','Withdrawn'],Screening:['Interview','Rejected','Withdrawn'],Interview:['Offer','Rejected','Withdrawn'],Offer:['Hired','Rejected','Withdrawn'],Hired:[],Rejected:[],Withdrawn:[]};
 if(!transitions[app.stage].includes(v.stage))throw new AppError(409,'This recruitment transition is not allowed.');
 const job=(await q<{payload:RecruitmentJob}>('SELECT payload FROM recruitment_jobs WHERE id=$1 AND owner_id=$2 FOR UPDATE',[app.jobId,a.id])).rows[0]?.payload;
 if(!job||job.status!=='Open')throw new AppError(409,'The requisition is not open.');
 if(v.stage==='Hired'){const count=(await q<{count:string}>("SELECT count(*) FROM recruitment_applications WHERE job_id=$1 AND payload->>'stage'='Hired'",[app.jobId])).rows[0];if(Number(count.count)>=job.headcount)throw new AppError(409,'Approved headcount has been filled.');}
 const now=new Date().toISOString();const event={stage:v.stage,note:v.note,at:now,actor:a.name};app.stage=v.stage;app.updatedAt=now;if(v.stage==='Hired')app.hiredAt=now;app.history.push(event);
 await q('UPDATE recruitment_applications SET payload=$1 WHERE id=$2',[JSON.stringify(app),id]);await q('INSERT INTO recruitment_events(id,owner_id,application_id,payload) VALUES($1,$2,$3,$4)',[randomUUID(),a.id,id,JSON.stringify(event)]);return app;
});}
