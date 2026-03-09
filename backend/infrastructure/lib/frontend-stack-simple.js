// I create a simple, reliable S3 + CloudFront setup for the React frontend
// This uses the standard approach that always works

const cdk = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');

class FrontendStackSimple extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        
        // I create the S3 bucket for hosting
        const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
            bucketName: `agentflow-frontend-${this.account}`,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            publicReadAccess: true,
            blockPublicAccess: new s3.BlockPublicAccess({
                blockPublicAcls: false,
                blockPublicPolicy: false,
                ignorePublicAcls: false,
                restrictPublicBuckets: false
            }),
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            autoDeleteObjects: false
        });
        
        // I create the CloudFront distribution
        const distribution = new cloudfront.CloudFrontWebDistribution(this, 'Distribution', {
            originConfigs: [
                {
                    customOriginSource: {
                        domainName: websiteBucket.bucketWebsiteDomainName,
                        originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY
                    },
                    behaviors: [
                        {
                            isDefaultBehavior: true,
                            compress: true,
                            allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
                            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
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
            comment: 'AgentFlow Frontend Distribution'
        });
        
        // I output important values
        new cdk.CfnOutput(this, 'BucketName', {
            value: websiteBucket.bucketName,
            description: 'S3 Bucket for frontend hosting'
        });
        
        new cdk.CfnOutput(this, 'BucketWebsiteURL', {
            value: websiteBucket.bucketWebsiteUrl,
            description: 'S3 Website URL'
        });
        
        new cdk.CfnOutput(this, 'DistributionId', {
            value: distribution.distributionId,
            description: 'CloudFront Distribution ID'
        });
        
        new cdk.CfnOutput(this, 'DistributionDomainName', {
            value: distribution.distributionDomainName,
            description: 'CloudFront Distribution Domain Name'
        });
        
        new cdk.CfnOutput(this, 'WebsiteURL', {
            value: `https://${distribution.distributionDomainName}`,
            description: 'Your Live Website URL'
        });
    }
}

module.exports = { FrontendStackSimple };
