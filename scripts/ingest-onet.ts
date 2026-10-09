import {loadEnvConfig} from '@next/env';
import {readFile} from 'node:fs/promises';
import {ingestOnet} from '../src/server/public-data';
loadEnvConfig(process.cwd());
readFile('.local/datasets/onet-software-skills.csv','utf8').then(text=>ingestOnet({id:'public-data-maintainer',name:'Official dataset import',role:'admin'},text)).then(r=>{console.log(JSON.stringify(r));process.exit(0);}).catch(e=>{console.error(e instanceof Error?e.message:'Import failed');process.exit(1);});
