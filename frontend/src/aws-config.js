// I configure AWS Amplify for authentication
export const awsConfig = {
    Auth: {
        region: process.env.REACT_APP_AWS_REGION,
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
        mandatorySignIn: false,
        authenticationFlowType: 'USER_SRP_AUTH'
    }
};
