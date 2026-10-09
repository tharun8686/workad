import {z} from 'zod';
import type {Decision,Person,Requirement,Analysis,ScenarioResult} from './types';

export const levels=['Fresher','Junior','Mid','Senior','Lead'] as const;
export type Level=typeof levels[number];
export const cityKey=(s:string)=>s.trim().toLowerCase().replace(/^bangalore$/,'bengaluru');
export const roleKey=(s:string)=>s.toLowerCase().replace(/\b(senior|sr\.?|junior|jr\.?|lead|fresher|mid)\b/g,'').replace(/[^a-z0-9]+/g,' ').trim();
export function roleLevel(role:string,years:number|null):Level|null{
 if(/\b(lead|principal|staff)\b/i.test(role))return 'Lead';
 if(/\b(senior|sr)\b/i.test(role))return 'Senior';
 if(/\b(fresher|graduate|entry)\b/i.test(role))return 'Fresher';
 if(/\b(junior|jr)\b/i.test(role))return 'Junior';
 return years===null?null:years<1?'Fresher':years<3?'Junior':years<5?'Mid':years<9?'Senior':'Lead';
}
export const payPolicySchema=z.object({company:z.string().trim().min(2).max(160),role:z.string().trim().min(2).max(160),level:z.enum(levels),city:z.string().trim().min(2).max(160),monthlyMin:z.number().positive().max(10000000),monthlyMax:z.number().positive().max(10000000),livingBudget:z.number().nonnegative().max(10000000),source:z.string().trim().min(10).max(1000),observedAt:z.iso.date()}).refine(v=>v.monthlyMax>=v.monthlyMin,'Maximum must be at least the minimum.').refine(v=>v.observedAt<=new Date().toISOString().slice(0,10),'Evidence date cannot be in the future.');
export type PayPolicy=z.infer<typeof payPolicySchema>&{id:string;createdAt:string};
export function comparePay(policies:PayPolicy[],people:Person[],input:{company:string;role:string;level:Level;city:string;budgetMonthly:number;currentMonthly?:number|null}){
 const policy=policies.filter(p=>p.company.toLowerCase()===input.company.trim().toLowerCase()&&roleKey(p.role)===roleKey(input.role)&&p.level===input.level&&cityKey(p.city)===cityKey(input.city)).sort((a,b)=>b.observedAt.localeCompare(a.observedAt)||b.createdAt.localeCompare(a.createdAt))[0];
 const peers=people.filter(p=>p.kind==='employee'&&p.company?.toLowerCase()===input.company.trim().toLowerCase()&&roleKey(p.role)===roleKey(input.role)&&(p.level??roleLevel(p.role,p.experience))===input.level&&cityKey(p.location)===cityKey(input.city));
 const salaries=peers.map(p=>p.salary*100000/12).sort((a,b)=>a-b);
 const peerMedian=salaries.length>=3?(salaries[Math.floor((salaries.length-1)/2)]+salaries[Math.floor(salaries.length/2)])/2:null;
 const floor=policy?Math.max(policy.monthlyMin,policy.livingBudget):null;
 const ceiling=policy?Math.min(policy.monthlyMax,input.budgetMonthly):null;
 const feasible=floor!==null&&ceiling!==null&&ceiling>=floor;
 return {policy:policy??null,peerCount:peers.length,peerMedian,floor,ceiling,feasible,target:feasible?Math.round(Math.min(ceiling!,Math.max(floor!,peerMedian??(policy!.monthlyMin+policy!.monthlyMax)/2))):null,notice:'Same company, role, level and destination city use the same band. Previous pay does not set the offer. City living budgets are supplied evidence, not a verified living-wage estimate. Peer aggregates require at least three employees.'};
}

