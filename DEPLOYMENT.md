# AgentFlow Deployment Guide

This guide walks through deploying AgentFlow to AWS using the Free Tier.

## Prerequisites

1. AWS Account with Free Tier access
2. AWS CLI installed and configured
3. Node.js 18+ installed
4. AWS CDK installed: `npm install -g aws-cdk`

## Step 1: Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
```

## Step 2: Enable AWS Bedrock Access

1. Go to AWS Console → Bedrock
2. Navigate to "Model access"
3. Request access to "Claude 3 Sonnet"
4. Wait for approval (usually instant)

## Step 3: Install Backend Dependencies

```bash
# Install CDK dependencies
cd backend/infrastructure
npm install

# Install Lambda dependencies
cd ../lambda/brief-processor
npm install

cd ../task-generator
npm install

cd ../task-router
npm install

cd ../ai-executor
npm install

cd ../task-manager
npm install
```

## Step 4: Bootstrap CDK (First Time Only)

```bash
cd backend/infrastructure
cdk bootstrap
```

## Step 5: Deploy Backend Infrastructure

```bash
cd backend/infrastructure
npm run deploy
```

This will create:
- DynamoDB tables (Projects and Tasks)
- S3 buckets (Briefs and Outputs)
- Lambda functions (5 functions)
- API Gateway
- EventBridge event bus
- Cognito User Pool

Save the output values:
- APIEndpoint
- UserPoolId
- UserPoolClientId

## Step 6: Configure Frontend

Create `frontend/.env`:

```bash
REACT_APP_API_URL=<APIEndpoint from CDK output>
REACT_APP_USER_POOL_ID=<UserPoolId from CDK output>
REACT_APP_USER_POOL_CLIENT_ID=<UserPoolClientId from CDK output>
REACT_APP_AWS_REGION=us-east-1
```

## Step 7: Install and Build Frontend

```bash
cd frontend
npm install
npm run build
```

## Step 8: Deploy Frontend to S3 + CloudFront (Optional)

For production deployment:

```bash
# Create S3 bucket for hosting
aws s3 mb s3://agentflow-frontend-<your-unique-id>

# Enable static website hosting
aws s3 website s3://agentflow-frontend-<your-unique-id> \
  --index-document index.html \
  --error-document index.html

# Upload build files
aws s3 sync build/ s3://agentflow-frontend-<your-unique-id>

# Make bucket public (for demo purposes)
aws s3api put-bucket-policy \
  --bucket agentflow-frontend-<your-unique-id> \
  --policy file://bucket-policy.json
```

## Step 9: Test the Application

1. Open the frontend URL
2. Sign up for a new account
3. Verify your email
4. Log in
5. Create a test project with a brief
6. Watch tasks generate and route automatically

## AWS Free Tier Usage

AgentFlow is designed to stay within AWS Free Tier limits:

- **Lambda**: 1M requests/month free
- **DynamoDB**: 25GB storage + 25 RCU/WCU free
- **S3**: 5GB storage + 20,000 GET requests free
- **API Gateway**: 1M requests/month free
- **Bedrock**: Pay per use (use Claude 3 Haiku for lower costs)
- **EventBridge**: 14M events/month free
- **Cognito**: 50,000 MAUs free

## Monitoring Costs

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=2025-02-01,End=2025-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

## Cleanup

To avoid charges after the competition:

```bash
cd backend/infrastructure
npm run destroy
```

This removes all resources except:
- S3 buckets (must be emptied first)
- DynamoDB tables (set to RETAIN for data safety)

## Troubleshooting

### Lambda timeout errors
- Increase timeout in `agentflow-stack.js`
- Check CloudWatch Logs for details

### Bedrock access denied
- Verify model access is enabled in Bedrock console
- Check IAM permissions for Lambda execution role

### CORS errors
- Verify API Gateway CORS settings
- Check frontend API_URL configuration

### Tasks not generating
- Check EventBridge rules are active
- Verify Lambda functions have EventBridge permissions
- Check CloudWatch Logs for errors
