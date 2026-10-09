import {createHash,randomUUID} from 'node:crypto';
import {parseCSV} from '@/lib/imports';
import type {Skill,Source} from '@/lib/types';
import {transaction} from './db';
import {AppError,type Actor} from './auth';
export const onetURL='https://www.onetcenter.org/dl_files/database/db_31_0_csv/software_skills.csv';
export async function ingestOnet(a:Actor,text?:string){
 if(text===undefined){const response=await fetch(onetURL,{signal:AbortSignal.timeout(45000)});if(!response.ok)throw new AppError(502,'The official O*NET download is unavailable. Retry later.');text=await response.text();}
 const rows=parseCSV(text);if(!rows.length||!rows[0]['Workplace Example']||!rows[0]['Element Name'])throw new AppError(502,'Unexpected O*NET dataset format. No records changed.');
 const unique=new Map<string,Skill>();for(const row of rows){const name=row['Workplace Example'].trim();if(name.length>160||!name)continue;unique.set(name.toLowerCase(),{id:'onet-'+createHash('sha256').update(name.toLowerCase()).digest('hex').slice(0,24),name,category:row['Element Name'],aliases:[],trainingDays:null,trainingCost:null,adjacent:[],sourceUrl:onetURL});}
 const time=new Date().toISOString();const checksum=createHash('sha256').update(text).digest('hex');
 const source:Source={id:'onet-31',name:'O*NET® 31.0 — USDOL/ETA',url:'https://www.onetcenter.org/database.html',category:'Public occupational taxonomy',dataset:`Software Skills: ${rows.length} rows; ${unique.size} unique workplace examples. Adaptation: deduplicated example names; no proficiency or training estimates added. SHA-256 ${checksum}`,fields:['Skill names','Occupational categories'],type:'Official dataset',license:'CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/ ; modifications not endorsed by USDOL/ETA',retrieved:time.slice(0,10),period:'31.0 release',status:'Ingested',refreshed:time};
 await transaction(a.id,async q=>{await q('INSERT INTO data_sources(id,name,url,type,licence,retrieved_at,fields_fed,payload) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET retrieved_at=EXCLUDED.retrieved_at,payload=EXCLUDED.payload',[source.id,source.name,source.url,source.type,source.license,source.retrieved,JSON.stringify(source.fields),JSON.stringify(source)]);
 await q("INSERT INTO skills(id,name,normalized_name,category,aliases,payload) SELECT item->>'id',item->>'name',lower(item->>'name'),item->>'category','{}'::text[],item FROM jsonb_array_elements($1::jsonb) AS item ON CONFLICT(normalized_name) DO NOTHING",[JSON.stringify([...unique.values()])]);
 await q('INSERT INTO integration_runs(id,owner_id,provider,status,details) VALUES($1,$2,$3,$4,$5)',[randomUUID(),a.id,'O*NET','Succeeded',JSON.stringify({rows:rows.length,unique:unique.size,checksum})]);});return {rows:rows.length,skills:unique.size,checksum,retrievedAt:time};
}
