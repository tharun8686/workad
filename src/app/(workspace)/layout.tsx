import {Shell} from '@/components/shell';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {NextRequest} from 'next/server';
import {actor,AppError} from '@/server/auth';
export default async function WorkspaceLayout({children}:{children:React.ReactNode}){const h=await headers();const base=process.env.BETTER_AUTH_URL??`http://${h.get('host')??'localhost:3000'}`;let failure='';try{await actor(new NextRequest(base,{headers:h}));}catch(e){failure=e instanceof AppError?e.message:'Workspace access could not be checked. Please retry or check the database connection.';}if(failure)redirect('/login?error='+encodeURIComponent(failure));return <Shell>{children}</Shell>;}