export const employmentSchema=z.object({employer:z.string().trim().min(1).max(160),start:z.iso.date(),end:z.iso.date().nullable()}).refine(v=>!v.end||v.end>=v.start,'Employment end precedes start.');
export function checkResume(input:{experience:number|null;graduationYear?:number|null;employment?:z.infer<typeof employmentSchema>[]},requiredYears:number,now=new Date()){
 const flags:{code:string;message:string}[]=[];
 if(input.experience===null)flags.push({code:'MISSING_EXPERIENCE',message:'Experience is unknown; request supporting employment dates.'});
 else if(input.experience<requiredYears)flags.push({code:'REQUIREMENT_GAP',message:`Claims ${input.experience} years; the role requires ${requiredYears}. This is a qualification gap, not proof of fraud.`});
 const jobs=input.employment??[];const intervals=jobs.map(j=>[Date.parse(j.start),j.end?Date.parse(j.end):now.getTime()]).sort((a,b)=>a[0]-b[0]);
 if(intervals.some(([s,e])=>s>now.getTime()||e>now.getTime()))flags.push({code:'FUTURE_DATES',message:'Employment includes future dates; verify the source.'});
 let end=-Infinity,days=0,overlap=false;
 for(const [start,finish] of intervals){if(start<end)overlap=true;const bounded=Math.min(finish,now.getTime());days+=Math.max(0,bounded-Math.max(start,end))/86400000;end=Math.max(end,bounded);}
 const documentedYears=jobs.length?days/365.25:null;
 if(overlap)flags.push({code:'OVERLAPPING_JOBS',message:'Employment periods overlap. Concurrent work can be legitimate; overlapping time is counted once.'});
 if(documentedYears!==null&&input.experience!==null&&input.experience>documentedYears+.5)flags.push({code:'CLAIM_TIMELINE_GAP',message:`Claim exceeds the supplied non-overlapping timeline (${documentedYears.toFixed(1)} years). Request missing evidence.`});
 if(input.graduationYear&&input.experience!==null&&input.experience>Math.max(0,now.getUTCFullYear()-input.graduationYear)+1)flags.push({code:'PRE_GRADUATION_WORK',message:'The claim includes time before graduation. Verify internships, part-time work or earlier employment; graduation is not a career start date.'});
 return {status:flags.length?'Review needed':'No inconsistency detected',documentedYears,flags,notice:'These are consistency checks, not a fraud verdict or an automatic rejection. Supplied dates remain unverified.'};
}

