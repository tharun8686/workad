import {z} from 'zod';
import {employmentSchema,levels} from './intelligence';
const optionalNumber=(max:number)=>z.number().finite().min(0).max(max).nullable();
export const profileSchema=z.object({
 company:z.string().trim().max(160).optional(),level:z.enum(levels).optional(),graduationYear:z.number().int().min(1900).max(new Date().getUTCFullYear()).nullable().optional(),employment:z.array(employmentSchema).max(100).optional(),
 name:z.string().trim().min(2).max(160),kind:z.enum(['employee','candidate','contractor']),
 role:z.string().trim().min(2).max(160),location:z.string().trim().min(2).max(160),
 experience:optionalNumber(80),availability:optionalNumber(3650),salary:optionalNumber(10000),rate:optionalNumber(100000),
 skills:z.array(z.string().trim().min(1).max(160)).min(1).max(100),
 source:z.string().trim().min(3).max(250),consent:z.literal(true),
 conversionInterest:z.enum(['Yes','No','Unknown']),
 evidence:z.string().trim().max(4000),
 observedAt:z.iso.datetime(),
}).refine(v=>new Date(v.observedAt).getTime()<=Date.now()+60000,'Observation cannot be in the future.');
export type Profile=z.infer<typeof profileSchema>&{id:string;createdAt:string;claimsStatus:'Self-reported / not assessed'};
export const stages=['Applied','Screening','Interview','Offer','Hired','Rejected','Withdrawn'] as const;
export type RecruitmentStage=typeof stages[number];
export type RecruitmentJob={company?:string;level?:import('./intelligence').Level;id:string;requirementId:string;title:string;location:string;description:string;status:'Draft'|'Open'|'Closed';createdAt:string;openedAt:string|null;headcount:number};
export type Application={id:string;jobId:string;profileId:string;channel:string;stage:RecruitmentStage;createdAt:string;updatedAt:string;hiredAt:string|null;history:{stage:RecruitmentStage;at:string;actor:string;note:string}[]};
export type RecruitmentWorkspace={profiles:Profile[];jobs:RecruitmentJob[];applications:Application[]};
