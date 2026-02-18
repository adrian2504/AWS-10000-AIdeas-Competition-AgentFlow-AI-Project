// I handle all CRUD operations for tasks and provide the API for the frontend
// I'm the main interface between the dashboard and the backend systems

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

exports.handler = async (event) => {
    try {
        const { httpMethod, path, pathParameters, body } = event;
        
        // I route to the appropriate handler based on the HTTP method and path
        if (httpMethod === 'GET' && path.includes('/projects')) {
            return await getProjects(event);
        }
        
        if (httpMethod === 'GET' && path.includes('/tasks')) {
            return await getTasks(pathParameters.projectId);
        }
        
        if (httpMethod === 'POST' && path.includes('/tasks')) {
            return await updateTask(JSON.parse(body));
        }
        
        if (httpMethod === 'POST' && path.includes('/review')) {
            return await reviewTask(JSON.parse(body));
        }
        
        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Not found' })
        };
        
    } catch (error) {
        console.error('Error in task manager:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: error.message })
        };
    }
};

// I fetch all projects for a user
async function getProjects(event) {
    const userId = event.requestContext.authorizer.claims.sub;
    
    const result = await dynamodb.query({
        TableName: process.env.PROJECTS_TABLE,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        },
        ScanIndexForward: false // I return newest first
    }).promise();
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            projects: result.Items
        })
    };
}

// I fetch all tasks for a project, organized by status for the Kanban board
async function getTasks(projectId) {
    const result = await dynamodb.query({
        TableName: process.env.TASKS_TABLE,
        IndexName: 'ProjectIdIndex',
        KeyConditionExpression: 'projectId = :projectId',
        ExpressionAttributeValues: {
            ':projectId': projectId
        }
    }).promise();
    
    const tasks = result.Items;
    
    // I organize tasks by status for the Kanban board
    const kanbanBoard = {
        QUEUED: [],
        IN_PROGRESS: [],
        REVIEW: [],
        DONE: [],
        FAILED: []
    };
    
    tasks.forEach(task => {
        if (kanbanBoard[task.status]) {
            kanbanBoard[task.status].push(task);
        }
    });
    
    // I also calculate project statistics
    const stats = {
        total: tasks.length,
        completed: kanbanBoard.DONE.length,
        inProgress: kanbanBoard.IN_PROGRESS.length,
        queued: kanbanBoard.QUEUED.length,
        review: kanbanBoard.REVIEW.length,
        failed: kanbanBoard.FAILED.length,
        aiTasks: tasks.filter(t => t.assignmentType === 'AI').length,
        humanTasks: tasks.filter(t => t.assignmentType === 'HUMAN').length
    };
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            kanbanBoard,
            stats,
            tasks
        })
    };
}

// I update a task (used when humans complete their assigned tasks)
async function updateTask(data) {
    const { taskId, status, output, notes } = data;
    
    const updateParams = {
        TableName: process.env.TASKS_TABLE,
        Key: { taskId },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#status': 'status'
        },
        ExpressionAttributeValues: {
            ':status': status,
            ':updatedAt': new Date().toISOString()
        }
    };
    
    if (output) {
        updateParams.UpdateExpression += ', output = :output';
        updateParams.ExpressionAttributeValues[':output'] = output;
    }
    
    if (notes) {
        updateParams.UpdateExpression += ', notes = :notes';
        updateParams.ExpressionAttributeValues[':notes'] = notes;
    }
    
    if (status === 'DONE') {
        updateParams.UpdateExpression += ', completedAt = :completedAt';
        updateParams.ExpressionAttributeValues[':completedAt'] = new Date().toISOString();
    }
    
    await dynamodb.update(updateParams).promise();
    
    // I publish an event for task updates
    await publishEvent('TaskUpdated', {
        taskId,
        status
    });
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Task updated successfully',
            taskId
        })
    };
}

// I handle task review - approve or request changes
async function reviewTask(data) {
    const { taskId, approved, feedback } = data;
    
    const task = await dynamodb.get({
        TableName: process.env.TASKS_TABLE,
        Key: { taskId }
    }).promise();
    
    if (!task.Item) {
        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Task not found' })
        };
    }
    
    if (approved) {
        // I mark the task as done
        await dynamodb.update({
            TableName: process.env.TASKS_TABLE,
            Key: { taskId },
            UpdateExpression: 'SET #status = :status, reviewedAt = :reviewedAt, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'DONE',
                ':reviewedAt': new Date().toISOString(),
                ':updatedAt': new Date().toISOString()
            }
        }).promise();
        
        await publishEvent('TaskApproved', { taskId });
        
    } else {
        // I send the task back for rework
        await dynamodb.update({
            TableName: process.env.TASKS_TABLE,
            Key: { taskId },
            UpdateExpression: 'SET #status = :status, reviewFeedback = :feedback, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'QUEUED',
                ':feedback': feedback,
                ':updatedAt': new Date().toISOString()
            }
        }).promise();
        
        // I trigger re-execution with the feedback
        await publishEvent('TaskRejected', {
            taskId,
            feedback
        });
    }
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: approved ? 'Task approved' : 'Task sent back for rework',
            taskId
        })
    };
}

// I publish events to EventBridge
async function publishEvent(detailType, detail) {
    const eventbridge = new AWS.EventBridge();
    
    await eventbridge.putEvents({
        Entries: [{
            Source: 'agentflow.task-manager',
            DetailType: detailType,
            Detail: JSON.stringify(detail),
            EventBusName: process.env.EVENT_BUS_NAME
        }]
    }).promise();
}
