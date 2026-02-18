# AgentFlow Troubleshooting Guide

Common issues and solutions for AgentFlow deployment and operation.

## Deployment Issues

### CDK Bootstrap Fails

**Error**: "This stack requires bootstrapping"

**Solution**:
```bash
cd backend/infrastructure
cdk bootstrap aws://ACCOUNT-ID/REGION
```

Replace ACCOUNT-ID with your AWS account ID and REGION with your deployment region.

### CDK Deploy Fails - Bedrock Permissions

**Error**: "User is not authorized to perform: bedrock:InvokeModel"

**Solution**:
1. Go to AWS Console → Bedrock
2. Click "Model access" in left sidebar
3. Click "Manage model access"
4. Enable "Claude 3 Sonnet"
5. Wait for status to show "Access granted"
6. Retry deployment

### Lambda Deployment Fails - Package Size

**Error**: "Unzipped size must be smaller than..."

**Solution**:
```bash
# Clean node_modules and reinstall
cd backend/lambda/[function-name]
rm -rf node_modules
npm install --production
```

### API Gateway CORS Errors

**Error**: "No 'Access-Control-Allow-Origin' header"

**Solution**:
Check `agentflow-stack.js` has CORS configuration:
```javascript
defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS
}
```

## Runtime Issues

### Tasks Not Generating

**Symptoms**: Project created but no tasks appear

**Diagnosis**:
```bash
# Check brief processor logs
aws logs tail /aws/lambda/AgentFlow-BriefProcessor --follow

# Check task generator logs
aws logs tail /aws/lambda/AgentFlow-TaskGenerator --follow

# Check EventBridge rules
aws events list-rules --event-bus-name AgentFlowEventBus
```

**Common Causes**:
1. EventBridge rule not enabled
2. Lambda execution role missing permissions
3. Bedrock model access not enabled
4. Brief content too short or invalid

**Solutions**:
```bash
# Enable EventBridge rule
aws events enable-rule --name TaskGenerationRule --event-bus-name AgentFlowEventBus

# Check Lambda permissions
aws lambda get-policy --function-name AgentFlow-BriefProcessor

# Test Bedrock access
aws bedrock list-foundation-models --region us-east-1
```

### AI Tasks Not Executing

**Symptoms**: Tasks stuck in QUEUED or IN_PROGRESS

**Diagnosis**:
```bash
# Check AI executor logs
aws logs tail /aws/lambda/AgentFlow-AIExecutor --follow

# Check task status in DynamoDB
aws dynamodb scan --table-name AgentFlow-Tasks \
  --filter-expression "assignmentType = :type" \
  --expression-attribute-values '{":type":{"S":"AI"}}'
```

**Common Causes**:
1. Bedrock rate limiting
2. S3 permissions for context retrieval
3. Lambda timeout (increase if needed)
4. Invalid task data

**Solutions**:
```bash
# Increase Lambda timeout
aws lambda update-function-configuration \
  --function-name AgentFlow-AIExecutor \
  --timeout 300

# Check S3 permissions
aws s3 ls s3://agentflow-briefs-YOUR-ACCOUNT/

# Retry failed tasks manually
aws lambda invoke \
  --function-name AgentFlow-AIExecutor \
  --payload '{"detail":{"taskId":"task_xxx","projectId":"proj_xxx"}}' \
  response.json
```

### Frontend Not Loading

**Symptoms**: Blank page or loading spinner forever

**Diagnosis**:
1. Open browser console (F12)
2. Check for errors
3. Check Network tab for failed requests

**Common Causes**:
1. Missing or incorrect .env file
2. API Gateway endpoint wrong
3. Cognito configuration wrong
4. CORS issues

**Solutions**:
```bash
# Verify .env file exists
cat frontend/.env

# Test API endpoint
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/projects

# Verify Cognito User Pool
aws cognito-idp describe-user-pool --user-pool-id us-east-1_xxxxxxxxx

# Clear browser cache and reload
# Chrome: Ctrl+Shift+R (Cmd+Shift+R on Mac)
```

