#!/bin/bash

# Sprint Planning Feature Deployment Script
# This script deploys the Sprint Planning feature with AWS Transcribe and Bedrock integration

set -e

echo "🚀 AgentFlow Sprint Planning Deployment"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js installed"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} npm installed"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} AWS CLI installed"

if ! command -v cdk &> /dev/null; then
    echo -e "${RED}❌ AWS CDK is not installed${NC}"
    echo "Install with: npm install -g aws-cdk"
    exit 1
fi
echo -e "${GREEN}✓${NC} AWS CDK installed"

echo ""
echo "⚠️  Important: Make sure you have enabled Amazon Bedrock model access"
echo "   Go to AWS Console → Bedrock → Model access → Enable Claude 3 Sonnet"
echo ""
read -p "Have you enabled Bedrock model access? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please enable Bedrock model access first, then run this script again${NC}"
    exit 1
fi

# Install Lambda dependencies
echo ""
echo "📦 Installing Lambda dependencies..."
cd backend/lambda/sprint-planner
npm install
cd ../../..
echo -e "${GREEN}✓${NC} Lambda dependencies installed"

# Install CDK dependencies
echo ""
echo "📦 Installing CDK dependencies..."
cd backend/infrastructure
npm install
echo -e "${GREEN}✓${NC} CDK dependencies installed"

# Check if CDK is bootstrapped
echo ""
echo "🔍 Checking CDK bootstrap status..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)

if [ -z "$REGION" ]; then
    REGION="us-east-1"
    echo -e "${YELLOW}⚠️  No default region set, using us-east-1${NC}"
fi

echo "Account: $ACCOUNT_ID"
echo "Region: $REGION"

# Bootstrap CDK if needed
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region $REGION &> /dev/null; then
    echo ""
    echo "🔧 Bootstrapping CDK (first time setup)..."
    cdk bootstrap aws://$ACCOUNT_ID/$REGION
    echo -e "${GREEN}✓${NC} CDK bootstrapped"
else
    echo -e "${GREEN}✓${NC} CDK already bootstrapped"
fi

# Deploy the stack
echo ""
echo "🚀 Deploying AgentFlow stack with Sprint Planning..."
echo "This may take 5-10 minutes..."
echo ""

cdk deploy --require-approval never

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy the API Gateway URL from the output above"
    echo "2. Update frontend/.env with REACT_APP_API_URL"
    echo "3. Start the frontend: cd frontend && npm start"
    echo "4. Test the Sprint Planning feature"
    echo ""
    echo "📖 For detailed instructions, see SPRINT_PLANNING_DEPLOYMENT.md"
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check the error messages above"
    exit 1
fi

cd ../..
