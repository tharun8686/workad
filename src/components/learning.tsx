'use client';
import {useEffect,useState} from 'react';
import {api,useWorkspace} from './workspace-context';
import {PageHeader,Panel,DataTable} from './common';
import {Button} from './ui/button';
type Module={uid:string;title:string;url:string;duration_in_minutes:number;levels:string[];products:string[];last_modified:string};
type Catalogue={modules:Module[];retrievedAt:string|null;checksum?:string};
export function Learning(){
 const {data}=useWorkspace();const[catalogue,setCatalogue]=useState<Catalogue>({modules:[],retrievedAt:null}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{void api<Catalogue>('learning').then(setCatalogue).catch(e=>setError(e.message));},[]);
 async function refresh(){setBusy(true);setError('');try{await api('learning/refresh',{});setCatalogue(await api<Catalogue>('learning'));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <><PageHeader eyebrow="PUBLIC DATA" title="Official learning catalogue" description="Microsoft Learn modules with source links, published durations and retrieval dates." actions={<Button disabled={busy||data?.actor.role!=='admin'} onClick={()=>void refresh()}>{busy?'Retrieving official catalogue…':'Refresh Microsoft Learn'}</Button>}/><div className="notice">Published course duration is not a training-to-proficiency estimate. Completing a course does not automatically change an employee assessment. Microsoft Learn content and trademarks belong to Microsoft.</div>{error&&<p role="alert" className="form-error">{error}</p>}<Panel title={`${catalogue.modules.length} official modules`} subtitle={catalogue.retrievedAt?'Retrieved '+new Date(catalogue.retrievedAt).toLocaleString():'Refresh to retrieve the official catalogue. No example modules are generated.'}><DataTable rows={catalogue.modules.map(m=>({...m,id:m.uid}))} search={m=>[m.title,...m.products,...m.levels].join(' ')} placeholder="Search courses, products or levels…" columns={[{key:'title',label:'Module',value:m=>m.title,render:m=><a href={m.url} target="_blank" rel="noreferrer">{m.title}</a>},{key:'duration',label:'Published duration',value:m=>m.duration_in_minutes,render:m=>`${m.duration_in_minutes} minutes`},{key:'level',label:'Level',render:m=>m.levels.join(', ')},{key:'product',label:'Products',render:m=>m.products.join(', ')},{key:'modified',label:'Source updated',render:m=>m.last_modified}]}/></Panel></>;
}
