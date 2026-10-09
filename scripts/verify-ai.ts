import {loadEnvConfig} from '@next/env';
import {z} from 'zod';
import {generateStructured,aiConfig} from '../src/server/ai-provider';
import {verifyEmbeddings} from '../src/server/ai';

async function main(){
 loadEnvConfig(process.cwd());
 // Synthetic text only: never read or send workforce records during connection checks.
 if(process.argv.includes('--embeddings')){
  console.log(JSON.stringify(await verifyEmbeddings()));
 }else{
  const {provider,model}=aiConfig();
  const result=await generateStructured(z.object({ok:z.boolean()}),'Return ok=true for this synthetic connection test.','Synthetic connection test; no personal or company data.');
  if(result.result.ok!==true)throw new Error('Provider response failed the connection check.');
  console.log(JSON.stringify({verified:true,provider,model}));
 }
}
main().catch(e=>{console.error('Connection check failed:',e instanceof Error?e.message:'Unknown error');process.exitCode=1;});
