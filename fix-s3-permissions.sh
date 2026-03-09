#!/bin/bash

# I fix the S3 bucket permissions to allow CloudFront access

set -e

echo "🔧 Fixing S3 Bucket Permissions"
echo "================================"
echo ""

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="agentflow-frontend-$ACCOUNT_ID"

echo "📋 Bucket: $BUCKET_NAME"
echo ""

# Step 1: Make bucket public
echo "🔓 Step 1: Removing public access block..."
aws s3api delete-public-access-block --bucket $BUCKET_NAME 2>/dev/null || echo "Already removed"

# Step 2: Add bucket policy for public read
echo "📝 Step 2: Adding public read policy..."
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file:///tmp/bucket-policy.json

# Step 3: Enable website hosting
echo "🌐 Step 3: Enabling website hosting..."
aws s3 website s3://$BUCKET_NAME/ --index-document index.html --error-document index.html

# Step 4: Re-upload files without ACL (bucket policy handles access)
echo "📤 Step 4: Re-uploading files..."
aws s3 sync frontend/build/ s3://$BUCKET_NAME/ --delete

# Step 5: Get CloudFront URL
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name AgentFlowFrontendStack \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
    --output text 2>/dev/null)

if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo ""
    echo "🔄 Step 5: Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" > /dev/null
    
    WEBSITE_URL=$(aws cloudformation describe-stacks \
        --stack-name AgentFlowFrontendStack \
        --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
        --output text)
    
    echo ""
    echo "================================"
    echo "✅ Permissions Fixed!"
    echo "================================"
    echo ""
    echo "🌐 Your website should now work at:"
    echo "   $WEBSITE_URL"
    echo ""
    echo "⏱️  Wait 1-2 minutes for CloudFront to update"
else
    echo ""
    echo "================================"
    echo "✅ Bucket Permissions Fixed!"
    echo "================================"
    echo ""
    echo "🌐 Test directly at:"
    echo "   http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
fi

echo ""