### Authentication Fails

**Symptoms**: Can't sign up or sign in

**Diagnosis**:
```bash
# Check Cognito User Pool
aws cognito-idp describe-user-pool --user-pool-id YOUR-POOL-ID

# Check User Pool Client
aws cognito-idp describe-user-pool-client \
  --user-pool-id YOUR-POOL-ID \
  --client-id YOUR-CLIENT-ID
```

**Common Causes**:
1. Email verification not configured
2. Password policy too strict
3. User Pool Client settings wrong
4. Network issues

**Solutions**:
```bash
# Verify email configuration
aws cognito-idp get-user-pool-mfa-config --user-pool-id YOUR-POOL-ID

# Reset user password (if needed)
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR-POOL-ID \
  --username user@example.com \
  --password NewPassword123! \
  --permanent

# Confirm user manually (if email not working)
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id YOUR-POOL-ID \
  --username user@example.com
```

## Performance Issues

### Slow Task Generation

**Symptoms**: Takes > 2 minutes to generate tasks

**Diagnosis**:
```bash
# Check Lambda execution time
aws logs filter-log-events \
  --log-group-name /aws/lambda/AgentFlow-TaskGenerator \
  --filter-pattern "Duration"
```

**Solutions**:
1. Increase Lambda memory (more memory = more CPU)
```bash
aws lambda update-function-configuration \
  --function-name AgentFlow-TaskGenerator \
  --memory-size 1024
```

2. Optimize Bedrock prompts (shorter = faster)
3. Use Claude 3 Haiku for faster responses (lower quality)

### High Costs

**Symptoms**: AWS bill higher than expected

**Diagnosis**:
```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=2025-02-01,End=2025-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

**Common Causes**:
1. Bedrock usage (most expensive component)
2. Lambda invocations beyond free tier
3. DynamoDB reads/writes beyond free tier
4. S3 storage beyond free tier

**Solutions**:
1. Use Claude 3 Haiku instead of Sonnet
2. Reduce polling frequency in frontend
3. Implement caching for repeated queries
4. Set up billing alarms:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name AgentFlowCostAlarm \
  --alarm-description "Alert when costs exceed $20" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 20 \
  --comparison-operator GreaterThanThreshold
```

### Lambda Cold Starts

**Symptoms**: First request after idle period is slow

**Solutions**:
1. Increase Lambda memory (faster cold starts)
2. Use provisioned concurrency (costs money)
3. Implement warming (scheduled invocations)
4. Accept cold starts as normal serverless behavior

## Data Issues

### DynamoDB Throttling

**Error**: "ProvisionedThroughputExceededException"

**Solution**:
Tables are configured for on-demand billing, so this shouldn't happen. If it does:
```bash
# Check table status
aws dynamodb describe-table --table-name AgentFlow-Tasks

# Verify on-demand mode
aws dynamodb update-table \
  --table-name AgentFlow-Tasks \
  --billing-mode PAY_PER_REQUEST
```

### S3 Access Denied

**Error**: "Access Denied" when accessing S3

**Solution**:
```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket agentflow-briefs-YOUR-ACCOUNT

# Verify Lambda role has S3 permissions
aws iam get-role-policy \
  --role-name AgentFlowStack-BriefProcessorRole \
  --policy-name S3Access
```

### Lost Data

**Symptoms**: Projects or tasks disappear

**Diagnosis**:
```bash
# Check DynamoDB tables
aws dynamodb scan --table-name AgentFlow-Projects
aws dynamodb scan --table-name AgentFlow-Tasks

# Check S3 buckets
aws s3 ls s3://agentflow-briefs-YOUR-ACCOUNT/ --recursive
aws s3 ls s3://agentflow-outputs-YOUR-ACCOUNT/ --recursive
```

