# Frontend Deployment Guide - S3 + CloudFront

This guide will help you deploy your React frontend to AWS S3 + CloudFront for a fast, cheap, and scalable hosting solution.

## 📋 Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws configure
   ```
   Enter your AWS Access Key ID, Secret Access Key, and default region (us-east-1)

2. **Node.js and npm installed**
   ```bash
   node --version
   npm --version
   ```

## 🚀 Deployment Steps

### Option 1: Automated Deployment (Recommended)

Run the deployment script:

```bash
./deploy-frontend.sh
```

This script will:
1. ✅ Deploy CloudFront infrastructure (first time only)
2. ✅ Build your React app
3. ✅ Upload files to S3
4. ✅ Invalidate CloudFront cache
5. ✅ Give you your live URL

### Option 2: Manual Deployment

If you prefer to do it step by step:

#### Step 1: Deploy Infrastructure
```bash
cd backend/infrastructure
npm install
npx cdk deploy AgentFlowFrontendStack --app "node bin/frontend-app.js"
```

#### Step 2: Build React App
```bash
cd ../../frontend
npm install
npm run build
```

#### Step 3: Upload to S3
```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="agentflow-frontend-$ACCOUNT_ID"

aws s3 sync build/ s3://$BUCKET_NAME/ --delete
```

#### Step 4: Invalidate CloudFront Cache
```bash
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name AgentFlowFrontendStack \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
    --output text)

aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*"
```

## 🌐 Getting Your Live URL

After deployment, get your website URL:

```bash
aws cloudformation describe-stacks \
    --stack-name AgentFlowFrontendStack \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
    --output text
```

Your site will be available at: `https://d1234567890abc.cloudfront.net`

## 🔄 Updating Your Site

To deploy updates:

```bash
./deploy-frontend.sh
```

The script will:
- Rebuild your React app
- Upload only changed files
- Invalidate the cache
- Your updates will be live in 1-2 minutes

## 💰 Cost Breakdown (30 Days)

### S3 Storage
- **Storage**: ~$0.50/month for 500MB
- **Requests**: ~$0.10/month for 10,000 requests

### CloudFront
- **Data Transfer**: First 1TB free, then $0.085/GB
- **Requests**: $0.0075 per 10,000 HTTPS requests
- **Estimated**: ~$1-2/month for light traffic

### Total: $1-3/month

## 🎯 What You Get

✅ **Global CDN**: Your site loads fast worldwide
✅ **HTTPS**: Free SSL certificate included
✅ **Scalable**: Handles traffic spikes automatically
✅ **Reliable**: 99.99% uptime SLA
✅ **Cheap**: $1-3/month for most use cases

## 🔧 Troubleshooting

### Issue: "Stack already exists"
**Solution**: The infrastructure is already deployed. Just run the script again to update your site.

### Issue: "Build failed"
**Solution**: 
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: "Access Denied" when uploading to S3
**Solution**: Check your AWS credentials:
```bash
aws sts get-caller-identity
```

### Issue: Changes not showing up
**Solution**: CloudFront caches content. Wait 1-2 minutes or run:
```bash
./deploy-frontend.sh
```

## 📊 Monitoring Costs

Check your AWS costs:
```bash
aws ce get-cost-and-usage \
    --time-period Start=2024-01-01,End=2024-01-31 \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --group-by Type=SERVICE
```

## 🔒 Security Features

- ✅ S3 bucket is private (not publicly accessible)
- ✅ CloudFront uses HTTPS only
- ✅ Origin Access Identity restricts S3 access
- ✅ No public read permissions on bucket

## 🎨 Custom Domain (Optional)

To use your own domain (e.g., agentflow.com):

1. Register domain in Route 53 or use existing domain
2. Request SSL certificate in ACM (us-east-1 region)
3. Update CloudFront distribution with custom domain
4. Add CNAME record in Route 53

Cost: +$0.50/month for Route 53 hosted zone

## 📝 Next Steps

1. Run `./deploy-frontend.sh`
2. Get your live URL
3. Share it with users
4. Monitor costs in AWS Console

## 🆘 Need Help?

- Check CloudFormation console for stack status
- Check S3 console to verify files uploaded
- Check CloudFront console for distribution status
- Review CloudWatch logs for errors

---

**Your site will be live at a CloudFront URL like:**
`https://d1234567890abc.cloudfront.net`

This URL is permanent and won't change unless you delete the stack.
