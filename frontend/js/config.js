const awsConfig = {
    region: 'us-west-2',
    cognito: {
        userPoolId: 'ap-south-1_CX3r85Vdg',
        clientId: '47v17eadiqcd6bp7jk50n91jqi',
        domain: 'REPLACE_WITH_COGNITO_DOMAIN'
    },
    apiGateway: {
        invokeUrl: 'https://REPLACE_WITH_API_ID.execute-api.us-west-2.amazonaws.com/dev'
    },
    dynamodb: {
        tableName: 'modern-todos'
    }
};

function updateConfig(newConfig) {
    Object.assign(awsConfig, newConfig);
    console.log('Config updated:', awsConfig);
}