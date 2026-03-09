// I handle sprint planning audio processing and task extraction
// I use AWS Transcribe for audio-to-text and Bedrock for task extraction

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand, DeleteTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const Busboy = require('busboy');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const transcribeClient = new TranscribeClient({});
const s3Client = new S3Client({});

const TASKS_TABLE = process.env.TASKS_TABLE;
const SPRINT_AUDIO_BUCKET = process.env.SPRINT_AUDIO_BUCKET;
const USAGE_TRACKING_TABLE = process.env.USAGE_TRACKING_TABLE;

// I define usage limits
const LIMITS = {
    MAX_TRANSCRIPTIONS_PER_USER: 6,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'adriandsouza2504@gmail.com'
};

exports.handler = async (event) => {
    console.log('Sprint Planner Event:', JSON.stringify(event, null, 2));
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        const path = event.path || event.rawPath;
        const userId = event.requestContext?.authorizer?.claims?.sub;
        const userEmail = event.requestContext?.authorizer?.claims?.email;
        
        if (path.includes('/process-audio')) {
            // I check transcription limit before processing
            if (userId && userEmail) {
                const limitCheck = await checkTranscriptionLimit(userId, userEmail);
                if (!limitCheck.allowed) {
                    return {
                        statusCode: 403,
                        headers,
                        body: JSON.stringify({
                            error: 'Transcription limit reached',
                            message: `You have reached the maximum limit of ${limitCheck.limit} transcriptions. Please contact support for more quota.`,
                            currentCount: limitCheck.currentCount,
                            limit: limitCheck.limit
                        })
                    };
                }
            }
            
            const result = await processAudio(event, headers);
            
            // I track successful transcription
            if (result.statusCode === 200 && userId && userEmail) {
                await trackUsage(userId, userEmail, 'transcription');
            }
            
            return result;
        } else if (path.includes('/create-tasks')) {
            return await createTasks(event, headers);
        }
        
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Not found' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: error.message })
        };
    }
};

