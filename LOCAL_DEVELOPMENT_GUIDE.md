# AgentFlow Local Development Guide

This guide will help you run AgentFlow locally for development and testing.

## 📋 Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
   ```bash
   node --version
   npm --version
   ```

2. **AWS CLI** (configured with your credentials)
   ```bash
   aws --version
   aws configure list
   ```

3. **AWS CDK** (for infrastructure)
   ```bash
   npm install -g aws-cdk
   cdk --version
   ```

### AWS Setup
- AWS account with appropriate permissions
- AWS credentials configured (`aws configure`)
- Region set to `us-east-1` (recommended)

## 🚀 Quick Start (5 Minutes)

### Step 1: Deploy Backend Infrastructure
```bash
# Navigate to infrastructure
cd backend/infrastructure

# Install dependencies
npm install

# Deploy the stack (takes 5-10 minutes)
cdk deploy --require-approval never

# Note the API Gateway URL from the output
```

### Step 2: Configure Frontend
```bash
# Navigate to frontend
cd ../../frontend

# Copy environment template
cp .env.example .env

# Edit .env with your AWS outputs
nano .env
```

Update `.env` with values from CDK deployment:
```env
REACT_APP_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
REACT_APP_USER_POOL_ID=us-east-1_xxxxxxxxx
REACT_APP_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_REGION=us-east-1
```

### Step 3: Start Frontend Development Server
```bash
# Install dependencies
npm install

# Start development server
npm start
```

Your app will open at `http://localhost:3000`

## 🔧 Detailed Setup

### Backend Infrastructure Deployment

1. **Navigate to infrastructure directory**
   ```bash
   cd backend/infrastructure
   ```

2. **Install CDK dependencies**
   ```bash
   npm install
   ```

3. **Bootstrap CDK (first time only)**
   ```bash
   cdk bootstrap
   ```

4. **Deploy the main stack**
   ```bash
   cdk deploy AgentFlowStack --require-approval never
   ```

5. **Deploy frontend hosting (optional for local dev)**
   ```bash
   cdk deploy AgentFlowFrontendStack --app "node bin/frontend-app.js" --require-approval never
   ```

### Frontend Development Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create `.env` file:
   ```env
   # API Configuration
   REACT_APP_API_URL=https://your-api-gateway-url/prod
   
   # Cognito Configuration
   REACT_APP_USER_POOL_ID=us-east-1_xxxxxxxxx
   REACT_APP_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
   REACT_APP_REGION=us-east-1
   
   # Development Settings
   REACT_APP_ENV=development
   ```

4. **Start development server**
   ```bash
   npm start
   ```

## 🔍 Getting AWS Configuration Values

After deploying the CDK stack, get the required values:

### API Gateway URL
```bash
aws cloudformation describe-stacks \
  --stack-name AgentFlowStack \
  --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
  --output text
```

### Cognito User Pool ID
```bash
aws cloudformation describe-stacks \
  --stack-name AgentFlowStack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text
```

### Cognito Client ID
```bash
aws cloudformation describe-stacks \
  --stack-name AgentFlowStack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text
```

## 🧪 Testing Features Locally

### 1. User Registration & Login
- Go to `http://localhost:3000`
- Click "Sign Up" to create an account
- Verify email (check your inbox)
- Login with credentials

### 2. Project Creation
- Click "New Project"
- Upload a text file or paste project description
- Watch AI generate tasks automatically

### 3. Voice Sprint Planning
- Create a project first
- Go to project dashboard
- Click "Sprint Planning"
- Record audio (allow microphone access)
- See transcription and extracted tasks

### 4. Real-time Collaboration
- Open project in multiple browser tabs
- See live user presence indicators
- Add comments and see real-time updates

### 5. AI Project Health
- In project dashboard, click health analysis
- Run analysis to see AI insights
- View recommendations and risk assessment

## 🛠️ Development Workflow

### Making Backend Changes

1. **Update Lambda function code**
   ```bash
   cd backend/lambda/your-function
   # Make your changes
   ```

2. **Redeploy infrastructure**
   ```bash
   cd backend/infrastructure
   cdk deploy --require-approval never
   ```

### Making Frontend Changes

1. **Edit React components**
   ```bash
   cd frontend/src
   # Make your changes
   ```

2. **Changes auto-reload** (development server handles this)

### Testing API Endpoints

