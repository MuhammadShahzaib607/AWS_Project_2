document.addEventListener('DOMContentLoaded', function() {
    if (!isAuthenticated()) {
        window.location.href = '/';
        return;
    }

    const user = getCurrentUser();
    document.getElementById('userDisplayName').textContent = user.email.split('@')[0];
    document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.split('@')[0])}&background=random`;

    const todosContainer = document.getElementById('todosContainer');
    const loadingSkeleton = document.getElementById('loadingSkeleton');
    const emptyState = document.getElementById('emptyState');
    const addTodoBtn = document.getElementById('addTodoBtn');
    const addTodoModal = document.getElementById('addTodoModal');
    const editTodoModal = document.getElementById('editTodoModal');
    const settingsModal = document.getElementById('settingsModal');
    const openSettings = document.getElementById('openSettings');

    let todos = [];
    let filteredTodos = [];
    let currentFilter = 'all';
    let currentSearch = '';
    let currentPriority = 'all';
    let currentStatus = 'all';

    async function loadTodos() {
        loadingSkeleton.classList.remove('hidden');
        todosContainer.classList.add('hidden');
        emptyState.classList.add('hidden');

        try {
            todos = await getTodos('all');
            applyFilters();
        } catch (error) {
            console.error('Failed to load todos:', error);
        } finally {
            loadingSkeleton.classList.add('hidden');
        }
    }

    function applyFilters() {
        filteredTodos = todos;

        if (currentSearch) {
            filteredTodos = searchTodos(filteredTodos, currentSearch);
        }

        filteredTodos = filterTodos(filteredTodos, currentFilter);

        if (currentPriority !== 'all') {
            filteredTodos = filteredTodos.filter(t => t.priority === currentPriority);
        }

        if (currentStatus !== 'all') {
            filteredTodos = currentStatus === 'completed' 
                ? filteredTodos.filter(t => t.completed)
                : filteredTodos.filter(t => !t.completed);
        }

        renderTodos();
        updateStats();
    }

    function renderTodos() {
        if (filteredTodos.length === 0) {
            emptyState.classList.remove('hidden');
            todosContainer.classList.add('hidden');
            return;
        }

        todosContainer.classList.remove('hidden');
        emptyState.classList.add('hidden');

        todosContainer.innerHTML = filteredTodos.map(todo => `
            <div class="todo-card ${todo.completed ? 'completed' : ''}" data-id="${todo.todoId}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="toggleTodo('${todo.todoId}', ${todo.completed})"></div>
                <div class="todo-content">
                    <h4 class="todo-title">${escapeHtml(todo.title)}</h4>
                    ${todo.description ? `<p class="todo-description">${escapeHtml(todo.description)}</p>` : ''}
                    <div class="todo-meta">
                        <span class="priority-badge priority-${todo.priority}">${todo.priority}</span>
                        ${todo.dueDate ? `<span class="todo-due-date">${formatDate(todo.dueDate)}</span>` : ''}
                    </div>
                    ${todo.tags && todo.tags.length > 0 ? `<div class="todo-tags">${todo.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                    <div class="todo-actions">
                        <button class="action-btn edit" onclick="openEditModal('${todo.todoId}')">✏️</button>
                        <button class="action-btn delete" onclick="deleteTodoItem('${todo.todoId}')">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function updateStats() {
        document.getElementById('totalTodos').textContent = todos.length;
        
        const completed = todos.filter(t => t.completed).length;
        document.getElementById('completedCount').textContent = completed;
        
        const percentage = todos.length > 0 ? Math.round((completed / todos.length) * 100) : 0;
        document.getElementById('completionPercentage').textContent = `${percentage}%`;
        
        const progressFill = document.querySelector('.progress-fill');
        progressFill.style.width = `${percentage}%`;

        const today = new Date().toDateString();
        document.getElementById('todayCount').textContent = todos.filter(t => t.completed && new Date(t.createdAt).toDateString() === today).length;
        
        const now = new Date();
        document.getElementById('overdueCount').textContent = todos.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < now).length;
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('upcomingCount').textContent = todos.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= tomorrow).length;
        
        document.getElementById('activeCount').textContent = todos.filter(t => !t.completed).length;
    }

    document.getElementById('searchInput').addEventListener('input', function() {
        currentSearch = this.value;
        applyFilters();
    });

    document.getElementById('priorityFilter').addEventListener('change', function() {
        currentPriority = this.value;
        applyFilters();
    });

    document.getElementById('statusFilter').addEventListener('change', function() {
        currentStatus = this.value;
        applyFilters();
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.section;
            applyFilters();
        });
    });

    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function() {
            alert(`Category: ${this.dataset.category}`);
        });
    });

    addTodoBtn.addEventListener('click', function() {
        addTodoModal.classList.remove('hidden');
    });

    function closeModal(modal) {
        modal.classList.add('hidden');
    }

    document.querySelectorAll('[data-modal-backdrop]').forEach(el => {
        el.addEventListener('click', function() {
            closeModal(this.parentElement);
        });
    });

    document.querySelectorAll('[data-close-modal], [data-close-edit-modal], [data-close-settings-modal]').forEach(el => {
        el.addEventListener('click', function() {
            closeModal(this.closest('.modal'));
        });
    });

    document.getElementById('createTodoBtn').addEventListener('click', async function() {
        const title = document.getElementById('todoTitle').value;
        const description = document.getElementById('todoDescription').value;
        const priority = document.getElementById('todoPriority').value;
        const dueDate = document.getElementById('todoDueDate').value;
        const tags = document.getElementById('todoTags').value.split(',').map(t => t.trim()).filter(t => t);

        if (!title) {
            alert('Please enter a title');
            return;
        }

        try {
            await createTodo(title, description, priority, dueDate || null, tags);
            addTodoModal.classList.add('hidden');
            document.getElementById('todoTitle').value = '';
            document.getElementById('todoDescription').value = '';
            document.getElementById('todoTags').value = '';
            await loadTodos();
        } catch (error) {
            alert(error.message || 'Failed to create todo');
        }
    });

    document.getElementById('updateTodoBtn').addEventListener('click', async function() {
        const todoId = document.getElementById('editTodoId').value;
        const title = document.getElementById('editTodoTitle').value;
        const description = document.getElementById('editTodoDescription').value;
        const priority = document.getElementById('editTodoPriority').value;
        const dueDate = document.getElementById('editTodoDueDate').value;
        const tags = document.getElementById('editTodoTags').value.split(',').map(t => t.trim()).filter(t => t);
        const completed = document.getElementById('editTodoCompleted').checked;

        if (!title) {
            alert('Please enter a title');
            return;
        }

        try {
            await updateTodo(todoId, { title, description, priority, dueDate: dueDate || null, tags, completed });
            editTodoModal.classList.add('hidden');
            await loadTodos();
        } catch (error) {
            alert(error.message || 'Failed to update todo');
        }
    });

    openSettings.addEventListener('click', function() {
        settingsModal.classList.remove('hidden');
    });

    document.getElementById('logoutBtn').addEventListener('click', function() {
        logout();
    });

    window.toggleTodo = async function(todoId, currentStatus) {
        try {
            await toggleComplete(todoId, currentStatus);
            await loadTodos();
        } catch (error) {
            alert(error.message || 'Failed to update todo');
        }
    };

    window.deleteTodoItem = async function(todoId) {
        if (confirm('Are you sure you want to delete this todo?')) {
            try {
                await deleteTodo(todoId);
                await loadTodos();
            } catch (error) {
                alert(error.message || 'Failed to delete todo');
            }
        }
    };

    window.openEditModal = function(todoId) {
        const todo = todos.find(t => t.todoId === todoId);
        if (!todo) return;

        document.getElementById('editTodoId').value = todo.todoId;
        document.getElementById('editTodoTitle').value = todo.title;
        document.getElementById('editTodoDescription').value = todo.description || '';
        document.getElementById('editTodoPriority').value = todo.priority;
        document.getElementById('editTodoDueDate').value = todo.dueDate ? todo.dueDate.split('T')[0] : '';
        document.getElementById('editTodoTags').value = (todo.tags || []).join(', ');
        document.getElementById('editTodoCompleted').checked = todo.completed;

        editTodoModal.classList.remove('hidden');
    };

    loadTodos();
});