// Global variables
let tasks = [];
let currentUser = null;
const API_BASE = 'http://localhost:8080'; // API Gateway URL

// OAuth Functions
function signInWithGoogle() {
    const redirectUri = encodeURIComponent('http://127.0.0.1:5500');
    window.location.href = `${API_BASE}/api/auth/oauth2/authorize/google?redirect_uri=${redirectUri}`;
}

function signUpWithGoogle() {
    signInWithGoogle(); // Same flow for OAuth
}

function signInWithGitHub() {
    const redirectUri = encodeURIComponent('http://127.0.0.1:5500');
    window.location.href = `${API_BASE}/api/auth/oauth2/authorize/github?redirect_uri=${redirectUri}`;
}

function signUpWithGitHub() {
    signInWithGitHub(); // Same flow for OAuth
}

// Initialize app when page loads
window.addEventListener('load', function() {
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (token) {
        // Store token and authenticate
        sessionStorage.setItem('authToken', token);
        window.history.replaceState({}, document.title, window.location.pathname);
        authenticateUser(token);
    } else if (error) {
        console.error('OAuth error:', error);
        showNotification('Authentication failed: ' + error, 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        // Check if user is already logged in
        const storedToken = sessionStorage.getItem('authToken');
        if (storedToken) {
            authenticateUser(storedToken);
        }
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Set current datetime for form inputs
    setDefaultDateTime();
});

function setupEventListeners() {
    // Auth forms
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const taskForm = document.getElementById('taskForm');
    const editTaskForm = document.getElementById('editTaskForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (taskForm) {
        taskForm.addEventListener('submit', handleAddTask);
    }
    
    if (editTaskForm) {
        editTaskForm.addEventListener('submit', handleEditTask);
    }
}

function authenticateUser(token) {
    fetch(`${API_BASE}/api/auth/user-info`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Authentication failed');
        }
        return response.json();
    })
    .then(user => {
        if (user && user.name) {
            currentUser = user;
            showAuthenticatedUI();
            loadTasks();
        } else {
            throw new Error('Invalid user data');
        }
    })
    .catch(error => {
        console.error('Error getting user info:', error);
        sessionStorage.removeItem('authToken');
        showNotification('Authentication failed. Please try again.', 'error');
        showUnauthenticatedUI();
    });
}

function showAuthenticatedUI() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('authHeader').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('userName').textContent = currentUser.name;
    
    showNotification('Welcome back, ' + currentUser.name + '!', 'success');
}

function showUnauthenticatedUI() {
    document.getElementById('authHeader').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('welcomeScreen').style.display = 'block';
}

function signOut() {
    sessionStorage.removeItem('authToken');
    currentUser = null;
    tasks = [];
    showUnauthenticatedUI();
    showNotification('Signed out successfully', 'info');
}

// Auth Modal Functions
function showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tab + 'Form').classList.add('active');
}

// Login/Register Handlers
function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text);
            });
        }
        return response.json();
    })
    .then(data => {
        sessionStorage.setItem('authToken', data.token);
        currentUser = { id: data.userId, name: data.name, email: data.email };
        showAuthenticatedUI();
        loadTasks();
        event.target.reset();
    })
    .catch(error => {
        console.error('Login error:', error);
        showNotification('Login failed: ' + error.message, 'error');
    });
}

function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const registerData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
    };
    
    fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text);
            });
        }
        return response.json();
    })
    .then(data => {
        sessionStorage.setItem('authToken', data.token);
        currentUser = { id: data.userId, name: data.name, email: data.email };
        showAuthenticatedUI();
        loadTasks();
        event.target.reset();
    })
    .catch(error => {
        console.error('Register error:', error);
        showNotification('Registration failed: ' + error.message, 'error');
    });
}

// Tab Management - FIXED VERSION
function showTab(tabName, targetElement = null) {
    // Remove active class from all tabs and tab contents
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    if (targetElement) {
        targetElement.classList.add('active');
    } else {
        // Find the tab by data attribute or content
        const tabElement = document.querySelector(`[onclick*="${tabName}"]`) || 
                          document.querySelector(`.tab[data-tab="${tabName}"]`);
        if (tabElement) {
            tabElement.classList.add('active');
        }
    }
    
    // Add active class to corresponding content
    const contentElement = document.getElementById(tabName);
    if (contentElement) {
        contentElement.classList.add('active');
    }
    
    // Load data based on tab
    if (tabName === 'view') {
        loadTasks();
    } else if (tabName === 'stats') {
        updateStatistics();
    }
}

