import {loadEnvConfig} from '@next/env';
import {writeFile,readFile} from 'node:fs/promises';
loadEnvConfig(process.cwd());
async function main(){
 const headers={Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'};
 const models=await fetch('https://api.openai.com/v1/models',{headers});
 const data=await models.json();const ids=new Set((data.data??[]).map((m:{id:string})=>m.id));
 console.log(JSON.stringify({modelsStatus:models.status,desiredModelAvailable:ids.has('gpt-5.4-mini'),embeddingModelAvailable:ids.has('text-embedding-3-small')}));
 if(!models.ok||!ids.has('gpt-5.4-mini'))return;
 let env=await readFile('.env.local','utf8');env=env.replace(/^OPENAI_MODEL=.*$/m,'OPENAI_MODEL=gpt-5.4-mini');await writeFile('.env.local',env);
 const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers,body:JSON.stringify({model:'gpt-5.4-mini',store:false,input:'Reply with the word connected.',max_output_tokens:32}),signal:AbortSignal.timeout(45000)});
 const result=await response.json();console.log(JSON.stringify({inferenceStatus:response.status,responseStatus:result.status,errorCode:result.error?.code??null}));
 const embeddings=await fetch('https://api.openai.com/v1/embeddings',{method:'POST',headers,body:JSON.stringify({model:'text-embedding-3-small',input:'workforce planning',dimensions:1536}),signal:AbortSignal.timeout(45000)});
 const vector=await embeddings.json();console.log(JSON.stringify({embeddingStatus:embeddings.status,dimensions:vector.data?.[0]?.embedding?.length??0,errorCode:vector.error?.code??null}));
}
main().catch(()=>{console.error('Service check failed; no secrets were printed.');process.exitCode=1;});
