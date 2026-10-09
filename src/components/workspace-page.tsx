'use client';
import {Intelligence} from './intelligence';
import {Presentation} from './presentation';
import {Capacity} from './capacity';
import {Occupations} from './occupations';
import {Suspense} from 'react';
import {Dashboard,Requirements} from './dashboard';
import {Intake} from './intake';
import {RequirementDetail,Progress} from './requirement-detail';
import {Scenarios} from './scenarios';
import {Decisions,Actions} from './decisions';
import {Talent,Employee} from './talent';
import {Sources,Taxonomy} from './governance';
import {Recruitment} from './recruitment';
import {Learning} from './learning';
import {Connections} from './connections';
import {Market} from './market';
import {Empty} from './common';
export function WorkspacePage({route}:{route:string[]}){let content;switch(route[0]){case 'intelligence':content=<Intelligence/>;break;case 'presentation':content=<Presentation/>;break;case 'capacity':content=<Capacity/>;break;case 'occupations':content=<Occupations/>;break;case 'market':content=<Market/>;break;case 'recruitment':content=<Recruitment/>;break;case 'learning':content=<Learning/>;break;case 'connections':content=<Connections/>;break;case 'dashboard':content=<Dashboard/>;break;case 'requirements':content=route[1]==='new'?<Intake/>:route[1]?<RequirementDetail id={route[1]}/>:<Requirements/>;break;case 'analysis':content=<Progress id={route[1]}/>;break;case 'scenarios':content=<Scenarios/>;break;case 'decisions':content=<Decisions/>;break;case 'actions':content=<Actions/>;break;case 'talent':content=<Talent/>;break;case 'employee':content=<Employee/>;break;case 'taxonomy':content=<Taxonomy/>;break;case 'sources':content=<Sources/>;break;default:content=<Empty title="Page not found">Use the navigation to return to your workspace.</Empty>;}return <Suspense fallback={<div role="status">Loading view…</div>}>{content}</Suspense>;}


