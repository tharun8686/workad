'use client';
import {useEffect,useState} from 'react';
import {api} from './workspace-context';
import {Badge,money} from './common';
import type {applicationChecks} from '@/server/intelligence';
export function ApplicantEvidence({profileId,jobId}:{profileId:string;jobId:string}){
 const [result,setResult]=useState<Awaited<ReturnType<typeof applicationChecks>>|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;api<Awaited<ReturnType<typeof applicationChecks>>>('recruitment/checks?profileId='+encodeURIComponent(profileId)+'&jobId='+encodeURIComponent(jobId)).then(r=>{if(active)setResult(r);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[profileId,jobId]);
 return <section aria-label="Applicant evidence"><h3>Resume consistency & peer comparison</h3>{error&&<p role="alert">{error}</p>}{!result&&!error&&<p>Checking supplied timeline and internal comparison group…</p>}{result&&<><Badge tone={result.flags.length?'warning':'neutral'}>{result.status}</Badge><p>{result.notice}</p>{result.flags.map(f=><p key={f.code}>{f.message}</p>)}<p>Comparison: {result.company??'Hiring company not recorded'} · {result.targetLevel} · {result.peerCount} internal employees in the same role family and level.</p>{result.peerCount<3?<p>At least three comparable employees are needed to expose aggregated skill benchmarks.</p>:result.skillComparison.map(s=><p key={s.skill}>{s.skill}: candidate {s.claimed?'claims skill (unassessed)':'has not listed skill'}; internal assessed average {s.internalAverage}%.</p>)}{result.pay&&<p>{result.pay.feasible?`Common city pay target: ${money(result.pay.target!)} / month.`:result.pay.policy?'Budget does not meet the evidenced pay floor.':'No company pay band recorded for this city and level.'} Salary history does not determine the offer.</p>}</>}</section>;
}
