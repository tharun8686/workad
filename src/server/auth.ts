import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { pool, sandboxEnabled } from './db';
import type { NextRequest } from 'next/server';
let instance:ReturnType<typeof betterAuth>|undefined;
export function auth(){
  if(!process.env.BETTER_AUTH_SECRET||!process.env.BETTER_AUTH_URL)throw new Error('Authentication is not configured.');
  const options:BetterAuthOptions={database:pool(),secret:process.env.BETTER_AUTH_SECRET,baseURL:process.env.BETTER_AUTH_URL,emailAndPassword:{enabled:true,minPasswordLength:12,requireEmailVerification:!localOwnerSetup(),disableSignUp:!process.env.RESEND_API_KEY&&!localOwnerSetup()},emailVerification:{sendOnSignUp:!localOwnerSetup(),sendVerificationEmail:async({user,url})=>{if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)throw new Error('Email verification delivery is not configured.');const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[user.email],subject:'Verify your Workforce Advisory account',text:`Verify your email to access Workforce Advisory: ${url}`}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('Verification email could not be sent.');}},socialProviders:process.env.GITHUB_CLIENT_ID&&process.env.GITHUB_CLIENT_SECRET?{github:{clientId:process.env.GITHUB_CLIENT_ID,clientSecret:process.env.GITHUB_CLIENT_SECRET}}:{},rateLimit:{enabled:true,window:60,max:30},advanced:{useSecureCookies:process.env.NODE_ENV==='production'}};
  return instance??=betterAuth(options);
}
export class AppError extends Error {constructor(public status:number,message:string){super(message);}}
export type Actor={id:string;name:string;role:'admin'|'reviewer'|'planner';};
const list=(key:string)=>(process.env[key]??'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
export function localOwnerSetup(){try{return process.env.NODE_ENV!=='production'&&!!process.env.LOCAL_OWNER_EMAIL&&['127.0.0.1','localhost'].includes(new URL(process.env.BETTER_AUTH_URL??'').hostname);}catch{return false;}}
export async function actor(req:NextRequest):Promise<Actor>{
  if(sandboxEnabled()){
    if(!['localhost','127.0.0.1','[::1]'].includes(new URL(req.url).hostname))throw new AppError(403,'The local sandbox is available only on this computer.');
    return {id:'local-workspace',name:'Local workspace',role:'admin'};
  }
  if(!process.env.DATABASE_URL||!process.env.BETTER_AUTH_SECRET)throw new AppError(503,'Connect Neon and configure authentication to open this workspace.');
  const session=await auth().api.getSession({headers:req.headers});if(!session)throw new AppError(401,'Please sign in to continue.');
  if(!session.user.emailVerified&&!(localOwnerSetup()&&session.user.email.trim().toLowerCase()===process.env.LOCAL_OWNER_EMAIL?.trim().toLowerCase()))throw new AppError(403,localOwnerSetup()?`Signed in as ${session.user.email}. This local workspace requires the configured owner account. Sign in with the owner email instead.`:'Verify your email before accessing this workspace.');
  const email=session.user.email.toLowerCase();if(!list('WORKSPACE_EMAILS').includes(email))throw new AppError(403,'Your account has not been granted workspace access.');
  return {id:session.user.id,name:session.user.name,role:list('ADMIN_EMAILS').includes(email)?'admin':list('REVIEWER_EMAILS').includes(email)?'reviewer':'planner'};
}
export function requireRole(a:Actor,roles:Actor['role'][]){if(!roles.includes(a.role))throw new AppError(403,'This action requires an authorized reviewer or administrator.');}
export function verifyOrigin(req:NextRequest){const origin=req.headers.get('origin');const expected=process.env.BETTER_AUTH_URL?new URL(process.env.BETTER_AUTH_URL).origin:sandboxEnabled()?`http://${req.headers.get('host')??new URL(req.url).host}`:new URL(req.url).origin;if(!origin||origin!==expected)throw new AppError(403,'Request origin is not permitted.');}


