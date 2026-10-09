import {z} from 'zod';
export const courseEventSchema=z.object({
 eventId:z.string().trim().min(1).max(200),decisionId:z.string().min(1).max(200),personId:z.string().min(1).max(200),
 courseId:z.string().trim().min(1).max(200),name:z.string().trim().min(2).max(250),
 provider:z.enum(['Microsoft Learn','AWS Skill Builder','Coursera','Other']),
 completed:z.boolean(),observedAt:z.iso.datetime(),evidence:z.string().trim().min(5).max(1000),
}).refine(v=>Date.parse(v.observedAt)<=Date.now()+60000,'Course observation cannot be in the future.');
export type CourseEvent=z.infer<typeof courseEventSchema>&{id:string;receivedAt:string;channel:'reviewer import'|'signed connector'};
export function latestCourses(events:CourseEvent[],decisionId:string,asOf=Infinity){
 const latest=new Map<string,CourseEvent>();
 for(const e of [...events].filter(e=>e.decisionId===decisionId&&Date.parse(e.observedAt)<=asOf).sort((a,b)=>a.observedAt.localeCompare(b.observedAt)||a.receivedAt.localeCompare(b.receivedAt)||a.id.localeCompare(b.id)))latest.set(JSON.stringify([e.provider,e.personId,e.courseId]),e);
 return [...latest.values()];
}
