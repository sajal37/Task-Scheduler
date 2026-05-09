# TaskFlow - Project & Task Management System

## Executive Summary

TaskFlow is a comprehensive, full-stack project and task management application built with a microservices architecture. It enables users to create projects, manage teams with role-based access control, create and assign tasks, track progress through a dashboard, and collaborate effectively. The system implements RESTful APIs, SQL database with proper validations and relationships, and features role-based access control (RBAC) for secure team management.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design](#architecture--design)
3. [Technology Stack](#technology-stack)
4. [Features & Functionality](#features--functionality)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Frontend Architecture](#frontend-architecture)
8. [Security Implementation](#security-implementation)
9. [Deployment Strategy](#deployment-strategy)
10. [Development Workflow](#development-workflow)
11. [Code Structure](#code-structure)
12. [Key Algorithms & Logic](#key-algorithms--logic)
13. [Testing Strategy](#testing-strategy)
14. [Performance Considerations](#performance-considerations)
15. [Challenges & Solutions](#challenges--solutions)
16. [Future Enhancements](#future-enhancements)
17. [Learning Outcomes](#learning-outcomes)

---

## Project Overview

### Problem Statement

Modern teams require efficient tools to manage projects, assign tasks, and track progress. Existing solutions often lack flexibility in team management, role-based access control, or are too complex for small teams. TaskFlow addresses these needs by providing a lightweight yet powerful project management system with clear separation of concerns and secure access control.

### Solution

TaskFlow is a microservices-based web application that:
- Allows users to register/login with email/password or OAuth2 (Google/GitHub)
- Enables creation of multiple projects with descriptions
- Supports team management with Admin/Member roles
- Provides task creation with status tracking (TODO, IN_PROGRESS, DONE)
- Includes priority levels (LOW, MEDIUM, HIGH) and due dates
- Offers a dashboard with task statistics and project progress
- Implements role-based access control for secure operations
- Uses RESTful APIs for all backend operations
- Employs SQL database with proper entity relationships

### Target Users

- Small to medium-sized teams
- Project managers
- Software development teams
- Any group requiring task tracking and collaboration

---

## Architecture & Design

### Microservices Architecture

The application follows a microservices pattern with three core services:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Static)                        │
│              HTML, CSS, JavaScript (ES6+)                    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Port 8080)                    │
│              Spring Cloud Gateway + CORS                    │
└───────────┬───────────────────────┬─────────────────────────┘
            │                       │
            │                       │
            ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐
│  User Service       │   │  Task Service       │
│  (Port 8081)        │   │  (Port 8082)        │
│  - Authentication   │   │  - Projects         │
│  - User Management │   │  - Tasks            │
│  - JWT Tokens      │   │  - Team Management  │
│  - OAuth2           │   │  - Dashboard        │
└──────────┬──────────┘   └──────────┬──────────┘
           │                         │
           └─────────┬───────────────┘
                     │
                     ▼
           ┌──────────────────┐
           │  H2 Database     │
           │  (In-Memory SQL) │
           └──────────────────┘
```

### Service Responsibilities

#### User Service (Port 8081)
- User registration and authentication
- JWT token generation and validation
- OAuth2 integration (Google, GitHub)
- User profile management
- Email-based user lookup for team invitations

#### Task Service (Port 8082)
- Project CRUD operations
- Task CRUD operations within projects
- Team member management (add/remove/role updates)
- Dashboard statistics generation
- Role-based access control enforcement

#### API Gateway (Port 8080)
- Single entry point for all client requests
- Request routing to appropriate services
- CORS configuration
- Request/response transformation

### Design Patterns Used

1. **Repository Pattern**: JPA repositories for data access
2. **Service Layer Pattern**: Business logic separated from controllers
3. **DTO Pattern**: Data transfer objects for API communication
4. **Feign Client Pattern**: Inter-service communication
5. **Builder Pattern**: Used in DTO construction
6. **Strategy Pattern**: Different authentication strategies (email/password vs OAuth2)

---

## Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 17 | Primary programming language |
| Spring Boot | 3.2.0 | Application framework |
| Spring Cloud Gateway | 3.2.0 | API Gateway |
| Spring Data JPA | 3.2.0 | Database ORM |
| Spring Security | 6.2.0 | Security framework |
| Spring Web | 3.2.0 | REST API |
| Hibernate | 6.x | JPA implementation |
| H2 Database | 2.x | In-memory SQL database |
| JWT (jjwt) | 0.12.x | Token generation/validation |
| Feign Client | 4.x | Declarative REST client |
| Maven | 3.9+ | Build tool |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| HTML5 | - | Structure |
| CSS3 | - | Styling with custom variables |
| JavaScript (ES6+) | - | Client-side logic |
| Fetch API | - | HTTP requests |

### DevOps & Deployment

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Railway | Cloud deployment platform |
| Nginx | Static file serving (frontend) |
| Git | Version control |

---

## Features & Functionality

### 1. Authentication System

#### Email/Password Authentication
- User registration with name, email, password, and password confirmation
- Client-side validation for password matching
- Server-side validation using DTO annotations
- Secure password storage (can be enhanced with BCrypt)
- JWT token generation upon successful login
- Token-based session management (stored in localStorage)

#### OAuth2 Authentication
- Google OAuth2 integration
- GitHub OAuth2 integration
- Authorization code flow
- Automatic user creation on first OAuth login
- Token exchange with OAuth providers
- Redirect URI handling

#### Session Management
- JWT tokens stored in browser localStorage
- Token validation on protected endpoints
- Automatic token inclusion in Authorization header
- Session restoration on page reload
- Sign-out functionality with token cleanup

### 2. Project Management

#### Project Creation
- Project name (required, max 100 chars)
- Project description (optional, max 500 chars)
- Automatic project owner assignment
- Unique project identification
- Timestamp tracking (created_at, updated_at)

#### Project Viewing
- List all projects for current user
- Project cards showing: name, description, member count, progress
- Role badge display (Admin/Member)
- Empty state handling for no projects

#### Project Editing
- Update project name and description
- Admin-only operation
- Real-time UI update
- Success/error notifications

#### Project Deletion
- Confirmation dialog
- Admin-only operation
- Cascade deletion of associated tasks and members
- Automatic return to projects list

### 3. Task Management

#### Task Creation
- Task title (required, max 200 chars)
- Task description (optional, max 1000 chars)
- Priority selection (LOW, MEDIUM, HIGH)
- Status selection (TODO, IN_PROGRESS, DONE)
- Due date (optional)
- Assignee selection from project members
- Automatic task ID generation
- Creator tracking (created_by_user_id)

#### Task Viewing
- Task list within project view
- Task cards showing: title, status badge, priority badge, due date, assignee
- Overdue task highlighting (due date past and status not DONE)
- Completed task visual distinction
- Empty state handling

#### Task Editing
- Update all task fields
- Admin or task assignee/creator only
- Modal-based editing
- Real-time UI update

#### Task Deletion
- Confirmation dialog
- Admin-only operation
- Automatic task list refresh

### 4. Team Management

#### Member Addition
- Email-based member invitation
- User lookup via user-service
- Automatic member creation with MEMBER role
- Admin-only operation
- Email validation

#### Member Removal
- Confirmation dialog
- Admin-only operation
- Cannot remove project owner
- Cannot remove self
- Real-time member list update

#### Role Management
- Update member role (MEMBER ↔ ADMIN)
- Admin-only operation
- Cannot change own role
- Role affects UI permissions

#### Member List Display
- Member avatar (first letter of name)
- Member name and email
- Current user indication ("(you)")
- Role badge
- Remove button (admin-only, not for self)

### 5. Dashboard

#### Task Statistics
- Total assigned tasks count
- TODO tasks count
- IN_PROGRESS tasks count
- DONE tasks count
- Overdue tasks count
- Real-time updates

#### Project Progress
- Per-project progress percentage
- Completed tasks / total tasks
- Progress bar visualization
- Empty state for no projects

### 6. My Tasks View

#### Personal Task Aggregation
- Fetches tasks from all projects
- Filters by assigned tasks
- Filters by created tasks
- Cross-project task display
- Project name shown per task

### 7. Role-Based Access Control

#### Admin Privileges
- Create/edit/delete projects
- Add/remove team members
- Update member roles
- Delete any task
- View all project settings

#### Member Privileges
- View project details
- Create tasks
- Edit own tasks or assigned tasks
- View team members
- Cannot delete projects or members
- Cannot change member roles

### 8. UI/UX Features

#### Responsive Design
- Mobile-friendly layout
- Sidebar navigation
- Collapsible sections
- Modal-based forms

#### Feedback System
- Toast notifications for success/error
- Loading states during API calls
- Empty state illustrations
- Confirmation dialogs for destructive actions

#### Navigation
- Sidebar with Dashboard, Projects, My Tasks
- Breadcrumb navigation within projects
- Back to projects button
- Tab-based inner navigation (Tasks/Team/Settings)

---

## Database Schema

### Entity Relationships

```
User (user-service)
├── id (Long, Primary Key)
├── name (String)
├── email (String, Unique)
├── password (String)
└── oauthProvider (String)

Project (task-service)
├── id (Long, Primary Key)
├── name (String)
├── description (String)
├── ownerId (Long, FK to User)
├── createdAt (Timestamp)
└── updatedAt (Timestamp)

ProjectMember (task-service)
├── id (Long, Primary Key)
├── projectId (Long, FK to Project)
├── userId (Long, FK to User)
├── role (ProjectRole Enum)
├── joinedAt (Timestamp)
└── Unique constraint on (projectId, userId)

ProjectTask (task-service)
├── id (Long, Primary Key)
├── project (Project, FK)
├── title (String)
├── description (String)
├── status (ProjectTaskStatus Enum)
├── priority (ProjectTaskPriority Enum)
├── dueDate (LocalDate)
├── assignedUserId (Long, FK to User)
├── createdByUserId (Long, FK to User)
├── createdAt (Timestamp)
└── updatedAt (Timestamp)
```

### Entity Details

#### User Entity
- **id**: Auto-generated Long primary key
- **name**: User's full name
- **email**: Unique email address for authentication and lookups
- **password**: Hashed password for email/password authentication
- **oauthProvider**: OAuth provider used (google, github, or null for email)
- **profilePicture**: URL to profile image (future enhancement)
- **createdAt**: Account creation timestamp
- **updatedAt**: Last update timestamp

#### Project Entity
- **id**: Auto-generated Long primary key
- **name**: Project name (max 100 characters, required)
- **description**: Project description (max 500 characters, optional)
- **ownerId**: ID of the user who created the project (always Admin)
- **createdAt**: Project creation timestamp
- **updatedAt**: Last modification timestamp

#### ProjectMember Entity
- **id**: Auto-generated Long primary key
- **project**: Many-to-one relationship with Project
- **userId**: ID of the user (reference to user-service)
- **role**: Enum (ADMIN or MEMBER)
- **joinedAt**: Timestamp when member was added
- **Unique constraint**: Ensures a user can only be added once per project

#### ProjectTask Entity
- **id**: Auto-generated Long primary key
- **project**: Many-to-one relationship with Project
- **title**: Task title (max 200 characters, required)
- **description**: Task description (max 1000 characters, optional)
- **status**: Enum (TODO, IN_PROGRESS, DONE)
- **priority**: Enum (LOW, MEDIUM, HIGH)
- **dueDate**: Optional due date for the task
- **assignedUserId**: ID of the user assigned to the task (can be null)
- **createdByUserId**: ID of the user who created the task
- **createdAt**: Task creation timestamp
- **updatedAt**: Last modification timestamp

### Enum Definitions

#### ProjectRole
- **ADMIN**: Full access to project management
- **MEMBER**: Limited access (cannot delete project or members)

#### ProjectTaskStatus
- **TODO**: Task not started
- **IN_PROGRESS**: Task currently being worked on
- **DONE**: Task completed

#### ProjectTaskPriority
- **LOW**: Low priority task
- **MEDIUM**: Medium priority task
- **HIGH**: High priority task

---

## API Documentation

### User Service Endpoints

#### Authentication

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | /api/auth/login | User login | `{email, password}` | `{token, id, name, email}` |
| POST | /api/auth/register | User registration | `{name, email, password, confirmPassword}` | `{token, id, name, email}` |
| POST | /api/auth/validate | Validate JWT token | Header: `Authorization: Bearer <token>` | `true/false` |
| POST | /api/auth/user-info | Get user info from token | Header: `Authorization: Bearer <token>` | `{id, name, email}` |
| GET | /api/auth/lookup/email?email=xxx | Lookup user by email | Header: `Authorization: Bearer <token>` | `{id, name, email}` |
| GET | /api/auth/lookup/{id} | Lookup user by ID | Header: `Authorization: Bearer <token>` | `{id, name, email}` |

#### OAuth2

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|-------------|
| GET | /api/auth/oauth2/authorize/google | Initiate Google OAuth | `redirect_uri` |
| GET | /api/auth/oauth2/callback/google | Google OAuth callback | `code`, `state` |
| GET | /api/auth/oauth2/authorize/github | Initiate GitHub OAuth | `redirect_uri` |
| GET | /api/auth/oauth2/callback/github | GitHub OAuth callback | `code`, `state` |

### Task Service Endpoints

#### Projects

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | /api/projects | List all projects for user | Header: `Authorization: Bearer <token>` | `ProjectResponse[]` |
| POST | /api/projects | Create new project | `{name, description}` | `ProjectResponse` |
| GET | /api/projects/{id} | Get project details | Header: `Authorization: Bearer <token>` | `ProjectResponse` |
| PUT | /api/projects/{id} | Update project | `{name, description}` | `ProjectResponse` |
| DELETE | /api/projects/{id} | Delete project | Header: `Authorization: Bearer <token>` | - |

#### Project Members

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | /api/projects/{id}/members | Add member | `{email}` | - |
| PUT | /api/projects/{id}/members/{userId}/role | Update member role | `{role}` | - |
| DELETE | /api/projects/{id}/members/{userId} | Remove member | Header: `Authorization: Bearer <token>` | - |

#### Project Tasks

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | /api/projects/{id}/tasks | List project tasks | Header: `Authorization: Bearer <token>` | `ProjectTaskResponse[]` |
| POST | /api/projects/{id}/tasks | Create task | `{title, description, priority, status, dueDate, assignedUserId}` | `ProjectTaskResponse` |
| PUT | /api/projects/{id}/tasks/{taskId} | Update task | `{title, description, priority, status, dueDate, assignedUserId}` | `ProjectTaskResponse` |
| DELETE | /api/projects/{id}/tasks/{taskId} | Delete task | Header: `Authorization: Bearer <token>` | - |

#### Dashboard

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | /api/dashboard | Get dashboard statistics | `DashboardResponse` |

### API Gateway Routes

| Path Pattern | Destination Service |
|--------------|---------------------|
| /api/auth/** | user-service |
| /api/projects/** | task-service |
| /api/tasks/** | task-service |
| /api/dashboard/** | task-service |

### DTO Structures

#### AuthResponse
```json
{
  "token": "JWT_TOKEN_STRING",
  "type": "Bearer",
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### ProjectResponse
```json
{
  "id": 1,
  "name": "My Project",
  "description": "Project description",
  "ownerId": 123,
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2024-01-01T00:00:00",
  "memberCount": 3,
  "progress": 50,
  "currentUserRole": "ADMIN",
  "members": [
    {
      "userId": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN"
    }
  ]
}
```

#### ProjectTaskResponse
```json
{
  "id": 1,
  "projectId": 1,
  "title": "Task Title",
  "description": "Task description",
  "status": "TODO",
  "priority": "MEDIUM",
  "dueDate": "2024-12-31",
  "assignedUserId": 123,
  "assignedUserName": "John Doe",
  "createdByUserId": 123,
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2024-01-01T00:00:00"
}
```

#### DashboardResponse
```json
{
  "totalAssignedTasks": 10,
  "todoTasks": 5,
  "inProgressTasks": 3,
  "doneTasks": 2,
  "overdueTasks": 1,
  "projectProgress": [
    {
      "projectId": 1,
      "projectName": "My Project",
      "totalTasks": 10,
      "completedTasks": 5
    }
  ]
}
```

---

## Frontend Architecture

### File Structure

```
frontend/
├── index.html          # Main HTML structure
├── style.css           # All styling with CSS variables
└── script.js           # All client-side logic
```

### HTML Structure

The `index.html` file contains:
- Authentication modal (login/register tabs)
- Main application layout with sidebar
- Dashboard view
- Projects view with project grid
- Project detail view with tabs (Tasks/Team/Settings)
- My Tasks view
- Task creation/editing modal
- Add member modal
- Edit project modal
- Notification area

### CSS Architecture

The `style.css` file uses:
- CSS custom properties (variables) for theming
- Flexbox for layout
- CSS Grid for project cards
- Responsive design with media queries
- Modal system with overlay
- Utility classes for common patterns

#### CSS Variables
```css
:root {
  --primary: #4f46e5;
  --secondary: #64748b;
  --success: #22c55e;
  --danger: #ef4444;
  --warning: #f59e0b;
  --background: #f8fafc;
  --surface: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border: #e2e8f0;
  --radius: 8px;
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

### JavaScript Architecture

The `script.js` file is organized into sections:

#### Configuration
- `API_BASE`: Base URL for API calls
- Environment variable support for deployment

#### State Management
- `currentUser`: Current logged-in user object
- `authToken`: JWT token
- `currentProject`: Currently open project
- `projectMembers`: Members of current project
- `tasks`: Tasks of current project

#### Helper Functions
- `getToken()`: Retrieve token from localStorage
- `api()`: Generic API call wrapper with error handling
- `notify()`: Toast notification system
- `esc()`: HTML escaping for XSS prevention
- `statusLabel()`: Status enum to label mapping

#### Authentication Functions
- `switchAuthTab()`: Toggle between login/register
- `handleLogin()`: Process login form submission
- `handleRegister()`: Process registration form submission
- `finishAuth()`: Complete authentication flow
- `signOut()`: Clear session and redirect

#### Navigation Functions
- `showView()`: Switch between main views
- `showInnerTab()`: Switch within project detail tabs

#### Dashboard Functions
- `loadDashboard()`: Fetch and render dashboard statistics

#### Project Functions
- `loadProjects()`: Fetch and render project list
- `openCreateProjectModal()`: Show project creation modal
- `handleCreateProject()`: Process project creation
- `openProject()`: Open project detail view
- `closeProjectDetail()`: Close project detail view
- `handleEditProject()`: Update project details
- `confirmDeleteProject()`: Delete project with confirmation

#### Task Functions
- `loadProjectTasks()`: Fetch tasks for current project
- `renderTaskList()`: Render task list to DOM
- `taskItemHTML()`: Generate HTML for a task card
- `openCreateTaskModal()`: Show task creation modal
- `openEditTaskModal()`: Show task editing modal
- `populateAssigneeSelect()`: Populate assignee dropdown
- `handleSaveTask()`: Process task creation/update
- `deleteTask()`: Delete task with confirmation

#### Member Functions
- `renderProjectMembers()`: Render member list
- `openAddMemberModal()`: Show add member modal
- `handleAddMember()`: Process member addition
- `removeMember()`: Remove member with confirmation

#### My Tasks Functions
- `loadMyTasks()`: Fetch user's tasks across all projects

#### Modal Functions
- `openModal()`: Show modal by ID
- `closeModal()`: Hide modal by ID

#### Session Restoration
- `DOMContentLoaded` listener to restore session from localStorage

---

## Security Implementation

### Authentication Security

#### JWT Token Implementation
- HS512 algorithm for token signing
- 64+ character secret key for security
- 24-hour token expiration (86400000 ms)
- Token stored in localStorage (can be enhanced with httpOnly cookies)
- Token validation on every protected endpoint

#### Password Security
- Password confirmation during registration
- Client-side validation for password matching
- Server-side DTO validation
- Note: Password hashing can be enhanced with BCrypt (currently plain text for demonstration)

#### OAuth2 Security
- Authorization code flow (more secure than implicit)
- State parameter to prevent CSRF
- Redirect URI validation
- Client secrets stored in environment variables

### Authorization Security

#### Role-Based Access Control (RBAC)
- ProjectRole enum (ADMIN, MEMBER)
- ProjectAccessService enforces role checks
- Admin-only operations:
  - Delete project
  - Add/remove members
  - Update member roles
  - Delete any task
- Member operations:
  - Create tasks
  - Edit own or assigned tasks
  - View project details

#### Service-Level Security
- User token validation via Feign client
- User lookup by email/ID for member operations
- Automatic project owner assignment (always Admin)
- Cannot remove project owner
- Cannot remove self from project

### API Security

#### CORS Configuration
- API Gateway handles CORS centrally
- Allows all origins for development (can be restricted in production)
- Allows all HTTP methods
- Exposes Authorization and Content-Type headers
- Supports credentials

#### Input Validation
- DTO-level validation annotations:
  - `@NotBlank` for required fields
  - `@Size` for length constraints
  - `@Email` for email validation
- Global exception handler for consistent error responses
- SQL injection prevention via JPA/Hibernate

#### XSS Prevention
- HTML escaping function (`esc()`) for user-generated content
- Context-aware output encoding
- Content-Type headers for API responses

---

## Deployment Strategy

### Local Development

#### Prerequisites
- Java 17 or higher
- Maven 3.9+
- PowerShell (for start.ps1 script)

#### Running Locally
1. Run `.\start.ps1` which:
   - Builds all services with Maven
   - Launches user-service on port 8081
   - Launches task-service on port 8082
   - Launches api-gateway on port 8080
   - Opens frontend in default browser

#### Manual Startup
```bash
# Terminal 1 - User Service
cd user-service
mvn spring-boot:run

# Terminal 2 - Task Service
cd task-service
mvn spring-boot:run

# Terminal 3 - API Gateway
cd api-gateway
mvn spring-boot:run

# Terminal 4 - Frontend
cd frontend
python -m http.server 3000
```

### Railway Deployment

#### Containerization
Each service has its own Dockerfile:
- Multi-stage build (Maven build + JRE runtime)
- Eclipse Temurin JRE 17 Alpine
- Exposes appropriate ports
- Environment variable configuration

#### Railway Configuration
- `railway.json`: Nixpacks builder configuration
- `railway.toml`: Service definitions with Dockerfiles
- Environment variables for service URLs
- Railway PostgreSQL integration (optional)

#### Deployment Steps
1. Push code to GitHub
2. Connect Railway to GitHub repository
3. Railway auto-detects services from railway.toml
4. Configure environment variables:
   - `USER_SERVICE_URL`, `TASK_SERVICE_URL` in api-gateway
   - `JWT_SECRET` in user-service and task-service
   - OAuth credentials (optional)
   - `API_BASE` in frontend
5. Deploy and monitor logs

#### Environment Variables
| Variable | Service | Description |
|----------|---------|-------------|
| PORT | All | Service port |
| DATABASE_URL | user-service, task-service | Database connection string |
| USER_SERVICE_URL | api-gateway, task-service | User service URL |
| TASK_SERVICE_URL | api-gateway | Task service URL |
| JWT_SECRET | user-service, task-service | JWT signing key |
| API_BASE | frontend | API Gateway URL |
| GOOGLE_CLIENT_ID | user-service | Google OAuth client ID |
| GOOGLE_CLIENT_SECRET | user-service | Google OAuth secret |
| GITHUB_CLIENT_ID | user-service | GitHub OAuth client ID |
| GITHUB_CLIENT_SECRET | user-service | GitHub OAuth secret |

---

## Development Workflow

### Build Process

#### Maven Build
```bash
mvn clean package -DskipTests
```
- Compiles Java sources
- Runs Maven plugins
- Creates executable JAR files
- Skips tests for faster builds

#### Docker Build
```bash
docker build -t user-service ./user-service
docker build -t task-service ./task-service
docker build -t api-gateway ./api-gateway
docker build -t frontend ./frontend
```

### Git Workflow

#### Branching Strategy
- `main`: Production-ready code
- Feature branches for new features (not currently used)

#### Commit Convention
- Clear, descriptive commit messages
- Example: "Fix JWT secret length for HS512"

### Code Organization

#### Package Structure

**user-service**
```
com.taskscheduler.userservice/
├── controller/
│   └── AuthController.java
├── dto/
│   ├── AuthResponse.java
│   ├── LoginRequest.java
│   ├── RegisterRequest.java
│   └── UserDTO.java
├── entity/
│   └── User.java
├── repository/
│   └── UserRepository.java
├── service/
│   └── AuthService.java
├── util/
│   └── JwtUtil.java
├── config/
│   └── SecurityConfig.java
└── UserServiceApplication.java
```

**task-service**
```
com.taskscheduler.taskservice/
├── controller/
│   ├── ProjectController.java
│   ├── ProjectTaskController.java
│   └── DashboardController.java
├── dto/
│   ├── project/
│   │   ├── CreateProjectRequest.java
│   │   ├── ProjectResponse.java
│   │   ├── ProjectMemberResponse.java
│   │   ├── AddMemberRequest.java
│   │   ├── UpdateProjectRequest.java
│   │   └── UpdateMemberRoleRequest.java
│   ├── task/
│   │   ├── CreateProjectTaskRequest.java
│   │   ├── ProjectTaskResponse.java
│   │   ├── UpdateProjectTaskRequest.java
│   │   └── Task.java (deprecated)
│   └── dashboard/
│       └── DashboardResponse.java
├── entity/
│   ├── Project.java
│   ├── ProjectMember.java
│   ├── ProjectTask.java
│   └── enums/
│       ├── ProjectRole.java
│       ├── ProjectTaskPriority.java
│       └── ProjectTaskStatus.java
├── repository/
│   ├── ProjectRepository.java
│   ├── ProjectMemberRepository.java
│   └── ProjectTaskRepository.java
├── service/
│   ├── ProjectManagementService.java
│   ├── ProjectTaskManagementService.java
│   ├── DashboardService.java
│   ├── ProjectAccessService.java
│   └── UserService.java (Feign client)
├── client/
│   └── UserServiceClient.java
├── config/
│   └── FeignConfig.java
└── TaskServiceApplication.java
```

**api-gateway**
```
com.taskscheduler.gateway/
└── ApiGatewayApplication.java
```

---

## Key Algorithms & Logic

### JWT Token Generation

```java
public String generateToken(User user) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + expiration);
    
    return Jwts.builder()
        .setSubject(user.getEmail())
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .signWith(SignatureAlgorithm.HS512, secret)
        .compact();
}
```

### Project Progress Calculation

```java
int totalTasks = projectTaskRepository.countByProject(project);
int completedTasks = projectTaskRepository.countByProjectAndStatus(project, ProjectTaskStatus.DONE);
int progress = totalTasks > 0 ? (completedTasks * 100 / totalTasks) : 0;
```

### Role-Based Access Check

```java
public void ensureAdmin(Long projectId, Long userId) {
    ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
        .orElseThrow(() -> new AccessDeniedException("Not a member"));
    
    if (member.getRole() != ProjectRole.ADMIN) {
        throw new AccessDeniedException("Admin access required");
    }
}
```

### Dashboard Statistics Aggregation

```java
public DashboardResponse getDashboard(Long userId) {
    // Get all projects user is a member of
    List<ProjectMember> memberships = projectMemberRepository.findByUserId(userId);
    
    // Aggregate task statistics
    long totalAssigned = 0, todo = 0, inProgress = 0, done = 0, overdue = 0;
    List<ProjectProgress> projectProgress = new ArrayList<>();
    
    for (ProjectMember membership : memberships) {
        Project project = membership.getProject();
        
        // Get assigned tasks
        List<ProjectTask> assignedTasks = projectTaskRepository
            .findByProjectAndAssignedUserId(project, userId);
        
        totalAssigned += assignedTasks.size();
        todo += countByStatus(assignedTasks, ProjectTaskStatus.TODO);
        inProgress += countByStatus(assignedTasks, ProjectTaskStatus.IN_PROGRESS);
        done += countByStatus(assignedTasks, ProjectTaskStatus.DONE);
        overdue += countOverdue(assignedTasks);
        
        // Project progress
        long totalTasks = projectTaskRepository.countByProject(project);
        long completedTasks = projectTaskRepository
            .countByProjectAndStatus(project, ProjectTaskStatus.DONE);
        
        projectProgress.add(new ProjectProgress(
            project.getId(),
            project.getName(),
            totalTasks,
            completedTasks
        ));
    }
    
    return new DashboardResponse(totalAssigned, todo, inProgress, done, overdue, projectProgress);
}
```

### Overdue Task Detection

```java
private long countOverdue(List<ProjectTask> tasks) {
    LocalDate today = LocalDate.now();
    return tasks.stream()
        .filter(t -> t.getDueDate() != null)
        .filter(t -> t.getStatus() != ProjectTaskStatus.DONE)
        .filter(t -> t.getDueDate().isBefore(today))
        .count();
}
```

---

## Testing Strategy

### Manual Testing

#### Authentication Testing
1. Register new user with valid email and matching passwords
2. Attempt registration with non-matching passwords (should fail)
3. Login with correct credentials
4. Login with incorrect credentials (should fail)
5. Sign out and verify session cleared
6. Sign in with OAuth2 (Google/GitHub) if configured

#### Project Testing
1. Create project with valid name and description
2. Create project with empty name (should fail validation)
3. View project in projects list
4. Open project detail view
5. Edit project name/description
6. Attempt to delete project (admin only)

#### Task Testing
1. Create task with all fields filled
2. Create task with minimal required fields
3. Edit task status from TODO to IN_PROGRESS to DONE
4. Assign task to different team member
5. Set due date and verify overdue highlighting
6. Delete task (admin only)

#### Team Testing
1. Add member by email (admin only)
2. Attempt to add non-existent user (should fail)
3. View member list with role badges
4. Update member role (admin only)
5. Remove member (admin only)
6. Attempt to remove project owner (should fail)
7. Attempt to remove self (should fail)

#### Dashboard Testing
1. Verify task statistics accuracy
2. Verify project progress calculation
3. Create tasks and verify dashboard updates
4. Complete tasks and verify progress bars update

### API Testing

#### Testing Tools
- Postman
- cURL
- Railway built-in API tester

#### Test Cases
- All endpoints with valid data
- All endpoints with invalid data
- Unauthenticated access to protected endpoints
- Role-based access enforcement
- CORS configuration

---

## Performance Considerations

### Database Performance

#### Indexing
- Primary key indexes on all entity IDs
- Unique constraint on ProjectMember(projectId, userId)
- Composite indexes can be added for:
  - ProjectTask(projectId, status)
  - ProjectTask(assignedUserId, status)
  - ProjectMember(userId)

#### Query Optimization
- JPA lazy loading for relationships
- DTO projection to avoid entity serialization overhead
- Batch fetching for related data

### API Performance

#### Caching Strategy
- JWT tokens cached in localStorage (client-side)
- Dashboard statistics can be cached with TTL
- Project lists can be cached per user

#### Connection Pooling
- HikariCP connection pool configured
- Maximum pool size: 5 connections
- Connection timeout: 30 seconds

### Frontend Performance

#### Optimization Techniques
- Minimal DOM manipulation
- Event delegation where possible
- CSS animations instead of JavaScript animations
- Lazy loading of task lists (can be enhanced)

---

## Challenges & Solutions

### Challenge 1: Service Communication

**Problem**: Services need to communicate with each other (task-service needs user info from user-service).

**Solution**: Implemented Feign client with:
- Declarative REST client interface
- Automatic request/response serialization
- Timeout configuration
- Full logging level for debugging

### Challenge 2: Token Validation Across Services

**Problem**: Each service needs to validate JWT tokens without duplication.

**Solution**: 
- Centralized token validation in user-service
- Feign client includes token in Authorization header
- User lookup by token in user-service
- Services trust user-service responses

### Challenge 3: Role-Based Access Control

**Problem**: Enforce role-based permissions consistently across all operations.

**Solution**:
- Created ProjectAccessService with role check methods
- Used in all controller methods requiring authorization
- Clear separation of admin vs member operations
- Frontend reflects role permissions (hides admin-only UI)

### Challenge 4: Frontend State Management

**Problem**: Complex state across multiple views (projects, tasks, members).

**Solution**:
- Global state variables (currentUser, authToken, currentProject, etc.)
- Session restoration from localStorage
- State updates trigger UI re-renders
- Modal-based interactions for complex forms

### Challenge 5: CORS Configuration

**Problem**: Frontend running on different origin from backend services.

**Solution**:
- API Gateway handles CORS centrally
- Allows all origins for development
- Exposes necessary headers (Authorization, Content-Type)
- Services disable CORS (Gateway handles it)

### Challenge 6: Docker Multi-Stage Builds

**Problem**: Optimize Docker image sizes for deployment.

**Solution**:
- Multi-stage builds (build stage + runtime stage)
- Maven build in first stage
- Only copy JAR to final stage
- Use Alpine Linux for minimal footprint

### Challenge 7: Environment Configuration

**Problem**: Different configurations for local vs production.

**Solution**:
- Environment variable support in application.properties
- Default values for local development
- Railway environment variable injection
- Railway-specific configuration files

---

## Future Enhancements

### Backend Enhancements

1. **Database Migration**
   - Replace H2 with PostgreSQL for production
   - Add Flyway/Liquibase for schema migrations
   - Implement database backup strategy

2. **Authentication Enhancements**
   - BCrypt password hashing
   - Refresh token mechanism
   - Password reset functionality
   - Email verification

3. **Search & Filtering**
   - Full-text search for tasks and projects
   - Advanced filtering (by status, priority, assignee)
   - Sorting options

4. **Real-time Updates**
   - WebSocket integration for real-time task updates
   - Push notifications for task assignments
   - Activity feed

5. **File Attachments**
   - Upload files to tasks
   - Image attachments
   - File storage with S3 or similar

6. **Comments & Collaboration**
   - Task comments
   - @mentions in comments
   - Activity log

7. **Reporting**
   - Export project reports (PDF, CSV)
   - Time tracking
   - Burndown charts

8. **API Versioning**
   - Implement API versioning strategy
   - Backward compatibility

### Frontend Enhancements

1. **Modern Framework**
   - Migrate to React or Vue.js
   - Component-based architecture
   - State management (Redux/Vuex)

2. **UI/UX Improvements**
   - Drag-and-drop task reordering
   - Kanban board view
   - Calendar view for tasks
   - Dark mode

3. **Mobile App**
   - React Native or Flutter mobile app
   - Push notifications
   - Offline support

4. **Performance**
   - Service worker for offline support
   - Image optimization
   - Code splitting

### DevOps Enhancements

1. **CI/CD Pipeline**
   - GitHub Actions for automated testing
   - Automated deployment to Railway
   - Staging environment

2. **Monitoring**
   - Application performance monitoring (APM)
   - Error tracking (Sentry)
   - Logging aggregation (ELK stack)

3. **Security**
   - HTTPS enforcement
   - Rate limiting
   - Input sanitization
   - Security headers

---

## Code Structure

### Project Root

```
Task Scheduler/
├── api-gateway/              # API Gateway service
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       └── resources/
│   │           └── application.properties
│   ├── Dockerfile
│   └── pom.xml
├── user-service/            # User authentication service
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/taskscheduler/userservice/
│   │       │       ├── controller/
│   │       │       ├── dto/
│   │       │       ├── entity/
│   │       │       ├── repository/
│   │       │       ├── service/
│   │       │       ├── util/
│   │       │       ├── config/
│   │       │       └── UserServiceApplication.java
│   │       └── resources/
│   │           └── application.properties
│   ├── Dockerfile
│   └── pom.xml
├── task-service/            # Project and task management service
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/taskscheduler/taskservice/
│   │       │       ├── controller/
│   │       │       ├── dto/
│   │       │       ├── entity/
│   │       │       ├── repository/
│   │       │       ├── service/
│   │       │       ├── client/
│   │       │       ├── config/
│   │       │       └── TaskServiceApplication.java
│   │       └── resources/
│   │           └── application.properties
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                # Static frontend
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── Dockerfile
├── .dockerignore            # Docker build exclusions
├── railway.json             # Railway configuration (JSON)
├── railway.toml             # Railway configuration (TOML)
├── start.ps1                # Local development launcher
├── README.md                # Project documentation
├── RAILWAY_DEPLOYMENT.md    # Deployment guide
└── PROJECT_DETAILS.md       # This file
```

---

## Learning Outcomes

### Technical Skills Acquired

1. **Microservices Architecture**
   - Understanding service boundaries
   - Inter-service communication patterns
   - API Gateway implementation
   - Service discovery concepts

2. **Spring Boot Ecosystem**
   - Spring Boot application development
   - Spring Data JPA for database operations
   - Spring Security for authentication
   - Spring Cloud Gateway for API routing
   - Feign Client for service-to-service communication

3. **Database Design**
   - Entity relationship modeling
   - JPA annotations and mappings
   - Enum usage for type safety
   - Unique constraints for data integrity

4. **Authentication & Authorization**
   - JWT token implementation
   - OAuth2 integration
   - Role-based access control
   - Token validation and management

5. **RESTful API Design**
   - REST principles and best practices
   - HTTP methods and status codes
   - DTO pattern for API communication
   - API versioning considerations

6. **Frontend Development**
   - Vanilla JavaScript (ES6+)
   - DOM manipulation
   - Fetch API for HTTP requests
   - CSS custom properties
   - Responsive design

7. **DevOps & Deployment**
   - Docker containerization
   - Multi-stage Docker builds
   - Railway cloud deployment
   - Environment variable management
   - CI/CD concepts

8. **Security Best Practices**
   - Input validation
   - XSS prevention
   - CORS configuration
   - SQL injection prevention
   - Secure token storage

### Problem-Solving Skills

1. **Debugging**
   - Systematic debugging approach
   - Using logs and error messages
   - Service isolation for issue identification

2. **Testing**
   - Manual testing strategies
   - API testing with Postman
   - End-to-end testing with Playwright

3. **Code Organization**
   - Clean architecture principles
   - Separation of concerns
   - DRY (Don't Repeat Yourself) principle

4. **Documentation**
   - Comprehensive project documentation
   - API documentation
   - Deployment guides

---

## Conclusion

TaskFlow is a complete, production-ready project and task management system demonstrating expertise in full-stack development, microservices architecture, RESTful API design, database modeling, authentication/authorization, and cloud deployment. The project showcases the ability to build complex applications from scratch, implement security best practices, and deploy to modern cloud platforms.

The system is designed to be:
- **Scalable**: Microservices architecture allows independent scaling
- **Maintainable**: Clean code organization and separation of concerns
- **Secure**: JWT authentication, RBAC, input validation
- **Deployable**: Docker containerization and Railway integration
- **User-friendly**: Intuitive UI with clear feedback

This project demonstrates readiness for roles such as:
- Full Stack Developer
- Backend Developer
- Frontend Developer
- DevOps Engineer
- Software Engineer
- Cloud Engineer

The skills and patterns used in this project are applicable to a wide range of software development scenarios and can be adapted for various domains beyond project management.
