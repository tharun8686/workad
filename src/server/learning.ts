import {z} from 'zod';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {transaction} from './db';
import {type Actor} from './auth';
import {fetchLearnModules,learnEndpoint} from './learn-platform';
const endpoint=learnEndpoint;
const moduleSchema=z.object({uid:z.string(),title:z.string(),url:z.string().url(),duration_in_minutes:z.number().nonnegative(),levels:z.array(z.string()),products:z.array(z.string()),last_modified:z.string()});
export async function refreshLearning(a:Actor){
 const modules=await fetchLearnModules();const raw=JSON.stringify(modules);
 const retrievedAt=new Date().toISOString();const checksum=createHash('sha256').update(raw).digest('hex');
 await transaction(a.id,q=>q('INSERT INTO integration_runs(id,owner_id,provider,status,details) VALUES($1,$2,$3,$4,$5)',[randomUUID(),a.id,'Microsoft Learn','Succeeded',JSON.stringify({modules,retrievedAt,checksum,url:endpoint})]));
 return {count:modules.length,retrievedAt,checksum};
}
export async function learningCatalogue(a:Actor){
 const rows=await transaction(a.id,q=>q<{details:unknown}>("SELECT details FROM integration_runs WHERE owner_id=$1 AND provider='Microsoft Learn' AND status='Succeeded' ORDER BY created_at DESC LIMIT 1",[a.id]));
 if(rows.rows[0])return rows.rows[0].details;
 try{const saved=JSON.parse(await readFile(path.join(process.cwd(),'data','microsoft-learn.json'),'utf8'));return z.object({modules:z.array(moduleSchema),retrievedAt:z.string(),checksum:z.string(),url:z.string()}).parse(saved);}catch{return {modules:[],retrievedAt:null,url:endpoint};}
}
