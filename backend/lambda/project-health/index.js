// I analyze project health using AI and provide insights
// I calculate risk scores, predict outcomes, and suggest improvements

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

const PROJECT_HEALTH_TABLE = process.env.PROJECT_HEALTH_TABLE;
const PROJECTS_TABLE = process.env.PROJECTS_TABLE;
const TASKS_TABLE = process.env.TASKS_TABLE;
const TEAM_TABLE = process.env.TEAM_TABLE;

exports.handler = async (event) => {
    console.log('Project Health Event:', JSON.stringify(event, null, 2));
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        const path = event.path || event.rawPath;
        const method = event.httpMethod;
        
        if (path.includes('/analyze') && method === 'POST') {
            return await analyzeProjectHealth(event, headers);
        } else if (path.includes('/health') && method === 'GET') {
            return await getProjectHealth(event, headers);
        } else if (path.includes('/insights') && method === 'GET') {
            return await getProjectInsights(event, headers);
        }
        
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Endpoint not found' })
        };
        
    } catch (error) {
        console.error('Project health error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: error.message })
        };
    }
};

// I analyze project health and generate AI insights
async function analyzeProjectHealth(event, headers) {
    const body = JSON.parse(event.body);
    const { projectId } = body;
    
    // I gather project data
    const projectData = await gatherProjectData(projectId);
    
    // I calculate health metrics
    const healthMetrics = calculateHealthMetrics(projectData);
    
    // I generate AI insights
    const aiInsights = await generateAIInsights(projectData, healthMetrics);
    
    // I store the health analysis
    const timestamp = new Date().toISOString();
    const healthRecord = {
        projectId,
        timestamp,
        healthScore: healthMetrics.overallScore,
        riskLevel: healthMetrics.riskLevel,
        metrics: healthMetrics,
        insights: aiInsights,
        recommendations: aiInsights.recommendations,
        createdAt: timestamp
    };
    
    await docClient.send(new PutCommand({
        TableName: PROJECT_HEALTH_TABLE,
        Item: healthRecord
    }));
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(healthRecord)
    };
}

// I gather all relevant project data for analysis
async function gatherProjectData(projectId) {
    // Get project details
    const project = await docClient.send(new QueryCommand({
        TableName: PROJECTS_TABLE,
        KeyConditionExpression: 'projectId = :projectId',
        ExpressionAttributeValues: { ':projectId': projectId }
    }));
    
    // Get all tasks
    const tasks = await docClient.send(new QueryCommand({
        TableName: TASKS_TABLE,
        IndexName: 'ProjectIdIndex',
        KeyConditionExpression: 'projectId = :projectId',
        ExpressionAttributeValues: { ':projectId': projectId }
    }));
    
    // Get team members
    const team = await docClient.send(new ScanCommand({
        TableName: TEAM_TABLE
    }));
    
    return {
        project: project.Items?.[0],
        tasks: tasks.Items || [],
        team: team.Items || []
    };
}

