// I track user logins and enforce usage limits
// I help monitor system usage and prevent abuse

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// I define usage limits
const LIMITS = {
    MAX_PROJECTS_PER_USER: 1,
    ADMIN_EMAIL: 'adriandsouza2504@gmail.com' // I allow unlimited access for admin
};

exports.handler = async (event) => {
    try {
        const { triggerSource, request, response } = event;
        const userEmail = request.userAttributes.email;
        const userId = request.userAttributes.sub;
        
        // I handle post-authentication tracking
        if (triggerSource === 'PostAuthentication_Authentication') {
            await trackLogin(userId, userEmail);
        }
        
        return event;
        
    } catch (error) {
        console.error('Error in auth tracker:', error);
        return event;
    }
};

// I record login activity
async function trackLogin(userId, email) {
    const timestamp = new Date().toISOString();
    
    await dynamodb.put({
        TableName: process.env.LOGIN_TRACKING_TABLE,
        Item: {
            loginId: `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            email,
            timestamp,
            date: timestamp.split('T')[0], // I store date for easy querying
            ipAddress: 'N/A', // I would need API Gateway integration for real IP
            userAgent: 'N/A'
        }
    }).promise();
    
    console.log(`Login tracked for user: ${email} at ${timestamp}`);
}

// I check if user has exceeded project limits
async function checkProjectLimit(userId, email) {
    // I skip limit check for admin
    if (email === LIMITS.ADMIN_EMAIL) {
        return { allowed: true, isAdmin: true };
    }
    
    // I count user's projects
    const result = await dynamodb.query({
        TableName: process.env.PROJECTS_TABLE,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        },
        Select: 'COUNT'
    }).promise();
    
    const projectCount = result.Count;
    const allowed = projectCount < LIMITS.MAX_PROJECTS_PER_USER;
    
    return {
        allowed,
        currentCount: projectCount,
        limit: LIMITS.MAX_PROJECTS_PER_USER,
        isAdmin: false
    };
}

// I export the check function for use by other Lambdas
module.exports.checkProjectLimit = checkProjectLimit;
module.exports.LIMITS = LIMITS;
