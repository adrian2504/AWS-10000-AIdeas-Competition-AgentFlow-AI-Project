# Sprint Planning Feature - Deployment Guide

## Prerequisites

Before deploying the Sprint Planning feature, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Node.js** 18.x or later installed
4. **AWS CDK** installed globally: `npm install -g aws-cdk`
5. **Bedrock Model Access** - Claude 3 Sonnet enabled in your AWS account

## Step 1: Enable AWS Bedrock Models

1. Go to AWS Console → Amazon Bedrock
2. Navigate to "Model access" in the left sidebar
3. Click "Manage model access"
4. Enable access to: **Anthropic Claude 3 Sonnet**
5. Wait for access to be granted (usually takes a few minutes)

## Step 2: Install Lambda Dependencies

Navigate to the sprint-planner Lambda directory and install dependencies:

```bash
cd backend/lambda/sprint-planner
npm install
cd ../../..
```

## Step 3: Deploy Infrastructure

Navigate to the infrastructure directory:

```bash
cd backend/infrastructure
```

Install CDK dependencies (if not already done):

```bash
npm install
```

Bootstrap CDK (first time only):

```bash
cdk bootstrap
```

Deploy the stack:

```bash
cdk deploy
```

This will:
- Create the S3 bucket for sprint audio files
- Deploy the Sprint Planner Lambda function
- Set up API Gateway endpoints
- Configure IAM permissions for Transcribe and Bedrock
- Update existing resources

**Important:** Note the API Gateway URL from the output!

## Step 4: Update Frontend Configuration

Update your frontend `.env` file with the API Gateway URL:

```bash
cd ../../frontend
```

Edit `.env`:

```
REACT_APP_API_URL=https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod
REACT_APP_USER_POOL_ID=YOUR_USER_POOL_ID
REACT_APP_USER_POOL_CLIENT_ID=YOUR_CLIENT_ID
REACT_APP_AWS_REGION=YOUR_REGION
```

## Step 5: Test the Feature

1. Start the frontend:
```bash
npm start
```

2. Navigate to a project
3. Click "Sprint Planning" button
4. Record a test audio (speak clearly about tasks)
5. Click "Process Recording"
6. Verify transcription appears
7. Verify tasks are extracted
8. Select tasks and assign to team members
9. Click "Create Sprint Tasks"
10. Verify tasks appear in the project board

## Troubleshooting

### Issue: "Transcription job failed"

**Possible causes:**
- Audio format not supported (should be webm)
- S3 bucket permissions issue
- Transcribe service not available in your region

**Solution:**
1. Check CloudWatch logs for the Lambda function
2. Verify S3 bucket exists and has correct permissions
3. Ensure Transcribe is available in your region (us-east-1, us-west-2, eu-west-1)

### Issue: "Bedrock model not accessible"

**Possible causes:**
- Model access not enabled
- IAM permissions missing
- Model not available in your region

**Solution:**
1. Go to Bedrock console and verify model access
2. Check Lambda execution role has bedrock:InvokeModel permission
3. Deploy in a region where Claude 3 Sonnet is available

### Issue: "CORS error when uploading audio"

**Possible causes:**
- API Gateway CORS not configured
- S3 bucket CORS not configured

**Solution:**
1. Verify API Gateway has CORS enabled (should be automatic with CDK)
2. Check S3 bucket CORS configuration in the CDK stack
3. Redeploy the stack

### Issue: "Audio upload fails"

**Possible causes:**
- File size too large
- Network timeout
- Lambda timeout

**Solution:**
1. Keep recordings under 5 minutes
2. Check Lambda timeout is set to 300 seconds
3. Verify API Gateway timeout settings

### Issue: "Tasks not extracted correctly"

**Possible causes:**
- Poor audio quality
- Background noise
- Unclear speech
- Bedrock prompt needs tuning

**Solution:**
1. Record in a quiet environment
2. Speak clearly and at moderate pace
3. Explicitly mention task details
4. Review and adjust the Bedrock prompt in the Lambda code

## Cost Considerations

### AWS Transcribe
- **Price:** ~$0.024 per minute of audio
- **Example:** 10-minute meeting = $0.24

