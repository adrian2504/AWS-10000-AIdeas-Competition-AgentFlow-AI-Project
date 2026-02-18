// I handle all API communication with the backend
// I manage authentication tokens and error handling

import { Auth } from 'aws-amplify';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// I get the authentication token for API requests
async function getAuthToken() {
    try {
        const session = await Auth.currentSession();
        return session.getIdToken().getJwtToken();
    } catch (error) {
        console.error('Failed to get auth token:', error);
        throw error;
    }
}

// I make authenticated API requests
async function apiRequest(endpoint, options = {}) {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }
    
    return response.json();
}

// I submit a new project brief
export async function createProject(projectName, briefContent) {
    return apiRequest('/briefs', {
        method: 'POST',
        body: JSON.stringify({
            projectName,
            briefContent,
            userId: (await Auth.currentAuthenticatedUser()).username
        })
    });
}

// I fetch all projects for the current user
export async function getProjects() {
    return apiRequest('/projects');
}

// I fetch all tasks for a specific project
export async function getTasks(projectId) {
    return apiRequest(`/projects/${projectId}/tasks`);
}

// I update a task (used when humans complete their work)
export async function updateTask(taskId, updates) {
    return apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify({
            taskId,
            ...updates
        })
    });
}

// I submit a task review (approve or reject)
export async function reviewTask(taskId, approved, feedback = '') {
    return apiRequest('/review', {
        method: 'POST',
        body: JSON.stringify({
            taskId,
            approved,
            feedback
        })
    });
}

export default {
    createProject,
    getProjects,
    getTasks,
    updateTask,
    reviewTask
};