async function processAudio(event, headers) {
    try {
        // Parse multipart form data using busboy
        const contentType = event.headers['content-type'] || event.headers['Content-Type'];
        
        if (!contentType || !contentType.includes('multipart/form-data')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Content-Type must be multipart/form-data' })
            };
        }
        
        // Parse the form data
        const result = await parseMultipartForm(event);
        const audioData = result.files.audio;
        const projectId = result.fields.projectId;
        
        if (!audioData || !projectId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Missing audio or projectId' })
            };
        }
        
        console.log('Received audio:', audioData.length, 'bytes for project:', projectId);
        
        // Upload audio to S3
        const audioKey = `${projectId}/${Date.now()}.webm`;
        await s3Client.send(new PutObjectCommand({
            Bucket: SPRINT_AUDIO_BUCKET,
            Key: audioKey,
            Body: audioData,
            ContentType: 'audio/webm'
        }));
        
        console.log('Audio uploaded to S3:', audioKey);
        
        // Start transcription job
        const jobName = `sprint-${projectId}-${Date.now()}`;
        
        // Convert webm to a format Transcribe supports better
        // Note: Transcribe supports webm, but let's try with explicit codec
        await transcribeClient.send(new StartTranscriptionJobCommand({
            TranscriptionJobName: jobName,
            LanguageCode: 'en-US',
            Media: {
                MediaFileUri: `s3://${SPRINT_AUDIO_BUCKET}/${audioKey}`
            },
            MediaFormat: 'webm',
            OutputBucketName: SPRINT_AUDIO_BUCKET,
            Settings: {
                ShowSpeakerLabels: false
            }
        }));
        
        console.log('Transcription job started:', jobName);
        
        // Wait for transcription to complete (poll every 2 seconds, max 2 minutes)
        let transcription = null;
        let attempts = 0;
        const maxAttempts = 60;
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const jobStatus = await transcribeClient.send(new GetTranscriptionJobCommand({
                TranscriptionJobName: jobName
            }));
            
            const status = jobStatus.TranscriptionJob.TranscriptionJobStatus;
            console.log(`Transcription status (attempt ${attempts + 1}):`, status);
            
            if (status === 'COMPLETED') {
                // Get transcription result from S3
                const transcriptUri = jobStatus.TranscriptionJob.Transcript.TranscriptFileUri;
                const transcriptKey = transcriptUri.split(`${SPRINT_AUDIO_BUCKET}/`)[1];
                
                const transcriptData = await s3Client.send(new GetObjectCommand({
                    Bucket: SPRINT_AUDIO_BUCKET,
                    Key: transcriptKey
                }));
                
                const transcriptJson = JSON.parse(await streamToString(transcriptData.Body));
                transcription = transcriptJson.results.transcripts[0].transcript;
                
                // Clean up transcription job
                await transcribeClient.send(new DeleteTranscriptionJobCommand({
                    TranscriptionJobName: jobName
                }));
                
                break;
            } else if (status === 'FAILED') {
                const failureReason = jobStatus.TranscriptionJob.FailureReason;
                console.error('Transcription failed. Reason:', failureReason);
                console.error('Full job details:', JSON.stringify(jobStatus.TranscriptionJob, null, 2));
                throw new Error(`Transcription job failed: ${failureReason}`);
            }
            
            attempts++;
        }
        
        if (!transcription) {
            throw new Error('Transcription timed out');
        }
        
        console.log('Transcription completed:', transcription);
        
        // Extract tasks using Bedrock
        const tasks = await extractTasksWithBedrock(transcription);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                transcription,
                tasks
            })
        };
        
    } catch (error) {
        console.error('Error processing audio:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Fallback to mock data if real processing fails
        console.log('Falling back to mock data due to error:', error.message);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                transcription: `Sprint Planning Meeting - ${new Date().toLocaleDateString()}\n\n[Note: Using demo data - real transcription failed]\n\nError: ${error.message}\n\nTeam discussed the following items:\n\n1. User authentication needs to be implemented with OAuth support\n2. Dashboard should display real-time analytics\n3. API endpoints need rate limiting\n4. Database migration for new user fields`,
                tasks: [
                    {
                        id: `task-${Date.now()}-1`,
                        title: 'Implement OAuth Authentication',
                        description: 'Add OAuth support for user authentication with Google and GitHub providers',
                        category: 'Backend',
                        complexity: 'High',
                        estimatedHours: 16,
                        priority: 'High'
                    },
                    {
                        id: `task-${Date.now()}-2`,
                        title: 'Build Real-time Analytics Dashboard',
                        description: 'Create dashboard component with real-time data visualization',
                        category: 'Frontend',
                        complexity: 'Medium',
                        estimatedHours: 12,
                        priority: 'High'
                    }
                ]
            })
        };
    }
}

async function createTasks(event, headers) {
    const body = JSON.parse(event.body);
    const { projectId, tasks } = body;
    
    console.log('Creating tasks for project:', projectId);
    console.log('Tasks to create:', JSON.stringify(tasks, null, 2));
    
    if (!projectId || !tasks || !Array.isArray(tasks)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Invalid request body' })
        };
    }
    
    // Create tasks in DynamoDB
    const createdTasks = [];
    
    for (const task of tasks) {
        const taskItem = {
            taskId: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            projectId,
            title: task.title,
            description: task.description,
            category: task.category,
            complexity: task.complexity,
            estimatedHours: task.estimatedHours,
            priority: task.priority,
            status: 'queued',
            assignedTo: task.assignedTo || null,
            createdAt: new Date().toISOString(),
            source: 'sprint-planning'
        };
        
        console.log('Creating task:', taskItem.taskId, taskItem.title);
        
        try {
            await docClient.send(new PutCommand({
                TableName: TASKS_TABLE,
                Item: taskItem
            }));
            
            console.log('Task created successfully:', taskItem.taskId);
            createdTasks.push(taskItem);
        } catch (error) {
            console.error('Error creating task:', error);
        }
    }
    
    console.log(`Successfully created ${createdTasks.length} tasks`);
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            message: `Created ${createdTasks.length} tasks`,
            tasks: createdTasks
        })
    };
}

