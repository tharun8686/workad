import type {Skill,RequirementInput} from './types';
export const skills:Skill[]=[];
export const roles:string[]=[];
export const locations=['Bengaluru','Hyderabad','Pune','Chennai','Delhi NCR','Remote'];
export const defaultInput:RequirementInput={role:'',headcount:1,location:'Bengaluru',budget:0,deadline:30,experienceMin:0,experienceMax:50,mandatorySkills:[],optionalSkills:[],skillWeights:{},businessUnit:'',priority:'Standard',durationMonths:12,repetitivePct:0,remoteAllowed:false,rawText:''};
export const stageNames = ['Requirement intake','Evidence collection','Skill normalization','Requirement analysis','Internal talent','Contractor capacity','External market','Location comparison','Automation feasibility','Strategy scoring','Explanation & evidence','Dashboard update','Human decision','Action execution'];
