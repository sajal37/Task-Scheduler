// ─── CONFIG ────────────────────────────────────────────────────────────────
// Auto-detect API_BASE: use window.API_BASE if set, otherwise use current origin
const API_BASE = window.API_BASE || window.location.origin;

// ─── STATE ─────────────────────────────────────────────────────────────────
let currentUser = null;
let authToken = null;
let currentProject = null; // full ProjectResponse object
let projectMembers = []; // members of open project
let tasks = []; // tasks of open project

// ─── HELPERS ───────────────────────────────────────────────────────────────
function getToken() {
  return authToken || localStorage.getItem("token");
}

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken(),
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || res.statusText);
  return data;
}

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
function notify(msg, type = "info") {
  const area = document.getElementById("notificationArea");
  const el = document.createElement("div");
  el.className = `notif ${type}`;
  el.textContent = msg;
  area.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ─── AUTH ──────────────────────────────────────────────────────────────────
function switchAuthTab(tab, btn) {
  document
    .querySelectorAll(".auth-tab")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".auth-panel")
    .forEach((p) => p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById(tab + "Panel").classList.add("active");
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  try {
    const data = await fetch(API_BASE + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then((r) => r.json().then((d) => ({ ok: r.ok, d })));
    if (!data.ok) throw new Error(data.d.message || "Login failed");
    finishAuth(data.d.token, {
      id: data.d.id,
      name: data.d.name,
      email: data.d.email,
    });
  } catch (err) {
    notify(err.message, "error");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirm").value;
  if (password !== confirm) {
    notify("Passwords do not match", "error");
    return;
  }
  try {
    const data = await fetch(API_BASE + "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword: confirm }),
    }).then((r) => r.json().then((d) => ({ ok: r.ok, d })));
    if (!data.ok) throw new Error(data.d.message || "Registration failed");
    finishAuth(data.d.token, {
      id: data.d.id,
      name: data.d.name,
      email: data.d.email,
    });
  } catch (err) {
    notify(err.message, "error");
  }
}

function finishAuth(token, user) {
  authToken = token;
  currentUser = user;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  document.getElementById("authModal").classList.remove("active");
  document.getElementById("app").style.display = "flex";
  document.getElementById("sidebarUserName").textContent =
    user.name || user.email;
  document.getElementById("sidebarUserEmail").textContent = user.email || "";
  document.getElementById("userAvatar").textContent = (user.name ||
    user.email ||
    "U")[0].toUpperCase();
  loadDashboard();
}

function signOut() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  document.getElementById("app").style.display = "none";
  document.getElementById("authModal").classList.add("active");
  notify("Signed out", "info");
}

// Restore session on page load
window.addEventListener("DOMContentLoaded", () => {
  const savedToken = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");
  if (savedToken && savedUser) {
    try {
      finishAuth(savedToken, JSON.parse(savedUser));
    } catch {
      signOut();
    }
  }
});

// ─── NAVIGATION ────────────────────────────────────────────────────────────
function showView(name, navEl) {
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  document.getElementById("view-" + name).classList.add("active");
  if (navEl) navEl.classList.add("active");

  if (name === "dashboard") loadDashboard();
  if (name === "projects") loadProjects();
  if (name === "mytasks") loadMyTasks();
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const data = await api("GET", "/api/dashboard");
    document.getElementById("dTotalAssigned").textContent =
      data.totalAssignedTasks ?? 0;
    document.getElementById("dTodo").textContent = data.todoTasks ?? 0;
    document.getElementById("dInProgress").textContent =
      data.inProgressTasks ?? 0;
    document.getElementById("dDone").textContent = data.doneTasks ?? 0;
    document.getElementById("dOverdue").textContent = data.overdueTasks ?? 0;

    const list = document.getElementById("dashProjectProgress");
    const projects = data.projectProgress || [];
    if (projects.length === 0) {
      list.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📁</div><p>No projects yet. Create one to get started!</p></div>';
      return;
    }
    list.innerHTML = projects
      .map((p) => {
        const pct =
          p.totalTasks > 0
            ? Math.round((p.completedTasks / p.totalTasks) * 100)
            : 0;
        return `<div class="progress-item">
        <div class="progress-item-header">
          <span class="progress-item-name">${esc(p.projectName)}</span>
          <span class="progress-pct">${pct}%</span>
        </div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <div class="progress-meta">${p.completedTasks} / ${p.totalTasks} tasks completed</div>
      </div>`;
      })
      .join("");
  } catch (err) {
    notify("Failed to load dashboard: " + err.message, "error");
  }
}

