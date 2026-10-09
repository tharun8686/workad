'use client';

import {useState} from 'react';

import {Download,ExternalLink,Save} from 'lucide-react';

import {useWorkspace} from './workspace-context';

import {PageHeader,Panel,Badge,DataTable,SourceNote,Field,Empty} from './common';

import {Button} from './ui/button';

import type {Source,Skill} from '@/lib/types';

function download(name:string,value:unknown){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}

export function Sources(){const{data}=useWorkspace();if(!data)return null;return <><PageHeader eyebrow="GOVERNANCE" title="Data sources & provenance" description="Inspect imported sources, official datasets, planning assumptions and missing evidence." actions={<Button variant="secondary" onClick={()=>download('workforce-source-register.json',data.sources)}><Download size={15}/>Export register</Button>}/><div className="evidence-overview"><div><strong>{data.sources.filter(s=>s.status==='Ingested').length}</strong><span>Ingested official sources</span></div><div><strong>{data.sources.filter(s=>s.type==='Reference only').length}</strong><span>Researched external references</span></div><div><strong>{data.people.length}</strong><span>Imported workforce records</span></div></div><div className="notice warning">Reference availability is not the same as usable market evidence. Review Market observations for permitted advertisement samples and the public remote-job snapshot. Advertisement demand is not available candidate supply. Workforce-wide compensation and competition remain unmeasured.</div><Panel title="Downloaded reference datasets"><div className="panel-body"><p><a href="/occupations">O*NET 31.0 role titles, alternate titles and task statements</a> — official source files with integrity manifest; occupational context, not assessed people.</p><p><a href="/learning">Microsoft Learn catalogue</a> — downloaded learning metadata and original module links.</p><p><a href="/public-jobs">Remotive public job observations</a> — real source-linked remote advertisements, publicly accessible without signup. Review the snapshot date and each geographic restriction.</p><p><a href="/market">Authorized market snapshots</a> — per-workspace API/import history and sample salary statistics.</p></div></Panel><Panel title="Source register" subtitle="Retrieval dates record source review; refresh dates apply only to available records"><DataTable rows={data.sources} search={s=>s.name+' '+s.category+' '+s.type+' '+s.status} columns={[

 {key:'name',label:'Source / dataset',value:s=>s.name,render:s=><div className="cell-detail"><strong>{s.name}</strong><small>{s.dataset}</small>{s.url&&<a className="text-link" href={s.url} target="_blank" rel="noreferrer">Source <ExternalLink size={11}/></a>}</div>},

 {key:'type',label:'Classification',value:s=>s.type,render:s=><Badge tone={s.type==='Simulated'?'warning':'neutral'}>{s.type}</Badge>},

 {key:'fields',label:'Fields supplied',render:s=>s.fields.join(', ')||'None · not ingested'},

 {key:'license',label:'Licence / reuse',render:s=>s.license},

 {key:'date',label:'Review / refresh',value:s=>s.retrieved,render:s=><div className="cell-detail"><span>{s.retrieved}</span><small>Refresh: {s.refreshed??'Never ingested'}</small></div>},

 {key:'status',label:'Availability',value:s=>s.status,render:s=>s.status}

 ]}/></Panel><Panel title="How to read the numbers"><div className="methodology-grid"><div><h3>Imported workforce evidence</h3><p>The workspace starts empty. Authorized CSV or JSON imports provide people and assessments. The Data connections page retains source, observation date, authorization and file integrity history.</p></div><div><h3>Scenario assumptions</h3><p>All scenarios disclose their horizon, recruiting fee, contractor hours and automation investment. Comparable costs include internal salary as opportunity cost.</p></div><div><h3>Unavailable external evidence</h3><p>Missing market metrics remain unavailable. References are not used as numeric evidence until a permitted dataset is reviewed and ingested.</p></div><div><h3>Decision confidence</h3><p>Confidence combines evidence completeness, normalized input coverage and score separation. It does not predict individual performance or the likelihood of success.</p></div></div></Panel></>;}

