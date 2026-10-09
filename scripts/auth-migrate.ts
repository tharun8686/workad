import {loadEnvConfig} from '@next/env';
import {getMigrations} from 'better-auth/db/migration';
import {auth} from '../src/server/auth';
import {pool} from '../src/server/db';
async function main(){loadEnvConfig(process.cwd());if(process.env.DATABASE_MIGRATION_URL)process.env.DATABASE_URL=process.env.DATABASE_MIGRATION_URL;if(!process.env.DATABASE_URL)throw new Error('A user-owned PostgreSQL connection is required.');const migrations=await getMigrations(auth().options);await migrations.runMigrations();await pool().query('GRANT SELECT,INSERT,UPDATE,DELETE ON "user",session,account,verification TO workforce_runtime');console.log('Better Auth schema migration completed. No accounts were created.');await pool().end();}
main().then(()=>process.exit(0)).catch(e=>{console.error('Authentication migration failed:',e instanceof Error?e.message:'Unknown error');process.exit(1);});
