import {readFile} from 'node:fs/promises';
import path from 'node:path';
export type JobFeed={provider:string;retrievedAt:string;checksum:string;notice:string;jobs:{id:string;title:string;company:string;location:string;salaryText:string;publishedAt:string;url:string;jobType:string}[]};
export async function publicJobs():Promise<JobFeed>{return JSON.parse(await readFile(path.join(process.cwd(),'data','remote-jobs.json'),'utf8'));}
