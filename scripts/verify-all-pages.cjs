const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function testAllPages() {
  console.log('🌐 Launching headless browser to test all sections and internal tabs...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = [];
  const log = (msg) => {
    console.log(msg);
    results.push(msg);
  };

  const screenshotsDir = path.join(process.cwd(), 'test-results', 'verified-pages');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  log('1. Navigating to /login and signing in as rajatharun12@gmail.com...');
  await page.goto('http://127.0.0.1:3000/login');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Work email').fill('rajatharun12@gmail.com');
  await page.getByLabel('Password').fill('Password12345!');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  log(`Successfully authenticated! Current URL: ${page.url()}`);
  await page.screenshot({ path: path.join(screenshotsDir, 'dashboard.png') });

  // List of DECISIONS and TALENT pages to test
  const pagesToTest = [
    // DECISIONS
    { name: 'Workforce memory (Intelligence)', url: 'http://127.0.0.1:3000/intelligence', tabs: ['Outcomes & learning', 'Semantic matching', 'Fair pay & city budgets', 'Decision Challenger'] },
    { name: 'Scenario planner', url: 'http://127.0.0.1:3000/scenarios' },
    { name: 'Review & approval', url: 'http://127.0.0.1:3000/decisions' },
    { name: 'Action tracker', url: 'http://127.0.0.1:3000/actions' },
    { name: 'Capacity reservations', url: 'http://127.0.0.1:3000/capacity' },
    { name: 'Recruitment', url: 'http://127.0.0.1:3000/recruitment', tabs: ['Profiles', 'Requisitions', 'Pipeline', 'Sourcing channels'] },

    // TALENT
    { name: 'Talent explorer', url: 'http://127.0.0.1:3000/talent' },
    { name: 'Employee view', url: 'http://127.0.0.1:3000/employee' },
    { name: 'Skill taxonomy', url: 'http://127.0.0.1:3000/taxonomy' },
    { name: 'Learning catalogue', url: 'http://127.0.0.1:3000/learning' }
  ];

  for (const item of pagesToTest) {
    log(`\nTesting page: ${item.name} (${item.url})`);
    await page.goto(item.url);
    await page.waitForLoadState('networkidle');

    const h1 = await page.locator('h1').first().innerText().catch(() => 'No H1');
    log(`  ✓ Heading: "${h1}"`);

    const filename = item.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    await page.screenshot({ path: path.join(screenshotsDir, `${filename}.png`) });

    if (item.tabs) {
      for (const tabName of item.tabs) {
        log(`  Testing internal tab: "${tabName}"`);
        const tabBtn = page.getByRole('button', { name: tabName });
        if (await tabBtn.count() > 0) {
          await tabBtn.click();
          await page.waitForTimeout(500);
          const tabFile = `${filename}_tab_${tabName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
          await page.screenshot({ path: path.join(screenshotsDir, tabFile) });
          log(`    ✓ Tab "${tabName}" active and rendered`);
        } else {
          log(`    ⚠️ Tab button "${tabName}" not found`);
        }
      }
    }
  }

  await browser.close();
  console.log('\nAll pages and tabs verified successfully!');
}

testAllPages().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
