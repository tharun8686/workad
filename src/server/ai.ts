import {embed,embeddingConfig} from './embeddings';
import {z} from 'zod';

import {createHash,randomUUID} from 'node:crypto';

import {transaction} from './db';

import {AppError,type Actor} from './auth';

import {owned,catalogue} from './repository';
import {matchPerson} from '@/lib/engine';
import {employmentSchema,checkResume,roleLevel} from '@/lib/intelligence';
import type {Person} from '@/lib/types';

import {aiConfig,generateStructured,ProviderError} from './ai-provider';

export async function structured<T>(a:Actor,purpose:string,schema:z.ZodType<T>,instructions:string,input:unknown){

 let generated;try{generated=await generateStructured(schema,instructions,input);}catch(e){if(e instanceof ProviderError)throw new AppError(e.status,e.message);throw e;}

 const {result,model}=generated;

 await transaction(a.id,q=>q('INSERT INTO ai_runs(id,owner_id,purpose,model,input_hash,output) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),a.id,purpose,model,createHash('sha256').update(JSON.stringify(input)).digest('hex'),JSON.stringify(result)]));

 return result;

}

const explanationSchema=z.object({summary:z.string(),tradeoffs:z.array(z.string()),missingEvidence:z.array(z.string()),citations:z.array(z.string())});

export async function explain(a:Actor,id:string){

 if(aiConfig().provider==='gemini')throw new AppError(422,'Private workforce evidence cannot be sent to Gemini free tier. The computed analysis remains available locally.');

 const r=await transaction(a.id,q=>owned(q,id,a.id));

 const evidence={requirementId:r.id,role:r.role,headcount:r.headcount,deadline:r.deadline,ranking:r.analysis.ranking,hybrid:r.analysis.hybrid,recommendation:r.analysis.recommendation,confidence:r.analysis.confidence};

 const out=await structured(a,'decision explanation',explanationSchema,'Explain ONLY the supplied computed strategy evidence. Preserve strategy order and numbers. Do not select employees or override the recommendation. Cite only the requirement ID and supplied evidence IDs. Clearly distinguish forecasts from observations. Return missing evidence and tradeoffs.',JSON.stringify(evidence));

 const valid=new Set([r.id,...r.analysis.ranking.flatMap(s=>s.evidence)]);if(out.citations.some(c=>!valid.has(c)))throw new AppError(502,'Explanation contained an unsupported citation. Please retry.');return out;

}

export const resumeSchema=z.object({graduationYear:z.number().int().nullable(),employment:z.array(employmentSchema),name:z.string().nullable(),role:z.string().nullable(),location:z.string().nullable(),experience:z.number().nullable(),claimedSkills:z.array(z.string()),projects:z.array(z.string()),certifications:z.array(z.string()),evidenceQuotes:z.array(z.string()),missingFields:z.array(z.string())});

export async function extractDocument(a:Actor,file:File,consent:boolean){

 if(aiConfig().provider==='gemini')throw new AppError(422,'Personal documents cannot be sent to Gemini free tier. Use authorized structured imports instead.');

 if(!consent)throw new AppError(422,'Confirm authorization to send this document to the configured AI provider.');

 if(file.size>5_000_000||!file.size)throw new AppError(413,'Document must be between 1 byte and 5 MB.');

 const bytes=Buffer.from(await file.arrayBuffer());const isPdf=bytes.subarray(0,5).toString()==='%PDF-';

 if(!isPdf&&!file.name.toLowerCase().endsWith('.txt'))throw new AppError(422,'Upload a PDF or UTF-8 text document.');

 const input=isPdf?[{role:'user',content:[{type:'input_file',filename:'source.pdf',file_data:'data:application/pdf;base64,'+bytes.toString('base64')},{type:'input_text',text:'Extract the professional claims in this authorized resume or certification document.'}]}]:bytes.toString('utf8');

 const result=await structured(a,'document extraction',resumeSchema,'Extract only explicitly written professional facts. Use null for missing scalar fields. Never infer performance, learning progress, proficiency scores, promotion eligibility, salary or availability. Extract graduation year and employment start/end dates only when explicitly supplied. Omit employment periods without complete dates rather than inventing a day. Null end means explicitly ongoing employment. Names must come verbatim from the document. Claimed skills are unverified. Return short supporting quotes. Do not include contact details or protected personal attributes.',input);

 const checksum=createHash('sha256').update(bytes).digest('hex');const id=randomUUID();

 const saved=await transaction(a.id,q=>q<{id:string}>('INSERT INTO source_documents(id,owner_id,filename,mime,checksum,content,extracted) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(owner_id,checksum) DO UPDATE SET extracted=EXCLUDED.extracted RETURNING id',[id,a.id,file.name.slice(0,200),isPdf?'application/pdf':'text/plain',checksum,bytes,JSON.stringify(result)]));

 return {id:saved.rows[0].id,checksum,draft:result,status:'Needs human review; not added to the talent directory'};

}

export async function indexProfiles(a:Actor){

 const rows=await transaction(a.id,q=>q<{id:string;payload:{role:string;skills:Record<string,number>;projects:string[]}}> ('SELECT id,payload FROM talent_records WHERE owner_id=$1 AND (embedding IS NULL OR embedding_model IS DISTINCT FROM $2) LIMIT 32',[a.id,embeddingConfig().indexModel]));

 if(!rows.rows.length)return {indexed:0};

 const texts=rows.rows.map(r=>JSON.stringify({role:r.payload.role,skills:Object.keys(r.payload.skills),projects:embeddingConfig().provider==='gemini'?[]:r.payload.projects}));

 const {model,vectors}=await embed(texts);

 const indexed=await transaction(a.id,async q=>{let count=0;for(let i=0;i<rows.rows.length;i++){const saved=await q('UPDATE talent_records SET embedding=$1::vector,embedding_model=$2,embedding_hash=$3 WHERE id=$4 AND owner_id=$5 AND payload=$6::jsonb RETURNING id',[JSON.stringify(vectors[i]),model,createHash('sha256').update(texts[i]).digest('hex'),rows.rows[i].id,a.id,JSON.stringify(rows.rows[i].payload)]);count+=saved.rows.length;}return count;});return {indexed};

}

export async function semanticStatus(a:Actor){const c=embeddingConfig();return transaction(a.id,async q=>{const row=(await q<{total:string;indexed:string}>("SELECT count(*) AS total,count(*) FILTER (WHERE embedding IS NOT NULL AND embedding_model=$2) AS indexed FROM talent_records WHERE owner_id=$1",[a.id,c.indexModel])).rows[0];return {configured:c.configured,total:Number(row.total),indexed:Number(row.indexed),provider:c.provider,model:c.configured?c.model:null};});}

export async function semanticSearch(a:Actor,query:string,requirementId?:string){
 const requirement=requirementId?await transaction(a.id,q=>owned(q,requirementId,a.id)):null;
 const text=requirement?JSON.stringify({role:requirement.role,skills:[...requirement.mandatorySkills,...requirement.optionalSkills],query}):query;
 const {model,vectors}=await embed([text],'RETRIEVAL_QUERY');
 return transaction(a.id,async q=>{
  const rows=(await q<{id:string;payload:Person;similarity:number}>('SELECT id,payload,1-(embedding <=> $1::vector) AS similarity FROM talent_records WHERE owner_id=$2 AND embedding_model=$3 AND embedding IS NOT NULL ORDER BY embedding <=> $1::vector LIMIT 100',[JSON.stringify(vectors[0]),a.id,model])).rows;
  const c=requirement?await catalogue(q,requirement.id):null;
  const results=rows.map(row=>{const person=c?.people.find(p=>p.id===row.id)??row.payload;const assessed=requirement&&c?matchPerson(person,requirement,c.skills):null;const sameLevel=!requirement||(person.level??roleLevel(person.role,person.experience))===roleLevel(requirement.role,requirement.experienceMin);return {...row,assessment:assessed,levelAligned:sameLevel,eligible:assessed?assessed.suitable&&sameLevel:null,combinedScore:assessed?Math.round((assessed.match*.8+Math.max(0,Math.min(1,row.similarity))*100*.2)*100)/100:null};}).sort((a,b)=>Number(b.eligible)-Number(a.eligible)||(b.combinedScore??b.similarity)-(a.combinedScore??a.similarity)).slice(0,10);
  return {results,notice:'Semantic similarity measures relevance, not verified proficiency. Requirement results use 80% assessed match and 20% semantic relevance; suitability and role level remain separate gates. Human review is required.'};
 });
}

export async function verifyEmbeddings(){const result=await embed(['Synthetic test: data engineering and cloud pipelines.']);return {verified:true,model:result.model,dimensions:result.vectors[0].length};}
