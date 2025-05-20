function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

function hashPassword(password) {
  return btoa(password);
}

async function registerUser(event) {
  event.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

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
    const res = await fetch(`${window.config.API_URL}/users?email=${email}`);
    const exists = await res.json();
    if (exists.length > 0) {
      alert("Email already registered!");
      return;
    }

    const isActive = role === "campaigner" ? false : true;
    const status = role === "campaigner" ? "pending" : "approved";

    const newUser = {
      name,
      email,
      password: hashPassword(password),
      role,
      isActive,
      status,
      createdAt: new Date().toISOString(),
    };

    const response = await fetch(`${window.config.API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (!response.ok) throw new Error("Registration failed");

    if (role === "campaigner") {
      alert(
        "Registration successful! Please wait for admin approval before logging in."
      );
    } else {
      alert("Registration successful! Please login.");
    }
    window.location.href = "login.html";
  } catch (error) {
    console.error("Registration error:", error);
    alert("Registration failed. Please try again.");
  }
}

function checkAuth() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

function logout() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const role = user.role;
  localStorage.removeItem("user");

  if (role === "backer" || role === "campaigner") {
    window.location.href = window.location.pathname.includes("/")
      ? "/index.html"
      : "index.html";
  } else {
    window.location.href = window.location.pathname.includes("/")
      ? "/login.html"
      : "login.html";
  }
}

function showError(message) {
  const errorDiv = document.getElementById("loginError");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  } else {
    alert(message);
  }
}

function showSuccess(message) {
  // alert(message);
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if (!validateEmail(email)) {
          showError("Please enter a valid email address");
          return;
        }

        if (!validatePassword(password)) {
          showError("Password must be at least 6 characters long");
          return;
        }

        const response = await fetch(
          `${window.config.API_URL}/users?email=${email}`
        );
        const users = await response.json();
        const user = users[0];

        if (!user) {
          showError("Invalid email or password");
          return;
        }

        if (user.password !== hashPassword(password)) {
          showError("Invalid email or password");
          return;
        }

        if (!user.isActive) {
          if (user.status === "pending") {
            showError("Your account is pending approval");
          } else {
            showError("Your account has been deactivated");
          }
          return;
        }

        const { password: _, ...userInfo } = user;
        localStorage.setItem("user", JSON.stringify(userInfo));

        console.log(
          "Login successful, redirecting to:",
          window.config.REDIRECTS[user.role]
        );

        window.location.href = window.config.REDIRECTS[user.role];
      } catch (error) {
        console.error("Login error:", error);
        showError("Login failed. Please try again.");
      }
    });
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", registerUser);
  }
});

window.logout = function () {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const role = user.role;
  localStorage.removeItem("user");

  if (role === "backer" || role === "campaigner") {
    window.location.href = window.location.pathname.includes("/")
      ? "/index.html"
      : "index.html";
  } else {
    window.location.href = window.location.pathname.includes("/")
      ? "/login.html"
      : "login.html";
  }
};
