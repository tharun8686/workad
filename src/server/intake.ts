import { z } from 'zod';

import { defaultInput, roles, skills, locations } from '@/lib/catalogue';

import type { RequirementInput } from '@/lib/types';

import { AppError } from './auth';

import {generateStructured,ProviderError} from './ai-provider';

const extractionSchema=z.object({role:z.string().nullable(),headcount:z.number().nullable(),location:z.string().nullable(),budget:z.number().nullable(),deadline:z.number().nullable(),experienceMin:z.number().nullable(),experienceMax:z.number().nullable(),mandatorySkills:z.array(z.string()),optionalSkills:z.array(z.string())});

export async function parseIntake(text:string,useAI:boolean,catalogue=skills){

  if(useAI){

    try{

      const {result,provider}=await generateStructured(extractionSchema,'Extract only explicitly stated workforce requirements. Return null for missing values. Budget is annual INR lakh per person, deadline is days. Do not score, recommend, or invent evidence.',text);

      return {method:provider+' structured extraction',fields:result,missing:'Review every field before analysis; blank fields need your input.'};

    }catch(e){if(e instanceof ProviderError)throw new AppError(e.status,e.message);throw e;}



  }

  const lower=text.toLowerCase();const found=catalogue.filter(s=>[s.name,...s.aliases].some(a=>new RegExp('(^|[^a-z0-9])'+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^a-z0-9])','i').test(text))).map(s=>s.name);

  return {method:'Dictionary and pattern extraction · no LLM',fields:{role:roles.find(r=>lower.includes(r.toLowerCase()))??roles.find(r=>lower.includes(r.replace('Engineer','engineers').toLowerCase()))??null,headcount:Number(text.match(/(?:need|hire|require)\s+(\d+)/i)?.[1])||null,location:locations.find(l=>lower.includes(l.toLowerCase()))??(lower.includes('bangalore')?'Bengaluru':null),budget:Number(text.match(/(\d+(?:\.\d+)?)\s*(?:lpa|lakh)/i)?.[1])||null,deadline:Number(text.match(/(\d+)\s*days/i)?.[1])||null,experienceMin:Number(text.match(/(\d+)\s*[-–]\s*\d+\s*years/i)?.[1])||null,experienceMax:Number(text.match(/\d+\s*[-–]\s*(\d+)\s*years/i)?.[1])||null,mandatorySkills:found,optionalSkills:[]},missing:'Only recognized values were extracted. Other fields retain the visible form values; review them before analysis.'};

}