// ─── PROJECTS ──────────────────────────────────────────────────────────────
async function loadProjects() {
  closeProjectDetail();
  try {
    const projects = await api("GET", "/api/projects");
    const grid = document.getElementById("projectsGrid");
    if (!projects.length) {
      grid.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📁</div><p>No projects yet. Create your first one!</p></div>';
      return;
    }
    grid.innerHTML = projects
      .map((p) => {
        const role = p.currentUserRole || "MEMBER";
        const badge =
          role === "ADMIN"
            ? `<span class="project-role-badge badge-admin">Admin</span>`
            : `<span class="project-role-badge badge-member">Member</span>`;
        return `<div class="project-card" onclick="openProject(${p.id})">
        <div class="project-card-name">${esc(p.name)}</div>
        <div class="project-card-desc">${esc(p.description || "")}</div>
        <div class="project-card-footer">
          <span>${p.memberCount} member${p.memberCount !== 1 ? "s" : ""} · ${p.progress}%</span>
          ${badge}
        </div>
      </div>`;
      })
      .join("");
  } catch (err) {
    notify("Failed to load projects: " + err.message, "error");
  }
}

function openCreateProjectModal() {
  document.getElementById("cpName").value = "";
  document.getElementById("cpDescription").value = "";
  openModal("createProjectModal");
}

async function handleCreateProject(e) {
  e.preventDefault();
  const name = document.getElementById("cpName").value.trim();
  const description = document.getElementById("cpDescription").value.trim();
  try {
    await api("POST", "/api/projects", { name, description });
    closeModal("createProjectModal");
    notify("Project created!", "success");
    loadProjects();
  } catch (err) {
    notify("Error: " + err.message, "error");
  }
}

async function openProject(id) {
  try {
    const p = await api("GET", "/api/projects/" + id);
    currentProject = p;
    projectMembers = p.members || [];

    document.getElementById("projectsGrid").style.display = "none";
    const detail = document.getElementById("projectDetail");
    detail.style.display = "block";

    document.getElementById("pdName").textContent = p.name;
    document.getElementById("pdDescription").textContent = p.description || "";

    const role = p.currentUserRole || "MEMBER";
    const isAdmin = role === "ADMIN";
    const badge = document.getElementById("pdRoleBadge");
    badge.textContent = isAdmin ? "Admin" : "Member";
    badge.className = `role-badge ${isAdmin ? "badge-admin" : "badge-member"}`;

    // Show/hide admin-only elements
    document.querySelectorAll(".admin-only").forEach((el) => {
      el.style.display = isAdmin ? "" : "none";
    });

    // Pre-fill settings form
    document.getElementById("epName").value = p.name;
    document.getElementById("epDescription").value = p.description || "";

    // Reset inner tabs
    showInnerTab("pdTasks", document.querySelector(".inner-tab"));

    await loadProjectTasks();
    renderProjectMembers();
  } catch (err) {
    notify("Failed to open project: " + err.message, "error");
  }
}

function closeProjectDetail() {
  document.getElementById("projectsGrid").style.display = "";
  document.getElementById("projectDetail").style.display = "none";
  currentProject = null;
}

function showInnerTab(tabId, btn) {
  document
    .querySelectorAll(".inner-tab-content")
    .forEach((c) => c.classList.remove("active"));
  document
    .querySelectorAll(".inner-tab")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  if (btn) btn.classList.add("active");
}

async function handleEditProject(e) {
  e.preventDefault();
  if (!currentProject) return;
  const name = document.getElementById("epName").value.trim();
  const description = document.getElementById("epDescription").value.trim();
  try {
    await api("PUT", "/api/projects/" + currentProject.id, {
      name,
      description,
    });
    notify("Project updated!", "success");
    currentProject.name = name;
    currentProject.description = description;
    document.getElementById("pdName").textContent = name;
    document.getElementById("pdDescription").textContent = description;
  } catch (err) {
    notify("Error: " + err.message, "error");
  }
}

async function confirmDeleteProject() {
  if (!currentProject) return;
  if (
    !confirm(`Delete project "${currentProject.name}"? This cannot be undone.`)
  )
    return;
  try {
    await api("DELETE", "/api/projects/" + currentProject.id);
    notify("Project deleted", "info");
    closeProjectDetail();
    loadProjects();
  } catch (err) {
    notify("Error: " + err.message, "error");
  }
}

