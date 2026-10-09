const { chromium } = require('@playwright/test');

async function testSubmitRequirement() {
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

  console.log('3. Extracting description...');
  await page.locator('#raw-intake').fill('We need 2 Senior Full Stack Engineers in Bengaluru with React, Node.js and PostgreSQL to build our core API platform within 60 days.');
  await page.getByLabel('This text contains no personal or confidential information').check();
  await page.getByRole('button', { name: 'Extract fields' }).click();
  await page.waitForTimeout(2000);

  console.log('4. Checking structured inputs...');
  // Check the preview and fields
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

  // Add skills
  const addSkill = async (name, weight) => {
    await page.getByPlaceholder('Add a skill…').fill(name);
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByLabel(`${name} importance`).fill(String(weight));
  };
  await addSkill('Node.js', 33);
  await addSkill('PostgreSQL', 33);
  await addSkill('React', 34);

  const skillInputs = page.locator('.skill-weight-list input[type="number"]');
  const count = await skillInputs.count();
  console.log(`Mandatory skill weight inputs count: ${count}`);

  await page.getByLabel('Optional skills (comma-separated)').fill('Docker, GraphQL');
  await page.getByLabel('Repetitive work assumption (%)').fill('15');
  await page.getByLabel('Remote work is an acceptable option').check();

  console.log('5. Clicking Analyze requirement...');
  await page.getByRole('button', { name: 'Analyze requirement' }).click();

  // Wait for redirect to /analysis/... or error
  console.log('Waiting for response...');
  await page.waitForTimeout(5000);

  console.log('Final URL:', page.url());
  const errorEl = page.locator('.form-error');
  if (await errorEl.count() > 0) {
    console.error('Error message on page:', await errorEl.innerText());
  } else {
    console.log('SUCCESS! No form error found on page.');
  }

  await page.screenshot({ path: 'test-results/verified-pages/new_requirement_submitted.png' });
  await browser.close();
}

testSubmitRequirement().catch(err => {
  console.error(err);
  process.exit(1);
});
