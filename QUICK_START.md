# Quick Start - Real Audio Transcription

## TL;DR

Your Sprint Planning feature was using dummy data. Now it uses real AWS services to transcribe your actual voice and extract real tasks.

## Deploy in 3 Commands

```bash
# 1. Enable Bedrock model (do this in AWS Console first)
# Go to: AWS Console → Bedrock → Model access → Enable Claude 3 Sonnet

# 2. Deploy everything
./deploy-sprint-planning.sh

# 3. Update frontend config (use API URL from step 2 output)
echo "REACT_APP_API_URL=https://YOUR_API.execute-api.us-east-1.amazonaws.com/prod" >> frontend/.env
```

## Test It

```bash
cd frontend
npm start
```

1. Open a project
2. Click "Sprint Planning"
3. Record: "We need to build a login page, high priority, 8 hours"
4. Click "Process Recording"
5. See YOUR ACTUAL WORDS transcribed
6. See tasks extracted from what YOU SAID

## What Changed

| Before | After |
|--------|-------|
| Dummy transcription | Real AWS Transcribe |
| Pre-programmed tasks | AI extracts from your speech |
| Same tasks every time | Different based on what you say |
| Free (mock data) | ~$0.33 per meeting |

## Cost

- **Per meeting (10 min):** $0.33
- **Per month (4 meetings):** $1.32
- **Very affordable!**

## Files to Read

1. **DEPLOYMENT_SUMMARY.md** ← Start here
2. **REAL_TRANSCRIPTION_SETUP.md** ← How it works
3. **SPRINT_PLANNING_DEPLOYMENT.md** ← Detailed steps

## Need Help?

Check CloudWatch logs:
```bash
aws logs tail /aws/lambda/AgentFlow-SprintPlanner --follow
```

## That's It!

Run `./deploy-sprint-planning.sh` and you're done! 🚀
