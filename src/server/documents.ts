import {createHash,randomUUID} from 'node:crypto';
import {AppError,type Actor} from './auth';
import {transaction} from './db';
export async function saveDocument(a:Actor,file:File,authorized:boolean){
 if(!authorized)throw new AppError(422,'Confirm you are authorized to store this document.');
 if(!file.size||file.size>5_000_000)throw new AppError(413,'Upload a document between 1 byte and 5 MB.');
 const bytes=Buffer.from(await file.arrayBuffer());const pdf=bytes.subarray(0,5).toString()==='%PDF-';
 if(!pdf&&!file.name.toLowerCase().endsWith('.txt'))throw new AppError(422,'Upload a PDF or UTF-8 text document.');
 const checksum=createHash('sha256').update(bytes).digest('hex');
 const rows=await transaction(a.id,q=>q<{id:string}>('INSERT INTO source_documents(id,owner_id,filename,mime,checksum,content,extracted) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(owner_id,checksum) DO UPDATE SET filename=EXCLUDED.filename RETURNING id',[randomUUID(),a.id,file.name.slice(0,200),pdf?'application/pdf':'text/plain',checksum,bytes,JSON.stringify({status:'Awaiting human review; not sent to AI'})]));
 return {id:rows.rows[0].id,checksum,status:'Stored privately in your Neon workspace. Review professional claims and import only authorized, supported fields.'};
}