// I calculate various health metrics
function calculateHealthMetrics(data) {
    const { project, tasks, team } = data;
    
    if (!project || !tasks.length) {
        return {
            overallScore: 0,
            riskLevel: 'HIGH',
            completionRate: 0,
            velocityScore: 0,
            teamUtilization: 0,
            timelineRisk: 'HIGH'
        };
    }
    
    // Calculate completion rate
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const completionRate = (completedTasks / tasks.length) * 100;
    
    // Calculate velocity (tasks completed per day since project start)
    const projectStart = new Date(project.createdAt);
    const daysSinceStart = Math.max(1, (Date.now() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
    const velocity = completedTasks / daysSinceStart;
    
    // Calculate team utilization
    const assignedTasks = tasks.filter(task => task.assignedTo && task.status !== 'completed').length;
    const teamSize = team.length || 1;
    const teamUtilization = Math.min(100, (assignedTasks / teamSize) * 100);
    
    // Calculate timeline risk
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const queuedTasks = tasks.filter(task => task.status === 'queued').length;
    const timelineRisk = (inProgressTasks + queuedTasks) > (teamSize * 3) ? 'HIGH' : 
                        (inProgressTasks + queuedTasks) > teamSize ? 'MEDIUM' : 'LOW';
    
    // Calculate overall score (0-100)
    const velocityScore = Math.min(100, velocity * 20); // Normalize velocity
    const overallScore = Math.round(
        (completionRate * 0.4) + 
        (velocityScore * 0.3) + 
        (teamUtilization * 0.2) + 
        ((timelineRisk === 'LOW' ? 100 : timelineRisk === 'MEDIUM' ? 60 : 20) * 0.1)
    );
    
    const riskLevel = overallScore >= 80 ? 'LOW' : 
                     overallScore >= 60 ? 'MEDIUM' : 'HIGH';
    
    return {
        overallScore,
        riskLevel,
        completionRate: Math.round(completionRate),
        velocityScore: Math.round(velocityScore),
        teamUtilization: Math.round(teamUtilization),
        timelineRisk,
        taskBreakdown: {
            total: tasks.length,
            completed: completedTasks,
            inProgress: inProgressTasks,
            queued: queuedTasks
        },
        teamMetrics: {
            size: teamSize,
            assignedTasks,
            avgTasksPerMember: Math.round(assignedTasks / teamSize)
        }
    };
}

// I generate AI-powered insights and recommendations
async function generateAIInsights(data, metrics) {
    const { project, tasks, team } = data;
    
    const prompt = `Analyze this project health data and provide insights:

Project: ${project.projectName}
Status: ${project.status}
Created: ${project.createdAt}

Health Metrics:
- Overall Score: ${metrics.overallScore}/100
- Completion Rate: ${metrics.completionRate}%
- Risk Level: ${metrics.riskLevel}
- Team Utilization: ${metrics.teamUtilization}%
- Timeline Risk: ${metrics.timelineRisk}

Task Breakdown:
- Total Tasks: ${metrics.taskBreakdown.total}
- Completed: ${metrics.taskBreakdown.completed}
- In Progress: ${metrics.taskBreakdown.inProgress}
- Queued: ${metrics.taskBreakdown.queued}

Team:
- Size: ${metrics.teamMetrics.size}
- Avg Tasks per Member: ${metrics.teamMetrics.avgTasksPerMember}

Provide a JSON response with:
1. "summary": Brief 2-sentence project health summary
2. "risks": Array of identified risks with severity (HIGH/MEDIUM/LOW)
3. "recommendations": Array of specific actionable recommendations
4. "predictions": Predicted completion timeline and success probability
5. "strengths": What's going well in the project

Focus on actionable insights for project managers.`;

    try {
        const command = new InvokeModelCommand({
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 2000,
                temperature: 0.7,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });
        
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        const insightsText = responseBody.content[0].text;
        const jsonMatch = insightsText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        // Fallback insights
        return generateFallbackInsights(metrics);
        
    } catch (error) {
        console.error('Error generating AI insights:', error);
        return generateFallbackInsights(metrics);
    }
}

// I provide fallback insights if AI fails
function generateFallbackInsights(metrics) {
    const insights = {
        summary: `Project health score is ${metrics.overallScore}/100 with ${metrics.riskLevel.toLowerCase()} risk level. Completion rate is ${metrics.completionRate}%.`,
        risks: [],
        recommendations: [],
        predictions: {
            estimatedCompletion: 'Unable to predict',
            successProbability: metrics.overallScore
        },
        strengths: []
    };
    
    // Add risk-based recommendations
    if (metrics.riskLevel === 'HIGH') {
        insights.risks.push({
            type: 'Timeline Risk',
            severity: 'HIGH',
            description: 'Project may miss deadlines due to low completion rate'
        });
        insights.recommendations.push('Consider adding more team members or reducing scope');
        insights.recommendations.push('Focus on completing in-progress tasks before starting new ones');
    }
    
    if (metrics.teamUtilization > 80) {
        insights.risks.push({
            type: 'Team Overload',
            severity: 'MEDIUM',
            description: 'Team utilization is high, risk of burnout'
        });
        insights.recommendations.push('Balance workload across team members');
    }
    
    if (metrics.completionRate > 70) {
        insights.strengths.push('Good task completion rate');
    }
    
    if (metrics.teamUtilization < 50) {
        insights.strengths.push('Team has capacity for additional work');
    }
    
    return insights;
}

// I get the latest health analysis for a project
async function getProjectHealth(event, headers) {
    const projectId = event.pathParameters?.projectId || event.queryStringParameters?.projectId;
    
    const result = await docClient.send(new QueryCommand({
        TableName: PROJECT_HEALTH_TABLE,
        KeyConditionExpression: 'projectId = :projectId',
        ExpressionAttributeValues: { ':projectId': projectId },
        ScanIndexForward: false, // Latest first
        Limit: 1
    }));
    
    const latestHealth = result.Items?.[0];
    
    if (!latestHealth) {
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'No health data found. Run analysis first.' })
        };
    }
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(latestHealth)
    };
}

// I get historical health insights for trending
async function getProjectInsights(event, headers) {
    const projectId = event.pathParameters?.projectId || event.queryStringParameters?.projectId;
    
    const result = await docClient.send(new QueryCommand({
        TableName: PROJECT_HEALTH_TABLE,
        KeyConditionExpression: 'projectId = :projectId',
        ExpressionAttributeValues: { ':projectId': projectId },
        ScanIndexForward: false, // Latest first
        Limit: 10
    }));
    
    const healthHistory = result.Items || [];
    
    // Calculate trends
    const trends = {
        healthScoreTrend: calculateTrend(healthHistory.map(h => h.healthScore)),
        completionRateTrend: calculateTrend(healthHistory.map(h => h.metrics?.completionRate || 0)),
        riskLevelHistory: healthHistory.map(h => ({
            timestamp: h.timestamp,
            riskLevel: h.riskLevel
        }))
    };
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            history: healthHistory,
            trends
        })
    };
}

// I calculate trend direction (improving, declining, stable)
function calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(0, 3);
    const older = values.slice(3, 6);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
    
    const diff = recentAvg - olderAvg;
    
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
}