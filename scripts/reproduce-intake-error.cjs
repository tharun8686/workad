const { chromium } = require('@playwright/test');

async function testSubmit() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  console.log('1. Signing in...');
  await page.goto('http://127.0.0.1:3000/login');
  await page.getByLabel('Work email').fill('rajatharun12@gmail.com');
  await page.getByLabel('Password').fill('Password12345!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  console.log('2. Navigating to /requirements/new...');
  await page.goto('http://127.0.0.1:3000/requirements/new');
  await page.waitForLoadState('networkidle');

  console.log('3. Filling form...');
  // Fill raw intake
  await page.locator('#raw-intake').fill('We need 2 Senior Full Stack Engineers in Bengaluru with React, Node.js and PostgreSQL to build our core API platform within 60 days.');
  await page.getByLabel('This text contains no personal or confidential information').check();
  await page.getByRole('button', { name: 'Extract fields' }).click();
  await page.waitForTimeout(2000);

  // Fill/verify structured fields
  await page.getByLabel('Job role').fill('Senior Full Stack Engineer');
  await page.getByLabel('Business unit').fill('Core Engineering');
  await page.getByLabel('Headcount').fill('2');
  await page.getByLabel('Primary location').selectOption('Bengaluru');
  await page.getByLabel('Annual budget per person (₹ LPA)').fill('28');
  await page.getByLabel('Required within (days)').fill('60');
  await page.getByLabel('Minimum experience (years)').fill('4');
  await page.getByLabel('Maximum experience (years)').fill('8');
  await page.getByLabel('Planning horizon (months)').fill('12');
  await page.getByLabel('Priority').selectOption('Standard');

  // Ensure weights sum to 100
  // Skill weights
  const nodeWeight = page.getByLabel('Node.js importance');
  if (await nodeWeight.count() > 0) await nodeWeight.fill('33');
  const pgWeight = page.getByLabel('PostgreSQL importance');
  if (await pgWeight.count() > 0) await pgWeight.fill('33');
  const reactWeight = page.getByLabel('React importance');
  if (await reactWeight.count() > 0) await reactWeight.fill('34');

  await page.getByLabel('Optional skills (comma-separated)').fill('Docker, GraphQL');
  await page.getByLabel('Repetitive work assumption (%)').fill('15');
  await page.getByLabel('Remote work is an acceptable option').check();

  console.log('4. Clicking Analyze requirement button...');
  await page.getByRole('button', { name: 'Analyze requirement' }).click();

  await page.waitForTimeout(4000);
  console.log('Current URL after submit:', page.url());

  const errorEl = page.locator('.form-error');
  if (await errorEl.count() > 0) {
    console.log('Form Error on page:', await errorEl.innerText());
  }

  await browser.close();
}

testSubmit().catch(err => {
  console.error(err);
  process.exit(1);
});
