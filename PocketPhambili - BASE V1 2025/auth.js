// auth.js - Complete Authentication System

const usersKey = 'budgetUsers';
const currentUserKey = 'currentUser';

// Initialize authentication system
function initAuth() {
    // Create users array if it doesn't exist
    if (!localStorage.getItem(usersKey)) {
        localStorage.setItem(usersKey, JSON.stringify([]));
    }

    // Setup login form
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            if (!email || !password) {
                showToast('Please fill in all fields');
                return;
            }

            loginUser(email, password, rememberMe);
        });
    }

    // Setup registration form
    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;

            if (!name || !email || !password) {
                showToast('Please fill in all fields');
                return;
            }

            if (password.length < 6) {
                showToast('Password must be at least 6 characters');
                return;
            }

            registerUser(name, email, password);
        });
    }

    // Setup forgot password form
    if (document.getElementById('forgotPasswordForm')) {
        document.getElementById('forgotPasswordForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value.trim();

            if (!email) {
                showToast('Please enter your email');
                return;
            }

            resetPassword(email);
        });
    }

    // Check authentication on all pages
    checkAuth();
}

// User management functions
function getUsers() {
    return JSON.parse(localStorage.getItem(usersKey)) || [];
}

function setUsers(users) {
    localStorage.setItem(usersKey, JSON.stringify(users));
}

function getCurrentUser() {
    return localStorage.getItem(currentUserKey);
}

function setCurrentUser(email) {
    localStorage.setItem(currentUserKey, email);
}

// Authentication functions
function loginUser(email, password, rememberMe = false) {
    const users = getUsers();
    const user = users.find(u => u.email === email.toLowerCase() && atob(u.password) === password);

    if (user) {
        setCurrentUser(user.email);
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
        showToast('Login successful!');
        setTimeout(() => window.location.href = 'index.html', 1000);
    } else {
        showToast('Invalid email or password');
    }
}

function registerUser(name, email, password) {
    const users = getUsers();

    if (users.some(user => user.email === email.toLowerCase())) {
        showToast('Email already registered');
        return;
    }

    const newUser = {
        id: Date.now(),
        name,
        email: email.toLowerCase(),
        password: btoa(password), // Simple encoding (not secure for production)
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    setUsers(users);

    showToast('Registration successful! Please login');
    setTimeout(() => {
        document.getElementById('regName').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('showLogin').click();
    }, 1500);
}

function resetPassword(email) {
    const users = getUsers();
    const user = users.find(u => u.email === email.toLowerCase());

    if (user) {
        // In a real app, you would send a password reset email here
        showToast(`Password reset link sent to ${email} (demo)`);
        setTimeout(() => document.getElementById('backToLogin').click(), 2000);
    } else {
        showToast('No account found with that email');
    }
}

function logout() {
    localStorage.removeItem(currentUserKey);
    window.location.href = 'login.html';
}

// Auth check
function checkAuth() {
    const currentUser = getCurrentUser();
    const isLoginPage = window.location.pathname.includes('login.html') ||
                       window.location.pathname === '/' ||
                       window.location.pathname === '/index.html' && window.location.href.includes('login.html');

    // Redirect to login if not authenticated and not on login page
    if (!currentUser && !isLoginPage) {
        window.location.href = 'login.html';
    }

    // Redirect to dashboard if already logged in and on login page
    if (currentUser && isLoginPage) {
        window.location.href = 'index.html';
    }
}

// Toast notification
function showToast(message) {
    const toastEl = document.getElementById('liveToast');
    const toastBody = toastEl?.querySelector('.toast-body');

    if (toastEl && toastBody) {
        toastBody.textContent = message;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    } else {
        alert(message);
    }
}

// Initialize auth system when loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

// Export functions for other scripts
window.auth = {
    getCurrentUser,
    logout,
    showToast
};