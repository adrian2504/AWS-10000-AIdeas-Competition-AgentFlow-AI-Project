#!/bin/bash

# I monitor AgentFlow backend logs in real-time
# This helps with debugging during development

echo "📊 Monitoring AgentFlow Backend Logs"
echo "===================================="
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "🔍 Available log groups:"
echo "  • Brief Processor (project creation)"
echo "  • Task Generator (AI task creation)"
echo "  • Sprint Planner (voice processing)"
echo "  • Collaboration Manager (real-time features)"
echo "  • Project Health (AI analysis)"
echo ""

echo "📡 Starting log monitoring..."
echo "Press Ctrl+C to stop"
echo ""

# Monitor multiple log groups simultaneously
aws logs tail /aws/lambda/AgentFlow-BriefProcessor --follow --format short &
aws logs tail /aws/lambda/AgentFlow-TaskGenerator --follow --format short &
aws logs tail /aws/lambda/AgentFlow-SprintPlanner --follow --format short &
aws logs tail /aws/lambda/AgentFlow-CollaborationManager --follow --format short &
aws logs tail /aws/lambda/AgentFlow-ProjectHealth --follow --format short &

# Wait for all background processes
wait