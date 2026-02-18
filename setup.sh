#!/bin/bash

# I automate the setup process for AgentFlow
# Run me to install dependencies and prepare for deployment

set -e

echo "🚀 Setting up AgentFlow..."

# I check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# I check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install AWS CLI first."
    exit 1
fi

echo "✅ AWS CLI version: $(aws --version)"

# I check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "📦 Installing AWS CDK..."
    npm install -g aws-cdk
fi

echo "✅ AWS CDK version: $(cdk --version)"

# I install backend dependencies
echo "📦 Installing backend dependencies..."

cd backend/infrastructure
npm install
echo "✅ Infrastructure dependencies installed"

cd ../lambda/brief-processor
npm install
echo "✅ Brief processor dependencies installed"

cd ../task-generator
npm install
echo "✅ Task generator dependencies installed"

cd ../task-router
npm install
echo "✅ Task router dependencies installed"

cd ../ai-executor
npm install
echo "✅ AI executor dependencies installed"

cd ../task-manager
npm install
echo "✅ Task manager dependencies installed"

# I install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../../../frontend
npm install
echo "✅ Frontend dependencies installed"

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure AWS credentials: aws configure"
echo "2. Enable Bedrock access in AWS Console"
echo "3. Bootstrap CDK: cd backend/infrastructure && cdk bootstrap"
echo "4. Deploy backend: cd backend/infrastructure && npm run deploy"
echo "5. Configure frontend .env with CDK outputs"
echo "6. Start frontend: cd frontend && npm start"
echo ""
echo "See DEPLOYMENT.md for detailed instructions."
