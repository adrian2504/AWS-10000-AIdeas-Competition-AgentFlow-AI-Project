# AgentFlow Deployment Guide

## Cost Estimate: $8-18/month (30 days)

### Breakdown:
- **AWS Amplify Hosting**: $2-5/month
- **Lambda Functions**: $1-3/month
- **DynamoDB**: $1-2/month
- **API Gateway**: $0.50-1/month
- **S3 Storage**: $0.50-1/month
- **Transcribe**: $0.30/month (6 transcriptions limit)
- **Bedrock (Claude)**: $2-5/month
- **Cognito**: FREE (under 50K users)

---

## Option 1: AWS Amplify (RECOMMENDED)

### Step 1: Deploy Backend (Already Done)
```bash
cd backend/infrastructure
cdk deploy
```

### Step 2: Deploy Frontend to Amplify

#### Via AWS Console:
1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Connect your GitHub repository
4. Select branch: `main`
5. Build settings: Auto-detected (uses amplify.yml)
6. Add environment variables:
   ```
   REACT_APP_API_URL=<your-api-gateway-url>
   REACT_APP_USER_POOL_ID=<your-cognito-pool-id>
   REACT_APP_USER_POOL_CLIENT_ID=<your-cognito-client-id>
   REACT_APP_AWS_REGION=us-east-1
   ```
7. Click "Save and deploy"

#### Via AWS CLI:
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
cd frontend
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

### Step 3: Get Your Live URL
After deployment completes, you'll get a URL like:
`https://main.d1234567890.amplifyapp.com`

### Step 4: (Optional) Add Custom Domain
1. In Amplify Console → Domain management
2. Add your domain (e.g., agentflow.com)
3. Follow DNS configuration steps
4. SSL certificate auto-provisioned

---

## Option 2: Vercel (FREE TIER AVAILABLE)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy
```bash
cd frontend
vercel
```

### Step 3: Add Environment Variables
```bash
vercel env add REACT_APP_API_URL
vercel env add REACT_APP_USER_POOL_ID
vercel env add REACT_APP_USER_POOL_CLIENT_ID
vercel env add REACT_APP_AWS_REGION
```

### Step 4: Deploy to Production
```bash
vercel --prod
```

**Cost: FREE** (100GB bandwidth/month)

---

## Option 3: Netlify (FREE TIER AVAILABLE)

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Build Frontend
```bash
cd frontend
npm run build
```

### Step 3: Deploy
```bash
netlify deploy --prod --dir=build
```

### Step 4: Add Environment Variables
In Netlify Dashboard → Site settings → Environment variables

**Cost: FREE** (100GB bandwidth/month)

---

## Option 4: AWS S3 + CloudFront (CHEAPEST)

### Step 1: Build Frontend
```bash
cd frontend
npm run build
```

### Step 2: Create S3 Bucket
```bash
aws s3 mb s3://agentflow-frontend
aws s3 website s3://agentflow-frontend --index-document index.html
```

### Step 3: Upload Files
```bash
aws s3 sync build/ s3://agentflow-frontend --acl public-read
```

### Step 4: Create CloudFront Distribution
```bash
aws cloudfront create-distribution \
  --origin-domain-name agentflow-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

**Cost: ~$7.50-15.50/month**

---

## Cost Optimization Tips

### 1. Use AWS Free Tier (First 12 Months)
- Lambda: 1M requests/month FREE
- DynamoDB: 25GB storage FREE
- S3: 5GB storage FREE
- CloudFront: 50GB transfer FREE

### 2. Set Budget Alerts
```bash
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget file://budget.json
```

### 3. Enable Cost Explorer
Monitor daily costs in AWS Console

### 4. Use Reserved Capacity (if scaling)
Can save 30-50% on Lambda/DynamoDB

---

## Monitoring Costs

### AWS Cost Explorer
1. Go to AWS Console → Billing
2. Enable Cost Explorer
3. Set up daily cost alerts

### Set Budget Alert
```json
{
  "BudgetName": "AgentFlow-Monthly",
  "BudgetLimit": {
    "Amount": "20",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

---

## Quick Deploy Script

I've created a deployment script for you:

```bash
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

This will:
1. Build the frontend
2. Deploy to AWS Amplify
3. Output your live URL

---

## Expected Traffic Costs (30 days)

### Light Usage (10 users/day):
- **Total: $8-12/month**

### Medium Usage (50 users/day):
- **Total: $15-25/month**

### Heavy Usage (200 users/day):
- **Total: $30-50/month**

---

## Free Tier Eligibility

If your AWS account is less than 12 months old:
- **Estimated cost: $2-8/month** (mostly Bedrock/Transcribe)

---

## Support

For deployment issues:
- AWS Support: https://console.aws.amazon.com/support
- Amplify Docs: https://docs.amplify.aws
- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
