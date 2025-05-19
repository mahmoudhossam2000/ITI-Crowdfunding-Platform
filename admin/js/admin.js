const API_URL = window.config.API_URL;
const campaignsList = document.getElementById("campaigns-list");
const pendingCampaignsList = document.getElementById("pending-campaigns-list");
const campaignStatusFilter = document.getElementById("campaign-status-filter");
const approveBtn = document.getElementById("approve-btn");
const rejectBtn = document.getElementById("reject-btn");
const pendingBadge = document.getElementById("pending-badge");
const usersList = document.getElementById("users-list");
const userRoleFilter = document.getElementById("user-role-filter");
const approveUserBtn = document.getElementById("approve-user-btn");
const banUserBtn = document.getElementById("ban-user-btn");

const totalUsersCount = document.getElementById("total-users-count");
const pendingCampaignsCount = document.getElementById(
  "pending-campaigns-count"
);
const activeCampaignsCount = document.getElementById("active-campaigns-count");
const totalFunds = document.getElementById("total-funds");

let allUsers = [];
let allCampaigns = [];
let selectedCampaignId = null;
let selectedUserId = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!checkAuth()) return;

  try {
    await Promise.all([loadUsers(), loadCampaigns()]);

    setupEventListeners();
    updateDashboardStats();

    const urlParams = new URLSearchParams(window.location.search);
    const campaignIdFromUrl = urlParams.get("campaign");

    if (campaignIdFromUrl) {
      const campaignsTab = document.querySelector('a[href="#campaigns"]');
      if (campaignsTab) {
        const tabInstance = new bootstrap.Tab(campaignsTab);
        tabInstance.show();
      }

      setTimeout(() => viewCampaign(campaignIdFromUrl), 500);
    }
  } catch (error) {
    console.error("Error initializing dashboard:", error);
    showError("Failed to initialize dashboard. Please refresh the page.");
  }
});

async function loadCampaigns() {
  try {
    const response = await fetch(`${API_URL}/campaigns`);
    allCampaigns = await response.json();

    displayCampaigns(allCampaigns, campaignStatusFilter.value);
    displayPendingCampaigns();

    return allCampaigns;
  } catch (error) {
    console.error("Error loading campaigns:", error);
    showError("Failed to load campaigns");
    return [];
  }
}

async function loadFilteredCampaigns(status = "all") {
  if (allCampaigns.length === 0) {
    await loadCampaigns();
  }

  displayCampaigns(allCampaigns, status);
}

async function loadUsers() {
  try {
    const response = await fetch(`${API_URL}/users`);
    allUsers = await response.json();

    displayUsers(allUsers, userRoleFilter.value);

    return allUsers;
  } catch (error) {
    console.error("Error loading users:", error);
    showError("Failed to load users");
    return [];
  }
}

async function loadFilteredUsers(role = "all") {
  if (allUsers.length === 0) {
    await loadUsers();
  }

  displayUsers(allUsers, role);
}

function updateDashboardStats() {
  totalUsersCount.textContent = allUsers.length;

  const pendingCount = allCampaigns.filter(
    (c) => !c.isApproved && c.status === "pending"
  ).length;
  pendingCampaignsCount.textContent = pendingCount;
  pendingBadge.textContent = pendingCount;

  activeCampaignsCount.textContent = allCampaigns.filter(
    (c) => c.isApproved && c.status === "active"
  ).length;

  const totalRaised = allCampaigns.reduce(
    (total, campaign) => total + (campaign.currentAmount || 0),
    0
  );
  totalFunds.textContent = `$${totalRaised.toLocaleString()}`;
}

function getUserNameById(userId) {
  if (!userId) return "Unknown";

  const user = allUsers.find(
    (u) =>
      u.id === userId ||
      u.id === String(userId) ||
      Number(u.id) === Number(userId)
  );
  return user ? user.name : "Unknown";
}

