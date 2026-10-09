'use client';

import {useState,type ReactNode} from 'react';

import Link from 'next/link';

import {ArrowUpDown,ArrowUpRight,Info,Search,Inbox} from 'lucide-react';

import type {Requirement} from '@/lib/types';

export const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);

export const lakh=(n:number)=>'₹'+(n/100000).toFixed(1)+'L';

export function Badge({children,tone='neutral'}:{children:ReactNode;tone?:string}){return <span className={`badge badge-${tone}`}>{children}</span>;}

export function SourceNote({ids='Authorized workforce imports',children}:{ids?:string;children?:ReactNode}){return <div className="source-note"><Info size={13}/><span>{children??`Source: ${ids}. Workforce records are imported observations; costs and timelines are forecasts.`} <Link href="/sources">View provenance <ArrowUpRight size={11}/></Link></span></div>;}

export function PageHeader({eyebrow,title,description,actions}:{eyebrow:string;title:string;description:string;actions?:ReactNode}){return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><div className="heading-actions">{actions}</div></div>;}

export function Panel({title,subtitle,actions,children,className=''}:{title?:string;subtitle?:string;actions?:ReactNode;children:ReactNode;className?:string}){return <section className={'panel '+className}>{title&&<div className="panel-heading"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{actions}</div>}{children}</section>;}

export function Empty({title,children}:{title:string;children?:ReactNode}){return <div className="empty"><Inbox size={25}/><h3>{title}</h3><p>{children}</p></div>;}

export function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}){return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;}

export function RequirementSelect({requirements,value,onChange}:{requirements:Requirement[];value:string;onChange:(v:string)=>void}){return <select aria-label="Select requirement" value={value} onChange={e=>onChange(e.target.value)}>{requirements.map(r=><option key={r.id} value={r.id}>{r.id} · {r.role}</option>)}</select>;}

export type Column<T>={key:string;label:string;render:(row:T)=>ReactNode;value?:(row:T)=>string|number};

export function DataTable<T extends {id:string}>({rows,columns,search,placeholder='Search records…',empty='No matching records',pageSize=10}:{rows:T[];columns:Column<T>[];search?:(row:T)=>string;placeholder?:string;empty?:string;pageSize?:number}){

 const[query,setQuery]=useState(''),[sort,setSort]=useState<{key:string;direction:number}|null>(null),[page,setPage]=useState(0);

 const filtered=rows.filter(r=>!search||search(r).toLowerCase().includes(query.toLowerCase()));const col=columns.find(c=>c.key===sort?.key);if(col?.value&&sort)filtered.sort((a,b)=>{const x=col.value!(a),y=col.value!(b);return (typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y)))*sort.direction;});const current=Math.min(page,Math.max(0,Math.ceil(filtered.length/pageSize)-1));

 return <>{search&&<div className="table-toolbar"><div className="search-input"><Search size={15}/><input aria-label={placeholder} placeholder={placeholder} value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}}/></div><span className="muted">{filtered.length} records</span></div>}<div className="table-scroll"><table><thead><tr>{columns.map(c=><th key={c.key} aria-sort={sort?.key===c.key?(sort.direction===1?'ascending':'descending'):'none'}>{c.value?<button className="sort-button" onClick={()=>setSort({key:c.key,direction:sort?.key===c.key?-sort.direction:1})}>{c.label}<ArrowUpDown size={12}/></button>:c.label}</th>)}</tr></thead><tbody>{filtered.slice(current*pageSize,(current+1)*pageSize).map(row=><tr key={row.id}>{columns.map(c=><td key={c.key}>{c.render(row)}</td>)}</tr>)}</tbody></table>{!filtered.length&&<Empty title={empty}/>}</div>{filtered.length>pageSize&&<div className="pagination"><span>{current*pageSize+1}–{Math.min((current+1)*pageSize,filtered.length)} of {filtered.length}</span><button disabled={current===0} onClick={()=>setPage(current-1)}>Previous</button><button disabled={(current+1)*pageSize>=filtered.length} onClick={()=>setPage(current+1)}>Next</button></div>}</>;

}

