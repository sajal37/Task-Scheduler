# Task Scheduler Application

A comprehensive task management application built with Spring Boot backend and HTML/CSS/JavaScript frontend.

## Features

### Task Management
- ✅ Add new tasks with description, start/end times, priority, category, and notes
- ✅ Edit existing tasks (all fields)
- ✅ Delete tasks permanently
- ✅ Mark tasks as done/undone
- ✅ View all tasks with detailed information
- ✅ Search tasks by ID

### Task Attributes
- **Description**: Text describing the task
- **Start Time & End Time**: Using LocalDateTime for precise scheduling
- **Completion Status**: Done/Not Done toggle
- **Priority**: High, Medium, Low
- **Category**: Work, Personal, Health, Education, Other
- **Notes**: Optional detailed notes

### Advanced Features
- 📊 Task statistics and analytics
- 🔍 Filter tasks by status, priority, and category
- 📅 View today's tasks and overdue tasks
- 🔔 System notifications for task start/end times
- 📱 Responsive design for mobile and desktop

## Technology Stack

### Backend
- **Spring Boot 3.1.5** - Main framework
- **Spring Data JPA** - Data access layer
- **Hibernate** - ORM implementation
- **MySQL 8.0** - Database
- **Maven** - Build tool
- **Java 17** - Programming language

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with modern features
- **JavaScript (ES6+)** - Client-side logic
- **Fetch API** - HTTP requests
- **Responsive Design** - Mobile-friendly interface

## Prerequisites

Before running this application, make sure you have:

1. **Java 17** or higher installed
2. **Maven 3.6+** installed
3. **MySQL 8.0** or higher installed and running
4. **Git** (optional, for cloning)

## Setup Instructions

### 1. Database Setup

1. Install and start MySQL server
2. Create a new database:
```sql
CREATE DATABASE task_scheduler;
```

3. Create a MySQL user (optional but recommended):
```sql
CREATE USER 'taskuser'@'localhost' IDENTIFIED BY 'taskpass';
GRANT ALL PRIVILEGES ON task_scheduler.* TO 'taskuser'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Backend Setup

1. Clone or create the project directory
2. Update database configuration in `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/task_scheduler
spring.datasource.username=root
spring.datasource.password=your_password
```

3. Build and run the Spring Boot application:
```bash
mvn clean install
mvn spring-boot:run
```

The backend server will start on `http://localhost:8080`

### 3. Frontend Setup

1. Save the HTML file as `index.html`
2. Open the file in a web browser
3. Or serve it using a local web server:
```bash
# Using Python
python -m http.server 3000

# Using Node.js http-server
npx http-server -p 3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks/add` | Add a new task |
| GET | `/api/tasks/all` | Get all tasks |
| GET | `/api/tasks/get/{id}` | Get task by ID |
| PUT | `/api/tasks/edit/{id}` | Update task |
| DELETE | `/api/tasks/delete/{id}` | Delete task |
| PUT | `/api/tasks/toggle/{id}` | Toggle task completion |
| GET | `/api/tasks/status/{done}` | Get tasks by completion status |
| GET | `/api/tasks/priority/{priority}` | Get tasks by priority |
| GET | `/api/tasks/category/{category}` | Get tasks by category |
| GET | `/api/tasks/overdue` | Get overdue tasks |
| GET | `/api/tasks/today` | Get today's tasks |
| GET | `/api/tasks/starting-soon` | Get tasks starting soon |
| GET | `/api/tasks/statistics` | Get task statistics |

## Usage

### Adding a Task
1. Go to the "Add Task" tab
2. Fill in the required fields (description, start time, end time)
3. Select priority and category
4. Add optional notes
5. Click "Add Task"

### Viewing Tasks
1. Go to the "View Tasks" tab
2. See all tasks with their details
3. Use action buttons to edit, mark as done, or delete tasks

### Searching Tasks
1. Go to the "Search Task" tab
2. Enter a task ID
3. Click "Search" to find the specific task

### Statistics
1. Go to the "Statistics" tab
2. View comprehensive task analytics

## Database Schema

The application uses a single `tasks` table with the following structure:

```sql
CREATE TABLE tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    priority VARCHAR(50) DEFAULT 'Medium',
    category VARCHAR(100) DEFAULT 'Personal',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Common Issues

1. **Connection refused error**
    - Make sure MySQL is running
    - Check database credentials in `application.properties`

2. **CORS errors**
    - The backend includes CORS configuration
    - Make sure you're accessing the frontend from the same origin

3. **404 errors**
    - Verify the backend is running on port 8080
    - Check API endpoint URLs in the frontend JavaScript

4. **Database table not found**
    - Hibernate will auto-create tables
    - Make sure `spring.jpa.hibernate.ddl-auto=update` is set

## Future Enhancements

- 🔔 Email notifications for task reminders
- 📊 Advanced analytics and reporting
- 👥 User authentication and multi-user support
- 📱 Mobile app development
- 🔄 Task recurring/scheduling options
- 📋 Task templates and bulk operations
- 🏷️ Custom tags and labels
- 📎 File attachments support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
