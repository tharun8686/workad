import {loadEnvConfig} from '@next/env';
import {Pool} from 'pg';
import {randomBytes} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
async function main(){
 loadEnvConfig(process.cwd());const connection=process.env.DATABASE_MIGRATION_URL;
 if(!connection)throw new Error('Save DATABASE_MIGRATION_URL first.');
 const pool=new Pool({connectionString:connection,max:1});
 try{
  for(const file of ['001_workforce.sql','002_access.sql','003_ingestion.sql'])await pool.query(await readFile('db/'+file,'utf8'));
  const exists=await pool.query("SELECT rolname FROM pg_roles WHERE rolname='workforce_app'");
  if(exists.rows.length)throw new Error('Application login already exists; use its existing connection rather than rotate it.');
  const password=randomBytes(32).toString('hex');
  await pool.query(`CREATE ROLE workforce_app LOGIN PASSWORD '${password}' IN ROLE workforce_runtime`);
  const url=new URL(connection);url.username='workforce_app';url.password=password;
  let env=await readFile('.env.local','utf8');
  const values={DATABASE_URL:url.toString(),BETTER_AUTH_SECRET:process.env.BETTER_AUTH_SECRET||randomBytes(48).toString('hex'),BETTER_AUTH_URL:'http://127.0.0.1:3000',LOCAL_SANDBOX:'0'};
  for(const [key,value] of Object.entries(values)){const pattern=new RegExp('^'+key+'=.*$','m');env=pattern.test(env)?env.replace(pattern,key+'='+value):env+'\n'+key+'='+value;}
  await writeFile('.env.local',env+'\n');
  console.log('Migrations applied; restricted application connection and authentication secret saved locally. No secret values printed.');
 }finally{await pool.end();}
}
main().catch(()=>{console.error('Setup did not complete. Check connection permissions and whether the application role already exists.');process.exitCode=1;});
