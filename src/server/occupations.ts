import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseCSV} from '@/lib/imports';
type Occupation={id:string;title:string;description:string;aliases:string[];tasks:string[]};
let cached:Promise<{items:Occupation[];attribution:string;retrievedAt:string}>|undefined;
async function load(){return cached??=(async()=>{const root=path.join(process.cwd(),'data','onet');const manifest=JSON.parse(await readFile(path.join(root,'manifest.json'),'utf8')) as {attribution:string;retrievedAt:string;files:{file:string;sha256:string}[]};
 async function csv(file:string){const content=await readFile(path.join(root,file));if(createHash('sha256').update(content).digest('hex')!==manifest.files.find(f=>f.file===file)?.sha256)throw new Error('Occupation source checksum mismatch');return parseCSV(content.toString('utf8'));}
 const [roles,titles,tasks]=await Promise.all([csv('occupation_data.csv'),csv('job_titles.csv'),csv('task_statements.csv')]);const map=new Map<string,Occupation>(roles.map(r=>[r['O*NET-SOC Code'],{id:r['O*NET-SOC Code'],title:r.Title,description:r.Description,aliases:[],tasks:[]}]));
 for(const r of titles){const item=map.get(r['O*NET-SOC Code']);if(item&&!item.aliases.includes(r['Job Title']))item.aliases.push(r['Job Title']);}
 for(const r of tasks)map.get(r['O*NET-SOC Code'])?.tasks.push(r.Task);
 return {items:[...map.values()],attribution:manifest.attribution,retrievedAt:manifest.retrievedAt};})();}
export async function searchOccupations(query:string){const data=await load();const key=query.trim().toLowerCase().slice(0,160);const words=key.split(/\s+/).filter(Boolean);const score=(r:Occupation)=>r.title.toLowerCase()===key?3:r.aliases.some(a=>a.toLowerCase()===key)?2:1;return {...data,items:data.items.filter(r=>!key||words.every(w=>(r.title+' '+r.aliases.join(' ')).toLowerCase().includes(w))).sort((a,b)=>score(b)-score(a)||a.title.localeCompare(b.title)).slice(0,30)};}
export async function normalizeRole(title:string){const data=await load();const key=title.trim().toLowerCase();const exact=data.items.filter(r=>[r.title,...r.aliases].some(x=>x.toLowerCase()===key));return exact.length===1?{input:title,normalized:exact[0].title,confidence:100,method:'Exact O*NET 31.0 title or alternate-title mapping; '+exact[0].id}:{input:title,normalized:title.trim(),confidence:0,method:exact.length?'Ambiguous O*NET title; retained for human review':'No exact O*NET title mapping; retained for human review'};}
