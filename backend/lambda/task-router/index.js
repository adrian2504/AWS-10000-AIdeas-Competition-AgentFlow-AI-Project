// I decide whether each task goes to an AI agent or a human expert
// My routing logic considers complexity, risk, and the type of work needed

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const { projectId } = event.detail;
        
        console.log(`Routing tasks for project: ${projectId}`);
        
        // I fetch all queued tasks for this project
        const tasks = await dynamodb.query({
            TableName: process.env.TASKS_TABLE,
            IndexName: 'ProjectStatusIndex',
            KeyConditionExpression: 'projectId = :projectId AND #status = :status',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':projectId': projectId,
                ':status': 'QUEUED'
            }
        }).promise();
        
        // I route each task based on my routing logic
        for (const task of tasks.Items) {
            const assignment = routeTask(task);
            
            await dynamodb.update({
                TableName: process.env.TASKS_TABLE,
                Key: { taskId: task.taskId },
                UpdateExpression: 'SET assignedTo = :assignedTo, assignmentType = :assignmentType, routingReason = :reason, updatedAt = :updatedAt',
                ExpressionAttributeValues: {
                    ':assignedTo': assignment.assignedTo,
                    ':assignmentType': assignment.type,
                    ':reason': assignment.reason,
                    ':updatedAt': new Date().toISOString()
                }
            }).promise();
            
            // I publish an event for task assignment
            await publishEvent('TaskRouted', {
                taskId: task.taskId,
                projectId,
                assignmentType: assignment.type,
                assignedTo: assignment.assignedTo
            });
        }
        
        console.log(`Routed ${tasks.Items.length} tasks`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                projectId,
                tasksRouted: tasks.Items.length
            })
        };
        
    } catch (error) {
        console.error('Error routing tasks:', error);
        throw error;
    }
};

// I apply my routing logic to decide AI vs Human
function routeTask(task) {
    const {
        estimatedComplexity,
        category,
        requiresHumanJudgment,
        title,
        description
    } = task;
    
    // I check if the task explicitly requires human judgment
    if (requiresHumanJudgment) {
        return {
            type: 'HUMAN',
            assignedTo: 'HUMAN_POOL',
            reason: 'Task requires human judgment and expertise'
        };
    }
    
    // I route high-complexity tasks to humans
    if (estimatedComplexity === 'HIGH') {
        return {
            type: 'HUMAN',
            assignedTo: 'HUMAN_POOL',
            reason: 'High complexity requires human oversight'
        };
    }
    
    // I check task categories that typically need human input
    const humanCategories = ['DESIGN', 'RESEARCH'];
    if (humanCategories.includes(category)) {
        return {
            type: 'HUMAN',
            assignedTo: 'HUMAN_POOL',
            reason: `${category} tasks benefit from human creativity and insight`
        };
    }
    
    // I look for keywords that suggest human expertise is needed
    const humanKeywords = [
        'review', 'approve', 'decide', 'strategy', 'creative',
        'user experience', 'design', 'architecture decision'
    ];
    
    const taskText = `${title} ${description}`.toLowerCase();
    const needsHuman = humanKeywords.some(keyword => taskText.includes(keyword));
    
    if (needsHuman) {
        return {
            type: 'HUMAN',
            assignedTo: 'HUMAN_POOL',
            reason: 'Task involves decision-making or creative work'
        };
    }
    
    // I route everything else to AI - it's faster and more scalable
    return {
        type: 'AI',
        assignedTo: 'AI_AGENT',
        reason: 'Task is structured and can be automated'
    };
}

// I publish routing events to EventBridge
async function publishEvent(detailType, detail) {
    const eventbridge = new AWS.EventBridge();
    
    await eventbridge.putEvents({
        Entries: [{
            Source: 'agentflow.task-router',
            DetailType: detailType,
            Detail: JSON.stringify(detail),
            EventBusName: process.env.EVENT_BUS_NAME
        }]
    }).promise();
}
