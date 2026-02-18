#!/usr/bin/env node

// I'm the CDK app entry point that creates the AgentFlow stack

const cdk = require('aws-cdk-lib');
const { AgentFlowStack } = require('../lib/agentflow-stack');

const app = new cdk.App();

new AgentFlowStack(app, 'AgentFlowStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
    },
    description: 'AgentFlow - AI Project Co-Pilot Infrastructure'
});

app.synth();