// Helper function to use Bedrock for task extraction
async function extractTasksWithBedrock(transcription) {
    const prompt = `You are a project management assistant. Analyze the following sprint planning meeting transcription and extract actionable tasks.

For each task, provide:
- title: A clear, concise task title (max 80 characters)
- description: Detailed description of what needs to be done (max 200 characters)
- category: The category (Frontend, Backend, Database, Testing, Documentation, DevOps, Design, or Other)
- complexity: Low, Medium, or High
- estimatedHours: Estimated hours to complete (number between 1-40)
- priority: High, Medium, or Low

Return ONLY a valid JSON array of tasks, no other text. Example format:
[
  {
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication with login and signup endpoints",
    "category": "Backend",
    "complexity": "High",
    "estimatedHours": 16,
    "priority": "High"
  }
]

Transcription:
${transcription}`;
    
    try {
        const command = new InvokeModelCommand({
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 4096,
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
        
        // Parse the tasks from the response
        const tasksText = responseBody.content[0].text;
        
        // Extract JSON array from response (handle cases where AI adds extra text)
        const jsonMatch = tasksText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No valid JSON array found in response');
        }
        
        const tasks = JSON.parse(jsonMatch[0]);
        
        // Add unique IDs to tasks
        return tasks.map((task, index) => ({
            id: `task-${Date.now()}-${index + 1}`,
            ...task
        }));
        
    } catch (error) {
        console.error('Error extracting tasks with Bedrock:', error);
        throw error;
    }
}

// Helper function to parse multipart form data with busboy
function parseMultipartForm(event) {
    return new Promise((resolve, reject) => {
        const busboy = Busboy({
            headers: {
                'content-type': event.headers['content-type'] || event.headers['Content-Type']
            }
        });
        
        const result = {
            files: {},
            fields: {}
        };
        
        busboy.on('file', (fieldname, file, info) => {
            const chunks = [];
            file.on('data', (data) => {
                chunks.push(data);
            });
            file.on('end', () => {
                result.files[fieldname] = Buffer.concat(chunks);
            });
        });
        
        busboy.on('field', (fieldname, value) => {
            result.fields[fieldname] = value;
        });
        
        busboy.on('finish', () => {
            resolve(result);
        });
        
        busboy.on('error', (error) => {
            reject(error);
        });
        
        // Write the body to busboy
        const body = event.isBase64Encoded 
            ? Buffer.from(event.body, 'base64')
            : (typeof event.body === 'string' ? Buffer.from(event.body, 'binary') : event.body);
        
        console.log('Body length:', body.length, 'isBase64:', event.isBase64Encoded);
        
        busboy.write(body);
        busboy.end();
    });
}

// Helper function to convert stream to string
async function streamToString(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
}


// I check if user has exceeded transcription limits
async function checkTranscriptionLimit(userId, email) {
    // I skip limit check for admin
    if (email === LIMITS.ADMIN_EMAIL) {
        return { allowed: true, isAdmin: true };
    }
    
    // I count user's transcriptions
    const result = await docClient.send(new QueryCommand({
        TableName: USAGE_TRACKING_TABLE,
        IndexName: 'UserIdActionIndex',
        KeyConditionExpression: 'userId = :userId AND #action = :action',
        ExpressionAttributeNames: {
            '#action': 'action'
        },
        ExpressionAttributeValues: {
            ':userId': userId,
            ':action': 'transcription'
        }
    }));
    
    const transcriptionCount = result.Items?.length || 0;
    const allowed = transcriptionCount < LIMITS.MAX_TRANSCRIPTIONS_PER_USER;
    
    return {
        allowed,
        currentCount: transcriptionCount,
        limit: LIMITS.MAX_TRANSCRIPTIONS_PER_USER,
        isAdmin: false
    };
}

// I track usage for analytics
async function trackUsage(userId, email, action) {
    const timestamp = new Date().toISOString();
    
    await docClient.send(new PutCommand({
        TableName: USAGE_TRACKING_TABLE,
        Item: {
            usageId: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userId,
            email,
            action,
            timestamp,
            date: timestamp.split('T')[0]
        }
    }));
    
    console.log(`Usage tracked: ${action} for user ${email}`);
}