export const outcomeSchema=z.object({decisionId:z.string().min(1),observedAt:z.iso.date(),successful:z.boolean(),retained:z.boolean(),deliveredOnTime:z.boolean(),actualCost:z.number().nonnegative().max(1e12),actualDays:z.number().nonnegative().max(36500),courses:z.array(z.object({name:z.string().trim().min(2).max(250),provider:z.enum(['Microsoft Learn','AWS Skill Builder','Coursera','Other']),completed:z.boolean(),evidence:z.string().trim().min(5).max(1000)})).max(100),evidence:z.string().trim().min(20).max(4000)}).refine(v=>v.observedAt<=new Date().toISOString().slice(0,10),'Outcome cannot be in the future.');
export type Outcome=z.infer<typeof outcomeSchema>&{id:string;createdAt:string;actor:string;requirementId:string;role:string;city:string;headcount:number;durationMonths:number;strategy:Decision['selected'];predictedCost:number;predictedDays:number;baseCost:number;baseDays:number};
export function learningSummary(outcomes:Outcome[],role:string,city:string,strategy:string,context?:{headcount:number;durationMonths:number}){
 // One latest observation per decision prevents repeated follow-ups inflating evidence.
 const latest=new Map<string,Outcome>();for(const o of [...outcomes].sort((a,b)=>a.observedAt.localeCompare(b.observedAt)||a.createdAt.localeCompare(b.createdAt)))latest.set(o.decisionId,o);
 const rows=[...latest.values()].filter(o=>o.role.trim().toLowerCase()===role.trim().toLowerCase()&&cityKey(o.city)===cityKey(city)&&o.strategy===strategy&&(!context||(o.headcount===context.headcount&&o.durationMonths===context.durationMonths)));
 const mean=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
 const costRatio=mean(rows.filter(o=>o.baseCost>0).map(o=>o.actualCost/o.baseCost));
 const dayRatio=mean(rows.filter(o=>o.baseDays>0).map(o=>o.actualDays/o.baseDays));
 return {samples:rows.length,active:rows.length>=3,successRate:mean(rows.map(o=>Number(o.successful))),retentionRate:mean(rows.map(o=>Number(o.retained))),onTimeRate:mean(rows.map(o=>Number(o.deliveredOnTime))),costRatio,dayRatio};
}
export function calibrateScenario(s:ScenarioResult,role:string,outcomes:Outcome[]):ScenarioResult{
 const learned=learningSummary(outcomes,role,s.location,s.strategy,s);if(!learned.active)return s;
 const baseCost=s.cost,baseDays=s.days;
 const cost=Math.round(baseCost*Math.max(.5,Math.min(2,learned.costRatio??1))),days=Math.ceil(baseDays*Math.max(.5,Math.min(2,learned.dayRatio??1)));
 const budget=s.budget*100000*s.durationMonths/12*s.headcount;
 const observedQuality=((learned.successRate??.5)+(learned.retentionRate??.5)+(learned.onTimeRate??.5))/3;
 return {...s,cost,days,calibration:{baseCost,baseDays,samples:learned.samples},score:Math.max(0,Math.min(100,s.score+(observedQuality-.5)*10)),budgetDifference:Math.round(budget-cost),timelineDifference:s.deadline-days,feasible:s.coverage>=s.headcount&&cost<=budget&&days<=s.deadline,notes:[...s.notes,`Calibrated using ${learned.samples} distinct comparable decisions. Baseline: ₹${baseCost}, ${baseDays} days. Bounded observational adjustment; not causal proof.`]};
}
export function applyLearning(analysis:Analysis,r:Pick<Requirement,'role'|'location'|'budget'|'durationMonths'|'headcount'|'deadline'|'remoteAllowed'>,outcomes:Outcome[]){
 const limit=r.budget*100000*r.durationMonths/12*r.headcount;
 let changed=false;
 const relocationCity=[...analysis.locations].filter(l=>r.remoteAllowed||l.city!=='Remote').sort((a,b)=>b.score-a.score)[0]?.city??r.location;
 for(const s of analysis.ranking){const learned=learningSummary(outcomes,r.role,s.strategy==='RELOCATE'?relocationCity:r.location,s.strategy,r);if(!learned.active)continue;changed=true;
  const original={cost:s.cost,days:s.days,score:s.score};
  s.cost=Math.round(s.cost*Math.max(.5,Math.min(2,learned.costRatio??1)));s.days=Math.ceil(s.days*Math.max(.5,Math.min(2,learned.dayRatio??1)));
  const observedQuality=((learned.successRate??.5)+(learned.retentionRate??.5)+(learned.onTimeRate??.5))/3;
  const adjustment=Math.max(-5,Math.min(5,(observedQuality-.5)*10));s.score=Math.max(0,Math.min(100,s.score+adjustment));
  s.viable=s.coverage>=r.headcount&&s.cost<=limit&&s.days<=r.deadline;
  s.caveat+=` Outcome calibration: ${learned.samples} comparable decisions; original forecast ₹${original.cost}, ${original.days} days, score ${original.score}. Cost/time factors capped at 0.5–2; score adjustment capped at ±5. Observational, not causal evidence.`;
  s.evidence.push('Recorded decision outcomes');
 }
 const hybrid=calibrateScenario(analysis.hybrid,r.role,outcomes);changed ||= !!hybrid.calibration;analysis.hybrid=hybrid;
 if(!changed)return analysis;
 analysis.ranking.sort((a,b)=>b.score-a.score);
 const top=analysis.ranking.find(s=>s.viable)??analysis.ranking[0];
 analysis.recommendation=hybrid.buildCount>0&&hybrid.buildCount<r.headcount&&hybrid.feasible&&(!top.viable||hybrid.score>=top.score)?'BUILD + BORROW':top.strategy;
 analysis.explanation[0]=`${analysis.recommendation} is the highest-ranked ${top.viable||hybrid.feasible?'feasible option':'comparison (no feasible allocation)'} after bounded outcome calibration. Cohorts match role, city, strategy, headcount and planning horizon. Historical observations do not establish causation.`;
 return analysis;
}
