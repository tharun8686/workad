import {importRecords} from '../src/server/imports';
import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {workspace,createRequirement,runScenario,decide,advanceAction,owned,updateWeights} from '../src/server/repository';
import {transaction,applyAccessPolicies} from '../src/server/db';
import {actor,verifyOrigin,requireRole} from '../src/server/auth';
import {makePeople,skills,defaultInput} from './fixtures/catalogue';
import {defaultWeights,scenarioDefaults} from '../src/lib/engine';
Object.assign(process.env,{LOCAL_SANDBOX:'1',LOCAL_DATABASE_PATH:'memory://',NODE_ENV:'test'});delete process.env.DATABASE_URL;
const a={id:'local-test-owner',name:'Local test workspace',role:'admin' as const};
test('database workflow persists analysis, scenario, approval, execution and immutable audit',{timeout:90000},async()=>{
  const initial=await workspace(a);assert.equal(initial.people.length,0);
  await importRecords(a,{source:'Synthetic workflow test',authority:'Synthetic test records only',observedAt:new Date().toISOString(),confirm:true,records:makePeople().map(p=>({...p,externalId:p.id}))});
  await transaction(a.id,async q=>{for(const skill of skills)await q('INSERT INTO skills(id,name,normalized_name,category,payload) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING',[skill.id,skill.name,skill.name.toLowerCase(),skill.category,JSON.stringify(skill)]);});
  assert.equal((await workspace(a)).people.length,250);
  const r=await createRequirement(a,{...defaultInput,role:'Integration test Backend Engineer'});const saved=await runScenario(a,r.id,{...scenarioDefaults(r,'BUILD + BORROW'),buildCount:3},true);assert.equal(saved.coverage,5);
  const decision=await decide(a,r.id,'Approved','BUILD + BORROW','Reviewed evidence and simulator constraints.');const state=await workspace(a);assert.equal(state.decisions.find(d=>d.id===decision.id)?.selected,'BUILD + BORROW');const actions=state.actions.filter(x=>x.requirementId===r.id);assert.equal(actions.length,2);
  await assert.rejects(()=>decide(a,r.id,'Approved','BUILD + BORROW','Duplicate approval must fail.'));
  await assert.rejects(()=>updateWeights(a,r.id,defaultWeights));
  await assert.rejects(()=>advanceAction(a,actions[0].id,'Completed','Cannot skip start.'));
  for(const action of actions){await advanceAction(a,action.id,'In Progress','Executing simulator plan.');await advanceAction(a,action.id,'Completed','Simulator execution complete.');}
  const end=await workspace(a);assert.ok(end.actions.filter(x=>x.requirementId===r.id).every(x=>x.status==='Completed'));assert.equal(end.requirements.find(x=>x.id===r.id)?.stages[13].state,'Completed');
  await assert.rejects(()=>transaction(a.id,q=>q('UPDATE decisions SET comment=$1 WHERE id=$2',['altered',decision.id])));
  await assert.rejects(()=>transaction(a.id,q=>q('DELETE FROM decision_audit WHERE decision_id=$1',[decision.id])));
  const records=await transaction(a.id,q=>q('SELECT id FROM simulator_executions WHERE action_id = ANY($1)',[actions.map(x=>x.id)]));assert.equal(records.rows.length,0);
  const enrolments=await transaction(a.id,q=>q<{progress:number}>('SELECT progress FROM learning_records WHERE action_id=$1',[actions.find(x=>x.strategy==='BUILD')!.id]));assert.equal(enrolments.rows.length,0);
  await assert.rejects(()=>transaction('other-owner',q=>owned(q,r.id,'other-owner')));
  const rejected=await createRequirement(a,defaultInput);await decide(a,rejected.id,'Rejected','BUY','Deadline cannot be met with verified evidence.');const rejectedState=await workspace(a);assert.equal(rejectedState.actions.filter(x=>x.requirementId===rejected.id).length,0);
  await applyAccessPolicies();
  const visible=await transaction(a.id,async q=>{await q('SET LOCAL ROLE workforce_runtime');await q("SELECT set_config('app.user_id',$1,true)",[a.id]);return q('SELECT id FROM requirements WHERE id=$1',[r.id]);});assert.equal(visible.rows.length,1);
  const hidden=await transaction('another-user',async q=>{await q('SET LOCAL ROLE workforce_runtime');await q("SELECT set_config('app.user_id',$1,true)",['another-user']);return q('SELECT id FROM requirements WHERE id=$1',[r.id]);});assert.equal(hidden.rows.length,0);
  const hiddenActions=await transaction('another-user',async q=>{await q('SET LOCAL ROLE workforce_runtime');await q("SELECT set_config('app.user_id',$1,true)",['another-user']);return q('SELECT id FROM actions WHERE requirement_id=$1',[r.id]);});assert.equal(hiddenActions.rows.length,0);
});
test('origin and reviewer authorization reject untrusted mutation attempts',()=>{assert.throws(()=>verifyOrigin(new NextRequest('http://127.0.0.1:3000/api/decisions/x',{headers:{origin:'https://untrusted.example'}})));assert.throws(()=>verifyOrigin(new NextRequest('http://127.0.0.1:3000/api/decisions/x')));assert.throws(()=>requireRole({id:'planner',name:'Planner',role:'planner'},['reviewer','admin']));});
test('sandbox is inaccessible on a remote host',async()=>{await assert.rejects(()=>actor(new NextRequest('https://public.example/api/workspace')));});

after(async()=>{const local=(globalThis as unknown as {advisoryLocal?:Promise<{close:()=>Promise<void>}>}).advisoryLocal;if(local)await(await local).close();});
