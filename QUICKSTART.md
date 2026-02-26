# AgentFlow Quick Start Guide

Get AgentFlow running in 30 minutes.

## Prerequisites

- AWS Account
- Node.js 18+
- AWS CLI configured
- 30 minutes

## Step 1: Clone and Setup (5 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/agentflow.git
cd agentflow

# Run setup script
chmod +x setup.sh
./setup.sh
```

This installs all dependencies for backend and frontend.

## Step 2: Configure AWS (5 minutes)

```bash
# Configure AWS credentials
aws configure
# Enter your Access Key ID
# Enter your Secret Access Key
# Enter region: us-east-1
# Enter output format: json

# Enable Bedrock access
# 1. Go to AWS Console → Bedrock
# 2. Click "Model access"
# 3. Enable "Claude 3 Sonnet"
# 4. Wait for approval (usually instant)
```

## Step 3: Deploy Backend (10 minutes)

```bash
# Bootstrap CDK (first time only)
cd backend/infrastructure
cdk bootstrap

# Deploy all infrastructure
npm run deploy

# Save the outputs:
# - APIEndpoint
# - UserPoolId
# - UserPoolClientId
```

This creates:
- 5 Lambda functions
- 2 DynamoDB tables
- 2 S3 buckets
- API Gateway
- EventBridge bus
- Cognito User Pool

## Step 4: Configure Frontend (2 minutes)

Create `frontend/.env`:

```bash
REACT_APP_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
REACT_APP_USER_POOL_ID=us-east-1_xxxxxxxxx
REACT_APP_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_AWS_REGION=us-east-1
```

Replace with your actual values from Step 3.

## Step 5: Run Frontend (3 minutes)

```bash
cd frontend
npm start
```

Opens at http://localhost:3000

## Step 6: Test It Out (5 minutes)

### Create Account
1. Click "Sign Up"
2. Enter email and password
3. Check email for verification code
4. Enter code and sign in

### Create First Project
1. Click "New Project"
2. Enter project name: "Test Website"
3. Paste this brief:

```
Build a simple blog website with:
- Homepage with post list
- Individual post pages
- Admin panel for creating posts
- User authentication
- Responsive design
- Deploy on AWS

Timeline: 4 weeks
Budget: $200/month
```

4. Click "Create Project"
5. Watch tasks generate automatically!

### Watch the Magic
- Tasks appear in ~30 seconds
- AI tasks execute automatically
- Human tasks wait for you
- Click tasks to see details
- Review and approve AI outputs

## What You Should See

### Dashboard
- Your project appears
- Status shows "TASKS_GENERATED"
- Click to open project

### Kanban Board
- 5 columns: Queued, In Progress, Review, Done, Failed
- 8-15 tasks distributed across columns
- Mix of AI (🤖) and Human (👤) tasks
- Real-time updates every 5 seconds

### Task Details
- Clear title and description
- Acceptance criteria
- Complexity level
- Assignment type and reason
- For AI tasks: automatic execution and output
- For Human tasks: form to submit work

## Common Issues

### "Bedrock access denied"
- Go to AWS Console → Bedrock → Model access
- Enable Claude 3 Sonnet
- Wait for approval

### "Tasks not generating"
- Check CloudWatch Logs for brief-processor Lambda
- Verify EventBridge rules are enabled
- Check IAM permissions

### "Frontend won't start"
- Verify .env file exists and has correct values
- Run `npm install` again
- Check Node.js version (need 18+)

### "API errors"
- Verify API Gateway endpoint in .env
- Check Cognito configuration
- Look at browser console for details

## Next Steps

### Explore Features
- Create multiple projects
- Complete human tasks
- Review AI outputs
- Approve or reject tasks
- Watch the Kanban board update

### Customize
- Modify routing logic in `task-router/index.js`
- Adjust AI prompts in `task-generator/index.js`
- Change UI styling in CSS files
- Add new Lambda functions

### Monitor
- Check CloudWatch Logs
- Monitor DynamoDB tables
- View S3 buckets
- Track costs in Cost Explorer

## Architecture at a Glance

```
User → Frontend → API Gateway → Lambda → DynamoDB/S3
                                    ↓
                              EventBridge
                                    ↓
                              More Lambdas
                                    ↓
                              Bedrock (AI)
```

## Cost Estimate

With AWS Free Tier:
- Lambda: FREE (under 1M requests)
- DynamoDB: FREE (under 25GB)
- S3: FREE (under 5GB)
- API Gateway: FREE (under 1M requests)
- Bedrock: ~$5-10/month (pay per use)

**Total: $5-10/month**

## Cleanup

When done testing:

```bash
cd backend/infrastructure
npm run destroy
```

This removes all resources except S3 buckets (must empty first).

## Get Help

- Read DEPLOYMENT.md for detailed setup
- Read TESTING.md for comprehensive testing
- Read PROJECT_OVERVIEW.md for architecture
- Check CloudWatch Logs for errors
- Open GitHub issue for bugs

## What's Next?

Now that you have AgentFlow running:

1. Try different project briefs
2. Experiment with task routing
3. Customize the UI
4. Add new features
5. Deploy to production
6. Share your experience!

---

Built for AWS AIdeas Competition 2025

Happy building! 🚀
