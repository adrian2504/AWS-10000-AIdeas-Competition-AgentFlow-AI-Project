#!/usr/bin/env node

// I bootstrap the frontend CDK app

const cdk = require('aws-cdk-lib');
const { FrontendStackSimple } = require('../lib/frontend-stack-simple');

const app = new cdk.App();

new FrontendStackSimple(app, 'AgentFlowFrontendStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
    },
    description: 'AgentFlow Frontend Hosting (S3 + CloudFront)'
});

app.synth();
