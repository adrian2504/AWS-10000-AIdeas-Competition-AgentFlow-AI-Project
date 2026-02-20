// I manage team members and their skills for intelligent task assignment
// I help match the right person to the right task based on their expertise

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const { httpMethod, path, body } = event;
        const userId = event.requestContext.authorizer.claims.sub;
        
        // I route to the appropriate handler
        if (httpMethod === 'GET' && path === '/team') {
            return await getTeamMembers(userId);
        }
        
        if (httpMethod === 'POST' && path === '/team') {
            return await addTeamMember(userId, JSON.parse(body));
        }
        
        if (httpMethod === 'PUT' && path.includes('/team/')) {
            const memberId = path.split('/').pop();
            return await updateTeamMember(userId, memberId, JSON.parse(body));
        }
        
        if (httpMethod === 'DELETE' && path.includes('/team/')) {
            const memberId = path.split('/').pop();
            return await deleteTeamMember(userId, memberId);
        }
        
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Not found' })
        };
        
    } catch (error) {
        console.error('Error in team manager:', error);
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

// I fetch all team members for a user
async function getTeamMembers(userId) {
    const result = await dynamodb.query({
        TableName: process.env.TEAM_TABLE,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        }
    }).promise();
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            members: result.Items
        })
    };
}

// I add a new team member
async function addTeamMember(userId, data) {
    const { name, email, role, skills, availability } = data;
    
    const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const member = {
        memberId,
        userId,
        name,
        email,
        role,
        skills: skills || [],
        availability: availability || 'AVAILABLE',
        tasksAssigned: 0,
        tasksCompleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    await dynamodb.put({
        TableName: process.env.TEAM_TABLE,
        Item: member
    }).promise();
    
    return {
        statusCode: 201,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Team member added successfully',
            member
        })
    };
}

// I update a team member's information
async function updateTeamMember(userId, memberId, data) {
    const { name, email, role, skills, availability } = data;
    
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {
        ':updatedAt': new Date().toISOString()
    };
    
    if (name) {
        updateExpression.push('#name = :name');
        expressionAttributeNames['#name'] = 'name';
        expressionAttributeValues[':name'] = name;
    }
    
    if (email) {
        updateExpression.push('email = :email');
        expressionAttributeValues[':email'] = email;
    }
    
    if (role) {
        updateExpression.push('#role = :role');
        expressionAttributeNames['#role'] = 'role';
        expressionAttributeValues[':role'] = role;
    }
    
    if (skills) {
        updateExpression.push('skills = :skills');
        expressionAttributeValues[':skills'] = skills;
    }
    
    if (availability) {
        updateExpression.push('availability = :availability');
        expressionAttributeValues[':availability'] = availability;
    }
    
    updateExpression.push('updatedAt = :updatedAt');
    
    await dynamodb.update({
        TableName: process.env.TEAM_TABLE,
        Key: { memberId },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ...expressionAttributeValues,
            ':userId': userId
        }
    }).promise();
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Team member updated successfully'
        })
    };
}

// I remove a team member
async function deleteTeamMember(userId, memberId) {
    await dynamodb.delete({
        TableName: process.env.TEAM_TABLE,
        Key: { memberId },
        ConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        }
    }).promise();
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Team member deleted successfully'
        })
    };
}
