// tests/helpers.js — shared utilities for all test files

const { expect } = require('@playwright/test');

/**
 * Unique test credentials so parallel runs or reruns don't collide.
 */
function uniqueEmail(prefix = 'test') {
  return `${prefix}_${Date.now()}@playwright.test`;
}

const TEST_PASSWORD = 'PlaywrightTest123';

/**
 * Register a brand-new user via the UI, return { email, password, name }.
 */
async function registerUser(page, name, email, password = TEST_PASSWORD) {
  await page.goto('/');
  // Switch to register tab
  await page.click('button[data-tab="register"]');
  await page.fill('#regName', name);
  await page.fill('#regEmail', email);
  await page.fill('#regPassword', password);
  await page.fill('#regConfirm', password);
  await page.click('#registerForm button[type="submit"]');
  // Wait for the app to appear (auth modal hides)
  await expect(page.locator('#app')).toBeVisible({ timeout: 20000 });
  return { name, email, password };
}

/**
 * Login via the UI.
 */
async function loginUser(page, email, password = TEST_PASSWORD) {
  await page.goto('/');
  await page.fill('#loginEmail', email);
  await page.fill('#loginPassword', password);
  await page.click('#loginForm button[type="submit"]');
  await expect(page.locator('#app')).toBeVisible({ timeout: 20000 });
}

/**
 * Sign out via sidebar button.
 */
async function signOut(page) {
  await page.click('button[title="Sign out"]');
  await expect(page.locator('#authModal')).toHaveClass(/active/, { timeout: 10000 });
}

/**
 * Navigate to a sidebar view by name ('dashboard' | 'projects' | 'mytasks').
 */
async function goToView(page, viewName) {
  await page.click(`[data-view="${viewName}"]`);
  await expect(page.locator(`#view-${viewName}`)).toHaveClass(/active/, { timeout: 10000 });
}

/**
 * Wait for a notification toast containing text.
 */
async function expectNotification(page, text, type = 'success') {
  const notif = page.locator(`.notif.${type}`).filter({ hasText: text });
  await expect(notif).toBeVisible({ timeout: 10000 });
}

module.exports = { uniqueEmail, TEST_PASSWORD, registerUser, loginUser, signOut, goToView, expectNotification };
