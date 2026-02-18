// I handle incoming project briefs and extract the key information
// This is the entry point where projects start their journey

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    try {
        // I parse the incoming request
        const body = JSON.parse(event.body);
        const { briefContent, projectName, userId } = body;
        
        const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // I store the original brief in S3 for reference
        await s3.putObject({
            Bucket: process.env.BRIEFS_BUCKET,
            Key: `${projectId}/original-brief.txt`,
            Body: briefContent,
            ContentType: 'text/plain'
        }).promise();
        
        // I use AI to analyze the brief and extract key information
        const analysis = await analyzeBrief(briefContent);
        
        // I create the project record in DynamoDB
        const project = {
            projectId,
            projectName,
            userId,
            briefContent,
            analysis,
            status: 'ANALYZING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await dynamodb.put({
            TableName: process.env.PROJECTS_TABLE,
            Item: project
        }).promise();
        
        // I trigger the task generation process
        // This will be picked up by the task-generator Lambda
        await publishEvent('TaskGenerationRequested', {
            projectId,
            briefContent,
            analysis
        });
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                projectId,
                message: 'Brief processed successfully',
                analysis
            })
        };
        
    } catch (error) {
        console.error('Error processing brief:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process brief' })
        };
    }
};

// I analyze the brief using Claude to extract deliverables, requirements, and constraints
async function analyzeBrief(briefContent) {
    const prompt = `Analyze this project brief and extract:
1. Main deliverables (what needs to be built)
2. Key requirements (functional and non-functional)
3. Constraints (timeline, budget, technical limitations)
4. Success criteria (how we know it's done)

Brief:
${briefContent}

Respond in JSON format with keys: deliverables, requirements, constraints, successCriteria`;

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
    
    // I parse the AI response to get structured data
    const analysisText = responseBody.content[0].text;
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if parsing fails
    return {
        deliverables: [],
        requirements: [],
        constraints: [],
        successCriteria: []
    };
}

// I publish events to EventBridge for downstream processing
async function publishEvent(detailType, detail) {
    const eventbridge = new AWS.EventBridge();
    
    await eventbridge.putEvents({
        Entries: [{
            Source: 'agentflow.brief-processor',
            DetailType: detailType,
            Detail: JSON.stringify(detail),
            EventBusName: process.env.EVENT_BUS_NAME
        }]
    }).promise();
}
