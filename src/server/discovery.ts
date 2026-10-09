import {z} from 'zod';
import {AppError} from './auth';

export const discoverySchema=z.object({source:z.enum(['esco','worldbank','city','openalex']),query:z.string().trim().min(2).max(160),country:z.string().regex(/^[A-Za-z]{2}$/).default('IN')});
export type DiscoveryResult={source:string;retrievedAt:string;notice:string;items:{title:string;detail:string;url:string}[]};
const cache=new Map<string,{until:number;result:DiscoveryResult}>();
let cityNext=0;
const safeUrl=(v:string)=>/^https?:\/\//i.test(v)?v:'';
export async function publicJson(url:string,headers:Record<string,string>={}){
 try{const r=await fetch(url,{headers:{Accept:'application/json',...headers},redirect:'error',signal:AbortSignal.timeout(15000),cache:'no-store'});if(!r.ok)throw new Error();const raw=await r.text();if(raw.length>5_000_000)throw new Error();return JSON.parse(raw) as unknown;}catch{throw new AppError(502,'The data provider is unavailable or has reached its request limit. Please retry later.');}
}
export async function discover(input:unknown):Promise<DiscoveryResult>{
 const v=discoverySchema.parse(input),key=JSON.stringify(v),saved=cache.get(key);if(saved&&saved.until>Date.now())return saved.result;
 let result:DiscoveryResult={source:v.source,retrievedAt:new Date().toISOString(),notice:'',items:[]};
 try{
 if(v.source==='esco'){
  const url=new URL('https://ec.europa.eu/esco/api/search');url.search=new URLSearchParams({text:v.query,type:'skill',language:'en',limit:'15',selectedVersion:'v1.2.0'}).toString();
  const data=z.object({_embedded:z.object({results:z.array(z.object({title:z.string(),uri:z.string()}))})}).parse(await publicJson(url.href));
  result={...result,source:'European Commission ESCO',notice:'Suggested standard skill labels for review. These are not evidence of candidate proficiency.',items:data._embedded.results.map(x=>({title:x.title,detail:'ESCO skill concept',url:safeUrl(x.uri)}))};
 }else if(v.source==='worldbank'){
  const url=`https://api.worldbank.org/v2/country/${v.country.toUpperCase()}/indicator/FP.CPI.TOTL.ZG?format=json&mrnev=1`;
  const data=z.tuple([z.unknown(),z.array(z.object({date:z.string(),value:z.number().nullable(),country:z.object({value:z.string()})})).nullable()]).parse(await publicJson(url));
  result={...result,source:'World Bank',notice:'Annual national consumer-price inflation; not a city living budget or a salary benchmark.',items:(data[1]??[]).filter(x=>x.value!==null).map(x=>({title:x.country.value,detail:`${x.date}: ${x.value?.toFixed(2)}% annual consumer-price inflation`,url:'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG'}))};
 }else if(v.source==='openalex'){
  const url=new URL('https://api.openalex.org/works');url.search=new URLSearchParams({search:v.query,per_page:'10',filter:'is_oa:true',select:'id,title,publication_year'}).toString();if(process.env.OPENALEX_API_KEY)url.searchParams.set('api_key',process.env.OPENALEX_API_KEY);
  const data=z.object({results:z.array(z.object({id:z.string(),title:z.string().nullable(),publication_year:z.number().nullable()}))}).parse(await publicJson(url.href));
  result={...result,source:'OpenAlex · CC0',notice:'Open-access research for learning and decision context. Publications are not course-completion records.',items:data.results.map(x=>({title:x.title??'Untitled work',detail:`Published ${x.publication_year??'date unavailable'}`,url:safeUrl(x.id)}))};
 }else{
  if(!process.env.NOMINATIM_BASE_URL||!process.env.NOMINATIM_USER_AGENT)throw new AppError(503,'City lookup needs a configured Nominatim service and application contact.');
  const url=new URL('search',process.env.NOMINATIM_BASE_URL.replace(/\/?$/,'/'));if(url.protocol!=='https:')throw new AppError(503,'City lookup requires HTTPS.');
  if(url.hostname==='nominatim.openstreetmap.org')throw new AppError(503,'Use a hosted Nominatim service or a caching proxy that enforces application-wide usage limits. Direct public-service access is disabled.');
  if(Date.now()<cityNext)throw new AppError(429,'Please wait a moment before another city lookup.');cityNext=Date.now()+1100;
  url.search=new URLSearchParams({city:v.query,countrycodes:v.country.toLowerCase(),format:'jsonv2',addressdetails:'1',limit:'5'}).toString();
  const data=z.array(z.object({display_name:z.string(),lat:z.string(),lon:z.string()})).parse(await publicJson(url.href,{'User-Agent':process.env.NOMINATIM_USER_AGENT}));
  result={...result,source:'© OpenStreetMap contributors · ODbL',notice:'City identity and coordinates only. Company pay bands and verified city budgets remain the compensation evidence.',items:data.map(x=>({title:x.display_name,detail:`Latitude ${x.lat}, longitude ${x.lon}`,url:`https://www.openstreetmap.org/?mlat=${encodeURIComponent(x.lat)}&mlon=${encodeURIComponent(x.lon)}`}))};
 }
 }catch(e){if(e instanceof AppError)throw e;throw new AppError(502,'The provider returned an unexpected data format. No workforce records were changed.');}
 if(cache.size>=300)cache.delete(cache.keys().next().value!);cache.set(key,{until:Date.now()+86400000,result});return result;
}
