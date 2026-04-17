// API Configuration
const API_URL = '/tasks';

// State
let tasks = [];
let currentFilter = 'all';
let currentlyAssigningId = null;

// DOM Elements
const taskGrid = document.getElementById('taskGrid');
const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const overdueTasksEl = document.getElementById('overdueTasks');
const modalOverlay = document.getElementById('modalOverlay');
const assignModalOverlay = document.getElementById('assignModalOverlay');
const taskForm = document.getElementById('taskForm');

// Initialize
async function init() {
    await fetchTasks();
    await fetchStats();
    setupEventListeners();
}

// Fetching Logic
async function fetchTasks() {
    try {
        let url = API_URL;
        if (currentFilter !== 'all') {
            url += `?status=${currentFilter}`;
        }
        
        const response = await fetch(url);
        tasks = await response.json();
        renderTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

async function fetchStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();
        
        totalTasksEl.textContent = stats.todo + stats.in_progress + stats.done;
        completedTasksEl.textContent = stats.done;
        overdueTasksEl.textContent = stats.overdue;
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

// Rendering Logic
function renderTasks() {
    if (tasks.length === 0) {
        taskGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 100px 0; color: var(--text-secondary);">
                <i data-lucide="inbox" style="width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>No tasks found in this category.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    taskGrid.innerHTML = tasks.map(task => `
        <div class="task-card ${task.status === 'done' ? 'done' : ''}" id="task-${task.id}">
            <div class="task-header">
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
                <button class="action-btn btn-delete" onclick="deleteTask('${task.id}')" style="flex: 0; border: none; padding: 4px;">
                    <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                </button>
            </div>
            <div class="task-title">${task.title}</div>
            <div class="task-desc">${task.description || 'No description provided.'}</div>
            
            <div class="task-meta">
                <div class="meta-item">
                    <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
                    ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                </div>
                <div class="meta-item">
                    <i data-lucide="user" style="width: 14px; height: 14px;"></i>
                    ${task.assignee || 'Unassigned'}
                </div>
            </div>

            <div class="task-actions">
                <button class="action-btn btn-complete" 
                        onclick="completeTask('${task.id}')" 
                        ${task.status === 'done' ? 'disabled' : ''}>
                    <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
                    ${task.status === 'done' ? 'Completed' : 'Complete'}
                </button>
                <button class="action-btn" onclick="openAssignModal('${task.id}')">
                    <i data-lucide="user-plus" style="width: 16px; height: 16px;"></i>
                    Assign
                </button>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// Action Logic
async function createTask(e) {
    if (e) e.preventDefault();
    
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDesc').value,
        priority: document.getElementById('taskPriority').value,
        dueDate: document.getElementById('taskDueDate').value || null
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            closeModal();
            taskForm.reset();
            await fetchTasks();
            await fetchStats();
        } else {
            const err = await response.json();
            alert(`Error: ${err.error}`);
        }
    } catch (error) {
        console.error('Error creating task:', error);
    }
}

async function completeTask(id) {
    try {
        const response = await fetch(`${API_URL}/${id}/complete`, {
            method: 'PATCH'
        });

        if (response.ok) {
            await fetchTasks();
            await fetchStats();
        }
    } catch (error) {
        console.error('Error completing task:', error);
    }
}

async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await fetchTasks();
            await fetchStats();
        }
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

async function assignTask() {
    const assignee = document.getElementById('assigneeName').value;
    if (!assignee.trim()) return alert('Please enter a name');

    try {
        const response = await fetch(`${API_URL}/${currentlyAssigningId}/assign`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignee })
        });

        if (response.ok) {
            closeAssignModal();
            await fetchTasks();
        } else {
            const err = await response.json();
            alert(`Error: ${err.error}`);
        }
    } catch (error) {
        console.error('Error assigning task:', error);
    }
}

// Modal Controls
function openModal() { modalOverlay.classList.add('active'); }
function closeModal() { modalOverlay.classList.remove('active'); }

function openAssignModal(id) {
    currentlyAssigningId = id;
    assignModalOverlay.classList.add('active');
    document.getElementById('assigneeName').focus();
}

function closeAssignModal() {
    assignModalOverlay.classList.remove('active');
    document.getElementById('assigneeName').value = '';
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('openModalBtn').addEventListener('click', openModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('closeAssignModalBtn').addEventListener('click', closeAssignModal);
    
    taskForm.addEventListener('submit', createTask);
    document.getElementById('confirmAssignBtn').addEventListener('click', assignTask);

    // Filter Buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            await fetchTasks();
        });
    });

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    assignModalOverlay.addEventListener('click', (e) => {
        if (e.target === assignModalOverlay) closeAssignModal();
    });
}

// Start
init();
