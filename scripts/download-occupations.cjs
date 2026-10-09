const {mkdir,writeFile}=require('node:fs/promises');
const {createHash}=require('node:crypto');
async function main(){
 await mkdir('data/onet',{recursive:true});
 const files=['occupation_data.csv','job_titles.csv','task_statements.csv','software_skills.csv'];const manifest=[];
 for(const file of files){const url='https://www.onetcenter.org/dl_files/database/db_31_0_csv/'+file;const response=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw new Error(file+': '+response.status);const bytes=Buffer.from(await response.arrayBuffer());await writeFile('data/onet/'+file,bytes);manifest.push({file,url,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});console.log('Downloaded '+file);}
 await writeFile('data/onet/manifest.json',JSON.stringify({version:'31.0',retrievedAt:new Date().toISOString(),attribution:'O*NET 31.0, USDOL/ETA, CC BY 4.0. Adapted for title lookup and task display; no endorsement.',files:manifest},null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