function displayCampaigns(campaigns, status = "all") {
  let filteredCampaigns = campaigns;
  if (status === "pending") {
    filteredCampaigns = campaigns.filter(
      (c) => !c.isApproved && c.status === "pending"
    );
  } else if (status === "active") {
    filteredCampaigns = campaigns.filter(
      (c) => c.isApproved && c.status === "active"
    );
  } else if (status === "rejected") {
    filteredCampaigns = campaigns.filter(
      (c) => !c.isApproved && c.status === "rejected"
    );
  }

  if (filteredCampaigns.length === 0) {
    campaignsList.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <p class="text-muted mb-0">No campaigns found.</p>
                </td>
            </tr>
        `;
    return;
  }

  campaignsList.innerHTML = filteredCampaigns
    .map((campaign) => {
      let statusClass = "";
      if (campaign.status === "pending" || !campaign.isApproved) {
        statusClass = "status-pending";
      } else if (campaign.status === "rejected") {
        statusClass = "status-rejected";
      } else {
        statusClass = "status-approved";
      }

      const createdDate = campaign.createdAt
        ? new Date(campaign.createdAt).toLocaleDateString()
        : "N/A";

      const creatorName = getUserNameById(campaign.creatorId);

      const imagePath = getImagePath(campaign.image);

      return `
            <tr>
                <td>
                    <img src="${imagePath}" class="campaign-image" alt="${
        campaign.title
      }" 
                         onerror="this.src='../assets/images/90112949_1743953827906232_r.webp'">
                </td>
                <td>${campaign.title}</td>
                <td>${creatorName}</td>
                <td>$${campaign.goal.toLocaleString()}</td>
                <td>${createdDate}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${
                          campaign.isApproved
                            ? "Approved"
                            : campaign.status === "rejected"
                            ? "Rejected"
                            : "Pending"
                        }
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary action-btn" 
                            onclick="viewCampaign('${campaign.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${
                      !campaign.isApproved && campaign.status !== "rejected"
                        ? `
                        <button class="btn btn-sm btn-outline-success action-btn" 
                                onclick="approveCampaign('${campaign.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger action-btn" 
                                onclick="rejectCampaign('${campaign.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    `
                        : ""
                    }
                    <button class="btn btn-sm btn-outline-danger action-btn" 
                            onclick="confirmDeleteCampaign('${campaign.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    })
    .join("");
}

function displayPendingCampaigns() {
  const pendingCampaigns = allCampaigns.filter(
    (c) => !c.isApproved && c.status === "pending"
  );

  if (pendingCampaigns.length === 0) {
    pendingCampaignsList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <p class="text-muted mb-0">No pending campaigns found.</p>
                </td>
            </tr>
        `;
    return;
  }

  pendingCampaignsList.innerHTML = pendingCampaigns
    .map((campaign) => {
      const createdDate = campaign.createdAt
        ? new Date(campaign.createdAt).toLocaleDateString()
        : "N/A";

      const creatorName = getUserNameById(campaign.creatorId);

      const imagePath = getImagePath(campaign.image);

      return `
            <tr>
                <td>
                    <img src="${imagePath}" class="campaign-image" alt="${
        campaign.title
      }" 
                         onerror="this.src='../assets/images/90112949_1743953827906232_r.webp'">
                </td>
                <td>${campaign.title}</td>
                <td>${creatorName}</td>
                <td>$${campaign.goal.toLocaleString()}</td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary action-btn" 
                            onclick="viewCampaign('${campaign.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success action-btn" 
                            onclick="approveCampaign('${campaign.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger action-btn" 
                            onclick="rejectCampaign('${campaign.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger action-btn" 
                            onclick="confirmDeleteCampaign('${campaign.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    })
    .join("");
}

