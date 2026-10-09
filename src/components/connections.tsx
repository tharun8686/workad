'use client';

import {useEffect,useState} from 'react';
import {ServiceStatus} from './service-status';
import {DocumentVault} from './document-vault';

import {api,useWorkspace} from './workspace-context';

import {PageHeader,Panel,Field,Badge,DataTable} from './common';

import {Button} from './ui/button';

import {csvRecords,importHeaders} from '@/lib/imports';

type Batch={id:string;source_name:string;observed_at:string;imported_at:string;record_count:number;checksum:string;authority:string};

export function Connections(){

 const {mutate}=useWorkspace();const[source,setSource]=useState(''),[authority,setAuthority]=useState(''),[observed,setObserved]=useState(''),[content,setContent]=useState(''),[format,setFormat]=useState('csv'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<unknown>(null),[validated,setValidated]=useState(false),[history,setHistory]=useState<Batch[]>([]);

 useEffect(()=>{void api<Batch[]>('imports').then(setHistory).catch(e=>setError(e.message));},[]);

 function invalidate(){setValidated(false);setResult(null);}

 async function run(confirm:boolean){setError('');setBusy(true);try{const records=format==='csv'?csvRecords(content):JSON.parse(content);const r=await mutate('imports',{source,authority,observedAt:new Date(observed).toISOString(),records,confirm});setResult(r);setValidated(!confirm);if(confirm)setHistory(await api<Batch[]>('imports'));}catch(e){setError((e as Error).message);setValidated(false);}finally{setBusy(false);}}

 function template(){const url=URL.createObjectURL(new Blob([importHeaders+'\r\n'],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='workforce-import-template.csv';a.click();URL.revokeObjectURL(url);}

 return <><PageHeader eyebrow="DATA" title="Data connections" description="Import authorized workforce records. Every saved record retains its source, observation date and import history." actions={<Button variant="secondary" onClick={template}>Download empty CSV template</Button>}/><ServiceStatus/><div className="notice">This workspace starts empty. Resume claims need review; training content does not prove completion. Imports require actual values for matching inputs. Keep incomplete records as documents until those values are supplied.</div><Panel title="Import CSV or JSON" subtitle="Use exports from your HR, ATS, VMS or LMS after mapping fields to the template."><div className="panel-body"><div className="form-grid"><Field label="Source system or authorized collection"><input value={source} onChange={e=>{setSource(e.target.value);invalidate();}} placeholder="Your actual source name"/></Field><Field label="Data observed at"><input type="datetime-local" value={observed} onChange={e=>{setObserved(e.target.value);invalidate();}}/></Field><Field label="Authorization and provenance"><input value={authority} onChange={e=>{setAuthority(e.target.value);invalidate();}} placeholder="Describe consent or your authority to import"/></Field><Field label="File format"><select value={format} onChange={e=>{setFormat(e.target.value);invalidate();}}><option value="csv">CSV</option><option value="json">JSON array</option></select></Field></div><Field label="Choose export file"><input type="file" accept=".csv,.json" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>2_000_000){setError('Maximum import size is 2 MB.');return;}setContent(await file.text());setFormat(file.name.toLowerCase().endsWith('.json')?'json':'csv');invalidate();}}/></Field><Field label="Review import contents"><textarea rows={8} value={content} onChange={e=>{setContent(e.target.value);invalidate();}}/></Field><details><summary>Field definitions and supported exports</summary><p>externalId is the stable source-system identifier. kind is employee, candidate or contractor. Salary is annual INR lakh; rate is INR/hour. Availability is days from the observation date. Skill scores, performance and learning must be supplied assessments (0–100), never AI-inferred scores. Projects and certifications are JSON arrays; skills is a JSON object. Promotion eligibility is true or false. Irrelevant salary/rate may be zero.</p><p>Workday, SAP SuccessFactors, Greenhouse, Lever, BambooHR, Darwinbox, Oracle HCM, SAP Fieldglass and Beeline exports can be imported after field mapping. This workflow does not claim to be a native connector to those systems.</p></details><div className="inline-actions"><Button disabled={busy||!content} onClick={()=>void run(false)}>Validate and preview</Button><Button disabled={busy||!validated} onClick={()=>void run(true)}>Import validated records</Button><Button variant="secondary" onClick={()=>{setContent('');invalidate();}}>Clear import</Button></div>{error&&<p className="form-error" role="alert">{error}</p>}{result!=null&&<pre role="status" className="json-preview">{JSON.stringify(result,null,2)}</pre>}</div></Panel><DocumentVault/><Panel title="Import history"><DataTable rows={history} columns={[{key:'source',label:'Source',value:r=>r.source_name,render:r=>r.source_name},{key:'count',label:'Records',value:r=>r.record_count,render:r=><Badge>{r.record_count}</Badge>},{key:'observed',label:'Observed',render:r=>new Date(r.observed_at).toLocaleString()},{key:'imported',label:'Imported',render:r=>new Date(r.imported_at).toLocaleString()},{key:'hash',label:'Integrity',render:r=><span title={r.checksum}>{r.checksum.slice(0,16)}…</span>}]}/></Panel></>;

}