// ─── PROJECT TASKS ─────────────────────────────────────────────────────────
async function loadProjectTasks() {
  if (!currentProject) return;
  try {
    tasks = await api("GET", `/api/projects/${currentProject.id}/tasks`);
    renderTaskList("pdTaskList", tasks, true);
  } catch (err) {
    document.getElementById("pdTaskList").innerHTML =
      `<div class="empty-state"><p>Failed to load tasks: ${esc(err.message)}</p></div>`;
  }
}

function renderTaskList(containerId, tasks, inProject) {
  const el = document.getElementById(containerId);
  if (!tasks || !tasks.length) {
    el.innerHTML =
      '<div class="empty-state"><div class="empty-icon">✅</div><p>No tasks yet.</p></div>';
    return;
  }
  el.innerHTML = tasks.map((t) => taskItemHTML(t, inProject)).join("");
}

function taskItemHTML(t, inProject) {
  const today = new Date().toISOString().split("T")[0];
  const overdue = t.dueDate && t.status !== "DONE" && t.dueDate < today;
  const isDone = t.status === "DONE";
  const isAdmin = currentProject && currentProject.currentUserRole === "ADMIN";
  const canEdit =
    inProject &&
    (isAdmin ||
      t.assignedUserId == currentUser?.id ||
      t.createdByUserId == currentUser?.id);

  const actions = inProject
    ? `
    <div class="task-actions">
      <button class="btn btn-secondary btn-sm" onclick="openEditTaskModal(${t.id})">✏️</button>
      ${isAdmin ? `<button class="btn btn-danger btn-sm" onclick="deleteTask(${t.id})">🗑️</button>` : ""}
    </div>`
    : "";

  const assigneeName =
    t.assignedUserName ||
    (t.assignedUserId ? `#${t.assignedUserId}` : "Unassigned");

  return `<div class="task-item priority-${t.priority}">
    <div class="task-main">
      <div class="task-title ${isDone ? "done-title" : ""}">${esc(t.title)}</div>
      <div class="task-meta">
        <span class="task-badge status-${t.status}">${statusLabel(t.status)}</span>
        <span class="task-badge priority-${t.priority}-badge">${t.priority}</span>
        ${t.dueDate ? `<span class="task-badge ${overdue ? "task-overdue" : ""}">Due: ${t.dueDate}</span>` : ""}
        ${inProject ? `<span>👤 ${esc(assigneeName)}</span>` : ""}
        ${t.projectName ? `<span>📁 ${esc(t.projectName)}</span>` : ""}
      </div>
      ${t.description ? `<div style="font-size:13px;color:#718096;margin-top:5px">${esc(t.description)}</div>` : ""}
    </div>
    ${actions}
  </div>`;
}

function renderProjectMembers() {
  const el = document.getElementById("pdMemberList");
  const isAdmin = currentProject && currentProject.currentUserRole === "ADMIN";
  if (!projectMembers.length) {
    el.innerHTML =
      '<div class="empty-state"><div class="empty-icon">👥</div><p>No members yet.</p></div>';
    return;
  }
  el.innerHTML = projectMembers
    .map((m) => {
      const name = m.name || m.email || `User #${m.userId}`;
      const email = m.email || "";
      const isSelf = currentUser && m.userId == currentUser.id;
      return `<div class="member-item">
      <div class="member-avatar">${name[0].toUpperCase()}</div>
      <div class="member-info">
        <div class="member-name">${esc(name)} ${isSelf ? "(you)" : ""}</div>
        <div class="member-email">${esc(email)}</div>
      </div>
      <div class="member-actions">
        <span class="task-badge ${m.role === "ADMIN" ? "badge-admin" : "badge-member"}">${m.role}</span>
        ${isAdmin && !isSelf ? `<button class="btn btn-danger btn-sm" onclick="removeMember(${m.userId})">Remove</button>` : ""}
      </div>
    </div>`;
    })
    .join("");
}

function openAddMemberModal() {
  document.getElementById("amEmail").value = "";
  openModal("addMemberModal");
}

async function handleAddMember(e) {
  e.preventDefault();
  if (!currentProject) return;
  const email = document.getElementById("amEmail").value.trim();
  try {
    await api("POST", `/api/projects/${currentProject.id}/members`, { email });
    notify("Member added!", "success");
    closeModal("addMemberModal");
    const updated = await api("GET", "/api/projects/" + currentProject.id);
    projectMembers = updated.members || [];
    renderProjectMembers();
  } catch (err) {
    notify("Error: " + err.message, "error");
  }
}

