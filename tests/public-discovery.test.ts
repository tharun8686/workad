import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discover} from '../src/server/discovery';
import {fetchLearnModules,parseLearnPage} from '../src/server/learn-platform';

test('public discovery validates responses, caches results and preserves economic scope',async t=>{
 let calls=0;
 t.mock.method(globalThis,'fetch',async(input:string|URL|Request)=>{calls++;const url=String(input);return Response.json(url.includes('esco')?{_embedded:{results:[{title:'data analysis',uri:'http://data.europa.eu/esco/skill/test'}]}}:[{},[{date:'2025',value:4.1,country:{value:'India'}}]]);});
 const result=await discover({source:'esco',query:'data analysis'});assert.equal(result.items[0].title,'data analysis');await discover({source:'esco',query:'data analysis'});assert.equal(calls,1);
 const economic=await discover({source:'worldbank',query:'inflation'});assert.match(economic.items[0].detail,/2025: 4.10%/);assert.match(economic.notice,/not a city/);
 await assert.rejects(discover({source:'worldbank',query:'inflation',country:'../../evil'}));
});
test('provider failures and unsafe research links are handled',async t=>{
 t.mock.method(globalThis,'fetch',async()=>Response.json({results:[{id:'javascript:alert(1)',title:'Research',publication_year:2025}]}));
 assert.equal((await discover({source:'openalex',query:'unique research'})).items[0].url,'');
 await assert.rejects(discover({source:'esco',query:'malformed response'}),/unexpected data format/);
});
test('Microsoft module adapter preserves existing catalogue format and rejects unsafe links',()=>{
 const row={id:'module-1',title:'Data',url:'https://learn.microsoft.com/training/modules/data',durationInMinutes:42,levels:[{id:'beginner'}],products:[{id:'azure'}],updatedAt:'2026-10-01'};
 assert.equal(parseLearnPage({value:[row]}).modules[0].duration_in_minutes,42);
 assert.throws(()=>parseLearnPage({value:[{...row,url:'https://evil.example'}]}));
});
test('Microsoft connector does not send credentials to an untrusted pagination host',async t=>{
 const keys=['MICROSOFT_LEARN_TENANT_ID','MICROSOFT_LEARN_CLIENT_ID','MICROSOFT_LEARN_CLIENT_SECRET'];const previous=keys.map(k=>process.env[k]);t.after(()=>keys.forEach((k,i)=>{if(previous[i]===undefined)delete process.env[k];else process.env[k]=previous[i];}));keys.forEach((k,i)=>{process.env[k]=['tenant','client','test-secret'][i];});
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json(calls===1?{access_token:'test-token'}:{value:[],nextLink:'https://evil.example/steal'});});
 await assert.rejects(fetchLearnModules(),/unexpected pagination/);assert.equal(calls,2);
});
