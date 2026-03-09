// I provide admin analytics and user management
// Only accessible by the admin email

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'adriandsouza2504@gmail.com';

exports.handler = async (event) => {
    try {
        const userEmail = event.requestContext.authorizer.claims.email;
        
        // I verify admin access
        if (userEmail !== ADMIN_EMAIL) {
            return {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Unauthorized',
                    message: 'Admin access required'
                })
            };
        }
        
        const path = event.path;
        const method = event.httpMethod;
        
        // I route to appropriate handler
        if (path.includes('/admin/users') && method === 'GET') {
            return await getUserStats();
        } else if (path.includes('/admin/usage') && method === 'GET') {
            return await getUsageStats();
        } else if (path.includes('/admin/logins') && method === 'GET') {
            return await getLoginHistory();
        }
        
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Endpoint not found' })
        };
        
    } catch (error) {
        console.error('Admin portal error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

// I get user statistics
async function getUserStats() {
    // I scan all projects to get user counts
    const projects = await dynamodb.scan({
        TableName: process.env.PROJECTS_TABLE
    }).promise();
    
    // I scan all tasks to get task counts
    const tasks = await dynamodb.scan({
        TableName: process.env.TASKS_TABLE
    }).promise();
    
    // I scan usage tracking
    const usage = await dynamodb.scan({
        TableName: process.env.USAGE_TRACKING_TABLE
    }).promise();
    
    // I aggregate by user
    const userMap = new Map();
    
    projects.Items.forEach(project => {
        if (!userMap.has(project.userId)) {
            userMap.set(project.userId, {
                userId: project.userId,
                email: 'N/A',
                projectCount: 0,
                taskCount: 0,
                transcriptionCount: 0,
                lastActive: project.createdAt
            });
        }
        const user = userMap.get(project.userId);
        user.projectCount++;
        if (project.createdAt > user.lastActive) {
            user.lastActive = project.createdAt;
        }
    });
    
    tasks.Items.forEach(task => {
        const projectUserId = projects.Items.find(p => p.projectId === task.projectId)?.userId;
        if (projectUserId && userMap.has(projectUserId)) {
            userMap.get(projectUserId).taskCount++;
        }
    });
    
    usage.Items.forEach(record => {
        if (userMap.has(record.userId)) {
            const user = userMap.get(record.userId);
            user.email = record.email || user.email;
            if (record.action === 'transcription') {
                user.transcriptionCount++;
            }
        }
    });
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            users: Array.from(userMap.values()),
            totalUsers: userMap.size,
            totalProjects: projects.Items.length,
            totalTasks: tasks.Items.length
        })
    };
}

// I get usage statistics
async function getUsageStats() {
    const usage = await dynamodb.scan({
        TableName: process.env.USAGE_TRACKING_TABLE
    }).promise();
    
    // I aggregate by action type
    const stats = {
        transcriptions: 0,
        projectCreations: 0,
        taskCreations: 0,
        byDate: {}
    };
    
    usage.Items.forEach(record => {
        if (record.action === 'transcription') stats.transcriptions++;
        if (record.action === 'project_creation') stats.projectCreations++;
        if (record.action === 'task_creation') stats.taskCreations++;
        
        const date = record.timestamp.split('T')[0];
        if (!stats.byDate[date]) {
            stats.byDate[date] = { transcriptions: 0, projects: 0, tasks: 0 };
        }
        if (record.action === 'transcription') stats.byDate[date].transcriptions++;
        if (record.action === 'project_creation') stats.byDate[date].projects++;
        if (record.action === 'task_creation') stats.byDate[date].tasks++;
    });
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(stats)
    };
}

// I get login history
async function getLoginHistory() {
    const logins = await dynamodb.scan({
        TableName: process.env.LOGIN_TRACKING_TABLE,
        Limit: 100
    }).promise();
    
    // I sort by timestamp descending
    const sortedLogins = logins.Items.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            logins: sortedLogins,
            total: logins.Count
        })
    };
}
