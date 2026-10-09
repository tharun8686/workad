import {createHash,randomUUID} from 'node:crypto';
import {importSchema} from '@/lib/imports';
import {transaction} from './db';
import {AppError,type Actor} from './auth';
import type {Person} from '@/lib/types';
export async function importRecords(a:Actor,input:unknown){
 const v=importSchema.parse(input);if(new Date(v.observedAt).getTime()>Date.now()+60000)throw new AppError(422,'Observation time cannot be in the future.');
 const keys=v.records.map(r=>r.kind+':'+r.externalId);if(new Set(keys).size!==keys.length)throw new AppError(422,'Duplicate external IDs in the same import.');
 const checksum=createHash('sha256').update(JSON.stringify({source:v.source,observedAt:v.observedAt,records:v.records})).digest('hex');
 if(!v.confirm)return {valid:true,count:v.records.length,checksum,preview:v.records.slice(0,10)};
 return transaction(a.id,async q=>{
  const existing=(await q<{id:string}>('SELECT id FROM import_batches WHERE owner_id=$1 AND checksum=$2',[a.id,checksum])).rows[0];
  if(existing)return {id:existing.id,count:v.records.length,duplicate:true};
  const id=randomUUID();await q('INSERT INTO import_batches(id,owner_id,source_name,checksum,observed_at,record_count,authority) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,a.id,v.source,checksum,v.observedAt,v.records.length,v.authority]);
  for(const record of v.records){
   const personId=createHash('sha256').update(a.id+'\0'+record.kind+'\0'+record.externalId).digest('hex');
   const p:Person={...record,id:personId,sourceId:id};
   await q('INSERT INTO talent_records(id,owner_id,external_id,kind,payload,batch_id) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(owner_id,kind,external_id) DO UPDATE SET payload=EXCLUDED.payload,batch_id=EXCLUDED.batch_id,updated_at=now(),embedding=NULL,embedding_hash=NULL',[personId,a.id,record.externalId,record.kind,JSON.stringify(p),id]);
  }
  return {id,count:v.records.length,duplicate:false};
 });
}
export async function importHistory(a:Actor){return transaction(a.id,q=>q('SELECT id,source_name,observed_at,imported_at,record_count,checksum,authority FROM import_batches WHERE owner_id=$1 ORDER BY imported_at DESC LIMIT 100',[a.id])).then(x=>x.rows);}
