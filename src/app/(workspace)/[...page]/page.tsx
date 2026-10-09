import {WorkspacePage} from '@/components/workspace-page';
export default async function Page({params}:{params:Promise<{page:string[]}>}){const {page}=await params;return <WorkspacePage route={page}/>;}