async function removeMember(userId) {
  if (!currentProject || !confirm("Remove this member?")) return;
  try {
    await api("DELETE", `/api/projects/${currentProject.id}/members/${userId}`);
    notify("Member removed", "info");
    projectMembers = projectMembers.filter((m) => m.userId !== userId);
    renderProjectMembers();
  } catch (err) {
    notify("Error: " + err.message, "error");
  }
}

// ─── MODAL HELPERS ─────────────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "flex";
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

// ─── UTILS ─────────────────────────────────────────────────────────────────
function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusLabel(status) {
  const labels = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    DONE: "Done",
  };
  return labels[status] || status;
}

// ─── TASK MODAL ─────────────────────────────────────────────────────────────
function openCreateTaskModal() {
  document.getElementById("tmTitle").value = "";
  document.getElementById("tmDescription").value = "";
  document.getElementById("tmPriority").value = "MEDIUM";
  document.getElementById("tmStatus").value = "TODO";
  document.getElementById("tmDueDate").value = "";
  document.getElementById("taskModalId").value = "";
  document.getElementById("taskModalTitle").textContent = "New Task";
  populateAssigneeSelect();
  openModal("taskModal");
}

function openEditTaskModal(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;
  document.getElementById("tmTitle").value = task.title || "";
  document.getElementById("tmDescription").value = task.description || "";
  document.getElementById("tmPriority").value = task.priority || "MEDIUM";
  document.getElementById("tmStatus").value = task.status || "TODO";
  document.getElementById("tmDueDate").value = task.dueDate || "";
  document.getElementById("taskModalId").value = taskId;
  document.getElementById("taskModalTitle").textContent = "Edit Task";
  populateAssigneeSelect(task.assignedUserId);
  openModal("taskModal");
}

function populateAssigneeSelect(selectedId = null) {
  const select = document.getElementById("tmAssignee");
  select.innerHTML = '<option value="">Unassigned</option>';
  projectMembers.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.userId;
    opt.textContent = m.name || m.email || `User #${m.userId}`;
    if (m.userId == selectedId) opt.selected = true;
    select.appendChild(opt);
  });
}

async function handleSaveTask(e) {
  e.preventDefault();
  if (!currentProject) return;
  const taskId = document.getElementById("taskModalId").value;
  const payload = {
    title: document.getElementById("tmTitle").value.trim(),
    description: document.getElementById("tmDescription").value.trim(),
    priority: document.getElementById("tmPriority").value,
    status: document.getElementById("tmStatus").value,
    dueDate: document.getElementById("tmDueDate").value || null,
    assignedUserId: document.getElementById("tmAssignee").value || null,
  };

  try {
    if (taskId) {
      await api(
        "PUT",
        `/api/projects/${currentProject.id}/tasks/${taskId}`,
        payload,
      );
      notify("Task updated!", "success");
    } else {
      await api("POST", `/api/projects/${currentProject.id}/tasks`, payload);
      notify("Task created!", "success");
    }
    closeModal("taskModal");
    loadProjectTasks();
  } catch (err) {
    notify("Error: " + err.message, "error");
  }
}

async function deleteTask(taskId) {
  if (!confirm("Delete this task?")) return;
  try {
    await api("DELETE", `/api/projects/${currentProject.id}/tasks/${taskId}`);
    notify("Task deleted", "info");
    loadProjectTasks();
  } catch (err) {
    notify("Error: " + err.message, "error");
  }
}

// ─── MY TASKS ────────────────────────────────────────────────────────────────
async function loadMyTasks() {
  try {
    const projects = await api("GET", "/api/projects");
    const container = document.getElementById("myTasksContainer");
    if (!projects.length) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">✅</div><p>Join or create a project to see your tasks.</p></div>';
      return;
    }
    const allTasks = [];
    for (const p of projects) {
      const tasks = await api("GET", `/api/projects/${p.id}/tasks`);
      tasks.forEach((t) => {
        t.projectName = p.name;
        t.projectId = p.id;
      });
      allTasks.push(...tasks);
    }
    const myTasks = allTasks.filter(
      (t) =>
        currentUser &&
        (t.assignedUserId == currentUser.id ||
          t.createdByUserId == currentUser.id),
    );
    if (!myTasks.length) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">✅</div><p>No tasks assigned to you yet.</p></div>';
      return;
    }
    container.innerHTML = myTasks.map((t) => taskItemHTML(t, false)).join("");
  } catch (err) {
    notify("Failed to load tasks: " + err.message, "error");
  }
}