### Amazon Bedrock (Claude 3 Sonnet)
- **Input:** ~$0.003 per 1K tokens
- **Output:** ~$0.015 per 1K tokens
- **Example:** Typical sprint planning = $0.05-0.10

### S3 Storage
- **Price:** ~$0.023 per GB per month
- **Example:** 100 audio files (50MB each) = $0.12/month

### Lambda
- **Price:** First 1M requests free, then $0.20 per 1M
- **Compute:** $0.0000166667 per GB-second
- **Example:** Typical usage = negligible cost

### Total Estimated Cost
- **Per sprint planning session:** $0.30-0.50
- **Monthly (4 sessions):** $1.20-2.00

## Performance Optimization

### Reduce Transcription Time
1. Use shorter audio clips
2. Consider real-time transcription for long meetings
3. Process audio in chunks

### Reduce Bedrock Costs
1. Optimize the prompt to be more concise
2. Cache common task patterns
3. Use Claude Haiku for simpler extractions

### Improve Accuracy
1. Use higher quality audio input
2. Reduce background noise
3. Speak clearly and at moderate pace
4. Use technical terms consistently
5. Mention task details explicitly

## Monitoring

### CloudWatch Logs

Monitor Lambda execution:
```bash
aws logs tail /aws/lambda/AgentFlow-SprintPlanner --follow
```

### CloudWatch Metrics

Key metrics to monitor:
- Lambda invocations
- Lambda errors
- Lambda duration
- Transcribe job success rate
- Bedrock invocation count

### Alarms

Set up CloudWatch alarms for:
- Lambda errors > 5% of invocations
- Lambda duration > 250 seconds
- Transcribe job failures

## Security Best Practices

1. **Audio Storage**
   - Audio files are encrypted at rest in S3
   - Consider adding lifecycle policies to delete old audio
   - Implement access logging

2. **API Access**
   - All endpoints require Cognito authentication
   - Use HTTPS only
   - Implement rate limiting

3. **Data Privacy**
   - Audio files contain sensitive meeting discussions
   - Consider implementing automatic deletion after processing
   - Add audit logging for compliance

4. **IAM Permissions**
   - Lambda has minimum required permissions
   - S3 bucket blocks public access
   - Transcribe jobs are private

## Maintenance

### Regular Tasks

1. **Weekly:**
   - Review CloudWatch logs for errors
   - Check S3 storage usage
   - Monitor costs

2. **Monthly:**
   - Clean up old audio files
   - Review and optimize Bedrock prompts
   - Update Lambda dependencies

3. **Quarterly:**
   - Review IAM permissions
   - Update to latest AWS SDK versions
   - Performance testing

### Backup and Recovery

1. **DynamoDB:**
   - Point-in-time recovery enabled
   - Consider daily backups

2. **S3:**
   - Versioning enabled
   - Consider cross-region replication

## Scaling Considerations

### Current Limits
- Lambda: 300 second timeout
- Transcribe: 4 hours max audio length
- API Gateway: 29 second timeout (for synchronous calls)

### For High Volume
1. Use asynchronous processing with SQS
2. Implement job queue for transcription
3. Add caching layer for common tasks
4. Consider Step Functions for orchestration

## Next Steps

After successful deployment:

1. ✅ Test with real sprint planning meetings
2. ✅ Gather user feedback
3. ✅ Monitor costs and performance
4. ✅ Iterate on Bedrock prompts
5. ✅ Add more task categories
6. ✅ Implement real-time transcription
7. ✅ Add multi-language support

## Support

For issues:
1. Check CloudWatch logs
2. Review this deployment guide
3. Check AWS service health dashboard
4. Contact AWS support if needed

## Rollback

If you need to rollback:

```bash
cd backend/infrastructure
cdk destroy
```

This will remove all Sprint Planning resources but keep existing data.

## Success Checklist

- [ ] Bedrock model access enabled
- [ ] Lambda dependencies installed
- [ ] CDK stack deployed successfully
- [ ] API Gateway URL noted
- [ ] Frontend .env updated
- [ ] Test recording successful
- [ ] Transcription working
- [ ] Task extraction working
- [ ] Tasks created in project board
- [ ] CloudWatch logs reviewed
- [ ] Costs monitored

Congratulations! Your Sprint Planning feature is now live with real AWS Transcribe and Bedrock integration! 🎉
