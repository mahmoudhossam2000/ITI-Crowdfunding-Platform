import { loadHeader } from "../components/header.js";
import { loadFooter } from "../components/footer.js";

document.getElementById("header").innerHTML = loadHeader();
document.getElementById("footer").innerHTML = loadFooter();
const profileForm = document.getElementById("profile-form");
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const profileRole = document.getElementById("profile-role");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const currentPasswordInput = document.getElementById("currentPassword");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const saveProfileBtn = document.getElementById("save-profile-btn");
const cancelBtn = document.getElementById("cancel-btn");
const alertContainer = document.getElementById("profile-alert-container");

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

const checkAuth = () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/login.html";
    return false;
  }
  return true;
};

const loadProfile = () => {
  const user = getCurrentUser();
  if (!user) return;

  profileName.textContent = user.name || "User";
  profileEmail.textContent = user.email || "";
  const formattedRole = user.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "User";
  profileRole.textContent = formattedRole;
  nameInput.value = user.name || "";
  emailInput.value = user.email || "";

  currentPasswordInput.value = "";
  newPasswordInput.value = "";
  confirmPasswordInput.value = "";
};

const showAlert = (message, type = "danger") => {
  alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

  setTimeout(() => {
    const alert = document.querySelector(".alert");
    if (alert) {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      bsAlert.close();
    }
  }, 5000);
};

const updateProfile = async (e) => {
  e.preventDefault();

  const user = getCurrentUser();
  if (!user) return;

  try {
    const name = nameInput.value.trim();
    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    const isChangingPassword =
      newPassword.length > 0 || confirmPassword.length > 0;
    if (isChangingPassword) {
      if (!currentPassword) {
        throw new Error("Current password is required to change password");
      }

      if (!newPassword) {
        throw new Error("New password is required");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
      }

      if (newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters");
      }
    }

    const updateData = {};
    if (name && name !== user.name) {
      updateData.name = name;
    }
    if (isChangingPassword) {
      if (currentPassword !== "password") {
        throw new Error("Current password is incorrect");
      }

      updateData.password = newPassword;
    }

    if (Object.keys(updateData).length === 0) {
      showAlert("No changes to save", "info");
      return;
    }
    const response = await fetch(`${window.config.API_URL}/users/${user.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error("Failed to update profile");
    }

    const updatedUserResponse = await fetch(
      `${window.config.API_URL}/users/${user.id}`
    );
    if (!updatedUserResponse.ok) {
      throw new Error("Failed to fetch updated user data");
    }

    const updatedUser = await updatedUserResponse.json();
    localStorage.setItem("user", JSON.stringify(updatedUser));

    showAlert("Profile updated successfully!", "success");

    loadProfile();
  } catch (error) {
    console.error("Error updating profile:", error);
    showAlert(error.message || "Failed to update profile");
  }
};

const initProfile = () => {
  if (!checkAuth()) return;

  loadProfile();

  profileForm.addEventListener("submit", updateProfile);

  cancelBtn.addEventListener("click", () => {
    loadProfile();
  });
};

document.addEventListener("DOMContentLoaded", initProfile);
