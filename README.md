# Modern Todo App

A production-ready, serverless todo application built with AWS services (Amplify, Cognito, Lambda, DynamoDB, API Gateway).

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js 20 (Lambda Functions)
- **Database**: DynamoDB (NoSQL)
- **Authentication**: Amazon Cognito
- **Hosting**: AWS Amplify
- **API**: API Gateway + Lambda Functions

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AWS Amplify                          │
│                    (Static Hosting)                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                  API Gateway                             │
│              /todos (CRUD endpoints)                    │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────┬──────────┐
        ▼                     ▼          ▼          ▼
┌─────────────┐      ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ CreateTodo  │      │ GetTodos    │ │ UpdateTodo  │ │ DeleteTodo  │
│ Lambda      │      │ Lambda      │ │ Lambda      │ │ Lambda      │
└──────┬──────┘      └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │                    │                │                │
       └────────────────────┴────────────────┴────────────────┘
                           │
                           ▼
               ┌─────────────────────────┐
               │    DynamoDB Table       │
               │   (modern-todos)        │
               │   GSI: userId + todoId   │
               └─────────────────────────┘
```

## Project Structure

```
modern-todo-app/
├── frontend/
│   ├── index.html          # Landing & Authentication page
│   ├── dashboard.html      # Main Todo Application
│   ├── css/
│   │   └── style.css       # Glassmorphism styling
│   └── js/
│       ├── config.js       # AWS configuration
│       ├── auth.js         # Cognito authentication
│       ├── todo.js         # Todo CRUD operations
│       ├── app.js          # Login/Signup logic
│       └── dashboard.js    # Dashboard interactions
├── backend/
│   └── lambda/
│       ├── createTodo.js   # Create todo Lambda
│       ├── getTodos.js     # Get todos Lambda
│       ├── updateTodo.js   # Update todo Lambda
│       ├── deleteTodo.js   # Delete todo Lambda
│       └── package.json    # Lambda dependencies
├── .github/
│   └── workflows/
└── README.md
```

## Features

### Frontend
- Glassmorphism design with dark theme
- Neon accent colors (cyan, purple, green)
- Responsive mobile-first design
- Cognito authentication (Signup, Login, Email verification)
- Todo CRUD operations
- Priority-based filtering (Urgent, High, Medium, Low)
- Category management (Personal, Work, Shopping, Health, Finance)
- Progress tracking and statistics
- Search and filter functionality

### Backend
- Serverless Lambda functions
- DynamoDB with PAY_PER_REQUEST billing
- User-based data isolation
- CORS enabled
- Input validation
- Error handling

## Setup Instructions

### 1. Prerequisites
- AWS CLI configured with credentials
- Node.js 20+ installed
- AWS Amplify CLI installed

### 2. Create DynamoDB Table
```bash
aws dynamodb create-table \
  --table-name modern-todos \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=todoId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=todoId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-2
```

### 3. Create IAM Role for Lambda
```bash
aws iam create-role \
  --role-name TodoAppLambdaRole2024 \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

aws iam attach-role-policy \
  --role-name TodoAppLambdaRole2024 \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam put-role-policy \
  --role-name TodoAppLambdaRole2024 \
  --policy-name TodoAppDynamoDBPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan"
        ],
        "Resource": "arn:aws:dynamodb:us-west-2:*:table/modern-todos"
      }
    ]
  }'
```

### 4. Deploy Lambda Functions
```bash
cd backend/lambda
npm install
zip -r createTodo.zip createTodo.js node_modules
zip -r getTodos.zip getTodos.js node_modules
zip -r updateTodo.zip updateTodo.js node_modules
zip -r deleteTodo.zip deleteTodo.js node_modules
```

### 5. Create Lambda Functions
```bash
ROLE_ARN=$(aws iam get-role --role-name TodoAppLambdaRole2024 --query 'Role.Arn' --output text)

aws lambda create-function \
  --function-name CreateTodo \
  --runtime nodejs20.x \
  --role $ROLE_ARN \
  --handler createTodo.handler \
  --zip-file fileb://backend/lambda/createTodo.zip \
  --environment Variables={TABLE_NAME=modern-todos} \
  --region us-west-2 \
  --timeout 30

# Repeat for GetTodos, UpdateTodo, DeleteTodo
```

### 6. Configure API Gateway
Follow the AWS CLI commands in prompt.md to create REST API and integrate with Lambda.

### 7. Configure Cognito
1. Create a User Pool
2. Create an App Client
3. Configure email verification
4. Update `frontend/js/config.js` with your values

### 8. Deploy to Amplify
```bash
amplify init
amplify add hosting
amplify publish
```

## Configuration

Update `frontend/js/config.js` with your AWS resources:

```javascript
const awsConfig = {
    region: 'us-west-2',
    cognito: {
        userPoolId: 'us-west-2_YOUR_POOL_ID',
        clientId: 'YOUR_CLIENT_ID',
        domain: 'YOUR_COGNITO_DOMAIN'
    },
    apiGateway: {
        invokeUrl: 'https://YOUR_API_ID.execute-api.us-west-2.amazonaws.com/dev'
    },
    dynamodb: {
        tableName: 'modern-todos'
    }
};
```

## Priority Colors

- **Urgent**: Red (#FF4757)
- **High**: Orange (#FFA502)
- **Medium**: Yellow (#FFDD59)
- **Low**: Green (#39FF14)

## Free Tier Compatible

This application is designed to be Free Tier compatible:
- DynamoDB PAY_PER_REQUEST billing
- Lambda 1M free requests/month
- API Gateway 1M free API calls/month
- Cognito 50K free MAU/month

## License

MIT License