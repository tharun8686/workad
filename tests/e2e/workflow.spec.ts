import {test,expect} from '@playwright/test';
test('all views render, tabs work and layout fits desktop and mobile',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [url,heading] of [['/dashboard','A clearer view'],['/requirements','Requirements'],['/requirements/new','Start with'],['/analysis/REQ-1042','Analysis & workflow'],['/requirements/REQ-1042','Backend Engineer'],['/scenarios','Scenario simulator'],['/decisions','Review & approval'],['/actions','Action tracker'],['/talent','Talent explorer'],['/taxonomy','Skill taxonomy'],['/sources','Data sources & provenance'],['/employee','Employee opportunities']]){
    await page.goto(url);await expect(page.locator('h1')).toContainText(heading);await expect(page.getByText('Unable to open the workspace')).toHaveCount(0);
  }
  await page.goto('/requirements/REQ-1042');await expect(page.locator('h1')).toHaveText('Backend Engineer');
  for(const label of ['Contractors','External market','Locations','Automation','Strategy scores','Evidence','Scenarios','Internal talent']){await page.getByRole('tab',{name:label,exact:true}).click();await expect(page.getByRole('tabpanel',{name:label,exact:true})).toBeVisible();}
  await page.goto('/dashboard');await expect(page.locator('h1')).toContainText('A clearer view');await page.screenshot({path:'test-results/dashboard-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/dashboard-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await page.goto('/login');await expect(page.getByRole('heading',{name:'Welcome to your workspace'})).toBeVisible();await expect(page.getByRole('link',{name:'Open local sandbox'})).toBeVisible();expect(errors).toEqual([]);
});
test('create, analyze, save a live scenario, approve and execute in the UI',async({page})=>{
  await page.goto('/requirements/new');await expect(page.locator('h1')).toContainText('Start with');
  await page.getByLabel('Job role',{exact:true}).fill('Backend Engineer E2E');await page.getByLabel('Required within (days)').fill('45');
  await page.getByRole('button',{name:'Analyze requirement',exact:true}).click();await expect(page).toHaveURL(/\/analysis\/REQ-/);const id=page.url().split('/').at(-1)!;
  await page.getByRole('link',{name:'View analysis',exact:true}).click();await expect(page.getByText('BUILD + BORROW',{exact:true}).first()).toBeVisible();
  await page.getByRole('tab',{name:'Scenarios',exact:true}).click();await page.getByLabel('Headcount',{exact:true}).fill('2');await expect(page.getByText('Side-by-side comparison',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Save scenario',exact:true}).click();await expect(page.getByText('Scenario saved to this requirement.')).toBeVisible();
  await page.getByRole('link',{name:'Review decision',exact:true}).click();await page.getByLabel('Decision rationale').fill('Reviewed simulator evidence, capacity coverage and training assumptions.');await page.getByRole('button',{name:'Approve recommendation',exact:true}).click();await expect(page.getByText('Decision recorded',{exact:true})).toBeVisible();
  await page.getByRole('link',{name:'View generated actions',exact:true}).click();
  const cards=page.locator('section.panel').filter({hasText:id});await expect(cards).toHaveCount(2);
  for(let i=0;i<2;i++){const card=cards.nth(i);await card.getByLabel('Execution note').fill('Starting approved simulated workflow.');await card.getByRole('button',{name:'Start execution',exact:true}).click();await expect(card.getByRole('button',{name:'Mark complete',exact:true})).toBeVisible();await card.getByLabel('Execution note').fill('Completed the simulator action and reviewed results.');await card.getByRole('button',{name:'Mark complete',exact:true}).click();await expect(card.locator('.panel-heading .badge')).toHaveText('Completed');}
  await page.reload();await expect(page.locator('section.panel').filter({hasText:id}).first().locator('.panel-heading .badge')).toHaveText('Completed');
});
test('API rejects malformed and cross-origin mutation requests',async({request})=>{
  const invalid=await request.post('/api/requirements/analyze',{headers:{origin:'http://127.0.0.1:3100'},data:{headcount:-1}});expect(invalid.status()).toBe(422);
  const cross=await request.post('/api/requirements/analyze',{headers:{origin:'https://untrusted.example'},data:{}});expect(cross.status()).toBe(403);
  const unknown=await request.get('/api/requirements/not-owned-or-not-found');expect(unknown.status()).toBe(404);
});
