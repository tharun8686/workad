const fs=require('node:fs/promises');
const crypto=require('node:crypto');
const file='data/remote-jobs.json';
(async()=>{
 try{const old=JSON.parse(await fs.readFile(file,'utf8'));if(Date.now()-Date.parse(old.retrievedAt)<6*60*60*1000){console.log('Using existing remote-job snapshot; minimum refresh interval is six hours.');return;}}catch(e){if(e.code!=='ENOENT')throw e;}
 const source='https://remotive.com/api/remote-jobs?category=software-dev&limit=100';
 const response=await fetch(source,{signal:AbortSignal.timeout(45000)});if(!response.ok)throw new Error('Public job feed returned '+response.status);
 const raw=await response.text();const data=JSON.parse(raw);if(!Array.isArray(data.jobs))throw new Error('Unexpected job-feed format');
 const jobs=data.jobs.map(j=>{const url=new URL(j.url);if(url.protocol!=='https:'||url.hostname!=='remotive.com')throw new Error('Unexpected source URL');return {id:String(j.id),title:String(j.title),company:String(j.company_name),location:String(j.candidate_required_location||'Not specified'),salaryText:String(j.salary||''),publishedAt:String(j.publication_date||''),url:url.href,jobType:String(j.job_type||'Not specified')};});
 const snapshot={source,provider:'Remotive',retrievedAt:new Date().toISOString(),checksum:crypto.createHash('sha256').update(raw).digest('hex'),notice:'Remotive public API advertisements are delayed by 24 hours. Location restrictions and salary text are preserved as published. These advertisements measure demand, not available talent supply or verified Indian compensation benchmarks.',jobs};
 await fs.mkdir('data',{recursive:true});await fs.writeFile(file,JSON.stringify(snapshot,null,2));console.log(JSON.stringify({jobs:jobs.length,retrievedAt:snapshot.retrievedAt,checksum:snapshot.checksum}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
