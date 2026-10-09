'use client';

import {DecisionChallenger,EvidenceImport,LmsExportImport} from './decision-challenger';
import {PublicDiscovery} from './public-discovery';

import {latestCourses,type CourseEvent} from '@/lib/course-evidence';

import {useEffect,useState,type FormEvent} from 'react';

import Link from 'next/link';

import {api,useWorkspace} from './workspace-context';

import {PageHeader,Panel,Field,Badge,Empty,money} from './common';

import {Button} from './ui/button';

import {levels,learningSummary,type Outcome,type PayPolicy,type comparePay} from '@/lib/intelligence';

import type {Person,Match} from '@/lib/types';



type Memory={courses:CourseEvent[];outcomes:Outcome[];policies:PayPolicy[]};

type Semantic={results:{id:string;payload:Person;similarity:number;eligible:boolean|null;combinedScore:number|null;assessment:Match|null;levelAligned:boolean}[];notice:string};

const today=()=>new Date().toISOString().slice(0,10);

export function Intelligence(){

 const {data}=useWorkspace();const [tab,setTab]=useState('memory'),[state,setState]=useState<Memory>({courses:[],outcomes:[],policies:[]}),[error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');

 const allowed=['admin','reviewer'].includes(data?.actor.role??'');

 async function load(){setState(await api<Memory>('intelligence'));}

 useEffect(()=>{void load().catch(e=>setError(e.message));},[]);

 async function save(path:string,body:unknown){setBusy(true);setError('');setMessage('');try{await api(path,body);await load();setMessage('Evidence saved. Future analyses will use the updated evidence.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}

 return <><PageHeader eyebrow="DECISION INTELLIGENCE" title="Workforce memory" description="Find relevant talent, compare fairly, and learn whether workforce decisions delivered."/><div className="tabs">{[['memory','Outcomes & learning'],['semantic','Semantic matching'],['pay','Fair pay & city budgets'],['challenger','Decision Challenger']].map(([id,label])=><button key={id} className={id===tab?'active':''} onClick={()=>{setTab(id);setMessage('');setError('');}}>{label}</button>)}</div>{error&&<p role="alert" className="form-error">{error}</p>}{message&&<p role="status">{message}</p>}

 {tab==='memory'&&<><div className="kpi-grid compact"><div className="kpi-card"><div>Decisions remembered</div><strong>{data?.decisions.length??0}</strong><p>Original strategy, approval and forecast preserved</p></div><div className="kpi-card"><div>Outcome reviews</div><strong>{state.outcomes.length}</strong><p>Latest review per decision counts toward learning</p></div><div className="kpi-card"><div>Review due</div><strong>{data?.decisions.filter(d=>d.outcome!=='Rejected'&&Date.now()-Date.parse(d.createdAt)>=180*86400000&&!state.outcomes.some(o=>o.decisionId===d.id&&Date.parse(o.observedAt)-Date.parse(d.createdAt)>=179*86400000)).length??0}</strong><p>180-day follow-up without a recorded review</p></div></div><Panel title="Record a decision outcome" subtitle="Cost is total INR for the approved planning horizon. Days measure time to readiness, matching the original forecast."><OutcomeForm courses={state.courses} disabled={!allowed||busy} save={v=>save('intelligence/outcomes',v)}/></Panel>

 <Panel title="Predicted vs actual" subtitle="Success, retention and on-time delivery are separate observations. These records do not establish causation."><div className="panel-body">{!state.outcomes.length&&<Empty title="No outcomes recorded">Approved decisions will appear below. Record evidence after execution to begin learning.</Empty>}{data?.decisions.map(d=>{const rows=state.outcomes.filter(o=>o.decisionId===d.id).sort((a,b)=>b.observedAt.localeCompare(a.observedAt)||b.createdAt.localeCompare(a.createdAt));const o=rows[0];const r=data.requirements.find(r=>r.id===d.requirementId);const learned=r?learningSummary(state.outcomes,r.role,d.snapshot.location,d.selected,d.snapshot):null;return <details key={d.id}><summary>{r?.role??d.requirementId} · {d.selected} · {d.outcome} · {o?'Reviewed '+o.observedAt:'Awaiting outcome'}</summary><p>Approved forecast: {money(d.snapshot.cost)} · {d.snapshot.days} days. <Link href={'/requirements/'+d.requirementId}>Open decision brief</Link></p>{o&&<><p>Actual: {money(o.actualCost)} · {o.actualDays} days. Variance: {money(o.actualCost-o.predictedCost)} · {o.actualDays-o.predictedDays} days.</p><p>Successful: {o.successful?'Yes':'No'} · Retained: {o.retained?'Yes':'No'} · On-time project: {o.deliveredOnTime?'Yes':'No'}</p><p>{o.evidence}</p>{o.courses.map((c,i)=><p key={i}>{c.provider} · {c.name} · {c.completed?'Completed':'In progress'} · {c.evidence}</p>)}</>}<p>{learned?.samples??0} comparable decisions. {learned?.active?'Calibration active for future analyses.':'Three distinct comparable decisions required before calibration.'}</p><details><summary>Review history ({rows.length})</summary>{rows.map(row=><p key={row.id}>{row.observedAt} · {row.actor} · {money(row.actualCost)} · {row.actualDays} days · {row.evidence}</p>)}</details></details>;})}</div></Panel><Panel title="How the learning loop works"><div className="panel-body"><p>Requirement → approved forecast → execution and courses → outcome review → future recommendation. Compare the same role, city, strategy, headcount and planning horizon. At least three distinct decisions are required. Cost and time factors stay between 0.5× and 2×; score changes stay within five points. Saved decisions remain immutable.</p><p>Open Decision Challenger to test budget reductions, hiring delays and unfinished training against your current evidence.</p></div></Panel></>}

 {tab==='challenger'&&<DecisionChallenger/>}
 {tab==='semantic'&&<PublicDiscovery/>}
 {tab==='pay'&&<PublicDiscovery/>}
 {tab==='memory'&&<PublicDiscovery/>}

 {tab==='memory'&&<><LmsExportImport disabled={!allowed||busy} onSaved={load}/><EvidenceImport kind="courses" disabled={!allowed||busy} onSaved={load}/><Panel title="Learning evidence received"><div className="panel-body">{state.courses.length===0?<p>No course evidence received yet.</p>:state.courses.map(c=><p key={c.id}>{c.name} · {c.provider} · {c.completed?'Completed':'In progress'} · {c.observedAt.slice(0,10)} · {c.channel} · {c.evidence}</p>)}</div></Panel></>}

 {tab==='pay'&&<EvidenceImport kind="pay-policies" disabled={!allowed||busy} onSaved={load}/>}

 {tab==='semantic'&&<SemanticPanel allowed={allowed}/>}

 {tab==='pay'&&<PayPanel policies={state.policies} disabled={!allowed||busy} save={v=>save('intelligence/pay-policies',v)}/>}

 </>;

}



function OutcomeForm({disabled,save,courses:received}:{courses:CourseEvent[];disabled:boolean;save:(v:unknown)=>Promise<void>}){

 const {data}=useWorkspace();const [decisionId,setDecisionId]=useState('');const [courses,setCourses]=useState<{name:string;provider:string;completed:boolean;evidence:string}[]>([]);

 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);await save({decisionId:f.get('decisionId'),observedAt:f.get('observedAt'),actualCost:Number(f.get('actualCost')),actualDays:Number(f.get('actualDays')),successful:f.get('successful')==='yes',retained:f.get('retained')==='yes',deliveredOnTime:f.get('deliveredOnTime')==='yes',evidence:f.get('evidence'),courses});}

 return <form className="panel-body" onSubmit={submit}><div className="form-grid"><Field label="Approved decision"><select required name="decisionId" value={decisionId} onChange={e=>setDecisionId(e.target.value)}><option value="">Select decision…</option>{data?.decisions.filter(d=>d.outcome!=='Rejected').map(d=><option key={d.id} value={d.id}>{data.requirements.find(r=>r.id===d.requirementId)?.role} · {d.selected} · {d.requirementId}</option>)}</select></Field><Field label="Observation date"><input type="date" name="observedAt" required max={today()} defaultValue={today()}/></Field><Field label="Actual total cost (INR)"><input type="number" name="actualCost" min={0} step="0.01" required/></Field><Field label="Actual time to readiness (days)"><input type="number" name="actualDays" min={0} step="0.1" required/></Field>{[['successful','Successful in the role?'],['retained','Still with the company?'],['deliveredOnTime','Project delivered on time?']].map(([name,label])=><Field key={name} label={label}><select name={name} required defaultValue=""><option value="">Select observed result…</option><option value="yes">Yes</option><option value="no">No</option></select></Field>)}</div><h3>Course evidence</h3><p>{latestCourses(received,decisionId).length} imported course records available. Records dated on or before the observation date are included automatically.</p>{courses.map((c,i)=><div className="form-grid" key={i}><Field label="Course name"><input required value={c.name} onChange={e=>setCourses(courses.map((v,n)=>n===i?{...v,name:e.target.value}:v))}/></Field><Field label="Provider"><select value={c.provider} onChange={e=>setCourses(courses.map((v,n)=>n===i?{...v,provider:e.target.value}:v))}>{['Microsoft Learn','AWS Skill Builder','Coursera','Other'].map(p=><option key={p}>{p}</option>)}</select></Field><Field label="Completion evidence"><input required minLength={5} value={c.evidence} onChange={e=>setCourses(courses.map((v,n)=>n===i?{...v,evidence:e.target.value}:v))}/></Field><label><input type="checkbox" checked={c.completed} onChange={e=>setCourses(courses.map((v,n)=>n===i?{...v,completed:e.target.checked}:v))}/>Completed</label><Button type="button" variant="secondary" onClick={()=>setCourses(courses.filter((_,n)=>n!==i))}>Remove course</Button></div>)}<Button type="button" variant="secondary" onClick={()=>setCourses([...courses,{name:'',provider:'Microsoft Learn',completed:false,evidence:''}])}>Add course</Button><Field label="Outcome evidence / review notes"><textarea required name="evidence" minLength={20} maxLength={4000} placeholder="Assessment, retention check, delivery record and cost evidence for this observation."/></Field><Button disabled={disabled}>Save outcome review</Button></form>;

}



function SemanticPanel({allowed}:{allowed:boolean}){

 const {data}=useWorkspace();const [status,setStatus]=useState<{configured:boolean;total:number;indexed:number;model:string|null;provider:string}|null>(null),[result,setResult]=useState<Semantic|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[authorized,setAuthorized]=useState(false),[message,setMessage]=useState('');

 async function load(){setStatus(await api('semantic/status'));}

 useEffect(()=>{void load().catch(e=>setError(e.message));},[]);

 async function verify(){setBusy(true);setError('');setMessage('');try{const result=await api<{dimensions:number}>('semantic/verify',{authorized});setMessage(`Connection verified with synthetic text (${result.dimensions} dimensions).`);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function index(){setBusy(true);setError('');try{const r=await api<{indexed:number}>('semantic/index',{authorized});await load();setMessage(`${r.indexed} profiles processed. Continue indexing until coverage is complete.`);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}

 async function search(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);setBusy(true);setError('');setResult(null);try{setResult(await api('semantic/search',{query:f.get('query'),requirementId:f.get('requirementId')||undefined,authorized}));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}

 return <><Panel title="Semantic vector matching" subtitle="Meaning-based retrieval with assessed skill, experience and readiness checks."><div className="panel-body"><p>{status?`${status.indexed} / ${status.total} profiles indexed · ${status.model??'Embedding model not configured'}`:'Loading index…'}</p>{status&&!status.configured&&<p>Configure your selected provider key and embedding model (Gemini uses GEMINI_API_KEY and GEMINI_EMBEDDING_MODEL) to enable vector matching. Keyword matching remains available in Talent explorer.</p>}<label className="checkbox-field"><input type="checkbox" checked={authorized} onChange={e=>setAuthorized(e.target.checked)}/>{status?.provider==='gemini'?'I am authorized to send role and skill labels and non-confidential search text to Gemini. Names, salaries and project descriptions are excluded.':'I am authorized to send role, skills, project descriptions and search text to the configured embedding provider.'}</label><Button variant="secondary" disabled={busy||!allowed||!authorized||!status?.configured} onClick={()=>void verify()}>Verify embedding connection</Button><Button disabled={busy||!allowed||!authorized||!status?.configured||status.indexed>=status.total} onClick={()=>void index()}>Index next 32 profiles</Button>{message&&<p role="status">{message}</p>}<form onSubmit={search}><Field label="Describe the expertise you need"><textarea name="query" required minLength={2} maxLength={2000} placeholder="Build reliable data pipelines and cloud warehouse transformations"/></Field><Field label="Compare against a requirement (optional)"><select name="requirementId"><option value="">Relevance search only</option>{data?.requirements.map(r=><option key={r.id} value={r.id}>{r.role} · {r.id}</option>)}</select></Field><Button disabled={busy||!authorized||!status?.configured||!status.indexed}>{busy?'Working…':'Find semantic matches'}</Button></form>{error&&<p role="alert">{error}</p>}</div></Panel>{result&&<Panel title="Matching evidence"><div className="panel-body"><p>{result.notice}</p>{!result.results.length&&<Empty title="No indexed matches"/>}{result.results.map(r=><details key={r.id}><summary>{r.payload.name} · {r.payload.role} · {(r.similarity*100).toFixed(1)}% semantic similarity {r.eligible!==null&&<Badge tone={r.eligible?'success':'warning'}>{r.eligible?'Meets modeled gates':'Review constraints'}</Badge>}</summary><p>{r.payload.location} · {r.payload.experience} years · {r.payload.kind}</p>{r.assessment&&<><p>Combined score: {r.combinedScore} · Assessed skill match: {r.assessment.skillMatch}% · Level aligned: {r.levelAligned?'Yes':'No'}</p><p>Skills to develop: {r.assessment.missing.join(', ')||'None'} · Ready in {r.assessment.readyDays} days.</p></>}<Link href={'/talent?person='+r.id}>View profile evidence</Link></details>)}</div></Panel>}</>;

}



function PayPanel({policies,disabled,save}:{policies:PayPolicy[];disabled:boolean;save:(v:unknown)=>Promise<void>}){

 const [result,setResult]=useState<ReturnType<typeof comparePay>|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);

 const common=<><Field label="Company"><input name="company" required minLength={2}/></Field><Field label="Role family"><input name="role" required minLength={2} placeholder="Data Engineer"/></Field><Field label="Level"><select name="level">{levels.map(l=><option key={l}>{l}</option>)}</select></Field><Field label="Destination city"><input name="city" required minLength={2} placeholder="Bengaluru"/></Field></>;

 async function policy(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);await save({...Object.fromEntries(f),monthlyMin:Number(f.get('monthlyMin')),monthlyMax:Number(f.get('monthlyMax')),livingBudget:Number(f.get('livingBudget'))});}

 async function compare(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);setBusy(true);setError('');setResult(null);try{setResult(await api('intelligence/pay-comparison',{...Object.fromEntries(f),budgetMonthly:Number(f.get('budgetMonthly'))}));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}

 return <><Panel title="Same work, same destination, same pay basis" subtitle="All amounts below are monthly INR. Imported annual salaries in lakh are converted before comparison."><form className="panel-body" onSubmit={compare}><div className="form-grid">{common}<Field label="Available monthly budget per position"><input name="budgetMonthly" type="number" min={1} required/></Field></div><Button disabled={busy}>Compare fair-pay band</Button>{error&&<p role="alert">{error}</p>}{result&&<div role="status"><p>{result.notice}</p>{!result.policy?<p>No evidenced company band for this role, level and city. Add one below to make a comparison.</p>:<><p>Policy band: {money(result.policy.monthlyMin)}–{money(result.policy.monthlyMax)} · City living budget: {money(result.policy.livingBudget)}.</p><p>{result.feasible?`Suggested common target: ${money(result.target!)} / month. Feasible range: ${money(result.floor!)}–${money(result.ceiling!)}.`:'Budget or pay band falls below the policy / city-budget floor. Escalate the budget or revise scope; do not lower pay because of salary history.'}</p><p>Comparable internal employees: {result.peerCount}. Median: {result.peerMedian===null?'Insufficient evidence (minimum 3)':money(result.peerMedian)}.</p><p>Evidence: {result.policy.source} · observed {result.policy.observedAt}</p></>}</div>}</form></Panel><Panel title="Record a company pay band and city budget" subtitle="Use approved compensation and dated city-cost evidence. The app does not invent market rates."><form className="panel-body" onSubmit={policy}><div className="form-grid">{common}{[['monthlyMin','Monthly band minimum'],['monthlyMax','Monthly band maximum'],['livingBudget','Monthly city living budget']].map(([name,label])=><Field key={name} label={label}><input name={name} type="number" min={name==='livingBudget'?0:1} required/></Field>)}<Field label="Evidence date"><input type="date" name="observedAt" max={today()} required/></Field></div><Field label="Evidence source and budget assumptions"><textarea name="source" required minLength={10} maxLength={1000}/></Field><Button disabled={disabled}>Save evidenced pay policy</Button></form></Panel><Panel title="Recorded policy history"><div className="panel-body">{!policies.length&&<Empty title="No company pay policies yet"/>}{policies.map(p=><p key={p.id}>{p.company} · {p.role} · {p.level} · {p.city}: {money(p.monthlyMin)}–{money(p.monthlyMax)} / month · {p.observedAt}</p>)}</div></Panel></>;

}

