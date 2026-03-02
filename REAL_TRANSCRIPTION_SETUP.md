# Real Audio Transcription Setup - Complete Guide

## What Changed

Your Sprint Planning feature now uses **real AWS services** instead of mock data:

### Before (Mock Data)
- ❌ Audio was recorded but ignored
- ❌ Always showed the same pre-programmed tasks
- ❌ Transcription was fake

### After (Real Integration)
- ✅ Audio is uploaded to S3
- ✅ AWS Transcribe converts your speech to text
- ✅ Amazon Bedrock (Claude 3) extracts real tasks from what you said
- ✅ Tasks match your actual meeting discussion

## Architecture

```
Your Voice
    ↓
Browser Records Audio (WebM format)
    ↓
Upload to S3 Bucket
    ↓
AWS Transcribe Job Started
    ↓
Wait for Transcription (polls every 2 seconds)
    ↓
Get Transcription Text from S3
    ↓
Send to Amazon Bedrock (Claude 3 Sonnet)
    ↓
AI Extracts Structured Tasks
    ↓
Display in UI
```

## Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
./deploy-sprint-planning.sh
```

This script will:
1. Check all prerequisites
2. Install dependencies
3. Bootstrap CDK if needed
4. Deploy the full stack
5. Give you next steps

### Option 2: Manual Deployment

Follow the detailed steps in `SPRINT_PLANNING_DEPLOYMENT.md`

## What Gets Deployed

### New Resources

1. **S3 Bucket**: `agentflow-sprint-audio-{account-id}`
   - Stores audio recordings
   - Stores transcription results
   - Encrypted at rest
   - CORS enabled for browser uploads

2. **Lambda Function**: `AgentFlow-SprintPlanner`
   - Handles audio processing
   - Manages Transcribe jobs
   - Calls Bedrock for task extraction
   - 300 second timeout
   - 1024 MB memory

3. **API Gateway Endpoints**:
   - `POST /sprint-planning/process-audio` - Upload and process audio
   - `POST /sprint-planning/create-tasks` - Create tasks from planning session

4. **IAM Permissions**:
   - S3 read/write for audio bucket
   - Transcribe job management
   - Bedrock model invocation
   - DynamoDB read/write for tasks

### Updated Resources

- Existing Lambda functions (no changes)
- API Gateway (new routes added)
- DynamoDB tables (no schema changes)

## How It Works

### 1. Recording Phase

```javascript
// Browser captures audio using MediaRecorder API
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream);
```

### 2. Upload Phase

```javascript
// Audio blob sent to Lambda via API Gateway
const formData = new FormData();
formData.append('audio', audioBlob);
formData.append('projectId', projectId);
```

### 3. Transcription Phase

```javascript
// Lambda uploads to S3 and starts Transcribe job
await s3Client.send(new PutObjectCommand({
    Bucket: SPRINT_AUDIO_BUCKET,
    Key: audioKey,
    Body: audioData
}));

await transcribeClient.send(new StartTranscriptionJobCommand({
    TranscriptionJobName: jobName,
    LanguageCode: 'en-US',
    MediaFormat: 'webm',
    Media: { MediaFileUri: `s3://${SPRINT_AUDIO_BUCKET}/${audioKey}` }
}));
```

### 4. Task Extraction Phase

```javascript
// Bedrock analyzes transcription and extracts tasks
const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }]
    })
});
```

## Testing

### Test Script

Say this during recording:

```
"Let's plan our sprint. First, we need to implement user authentication 
with OAuth support. This is high priority and high complexity, probably 
16 hours of work. John should handle this.

Next, we need a real-time analytics dashboard. Medium complexity, high 
priority, about 12 hours. Sarah can take this one.

We also need API rate limiting. Low complexity, medium priority, 4 hours. 
Mike, can you do this?

Finally, database migration for new user fields. Low complexity but high 
priority, 3 hours. I'll take this one."
```

### Expected Output

**Transcription:**
```
Let's plan our sprint. First, we need to implement user authentication 
with OAuth support. This is high priority and high complexity, probably 
16 hours of work. John should handle this...
```

**Extracted Tasks:**
1. Implement OAuth Authentication
   - Category: Backend
   - Complexity: High
   - Priority: High
   - Estimated: 16 hours

2. Build Real-time Analytics Dashboard
   - Category: Frontend
   - Complexity: Medium
   - Priority: High
   - Estimated: 12 hours

3. Implement API Rate Limiting
   - Category: Backend
   - Complexity: Low
   - Priority: Medium
   - Estimated: 4 hours

4. Database Migration for User Fields
   - Category: Database
   - Complexity: Low
   - Priority: High
   - Estimated: 3 hours

## Fallback Behavior

If real processing fails (network issues, service unavailable, etc.), the system automatically falls back to mock data with a note:

```
[Note: Using demo data - real transcription failed]
```

This ensures the feature always works, even during AWS outages.

## Cost Breakdown

### Per Sprint Planning Session (10 minutes)

| Service | Usage | Cost |
|---------|-------|------|
| AWS Transcribe | 10 minutes | $0.24 |
| Amazon Bedrock | ~2K tokens | $0.08 |
| S3 Storage | 50 MB | $0.001 |
| Lambda | 1 invocation | $0.001 |
| **Total** | | **~$0.33** |

### Monthly (4 sessions)

- **Total Cost**: ~$1.32/month
- **Very affordable** for the value provided

## Troubleshooting

### "Transcription job failed"

**Check:**
1. Audio format is webm (browser default)
2. S3 bucket exists and has correct permissions
3. Transcribe is available in your region

**Fix:**
```bash
# Check CloudWatch logs
aws logs tail /aws/lambda/AgentFlow-SprintPlanner --follow

