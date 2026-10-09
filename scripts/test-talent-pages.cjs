const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testTalentPages() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  console.log('Logging in...');
  await page.goto('http://127.0.0.1:3000/login');
  await page.getByLabel('Work email').fill('rajatharun12@gmail.com');
  await page.getByLabel('Password').fill('Password12345!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('Logged in successfully!');

  const pages = [
    { path: '/talent', name: 'talent_explorer' },
    { path: '/employee', name: 'employee_view' },
    { path: '/taxonomy', name: 'skill_taxonomy' },
    { path: '/learning', name: 'learning_catalogue' },
  ];

  const dir = path.join(process.cwd(), 'test-results', 'verified-pages');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const p of pages) {
    console.log(`Navigating to ${p.path}...`);
    await page.goto('http://127.0.0.1:3000' + p.path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    const h1 = await page.locator('h1').innerText().catch(() => 'no h1');
    console.log(`  -> URL: ${currentUrl} | H1: ${h1}`);
    await page.screenshot({ path: path.join(dir, `${p.name}.png`) });
  }

  await browser.close();
  console.log('Done testing talent pages!');
}

testTalentPages().catch(err => {
  console.error(err);
  process.exit(1);
});
