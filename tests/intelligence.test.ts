import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkResume,comparePay,learningSummary,applyLearning,calibrateScenario,outcomeSchema,type Outcome,type PayPolicy} from '../src/lib/intelligence';
import {analyze,scenario,scenarioDefaults} from '../src/lib/engine';
import {defaultInput} from './fixtures/catalogue';

const policy:PayPolicy={id:'band',createdAt:'2026-01-01',observedAt:'2026-01-01',company:'Example',role:'Data Engineer',level:'Senior',city:'Bengaluru',monthlyMin:35000,monthlyMax:45000,livingBudget:30000,source:'Approved compensation policy'};
test('same work/city gives equal offers regardless of previous salary; insufficient budget is explicit',()=>{
 const input={company:'Example',role:'Senior Data Engineer',level:'Senior' as const,city:'Bangalore',budgetMonthly:42000};
 const low=comparePay([policy],[],{...input,currentMonthly:28000}),high=comparePay([policy],[],{...input,currentMonthly:35000});
 assert.equal(low.target,40000);assert.equal(low.target,high.target);assert.equal(low.peerMedian,null);
 assert.equal(comparePay([policy],[],{...input,budgetMonthly:28000}).feasible,false);
 assert.equal(comparePay([policy],[],{...input,level:'Fresher'}).policy,null);
 assert.equal(comparePay([policy],[],{...input,company:'Other'}).policy,null);
});
test('two-year applicant for five-year job is a qualification gap, not fraud',()=>{
 const r=checkResume({experience:2,graduationYear:2024},5,new Date('2026-10-08'));
 assert.ok(r.flags.some(f=>f.code==='REQUIREMENT_GAP'));
 assert.ok(!r.flags.some(f=>f.code==='PRE_GRADUATION_WORK'));
 const prior=checkResume({experience:5,graduationYear:2024},5,new Date('2026-10-08'));
 assert.ok(prior.flags.some(f=>f.code==='PRE_GRADUATION_WORK'));
 assert.match(prior.notice,/not a fraud verdict/);
});
test('overlaps counted once and unsupported experience/future dates are flagged',()=>{
 const r=checkResume({experience:5,employment:[{employer:'A',start:'2024-01-01',end:'2026-01-01'},{employer:'B',start:'2025-01-01',end:'2026-01-01'}]},5,new Date('2026-10-08'));
 assert.ok(r.documentedYears!<2.01);assert.ok(r.flags.some(f=>f.code==='OVERLAPPING_JOBS'));assert.ok(r.flags.some(f=>f.code==='CLAIM_TIMELINE_GAP'));
 assert.ok(checkResume({experience:1,employment:[{employer:'A',start:'2027-01-01',end:null}]},0,new Date('2026-10-08')).flags.some(f=>f.code==='FUTURE_DATES'));
});
const observation=(id:string):Outcome=>({id,decisionId:id,requirementId:'r',role:defaultInput.role,city:defaultInput.location,headcount:defaultInput.headcount,durationMonths:defaultInput.durationMonths,strategy:'BUY',predictedCost:100,predictedDays:10,baseCost:100,baseDays:10,actualCost:150,actualDays:15,successful:true,retained:true,deliveredOnTime:false,courses:[],evidence:'Verified delivery and cost records',observedAt:'2026-06-01',createdAt:'2026-06-02',actor:'Reviewer'});
test('learning deduplicates follow-ups and isolates role, city, strategy and horizon',()=>{
 const rows=[observation('one'),{...observation('one'),id:'followup'},observation('two')];
 assert.equal(learningSummary(rows,defaultInput.role,defaultInput.location,'BUY').active,false);
 rows.push(observation('three'));const summary=learningSummary(rows,defaultInput.role,defaultInput.location,'BUY',defaultInput);assert.equal(summary.samples,3);assert.equal(summary.costRatio,1.5);
 assert.equal(learningSummary(rows,'Other role',defaultInput.location,'BUY').samples,0);
 assert.equal(learningSummary(rows,defaultInput.role,defaultInput.location,'BUILD').samples,0);
 assert.equal(learningSummary(rows,defaultInput.role,defaultInput.location,'BUY',{...defaultInput,headcount:999}).samples,0);
});
test('calibration changes future forecasts with caps; original analyses stay unchanged without sufficient evidence',()=>{
 const baseline=analyze(defaultInput,[]);const unlearned=structuredClone(baseline);applyLearning(unlearned,defaultInput,[observation('one')]);assert.deepEqual(unlearned,baseline);
 const rows=['one','two','three'].map(id=>({...observation(id),actualCost:100000,actualDays:10000}));const learned=applyLearning(structuredClone(baseline),defaultInput,rows);
 const before=baseline.ranking.find(s=>s.strategy==='BUY')!,after=learned.ranking.find(s=>s.strategy==='BUY')!;
 assert.equal(after.cost,before.cost*2);assert.equal(after.days,before.days*2);assert.ok(after.score-before.score<=5);
 const s=scenario(defaultInput,scenarioDefaults(defaultInput,'BUY'),[]);const adjusted=calibrateScenario(s,defaultInput.role,rows);assert.equal(adjusted.calibration?.baseCost,s.cost);assert.equal(adjusted.cost,s.cost*2);
 assert.equal(s.calibration,undefined);
});
test('outcome validation rejects future observations and negative costs',()=>{
 assert.equal(outcomeSchema.safeParse({...observation('one'),actualCost:-1}).success,false);
 assert.equal(outcomeSchema.safeParse({...observation('one'),observedAt:'2999-01-01'}).success,false);
});