**Prevention**:
- DynamoDB tables have point-in-time recovery enabled
- S3 buckets have versioning (enable if needed)
- Regular backups recommended for production

## Network Issues

### API Gateway Timeout

**Error**: "504 Gateway Timeout"

**Cause**: Lambda execution exceeds 30 seconds (API Gateway limit)

**Solution**:
1. Optimize Lambda function
2. Use async processing for long tasks
3. Return immediately and poll for results

### Connection Refused

**Error**: "Connection refused" or "Network error"

**Diagnosis**:
```bash
# Test API endpoint
curl -v https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/projects

# Check API Gateway status
aws apigateway get-rest-api --rest-api-id YOUR-API-ID
```

**Solutions**:
1. Verify API Gateway is deployed
2. Check security groups (shouldn't be needed for API Gateway)
3. Verify DNS resolution
4. Check firewall/proxy settings

## Development Issues

### npm install Fails

**Error**: Various npm errors

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still failing, try different Node version
nvm install 18
nvm use 18
npm install
```

### CDK Synth Fails

**Error**: "Unable to resolve AWS account"

**Solution**:
```bash
# Configure AWS credentials
aws configure

# Set environment variables
export AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1

# Retry synth
cdk synth
```

### React Build Fails

**Error**: Various build errors

**Solutions**:
```bash
# Clear build cache
rm -rf build node_modules

# Reinstall dependencies
npm install

# Try build again
npm run build

# If still failing, check for syntax errors
npm run lint
```

## Getting Help

If you're still stuck:

1. **Check CloudWatch Logs**: Most issues show up in logs
```bash
aws logs tail /aws/lambda/FUNCTION-NAME --follow
```

2. **Enable Debug Logging**: Add console.log statements

3. **Check AWS Service Health**: https://status.aws.amazon.com/

4. **Review Documentation**:
   - DEPLOYMENT.md
   - TESTING.md
   - PROJECT_OVERVIEW.md

5. **Search GitHub Issues**: Common problems often documented

6. **AWS Support**: Use AWS Support if you have a support plan

## Useful Commands

### Check All Lambda Functions
```bash
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `AgentFlow`)].FunctionName'
```

### Check All DynamoDB Tables
```bash
aws dynamodb list-tables --query 'TableNames[?starts_with(@, `AgentFlow`)]'
```

### Check All S3 Buckets
```bash
aws s3 ls | grep agentflow
```

### Check EventBridge Rules
```bash
aws events list-rules --event-bus-name AgentFlowEventBus
```

### View Recent Logs
```bash
aws logs tail /aws/lambda/AgentFlow-BriefProcessor --since 1h
```

### Test Lambda Function
```bash
aws lambda invoke \
  --function-name AgentFlow-BriefProcessor \
  --payload '{"body":"{\"projectName\":\"Test\",\"briefContent\":\"Test brief\"}"}' \
  response.json
cat response.json
```

## Prevention

### Best Practices

1. **Monitor Costs**: Set up billing alarms
2. **Check Logs Regularly**: Catch issues early
3. **Test Thoroughly**: Use TESTING.md guide
4. **Keep Dependencies Updated**: Security and bug fixes
5. **Backup Data**: Export important projects
6. **Document Changes**: Track what you modify
7. **Use Version Control**: Commit working states

### Health Checks

Run these periodically:

```bash
# Check all services are running
./scripts/health-check.sh

# Check costs
aws ce get-cost-and-usage --time-period Start=2025-02-01,End=2025-02-28 --granularity MONTHLY --metrics BlendedCost

# Check error rates
aws logs filter-log-events --log-group-name /aws/lambda/AgentFlow-BriefProcessor --filter-pattern "ERROR"
```

---

Still having issues? Open a GitHub issue with:
- What you were trying to do
- What happened instead
- Error messages
- CloudWatch log excerpts
- Your AWS region and account type
