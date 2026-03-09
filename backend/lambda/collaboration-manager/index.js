// I manage real-time collaboration features
// I track user presence, comments, and live activities

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const COLLABORATION_TABLE = process.env.COLLABORATION_TABLE;

exports.handler = async (event) => {
    console.log('Collaboration Manager Event:', JSON.stringify(event, null, 2));
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        const path = event.path || event.rawPath;
        const method = event.httpMethod;
        const userId = event.requestContext?.authorizer?.claims?.sub;
        const userEmail = event.requestContext?.authorizer?.claims?.email;
        
        if (path.includes('/presence') && method === 'POST') {
            return await updatePresence(event, headers, userId, userEmail);
        } else if (path.includes('/presence') && method === 'GET') {
            return await getPresence(event, headers);
        } else if (path.includes('/comments') && method === 'POST') {
            return await addComment(event, headers, userId, userEmail);
        } else if (path.includes('/comments') && method === 'GET') {
            return await getComments(event, headers);
        } else if (path.includes('/activity') && method === 'POST') {
            return await trackActivity(event, headers, userId, userEmail);
        } else if (path.includes('/activity') && method === 'GET') {
            return await getActivity(event, headers);
        }
        
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Endpoint not found' })
        };
        
    } catch (error) {
        console.error('Collaboration error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: error.message })
        };
    }
};

// I track user presence in projects
async function updatePresence(event, headers, userId, userEmail) {
    const body = JSON.parse(event.body);
    const { projectId, status, currentView } = body;
    
    const timestamp = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + (5 * 60); // 5 minutes TTL
    
    await docClient.send(new PutCommand({
        TableName: COLLABORATION_TABLE,
        Item: {
            projectId: `presence_${projectId}`,
            timestamp: `user_${userId}`,
            userId,
            userEmail,
            status, // 'online', 'away', 'offline'
            currentView, // 'kanban', 'tasks', 'sprint-planning'
            lastSeen: timestamp,
            ttl
        }
    }));
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Presence updated' })
    };
}

// I get all users currently present in a project
async function getPresence(event, headers) {
    const projectId = event.pathParameters?.projectId || event.queryStringParameters?.projectId;
    
    const result = await docClient.send(new QueryCommand({
        TableName: COLLABORATION_TABLE,
        KeyConditionExpression: 'projectId = :projectId',
        ExpressionAttributeValues: {
            ':projectId': `presence_${projectId}`
        }
    }));
    
    const activeUsers = result.Items?.filter(item => {
        const lastSeen = new Date(item.lastSeen);
        const now = new Date();
        const diffMinutes = (now - lastSeen) / (1000 * 60);
        return diffMinutes < 5; // Active within last 5 minutes
    }) || [];
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            activeUsers: activeUsers.map(user => ({
                userId: user.userId,
                userEmail: user.userEmail,
                status: user.status,
                currentView: user.currentView,
                lastSeen: user.lastSeen
            }))
        })
    };
}

// I add comments to tasks or projects
async function addComment(event, headers, userId, userEmail) {
    const body = JSON.parse(event.body);
    const { projectId, taskId, comment, mentions } = body;
    
    const timestamp = new Date().toISOString();
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    await docClient.send(new PutCommand({
        TableName: COLLABORATION_TABLE,
        Item: {
            projectId: `comments_${projectId}`,
            timestamp,
            commentId,
            taskId: taskId || 'project',
            userId,
            userEmail,
            comment,
            mentions: mentions || [],
            createdAt: timestamp
        }
    }));
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            commentId,
            message: 'Comment added successfully'
        })
    };
}

// I get comments for a project or task
async function getComments(event, headers) {
    const projectId = event.pathParameters?.projectId || event.queryStringParameters?.projectId;
    const taskId = event.queryStringParameters?.taskId;
    
    const result = await docClient.send(new QueryCommand({
        TableName: COLLABORATION_TABLE,
        KeyConditionExpression: 'projectId = :projectId',
        ExpressionAttributeValues: {
            ':projectId': `comments_${projectId}`
        },
        ScanIndexForward: false, // Latest first
        Limit: 50
    }));
    
    let comments = result.Items || [];
    
    // Filter by task if specified
    if (taskId) {
        comments = comments.filter(comment => comment.taskId === taskId);
    }
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ comments })
    };
}

// I track user activities for the activity feed
async function trackActivity(event, headers, userId, userEmail) {
    const body = JSON.parse(event.body);
    const { projectId, action, details } = body;
    
    const timestamp = new Date().toISOString();
    const activityId = `activity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    await docClient.send(new PutCommand({
        TableName: COLLABORATION_TABLE,
        Item: {
            projectId: `activity_${projectId}`,
            timestamp,
            activityId,
            userId,
            userEmail,
            action, // 'task_created', 'task_updated', 'task_completed', etc.
            details,
            createdAt: timestamp
        }
    }));
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            activityId,
            message: 'Activity tracked'
        })
    };
}

// I get recent activities for a project
async function getActivity(event, headers) {
    const projectId = event.pathParameters?.projectId || event.queryStringParameters?.projectId;
    
    const result = await docClient.send(new QueryCommand({
        TableName: COLLABORATION_TABLE,
        KeyConditionExpression: 'projectId = :projectId',
        ExpressionAttributeValues: {
            ':projectId': `activity_${projectId}`
        },
        ScanIndexForward: false, // Latest first
        Limit: 20
    }));
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            activities: result.Items || []
        })
    };
}