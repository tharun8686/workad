'use client';
import {createContext,useContext,useEffect,useState,useCallback,type ReactNode} from 'react';
import type {Workspace} from '@/lib/types';
type State={data:Workspace|null;loading:boolean;error:string;refresh:()=>Promise<void>;mutate:<T>(path:string,body:unknown)=>Promise<T>};
const Context=createContext<State|null>(null);
export async function api<T>(path:string,body?:unknown):Promise<T>{const response=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const data=await response.json();if(!response.ok){if(response.status===401)window.location.href='/login';throw new Error(data.error??data.message??'Request failed.');}return data;}
export function WorkspaceProvider({children}:{children:ReactNode}){const[data,setData]=useState<Workspace|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState('');const refresh=useCallback(async()=>{try{setData(await api<Workspace>('workspace'));setError('');}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[]);useEffect(()=>{void refresh();},[refresh]);const mutate=async<T,>(path:string,body:unknown)=>{const result=await api<T>(path,body);await refresh();return result;};return <Context.Provider value={{data,loading,error,refresh,mutate}}>{children}</Context.Provider>;}
export function useWorkspace(){const c=useContext(Context);if(!c)throw new Error('Workspace provider missing');return c;}
