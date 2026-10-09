import {loadEnvConfig} from '@next/env';
import {z} from 'zod';
import {generateStructured,ProviderError} from '../src/server/ai-provider';
loadEnvConfig(process.cwd());
try{
  const {result,provider,model}=await generateStructured(z.object({connected:z.boolean()}),'Return connected true.', 'Connection check. No personal or company data.');
  console.log(JSON.stringify({provider,model,connected:result.connected}));
}catch(e){
  console.error(e instanceof ProviderError?e.message:'AI connection check failed. Credentials were not printed.');
  process.exitCode=1;
}
