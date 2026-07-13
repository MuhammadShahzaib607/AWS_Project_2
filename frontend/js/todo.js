const API_URL = awsConfig.apiGateway.invokeUrl;
const TABLE_NAME = awsConfig.dynamodb.tableName;

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('idToken')
    };
}

async function createTodo(title, description = '', priority = 'medium', dueDate = null, tags = []) {
    try {
        if (!title || title.trim().length === 0) {
            throw new Error('Title is required');
        }
        if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
            throw new Error('Invalid priority level');
        }

        const response = await fetch(`${API_URL}/todos`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                title: title.trim(),
                description: description.trim(),
                priority,
                dueDate,
                tags: Array.isArray(tags) ? tags : []
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create todo');
        }

        const todo = await response.json();
        console.log('Todo created:', todo);
        return todo;
    } catch (error) {
        console.error('Error creating todo:', error);
        throw error;
    }
}

async function getTodos(filter = 'all') {
    try {
        const validFilters = ['all', 'active', 'completed'];
        const filterParam = validFilters.includes(filter) ? filter : 'all';

        const response = await fetch(`${API_URL}/todos?filter=${filterParam}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch todos');
        }

        const todos = await response.json();
        console.log(`Fetched ${todos.length} todos`);
        return todos;
    } catch (error) {
        console.error('Error fetching todos:', error);
        throw error;
    }
}

async function updateTodo(todoId, updates) {
    try {
        if (!todoId) {
            throw new Error('Todo ID is required');
        }

        const allowedFields = ['title', 'description', 'priority', 'dueDate', 'completed', 'tags'];
        const filteredUpdates = {};

        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        if (Object.keys(filteredUpdates).length === 0) {
            throw new Error('No valid fields to update');
        }

        const response = await fetch(`${API_URL}/todos/${todoId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(filteredUpdates)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update todo');
        }

        const updatedTodo = await response.json();
        console.log('Todo updated:', updatedTodo);
        return updatedTodo;
    } catch (error) {
        console.error('Error updating todo:', error);
        throw error;
    }
}

async function deleteTodo(todoId) {
    try {
        if (!todoId) {
            throw new Error('Todo ID is required');
        }

        const response = await fetch(`${API_URL}/todos/${todoId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete todo');
        }

        console.log('Todo deleted:', todoId);
        return { success: true, todoId };
    } catch (error) {
        console.error('Error deleting todo:', error);
        throw error;
    }
}

async function toggleComplete(todoId, currentStatus) {
    return updateTodo(todoId, { completed: !currentStatus });
}

function searchTodos(todos, query) {
    if (!query) return todos;
    const lowerQuery = query.toLowerCase();
    return todos.filter(todo => 
        todo.title.toLowerCase().includes(lowerQuery) || 
        todo.description.toLowerCase().includes(lowerQuery) ||
        (todo.tags && todo.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
}

function filterTodos(todos, filterType) {
    switch (filterType) {
        case 'completed':
            return todos.filter(t => t.completed);
        case 'active':
            return todos.filter(t => !t.completed);
        case 'today':
            const today = new Date().toDateString();
            return todos.filter(t => new Date(t.dueDate).toDateString() === today);
        case 'urgent':
            return todos.filter(t => t.priority === 'urgent' && !t.completed);
        case 'overdue':
            return todos.filter(t => new Date(t.dueDate) < new Date() && !t.completed);
        default:
            return todos;
    }
}

function sortTodos(todos, sortBy = 'date') {
    const sorted = [...todos];
    switch (sortBy) {
        case 'priority':
            const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
            return sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        case 'date':
            return sorted.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        case 'recent':
            return sorted.sort((a, b) => b.createdAt - a.createdAt);
        default:
            return sorted;
    }
}