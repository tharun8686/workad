import {applyLearning,calibrateScenario} from '@/lib/intelligence';
import {outcomes} from './intelligence';
import {normalizeRole} from './occupations';
import {aiAvailable} from './ai-provider';

import { randomUUID } from 'node:crypto';

import { transaction, sandboxEnabled, type Query } from './db';

import { AppError, type Actor } from './auth';

import { stageNames } from '@/lib/catalogue';

import { analyze, defaultWeights, normalizeInput, scenario, scenarioDefaults } from '@/lib/engine';

import type { Action, Decision, Person, Requirement, RequirementInput, ScenarioInput, Skill, Weights, Workspace, Allocation } from '@/lib/types';

const json=(v:unknown)=>JSON.stringify(v);

async function payloads<T>(q:Query,sql:string,params:unknown[]=[]){return (await q<{payload:T}>(sql,params)).rows.map(x=>x.payload);}

export async function catalogue(q:Query,requirementId?:string){
 const rows=(await q<{payload:Person;requirement_id:string|null}>("SELECT t.payload,rr.requirement_id FROM talent_records t LEFT JOIN resource_reservations rr ON rr.person_id=t.id WHERE t.owner_id=current_setting('app.user_id',true)")).rows;
 const skills=(await q<{id:string;payload:Skill}>('SELECT id, payload FROM skills ORDER BY name')).rows.map(r=>({...r.payload,id:r.id}));
 const overrides=(await q<{details:{skillId:string;aliases:string[];trainingDays:number|null;trainingCost:number|null;trainingEvidence:string}}>("SELECT DISTINCT ON (details->>'skillId') details FROM integration_runs WHERE owner_id=current_setting('app.user_id',true) AND provider='Skill governance' ORDER BY details->>'skillId',created_at DESC,id DESC")).rows;
 for(const {details} of overrides){const skill=skills.find(s=>s.id===details.skillId);if(skill)Object.assign(skill,{aliases:details.aliases,trainingDays:details.trainingDays,trainingCost:details.trainingCost,trainingEvidence:details.trainingEvidence});}
 const names=new Map<string,string>();for(const skill of skills)for(const name of [skill.name,...skill.aliases])names.set(name.trim().toLowerCase(),skill.name);
 const people=rows.map(({payload,requirement_id})=>{const normalized:Record<string,number>={};for(const [name,value] of Object.entries(payload.skills)){const canonical=names.get(name.trim().toLowerCase())??name.trim();normalized[canonical]=Math.max(normalized[canonical]??0,value);}return {...payload,skills:normalized,reservedFor:requirement_id&&requirement_id!==requirementId?requirement_id:undefined};});
 return {people,skills};
}

