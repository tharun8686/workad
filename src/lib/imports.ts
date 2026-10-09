import {z} from 'zod';
import {levels} from './intelligence';
const measured=z.number().finite().min(0).max(100);
export const recordSchema=z.object({
 company:z.string().trim().min(2).max(160).optional(),level:z.enum(levels).optional(),
 externalId:z.string().trim().min(1).max(160), name:z.string().trim().min(1).max(160),
 kind:z.enum(['employee','candidate','contractor']),role:z.string().trim().min(1).max(160),
 location:z.string().trim().min(1).max(160),experience:z.number().min(0).max(80),
 salary:z.number().nonnegative(),rate:z.number().nonnegative(),availability:z.number().int().min(0).max(3650),
 performance:measured,learning:measured,promotionEligible:z.boolean(),
 conversionInterest:z.enum(['Yes','No','Unknown']).optional(),
 skills:z.record(z.string().min(1).max(160),measured),projects:z.array(z.string().max(250)).max(100),
 certifications:z.array(z.string().max(250)).max(100)
}).superRefine((v,c)=>{if(v.kind==='contractor'?v.rate<=0:v.salary<=0)c.addIssue({code:'custom',message:'Provide the actual annual salary in INR lakh or contractor hourly rate in INR.'});});
export const importSchema=z.object({source:z.string().trim().min(3).max(250),authority:z.string().trim().min(10).max(1000),observedAt:z.iso.datetime(),records:z.array(recordSchema).min(1).max(1000),confirm:z.boolean()});
// RFC 4180 quoted fields, embedded newlines and escaped quotes. No evaluation of spreadsheet formulas.
export function parseCSV(text:string):Record<string,string>[] {
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell.length)throw new Error('Unexpected quote in CSV field.');else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw new Error('Unclosed quoted CSV field.');row.push(cell);if(row.some(Boolean))rows.push(row);
 const header=rows.shift()?.map((s,i)=>(i===0?s.replace(/^\uFEFF/,''):s).trim());if(!header?.length||new Set(header).size!==header.length)throw new Error('CSV needs unique column headers.');
 return rows.map((r,i)=>{if(r.length!==header.length)throw new Error(`CSV row ${i+2} has ${r.length} fields; expected ${header.length}.`);return Object.fromEntries(header.map((h,j)=>[h,r[j]]));});
}
export function csvRecords(text:string){return parseCSV(text).map(r=>{const v:Record<string,unknown>={...r};for(const k of ['experience','salary','rate','availability','performance','learning'])v[k]=r[k]?.trim()?Number(r[k]):null;v.promotionEligible=r.promotionEligible==='true'?true:r.promotionEligible==='false'?false:null;for(const k of ['skills','projects','certifications']){try{v[k]=JSON.parse(r[k]);}catch{throw new Error(`${k} must contain valid JSON.`);}}return v;});}
export const importHeaders='externalId,name,kind,role,location,experience,salary,rate,availability,performance,learning,promotionEligible,skills,projects,certifications';
