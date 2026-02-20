// I define all the AWS infrastructure needed for AgentFlow
// This creates the entire backend stack with one deployment

const cdk = require('aws-cdk-lib');
const lambda = require('aws-cdk-lib/aws-lambda');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const s3 = require('aws-cdk-lib/aws-s3');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const events = require('aws-cdk-lib/aws-events');
const targets = require('aws-cdk-lib/aws-events-targets');
const cognito = require('aws-cdk-lib/aws-cognito');
const iam = require('aws-cdk-lib/aws-iam');

class AgentFlowStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        
        // I create the S3 buckets for storing briefs and outputs
        const briefsBucket = new s3.Bucket(this, 'BriefsBucket', {
            bucketName: `agentflow-briefs-${this.account}`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN
        });
        
        const outputsBucket = new s3.Bucket(this, 'OutputsBucket', {
            bucketName: `agentflow-outputs-${this.account}`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN
        });
        
        // I create the DynamoDB tables
        const projectsTable = new dynamodb.Table(this, 'ProjectsTable', {
            tableName: 'AgentFlow-Projects',
            partitionKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            pointInTimeRecoverySpecification: {
                pointInTimeRecoveryEnabled: true
            }
        });
        
        // I add a GSI for querying projects by user
        projectsTable.addGlobalSecondaryIndex({
            indexName: 'UserIdIndex',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
        });
        
        const tasksTable = new dynamodb.Table(this, 'TasksTable', {
            tableName: 'AgentFlow-Tasks',
            partitionKey: { name: 'taskId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            pointInTimeRecoverySpecification: {
                pointInTimeRecoveryEnabled: true
            }
        });
        
        // I add GSIs for querying tasks
        tasksTable.addGlobalSecondaryIndex({
            indexName: 'ProjectIdIndex',
            partitionKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
        });
        
        tasksTable.addGlobalSecondaryIndex({
            indexName: 'ProjectStatusIndex',
            partitionKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'status', type: dynamodb.AttributeType.STRING }
        });
        
        // I create the team members table
        const teamTable = new dynamodb.Table(this, 'TeamTable', {
            tableName: 'AgentFlow-Team',
            partitionKey: { name: 'memberId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            pointInTimeRecoverySpecification: {
                pointInTimeRecoveryEnabled: true
            }
        });
        
        // I add a GSI for querying team members by user
        teamTable.addGlobalSecondaryIndex({
            indexName: 'UserIdIndex',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
        });
        
        // I create the login tracking table
        const loginTrackingTable = new dynamodb.Table(this, 'LoginTrackingTable', {
            tableName: 'AgentFlow-LoginTracking',
            partitionKey: { name: 'loginId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            pointInTimeRecoverySpecification: {
                pointInTimeRecoveryEnabled: true
            }
        });
        
        // I add GSIs for querying logins
        loginTrackingTable.addGlobalSecondaryIndex({
            indexName: 'UserIdIndex',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING }
        });
        
        loginTrackingTable.addGlobalSecondaryIndex({
            indexName: 'DateIndex',
            partitionKey: { name: 'date', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING }
        });
        
        // I create the EventBridge event bus for orchestration
        const eventBus = new events.EventBus(this, 'AgentFlowEventBus', {
            eventBusName: 'AgentFlowEventBus'
        });
        
        // I create the Cognito User Pool for authentication
        const userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: 'AgentFlowUsers',
            selfSignUpEnabled: true,
            signInAliases: {
                email: true
            },
            autoVerify: {
                email: true
            },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: false
            },
            removalPolicy: cdk.RemovalPolicy.RETAIN
        });
        
        const userPoolClient = userPool.addClient('WebClient', {
            authFlows: {
                userPassword: true,
                userSrp: true
            }
        });
        
        // I create the Lambda functions with shared environment variables
        // Note: AWS_REGION is automatically available in Lambda, no need to set it
        const commonEnv = {
            PROJECTS_TABLE: projectsTable.tableName,
            TASKS_TABLE: tasksTable.tableName,
            TEAM_TABLE: teamTable.tableName,
            LOGIN_TRACKING_TABLE: loginTrackingTable.tableName,
            BRIEFS_BUCKET: briefsBucket.bucketName,
            OUTPUTS_BUCKET: outputsBucket.bucketName,
            EVENT_BUS_NAME: eventBus.eventBusName
        };
        
        // I create the brief processor Lambda
        const briefProcessor = new lambda.Function(this, 'BriefProcessor', {
            functionName: 'AgentFlow-BriefProcessor',
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('../lambda/brief-processor'),
            timeout: cdk.Duration.seconds(60),
            memorySize: 512,
            environment: commonEnv
        });
        
        // I create the task generator Lambda
        const taskGenerator = new lambda.Function(this, 'TaskGenerator', {
            functionName: 'AgentFlow-TaskGenerator',
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('../lambda/task-generator'),
            timeout: cdk.Duration.seconds(300),
            memorySize: 1024,
            environment: commonEnv
        });
        
        // I create the task router Lambda
        const taskRouter = new lambda.Function(this, 'TaskRouter', {
            functionName: 'AgentFlow-TaskRouter',
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('../lambda/task-router'),
            timeout: cdk.Duration.seconds(60),
            memorySize: 512,
            environment: commonEnv
        });
        
        // I create the AI executor Lambda
        const aiExecutor = new lambda.Function(this, 'AIExecutor', {
            functionName: 'AgentFlow-AIExecutor',
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('../lambda/ai-executor'),
            timeout: cdk.Duration.seconds(300),
            memorySize: 1024,
            environment: commonEnv
        });
        
        // I create the task manager Lambda
        const taskManager = new lambda.Function(this, 'TaskManager', {
            functionName: 'AgentFlow-TaskManager',
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('../lambda/task-manager'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: commonEnv
        });
        
        // I create the team manager Lambda
        const teamManager = new lambda.Function(this, 'TeamManager', {
            functionName: 'AgentFlow-TeamManager',
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('../lambda/team-manager'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: commonEnv
        });
        
        // I create the auth tracker Lambda for login tracking
        const authTracker = new lambda.Function(this, 'AuthTracker', {
            functionName: 'AgentFlow-AuthTracker',
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('../lambda/auth-tracker'),
            timeout: cdk.Duration.seconds(10),
            memorySize: 256,
            environment: commonEnv
        });
        
        // I add the auth tracker as a Cognito trigger
        userPool.addTrigger(cognito.UserPoolOperation.POST_AUTHENTICATION, authTracker);
        
        // I grant permissions to all Lambda functions
        briefsBucket.grantReadWrite(briefProcessor);
        briefsBucket.grantRead(aiExecutor);
        outputsBucket.grantReadWrite(aiExecutor);
        
        projectsTable.grantReadWriteData(briefProcessor);
        projectsTable.grantReadWriteData(taskGenerator);
        projectsTable.grantReadData(taskManager);
        
        tasksTable.grantReadWriteData(taskGenerator);
        tasksTable.grantReadWriteData(taskRouter);
        tasksTable.grantReadWriteData(aiExecutor);
        tasksTable.grantReadWriteData(taskManager);
        
        teamTable.grantReadWriteData(teamManager);
        teamTable.grantReadData(taskRouter);
        
        loginTrackingTable.grantReadWriteData(authTracker);
        projectsTable.grantReadData(authTracker);
        
        eventBus.grantPutEventsTo(briefProcessor);
        eventBus.grantPutEventsTo(taskGenerator);
        eventBus.grantPutEventsTo(taskRouter);
        eventBus.grantPutEventsTo(aiExecutor);
        eventBus.grantPutEventsTo(taskManager);
        
        // I grant Bedrock permissions to the functions that need AI
        const bedrockPolicy = new iam.PolicyStatement({
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream'
            ],
            resources: ['*']
        });
        
        // I grant AWS Marketplace permissions needed for Bedrock model access
        const marketplacePolicy = new iam.PolicyStatement({
            actions: [
                'aws-marketplace:ViewSubscriptions',
                'aws-marketplace:Subscribe',
                'aws-marketplace:Unsubscribe'
            ],
            resources: ['*']
        });
        
        briefProcessor.addToRolePolicy(bedrockPolicy);
        briefProcessor.addToRolePolicy(marketplacePolicy);
        taskGenerator.addToRolePolicy(bedrockPolicy);
        taskGenerator.addToRolePolicy(marketplacePolicy);
        aiExecutor.addToRolePolicy(bedrockPolicy);
        aiExecutor.addToRolePolicy(marketplacePolicy);
        
        // I create EventBridge rules to trigger Lambda functions
        new events.Rule(this, 'TaskGenerationRule', {
            eventBus: eventBus,
            eventPattern: {
                source: ['agentflow.brief-processor'],
                detailType: ['TaskGenerationRequested']
            },
            targets: [new targets.LambdaFunction(taskGenerator)]
        });
        
        new events.Rule(this, 'TaskRoutingRule', {
            eventBus: eventBus,
            eventPattern: {
                source: ['agentflow.task-generator'],
                detailType: ['TasksGenerated']
            },
            targets: [new targets.LambdaFunction(taskRouter)]
        });
        
        new events.Rule(this, 'AIExecutionRule', {
            eventBus: eventBus,
            eventPattern: {
                source: ['agentflow.task-router'],
                detailType: ['TaskRouted'],
                detail: {
                    assignmentType: ['AI']
                }
            },
            targets: [new targets.LambdaFunction(aiExecutor)]
        });
        
        // I create the API Gateway with CORS enabled
        const api = new apigateway.RestApi(this, 'AgentFlowAPI', {
            restApiName: 'AgentFlow API',
            description: 'API for AgentFlow project management',
            defaultCorsPreflightOptions: {
                allowOrigins: ['http://localhost:3000', 'https://*'],
                allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token'
                ],
                allowCredentials: true
            }
        });
        
        // I create a Cognito authorizer
        const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'APIAuthorizer', {
            cognitoUserPools: [userPool]
        });
        
        // I define API endpoints
        const briefs = api.root.addResource('briefs');
        briefs.addMethod('POST', new apigateway.LambdaIntegration(briefProcessor), {
            authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO
        });
        
        const projects = api.root.addResource('projects');
        projects.addMethod('GET', new apigateway.LambdaIntegration(taskManager), {
            authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO
        });
        
        const projectTasks = projects.addResource('{projectId}').addResource('tasks');
        projectTasks.addMethod('GET', new apigateway.LambdaIntegration(taskManager), {
            authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO
        });
        
        const tasks = api.root.addResource('tasks');
        tasks.addMethod('POST', new apigateway.LambdaIntegration(taskManager), {
            authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO
        });
        
        const review = api.root.addResource('review');
        review.addMethod('POST', new apigateway.LambdaIntegration(taskManager), {
            authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO
        });
        
        const team = api.root.addResource('team');
        team.addMethod('GET', new apigateway.LambdaIntegration(teamManager), {
            authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO
        });
        team.addMethod('POST', new apigateway.LambdaIntegration(teamManager), {
            authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO
        });
        
        const teamMember = team.addResource('{memberId}');
        teamMember.addMethod('PUT', new apigateway.LambdaIntegration(teamManager), {
            authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO
        });
        teamMember.addMethod('DELETE', new apigateway.LambdaIntegration(teamManager), {
            authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO
        });
        
        // I output important values
        new cdk.CfnOutput(this, 'APIEndpoint', {
            value: api.url,
            description: 'API Gateway endpoint URL'
        });
        
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: userPool.userPoolId,
            description: 'Cognito User Pool ID'
        });
        
        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: userPoolClient.userPoolClientId,
            description: 'Cognito User Pool Client ID'
        });
    }
}

module.exports = { AgentFlowStack };
