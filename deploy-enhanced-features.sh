#!/bin/bash

# I deploy the enhanced AgentFlow features
# Real-time collaboration, AI project health, and PWA capabilities

set -e

echo "🚀 Deploying Enhanced AgentFlow Features"
echo "========================================"
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

# Step 1: Install dependencies for new Lambda functions
echo "📦 Step 1: Installing Lambda dependencies..."

cd backend/lambda/collaboration-manager
npm install
cd ../project-health
npm install
cd ../../..

echo "✅ Dependencies installed!"

# Step 2: Deploy backend infrastructure
echo ""
echo "☁️  Step 2: Deploying enhanced backend infrastructure..."
cd backend/infrastructure

npm install
npx cdk deploy --require-approval never

echo "✅ Backend infrastructure deployed!"
cd ../..

# Step 3: Build and deploy frontend with PWA features
echo ""
echo "🔨 Step 3: Building enhanced frontend..."
cd frontend

npm install
npm run build

echo "✅ Frontend built with PWA features!"
cd ..

# Step 4: Deploy frontend to S3
BUCKET_NAME="agentflow-frontend-$ACCOUNT_ID"

echo ""
echo "📤 Step 4: Deploying frontend with new features..."
aws s3 sync frontend/build/ s3://$BUCKET_NAME/ --delete

# Step 5: Invalidate CloudFront cache
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name AgentFlowFrontendStack \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
    --output text 2>/dev/null)

if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo ""
    echo "🔄 Step 5: Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*" > /dev/null
    echo "✅ Cache invalidated!"
fi

# Get the website URL
WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name AgentFlowFrontendStack \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
    --output text 2>/dev/null)

echo ""
echo "========================================"
echo "✅ Enhanced Features Deployed!"
echo "========================================"
echo ""
echo "🌐 Your enhanced AgentFlow is live at:"
echo "   $WEBSITE_URL"
echo ""
echo "🎉 New Features Added:"
echo "   ✅ Real-time Collaboration"
echo "      • Live user presence tracking"
echo "      • Real-time comments and activity feed"
echo "      • User status indicators"
echo ""
echo "   ✅ AI Project Health Analysis"
echo "      • Intelligent risk assessment"
echo "      • AI-powered recommendations"
echo "      • Project completion predictions"
echo "      • Team utilization metrics"
echo ""
echo "   ✅ Progressive Web App (PWA)"
echo "      • Mobile-first responsive design"
echo "      • Offline functionality"
echo "      • Push notifications support"
echo "      • App-like experience on mobile"
echo ""
echo "   ✅ Enhanced UI/UX"
echo "      • Improved spacing and layout"
echo "      • Collapsible side panels"
echo "      • Professional AWS-themed design"
echo "      • Better mobile responsiveness"
echo ""
echo "💡 Usage Tips:"
echo "   • Toggle collaboration panel with the users icon"
echo "   • Toggle health panel with the chart icon"
echo "   • Run health analysis to get AI insights"
echo "   • Install as PWA on mobile devices"
echo ""
echo "📊 Competition Ready:"
echo "   • Real-time collaboration features"
echo "   • Advanced AI integration"
echo "   • Mobile PWA capabilities"
echo "   • Professional enterprise UI"
echo ""