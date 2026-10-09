'use client';

import {useEffect,useState} from 'react';

import Link from 'next/link';

import {ArrowRight,ShieldCheck} from 'lucide-react';

import {createAuthClient} from 'better-auth/react';

import {Button} from '@/components/ui/button';

const client=createAuthClient();

type Configuration={mode:string;authConfigured:boolean;githubEnabled:boolean;emailSignUpEnabled:boolean;localOwnerSetup:boolean};

export default function Login(){

 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[signup,setSignup]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[config,setConfig]=useState<Configuration|null>(null);

 useEffect(()=>{const reason=new URLSearchParams(window.location.search).get('error');if(reason)setError(reason);fetch('/api/configuration').then(r=>r.json()).then(setConfig).catch(()=>setError('Unable to load workspace configuration.'));},[]);

 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setMessage('');try{const normalizedEmail=email.trim().toLowerCase();if(!signup){const signedOut=await client.signOut();if(signedOut.error)throw new Error('Unable to clear the previous session. Refresh and retry.');}const result=signup?await client.signUp.email({email:normalizedEmail,password,name,callbackURL:'/login'}):await client.signIn.email({email:normalizedEmail,password});if(result.error)throw new Error(result.error.message??'Unable to sign in.');if(signup){setMessage(config?.localOwnerSetup?'Account created. Local workspace access is restricted to the configured owner email. Sign in with that account.':'Check your email for the verification link, then sign in.');setSignup(false);setBusy(false);}else{const access=await fetch('/api/access',{cache:'no-store'});if(!access.ok){const body=await access.json();throw new Error(body.error??'Workspace access could not be checked.');}window.location.href='/dashboard';}}catch(e){setError((e as Error).message);setBusy(false);}}

 async function github(){setError('');setBusy(true);try{const result=await client.signIn.social({provider:'github',callbackURL:'/dashboard'});if(result.error)throw new Error(result.error.message??'Unable to sign in with GitHub.');}catch(e){setError((e as Error).message);setBusy(false);}}

 return <div className="login-page"><div className="login-intro"><Link className="brand" href="/"><span className="brand-mark">w<span>.</span></span><span>Workforce<br/><strong>Advisory</strong></span></Link><div><div className="eyebrow">WORKFORCE STRATEGY, WITH PERSPECTIVE</div><h1>The right people.<br/>The right approach.</h1><p>Bring evidence, alternatives and human judgment together before the next hiring decision.</p><div className="login-strategies">BUILD <span>/</span> BUY <span>/</span> BORROW<br/>AUTOMATE <span>/</span> RELOCATE</div></div><small>Workforce Advisory · Evidence before action</small></div><div className="login-form"><div><ShieldCheck size={25}/><h2>{signup?'Create your account':'Welcome to your workspace'}</h2><p>{signup?'Use your own email and a private password.':'Sign in to review workforce decisions and track execution.'}</p>

 {config?.githubEnabled&&<div className="stacked-buttons"><Button disabled={busy} onClick={()=>void github()}>Continue with GitHub <ArrowRight size={15}/></Button></div>}

 <form onSubmit={submit}>{signup&&<label className="field"><span>Your name</span><input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label>}<label className="field"><span>Work email</span><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="field"><span>Password</span><input type="password" required minLength={12} autoComplete={signup?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p className="form-error" role="alert">{error}</p>}{message&&<p className="success-message" role="status">{message}</p>}<Button disabled={busy||!config?.authConfigured} type="submit">{busy?'Please wait…':signup?'Create account':'Sign in'}<ArrowRight size={15}/></Button></form>

 {config?.emailSignUpEnabled&&<button className="login-switch" onClick={()=>setSignup(!signup)}>{signup?'Already registered? Sign in':'Create your own account'}</button>}

 {!config?.authConfigured&&<p className="muted small">Cloud authentication will be available after your Neon database and workspace access are configured.</p>}

 {config?.mode==='Local sandbox'&&<div className="sandbox-entry"><strong>Local prototype workspace</strong><p>Explore synthetic data on this computer. This is an explicit local sandbox, with no account or shared credentials.</p><Button asChild variant="secondary"><Link href="/dashboard">Open local sandbox <ArrowRight size={14}/></Link></Button></div>}

 <p className="small muted">{config?.localOwnerSetup?'Local owner mode: the configured owner can sign in without email verification. Other accounts do not receive owner access.':'Workspace access requires a verified email on the owner’s configured allowlist.'}</p></div></div></div>;

}


