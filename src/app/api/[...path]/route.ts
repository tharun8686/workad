import {embeddingConfig} from '@/server/embeddings';
import {discover} from '@/server/discovery';
import {connectorActor,importCourseEvents,importLmsExport,importPayPolicies} from '@/server/evidence-connectors';
import {checkResume} from '@/lib/intelligence';
import {decisionChallenge,intelligenceWorkspace,recordOutcome,savePayPolicy,payComparison,applicationChecks} from '@/server/intelligence';
import {verifyEmbeddings,extractDocument,indexProfiles,semanticSearch,semanticStatus} from '@/server/ai';
import {searchOccupations} from '@/server/occupations';
import {marketHistory,saveMarket,refreshMarket} from '@/server/market';
import {recruitmentWorkspace,registerProfile,inviteProfile,acceptInvitation,createJob,changeJob,addApplication,advanceApplication} from '@/server/recruitment';
import {learningCatalogue,refreshLearning} from '@/server/learning';
import {saveDocument} from '@/server/documents';
import {aiConfig,aiAvailable} from '@/server/ai-provider';

import {ingestOnet} from '@/server/public-data';

import {openapi} from '@/lib/openapi';

import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { actor, AppError, requireRole, verifyOrigin, localOwnerSetup } from '@/server/auth';

import { workspace,createRequirement,updateWeights,runScenario,decide,advanceAction,updateSkill,owned,catalogue,releaseReservation } from '@/server/repository';

import { transaction,sandboxEnabled } from '@/server/db';

import { inputSchema,scenarioSchema } from '@/lib/validation';

import { parseIntake } from '@/server/intake';

import {importRecords,importHistory} from '@/server/imports';

import { strategies,type Weights } from '@/lib/types';

export const runtime='nodejs';

export const dynamic='force-dynamic';

export const maxDuration=60;

type Context={params:Promise<{path:string[]}>};

