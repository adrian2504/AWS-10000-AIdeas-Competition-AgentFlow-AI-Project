#!/bin/bash

# I fix the 403 error by redeploying with the correct configuration

set -e

echo "🔧 Fixing Frontend Deployment (403 Error)"
echo "=========================================="
echo ""

# I check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-east-1}

echo "📋 Account: $ACCOUNT_ID"
echo "📋 Region: $REGION"
echo ""

# Step 1: Delete the old stack
echo "🗑️  Step 1: Removing old CloudFront stack..."
if aws cloudformation describe-stacks --stack-name AgentFlowFrontendStack --region $REGION &> /dev/null; then
    echo "Deleting existing stack (this may take 5-10 minutes)..."
    aws cloudformation delete-stack --stack-name AgentFlowFrontendStack --region $REGION
    aws cloudformation wait stack-delete-complete --stack-name AgentFlowFrontendStack --region $REGION
    echo "✅ Old stack deleted"
else
    echo "✅ No existing stack found"
fi

# Step 2: Deploy new stack with fixed configuration
echo ""
echo "☁️  Step 2: Deploying new CloudFront stack..."
cd backend/infrastructure
npm install
npx cdk deploy AgentFlowFrontendStack --app "node bin/frontend-app.js" --require-approval never
cd ../..

echo "✅ New stack deployed!"

# Step 3: Build and upload
echo ""
echo "🔨 Step 3: Building React app..."
cd frontend
npm install
npm run build
cd ..

BUCKET_NAME="agentflow-frontend-$ACCOUNT_ID"

echo ""
echo "📤 Step 4: Uploading to S3..."
aws s3 sync frontend/build/ s3://$BUCKET_NAME/ --delete

# Step 5: Get the URL
WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name AgentFlowFrontendStack \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
    --output text)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name AgentFlowFrontendStack \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
    --output text)

echo ""
echo "🔄 Step 5: Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" > /dev/null

echo ""
echo "=========================================="
echo "✅ Deployment Fixed!"
echo "=========================================="
echo ""
echo "🌐 Your website is now live at:"
echo "   $WEBSITE_URL"
echo ""
echo "⏱️  Note: CloudFront may take 1-2 minutes to fully propagate"
echo ""
