import {z} from 'zod';
import {AppError} from './auth';
import {publicJson} from './discovery';

export const learnEndpoint='https://learn.microsoft.com/api/v1/modules?api-version=2023-11-01-preview&locale=en-us&maxpagesize=100';
const tag=z.object({id:z.string()});
const moduleSchema=z.object({id:z.string(),title:z.string(),url:z.string().url(),durationInMinutes:z.number().nonnegative(),levels:z.array(tag),products:z.array(tag),updatedAt:z.string()});
export function parseLearnPage(raw:unknown){
 const page=z.object({value:z.array(moduleSchema),nextLink:z.string().nullable().optional()}).parse(raw);
 return {modules:page.value.map(m=>{const url=new URL(m.url);if(url.protocol!=='https:'||url.hostname!=='learn.microsoft.com')throw new Error('Unofficial learning URL');return {uid:m.id,title:m.title,url:m.url,duration_in_minutes:m.durationInMinutes,levels:m.levels.map(x=>x.id),products:m.products.map(x=>x.id),last_modified:m.updatedAt};}),nextLink:page.nextLink};
}
async function token(){
 const tenant=process.env.MICROSOFT_LEARN_TENANT_ID,client=process.env.MICROSOFT_LEARN_CLIENT_ID,secret=process.env.MICROSOFT_LEARN_CLIENT_SECRET;
 if(!tenant||!client||!secret)throw new AppError(503,'Microsoft Learn now requires an onboarded Microsoft Entra application. Configure its tenant, client ID and secret to refresh. Saved courses remain available.');
 if(!/^[a-zA-Z0-9.-]+$/.test(tenant))throw new AppError(503,'Invalid Microsoft tenant configuration.');
 try{
  const r=await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,{method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:client,client_secret:secret,scope:'https://learn.microsoft.com/.default',grant_type:'client_credentials'}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw new Error();return z.object({access_token:z.string().min(1)}).parse(await r.json()).access_token;
 }catch{throw new AppError(502,'Microsoft authentication failed. Check application credentials and Learn API onboarding.');}
}
export async function fetchLearnModules(){
 const bearer=await token(),modules:ReturnType<typeof parseLearnPage>['modules']=[],seen=new Set<string>();let next:string|null|undefined=learnEndpoint;const started=Date.now();
 while(next){
  if(seen.has(next)||seen.size>=100||Date.now()-started>35000)throw new AppError(502,'The complete catalogue could not be retrieved within the refresh limit. Saved courses remain unchanged.');
  const url=new URL(next);if(url.origin!=='https://learn.microsoft.com'||url.pathname!=='/api/v1/modules')throw new AppError(502,'Microsoft returned an unexpected pagination URL.');seen.add(next);
  try{const page=parseLearnPage(await publicJson(url.href,{Authorization:`Bearer ${bearer}`}));modules.push(...page.modules);next=page.nextLink?new URL(page.nextLink,url).href:null;}catch(e){if(e instanceof AppError)throw e;throw new AppError(502,'Microsoft Learn returned an unexpected catalogue format. Saved courses remain unchanged.');}
 }
 if(!modules.length)throw new AppError(502,'Microsoft Learn returned no modules. Saved courses remain unchanged.');
 return [...new Map(modules.map(m=>[m.uid,m])).values()];
}
