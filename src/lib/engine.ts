import type { Analysis, Match, Person, RequirementInput, ScenarioInput, ScenarioResult, Skill, Strategy, StrategyResult, Weights } from './types';
import { locations, skills as defaultSkills } from './catalogue';
export const defaultWeights: Weights = {
  BUILD: { 'Skill match':.30,Availability:.20,'Training time':.20,Performance:.15,'Cost saving':.15 },
  BUY: { 'Skill match':.30,Cost:.20,Time:.20,Availability:.15,Retention:.15 },
  BORROW: { 'Skill match':.35,Availability:.25,Cost:.20,Performance:.20 },
  AUTOMATE: { 'Task suitability':.35,Cost:.20,Time:.20,'Business impact':.15,'Delivery safety':.10 },
  RELOCATE: { 'Skill match':.30,Cost:.25,Time:.20,Availability:.15,'Remote suitability':.10 }
};
export const clamp = (n:number) => Math.max(0,Math.min(100,n));
const round=(n:number)=>Math.round(n*100)/100;
const average=(a:number[])=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
export function weightedScore(criteria:Record<string,number>,weights:Record<string,number>):number {
  if(Math.abs(Object.values(weights).reduce((a,b)=>a+b,0)-1)>1e-6 || Object.values(weights).some(v=>!Number.isFinite(v)||v<0)) throw new Error('Weights must be non-negative and total 1.');
  if(Object.keys(weights).some(k=>!Number.isFinite(criteria[k]))) throw new Error('Missing criterion evidence.');
  return round(Object.entries(weights).reduce((sum,[k,v])=>sum+clamp(criteria[k])*v,0));
}
export function normalizeSkill(value:string,catalogue=defaultSkills) {
  const input=value.trim(); const found=catalogue.find(s=>[s.name,...s.aliases].some(a=>a.toLowerCase()===input.toLowerCase()));
  return {input,normalized:found?.name??input,confidence:found?100:0,method:found?'Dictionary':'Review required; semantic services unavailable'};
}
export function normalizeInput(input:RequirementInput,catalogue=defaultSkills) {
  const weights:Record<string,number>={}; input.mandatorySkills.forEach(s=>{const n=normalizeSkill(s,catalogue).normalized;weights[n]=(weights[n]??0)+input.skillWeights[s];});
  return {...input,role:input.role.trim(),location:input.location.toLowerCase()==='bangalore'?'Bengaluru':input.location,mandatorySkills:Object.keys(weights),optionalSkills:[...new Set(input.optionalSkills.map(s=>normalizeSkill(s,catalogue).normalized))],skillWeights:weights};
}
export function matchPerson(p:Person,r:RequirementInput,catalogue=defaultSkills):Match {
  const skillMatch=round(r.mandatorySkills.reduce((sum,s)=>sum+(p.skills[s]??0)*(r.skillWeights[s]??0)/100,0));
  const missing=r.mandatorySkills.filter(s=>(p.skills[s]??0)<65);
  const trainingKnown=missing.every(s=>{const skill=catalogue.find(x=>x.name===s);return skill?.trainingDays!=null&&skill?.trainingCost!=null;});
  const trainingDays=missing.reduce((sum,s)=>sum+(catalogue.find(x=>x.name===s)?.trainingDays??0),0);
  const trainingCost=missing.reduce((sum,s)=>sum+(catalogue.find(x=>x.name===s)?.trainingCost??0),0);
  const experience=p.experience<r.experienceMin?clamp(100-(r.experienceMin-p.experience)*25):p.experience>r.experienceMax?clamp(100-(p.experience-r.experienceMax)*5):100;
  const availability=clamp(100-(p.availability/r.deadline)*40); const location=(p.location===r.location||r.remoteAllowed)?100:50;
  const salary=clamp(r.budget/p.salary*100);
  const breakdown:Record<string,number>=p.kind==='employee'?{'Skill match':skillMatch,Experience:experience,Performance:p.performance,Learning:p.learning,Availability:availability,Promotion:p.promotionEligible?100:50}:p.kind==='contractor'?{'Skill match':skillMatch,Availability:availability,Performance:p.performance,'Rate fit':clamp(r.budget*100000/12/(p.rate*160)*100)}:{'Skill match':skillMatch,Experience:experience,Location:location,'Salary fit':salary,Availability:availability};
  const weights:Record<string,number>=p.kind==='employee'?{'Skill match':.55,Experience:.15,Performance:.1,Learning:.05,Availability:.1,Promotion:.05}:p.kind==='contractor'?{'Skill match':.5,Availability:.2,Performance:.15,'Rate fit':.15}:{'Skill match':.5,Experience:.15,Location:.1,'Salary fit':.15,Availability:.1};
  const readyDays=p.availability+(p.kind==='employee'?trainingDays:0);
  return {...p,match:weightedScore(breakdown,weights),breakdown,skillMatch,missing,trainingDays,trainingCost,trainingKnown,readyDays,suitable:!p.reservedFor&&(p.kind!=='employee'||trainingKnown)&&skillMatch>=60&&readyDays<=r.deadline&&experience>=75&&(r.remoteAllowed||p.location===r.location)};
}
export function rankPeople(people:Person[],r:RequirementInput,catalogue=defaultSkills) { return people.map(p=>matchPerson(p,r,catalogue)).sort((a,b)=>b.match-a.match||a.id.localeCompare(b.id)); }
export function scenario(r:RequirementInput,s:ScenarioInput,people:Person[],catalogue=defaultSkills):ScenarioResult {
  const req={...r,...s}; const ranked=rankPeople(people,req,catalogue);
  const internal=ranked.filter(p=>p.kind==='employee'&&p.suitable);
  const contractors=ranked.filter(p=>p.kind==='contractor'&&p.suitable);
  const candidates=ranked.filter(p=>p.kind==='candidate'&&p.suitable&&p.skillMatch>=60&&(r.remoteAllowed||p.location===s.location));
  const horizon=s.durationMonths; const budget=s.budget*100000*(horizon/12)*s.headcount;
  const salary=average(candidates.slice(0,s.headcount).map(p=>p.salary))||s.budget;
  // Explicit planning convention: recruiting fee is 8% of annual salary. Source salaries come from authorized imports.
  const buyUnit=salary*100000*(horizon/12+.08); const buyDays=Math.max(35,...candidates.slice(0,s.headcount).map(p=>p.availability+14));
  let cost=0,days=0,coverage=0,risk=0,quality=0;const notes=['Forecast using imported observations and disclosed planning assumptions; not a quote or guaranteed outcome.'];
  if(s.strategy==='BUILD'||s.strategy==='BORROW'||s.strategy==='BUILD + BORROW') {
    const buildN=s.strategy==='BUILD'?s.headcount:s.strategy==='BORROW'?0:s.buildCount;
    const borrowN=s.headcount-buildN; const build=internal.slice(0,buildN),borrow=contractors.slice(0,borrowN);
    coverage=build.length+borrow.length;
    cost=build.reduce((sum,p)=>sum+p.salary*100000*horizon/12+p.trainingCost,0)+borrow.reduce((sum,p)=>sum+p.rate*160*horizon,0);
    days=Math.max(0,...build.map(p=>p.readyDays),...borrow.map(p=>p.readyDays));
    quality=average([...build,...borrow].map(p=>p.skillMatch));risk=clamp(100-quality+borrow.length/Math.max(1,s.headcount)*15+(s.headcount-coverage)/s.headcount*60);
    notes.push(`${build.length} internal employees and ${borrow.length} contractors cover ${coverage} of ${s.headcount} positions.`, 'Internal salary is included as opportunity cost. Training is sequential; contractors use 160 hours/month.');
  } else if(s.strategy==='AUTOMATE') {
    const capacity=Math.floor(s.headcount*s.repetitivePct/100); const residual=s.headcount-capacity;
    cost=250000+capacity*75000+residual*buyUnit; days=Math.max(45,residual?buyDays:0);coverage=capacity+Math.min(residual,candidates.length);quality=60;risk=clamp(50-s.repetitivePct*.2);
    notes.push(`${capacity} FTE of assumed capacity reduction; ${residual} residual positions require external hiring.`, 'Automation assumes ₹2.5 lakh setup plus ₹75,000 per FTE; process measurements are unavailable.');
  } else {
    coverage=Math.min(s.headcount,candidates.length);cost=buyUnit*s.headcount;days=buyDays;quality=average(candidates.slice(0,s.headcount).map(p=>p.skillMatch));risk=clamp(35+(s.headcount-coverage)/s.headcount*40);
    notes.push('ATS candidate expectations supply the salary assumption; 35-day minimum hiring lead time and 8% recruiting fee are scenario assumptions.');
    if(s.strategy==='RELOCATE') {const local=ranked.filter(p=>p.kind==='candidate'&&p.suitable&&p.skillMatch>=60&&(s.location==='Remote'||p.location===s.location));coverage=Math.min(s.headcount,local.length);cost=(average(local.slice(0,s.headcount).map(p=>p.salary))||s.budget)*100000*(horizon/12+.08)*s.headcount;days=Math.max(35,...local.slice(0,s.headcount).map(p=>p.availability+14));quality=average(local.slice(0,s.headcount).map(p=>p.skillMatch));if(!r.remoteAllowed&&s.location==='Remote'){coverage=0;notes.push('Remote work is not permitted by this requirement.');}}
  }
  const feasible=coverage>=s.headcount&&days<=s.deadline&&cost<=budget;
  const score=round(.35*quality+.25*clamp(budget/Math.max(1,cost)*80)+.2*clamp(s.deadline/Math.max(1,days)*80)+.2*(100-risk));
  return {...s,cost:Math.round(cost),days,coverage,risk:round(risk),score,budgetDifference:Math.round(budget-cost),timelineDifference:s.deadline-days,feasible,notes};
}
export function scenarioDefaults(r:RequirementInput,strategy:ScenarioInput['strategy'],name:string=strategy):ScenarioInput {return {name,strategy,headcount:r.headcount,budget:r.budget,deadline:r.deadline,location:r.location,buildCount:Math.min(r.headcount,Math.ceil(r.headcount*.6)),durationMonths:r.durationMonths,repetitivePct:r.repetitivePct};}
export function analyze(r:RequirementInput,people:Person[],weights:Weights=defaultWeights,catalogue=defaultSkills):Analysis {
  const all=rankPeople(people,r,catalogue);const internal=all.filter(p=>p.kind==='employee'),contractors=all.filter(p=>p.kind==='contractor'),candidates=all.filter(p=>p.kind==='candidate');
  const build=internal.filter(p=>p.suitable).slice(0,r.headcount),borrow=contractors.filter(p=>p.suitable).slice(0,r.headcount);
  const comparison=locations.map(city=>{const s=scenario(r,{...scenarioDefaults(r,'RELOCATE'),location:city},people,catalogue);return {city,cost:s.cost,days:s.days,coverage:s.coverage,score:s.score,salary:null,costIndex:null};});
  const bestLocation=[...comparison].filter(l=>r.remoteAllowed||l.city!=='Remote').sort((a,b)=>b.score-a.score)[0];
  const ranking=(Object.keys(defaultWeights) as Strategy[]).map(strategy=>{
    const out=scenario(r,{...scenarioDefaults(r,strategy),...(strategy==='RELOCATE'?{location:bestLocation.city}:{})},people,catalogue);
    const cost=clamp(r.budget*100000*r.headcount*r.durationMonths/12/Math.max(1,out.cost)*80),time=clamp(r.deadline/Math.max(1,out.days)*80),availability=clamp(out.coverage/r.headcount*100);
    const criteria:Record<string,number>=strategy==='BUILD'?{'Skill match':average(build.map(p=>p.skillMatch)),Availability:availability,'Training time':time,Performance:average(build.map(p=>p.performance)),'Cost saving':cost}:strategy==='BUY'?{'Skill match':average(candidates.filter(p=>p.skillMatch>=60).slice(0,r.headcount).map(p=>p.skillMatch)),Cost:cost,Time:time,Availability:availability,Retention:65}:strategy==='BORROW'?{'Skill match':average(borrow.map(p=>p.skillMatch)),Availability:availability,Cost:cost,Performance:average(borrow.map(p=>p.performance))}:strategy==='AUTOMATE'?{'Task suitability':r.repetitivePct,Cost:cost,Time:time,'Business impact':r.repetitivePct,'Delivery safety':100-out.risk}:{'Skill match':average(candidates.filter(p=>p.skillMatch>=60).slice(0,r.headcount).map(p=>p.skillMatch)),Cost:cost,Time:time,Availability:availability,'Remote suitability':r.remoteAllowed?90:50};
    if(Object.keys(weights[strategy]).sort().join()!==Object.keys(defaultWeights[strategy]).sort().join())throw new Error('Unsupported criteria in strategy weights.');
    return {strategy,score:weightedScore(criteria,weights[strategy]),criteria,weights:weights[strategy],cost:out.cost,days:out.days,coverage:out.coverage,risk:out.risk,viable:out.feasible,evidence:[...new Set(people.map(p=>p.sourceId)),'Planning assumptions'],caveat:strategy==='BUY'||strategy==='RELOCATE'?'Market evidence unavailable; Imported candidate expectations and disclosed forecast assumptions only.':out.notes.join(' ')} satisfies StrategyResult;
  }).sort((a,b)=>b.score-a.score);
  const buildCount=Math.min(r.headcount,build.length);const hybrid=scenario(r,{...scenarioDefaults(r,'BUILD + BORROW'),buildCount},people,catalogue);
  const top=ranking.find(x=>x.viable)??ranking[0];
  const hybridScore=buildCount/r.headcount*ranking.find(x=>x.strategy==='BUILD')!.score+(r.headcount-buildCount)/r.headcount*ranking.find(x=>x.strategy==='BORROW')!.score;
  hybrid.score=round(hybridScore);
  const useHybrid=buildCount>0&&buildCount<r.headcount&&hybrid.feasible&&(!top.viable||hybridScore>=top.score);
  const recommendation=useHybrid?'BUILD + BORROW':top.strategy;
  // Five of eight evidence groups are present; no external benchmarks, process measurements or semantic vectors.
  const normalized=r.mandatorySkills.map(s=>normalizeSkill(s,catalogue));
  const inputQuality=normalized.filter(s=>s.confidence===100).length/Math.max(1,normalized.length);
  const separation=Math.min(1,Math.abs(ranking[0].score-ranking[1].score)/20);
  const confidence=Math.round(100*(.5*(people.length?new Set(people.map(p=>p.kind)).size/3:0)+.3*inputQuality+.2*(people.length?separation:0)));
  return {internal,contractors,candidates,ranking,recommendation,confidence,hybrid,locations:comparison,normalization:normalized,questions:['Does the work require presence in '+r.location+'?','Is permanent employment necessary for a '+r.durationMonths+'-month requirement?','Can seniority be reduced with targeted mentoring?','Which internal responsibilities would need backfilling?','Have repetitive tasks been measured before assuming automation savings?'],explanation:[top.viable||useHybrid?`${recommendation} is the highest-ranked feasible option under the configured criteria.`:`No option meets all headcount, timeline and budget constraints. ${recommendation} is the highest-scoring comparison, not an executable recommendation.`,`${build.length} internal employees and ${borrow.length} contractors meet the modeled readiness constraints.`, 'Confidence measures evidence completeness, dictionary coverage, and score separation; it is not a probability of success.','External salary, supply, competition and retention evidence remain unavailable. Retention and automation values are explicit assumptions.']};
}
