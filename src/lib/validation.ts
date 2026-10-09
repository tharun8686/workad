import { z } from 'zod';
import { strategies } from './types';
export const inputSchema = z.object({
  role:z.string().trim().min(2).max(100),headcount:z.number().int().min(1).max(500),location:z.string().min(2).max(80),budget:z.number().positive().max(500),deadline:z.number().int().min(1).max(730),
  experienceMin:z.number().min(0).max(40),experienceMax:z.number().min(0).max(50),mandatorySkills:z.array(z.string().trim().min(1).max(80)).min(1).max(30),optionalSkills:z.array(z.string().trim().min(1).max(80)).max(30),
  skillWeights:z.record(z.string(),z.number().min(0).max(100)),businessUnit:z.string().trim().min(1).max(80),priority:z.enum(['Standard','High','Critical']),durationMonths:z.number().int().min(1).max(36),repetitivePct:z.number().min(0).max(90),remoteAllowed:z.boolean(),rawText:z.string().max(8000)
}).superRefine((v,ctx)=>{
  if(v.experienceMax<v.experienceMin) ctx.addIssue({code:'custom',message:'Maximum experience must be at least the minimum.'});
  if(new Set(v.mandatorySkills.map(s=>s.toLowerCase())).size!==v.mandatorySkills.length) ctx.addIssue({code:'custom',message:'Mandatory skills must be unique.'});
  if(v.mandatorySkills.some(s=>!(s in v.skillWeights)) || Object.keys(v.skillWeights).some(s=>!v.mandatorySkills.includes(s)) || Math.abs(Object.values(v.skillWeights).reduce((a,b)=>a+b,0)-100)>.01) ctx.addIssue({code:'custom',message:'Each mandatory skill needs a weight; weights must total 100.'});
});
export const scenarioSchema = z.object({name:z.string().trim().min(1).max(80),strategy:z.enum([...strategies,'BUILD + BORROW']),headcount:z.number().int().min(1).max(500),budget:z.number().positive().max(500),deadline:z.number().int().min(1).max(730),location:z.string().min(2).max(80),buildCount:z.number().int().min(0).max(500),durationMonths:z.number().int().min(1).max(36),repetitivePct:z.number().min(0).max(90)}).refine(v=>v.strategy!=='BUILD + BORROW'||v.buildCount<=v.headcount,'Internal allocation cannot exceed headcount.');