# Verify S3 bucket
aws s3 ls | grep agentflow-sprint-audio

# Check Transcribe service
aws transcribe list-transcription-jobs --max-results 5
```

### "Bedrock model not accessible"

**Check:**
1. Model access enabled in Bedrock console
2. IAM permissions correct
3. Using correct region

**Fix:**
1. Go to AWS Console → Bedrock → Model access
2. Enable "Anthropic Claude 3 Sonnet"
3. Wait 2-3 minutes for access to be granted
4. Redeploy: `cdk deploy`

### "Audio quality poor"

**Tips:**
1. Use a good microphone
2. Record in quiet environment
3. Speak clearly at moderate pace
4. Avoid background noise
5. Keep recording under 10 minutes

### "Tasks not accurate"

**Improve by:**
1. Being more explicit in your speech
2. Mentioning task details clearly
3. Stating priorities and complexity
4. Using consistent terminology
5. Adjusting the Bedrock prompt in Lambda code

## Advanced Configuration

### Adjust Transcription Settings

Edit `backend/lambda/sprint-planner/index.js`:

```javascript
await transcribeClient.send(new StartTranscriptionJobCommand({
    TranscriptionJobName: jobName,
    LanguageCode: 'en-US', // Change for other languages
    MediaFormat: 'webm',
    Media: { MediaFileUri: `s3://${SPRINT_AUDIO_BUCKET}/${audioKey}` },
    Settings: {
        ShowSpeakerLabels: true, // Enable speaker identification
        MaxSpeakerLabels: 5 // Max number of speakers
    }
}));
```

### Customize Task Extraction

Edit the Bedrock prompt in `backend/lambda/sprint-planner/index.js`:

```javascript
const prompt = `You are a project management assistant...

Additional instructions:
- Focus on technical tasks only
- Include acceptance criteria
- Suggest test cases
- Identify dependencies

Transcription:
${transcription}`;
```

### Add Custom Categories

Modify the prompt to include your categories:

```javascript
- category: The category (Frontend, Backend, Database, Testing, 
  Documentation, DevOps, Design, Mobile, API, Security, or Other)
```

## Monitoring

### CloudWatch Dashboard

Create a dashboard to monitor:
- Lambda invocations
- Transcribe job success rate
- Bedrock API calls
- Error rates
- Processing duration

### Alerts

Set up SNS alerts for:
- Lambda errors > 5%
- Transcribe failures
- High costs (> $10/day)

## Security

### Data Privacy

- Audio files contain sensitive meeting discussions
- Consider implementing automatic deletion:

```javascript
// Add to Lambda after processing
await s3Client.send(new DeleteObjectCommand({
    Bucket: SPRINT_AUDIO_BUCKET,
    Key: audioKey
}));
```

### Access Control

- All endpoints require Cognito authentication
- S3 bucket blocks public access
- Transcribe jobs are private
- Bedrock calls are logged

## Performance Optimization

### Reduce Latency

1. **Use smaller audio chunks**: Process in 2-minute segments
2. **Parallel processing**: Start Bedrock while Transcribe is running
3. **Caching**: Cache common task patterns

### Reduce Costs

1. **Use Claude Haiku**: Cheaper model for simple extractions
2. **Optimize prompts**: Shorter prompts = lower costs
3. **Batch processing**: Process multiple recordings together

## Next Steps

After deployment:

1. ✅ Test with real meetings
2. ✅ Gather team feedback
3. ✅ Monitor costs and accuracy
4. ✅ Iterate on prompts
5. ✅ Add more features:
   - Real-time transcription
   - Multi-language support
   - Speaker identification
   - Meeting summaries
   - Action item tracking

## Support Resources

- **Deployment Guide**: `SPRINT_PLANNING_DEPLOYMENT.md`
- **User Guide**: `SPRINT_PLANNING_GUIDE.md`
- **Technical Summary**: `SPRINT_PLANNING_SUMMARY.md`
- **AWS Transcribe Docs**: https://docs.aws.amazon.com/transcribe/
- **Amazon Bedrock Docs**: https://docs.aws.amazon.com/bedrock/

## Success Checklist

- [ ] Prerequisites installed
- [ ] Bedrock model access enabled
- [ ] Deployment script executed
- [ ] API Gateway URL configured
- [ ] Test recording successful
- [ ] Real transcription working
- [ ] Tasks extracted correctly
- [ ] Costs monitored
- [ ] Team trained on feature

---

**You're all set!** Your Sprint Planning feature now uses real AWS Transcribe and Bedrock to convert your meetings into actionable tasks. 🎉

Run `./deploy-sprint-planning.sh` to get started!
