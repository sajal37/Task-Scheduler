// tests/03-projects.spec.js — Project CRUD and member management tests

const { test, expect } = require('@playwright/test');
const { uniqueEmail, registerUser, goToView, expectNotification } = require('./helpers');

async function createProject(page, projectName) {
  await page.click('button:has-text("New Project")');
  await page.fill('#cpName', projectName);
  await page.fill('#cpDescription', 'E2E test project');
  await page.click('#createProjectForm button[type="submit"]');
  await expect(page.locator('.project-card', { hasText: projectName })).toBeVisible({ timeout: 15000 });
}

test.describe('Projects', () => {

  test('empty state shown for new user', async ({ page }) => {
    await registerUser(page, 'ProjEmpty', uniqueEmail('pe'));
    await goToView(page, 'projects');
    await expect(page.locator('#projectsGrid .empty-state')).toBeVisible({ timeout: 15000 });
  });

  test('create project modal opens and closes', async ({ page }) => {
    await registerUser(page, 'ProjModal', uniqueEmail('pm'));
    await goToView(page, 'projects');
    await page.click('button:has-text("New Project")');
    await expect(page.locator('#createProjectModal')).toBeVisible();
    await page.click('#createProjectModal button:has-text("Cancel")');
    await expect(page.locator('#createProjectModal')).not.toBeVisible();
  });

  test('create project successfully', async ({ page }) => {
    const name = `E2E-${Date.now()}`;
    await registerUser(page, 'ProjCreate', uniqueEmail('pc'));
    await goToView(page, 'projects');
    await createProject(page, name);
    await expectNotification(page, 'Project created', 'success');
    await expect(page.locator('.project-card', { hasText: name })).toBeVisible();
  });

  test('creator has Admin badge', async ({ page }) => {
    const name = `AdminBadge-${Date.now()}`;
    await registerUser(page, 'AdminUser', uniqueEmail('ab'));
    await goToView(page, 'projects');
    await createProject(page, name);
    await expect(page.locator('.project-card', { hasText: name }).locator('.badge-admin')).toBeVisible();
  });

  test('open project detail panel', async ({ page }) => {
    const name = `OpenDetail-${Date.now()}`;
    await registerUser(page, 'DetailUser', uniqueEmail('od'));
    await goToView(page, 'projects');
    await createProject(page, name);
    await page.locator('.project-card', { hasText: name }).click();
    await expect(page.locator('#projectDetail')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#pdName')).toContainText(name);
  });

  test('detail shows Tasks, Team, Settings tabs', async ({ page }) => {
    const name = `TabTest-${Date.now()}`;
    await registerUser(page, 'TabUser', uniqueEmail('tt'));
    await goToView(page, 'projects');
    await createProject(page, name);
    await page.locator('.project-card', { hasText: name }).click();
    await expect(page.locator('.inner-tab:has-text("Tasks")')).toBeVisible();
    await expect(page.locator('.inner-tab:has-text("Team")')).toBeVisible();
    await expect(page.locator('.inner-tab:has-text("Settings")')).toBeVisible();
  });

  test('update project name via Settings tab', async ({ page }) => {
    const name = `EditMe-${Date.now()}`;
    const updated = `Updated-${Date.now()}`;
    await registerUser(page, 'EditUser', uniqueEmail('eu'));
    await goToView(page, 'projects');
    await createProject(page, name);
    await page.locator('.project-card', { hasText: name }).click();
    await page.click('.inner-tab:has-text("Settings")');
    await page.fill('#epName', updated);
    await page.click('#editProjectForm button[type="submit"]');
    await expectNotification(page, 'Project updated', 'success');
    await expect(page.locator('#pdName')).toContainText(updated);
  });

  test('delete project via Settings tab', async ({ page }) => {
    const name = `DeleteMe-${Date.now()}`;
    await registerUser(page, 'DelUser', uniqueEmail('du'));
    await goToView(page, 'projects');
    await createProject(page, name);
    await page.locator('.project-card', { hasText: name }).click();
    await page.click('.inner-tab:has-text("Settings")');
    page.once('dialog', d => d.accept());
    await page.click('#pdSettings button:has-text("Delete Project")');
    await expectNotification(page, 'Project deleted', 'info');
    await expect(page.locator('#projectsGrid')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.project-card', { hasText: name })).not.toBeVisible();
  });

  test('back button returns to project grid', async ({ page }) => {
    const name = `BackTest-${Date.now()}`;
    await registerUser(page, 'BackUser', uniqueEmail('bu'));
    await goToView(page, 'projects');
    await createProject(page, name);
    await page.locator('.project-card', { hasText: name }).click();
    await page.click('button:has-text("← Back to Projects")');
    await expect(page.locator('#projectsGrid')).toBeVisible();
    await expect(page.locator('#projectDetail')).not.toBeVisible();
  });

  test('add member modal opens and closes', async ({ page }) => {
    const name = `MemberModal-${Date.now()}`;
    await registerUser(page, 'MemberUser', uniqueEmail('mu'));
    await goToView(page, 'projects');
    await createProject(page, name);
    await page.locator('.project-card', { hasText: name }).click();
    await page.click('.inner-tab:has-text("Team")');
    await page.click('button:has-text("+ Add Member")');
    await expect(page.locator('#addMemberModal')).toBeVisible();
    await page.click('#addMemberModal button:has-text("Cancel")');
    await expect(page.locator('#addMemberModal')).not.toBeVisible();
  });

  test('adding nonexistent member shows error', async ({ page }) => {
    const name = `NoMember-${Date.now()}`;
    await registerUser(page, 'NoMemberUser', uniqueEmail('nm'));
    await goToView(page, 'projects');
    await createProject(page, name);
    await page.locator('.project-card', { hasText: name }).click();
    await page.click('.inner-tab:has-text("Team")');
    await page.click('button:has-text("+ Add Member")');
    await page.fill('#amEmail', 'ghost_nobody_xyz@notexist.com');
    await page.click('#addMemberForm button[type="submit"]');
    await expect(page.locator('.notif.error')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#addMemberModal')).toBeVisible();
  });

});
