// I create the S3 + CloudFront infrastructure for hosting the React frontend
// This provides a fast, cheap, and scalable hosting solution

const cdk = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const iam = require('aws-cdk-lib/aws-iam');

class FrontendStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        
        // I create the S3 bucket for hosting the React app
        const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
            bucketName: `agentflow-frontend-${this.account}`,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            autoDeleteObjects: false,
            encryption: s3.BucketEncryption.S3_MANAGED,
            cors: [
                {
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.HEAD
                    ],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*']
                }
            ]
        });
        
        // I create an Origin Access Control (OAC) - newer and better than OAI
        const cfnOriginAccessControl = new cloudfront.CfnOriginAccessControl(this, 'OAC', {
            originAccessControlConfig: {
                name: 'AgentFlowOAC',
                originAccessControlOriginType: 's3',
                signingBehavior: 'always',
                signingProtocol: 'sigv4',
                description: 'Origin Access Control for AgentFlow frontend'
            }
        });
        
        // I create the CloudFront distribution
        const distribution = new cloudfront.CloudFrontWebDistribution(this, 'Distribution', {
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: websiteBucket
                    },
                    behaviors: [
                        {
                            isDefaultBehavior: true,
                            compress: true,
                            allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
                            cachedMethods: cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
                            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                            defaultTtl: cdk.Duration.hours(24),
                            maxTtl: cdk.Duration.days(365),
                            minTtl: cdk.Duration.seconds(0)
                        }
                    ]
                }
            ],
            errorConfigurations: [
                {
                    errorCode: 403,
                    responseCode: 200,
                    responsePagePath: '/index.html',
                    errorCachingMinTtl: 300
                },
                {
                    errorCode: 404,
                    responseCode: 200,
                    responsePagePath: '/index.html',
                    errorCachingMinTtl: 300
                }
            ],
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
            comment: 'AgentFlow Frontend Distribution',
            defaultRootObject: 'index.html'
        });
        
        // I grant CloudFront read access to the bucket using bucket policy
        websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [websiteBucket.arnForObjects('*')],
            principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
            conditions: {
                StringEquals: {
                    'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`
                }
            }
        }));
        
        // I output important values
        new cdk.CfnOutput(this, 'BucketName', {
            value: websiteBucket.bucketName,
            description: 'S3 Bucket for frontend hosting'
        });
        
        new cdk.CfnOutput(this, 'DistributionId', {
            value: distribution.distributionId,
            description: 'CloudFront Distribution ID'
        });
        
        new cdk.CfnOutput(this, 'DistributionDomainName', {
            value: distribution.distributionDomainName,
            description: 'CloudFront Distribution Domain Name (Your Live URL)',
            exportName: 'AgentFlowDistributionDomain'
        });
        
        new cdk.CfnOutput(this, 'WebsiteURL', {
            value: `https://${distribution.distributionDomainName}`,
            description: 'Website URL',
            exportName: 'AgentFlowWebsiteURL'
        });
    }
}

module.exports = { FrontendStack };
