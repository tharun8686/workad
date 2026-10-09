import {z} from 'zod';
import {AppError} from './auth';
import {aiConfig} from './ai-provider';

export function embeddingConfig(){
 const provider=process.env.EMBEDDING_PROVIDER||aiConfig().provider;
 const model=provider==='gemini'?(process.env.GEMINI_EMBEDDING_MODEL||'gemini-embedding-001'):process.env.OPENAI_EMBEDDING_MODEL;
 const key=provider==='gemini'?process.env.GEMINI_API_KEY:provider==='openai'?process.env.OPENAI_API_KEY:undefined;
 return {provider,model,key,configured:!!key&&!!model&&['gemini','openai'].includes(provider),indexModel:model?`${provider}:${model}:1536:v1`:''};
}

export async function embed(input:string[],task:'RETRIEVAL_DOCUMENT'|'RETRIEVAL_QUERY'='RETRIEVAL_DOCUMENT'){
 const c=embeddingConfig();if(!c.configured)throw new AppError(503,'Configure the selected embedding provider key and model.');
 const gemini=c.provider==='gemini';
 const url=gemini?`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(c.model!)}:batchEmbedContents`:'https://api.openai.com/v1/embeddings';
 // The deployed batch endpoint accepts the top-level REST fields; nested config may ignore dimensionality.
 const body=gemini?{requests:input.map(text=>({model:'models/'+c.model,content:{parts:[{text}]},taskType:task,outputDimensionality:1536}))}:{model:c.model,input,dimensions:1536,encoding_format:'float'};
 const headers:Record<string,string>={'Content-Type':'application/json'};
 if(gemini)headers['x-goog-api-key']=c.key!;else headers.Authorization=`Bearer ${c.key}`;
 let response:Response;
 try{response=await fetch(url,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});}catch{throw new AppError(502,'Embedding provider could not be reached. Please retry.');}
 if(!response.ok)throw new AppError(response.status===429?429:502,`${gemini?'Gemini':'OpenAI'} embedding request failed (HTTP ${response.status}). ${response.status===429?'Quota or rate limit reached.':'Check API key and embedding model access.'} No provider fallback was used.`);
 try{
  const result=await response.json();
  const rows=gemini?z.array(z.object({values:z.array(z.number().finite()).length(1536)})).parse(result.embeddings).map((r,index)=>({index,embedding:r.values})):z.array(z.object({index:z.number().int(),embedding:z.array(z.number().finite()).length(1536)})).parse(result.data).sort((a,b)=>a.index-b.index);
  if(rows.length!==input.length||rows.some((r,i)=>r.index!==i||!r.embedding.some(v=>v!==0)))throw new Error('Incomplete');
  const vectors=rows.map(r=>{const norm=Math.hypot(...r.embedding);if(!Number.isFinite(norm)||!norm)throw new Error('Invalid norm');return r.embedding.map(v=>v/norm);});
  return {model:c.indexModel,vectors};
 }catch{throw new AppError(502,'Incomplete embedding response. No vectors were saved.');}
}
