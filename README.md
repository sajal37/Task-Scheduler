# TaskFlow — Project & Task Manager

A full-stack project management web app with role-based access control, built on a Spring Boot microservices backend and a plain HTML/CSS/JS frontend.

## Features

- **Authentication** — Register / login with JWT; session persisted in `localStorage`
- **Projects** — Create, edit, delete projects; browse all your memberships
- **Team management** — Invite members by email; role-based access (`ADMIN` / `MEMBER`)
- **Tasks** — Create, assign, update status (To Do / In Progress / Done), set due dates, delete tasks
- **Dashboard** — Per-user stats: total assigned, by status, overdue; per-project progress bars
- **Role-based UI** — Admin-only controls (edit project, delete project, add/remove members, delete tasks) are hidden from Members

## Architecture

| Service        | Port     | Responsibility                         |
| -------------- | -------- | -------------------------------------- |
| `api-gateway`  | **8080** | Spring Cloud Gateway — routes, CORS    |
| `user-service` | 8081     | Auth (register/login/JWT), user lookup |
| `task-service` | 8082     | Projects, project tasks, dashboard     |
| `frontend`     | file://  | Plain HTML/CSS/JS (no build step)      |

Both `user-service` and `task-service` use **H2 in-memory** databases (auto-created on start, reset on restart).

## Prerequisites

- **Java 17+**
- **Maven 3.8+** (must be on `PATH`)
- **PowerShell 5+** (built into Windows 10/11)

## Quick Start (single command)

```powershell
.\start.ps1
```

This script will:

1. Build all three services (skipping tests)
2. Launch each service in its own PowerShell window
3. Wait 15 s for startup, then open `frontend/index.html` in your browser

> **Tip:** Close each service window individually to stop it.

## Manual Start

Open three separate terminals:

```powershell
# Terminal 1 — User Service (port 8081)
cd user-service
mvn spring-boot:run

# Terminal 2 — Task Service (port 8082)
cd task-service
mvn spring-boot:run

# Terminal 3 — API Gateway (port 8080)
cd api-gateway
mvn spring-boot:run
```

Then open `frontend/index.html` in your browser.

## API Reference (via Gateway on port 8080)

### Auth

| Method | Path                 | Description                                     |
| ------ | -------------------- | ----------------------------------------------- |
| POST   | `/api/auth/register` | Register `{ name, email, password }`            |
| POST   | `/api/auth/login`    | Login `{ email, password }` → `{ token, user }` |

### Projects

| Method | Path                 | Description            |
| ------ | -------------------- | ---------------------- |
| GET    | `/api/projects`      | List user's projects   |
| POST   | `/api/projects`      | Create project         |
| GET    | `/api/projects/{id}` | Get project + members  |
| PUT    | `/api/projects/{id}` | Update project (Admin) |
| DELETE | `/api/projects/{id}` | Delete project (Admin) |

### Team Members

| Method | Path                                  | Description                 |
| ------ | ------------------------------------- | --------------------------- |
| POST   | `/api/projects/{id}/members`          | Add member by email (Admin) |
| DELETE | `/api/projects/{id}/members/{userId}` | Remove member (Admin)       |

### Tasks

| Method | Path                                | Description         |
| ------ | ----------------------------------- | ------------------- |
| GET    | `/api/projects/{id}/tasks`          | List project tasks  |
| POST   | `/api/projects/{id}/tasks`          | Create task         |
| PUT    | `/api/projects/{id}/tasks/{taskId}` | Update task         |
| DELETE | `/api/projects/{id}/tasks/{taskId}` | Delete task (Admin) |

### Dashboard

| Method | Path             | Description            |
| ------ | ---------------- | ---------------------- |
| GET    | `/api/dashboard` | Stats for current user |

## Troubleshooting

| Problem                               | Fix                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `mvn: command not found`              | Add Maven `bin/` to your `PATH`                                                           |
| Port already in use                   | Kill the process using that port or change port in the service's `application.properties` |
| CORS error in browser                 | Services must all be running; gateway handles CORS                                        |
| 401 Unauthorized                      | Token expired — sign out and sign in again                                                |
| Task-service can't reach user-service | Both must be running; check `user-service.url` in `task-service/application.properties`   |

## License

MIT
