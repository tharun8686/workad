const {mkdir,writeFile}=require('node:fs/promises');
const {createHash}=require('node:crypto');
(async()=>{
 const url='https://learn.microsoft.com/api/catalog/?locale=en-us&type=modules';
 const response=await fetch(url,{signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw new Error('Official catalogue download failed: '+response.status);
 const raw=await response.text();const data=JSON.parse(raw);
 if(!Array.isArray(data.modules)||!data.modules.length)throw new Error('Unexpected catalogue format');
 const modules=data.modules.map(m=>({uid:m.uid,title:m.title,url:m.url,duration_in_minutes:m.duration_in_minutes,levels:m.levels,products:m.products,last_modified:m.last_modified})).filter(m=>typeof m.title==='string'&&typeof m.uid==='string'&&typeof m.duration_in_minutes==='number'&&Array.isArray(m.levels)&&Array.isArray(m.products)&&typeof m.last_modified==='string'&&new URL(m.url).protocol==='https:'&&new URL(m.url).hostname==='learn.microsoft.com');
 if(!modules.length)throw new Error('No usable official records');
 await mkdir('data',{recursive:true});
 await writeFile('data/microsoft-learn.json',JSON.stringify({modules,retrievedAt:new Date().toISOString(),checksum:createHash('sha256').update(raw).digest('hex'),url}));
 console.log('Saved '+modules.length+' official Microsoft Learn modules.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