function displayUsers(users, role = "all") {
  let filteredUsers = users;
  if (role !== "all") {
    filteredUsers = users.filter((u) => u.role === role);
  }

  if (filteredUsers.length === 0) {
    usersList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <p class="text-muted mb-0">No users found.</p>
                </td>
            </tr>
        `;
    return;
  }

  usersList.innerHTML = filteredUsers
    .map((user) => {
      const createdDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString()
        : "N/A";
      let statusBadge = "";
      if (!user.isActive) {
        statusBadge =
          '<span class="status-badge status-rejected">Banned</span>';
      } else if (user.status === "pending") {
        statusBadge =
          '<span class="status-badge status-pending">Pending</span>';
      } else if (user.status === "approved") {
        statusBadge =
          '<span class="status-badge status-approved">Approved</span>';
      } else {
        statusBadge =
          '<span class="status-badge status-approved">Active</span>';
      }

      let actionButtons = `
            <button class="btn btn-sm btn-outline-primary action-btn" 
                    onclick="viewUser('${user.id}')">
                <i class="fas fa-eye"></i>
            </button>
        `;

      if (user.role === "campaigner" && user.status === "pending") {
        actionButtons += `
                <button class="btn btn-sm btn-outline-success action-btn" 
                        onclick="approveUser('${user.id}')">
                    <i class="fas fa-check"></i>
                </button>
            `;
      }

      if (user.role !== "admin") {
        actionButtons += `
                <button class="btn btn-sm btn-outline-danger action-btn" 
                        onclick="toggleUserBan('${user.id}')">
                    ${
                      user.isActive
                        ? '<i class="fas fa-ban"></i>'
                        : '<i class="fas fa-undo"></i>'
                    }
                </button>
            `;
      }

      return `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${
                  user.role.charAt(0).toUpperCase() + user.role.slice(1)
                }</td>
                <td>${statusBadge}</td>
                <td>${createdDate}</td>
                <td>
                    ${actionButtons}
                </td>
            </tr>
        `;
    })
    .join("");
}

function getImagePath(imagePath) {
  if (!imagePath) return "../assets/images/90112949_1743953827906232_r.webp";

  if (imagePath.startsWith("data:")) {
    return imagePath;
  } else if (imagePath.startsWith("http")) {
    return imagePath;
  } else if (
    imagePath.includes("imgur.com") ||
    imagePath.includes("postimages.org")
  ) {
    return imagePath;
  } else {
    return `../${
      imagePath.startsWith("/") ? imagePath.substring(1) : imagePath
    }`;
  }
}

async function viewCampaign(campaignId) {
  try {
    const campaign = currentCampaigns.find((c) => c.id === campaignId);
    if (!campaign) throw new Error("Campaign not found");

    selectedCampaignId = campaignId;

    const creatorName = getUserNameById(campaign.creatorId);

    const campaignDetails = document.getElementById("campaign-details");
    const campaignModal = new bootstrap.Modal(
      document.getElementById("campaignModal")
    );

    const deadline = new Date(campaign.deadline).toLocaleDateString();
    const progress = ((campaign.currentAmount / campaign.goal) * 100).toFixed(
      1
    );
    const imagePath = getImagePath(campaign.image);

    campaignDetails.innerHTML = `
            <div class="row">
                <div class="col-md-5">
                    <img src="${imagePath}" class="img-fluid rounded" alt="${
      campaign.title
    }"
                         onerror="this.src='../assets/images/90112949_1743953827906232_r.webp'">
                </div>
                <div class="col-md-7">
                    <h3>${campaign.title}</h3>
                    <p class="text-muted">Created by: ${creatorName}</p>
                    
                    <div class="progress mb-3">
                        <div class="progress-bar bg-primary" role="progressbar" style="width: ${progress}%" 
                             aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                            ${progress}%
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-6">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <h5 class="mb-0">$${campaign.currentAmount.toLocaleString()}</h5>
                                    <small class="text-muted">of $${campaign.goal.toLocaleString()} goal</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <h5 class="mb-0">${deadline}</h5>
                                    <small class="text-muted">Deadline</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <h5>Status</h5>
                        <span class="status-badge ${
                          campaign.isApproved
                            ? "status-approved"
                            : campaign.status === "rejected"
                            ? "status-rejected"
                            : "status-pending"
                        }">
                            ${
                              campaign.isApproved
                                ? "Approved"
                                : campaign.status === "rejected"
                                ? "Rejected"
                                : "Pending"
                            }
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <h5>Campaign Description</h5>
                <p>${campaign.description}</p>
            </div>
            
            ${
              campaign.rewards && campaign.rewards.length > 0
                ? `
                <div class="mt-4">
                    <h5>Rewards</h5>
                    <div class="row">
                        ${campaign.rewards
                          .map(
                            (reward) => `
                            <div class="col-md-6 mb-3">
                                <div class="card">
                                    <div class="card-body">
                                        <h6>${reward.title}</h6>
                                        <p class="text-primary mb-2">$${reward.amount}</p>
                                        <p class="mb-0">${reward.description}</p>
                                    </div>
                                </div>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
            `
                : ""
            }
        `;

    const campaignActions = document.getElementById("campaign-actions");
    if (!campaign.isApproved && campaign.status !== "rejected") {
      approveBtn.style.display = "block";
      rejectBtn.style.display = "block";
    } else {
      approveBtn.style.display = "none";
      rejectBtn.style.display = "none";
    }

    campaignModal.show();
  } catch (error) {
    console.error("Error viewing campaign:", error);
    showError("Failed to load campaign details");
  }
}

async function approveCampaign(campaignId) {
  try {
    const campaign = allCampaigns.find((c) => c.id === campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const updatedCampaign = {
      ...campaign,
      isApproved: true,
      status: "active",
    };

    await fetch(`${API_URL}/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isApproved: true,
        status: "active",
      }),
    });

    await loadCampaigns();

    const campaignModal = bootstrap.Modal.getInstance(
      document.getElementById("campaignModal")
    );
    if (campaignModal) campaignModal.hide();

    showSuccess("Campaign approved successfully!");
  } catch (error) {
    console.error("Error approving campaign:", error);
    showError("Failed to approve campaign");
  }
}

async function rejectCampaign(campaignId) {
  try {
    const campaign = currentCampaigns.find((c) => c.id === campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const updatedCampaign = {
      ...campaign,
      isApproved: false,
      status: "rejected",
    };

    await fetch(`${API_URL}/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isApproved: false,
        status: "rejected",
      }),
    });

    await loadCampaigns(statusFilter.value);

    const campaignModal = bootstrap.Modal.getInstance(
      document.getElementById("campaignModal")
    );
    if (campaignModal) campaignModal.hide();

    showSuccess("Campaign rejected successfully!");
  } catch (error) {
    console.error("Error rejecting campaign:", error);
    showError("Failed to reject campaign");
  }
}

