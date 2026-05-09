// tests/01-auth.spec.js — Authentication flow tests

const { test, expect } = require('@playwright/test');
const { uniqueEmail, TEST_PASSWORD, registerUser, loginUser, signOut } = require('./helpers');

test.describe('Authentication', () => {

  test('page loads and shows auth modal', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#authModal')).toBeVisible();
    await expect(page.locator('#app')).not.toBeVisible();
    await expect(page.locator('.brand-logo')).toContainText('Task Scheduler');
  });

  test('sign-in tab is active by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#loginPanel')).toHaveClass(/active/);
    await expect(page.locator('#registerPanel')).not.toHaveClass(/active/);
  });

  test('can switch to register tab', async ({ page }) => {
    await page.goto('/');
    await page.click('button[data-tab="register"]');
    await expect(page.locator('#registerPanel')).toHaveClass(/active/);
    await expect(page.locator('#loginPanel')).not.toHaveClass(/active/);
  });

  test('register new user successfully', async ({ page }) => {
    const email = uniqueEmail('reg');
    await registerUser(page, 'Playwright User', email);

    // App is visible; sidebar shows user name
    await expect(page.locator('#sidebarUserName')).toBeVisible();
    await expect(page.locator('#sidebarUserEmail')).toContainText(email);
  });

  test('register with duplicate email shows error', async ({ page }) => {
    const email = uniqueEmail('dup');
    // First registration
    await registerUser(page, 'First User', email);
    await signOut(page);

    // Try to register again with the same email
    await page.click('button[data-tab="register"]');
    await page.fill('#regName', 'Second User');
    await page.fill('#regEmail', email);
    await page.fill('#regPassword', TEST_PASSWORD);
    await page.fill('#regConfirm', TEST_PASSWORD);
    await page.click('#registerForm button[type="submit"]');

    // Should show error notification, NOT log in
    await expect(page.locator('.notif.error')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#authModal')).toBeVisible();
  });

  test('register with mismatched passwords shows error', async ({ page }) => {
    await page.goto('/');
    await page.click('button[data-tab="register"]');
    await page.fill('#regName', 'Test User');
    await page.fill('#regEmail', uniqueEmail('mismatch'));
    await page.fill('#regPassword', TEST_PASSWORD);
    await page.fill('#regConfirm', 'DifferentPass99');
    await page.click('#registerForm button[type="submit"]');

    await expect(page.locator('.notif.error')).toContainText('Passwords do not match');
    await expect(page.locator('#authModal')).toBeVisible();
  });

  test('login with valid credentials', async ({ page }) => {
    const email = uniqueEmail('login');
    await registerUser(page, 'Login Tester', email);
    await signOut(page);

    await loginUser(page, email);
    await expect(page.locator('#sidebarUserEmail')).toContainText(email);
  });

  test('login with wrong password shows error', async ({ page }) => {
    const email = uniqueEmail('wrongpw');
    await registerUser(page, 'Wrong PW User', email);
    await signOut(page);

    await page.fill('#loginEmail', email);
    await page.fill('#loginPassword', 'WrongPassword!');
    await page.click('#loginForm button[type="submit"]');

    await expect(page.locator('.notif.error')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#authModal')).toBeVisible();
  });

  test('login with nonexistent email shows error', async ({ page }) => {
    await page.goto('/');
    await page.fill('#loginEmail', 'nobody@notexist.com');
    await page.fill('#loginPassword', TEST_PASSWORD);
    await page.click('#loginForm button[type="submit"]');

    await expect(page.locator('.notif.error')).toBeVisible({ timeout: 10000 });
  });

  test('sign out works correctly', async ({ page }) => {
    const email = uniqueEmail('signout');
    await registerUser(page, 'Signout User', email);
    await signOut(page);

    await expect(page.locator('#authModal')).toBeVisible();
    await expect(page.locator('#app')).not.toBeVisible();
  });

  test('session is restored from localStorage on page reload', async ({ page }) => {
    const email = uniqueEmail('session');
    await registerUser(page, 'Session User', email);

    // Reload — should still be logged in
    await page.reload();
    await expect(page.locator('#app')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#sidebarUserEmail')).toContainText(email);
  });

});
