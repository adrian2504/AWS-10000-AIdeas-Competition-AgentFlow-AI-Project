// I execute tasks that have been assigned to AI agents
// I gather context, run the task, and submit the output for review

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    try {
        const { taskId, projectId } = event.detail;
        
        console.log(`Executing AI task: ${taskId}`);
        
        // I fetch the task details
        const taskResult = await dynamodb.get({
            TableName: process.env.TASKS_TABLE,
            Key: { taskId }
        }).promise();
        
        const task = taskResult.Item;
        
        if (!task || task.assignmentType !== 'AI') {
            console.log('Task not found or not assigned to AI');
            return;
        }
        
        // I update task status to IN_PROGRESS
        await updateTaskStatus(taskId, 'IN_PROGRESS');
        
        // I gather relevant context using RAG
        const context = await gatherContext(projectId, task);
        
        // I execute the task using AI
        const output = await executeTask(task, context);
        
        // I store the output in S3
        const outputKey = `${projectId}/tasks/${taskId}/output.json`;
        await s3.putObject({
            Bucket: process.env.OUTPUTS_BUCKET,
            Key: outputKey,
            Body: JSON.stringify(output, null, 2),
            ContentType: 'application/json'
        }).promise();
        
        // I update the task with the output
        await dynamodb.update({
            TableName: process.env.TASKS_TABLE,
            Key: { taskId },
            UpdateExpression: 'SET #status = :status, output = :output, outputLocation = :location, completedAt = :completedAt, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'REVIEW',
                ':output': output.summary,
                ':location': outputKey,
                ':completedAt': new Date().toISOString(),
                ':updatedAt': new Date().toISOString()
            }
        }).promise();
        
        // I notify that the task is ready for review
        await publishEvent('TaskCompleted', {
            taskId,
            projectId,
            status: 'REVIEW'
        });
        
        console.log(`Task ${taskId} completed and ready for review`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                taskId,
                status: 'REVIEW',
                output: output.summary
            })
        };
        
    } catch (error) {
        console.error('Error executing AI task:', error);
        
        // I mark the task as failed
        if (event.detail.taskId) {
            await updateTaskStatus(event.detail.taskId, 'FAILED', error.message);
        }
        
        throw error;
    }
};

// I gather relevant context from the project brief and previous task outputs
async function gatherContext(projectId, task) {
    const context = {
        projectBrief: '',
        relatedOutputs: [],
        dependencies: []
    };
    
    try {
        // I fetch the original project brief
        const briefResult = await s3.getObject({
            Bucket: process.env.BRIEFS_BUCKET,
            Key: `${projectId}/original-brief.txt`
        }).promise();
        
        context.projectBrief = briefResult.Body.toString('utf-8');
        
        // I fetch outputs from dependent tasks if any
        if (task.dependencies && task.dependencies.length > 0) {
            const dependencyTasks = await dynamodb.batchGet({
                RequestItems: {
                    [process.env.TASKS_TABLE]: {
                        Keys: task.dependencies.map(depIndex => ({
                            taskId: `task_${depIndex}` // This would need proper task ID mapping
                        }))
                    }
                }
            }).promise();
            
            context.dependencies = dependencyTasks.Responses[process.env.TASKS_TABLE] || [];
        }
        
    } catch (error) {
        console.error('Error gathering context:', error);
    }
    
    return context;
}

// I execute the task using Claude with the gathered context
async function executeTask(task, context) {
    const prompt = `I need to complete this task for a project.

Task: ${task.title}
Description: ${task.description}
Category: ${task.category}
Acceptance Criteria: ${task.acceptanceCriteria}

Project Context:
${context.projectBrief}

${context.dependencies.length > 0 ? `
Previous Task Outputs:
${context.dependencies.map(dep => `- ${dep.title}: ${dep.output}`).join('\n')}
` : ''}

Please complete this task and provide:
1. A detailed output that meets the acceptance criteria
2. Any artifacts or deliverables
3. Recommendations for next steps

Respond in JSON format with keys: output, artifacts, recommendations, status`;

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
    
    const outputText = responseBody.content[0].text;
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
            summary: parsed.output || outputText,
            artifacts: parsed.artifacts || [],
            recommendations: parsed.recommendations || [],
            fullOutput: outputText
        };
    }
    
    return {
        summary: outputText,
        artifacts: [],
        recommendations: [],
        fullOutput: outputText
    };
}

// I update task status in DynamoDB
async function updateTaskStatus(taskId, status, errorMessage = null) {
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
    
    if (errorMessage) {
        updateParams.UpdateExpression += ', errorMessage = :error';
        updateParams.ExpressionAttributeValues[':error'] = errorMessage;
    }
    
    await dynamodb.update(updateParams).promise();
}

// I publish events to EventBridge
async function publishEvent(detailType, detail) {
    const eventbridge = new AWS.EventBridge();
    
    await eventbridge.putEvents({
        Entries: [{
            Source: 'agentflow.ai-executor',
            DetailType: detailType,
            Detail: JSON.stringify(detail),
            EventBusName: process.env.EVENT_BUS_NAME
        }]
    }).promise();
}