async function handle(req:NextRequest,ctx:Context){

 try {

  const {path}=await ctx.params;const route=path.join('/');

  if(route==='openapi'&&req.method==='GET')return NextResponse.json(openapi);

  if(route==='configuration'&&req.method==='GET')return NextResponse.json({mode:sandboxEnabled()?'Local sandbox':'Connected',authConfigured:!!process.env.DATABASE_URL&&!!process.env.BETTER_AUTH_SECRET,githubEnabled:!!process.env.GITHUB_CLIENT_ID&&!!process.env.GITHUB_CLIENT_SECRET,emailSignUpEnabled:localOwnerSetup()||(!!process.env.RESEND_API_KEY&&!!process.env.EMAIL_FROM),localOwnerSetup:localOwnerSetup()});

  if(route==='registration'&&req.method==='POST'){verifyOrigin(req);const raw=await req.text();if(raw.length>20000)throw new AppError(413,'Profile too large.');let input;try{input=JSON.parse(raw);}catch{throw new AppError(400,'Invalid JSON.');}const v=z.object({token:z.string(),profile:z.unknown()}).parse(input);return NextResponse.json(await acceptInvitation(v.token,v.profile),{status:201});}
  if(route==='intelligence/course-webhook'&&req.method==='POST'){const raw=await req.text();if(raw.length>200000)throw new AppError(413,'Request is too large.');const connector=connectorActor(req.headers,raw);let body;try{body=JSON.parse(raw);}catch{throw new AppError(400,'Invalid JSON.');}return NextResponse.json(await importCourseEvents(connector,body,'signed connector'));}
  const a=await actor(req);if(req.method!=='GET')verifyOrigin(req);
  if(route==='access'&&req.method==='GET')return NextResponse.json({authorized:true},{headers:{'Cache-Control':'no-store'}});

  if(route==='resume/scan'&&req.method==='POST'){if(Number(req.headers.get('content-length')??0)>5_100_000)throw new AppError(413,'Document exceeds 5 MB.');const form=await req.formData();const file=form.get('file');if(!(file instanceof File))throw new AppError(422,'Choose a resume.');const years=z.coerce.number().min(0).max(80).parse(form.get('requiredYears'));const extracted=await extractDocument(a,file,form.get('authorized')==='true');return NextResponse.json({...extracted,checks:checkResume(extracted.draft,years)});}
  if(route==='documents'&&req.method==='POST'){if(Number(req.headers.get('content-length')??0)>5_100_000)throw new AppError(413,'Document exceeds 5 MB.');const form=await req.formData();const file=form.get('file');if(!(file instanceof File))throw new AppError(422,'Choose a file.');return NextResponse.json(await saveDocument(a,file,form.get('authorized')==='true'),{status:201});}
  if(req.method==='GET'){
    if(path[0]==='brief'&&path.length===2){const w=await workspace(a);const requirement=w.requirements.find(r=>r.id===path[1]);if(!requirement)throw new AppError(404,'Requirement not found.');return NextResponse.json({exportedAt:new Date().toISOString(),notice:'Decision support. Forecasts use disclosed assumptions; human approval and source review remain necessary.',requirement,decisions:w.decisions.filter(d=>d.requirementId===requirement.id),actions:w.actions.filter(x=>x.requirementId===requirement.id),sources:w.sources,outcomes:(await intelligenceWorkspace(a)).outcomes.filter(o=>o.requirementId===requirement.id)},{headers:{'Content-Disposition':'attachment; filename=workforce-brief.json','Cache-Control':'private, no-store'}});}
    if(route==='intelligence/challenge')return NextResponse.json(await decisionChallenge(a,req.nextUrl.searchParams.get('requirementId')??''));
    if(route==='intelligence')return NextResponse.json(await intelligenceWorkspace(a));
    if(route==='semantic/status')return NextResponse.json(await semanticStatus(a));
    if(route==='recruitment/checks')return NextResponse.json(await applicationChecks(a,req.nextUrl.searchParams.get('profileId')??'',req.nextUrl.searchParams.get('jobId')??''));
    if(route==='occupations')return NextResponse.json(await searchOccupations(req.nextUrl.searchParams.get('q')??''));
    if(route==='market-data')return NextResponse.json(await marketHistory(a));
    if(route==='recruitment')return NextResponse.json(await recruitmentWorkspace(a));
    if(path[0]==='documents'&&path.length===2){const row=(await transaction(a.id,q=>q<{content:Buffer;mime:string}>('SELECT content,mime FROM source_documents WHERE id=$1 AND owner_id=$2',[path[1],a.id]))).rows[0];if(!row)throw new AppError(404,'Document not found.');return new NextResponse(new Uint8Array(row.content),{headers:{'Content-Type':row.mime,'Content-Disposition':'attachment; filename=source-document.'+(row.mime==='application/pdf'?'pdf':'txt'),'Cache-Control':'private, no-store'}});}
    if(route==='learning')return NextResponse.json(await learningCatalogue(a));
    if(route==='documents')return NextResponse.json((await transaction(a.id,q=>q('SELECT id,filename,mime,checksum,created_at FROM source_documents WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 100',[a.id]))).rows);

    if(route==='services'){const c=aiConfig();return NextResponse.json({database:process.env.DATABASE_URL?'Configured':'Not configured',aiProvider:c.provider,aiModel:c.model??null,aiConfigured:aiAvailable(),aiStatus:'Configuration only; live access not verified',documents:c.provider==='gemini'?'Private documents stay local; use structured imports':'Provider document processing',embeddings:embeddingConfig().configured,enterprise:'CSV/JSON imports and accountable work items; no external execution',publicSource:'O*NET software skills, refreshed on request'});}

    if(route==='imports'){requireRole(a,['admin']);return NextResponse.json(await importHistory(a));}

    if(route==='workspace'||route==='requirements')return NextResponse.json(await workspace(a));

    if(path[0]==='requirements'&&path.length===2)return NextResponse.json(await transaction(a.id,q=>owned(q,path[1],a.id)));

    if(['market','locations','automation'].includes(path[0])||path[0]==='talent'){

      const id=path.at(-1)!;const r=await transaction(a.id,q=>owned(q,id,a.id));

      const observations=path[0]==='market'?(await marketHistory(a)).filter(x=>x.role.toLowerCase()===r.role.toLowerCase()&&x.location.toLowerCase()===r.location.toLowerCase()):[];
      const data=path[0]==='talent'?(path[1]==='internal'?r.analysis.internal:r.analysis.contractors):path[0]==='market'?{verified:{salary:null,timeToFill:null,supply:null,competition:null},reason:'Advertisement samples are separate from representative compensation, available supply and time-to-fill benchmarks.',observations,candidates:r.analysis.candidates}:path[0]==='locations'?r.analysis.locations:{repetitivePct:r.repetitivePct,source:'assumptions',residualDemand:Math.ceil(r.headcount*(1-r.repetitivePct/100)),technologies:['Workflow automation','Document processing','Rule-based processing']};

      return NextResponse.json(data);

    }

  }

  if(req.method==='POST'||req.method==='PATCH'){

    const raw=await req.text();if(raw.length>((route==='imports'||route==='market-data/import')?2_000_000:50000))throw new AppError(413,'Request is too large.');let body:unknown;try{body=JSON.parse(raw);}catch{throw new AppError(400,'Invalid JSON request.');}

    if(route==='intelligence/discover')return NextResponse.json(await discover(body));
    if(route==='intelligence/courses/import'){requireRole(a,['admin','reviewer']);return NextResponse.json(await importCourseEvents(a,body),{status:201});}
    if(route==='intelligence/lms/import'){requireRole(a,['admin','reviewer']);return NextResponse.json(await importLmsExport(a,body),{status:201});}
    if(route==='intelligence/pay-policies/import'){requireRole(a,['admin','reviewer']);return NextResponse.json(await importPayPolicies(a,body),{status:201});}
    if(route==='intelligence/outcomes'){requireRole(a,['admin','reviewer']);return NextResponse.json(await recordOutcome(a,body),{status:201});}
    if(route==='intelligence/pay-policies'){requireRole(a,['admin','reviewer']);return NextResponse.json(await savePayPolicy(a,body),{status:201});}
    if(route==='intelligence/pay-comparison')return NextResponse.json(await payComparison(a,body));
    if(route==='semantic/verify'){requireRole(a,['admin','reviewer']);z.object({authorized:z.literal(true)}).parse(body);return NextResponse.json(await verifyEmbeddings());}
    if(route==='semantic/index'){requireRole(a,['admin','reviewer']);z.object({authorized:z.literal(true)}).parse(body);return NextResponse.json(await indexProfiles(a));}
    if(route==='semantic/search'){const v=z.object({query:z.string().trim().min(2).max(2000),requirementId:z.string().optional(),authorized:z.literal(true)}).parse(body);return NextResponse.json(await semanticSearch(a,v.query,v.requirementId));}
    if(route==='market-data/import'){requireRole(a,['admin']);return NextResponse.json(await saveMarket(a,body),{status:201});}
    if(route==='market-data/refresh'){requireRole(a,['admin','reviewer']);return NextResponse.json(await refreshMarket(a,body),{status:201});}
    if(path[0]==='reservations'&&path.length===2){requireRole(a,['admin','reviewer']);const v=z.object({note:z.string().trim().min(20).max(2000)}).parse(body);return NextResponse.json(await releaseReservation(a,path[1],v.note));}
    if(route==='recruitment/profiles')return NextResponse.json(await registerProfile(a,body),{status:201});
    if(route==='recruitment/invitations')return NextResponse.json(await inviteProfile(a),{status:201});
    if(path[0]==='recruitment'&&path[1]==='jobs'){requireRole(a,['admin','reviewer']);return NextResponse.json(path.length===2?await createJob(a,body):await changeJob(a,path[2],body));}
    if(path[0]==='recruitment'&&path[1]==='applications'){requireRole(a,['admin','reviewer']);return NextResponse.json(path.length===2?await addApplication(a,body):await advanceApplication(a,path[2],body));}
    if(route==='imports'){requireRole(a,['admin']);return NextResponse.json(await importRecords(a,body));}

    if(route==='learning/refresh'){requireRole(a,['admin']);return NextResponse.json(await refreshLearning(a));}
    if(route==='sources/onet'){requireRole(a,['admin']);return NextResponse.json(await ingestOnet(a));}

    if(route==='requirements/analyze')return NextResponse.json(await createRequirement(a,inputSchema.parse(body)),{status:201});

    if(route==='intake/parse'){const v=z.object({text:z.string().min(10).max(8000),useAI:z.boolean(),nonConfidential:z.boolean().optional()}).parse(body);if(v.useAI&&aiConfig().provider==='gemini'&&!v.nonConfidential)throw new AppError(422,'Confirm this text contains no personal or confidential information before sending it to Gemini.');const c=await transaction(a.id,q=>catalogue(q));return NextResponse.json(await parseIntake(v.text,v.useAI,c.skills));}

    if(path[0]==='recommendation'){const v=z.object({weights:z.record(z.enum(strategies),z.record(z.string(),z.number().min(0).max(1)))}).parse(body);return NextResponse.json(await updateWeights(a,path[1],v.weights as Weights));}

    if(path[0]==='scenarios'){const v=z.object({input:scenarioSchema,save:z.boolean()}).parse(body);return NextResponse.json(await runScenario(a,path[1],v.input,v.save),{status:v.save?201:200});}

    if(path[0]==='decisions'){requireRole(a,['admin','reviewer']);const v=z.object({outcome:z.enum(['Approved','Modified','Rejected']),selected:z.enum([...strategies,'BUILD + BORROW']),comment:z.string().trim().min(5).max(4000),authorizeSourcing:z.boolean().optional()}).parse(body);return NextResponse.json(await decide(a,path[1],v.outcome,v.selected,v.comment,v.authorizeSourcing),{status:201});}

    if(path[0]==='actions'){requireRole(a,['admin','reviewer']);const v=z.object({status:z.enum(['Pending','In Progress','Completed','Failed','Cancelled']),note:z.string().trim().min(3).max(2000),owner:z.string().trim().min(2).max(100).optional()}).parse(body);return NextResponse.json(await advanceAction(a,path[1],v.status,v.note,v.owner));}

    if(path[0]==='skills'){requireRole(a,['admin']);const v=z.object({aliases:z.array(z.string().trim().min(1).max(80)).max(30),reviewId:z.string().optional(),training:z.object({days:z.number().int().min(0).max(3650).nullable(),cost:z.number().min(0).max(10000000).nullable(),evidence:z.string().trim().min(20).max(2000)}).refine(t=>(t.days===null)===(t.cost===null),'Supply both duration and cost, or clear both.').optional()}).parse(body);return NextResponse.json(await updateSkill(a,path[1],v.aliases,v.reviewId,v.training));}

  }

  throw new AppError(404,'Endpoint not found.');

 }catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:e.issues.map(i=>i.message).join(' ')},{status:422});if(e instanceof AppError)return NextResponse.json({error:e.message},{status:e.status});if(e instanceof Error&&/Weights|criteria|criterion/.test(e.message))return NextResponse.json({error:e.message},{status:422});console.error('Request failed:',e);return NextResponse.json({error:'The operation could not be completed. Check the database configuration and retry.'},{status:500});}

}

export const GET=handle;export const POST=handle;export const PATCH=handle;

