import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {CourseEvent} from '@/lib/course-evidence';
import {AppError} from './auth';

const providerSchema=z.enum(['Coursera','Microsoft Learn','AWS Skill Builder']);
const value=z.union([z.string(),z.number(),z.boolean(),z.null()]).optional();
const rawRecordSchema=z.record(z.string(),value);

export const lmsExportSchema=z.object({
 provider:providerSchema,
 decisionId:z.string().min(1).max(200),
 personId:z.string().min(1).max(200),
 records:z.array(rawRecordSchema).min(1).max(100),
});

type RawRecord=z.infer<typeof rawRecordSchema>;

function text(row:RawRecord,keys:string[]){
 for(const key of keys){
  const v=row[key];
  if(typeof v==='string'&&v.trim())return v.trim();
  if(typeof v==='number'&&Number.isFinite(v))return String(v);
 }
 return '';
}

function time(row:RawRecord,keys:string[]){
 const raw=text(row,keys);
 if(!raw)return '';
 const parsed=Date.parse(raw);
 return Number.isFinite(parsed)?new Date(parsed).toISOString():'';
}

function complete(row:RawRecord,keys:string[]){
 const joined=keys.map(k=>row[k]).filter(v=>v!==undefined&&v!==null).join(' ').toLowerCase();
 return /\b(completed|complete|passed|certified|success|succeeded)\b/.test(joined)||joined==='100';
}

function evidence(provider:CourseEvent['provider'],row:RawRecord){
 if(provider==='Coursera'){
  return text(row,['certificateUrl','certificateLink','verificationUrl','externalId','enrollmentId','id'])||'Coursera enterprise learning record';
 }
 if(provider==='Microsoft Learn'){
  return text(row,['achievementUrl','url','moduleUrl','uid','moduleUid','id'])||'Microsoft Learn organizational record';
 }
 return text(row,['certificateUrl','transcriptUrl','registrationId','transcriptId','id'])||'AWS Skill Builder team record';
}

function fields(provider:CourseEvent['provider']){
 if(provider==='Coursera')return {
  id:['eventId','id','enrollmentId','externalId','contentId','courseId','itemId'],
  course:['courseId','contentId','itemId','collectionId','slug'],
  name:['name','courseName','contentName','itemName','course','title'],
  observed:['completedAt','completionDate','lastActivityAt','updatedAt','observedAt'],
  status:['status','completionStatus','progress','completed'],
 };
 if(provider==='Microsoft Learn')return {
  id:['eventId','id','uid','moduleUid','achievementId','moduleId'],
  course:['courseId','moduleUid','uid','moduleId','url'],
  name:['name','title','moduleTitle','displayName'],
  observed:['completedAt','completedDate','lastActivityDate','updatedAt','observedAt'],
  status:['status','completionStatus','progress','completed'],
 };
 return {
  id:['eventId','id','transcriptId','registrationId','activityId','courseId'],
  course:['courseId','activityId','registrationId'],
  name:['name','title','courseTitle','activityTitle'],
  observed:['completedAt','completionDate','completedOn','lastActivityAt','updatedAt','observedAt'],
  status:['status','completionStatus','progress','completed'],
 };
}

export function normalizeLmsExport(input:unknown):Omit<CourseEvent,'id'|'receivedAt'|'channel'>[]{
 const v=lmsExportSchema.parse(input);
 return v.records.map((row,index)=>{
  const f=fields(v.provider);
  const courseId=text(row,f.course);
  const name=text(row,f.name);
  const observedAt=time(row,f.observed);
  if(!courseId)throw new AppError(422,`Record ${index+1} is missing a course identifier.`);
  if(!name)throw new AppError(422,`Record ${index+1} is missing a course name.`);
  if(!observedAt)throw new AppError(422,`Record ${index+1} is missing a valid completion or activity date.`);
  const rawId=text(row,f.id)||createHash('sha256').update(JSON.stringify([v.provider,v.decisionId,v.personId,courseId,observedAt,row])).digest('hex');
  return {
   eventId:`${v.provider}:${rawId}`,
   decisionId:v.decisionId,
   personId:v.personId,
   courseId,
   name,
   provider:v.provider,
   completed:complete(row,f.status),
   observedAt,
   evidence:evidence(v.provider,row),
  };
 });
}
