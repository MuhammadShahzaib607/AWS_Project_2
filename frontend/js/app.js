document.addEventListener('DOMContentLoaded', function() {
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const confirmationSection = document.getElementById('confirmationSection');

    loginTab.addEventListener('click', function() {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.remove('hidden');
        confirmationSection.classList.add('hidden');
    });

    signupTab.addEventListener('click', function() {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.remove('hidden');
        confirmationSection.classList.add('hidden');
    });

    document.getElementById('loginBtn').addEventListener('click', async function() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const messageArea = document.getElementById('loginMessage');

        if (!email || !password) {
            messageArea.textContent = 'Please enter email and password';
            messageArea.className = 'message-area error';
            return;
        }

        messageArea.textContent = '';
        loginTab.disabled = true;
        document.getElementById('loginBtnText').classList.add('hidden');
        document.getElementById('loginSpinner').classList.remove('hidden');

        try {
            const result = await login(email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            messageArea.textContent = error.error || 'Login failed';
            messageArea.className = 'message-area error';
        } finally {
            loginTab.disabled = false;
            document.getElementById('loginBtnText').classList.remove('hidden');
            document.getElementById('loginSpinner').classList.add('hidden');
        }
    });

    document.getElementById('signupBtn').addEventListener('click', async function() {
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const messageArea = document.getElementById('signupMessage');

        if (!email || !password) {
            messageArea.textContent = 'Please enter email and password';
            messageArea.className = 'message-area error';
            return;
        }

        if (password.length < 8) {
            messageArea.textContent = 'Password must be at least 8 characters';
            messageArea.className = 'message-area error';
            return;
        }

        messageArea.textContent = '';
        signupTab.disabled = true;
        document.getElementById('signupBtnText').classList.add('hidden');
        document.getElementById('signupSpinner').classList.remove('hidden');

        try {
            const result = await signup(email, password);
            messageArea.textContent = result.message;
            messageArea.className = 'message-area success';
            confirmationSection.classList.remove('hidden');
        } catch (error) {
            messageArea.textContent = error.error || 'Signup failed';
            messageArea.className = 'message-area error';
        } finally {
            signupTab.disabled = false;
            document.getElementById('signupBtnText').classList.remove('hidden');
            document.getElementById('signupSpinner').classList.add('hidden');
        }
    });

    document.getElementById('confirmBtn').addEventListener('click', async function() {
        const email = document.getElementById('signupEmail').value;
        const code = document.getElementById('confirmationCode').value;
        const messageArea = document.getElementById('confirmationMessage');

        if (!code) {
            messageArea.textContent = 'Please enter verification code';
            messageArea.className = 'message-area error';
            return;
        }

        messageArea.textContent = '';
        signupTab.disabled = true;
        document.getElementById('confirmBtnText').classList.add('hidden');
        document.getElementById('confirmSpinner').classList.remove('hidden');

        try {
            const result = await confirmSignup(email, code);
            messageArea.textContent = result.message;
            messageArea.className = 'message-area success';
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            messageArea.textContent = error.error || 'Verification failed';
            messageArea.className = 'message-area error';
        } finally {
            signupTab.disabled = false;
            document.getElementById('confirmBtnText').classList.remove('hidden');
            document.getElementById('confirmSpinner').classList.add('hidden');
        }
    });
});