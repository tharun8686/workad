// Artificial test fixtures only. Never imported by application code.
import {makePeople,skills as baseSkills,sources,locations} from './catalogue';
import type {Query} from '../../src/server/db';
const json=JSON.stringify;
export async function seedCatalogue(q:Query){
  if((await q('SELECT id FROM data_sources LIMIT 1')).rows.length)return;
  for(const s of sources)await q('INSERT INTO data_sources(id,name,url,type,licence,retrieved_at,fields_fed,payload) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[s.id,s.name,s.url,s.type,s.license,s.retrieved,json(s.fields),json(s)]);
  for(const s of baseSkills)await q('INSERT INTO skills(id,name,normalized_name,category,aliases,payload) VALUES($1,$2,$3,$4,$5,$6)',[s.id,s.name,s.name.toLowerCase(),s.category,s.aliases,json(s)]);
  for(const p of makePeople()){
    if(p.kind==='employee')await q('INSERT INTO employees(id,name,"current_role",location,experience_years,availability,salary,performance_score,source_id,payload) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[p.id,p.name,p.role,p.location,p.experience,p.availability,p.salary,p.performance,p.sourceId,json(p)]);
    if(p.kind==='contractor')await q('INSERT INTO contractors(id,name,role,location,rate_per_hour,availability,past_performance,source_id,payload) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[p.id,p.name,p.role,p.location,p.rate,p.availability,p.performance,p.sourceId,json(p)]);
    if(p.kind==='candidate')await q('INSERT INTO ats_candidates(id,name,role,location,experience_years,expected_salary,availability,source_id,payload) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[p.id,p.name,p.role,p.location,p.experience,p.salary,p.availability,p.sourceId,json(p)]);
    const table=p.kind==='employee'?'employee_skills':p.kind==='contractor'?'contractor_skills':'candidate_skills';const key=p.kind==='employee'?'employee_id':p.kind==='contractor'?'contractor_id':'candidate_id';
    for(const [name,proficiency] of Object.entries(p.skills))await q(`INSERT INTO ${table}(${key},skill_id,proficiency) VALUES($1,$2,$3)`,[p.id,baseSkills.find(s=>s.name===name)!.id,proficiency]);
    if(p.kind==='employee'){
      await q('INSERT INTO employee_availability(employee_id,available_after_days,source_id) VALUES($1,$2,$3)',[p.id,p.availability,'hris']);
      for(const name of p.projects){await q('INSERT INTO projects(id,name) VALUES($1,$2) ON CONFLICT DO NOTHING',[name.toLowerCase().replaceAll(' ','-'),name]);await q('INSERT INTO employee_projects(employee_id,project_id) VALUES($1,$2)',[p.id,name.toLowerCase().replaceAll(' ','-')]);}
      await q('INSERT INTO certifications(id,employee_id,name,source_id) VALUES($1,$2,$3,$4)',[`cert-${p.id}`,p.id,p.certifications[0],'lms']);
    }
  }
  for(const city of locations)await q('INSERT INTO locations(city,country) VALUES($1,$2)',[city,'India']);
}