export function Taxonomy(){const{data,mutate}=useWorkspace();const[selected,setSelected]=useState<Skill|null>(null),[aliases,setAliases]=useState(''),[days,setDays]=useState(''),[cost,setCost]=useState(''),[evidence,setEvidence]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[reviewId,setReviewId]=useState(''),[busy,setBusy]=useState(false);if(!data)return null;const admin=data.actor.role==='admin';async function save(){if(!selected)return;if(!evidence.trim()&&(days!==(selected.trainingDays===null?'':String(selected.trainingDays))||cost!==(selected.trainingCost===null?'':String(selected.trainingCost)))){setError('Add evidence for the changed training estimate.');return;}setBusy(true);setError('');try{await mutate('skills/'+selected.id,{aliases:aliases.split(',').map(s=>s.trim()).filter(Boolean),...(reviewId?{reviewId}:{}),...(evidence.trim()?{training:{days:days===''?null:Number(days),cost:cost===''?null:Number(cost),evidence}}:{})});setMessage('Workspace settings saved. Recalculate pending requirements to use them.');setSelected(null);setReviewId('');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}return <><PageHeader eyebrow="GOVERNANCE" title="Skill taxonomy" description="Keep skill names consistent, review unfamiliar terms, and preserve explainable matching." actions={<Badge>{data.skills.length} normalized skills</Badge>}/><div className="notice">Refresh the official O*NET catalogue from Data connections. Imported skill names do not establish proficiency. Missing training estimates remain unavailable.</div><Panel title="Normalization review queue" subtitle="Unrecognized terms are held for a human review">{data.reviews.filter(r=>r.status==='Pending').length?<div className="review-queue">{data.reviews.filter(r=>r.status==='Pending').map(r=><div key={r.id}><strong>{r.input}</strong><Badge tone="warning">Low confidence</Badge><select aria-label={'Resolve '+r.input} defaultValue="" disabled={!admin} onChange={e=>{const s=data.skills.find(s=>s.id===e.target.value);if(s){setDays(s.trainingDays===null?'':String(s.trainingDays));setCost(s.trainingCost===null?'':String(s.trainingCost));setEvidence(s.trainingEvidence??'');setSelected(s);setAliases([...s.aliases,r.input].join(', '));setReviewId(r.id);}}}><option value="" disabled>Map to a normalized skill…</option>{data.skills.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>)}</div>:<Empty title="No terms awaiting review">Unknown skills submitted in a requirement will appear here.</Empty>}</Panel>{selected&&<Panel title={'Workspace skill settings · '+selected.name}><div className="panel-body"><Field label="Aliases (comma-separated)"><input value={aliases} onChange={e=>setAliases(e.target.value)}/></Field><div className="form-grid"><Field label="Estimated training days"><input type="number" min={0} max={3650} value={days} onChange={e=>setDays(e.target.value)}/></Field><Field label="Training cost per learner (INR)"><input type="number" min={0} value={cost} onChange={e=>setCost(e.target.value)}/></Field></div><Field label="Estimate evidence and assumptions (minimum 20 characters)"><textarea value={evidence} onChange={e=>setEvidence(e.target.value)} maxLength={2000}/></Field><p>Provide an actual course plan or trainer quote. Module duration alone does not prove readiness. Leave both numbers blank to clear a plan, with a reason. Estimates are applied only in your workspace.</p><div className="inline-actions"><Button disabled={busy||!admin} onClick={()=>void save()}><Save size={14}/>{busy?'Saving…':'Save settings'}</Button><Button variant="secondary" onClick={()=>{setSelected(null);setReviewId('');}}>Cancel</Button></div></div></Panel>}{message&&<p role="status" className="success-message">{message}</p>}{error&&<p role="alert" className="form-error">{error}</p>}<Panel title="Normalized skill catalogue" subtitle="Dictionary matching is exact and case-insensitive across canonical names and aliases"><DataTable rows={data.skills} search={s=>s.name+' '+s.category+' '+s.aliases.join(' ')} placeholder="Search skills, aliases or categories…" pageSize={12} columns={[

 {key:'name',label:'Canonical skill',value:s=>s.name,render:s=><strong>{s.name}</strong>},

 {key:'category',label:'Category',value:s=>s.category,render:s=>s.category},

 {key:'aliases',label:'Aliases',render:s=>s.aliases.join(', ')||'—'},

 {key:'adjacent',label:'Learning adjacency',render:s=>s.adjacent.join(' → ')||'Not mapped'},

 {key:'training',label:'Training estimate',value:s=>s.trainingDays??'',render:s=>s.trainingDays==null?'Not available':s.trainingDays+' days · Planning estimate'},

 {key:'edit',label:'Manage',render:s=><Button variant="ghost" disabled={!admin} onClick={()=>{setDays(s.trainingDays===null?'':String(s.trainingDays));setCost(s.trainingCost===null?'':String(s.trainingCost));setEvidence(s.trainingEvidence??'');setSelected(s);setAliases(s.aliases.join(', '));setMessage('');}}>Edit settings</Button>}

 ]}/></Panel><SourceNote ids="Official O*NET terminology and workspace-reviewed aliases / training estimates"/></>;}

