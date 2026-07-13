const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const CognitoUser = AmazonCognitoIdentity.CognitoUser;
const AuthenticationDetails = AmazonCognitoIdentity.AuthenticationDetails;
const CognitoUserAttribute = AmazonCognitoIdentity.CognitoUserAttribute;

const userPool = new CognitoUserPool({
    UserPoolId: awsConfig.cognito.userPoolId,
    ClientId: awsConfig.cognito.clientId
});

async function signup(email, password) {
    return new Promise((resolve, reject) => {
        const attributeList = [
            new CognitoUserAttribute({ Name: 'email', Value: email })
        ];

        userPool.signUp(email, password, attributeList, null, (err, result) => {
            if (err) {
                console.error('Signup Error:', err.message);
                reject({ error: err.message || 'Signup failed' });
                return;
            }
            console.log('Signup successful, confirmation code sent to email');
            resolve({ 
                success: true, 
                message: 'Check your email for verification code',
                userSub: result.userSub 
            });
        });
    });
}

async function confirmSignup(email, confirmationCode) {
    return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({
            Username: email,
            Pool: userPool
        });

        cognitoUser.confirmRegistration(confirmationCode, true, (err, result) => {
            if (err) {
                console.error('Confirmation Error:', err.message);
                reject({ error: err.message || 'Confirmation failed' });
                return;
            }
            console.log('Email confirmed successfully');
            resolve({ success: true, message: 'Email verified! You can now login.' });
        });
    });
}

async function login(email, password) {
    return new Promise((resolve, reject) => {
        const authenticationDetails = new AuthenticationDetails({
            Username: email,
            Password: password
        });

        const cognitoUser = new CognitoUser({
            Username: email,
            Pool: userPool
        });

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => {
                const idToken = result.getIdToken().getJwtToken();
                const accessToken = result.getAccessToken().getJwtToken();
                const refreshToken = result.getRefreshToken().getToken();

                localStorage.setItem('idToken', idToken);
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('email', email);
                localStorage.setItem('userId', result.getIdToken().payload.sub);

                console.log('Login successful');
                resolve({ 
                    success: true, 
                    email, 
                    tokens: { idToken, accessToken } 
                });
            },
            onFailure: (err) => {
                console.error('Login Error:', err.message);
                reject({ error: err.message || 'Login failed' });
            },
            newPasswordChallenge: (userAttributes, resolve, reject) => {
                console.log('New password challenge');
                reject({ error: 'New password required' });
            }
        });
    });
}

function logout() {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
        cognitoUser.signOut();
    }
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
    console.log('Logged out successfully');
    window.location.href = '/';
}

function isAuthenticated() {
    const idToken = localStorage.getItem('idToken');
    if (!idToken) return false;

    try {
        const decoded = JSON.parse(atob(idToken.split('.')[1]));
        return decoded.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

function getCurrentUser() {
    return {
        email: localStorage.getItem('email'),
        userId: localStorage.getItem('userId')
    };
}

async function refreshAccessToken() {
    return new Promise((resolve, reject) => {
        const cognitoUser = userPool.getCurrentUser();
        if (!cognitoUser) {
            reject({ error: 'No user session' });
            return;
        }

        cognitoUser.getSession((err, session) => {
            if (err) {
                reject({ error: err.message });
                return;
            }

            cognitoUser.refreshSession(session.getRefreshToken(), (err, newSession) => {
                if (err) {
                    reject({ error: err.message });
                    return;
                }

                const newIdToken = newSession.getIdToken().getJwtToken();
                localStorage.setItem('idToken', newIdToken);
                resolve({ success: true, idToken: newIdToken });
            });
        });
    });
}

function protectPage() {
    if (!isAuthenticated()) {
        window.location.href = '/';
    }
}