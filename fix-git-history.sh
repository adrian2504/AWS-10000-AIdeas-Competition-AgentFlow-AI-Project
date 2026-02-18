#!/bin/bash

# I clean up the git history to remove node_modules that were accidentally committed
# This creates a fresh git repository without the large files

echo "🧹 Cleaning up git history..."

# I remove the existing git repository
rm -rf .git

# I verify .gitignore includes node_modules
if ! grep -q "node_modules/" .gitignore; then
    echo "node_modules/" >> .gitignore
    echo "✅ Added node_modules/ to .gitignore"
fi

# I initialize a fresh git repository
git init
echo "✅ Initialized fresh git repository"

# I add all files (node_modules will be ignored)
git add .
echo "✅ Staged all files (excluding node_modules)"

# I create the initial commit
git commit -m "Initial commit: AgentFlow AI Project Co-Pilot

- Complete AWS serverless architecture with CDK
- 5 Lambda functions for AI-powered project management
- React frontend with Cognito authentication
- DynamoDB, S3, EventBridge, API Gateway integration
- Comprehensive documentation and deployment guides"

echo "✅ Created initial commit"

# I add the remote repository
git remote add origin https://github.com/adrian2504/AWS-10000-AIdeas-Competition-AgentFlow-AI-Project.git
echo "✅ Added remote origin"

echo ""
echo "🎉 Git history cleaned! Now you can push with:"
echo "   git push -f origin main"
echo ""
echo "⚠️  Note: This will force push and overwrite the remote repository"
