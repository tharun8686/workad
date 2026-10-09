import {analyze,scenario,scenarioDefaults} from './engine';
import {applyLearning,calibrateScenario,type Outcome} from './intelligence';
import type {Person,Requirement,Skill,Decision} from './types';

export function challengeDecision(r:Requirement,people:Person[],skills:Skill[],outcomes:Outcome[],decision?:Decision){
 const assumptions=[
  {name:'Current evidence',budget:1,delay:0,trainingDelay:0,evidence:'Confirm availability, compensation and assessed skills with their owners.'},
  {name:'Budget reduced by 15%',budget:.85,delay:0,trainingDelay:0,evidence:'Obtain the approved budget for the full planning horizon.'},
  {name:'External hires delayed by 30 days',budget:1,delay:30,trainingDelay:0,evidence:'Confirm candidate notice periods and contractor start dates.'},
  {name:'Training takes 30 extra days per missing skill',budget:1,delay:0,trainingDelay:30,evidence:'Check course completion records and a practical skill assessment.'},
 ];
 const selected=decision?.selected??r.analysis.recommendation;
 const cases=assumptions.map(a=>{
  const req={...r,budget:r.budget*a.budget};
  const roster=people.map(p=>({...p,availability:p.availability+(p.kind==='employee'?0:a.delay)}));
  const catalogue=skills.map(s=>({...s,trainingDays:s.trainingDays===null?null:s.trainingDays+a.trainingDelay}));
  const analysis=applyLearning(analyze(req,roster,r.weights,catalogue),req,outcomes);
  const input=decision?{...decision.snapshot,budget:req.budget}: {...scenarioDefaults(req,selected),buildCount:r.analysis.hybrid.buildCount};
  const plan=calibrateScenario(scenario(req,input,roster,catalogue),r.role,outcomes);
  const alternatives=[...analysis.ranking.filter(s=>s.viable).map(s=>({strategy:s.strategy,score:s.score,cost:s.cost,days:s.days})),...(analysis.hybrid.feasible?[{strategy:analysis.hybrid.strategy,score:analysis.hybrid.score,cost:analysis.hybrid.cost,days:analysis.hybrid.days}]:[])].sort((x,y)=>y.score-x.score);
  return {name:a.name,evidence:a.evidence,plan,alternative:alternatives[0]??null,reasons:[...(plan.coverage<plan.headcount?[`Capacity shortfall: ${plan.headcount-plan.coverage} position(s).`]:[]),...(plan.budgetDifference<0?[`Budget shortfall: INR ${Math.abs(plan.budgetDifference)}.`]:[]),...(plan.timelineDifference<0?[`Readiness is ${Math.abs(plan.timelineDifference)} days beyond the deadline.`]:[])]};
 });
 return {requirementId:r.id,selected,approvedForecast:decision?.snapshot??null,cases,notice:'Deterministic stress tests using current assessed evidence and explicit assumptions. Alternatives are comparisons for human review. Saved approvals and employee records are unchanged.'};
}
export type ChallengeReport=ReturnType<typeof challengeDecision>;
