const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || 'modern-todos';

const ALLOWED_FIELDS = ['title', 'description', 'priority', 'dueDate', 'completed', 'tags'];

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        const userId = event.requestContext?.authorizer?.claims?.sub;
        const todoId = event.pathParameters?.todoId;
        const updates = JSON.parse(event.body || '{}');

        if (!userId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        if (!todoId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Todo ID is required' })
            };
        }

        let updateExpression = 'SET updatedAt = :updatedAt';
        const expressionAttributeValues = { ':updatedAt': Date.now() };
        let fieldCount = 0;

        Object.keys(updates).forEach((key) => {
            if (ALLOWED_FIELDS.includes(key)) {
                updateExpression += `, ${key} = :val${fieldCount}`;
                expressionAttributeValues[`:val${fieldCount}`] = updates[key];
                fieldCount++;
            }
        });

        if (fieldCount === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No valid fields to update' })
            };
        }

        const params = {
            TableName: TABLE_NAME,
            Key: { userId, todoId },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };

        const result = await dynamodb.update(params).promise();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(result.Attributes)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
        };
    }
};