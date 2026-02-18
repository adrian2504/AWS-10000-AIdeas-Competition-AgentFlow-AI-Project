// I take the analyzed brief and break it down into atomic, actionable tasks
// Each task I create is small enough to be completed independently

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    try {
        // I receive the event from EventBridge
        const { projectId, briefContent, analysis } = event.detail;
        
        console.log(`Generating tasks for project: ${projectId}`);
        
        // I use AI to generate atomic tasks from the brief
        const tasks = await generateTasks(briefContent, analysis);
        
        // I identify dependencies between tasks
        const tasksWithDependencies = await identifyDependencies(tasks);
        
        // I save all tasks to DynamoDB
        for (const task of tasksWithDependencies) {
            const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            await dynamodb.put({
                TableName: process.env.TASKS_TABLE,
                Item: {
                    taskId,
                    projectId,
                    ...task,
                    status: 'QUEUED',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            }).promise();
        }
        
        // I update the project status
        await dynamodb.update({
            TableName: process.env.PROJECTS_TABLE,
            Key: { projectId },
            UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt, taskCount = :taskCount',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'TASKS_GENERATED',
                ':updatedAt': new Date().toISOString(),
                ':taskCount': tasks.length
            }
        }).promise();
        
        // I trigger the routing process for each task
        await publishEvent('TasksGenerated', {
            projectId,
            taskCount: tasks.length
        });
        
        console.log(`Generated ${tasks.length} tasks for project ${projectId}`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                projectId,
                tasksGenerated: tasks.length
            })
        };
        
    } catch (error) {
        console.error('Error generating tasks:', error);
        throw error;
    }
};

// I use AI to break down the brief into specific, actionable tasks
async function generateTasks(briefContent, analysis) {
    const prompt = `Based on this project brief and analysis, generate a list of atomic tasks.

Brief: ${briefContent}

Analysis: ${JSON.stringify(analysis, null, 2)}

For each task, provide:
- title: Clear, action-oriented title
- description: What needs to be done
- acceptanceCriteria: How I know it's complete
- estimatedComplexity: LOW, MEDIUM, or HIGH
- category: RESEARCH, DESIGN, DEVELOPMENT, TESTING, DOCUMENTATION, or DEPLOYMENT
- requiresHumanJudgment: true if it needs human expertise, false if AI can handle it

Generate 8-15 tasks that cover the entire project. Make them small and independent.

Respond in JSON format as an array of task objects.`;

    const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-sonnet-4-20250514-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 4000,
            messages: [{
                role: 'user',
                content: prompt
            }]
        })
    });
    
    const response = await bedrock.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // I extract the JSON array from the response
    const tasksText = responseBody.content[0].text;
    const jsonMatch = tasksText.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    
    return [];
}

// I figure out which tasks depend on others so work happens in the right order
async function identifyDependencies(tasks) {
    const prompt = `Given these tasks, identify dependencies between them.

Tasks:
${tasks.map((t, i) => `${i}. ${t.title}: ${t.description}`).join('\n')}

For each task, list the indices of tasks that must be completed before it can start.
Respond in JSON format: { "0": [], "1": [0], "2": [0, 1], ... }`;

    const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-sonnet-4-20250514-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 2000,
            messages: [{
                role: 'user',
                content: prompt
            }]
        })
    });
    
    const response = await bedrock.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    const depsText = responseBody.content[0].text;
    const jsonMatch = depsText.match(/\{[\s\S]*\}/);
    
    let dependencies = {};
    if (jsonMatch) {
        dependencies = JSON.parse(jsonMatch[0]);
    }
    
    // I add dependency information to each task
    return tasks.map((task, index) => ({
        ...task,
        dependencies: dependencies[index.toString()] || [],
        dependencyCount: (dependencies[index.toString()] || []).length
    }));
}

// I publish events to EventBridge
async function publishEvent(detailType, detail) {
    const eventbridge = new AWS.EventBridge();
    
    await eventbridge.putEvents({
        Entries: [{
            Source: 'agentflow.task-generator',
            DetailType: detailType,
            Detail: JSON.stringify(detail),
            EventBusName: process.env.EVENT_BUS_NAME
        }]
    }).promise();
}
