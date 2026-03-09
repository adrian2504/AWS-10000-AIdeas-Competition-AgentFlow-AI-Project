#!/bin/bash

# I deploy the React frontend to S3 + CloudFront
# This creates a production-ready, globally distributed website

set -e

echo "🚀 Deploying AgentFlow Frontend to AWS S3 + CloudFront"
echo "=================================================="
echo ""

# I check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-east-1}

echo "📋 Deployment Info:"
echo "  AWS Account: $ACCOUNT_ID"
echo "  Region: $REGION"
echo ""

# Step 1: Deploy CloudFront infrastructure (first time only)
echo "☁️  Step 1: Deploying CloudFront infrastructure..."
cd backend/infrastructure

# I check if the stack already exists
if aws cloudformation describe-stacks --stack-name AgentFlowFrontendStack --region $REGION &> /dev/null; then
    echo "✅ Frontend stack already exists, skipping infrastructure deployment"
else
    echo "📦 Installing CDK dependencies..."
    npm install
    
    echo "🏗️  Deploying frontend stack..."
    npx cdk deploy AgentFlowFrontendStack --app "node bin/frontend-app.js" --require-approval never
    
    echo "✅ Infrastructure deployed!"
fi

cd ../..

# Step 2: Build the React app
echo ""
echo "🔨 Step 2: Building React application..."
cd frontend

echo "📦 Installing frontend dependencies..."
npm install

echo "🏗️  Building production bundle..."
npm run build

if [ ! -d "build" ]; then
    echo "❌ Build failed - build directory not found"
    exit 1
fi

echo "✅ Build completed!"
cd ..

# Step 3: Get bucket name and distribution ID
echo ""
echo "📊 Step 3: Getting deployment targets..."

BUCKET_NAME="agentflow-frontend-$ACCOUNT_ID"
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name AgentFlowFrontendStack \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
    --output text)

WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name AgentFlowFrontendStack \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
    --output text)

echo "  Bucket: $BUCKET_NAME"
echo "  Distribution: $DISTRIBUTION_ID"
echo ""

# Step 4: Upload to S3
echo "📤 Step 4: Uploading files to S3..."
aws s3 sync frontend/build/ s3://$BUCKET_NAME/ \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html" \
    --exclude "*.json"

# I upload index.html and manifest.json with no-cache to ensure updates are immediate
aws s3 cp frontend/build/index.html s3://$BUCKET_NAME/index.html \
    --cache-control "public, max-age=0, must-revalidate" \
    --content-type "text/html"

if [ -f "frontend/build/manifest.json" ]; then
    aws s3 cp frontend/build/manifest.json s3://$BUCKET_NAME/manifest.json \
        --cache-control "public, max-age=0, must-revalidate" \
        --content-type "application/json"
fi

echo "✅ Files uploaded to S3!"

# Step 5: Invalidate CloudFront cache
echo ""
echo "🔄 Step 5: Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "  Invalidation ID: $INVALIDATION_ID"
echo "  Waiting for invalidation to complete (this may take 1-2 minutes)..."

aws cloudfront wait invalidation-completed \
    --distribution-id $DISTRIBUTION_ID \
    --id $INVALIDATION_ID

echo "✅ Cache invalidated!"

# Success!
echo ""
echo "=================================================="
echo "✅ Deployment Complete!"
echo "=================================================="
echo ""
echo "🌐 Your website is live at:"
echo "   $WEBSITE_URL"
echo ""
echo "📊 Deployment Summary:"
echo "   • S3 Bucket: $BUCKET_NAME"
echo "   • CloudFront Distribution: $DISTRIBUTION_ID"
echo "   • Region: $REGION"
echo ""
echo "💡 Tips:"
echo "   • Changes may take 1-2 minutes to propagate globally"
echo "   • CloudFront caches content for better performance"
echo "   • Run this script again to deploy updates"
echo ""
echo "💰 Estimated Cost: $1-3/month for light traffic"
echo ""