Use curl or Postman to test API endpoints:

```bash
# Get auth token first (from browser dev tools)
TOKEN="your-jwt-token"

# Test project creation
curl -X POST https://your-api-url/prod/briefs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectName":"Test","briefContent":"Build a web app"}'
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Access Denied" errors
**Solution**: Check AWS credentials and permissions
```bash
aws sts get-caller-identity
aws iam get-user
```

#### 2. "Module not found" errors
**Solution**: Install dependencies
```bash
cd frontend && npm install
cd backend/infrastructure && npm install
```

#### 3. CORS errors in browser
**Solution**: Ensure API Gateway has CORS enabled (should be automatic)

#### 4. Cognito authentication issues
**Solution**: Verify User Pool configuration
```bash
aws cognito-idp describe-user-pool --user-pool-id your-pool-id
```

#### 5. Lambda function errors
**Solution**: Check CloudWatch logs
```bash
aws logs tail /aws/lambda/AgentFlow-BriefProcessor --follow
```

### Environment Issues

#### Wrong AWS Region
```bash
# Check current region
aws configure get region

# Set correct region
aws configure set region us-east-1
```

#### Missing Environment Variables
```bash
# Check if .env exists and has correct values
cat frontend/.env

# Restart development server after changes
npm start
```

## 📊 Monitoring Local Development

### CloudWatch Logs
```bash
# Monitor Lambda logs in real-time
aws logs tail /aws/lambda/AgentFlow-BriefProcessor --follow
aws logs tail /aws/lambda/AgentFlow-TaskGenerator --follow
aws logs tail /aws/lambda/AgentFlow-SprintPlanner --follow
```

### DynamoDB Tables
```bash
# Check if tables exist
aws dynamodb list-tables

# View table contents
aws dynamodb scan --table-name AgentFlow-Projects --limit 5
aws dynamodb scan --table-name AgentFlow-Tasks --limit 5
```

### API Gateway
```bash
# Test API endpoints
aws apigateway get-rest-apis
```

## 🔄 Development Scripts

Create these helpful scripts in your project root:

### `dev-start.sh`
```bash
#!/bin/bash
echo "Starting AgentFlow development environment..."

# Start frontend
cd frontend
npm start &

# Monitor logs
aws logs tail /aws/lambda/AgentFlow-BriefProcessor --follow &

echo "Development environment started!"
echo "Frontend: http://localhost:3000"
```

### `dev-deploy.sh`
```bash
#!/bin/bash
echo "Deploying development changes..."

cd backend/infrastructure
cdk deploy --require-approval never

echo "Backend deployed! Frontend will auto-reload."
```

### `dev-logs.sh`
```bash
#!/bin/bash
echo "Monitoring AgentFlow logs..."

aws logs tail /aws/lambda/AgentFlow-BriefProcessor --follow &
aws logs tail /aws/lambda/AgentFlow-TaskGenerator --follow &
aws logs tail /aws/lambda/AgentFlow-SprintPlanner --follow &

wait
```

## 🎯 Development Tips

### 1. Hot Reloading
- Frontend changes reload automatically
- Backend changes require CDK redeploy
- Use `cdk deploy --hotswap` for faster Lambda updates

### 2. Debugging
- Use browser dev tools for frontend debugging
- Check CloudWatch logs for backend issues
- Use `console.log()` liberally in Lambda functions

### 3. Testing
- Test with multiple browser tabs for collaboration features
- Use different browsers to simulate multiple users
- Test voice features with actual audio recordings

### 4. Performance
- Lambda cold starts may be slow initially
- DynamoDB queries are fast once warmed up
- Frontend builds are optimized for development

## 🚀 Ready for Production

When ready to deploy to production:

1. **Deploy frontend to S3/CloudFront**
   ```bash
   ./deploy-frontend.sh
   ```

2. **Update environment to production**
   ```bash
   # Update .env for production API URLs
   ```

3. **Monitor production logs**
   ```bash
   aws logs tail /aws/lambda/AgentFlow-BriefProcessor --follow
   ```

## 📞 Need Help?

- Check CloudWatch logs for detailed error messages
- Verify AWS credentials and permissions
- Ensure all environment variables are set correctly
- Test API endpoints individually before testing full flow

---

**Happy coding! 🎉**

Your local AgentFlow development environment is now ready for building amazing AI-powered project management features!