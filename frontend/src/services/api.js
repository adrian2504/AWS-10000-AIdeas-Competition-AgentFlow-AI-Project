// I handle all API communication with the backend
// I manage authentication tokens and error handling

import { Auth } from 'aws-amplify';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// I normalize the endpoint to avoid double slashes
function normalizeEndpoint(endpoint) {
    // Remove leading slash if API_BASE_URL ends with slash
    if (API_BASE_URL.endsWith('/') && endpoint.startsWith('/')) {
        return endpoint.substring(1);
    }
    // Add leading slash if API_BASE_URL doesn't end with slash and endpoint doesn't start with slash
    if (!API_BASE_URL.endsWith('/') && !endpoint.startsWith('/')) {
        return '/' + endpoint;
    }
    return endpoint;
}

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
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    
    const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
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

// I fetch all team members
export async function getTeamMembers() {
    return apiRequest('/team');
}

// I add a new team member
export async function addTeamMember(memberData) {
    return apiRequest('/team', {
        method: 'POST',
        body: JSON.stringify(memberData)
    });
}

// I update a team member
export async function updateTeamMember(memberId, updates) {
    return apiRequest(`/team/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
}

// I delete a team member
export async function deleteTeamMember(memberId) {
    return apiRequest(`/team/${memberId}`, {
        method: 'DELETE'
    });
}

// I process audio recording for sprint planning
export async function processSprintAudio(projectId, audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('projectId', projectId);
    
    const token = await getAuthToken();
    const normalizedEndpoint = normalizeEndpoint('/sprint-planning/process-audio');
    
    console.log('Sending audio to API:', {
        url: `${API_BASE_URL}${normalizedEndpoint}`,
        audioSize: audioBlob.size,
        projectId
    });
    
    const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    console.log('API Response status:', response.status, response.statusText);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        let errorMessage = 'Failed to process audio';
        try {
            const error = JSON.parse(errorText);
            errorMessage = error.message || errorMessage;
        } catch (e) {
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('API Success response:', result);
    return result;
}

// I create sprint tasks from extracted tasks
export async function createSprintTasks(projectId, tasks) {
    return apiRequest('/sprint-planning/create-tasks', {
        method: 'POST',
        body: JSON.stringify({
            projectId,
            tasks
        })
    });
}

export default {
    createProject,
    getProjects,
    getTasks,
    updateTask,
    reviewTask,
    getTeamMembers,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    processSprintAudio,
    createSprintTasks
};


// I fetch admin user statistics
export async function getAdminUsers() {
    return apiRequest('/admin/users');
}

// I fetch admin usage statistics
export async function getAdminUsage() {
    return apiRequest('/admin/usage');
}

// I fetch admin login history
export async function getAdminLogins() {
    return apiRequest('/admin/logins');
}

// I handle real-time collaboration features
export async function updatePresence(projectId, status, currentView) {
    return apiRequest('/collaboration/presence', {
        method: 'POST',
        body: JSON.stringify({
            projectId,
            status,
            currentView
        })
    });
}

export async function getPresence(projectId) {
    return apiRequest(`/collaboration/presence?projectId=${projectId}`);
}

export async function addComment(projectId, taskId, comment, mentions = []) {
    return apiRequest('/collaboration/comments', {
        method: 'POST',
        body: JSON.stringify({
            projectId,
            taskId,
            comment,
            mentions
        })
    });
}

export async function getComments(projectId, taskId = null) {
    const params = new URLSearchParams({ projectId });
    if (taskId) params.append('taskId', taskId);
    return apiRequest(`/collaboration/comments?${params}`);
}

export async function trackActivity(projectId, action, details) {
    return apiRequest('/collaboration/activity', {
        method: 'POST',
        body: JSON.stringify({
            projectId,
            action,
            details
        })
    });
}

export async function getActivity(projectId) {
    return apiRequest(`/collaboration/activity?projectId=${projectId}`);
}

// I handle project health analysis
export async function analyzeProjectHealth(projectId) {
    return apiRequest('/health/analyze', {
        method: 'POST',
        body: JSON.stringify({ projectId })
    });
}

export async function getProjectHealth(projectId) {
    return apiRequest(`/health/${projectId}`);
}

export async function getProjectInsights(projectId) {
    return apiRequest(`/health/insights/${projectId}`);
}