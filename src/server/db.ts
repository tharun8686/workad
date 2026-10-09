import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite-pgvector';
import { Pool } from 'pg';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
export type Query = <T = Record<string,unknown>>(sql:string,params?:unknown[])=>Promise<{rows:T[]}>;
type DBGlobal = typeof globalThis & { advisoryPool?:Pool; advisoryLocal?:Promise<PGlite>; advisoryQueue?:Promise<unknown> };
const g=globalThis as DBGlobal;
export const sandboxEnabled=()=>process.env.LOCAL_SANDBOX==='1'&&process.env.NODE_ENV!=='production'&&!process.env.DATABASE_URL;
export function pool(){if(!process.env.DATABASE_URL)throw new Error('Database connection is not configured.');return g.advisoryPool??=new Pool({connectionString:process.env.DATABASE_URL,max:20,connectionTimeoutMillis:30000,idleTimeoutMillis:30000});}
async function local(){
  if(!sandboxEnabled())throw new Error('Configure Neon before running the connected application.');
  return g.advisoryLocal??=(async()=>{await mkdir(path.join(process.cwd(),'.local'),{recursive:true});const db=new PGlite(process.env.LOCAL_DATABASE_PATH??path.join(process.cwd(),'.local','workforce'),{extensions:{vector}});await db.waitReady;await db.exec(await readFile(path.join(process.cwd(),'db','001_workforce.sql'),'utf8'));await db.exec(await readFile(path.join(process.cwd(),'db','003_ingestion.sql'),'utf8'));await db.exec(await readFile(path.join(process.cwd(),'db','004_recruitment.sql'),'utf8'));await db.exec(await readFile(path.join(process.cwd(),'db','005_intelligence.sql'),'utf8'));await db.exec(await readFile(path.join(process.cwd(),'db','006_learning_evidence.sql'),'utf8'));return db;})();
}
export async function transaction<T>(owner:string,fn:(query:Query)=>Promise<T>):Promise<T>{
  if(process.env.DATABASE_URL){const client=await pool().connect();try{await client.query('BEGIN');await client.query("SELECT set_config('app.user_id',$1,true)",[owner]);const result=await fn(async<T>(s:string,p?:unknown[])=>({rows:(await client.query(s,p)).rows as T[]}));await client.query('COMMIT');return result;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}
  const run=async()=>{const db=await local();return db.transaction(async tx=>{await tx.query("SELECT set_config('app.user_id',\$1,true)",[owner]);return fn(async<T>(s:string,p?:unknown[])=>({rows:(await tx.query(s,p)).rows as T[]}));});};
  const task=(g.advisoryQueue??Promise.resolve()).then(run,run);g.advisoryQueue=task.catch(()=>{});return task;
}
export async function migrate(){if(process.env.DATABASE_URL){await pool().query(await readFile(path.join(process.cwd(),'db','001_workforce.sql'),'utf8'));}else await local();}
export async function applyAccessPolicies(){const sql=await readFile(path.join(process.cwd(),'db','002_access.sql'),'utf8');if(process.env.DATABASE_URL)await pool().query(sql);else await(await local()).exec(sql);}


