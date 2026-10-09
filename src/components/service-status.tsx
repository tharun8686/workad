'use client';
import {useEffect,useState} from 'react';
import {api,useWorkspace} from './workspace-context';
import {Panel} from './common';
import {Button} from './ui/button';
export function ServiceStatus(){
 const {data,mutate}=useWorkspace();
 const [status,setStatus]=useState<Record<string,unknown>|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{void api<Record<string,unknown>>('services').then(setStatus).catch(e=>setError(e.message));},[]);
 async function refresh(){setBusy(true);setError('');try{const result=await mutate<{skills:number;retrievedAt:string}>('sources/onet',{});setMessage(`Official O*NET catalogue refreshed: ${result.skills} skill names. Retrieved ${result.retrievedAt}.`);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <Panel title="Connected services" subtitle="Configuration status does not confirm live access or remaining provider quota."><div className="panel-body">{status&&<dl>{Object.entries(status).map(([name,value])=><div className="coverage-row" key={name}><dt>{name}</dt><dd>{typeof value==='boolean'?(value?'Configured':'Not configured'):String(value??'Not configured')}</dd></div>)}</dl>}<p>O*NET supplies occupational skill terminology, not employee proficiency, salaries, availability or training duration.</p><Button disabled={busy||data?.actor.role!=='admin'} onClick={()=>void refresh()}>{busy?'Downloading official dataset…':'Refresh official O*NET skills'}</Button>{message&&<p role="status">{message}</p>}{error&&<p className="form-error" role="alert">{error}</p>}</div></Panel>;
}
