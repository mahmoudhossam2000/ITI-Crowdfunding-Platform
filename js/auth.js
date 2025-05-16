// Validation functions
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

// Simple password hashing (for demo purposes)
function hashPassword(password) {
  return btoa(password); // Base64 encoding (NOT for production use)
}

// Register user
async function registerUser(event) {
  event.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  // Validation
  if (!name || name.length < 2) {
    alert("Name must be at least 2 characters long!");
    return;
  }

  if (!validateEmail(email)) {
    alert("Please enter a valid email address!");
    return;
  }

  if (!validatePassword(password)) {
    alert("Password must be at least 6 characters long!");
    return;
  }

  try {
    // Check if email already exists
    const res = await fetch(`${window.config.API_URL}/users?email=${email}`);
    const exists = await res.json();
    if (exists.length > 0) {
      alert("Email already registered!");
      return;
    }

    // Set initial status based on role
    const isActive = role === "campaigner" ? false : true; // Campaigners need approval
    const status = role === "campaigner" ? "pending" : "approved";

    const newUser = {
      name,
      email,
      password: hashPassword(password),
      role,
      isActive,
      status,
      createdAt: new Date().toISOString()
    };

    const response = await fetch(`${window.config.API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (!response.ok) throw new Error("Registration failed");

    if (role === "campaigner") {
      alert("Registration successful! Please wait for admin approval before logging in.");
    } else {
      alert("Registration successful! Please login.");
    }
    window.location.href = "login.html";
  } catch (error) {
    console.error("Registration error:", error);
    alert("Registration failed. Please try again.");
  }
}

// Check if user is logged in
function checkAuth() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

// Logout function
function logout() {
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Error handling
function showError(message) {
  const errorDiv = document.getElementById('loginError');
  if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
  } else {
      alert(message);
  }
}

// Success handling
function showSuccess(message) {
  alert(message); // You can replace this with a better UI notification
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                if (!validateEmail(email)) {
                    showError('Please enter a valid email address');
                    return;
                }

                if (!validatePassword(password)) {
                    showError('Password must be at least 6 characters long');
                    return;
                }

                // Get user from JSON server
                const response = await fetch(`${window.config.API_URL}/users?email=${email}`);
                const users = await response.json();
                const user = users[0];

                if (!user) {
                    showError('Invalid email or password');
                    return;
                }

                // Verify password
                if (user.password !== hashPassword(password)) {
                    showError('Invalid email or password');
                    return;
                }

                // Check if user is active
                if (!user.isActive) {
                    if (user.status === 'pending') {
                        showError('Your account is pending approval');
                    } else {
                        showError('Your account has been deactivated');
                    }
                    return;
                }

                // Store user info in localStorage (excluding sensitive data)
                const { password: _, ...userInfo } = user;
                localStorage.setItem('user', JSON.stringify(userInfo));

                console.log('Login successful, redirecting to:', window.config.REDIRECTS[user.role]);
                
                // Redirect based on role
                window.location.href = window.config.REDIRECTS[user.role];

            } catch (error) {
                console.error('Login error:', error);
                showError('Login failed. Please try again.');
            }
        });
    }
    
    // Handle registration form (if needed)
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', registerUser);
    }
});

// Handle logout (exposed globally)
window.logout = function() {
    localStorage.removeItem('user');
    window.location.href = 'login.html'; // Remove the leading slash
};
