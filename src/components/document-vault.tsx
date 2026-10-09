'use client';
import {useEffect,useState} from 'react';
import {api} from './workspace-context';
import {Panel,DataTable} from './common';
import {Button} from './ui/button';
type Document={id:string;filename:string;created_at:string;checksum:string};
export function DocumentVault(){
 const [rows,setRows]=useState<Document[]>([]),[file,setFile]=useState<File|null>(null),[authorized,setAuthorized]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 useEffect(()=>{void api<Document[]>('documents').then(setRows).catch(e=>setError(e.message));},[]);
 async function upload(){if(!file)return;setBusy(true);setError('');try{const body=new FormData();body.set('file',file);body.set('authorized',String(authorized));const response=await fetch('/api/documents',{method:'POST',body});const result=await response.json();if(!response.ok)throw new Error(result.error??'Upload failed.');setMessage(result.status);setRows(await api<Document[]>('documents'));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <Panel title="Private supporting documents" subtitle="PDF and text, up to 5 MB. Stored in your Neon workspace; never sent to Gemini."><div className="panel-body"><input aria-label="Resume or certification document" type="file" accept=".pdf,.txt" onChange={e=>{setFile(e.target.files?.[0]??null);setMessage('');}}/><label className="checkbox-field"><input type="checkbox" checked={authorized} onChange={e=>setAuthorized(e.target.checked)}/>I have permission to store this document in this workspace.</label><Button disabled={!file||!authorized||busy} onClick={()=>void upload()}>{busy?'Saving…':'Save supporting document'}</Button><p>Review the source yourself, then use the structured import above. Resume claims do not establish performance, proficiency, salary or availability.</p>{message&&<p role="status">{message}</p>}{error&&<p role="alert" className="form-error">{error}</p>}</div><DataTable rows={rows} columns={[{key:'name',label:'Document',render:r=><a href={'/api/documents/'+encodeURIComponent(r.id)}>{r.filename}</a>},{key:'date',label:'Stored',render:r=>new Date(r.created_at).toLocaleString()},{key:'checksum',label:'Integrity',render:r=>r.checksum.slice(0,16)}]}/></Panel>;
}