// Alternative function for event-driven tab switching
function showTabFromEvent(event, tabName) {
    event.preventDefault();
    showTab(tabName, event.target);
}

// Task Management
function handleAddTask(event) {
    event.preventDefault();
    
    const token = sessionStorage.getItem('authToken');
    if (!token) {
        showNotification('Please login first', 'error');
        return;
    }
    
    const formData = new FormData(event.target);
    
    const taskData = {
        description: formData.get('description'),
        category: formData.get('category'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        priority: formData.get('priority'),
        notes: formData.get('notes') || ''
    };
    
    // Validate dates
    const startTime = new Date(taskData.startTime);
    const endTime = new Date(taskData.endTime);
    
    if (endTime <= startTime) {
        showNotification('End time must be after start time', 'error');
        return;
    }
    
    fetch(`${API_BASE}/api/tasks/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(taskData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text);
            });
        }
        return response.json();
    })
    .then(task => {
        showNotification('Task added successfully!', 'success');
        event.target.reset();
        setDefaultDateTime();
        loadTasks();
        
        // Switch to view tab - FIXED
        showTab('view');
    })
    .catch(error => {
        console.error('Error adding task:', error);
        showNotification('Failed to add task: ' + error.message, 'error');
    });
}

function loadTasks() {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;
    
    fetch(`${API_BASE}/api/tasks/all`, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load tasks');
        }
        return response.json();
    })
    .then(data => {
        tasks = data;
        displayTasks(tasks);
        updateStatistics();
    })
    .catch(error => {
        console.error('Error loading tasks:', error);
        showNotification('Failed to load tasks', 'error');
    });
}

function displayTasks(tasksToShow) {
    const container = document.getElementById('tasksContainer');
    
    if (!tasksToShow || tasksToShow.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic; padding: 40px;">No tasks found. Add your first task!</p>';
        return;
    }
    
    container.innerHTML = tasksToShow.map(task => {
        const startTime = new Date(task.startTime);
        const endTime = new Date(task.endTime);
        const now = new Date();
        const isOverdue = endTime < now && !task.done;
        const status = task.done ? 'COMPLETED' : 'PENDING';
        
        return `
            <div class="task-card ${task.priority.toLowerCase()} ${isOverdue ? 'overdue' : ''}">
                <div class="task-header">
                    <h3 class="task-title">${task.description}</h3>
                    <div class="task-id">ID: ${task.id}</div>
                    <span class="task-status ${status.toLowerCase()}">${status}</span>
                </div>
                
                <div class="task-details">
                    <div class="task-detail">
                        <strong>Category:</strong> ${task.category}
                    </div>
                    <div class="task-detail">
                        <strong>Priority:</strong> 
                        <span class="priority-${task.priority.toLowerCase()}">${task.priority}</span>
                    </div>
                    <div class="task-detail">
                        <strong>Start:</strong> ${startTime.toLocaleString()}
                    </div>
                    <div class="task-detail">
                        <strong>End:</strong> ${endTime.toLocaleString()}
                    </div>
                </div>
                
                ${task.notes ? `<div class="task-detail"><strong>Notes:</strong> ${task.notes}</div>` : ''}
                
                <div class="task-actions">
                    ${!task.done ? 
                        `<button class="btn btn-success" onclick="markTaskComplete(${task.id})">✓ Complete</button>` : 
                        `<button class="btn btn-secondary" onclick="markTaskPending(${task.id})">↻ Reopen</button>`
                    }
                    <button class="btn btn-primary" onclick="editTask(${task.id})">✎ Edit</button>
                    <button class="btn btn-danger" onclick="deleteTask(${task.id})">🗑 Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function markTaskComplete(taskId) {
    updateTaskStatus(taskId, 'COMPLETED');
}

function markTaskPending(taskId) {
    updateTaskStatus(taskId, 'PENDING');
}

function updateTaskStatus(taskId, status) {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;
    
    fetch(`${API_BASE}/api/tasks/toggle/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update task status');
        }
        return response.json();
    })
    .then(() => {
        showNotification(`Task marked as ${status.toLowerCase()}!`, 'success');
        loadTasks();
    })
    .catch(error => {
        console.error('Error updating task status:', error);
        showNotification('Failed to update task status', 'error');
    });
}

function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    const token = sessionStorage.getItem('authToken');
    if (!token) return;
    
    fetch(`${API_BASE}/api/tasks/delete/${taskId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete task');
        }
        showNotification('Task deleted successfully!', 'success');
        loadTasks();
    })
    .catch(error => {
        console.error('Error deleting task:', error);
        showNotification('Failed to delete task', 'error');
    });
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Populate edit form
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editDescription').value = task.description;
    document.getElementById('editCategory').value = task.category;
    document.getElementById('editPriority').value = task.priority;
    document.getElementById('editNotes').value = task.notes || '';
    
    // Convert timestamps to datetime-local format
    const startTime = new Date(task.startTime);
    const endTime = new Date(task.endTime);
    
    document.getElementById('editStartTime').value = formatDateTimeLocal(startTime);
    document.getElementById('editEndTime').value = formatDateTimeLocal(endTime);
    
    // Show modal
    document.getElementById('editModal').style.display = 'block';
}

function handleEditTask(event) {
    event.preventDefault();
    
    const token = sessionStorage.getItem('authToken');
    if (!token) return;
    
    const formData = new FormData(event.target);
    const taskId = formData.get('taskId') || document.getElementById('editTaskId').value;
    
    const taskData = {
        description: formData.get('description'),
        category: formData.get('category'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        priority: formData.get('priority'),
        notes: formData.get('notes') || ''
    };
    
    // Validate dates
    const startTime = new Date(taskData.startTime);
    const endTime = new Date(taskData.endTime);
    
    if (endTime <= startTime) {
        showNotification('End time must be after start time', 'error');
        return;
    }
    
    fetch(`${API_BASE}/api/tasks/edit/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(taskData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update task');
        }
        return response.json();
    })
    .then(() => {
        showNotification('Task updated successfully!', 'success');
        closeEditModal();
        loadTasks();
    })
    .catch(error => {
        console.error('Error updating task:', error);
        showNotification('Failed to update task: ' + error.message, 'error');
    });
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

function searchTask() {
    const taskId = document.getElementById('searchId').value;
    if (!taskId) {
        showNotification('Please enter a task ID', 'error');
        return;
    }
    
    const task = tasks.find(t => t.id == taskId);
    const resultsContainer = document.getElementById('searchResults');
    
    if (task) {
        displayTasks([task]);
        resultsContainer.innerHTML = document.getElementById('tasksContainer').innerHTML;
        showNotification('Task found!', 'success');
    } else {
        resultsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No task found with ID: ' + taskId + '</p>';
        showNotification('Task not found', 'error');
    }
}

function applyCategorySort() {
    const selectedCategory = document.getElementById('sortByCategory').value;
    let filteredTasks = tasks;
    
    if (selectedCategory) {
        filteredTasks = tasks.filter(task => task.category === selectedCategory);
    }
    
    displayTasks(filteredTasks);
}

function updateStatistics() {
    if (!tasks) return;
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.done === true).length;
    const pendingTasks = tasks.filter(task => task.done === false).length;
    const highPriorityTasks = tasks.filter(task => task.priority === 'High').length;
    
    const workTasks = tasks.filter(task => task.category === 'Work').length;
    const personalTasks = tasks.filter(task => task.category === 'Personal').length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayTasks = tasks.filter(task => {
        const taskDate = new Date(task.startTime);
        return taskDate >= today && taskDate < tomorrow;
    }).length;
    
    const overdueTasks = tasks.filter(task => {
        const endTime = new Date(task.endTime);
        return endTime < new Date() && task.done !== true;
    }).length;
    
    // Update statistics display
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
    document.getElementById('highPriorityTasks').textContent = highPriorityTasks;
    document.getElementById('workTasks').textContent = workTasks;
    document.getElementById('personalTasks').textContent = personalTasks;
    document.getElementById('todayTasks').textContent = todayTasks;
    document.getElementById('overdueTasks').textContent = overdueTasks;
}

function resetForm() {
    document.getElementById('taskForm').reset();
    setDefaultDateTime();
}

function setDefaultDateTime() {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    document.getElementById('startTime').value = formatDateTimeLocal(now);
    document.getElementById('endTime').value = formatDateTimeLocal(oneHourLater);
}

function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function showNotification(message, type = 'info') {
    const notificationArea = document.getElementById('notificationArea');
    const notification = document.createElement('div');
    notification.className = `notification ${type === 'error' ? 'alert' : ''}`;
    notification.textContent = message;
    
    notificationArea.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const authModal = document.getElementById('authModal');
    const editModal = document.getElementById('editModal');
    
    if (event.target === authModal) {
        authModal.style.display = 'none';
    }
    
    if (event.target === editModal) {
        editModal.style.display = 'none';
    }
});