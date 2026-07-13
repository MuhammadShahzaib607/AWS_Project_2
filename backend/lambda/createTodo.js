const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || 'modern-todos';

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        const body = JSON.parse(event.body || '{}');
        const { title, description, priority, dueDate, tags } = body;
        const userId = event.requestContext?.authorizer?.claims?.sub;

        if (!userId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        if (!title || title.trim().length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Title is required' })
            };
        }

        if (title.length > 255) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Title too long (max 255 characters)' })
            };
        }

        if (!VALID_PRIORITIES.includes(priority)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` })
            };
        }

        const todoId = uuidv4();
        const createdAt = Date.now();

        const item = {
            userId,
            todoId,
            title: title.trim(),
            description: (description || '').trim(),
            priority,
            dueDate: dueDate || null,
            completed: false,
            tags: Array.isArray(tags) ? tags : [],
            createdAt,
            updatedAt: createdAt
        };

        const params = {
            TableName: TABLE_NAME,
            Item: item
        };

        await dynamodb.put(params).promise();

        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(item)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
        };
    }
};