#!/bin/bash

# I deploy the frontend to S3 + CloudFront (cheapest option)

echo "🚀 Deploying to AWS S3 + CloudFront..."

BUCKET_NAME="agentflow-frontend-$(date +%s)"
REGION="us-east-1"

# I create the S3 bucket
echo "📦 Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME --region $REGION

# I configure bucket for static website hosting
echo "🌐 Configuring static website hosting..."
aws s3 website s3://$BUCKET_NAME \
    --index-document index.html \
    --error-document index.html

# I set bucket policy for public access
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy file:///tmp/bucket-policy.json

# I upload the built files
echo "📤 Uploading files..."
cd frontend
aws s3 sync build/ s3://$BUCKET_NAME \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html" \
    --exclude "*.json"

# I upload index.html with no-cache
aws s3 cp build/index.html s3://$BUCKET_NAME/index.html \
    --cache-control "no-cache"

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your site is live at:"
echo "   http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo ""
echo "💡 Optional: Set up CloudFront for HTTPS and better performance"
echo "   Run: aws cloudfront create-distribution --origin-domain-name $BUCKET_NAME.s3.amazonaws.com"
echo ""
echo "💰 Estimated cost: $1-3/month"
