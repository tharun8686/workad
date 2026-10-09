'use client';

import Link from 'next/link';

import {useState} from 'react';

import {Plus,ArrowUpRight,ArrowRight,Users,Clock3,Wallet,GitBranch,CheckCircle2} from 'lucide-react';

import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,CartesianGrid,Cell} from 'recharts';

import {useWorkspace} from './workspace-context';

import {PageHeader,Panel,Badge,SourceNote,DataTable,lakh,Empty} from './common';

import {Button} from './ui/button';

import {strategies,type Requirement} from '@/lib/types';

const labels={BUILD:'Develop internally',BUY:'Hire externally',BORROW:'Engage contractors',AUTOMATE:'Automate work',RELOCATE:'Change location'};

export function RequirementTable({rows}:{rows:Requirement[]}){return <DataTable rows={rows} search={r=>`${r.id} ${r.role} ${r.businessUnit} ${r.location} ${r.status}`} placeholder="Search requirements…" columns={[

 {key:'role',label:'Requirement',value:r=>r.role,render:r=><Link className="table-primary" href={'/requirements/'+r.id}><strong>{r.role}</strong><small>{r.id} · {r.businessUnit}</small></Link>},

 {key:'headcount',label:'Headcount',value:r=>r.headcount,render:r=><span className="number">{r.headcount} <span className="muted">positions</span></span>},

 {key:'location',label:'Location',value:r=>r.location,render:r=>r.location},

 {key:'recommendation',label:'Recommended approach',value:r=>r.analysis.recommendation,render:r=><Badge tone="navy">{r.analysis.recommendation}</Badge>},

 {key:'deadline',label:'Deadline',value:r=>r.deadline,render:r=><span>{r.deadline} days</span>},

 {key:'status',label:'Status',value:r=>r.status,render:r=><Badge tone={r.status==='Approved'?'success':r.status==='Rejected'?'danger':'warning'}>{r.status}</Badge>},

 {key:'view',label:'',render:r=><Link aria-label={'Open '+r.id} className="row-arrow" href={'/requirements/'+r.id}><ArrowUpRight size={17}/></Link>}

 ]}/>;}

