const awsConfig = {
    region: 'us-east-1', 
    cognito: {
        region: 'ap-south-1',
        userPoolId: 'ap-south-1_CX3r85Vdg',
        clientId: '47v17eadiqcd6bp7jk50n91jqi'
    },
    apiGateway: {
        invokeUrl: 'https://vhf9htxanf.execute-api.us-east-1.amazonaws.com/dev'
    },
    dynamodb: {
        tableName: 'modern-todos'
    }
};

function updateConfig(newConfig) {
    Object.assign(awsConfig, newConfig);
    console.log('Config updated:', awsConfig);
}