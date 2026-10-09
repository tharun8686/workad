import {loadEnvConfig} from '@next/env';
import {migrate,pool} from '../src/server/db';
import {readFile} from 'node:fs/promises';
async function main(){loadEnvConfig(process.cwd());if(process.env.DATABASE_MIGRATION_URL)process.env.DATABASE_URL=process.env.DATABASE_MIGRATION_URL;await migrate();if(process.env.DATABASE_URL)await pool().query(await readFile('db/002_access.sql','utf8'));if(process.env.DATABASE_URL)await pool().query(await readFile('db/003_ingestion.sql','utf8'));if(process.env.DATABASE_URL)await pool().query(await readFile('db/004_recruitment.sql','utf8'));if(process.env.DATABASE_URL)await pool().query(await readFile('db/005_intelligence.sql','utf8'));if(process.env.DATABASE_URL)await pool().query(await readFile('db/006_learning_evidence.sql','utf8'));console.log('Workforce schema migration completed.');if(process.env.DATABASE_URL)await pool().end();}
main().then(()=>process.exit(0)).catch(e=>{console.error('Migration failed:',e instanceof Error?e.message:'Unknown error');process.exit(1);});