export function Dashboard(){const{data}=useWorkspace();const[unit,setUnit]=useState('All business units');if(!data)return null;const reqs=data.requirements.filter(r=>unit==='All business units'||r.businessUnit===unit);const pending=reqs.filter(r=>r.status==='Awaiting review');const active=data.actions.filter(a=>reqs.some(r=>r.id===a.requirementId)&&['Pending','In Progress'].includes(a.status));const demand=reqs.reduce((s,r)=>s+r.headcount,0);const savings=reqs.reduce((sum,r)=>{const buy=r.analysis.ranking.find(s=>s.strategy==='BUY')!;const selected=r.analysis.recommendation==='BUILD + BORROW'?r.analysis.hybrid:r.analysis.ranking.find(s=>s.strategy===r.analysis.recommendation)!;return sum+(selected.coverage>=r.headcount?Math.max(0,buy.cost-selected.cost):0);},0);const distribution=strategies.map(strategy=>({strategy,count:reqs.filter(r=>r.analysis.recommendation.includes(strategy)).length}));const departmental=Array.from(new Set(reqs.map(r=>r.businessUnit))).map(name=>({name,headcount:reqs.filter(r=>r.businessUnit===name).reduce((s,r)=>s+r.headcount,0)}));const opportunity=reqs.find(r=>r.analysis.recommendation==='BUILD + BORROW')??reqs[0];return <>

 <PageHeader eyebrow="WORKFORCE PLANNING" title="A clearer view of your workforce." description="Evaluate the options. Understand the trade-offs. Make the next move with confidence." actions={<Button asChild><Link href="/requirements/new"><Plus size={16}/>New requirement</Link></Button>}/>

 <div className="overview-toolbar"><div className="view-label"><span className="environment-dot"/>Workspace overview <span className="muted">/</span><span className="muted">Current saved requirements</span></div><select aria-label="Business unit filter" value={unit} onChange={e=>setUnit(e.target.value)}>{['All business units',...new Set(data.requirements.map(r=>r.businessUnit))].map(u=><option key={u}>{u}</option>)}</select></div>

 <div className="kpi-grid">{[

  {label:'Open requirements',value:pending.length.toString(),detail:`${demand} positions under evaluation`,icon:Users,href:'/requirements'},

  {label:'Potential cost savings',value:lakh(savings),detail:'Against external hiring scenarios',icon:Wallet,href:'/scenarios'},

  {label:'Awaiting a decision',value:pending.length.toString().padStart(2,'0'),detail:'Ready for human review',icon:GitBranch,href:'/decisions'},

  {label:'Actions in progress',value:active.length.toString().padStart(2,'0'),detail:active.length?'Approved plans moving to execution':'Approve a plan to start execution',icon:Clock3,href:'/actions'}

 ].map(k=><Link className="kpi-card" href={k.href} key={k.label}><div><span>{k.label}</span><k.icon size={17}/></div><strong>{k.value}</strong><p>{k.detail}<ArrowUpRight size={13}/></p></Link>)}</div>

 <SourceNote/>

 <div className="dashboard-charts"><Panel title="Your workforce options" subtitle="Recommended approaches across saved requirements" actions={<Badge>{reqs.length} requirements</Badge>}><div className="strategy-distribution">{distribution.map((s,i)=><div className="strategy-line" key={s.strategy}><span className="strategy-short">{s.strategy}</span><div className="distribution-track"><div style={{width:`${s.count/Math.max(1,reqs.length)*100}%`,background:['#1e3a5f','#47617e','#75889e','#a4afbc','#c6cdd5'][i]}}/></div><strong>{s.count}</strong><span className="distribution-description">{labels[s.strategy]}</span></div>)}</div><div className="panel-footnote">Hybrid recommendations contribute to both selected strategies.</div></Panel>

 <Panel title="Demand by business unit" subtitle="Positions in the current planning pipeline"><div className="chart-wrap" role="img" aria-label={departmental.map(d=>`${d.name}: ${d.headcount} positions`).join(', ')}><ResponsiveContainer width="100%" height="100%"><BarChart data={departmental} margin={{left:-20,right:16,top:12,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9edf1"/><XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{fontSize:11}} axisLine={false} tickLine={false}/><Tooltip/><Bar isAnimationActive={false} dataKey="headcount" name="Positions" maxBarSize={44} radius={[3,3,0,0]}>{departmental.map((d,i)=><Cell key={d.name} fill={i===0?'#1e3a5f':'#a8b7c7'}/>)}</Bar></BarChart></ResponsiveContainer></div></Panel></div>

 {opportunity&&<div className="decision-callout"><span className="callout-icon"><GitBranch size={21}/></span><div><div className="eyebrow">A DECISION WORTH EXPLORING</div><h3>{opportunity.analysis.recommendation==='BUILD + BORROW'?'Build from within. Bridge the gap with contractors.':`${opportunity.role}: compare the alternatives.`}</h3><p>{opportunity.role} · {opportunity.headcount} positions · {opportunity.analysis.confidence}% evidence confidence <span className="muted">— based on imported evidence and planning assumptions</span></p></div><Button variant="secondary" asChild><Link href={'/requirements/'+opportunity.id}>Review analysis <ArrowRight size={15}/></Link></Button></div>}

 <Panel title="Requirement pipeline" subtitle="From a business need to an informed workforce decision" actions={<Link className="text-link" href="/requirements">View all requirements <ArrowRight size={14}/></Link>}><RequirementTable rows={reqs}/></Panel>

 <div className="bottom-grid"><Panel title="Recent activity" subtitle="Recorded decisions and execution events">{data.decisions.length?<div className="activity-list">{data.decisions.slice(0,3).map(d=><div key={d.id}><CheckCircle2 size={17}/><div><strong>{d.outcome}: {d.selected}</strong><p>{d.requirementId} · {d.actor}</p></div><time>{new Date(d.createdAt).toLocaleDateString('en-IN')}</time></div>)}</div>:<div className="quiet-state"><CheckCircle2 size={19}/><div><strong>Your review queue is ready</strong><p>Approved decisions and action updates will appear here.</p><Link href="/decisions">Review requirements <ArrowRight size={13}/></Link></div></div>}</Panel><Panel title="Evidence coverage" subtitle="Know what supports your decisions"><div className="coverage-row"><span>Imported people</span><Badge>{data.people.length} records</Badge></div><div className="coverage-row"><span>Verified market benchmarks</span><Badge tone="warning">Not ingested</Badge></div><div className="coverage-row"><span>Human approval</span><Badge tone="navy">Required</Badge></div><Link href="/sources" className="coverage-link">Inspect sources and assumptions <ArrowUpRight size={14}/></Link></Panel></div>

 </>;}

export function Requirements(){const{data}=useWorkspace();const[status,setStatus]=useState('All statuses');if(!data)return null;return <><PageHeader eyebrow="WORKSPACE" title="Requirements" description="Track the business need, review the evidence, and decide how to meet demand." actions={<Button asChild><Link href="/requirements/new"><Plus size={16}/>New requirement</Link></Button>}/><Panel title="All workforce requirements" actions={<select aria-label="Filter status" value={status} onChange={e=>setStatus(e.target.value)}>{['All statuses','Awaiting review','Approved','Rejected'].map(s=><option key={s}>{s}</option>)}</select>}><RequirementTable rows={data.requirements.filter(r=>status==='All statuses'||r.status===status)}/></Panel><SourceNote/></>;}

