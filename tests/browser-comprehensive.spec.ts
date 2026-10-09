import { test, expect } from '@playwright/test';

test.describe('Workforce Advisory Browser Suite', () => {
  test.use({ baseURL: 'http://127.0.0.1:3000' });

  test('Complete Core Workflow on Browser', async ({ page }) => {
    // Collect any page console errors
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    // 1. Visit Login
    console.log('Testing 1: Login page');
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('The right people.');
    await expect(page.getByRole('heading', { name: 'Welcome to your workspace' })).toBeVisible();

    // Fill credentials and log in
    await page.getByLabel('Work email').fill('rajatharun881@gmail.com');
    await page.getByLabel('Password').fill('Password12345!');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    console.log('Successfully logged in and reached /dashboard');

    // 2. Test Dashboard
    console.log('Testing 2: Dashboard Overview');
    await expect(page.locator('h1')).toContainText('A clearer view');
    await page.screenshot({ path: 'test-results/browser-dashboard.png', fullPage: true });

    // 3. Test Data Connections / Services Status
    console.log('Testing 3: Data Connections');
    await page.goto('/connections');
    await expect(page.locator('h1')).toContainText('Data connections');
    await expect(page.getByText('Neon PostgreSQL')).toBeVisible();
    await page.screenshot({ path: 'test-results/browser-connections.png' });

    // 4. Test Skill Taxonomy
    console.log('Testing 4: Skill Taxonomy');
    await page.goto('/taxonomy');
    await expect(page.locator('h1')).toContainText('Skill taxonomy');
    await expect(page.getByText('normalized skills')).toBeVisible();
    await page.screenshot({ path: 'test-results/browser-taxonomy.png' });

    // 5. Test Learning Catalogue
    console.log('Testing 5: Learning Catalogue');
    await page.goto('/learning');
    await expect(page.locator('h1')).toContainText('Official learning catalogue');
    await page.screenshot({ path: 'test-results/browser-learning.png' });

    // 6. Test Data Sources & Provenance
    console.log('Testing 6: Data Sources');
    await page.goto('/sources');
    await expect(page.locator('h1')).toContainText('Data sources & provenance');
    await page.screenshot({ path: 'test-results/browser-sources.png' });

    // 7. Test External Market
    console.log('Testing 7: Market Observations');
    await page.goto('/market');
    await expect(page.locator('h1')).toContainText('Job market observations');
    await page.screenshot({ path: 'test-results/browser-market.png' });

    // 8. Test Recruitment
    console.log('Testing 8: Recruitment');
    await page.goto('/recruitment');
    await expect(page.locator('h1')).toContainText('Recruitment & applicant tracking');
    await page.screenshot({ path: 'test-results/browser-recruitment.png' });

    // 9. Test Talent Explorer & Employee Preview
    console.log('Testing 9: Talent Explorer & Employee View');
    await page.goto('/talent');
    await expect(page.locator('h1')).toContainText('Talent explorer');
    await page.goto('/employee');
    await expect(page.locator('h1')).toContainText('Employee view');

    // 10. Test Requirements Intake (New Requirement)
    console.log('Testing 10: New Requirement Intake');
    await page.goto('/requirements/new');
    await expect(page.locator('h1')).toContainText('Start with a requirement');

    // Fill in requirement
    await page.getByLabel('Job role', { exact: true }).fill('Senior Cloud Architect');
    await page.getByLabel('Required within (days)').fill('45');
    await page.getByLabel('Headcount needed').fill('3');
    await page.getByLabel('Budget per person (₹ Lakh)').fill('25');
    await page.getByLabel('Business unit').fill('Cloud Infrastructure');

    // Add required skill
    const skillInput = page.getByLabel('Add a required skill');
    if (await skillInput.isVisible()) {
      await skillInput.fill('Python');
      await page.getByRole('button', { name: 'Add skill' }).click();
    }

    // Submit and analyze
    await page.getByRole('button', { name: 'Analyze requirement' }).click();
    await expect(page).toHaveURL(/\/analysis\/REQ-/, { timeout: 15000 });
    const reqUrl = page.url();
    const reqId = reqUrl.split('/').pop()!;
    console.log('Created and analyzed requirement:', reqId);

    // 11. Test 14-Stage Workflow & Analysis Tabs
    console.log('Testing 11: Workflow & Tabs on Analysis View');
    await expect(page.locator('h1')).toContainText('Senior Cloud Architect');
    await page.screenshot({ path: 'test-results/browser-analysis-workflow.png' });

    // Check tabs
    for (const tabName of ['Contractors', 'External market', 'Locations', 'Automation', 'Strategy scores', 'Evidence', 'Scenarios', 'Internal talent']) {
      const tab = page.getByRole('tab', { name: tabName, exact: true });
      if (await tab.isVisible()) {
        await tab.click();
        await expect(page.getByRole('tabpanel', { name: tabName, exact: true })).toBeVisible();
      }
    }

    // 12. Test Scenario Simulator
    console.log('Testing 12: Scenario Simulator');
    await page.getByRole('tab', { name: 'Scenarios', exact: true }).click();
    await page.getByLabel('Headcount', { exact: true }).fill('2');
    const saveScenarioBtn = page.getByRole('button', { name: 'Save scenario', exact: true });
    if (await saveScenarioBtn.isVisible()) {
      await saveScenarioBtn.click();
      await expect(page.getByText('Scenario saved')).toBeVisible();
    }
    await page.screenshot({ path: 'test-results/browser-scenarios.png' });

    // 13. Test Decision & Review
    console.log('Testing 13: Review & Approval');
    await page.goto(`/decisions?req=${reqId}`);
    await expect(page.locator('h1')).toContainText('Review & approval');
    await page.getByLabel('Decision rationale').fill('Approved after comprehensive browser verification of constraints and capacity.');
    await page.getByRole('button', { name: 'Approve recommendation' }).click();
    await expect(page.getByText('Decision recorded')).toBeVisible();
    await page.screenshot({ path: 'test-results/browser-decision.png' });

    // 14. Test Action Tracker
    console.log('Testing 14: Action Tracker');
    await page.goto('/actions');
    await expect(page.locator('h1')).toContainText('Action tracker');
    await page.screenshot({ path: 'test-results/browser-actions.png' });

    // Verify there are no critical unhandled frontend errors
    console.log('Browser tests completed. Console errors observed:', pageErrors.length);
    expect(pageErrors.filter(e => !e.includes('ResizeObserver'))).toEqual([]);
  });
});
