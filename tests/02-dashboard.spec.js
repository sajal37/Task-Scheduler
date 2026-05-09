// tests/02-dashboard.spec.js — Dashboard tests

const { test, expect } = require('@playwright/test');
const { uniqueEmail, registerUser, goToView } = require('./helpers');

test.describe('Dashboard', () => {

  test('dashboard loads and shows stat cards', async ({ page }) => {
    const email = uniqueEmail('dash');
    await registerUser(page, 'Dash User', email);

    // Dashboard is the default view after login
    await expect(page.locator('#view-dashboard')).toHaveClass(/active/);
    await expect(page.locator('#dTotalAssigned')).toBeVisible();
    await expect(page.locator('#dTodo')).toBeVisible();
    await expect(page.locator('#dInProgress')).toBeVisible();
    await expect(page.locator('#dDone')).toBeVisible();
    await expect(page.locator('#dOverdue')).toBeVisible();
  });

  test('dashboard shows empty projects state for new user', async ({ page }) => {
    const email = uniqueEmail('dashempty');
    await registerUser(page, 'Empty Dash', email);

    await expect(page.locator('#dashProjectProgress .empty-state')).toBeVisible({ timeout: 15000 });
  });

  test('refresh button reloads dashboard', async ({ page }) => {
    const email = uniqueEmail('dashrefresh');
    await registerUser(page, 'Refresh Dash', email);

    await page.click('button:has-text("Refresh")');
    // Stats should still be visible after refresh
    await expect(page.locator('#dTotalAssigned')).toBeVisible();
  });

  test('navigating away and back re-loads dashboard', async ({ page }) => {
    const email = uniqueEmail('dashnav');
    await registerUser(page, 'Nav Dash', email);

    await goToView(page, 'projects');
    await goToView(page, 'dashboard');
    await expect(page.locator('#dTotalAssigned')).toBeVisible();
  });

  test('stat numbers are numeric after load', async ({ page }) => {
    const email = uniqueEmail('dashtotal');
    await registerUser(page, 'Total Dash', email);

    // Wait until stats are populated (not just "–")
    await expect(page.locator('#dTotalAssigned')).not.toHaveText('–', { timeout: 15000 });
    const text = await page.locator('#dTotalAssigned').innerText();
    expect(Number(text)).toBeGreaterThanOrEqual(0);
  });

});
