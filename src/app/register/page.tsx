'use client';
import {useEffect,useState} from 'react';
import {ProfileForm} from '@/components/profile-form';
export default function Register(){const[token,setToken]=useState('');useEffect(()=>{setToken(window.location.hash.slice(1));},[]);async function save(profile:unknown){const response=await fetch('/api/registration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,profile})});const body=await response.json();if(!response.ok)throw new Error(body.error??'Registration failed.');window.history.replaceState(null,'','/register');return body;}
 return <main style={{maxWidth:900,margin:'40px auto',padding:24}}><h1>Register your talent profile</h1><p>This private invitation saves your information in the inviting planner's workspace. It does not send your profile to an AI provider. Participation does not guarantee an interview, employment or engagement.</p>{/^[a-f0-9]{64}$/.test(token)?<ProfileForm save={save}/>:<p>Open the complete invitation link supplied by your planner. Links expire after seven days and can be used once.</p>}</main>;
}
