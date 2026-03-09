#!/bin/bash

# I start the AgentFlow development environment
# This script sets up everything you need for local development

set -e

echo "🚀 Starting AgentFlow Development Environment"
echo "============================================="
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node --version)"
    exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install AWS CLI first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ Prerequisites check passed!"
echo ""

# Check if backend is deployed
echo "🔍 Checking backend deployment..."

if aws cloudformation describe-stacks --stack-name AgentFlowStack &> /dev/null; then
    echo "✅ Backend infrastructure is deployed!"
    
    # Get configuration values
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name AgentFlowStack \
        --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
        --output text 2>/dev/null)
    
    USER_POOL_ID=$(aws cloudformation describe-stacks \
        --stack-name AgentFlowStack \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
        --output text 2>/dev/null)
    
    USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
        --stack-name AgentFlowStack \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
        --output text 2>/dev/null)
    
    echo "📋 Backend Configuration:"
    echo "  API URL: $API_URL"
    echo "  User Pool ID: $USER_POOL_ID"
    echo "  Client ID: $USER_POOL_CLIENT_ID"
    echo ""
    
else
    echo "❌ Backend not deployed. Deploying now..."
    echo ""
    
    cd backend/infrastructure
    
    echo "📦 Installing CDK dependencies..."
    npm install
    
    echo "☁️  Deploying backend infrastructure (this may take 5-10 minutes)..."
    npx cdk deploy --require-approval never
    
    echo "✅ Backend deployed!"
    cd ../..
    
    # Get configuration values after deployment
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name AgentFlowStack \
        --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
        --output text)
    
    USER_POOL_ID=$(aws cloudformation describe-stacks \
        --stack-name AgentFlowStack \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
        --output text)
    
    USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
        --stack-name AgentFlowStack \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
        --output text)
fi

# Setup frontend environment
echo "⚙️  Setting up frontend environment..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Create or update .env file
echo "📝 Configuring environment variables..."
cat > .env << EOF
REACT_APP_API_URL=$API_URL
REACT_APP_USER_POOL_ID=$USER_POOL_ID
REACT_APP_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
REACT_APP_REGION=us-east-1
REACT_APP_ENV=development
EOF

echo "✅ Frontend configured!"
echo ""

# Start development server
echo "🎯 Starting development server..."
echo ""
echo "============================================="
echo "🎉 AgentFlow Development Environment Ready!"
echo "============================================="
echo ""
echo "📱 Frontend will open at: http://localhost:3000"
echo "🔧 API Backend: $API_URL"
echo ""
echo "💡 Development Tips:"
echo "  • Frontend changes auto-reload"
echo "  • Check browser console for errors"
echo "  • Use Chrome DevTools for debugging"
echo "  • Monitor AWS CloudWatch for backend logs"
echo ""
echo "🛑 To stop: Press Ctrl+C"
echo ""

# Start the development server
npm start