async function insertRequirement(q:Query,ownerId:string,input:RequirementInput,id?:string){

  const {people,skills}=await catalogue(q);const roleMapping=await normalizeRole(input.role);const normalized=normalizeInput({...input,role:roleMapping.normalized},skills);const analysis=applyLearning(analyze(normalized,people,defaultWeights,skills),normalized,await outcomes(q));analysis.normalization.unshift(roleMapping);const createdAt=new Date().toISOString();

  const requirement:Requirement={...normalized,id:id??`REQ-${randomUUID().slice(0,8).toUpperCase()}`,ownerId,createdAt,status:'Awaiting review',analysis,weights:structuredClone(defaultWeights),stages:stageNames.map((name,i)=>({name,state:i<12?'Completed':'Waiting',note:i===6?'Market source availability checked; verified role/city values unavailable.':i===3?'Structured input validated; deterministic profile.':i<12?'Computed and persisted.':'Awaiting human workflow.'}))};

  await q('INSERT INTO requirements(id,owner_id,role,headcount,budget,deadline,status,payload,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[requirement.id,ownerId,requirement.role,requirement.headcount,requirement.budget,requirement.deadline,requirement.status,json(requirement),createdAt]);

  for(const [name,weight] of Object.entries(normalized.skillWeights)){const skill=skills.find(s=>s.name===name);await q('INSERT INTO requirement_skills(requirement_id,skill_id,raw_name,importance,mandatory) VALUES($1,$2,$3,$4,true)',[requirement.id,skill?.id??null,name,weight]);if(!skill)await q('INSERT INTO normalization_reviews(id,owner_id,input) VALUES($1,$2,$3) ON CONFLICT(owner_id,input) DO NOTHING',[randomUUID(),ownerId,name]);}

  await saveScores(q,requirement);return requirement;

}

async function saveScores(q:Query,r:Requirement){for(const s of r.analysis.ranking)await q('INSERT INTO strategy_scores(requirement_id,strategy,score,breakdown_json,weights_json) VALUES($1,$2,$3,$4,$5) ON CONFLICT(requirement_id,strategy) DO UPDATE SET score=EXCLUDED.score,breakdown_json=EXCLUDED.breakdown_json,weights_json=EXCLUDED.weights_json',[r.id,s.strategy,s.score,json(s.criteria),json(s.weights)]);}

async function saveRequirement(q:Query,r:Requirement){await q('UPDATE requirements SET status=$1,payload=$2,updated_at=now() WHERE id=$3',[r.status,json(r),r.id]);}

export async function owned(q:Query,id:string,ownerId:string,lock=false){const rows=await payloads<Requirement>(q,`SELECT payload FROM requirements WHERE id=$1 AND owner_id=$2${lock?' FOR UPDATE':''}`,[id,ownerId]);if(!rows[0])throw new AppError(404,'Requirement not found.');return rows[0];}

export async function workspace(a:Actor):Promise<Workspace>{return transaction(a.id,async q=>{

  const {people,skills}=await catalogue(q);

  return {requirements:await payloads<Requirement>(q,'SELECT payload FROM requirements WHERE owner_id=$1 ORDER BY created_at DESC',[a.id]),decisions:await payloads<Decision>(q,'SELECT d.payload FROM decisions d JOIN requirements r ON r.id=d.requirement_id WHERE r.owner_id=$1 ORDER BY d.created_at DESC',[a.id]),actions:await payloads<Action>(q,'SELECT a.payload FROM actions a JOIN requirements r ON r.id=a.requirement_id WHERE r.owner_id=$1 ORDER BY a.created_at DESC,a.id ASC',[a.id]),scenarios:await payloads<Workspace['scenarios'][number]>(q,'SELECT s.payload FROM scenarios s JOIN requirements r ON r.id=s.requirement_id WHERE r.owner_id=$1 ORDER BY s.created_at',[a.id]),people,skills,sources:await payloads(q,'SELECT payload FROM data_sources'),reviews:(await q<{id:string;input:string;status:string;resolvedTo?:string}>('SELECT id,input,status,resolved_to AS "resolvedTo" FROM normalization_reviews WHERE owner_id=$1',[a.id])).rows,mode:sandboxEnabled()?'Local sandbox':'Connected',actor:{name:a.name,role:a.role},aiAvailable:aiAvailable()};

});}

export async function createRequirement(a:Actor,input:RequirementInput){return transaction(a.id,q=>insertRequirement(q,a.id,input));}

export async function updateWeights(a:Actor,id:string,weights:Weights){return transaction(a.id,async q=>{const r=await owned(q,id,a.id,true);if(r.status!=='Awaiting review')throw new AppError(409,'Approved or rejected decisions cannot be recalculated. Create a new requirement.');const c=await catalogue(q);const roleEvidence=r.analysis.normalization.filter(n=>n.method.includes('O*NET'));r.analysis=applyLearning(analyze(r,c.people,weights,c.skills),r,await outcomes(q));r.analysis.normalization.unshift(...roleEvidence);r.weights=weights;await saveScores(q,r);await saveRequirement(q,r);return r;});}

export async function runScenario(a:Actor,id:string,input:ScenarioInput,save:boolean){return transaction(a.id,async q=>{const r=await owned(q,id,a.id);const c=await catalogue(q,id);const result={...calibrateScenario(scenario(r,input,c.people,c.skills),r.role,await outcomes(q)),id:randomUUID(),requirementId:id};if(save)await q('INSERT INTO scenarios(id,requirement_id,name,inputs_json,cost,time_days,risk,payload) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[result.id,id,result.name,json(input),result.cost,result.days,result.risk,json(result)]);return result;});}

const actionTitles={BUILD:'Enrol employees in an upskilling plan',BUY:'Open a recruitment requisition',BORROW:'Create a contractor engagement',AUTOMATE:'Start an automation feasibility initiative',RELOCATE:'Create a location and remote-work plan'};

export async function decide(a:Actor,id:string,outcome:Decision['outcome'],selected:Allocation,comment:string,authorizeSourcing=false){return transaction(a.id,async q=>{

  const r=await owned(q,id,a.id,true);if(r.status!=='Awaiting review')throw new AppError(409,'This requirement already has a final decision.');

  const original=r.analysis.recommendation;
  // Serialize approvals against the same owner roster. Sorted row locks avoid deadlocks.
  await q('SELECT id FROM talent_records WHERE owner_id=$1 ORDER BY id FOR UPDATE',[a.id]);
  const c=await catalogue(q);const roleEvidence=r.analysis.normalization.filter(n=>n.method.includes('O*NET'));r.analysis=applyLearning(analyze(r,c.people,r.weights,c.skills),r,await outcomes(q));r.analysis.normalization.unshift(...roleEvidence);
  const input={...scenarioDefaults(r,selected),buildCount:r.analysis.hybrid.buildCount};if(selected==='RELOCATE')input.location=[...r.analysis.locations].filter(l=>r.remoteAllowed||l.city!=='Remote').sort((x,y)=>y.score-x.score)[0].city;

  const snapshot=calibrateScenario(scenario(r,input,c.people,c.skills),r.role,await outcomes(q));
  const sourcingOnly=outcome!=='Rejected'&&!snapshot.feasible&&authorizeSourcing&&['BUY','RELOCATE'].includes(selected)&&comment.trim().length>=40;
  if(outcome!=='Rejected'&&!snapshot.feasible&&!sourcingOnly)throw new AppError(422,'This allocation cannot meet all constraints. Revise it, or explicitly authorize an external sourcing investigation with a detailed risk rationale.');
  if(sourcingOnly)snapshot.notes.push('Human authorization to investigate sourcing only. Capacity, cost and delivery remain unverified; this does not authorize an offer or promise fulfillment.');

  const decision:Decision={sourcingOnly,id:randomUUID(),requirementId:id,actor:a.name,outcome,selected,original,comment,createdAt:new Date().toISOString(),weights:structuredClone(r.weights),snapshot};

  await q('INSERT INTO decisions(id,requirement_id,decided_by,decision,comment,payload) VALUES($1,$2,$3,$4,$5,$6)',[decision.id,id,a.id,outcome,comment,json(decision)]);

  await q('INSERT INTO decision_audit(id,requirement_id,decision_id,actor,event) VALUES($1,$2,$3,$4,$5)',[randomUUID(),id,decision.id,a.id,json(decision)]);

  r.status=outcome==='Rejected'?'Rejected':'Approved';r.stages[12]={...r.stages[12],state:'Completed',note:outcome+' by '+a.name};

  if(outcome!=='Rejected')for(const strategy of selected==='BUILD + BORROW'?['BUILD','BORROW'] as const:[selected]){

    const records=strategy==='BUILD'?r.analysis.internal.filter(p=>p.suitable).slice(0,selected==='BUILD + BORROW'?input.buildCount:r.headcount):strategy==='BORROW'?r.analysis.contractors.filter(p=>p.suitable).slice(0,selected==='BUILD + BORROW'?r.headcount-input.buildCount:r.headcount):[];

    for(const person of records)await q('INSERT INTO resource_reservations(person_id,requirement_id) VALUES($1,$2)',[person.id,id]);
    const action:Action={id:randomUUID(),requirementId:id,decisionId:decision.id,strategy,title:actionTitles[strategy],owner:a.name,status:'Pending',createdAt:new Date().toISOString(),history:[{status:'Pending',at:new Date().toISOString(),actor:a.name,note:'Created from approved decision.'}],details:{headcount:strategy==='BUILD'?records.length:strategy==='BORROW'?records.length:r.headcount,personIds:records.map(p=>p.id),missingSkills:records.flatMap(p=>p.missing),location:input.location,source:'Approved internal work item',sourcingOnly}};

    await q('INSERT INTO actions(id,requirement_id,decision_id,strategy,type,status,owner_name,payload) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[action.id,id,decision.id,strategy,action.title,action.status,action.owner,json(action)]);

    await q('INSERT INTO action_history(id,action_id,actor,status,note) VALUES($1,$2,$3,$4,$5)',[randomUUID(),action.id,a.id,'Pending','Created from approved decision.']);

  }

  r.stages[13]={...r.stages[13],state:'Waiting',note:outcome==='Rejected'?'No execution; recommendation rejected.':'Actions created; execution pending.'};await saveRequirement(q,r);return decision;

});}

export async function advanceAction(a:Actor,id:string,status:Action['status'],note:string,owner?:string){return transaction(a.id,async q=>{

  const rows=await payloads<Action>(q,'SELECT a.payload FROM actions a JOIN requirements r ON r.id=a.requirement_id WHERE a.id=$1 AND r.owner_id=$2 FOR UPDATE OF a',[id,a.id]);const action=rows[0];if(!action)throw new AppError(404,'Action not found.');

  const transitions:Record<Action['status'],Action['status'][]>= {'Pending':['In Progress','Cancelled'],'In Progress':['Completed','Failed','Cancelled'],'Failed':['In Progress','Cancelled'],'Completed':[],'Cancelled':[]};

  if(!transitions[action.status].includes(status))throw new AppError(409,'This action status transition is not permitted.');

  if(owner)action.owner=owner;action.status=status;const event={status,at:new Date().toISOString(),actor:a.name,note};action.history.push(event);

  if(status==='Completed'&&note.trim().length<20)throw new AppError(422,'Include a completion evidence reference and outcome (at least 20 characters).');

  await q('UPDATE actions SET status=$1,owner_name=$2,payload=$3 WHERE id=$4',[status,action.owner,json(action),id]);await q('INSERT INTO action_history(id,action_id,actor,status,note) VALUES($1,$2,$3,$4,$5)',[randomUUID(),id,a.id,status,note]);

  const r=await owned(q,action.requirementId,a.id);const states=(await q<{status:string}>('SELECT status FROM actions WHERE requirement_id=$1',[r.id])).rows;const allCompleted=states.every(s=>s.status==='Completed');r.stages[13]={...r.stages[13],state:allCompleted?'Completed':states.some(s=>s.status==='Failed')?'Failed':'Processing',note:allCompleted?'All work items marked completed by their accountable owners.':'Execution states are recorded in the action tracker.'};await saveRequirement(q,r);return action;

});}

export async function updateSkill(a:Actor,id:string,aliases:string[],reviewId?:string,training?:{days:number|null;cost:number|null;evidence:string}){return transaction(a.id,async q=>{

  const c=await catalogue(q);const skill=c.skills.find(s=>s.id===id);if(!skill)throw new AppError(404,'Skill not found.');

  if(aliases.some(alias=>c.skills.some(s=>s.id!==id&&[s.name,...s.aliases].some(v=>v.toLowerCase()===alias.toLowerCase()))))throw new AppError(409,'An alias already belongs to another skill.');

  skill.aliases=[...new Set(aliases)];
  if(training){skill.trainingDays=training.days;skill.trainingCost=training.cost;skill.trainingEvidence=training.evidence;}
  await q('INSERT INTO integration_runs(id,owner_id,provider,status,details) VALUES($1,$2,$3,$4,$5)',[randomUUID(),a.id,'Skill governance','Recorded',json({skillId:id,aliases:skill.aliases,trainingDays:skill.trainingDays,trainingCost:skill.trainingCost,trainingEvidence:skill.trainingEvidence??'',actor:a.name})]);

  if(reviewId)await q("UPDATE normalization_reviews SET status='Resolved',resolved_to=$1 WHERE id=$2 AND owner_id=$3",[skill.name,reviewId,a.id]);return skill;

});}




export async function releaseReservation(a:Actor,personId:string,note:string){return transaction(a.id,async q=>{
 // Use the same lock order as approval (roster before reservation changes).
 const person=(await q('SELECT id FROM talent_records WHERE id=$1 AND owner_id=$2 FOR UPDATE',[personId,a.id])).rows[0];
 if(!person)throw new AppError(404,'Person not found.');
 const reservation=(await q<{requirement_id:string}>('SELECT requirement_id FROM resource_reservations WHERE person_id=$1',[personId])).rows[0];
 if(!reservation)throw new AppError(409,'This reservation has already been released.');
 const actions=await payloads<Action>(q,'SELECT payload FROM actions WHERE requirement_id=$1 FOR UPDATE',[reservation.requirement_id]);
 const related=actions.filter(x=>Array.isArray(x.details.personIds)&&x.details.personIds.includes(personId));
 if(related.some(x=>!['Completed','Cancelled'].includes(x.status)))throw new AppError(409,'Complete or cancel the associated work item before releasing this person.');
 if(!related.length)throw new AppError(409,'Reservation has no traceable work item; an administrator must investigate.');
 for(const action of related){action.history.push({status:action.status,at:new Date().toISOString(),actor:a.name,note:'Capacity released: '+note});await q('UPDATE actions SET payload=$1 WHERE id=$2',[json(action),action.id]);await q('INSERT INTO action_history(id,action_id,actor,status,note) VALUES($1,$2,$3,$4,$5)',[randomUUID(),action.id,a.id,action.status,'Capacity released: '+note]);}
 await q('DELETE FROM resource_reservations WHERE person_id=$1',[personId]);return {released:true};
});}
