// tests/04-tasks.spec.js — Project Task CRUD tests

const { test, expect } = require('@playwright/test');
const { uniqueEmail, registerUser, goToView, expectNotification } = require('./helpers');

async function createProject(page, name) {
  await page.click('button:has-text("New Project")');
  await page.fill('#cpName', name);
  await page.click('#createProjectForm button[type="submit"]');
  await expect(page.locator('.project-card', { hasText: name })).toBeVisible({ timeout: 15000 });
  await page.locator('.project-card', { hasText: name }).click();
  await expect(page.locator('#projectDetail')).toBeVisible({ timeout: 10000 });
}

async function openCreateTaskModal(page) {
  await page.click('button:has-text("+ Add Task")');
  await expect(page.locator('#taskModal')).toBeVisible({ timeout: 10000 });
}

test.describe('Tasks', () => {

  test('empty task list shown for new project', async ({ page }) => {
    await registerUser(page, 'TaskEmpty', uniqueEmail('te'));
    await goToView(page, 'projects');
    await createProject(page, `EmptyProj-${Date.now()}`);
    await expect(page.locator('#pdTaskList .empty-state')).toBeVisible({ timeout: 15000 });
  });

  test('create task modal opens', async ({ page }) => {
    await registerUser(page, 'TaskModalUser', uniqueEmail('tm'));
    await goToView(page, 'projects');
    await createProject(page, `ModalProj-${Date.now()}`);
    await openCreateTaskModal(page);
    await expect(page.locator('#tmTitle')).toBeVisible();
    await expect(page.locator('#tmPriority')).toBeVisible();
    await expect(page.locator('#tmStatus')).toBeVisible();
  });

  test('cancel task modal closes without creating', async ({ page }) => {
    await registerUser(page, 'TaskCancel', uniqueEmail('tc'));
    await goToView(page, 'projects');
    await createProject(page, `CancelProj-${Date.now()}`);
    await openCreateTaskModal(page);
    await page.fill('#tmTitle', 'Should Not Exist');
    await page.click('#taskModal button:has-text("Cancel")');
    await expect(page.locator('#taskModal')).not.toBeVisible();
    await expect(page.locator('#pdTaskList .empty-state')).toBeVisible({ timeout: 10000 });
  });

  test('create task successfully', async ({ page }) => {
    const taskTitle = `Task-${Date.now()}`;
    await registerUser(page, 'TaskCreate', uniqueEmail('tcr'));
    await goToView(page, 'projects');
    await createProject(page, `TaskProj-${Date.now()}`);
    await openCreateTaskModal(page);
    await page.fill('#tmTitle', taskTitle);
    await page.selectOption('#tmPriority', 'HIGH');
    await page.selectOption('#tmStatus', 'TODO');
    await page.click('#taskForm button[type="submit"]');
    await expectNotification(page, 'Task created', 'success');
    await expect(page.locator('#pdTaskList .task-item', { hasText: taskTitle })).toBeVisible({ timeout: 15000 });
  });

  test('task shows correct priority badge', async ({ page }) => {
    const taskTitle = `HighPrio-${Date.now()}`;
    await registerUser(page, 'PrioUser', uniqueEmail('pu'));
    await goToView(page, 'projects');
    await createProject(page, `PrioProj-${Date.now()}`);
    await openCreateTaskModal(page);
    await page.fill('#tmTitle', taskTitle);
    await page.selectOption('#tmPriority', 'HIGH');
    await page.click('#taskForm button[type="submit"]');
    await expect(page.locator('.task-item', { hasText: taskTitle }).locator('.priority-HIGH-badge')).toBeVisible({ timeout: 15000 });
  });

  test('edit task via pencil button', async ({ page }) => {
    const taskTitle = `EditTask-${Date.now()}`;
    const updatedTitle = `Updated-${Date.now()}`;
    await registerUser(page, 'EditTaskUser', uniqueEmail('et'));
    await goToView(page, 'projects');
    await createProject(page, `EditProj-${Date.now()}`);
    await openCreateTaskModal(page);
    await page.fill('#tmTitle', taskTitle);
    await page.click('#taskForm button[type="submit"]');
    await expect(page.locator('.task-item', { hasText: taskTitle })).toBeVisible({ timeout: 15000 });

    // Click pencil button
    await page.locator('.task-item', { hasText: taskTitle }).locator('button:has-text("✏️")').click();
    await expect(page.locator('#taskModal')).toBeVisible();
    await expect(page.locator('#taskModalTitle')).toContainText('Edit Task');

    await page.fill('#tmTitle', updatedTitle);
    await page.click('#taskForm button[type="submit"]');
    await expectNotification(page, 'Task updated', 'success');
    await expect(page.locator('.task-item', { hasText: updatedTitle })).toBeVisible({ timeout: 15000 });
  });

  test('delete task via trash button', async ({ page }) => {
    const taskTitle = `DeleteTask-${Date.now()}`;
    await registerUser(page, 'DelTaskUser', uniqueEmail('dt'));
    await goToView(page, 'projects');
    await createProject(page, `DelProj-${Date.now()}`);
    await openCreateTaskModal(page);
    await page.fill('#tmTitle', taskTitle);
    await page.click('#taskForm button[type="submit"]');
    await expect(page.locator('.task-item', { hasText: taskTitle })).toBeVisible({ timeout: 15000 });

    page.once('dialog', d => d.accept());
    await page.locator('.task-item', { hasText: taskTitle }).locator('button:has-text("🗑️")').click();
    await expectNotification(page, 'Task deleted', 'info');
    await expect(page.locator('.task-item', { hasText: taskTitle })).not.toBeVisible();
  });

  test('multiple tasks show in task list', async ({ page }) => {
    await registerUser(page, 'MultiTaskUser', uniqueEmail('mt'));
    await goToView(page, 'projects');
    await createProject(page, `MultiProj-${Date.now()}`);

    for (const title of [`Alpha-${Date.now()}`, `Beta-${Date.now()}`, `Gamma-${Date.now()}`]) {
      await openCreateTaskModal(page);
      await page.fill('#tmTitle', title);
      await page.click('#taskForm button[type="submit"]');
      await expect(page.locator('.task-item', { hasText: title })).toBeVisible({ timeout: 15000 });
    }

    const taskCount = await page.locator('#pdTaskList .task-item').count();
    expect(taskCount).toBeGreaterThanOrEqual(3);
  });

  test('My Tasks view shows tasks assigned to current user', async ({ page }) => {
    const taskTitle = `MyTask-${Date.now()}`;
    await registerUser(page, 'MyTaskUser', uniqueEmail('mtu'));
    await goToView(page, 'projects');
    await createProject(page, `MyProj-${Date.now()}`);
    await openCreateTaskModal(page);
    await page.fill('#tmTitle', taskTitle);
    // Assign to self (first option after Unassigned in the select)
    const selfOption = page.locator('#tmAssignee option').nth(1);
    const selfVal = await selfOption.getAttribute('value');
    if (selfVal) await page.selectOption('#tmAssignee', selfVal);
    await page.click('#taskForm button[type="submit"]');
    await expect(page.locator('.task-item', { hasText: taskTitle })).toBeVisible({ timeout: 15000 });

    await goToView(page, 'mytasks');
    await expect(page.locator('#myTasksContainer')).toBeVisible();
  });

});
