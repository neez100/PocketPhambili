// User management and authentication
const users = JSON.parse(localStorage.getItem('budgetUsers')) || [];

// Initialize login form
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    loginUser(email, password);
  });

  document.getElementById('registerLink').addEventListener('click', function(e) {
    e.preventDefault();
    showRegisterForm();
  });
}

// User registration
function showRegisterForm() {
  const loginContainer = document.querySelector('.login-container');
  loginContainer.innerHTML = `
    <div class="text-center">
      <img src="Images/PocketPhambili LOGO.png" alt="Logo" class="logo-login">
      <h2 class="mb-4">Create Account</h2>
    </div>
    
    <form id="registerForm">
      <div class="mb-3">
        <label for="regName" class="form-label">Full Name</label>
        <input type="text" class="form-control" id="regName" required>
      </div>
      <div class="mb-3">
        <label for="regEmail" class="form-label">Email</label>
        <input type="email" class="form-control" id="regEmail" required>
      </div>
      <div class="mb-3">
        <label for="regPassword" class="form-label">Password</label>
        <input type="password" class="form-control" id="regPassword" required>
      </div>
      <button type="submit" class="btn btn-primary w-100">Register</button>
    </form>
    
    <div class="mt-3 text-center">
      <p>Already have an account? <a href="#" id="loginLink">Login</a></p>
    </div>
  `;

  document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    registerUser(
      document.getElementById('regName').value,
      document.getElementById('regEmail').value,
      document.getElementById('regPassword').value
    );
  });

  document.getElementById('loginLink').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.reload();
  });
}

function registerUser(name, email, password) {
  // Always get the latest users from localStorage
  const users = JSON.parse(localStorage.getItem('budgetUsers')) || [];
  if (users.some(user => user.email === email)) {
    showToast('Email already registered');
    return;
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password: btoa(password), // Simple encoding (not secure for production)
    budgets: []
  };

  users.push(newUser);
  localStorage.setItem('budgetUsers', JSON.stringify(users));
  showToast('Registration successful! Please login');
  window.location.reload();
}

function loginUser(email, password) {
  // Always get the latest users from localStorage
  const users = JSON.parse(localStorage.getItem('budgetUsers')) || [];
  const user = users.find(u => u.email === email && atob(u.password) === password);
  
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'index.html';
  } else {
    showToast('Invalid email or password');
  }
}

function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

function checkAuth() {
  if (!JSON.parse(localStorage.getItem('currentUser')) && 
      !window.location.pathname.endsWith('login.html')) {
    window.location.href = 'login.html';
  }
}

// Initialize auth check
checkAuth();

// Toast notification
function showToast(message) {
  const toastElement = document.getElementById('liveToast');
  const toastBody = document.querySelector('.toast-body');
  if (toastElement && toastBody && typeof bootstrap !== 'undefined' && bootstrap.Toast) {
    const toast = new bootstrap.Toast(toastElement);
    toastBody.textContent = message;
    toast.show();
  } else {
    alert(message);
  }
}

// Add to your existing dark mode toggle functionality
function toggleLoginDarkMode(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  const container = document.querySelector('.login-container');
  if (container) {
    container.classList.toggle('dark-mode', isDark);
  }
}