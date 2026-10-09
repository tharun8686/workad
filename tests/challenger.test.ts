import {test} from 'node:test';
import assert from 'node:assert/strict';
import {challengeDecision} from '../src/lib/challenger';
import {analyze,defaultWeights} from '../src/lib/engine';
import {defaultInput,makePeople,skills} from './fixtures/catalogue';
import type {Requirement} from '../src/lib/types';
test('challenger recomputes delayed training and budget sensitivity without changing source evidence',()=>{
 const people=makePeople(),analysis=analyze(defaultInput,people,defaultWeights,skills);
 const r:Requirement={...defaultInput,id:'r',ownerId:'owner',createdAt:new Date().toISOString(),status:'Awaiting review',analysis,weights:defaultWeights,stages:[]};
 const before=JSON.stringify({r,people,skills});
 const report=challengeDecision(r,people,skills,[]);
 assert.equal(report.cases[0].plan.feasible,true);
 assert.equal(report.cases[1].plan.budget,defaultInput.budget*.85);
 assert.equal(report.cases[3].plan.feasible,false);
 assert.ok(report.cases[3].reasons.length>0);
 assert.equal(JSON.stringify({r,people,skills}),before);
 const empty=challengeDecision(r,[],[],[]);
 assert.ok(empty.cases.every(c=>!c.plan.feasible&&c.alternative===null));
});