function confirmDeleteCampaign(campaignId) {
  if (confirm("Are you sure you want to delete this campaign?")) {
    deleteCampaign(campaignId);
  }
}

async function deleteCampaign(campaignId) {
  try {
    await fetch(`${API_URL}/campaigns/${campaignId}`, {
      method: "DELETE",
    });

    await loadCampaigns(statusFilter.value);

    showSuccess("Campaign deleted successfully!");
  } catch (error) {
    console.error("Error deleting campaign:", error);
    showError("Failed to delete campaign");
  }
}

function checkAuth() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.role !== "admin") {
    window.location.href = "../login.html";
    return false;
  }
  return true;
}

function setupEventListeners() {
  campaignStatusFilter.addEventListener("change", async () => {
    await loadFilteredCampaigns(campaignStatusFilter.value);
  });

  userRoleFilter.addEventListener("change", async () => {
    await loadFilteredUsers(userRoleFilter.value);
  });

  approveBtn.addEventListener("click", () => {
    if (selectedCampaignId) {
      approveCampaign(selectedCampaignId);
    }
  });

  rejectBtn.addEventListener("click", () => {
    if (selectedCampaignId) {
      rejectCampaign(selectedCampaignId);
    }
  });

  approveUserBtn.addEventListener("click", () => {
    if (selectedUserId) {
      approveUser(selectedUserId);
    }
  });

  banUserBtn.addEventListener("click", () => {
    if (selectedUserId) {
      toggleUserBan(selectedUserId);
    }
  });
}

async function viewUser(userId) {
  try {
    const user = allUsers.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");

    selectedUserId = userId;

    const userDetails = document.getElementById("user-details");
    const userModal = new bootstrap.Modal(document.getElementById("userModal"));

    const createdDate = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString()
      : "N/A";

    approveUserBtn.style.display =
      user.role === "campaigner" && user.status === "pending"
        ? "block"
        : "none";
    banUserBtn.textContent = user.isActive ? "Ban User" : "Unban User";
    banUserBtn.style.display = user.role !== "admin" ? "block" : "none";

    let statusText = "";
    if (!user.isActive) {
      statusText = '<span class="status-badge status-rejected">Banned</span>';
    } else if (user.status === "pending") {
      statusText = '<span class="status-badge status-pending">Pending</span>';
    } else if (user.status === "approved") {
      statusText = '<span class="status-badge status-approved">Approved</span>';
    } else {
      statusText = '<span class="status-badge status-approved">Active</span>';
    }

    userDetails.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Name</label>
                        <p>${user.name}</p>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Email</label>
                        <p>${user.email}</p>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Role</label>
                        <p>${
                          user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        }</p>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Status</label>
                        <p>${statusText}</p>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Created At</label>
                        <p>${createdDate}</p>
                    </div>
                </div>
            </div>
        `;

    userModal.show();
  } catch (error) {
    console.error("Error viewing user:", error);
    showError("Failed to load user details");
  }
}

async function approveUser(userId) {
  try {
    const user = allUsers.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");

    if (user.role !== "campaigner" || user.status !== "pending") {
      throw new Error("This user is not a pending campaigner");
    }

    const updatedUser = {
      ...user,
      status: "approved",
    };

    await fetch(`${API_URL}/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "approved",
      }),
    });

    await loadUsers();

    const userModal = bootstrap.Modal.getInstance(
      document.getElementById("userModal")
    );
    if (userModal) userModal.hide();

    showSuccess("User approved successfully!");
  } catch (error) {
    console.error("Error approving user:", error);
    showError("Failed to approve user: " + error.message);
  }
}

async function toggleUserBan(userId) {
  try {
    const user = allUsers.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");

    if (user.role === "admin") {
      throw new Error("Admin users cannot be banned");
    }

    const newActiveStatus = !user.isActive;
    await fetch(`${API_URL}/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isActive: newActiveStatus,
      }),
    });

    await loadUsers();

    const userModal = bootstrap.Modal.getInstance(
      document.getElementById("userModal")
    );
    if (userModal) userModal.hide();

    showSuccess(
      `User ${newActiveStatus ? "unbanned" : "banned"} successfully!`
    );
  } catch (error) {
    console.error("Error toggling user ban status:", error);
    showError("Failed to update user status: " + error.message);
  }
}

function showError(message) {
  alert(message);
}

function showSuccess(message) {
  alert(message);
}
function logout() {
  localStorage.removeItem("user");
  window.location.href = "../login.html";
}

window.viewCampaign = viewCampaign;
window.approveCampaign = approveCampaign;
window.rejectCampaign = rejectCampaign;
window.confirmDeleteCampaign = confirmDeleteCampaign;
window.viewUser = viewUser;
window.approveUser = approveUser;
window.toggleUserBan = toggleUserBan;
window.logout = logout;
