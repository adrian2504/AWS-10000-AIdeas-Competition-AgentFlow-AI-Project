#!/bin/bash

# I deploy the admin portal and usage tracking features

echo "🚀 Deploying Admin Portal and Usage Tracking..."

# I install dependencies for admin portal Lambda
echo "📦 Installing admin portal dependencies..."
cd backend/lambda/admin-portal
npm install
cd ../../..

# I deploy the CDK stack with new resources
echo "☁️  Deploying infrastructure..."
cd backend/infrastructure
npm install
cdk deploy --require-approval never

echo "✅ Admin Portal deployed successfully!"
echo ""
echo "📊 Admin Portal Features:"
echo "  - User analytics and statistics"
echo "  - Usage tracking (transcriptions, projects, tasks)"
echo "  - Login history"
echo "  - Access restricted to: adriandsouza2504@gmail.com"
echo ""
echo "🔒 Usage Limits Enforced:"
echo "  - Max 1 project per user"
echo "  - Max 6 transcriptions per user"
echo "  - Admin email has unlimited access"
echo ""
echo "🌐 Access the admin portal at: /admin"
