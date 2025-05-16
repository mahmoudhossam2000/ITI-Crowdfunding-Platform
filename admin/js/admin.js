// Constants
const API_URL = window.config.API_URL;
// Campaign elements
const campaignsList = document.getElementById('campaigns-list');
const pendingCampaignsList = document.getElementById('pending-campaigns-list');
const campaignStatusFilter = document.getElementById('campaign-status-filter');
const approveBtn = document.getElementById('approve-btn');
const rejectBtn = document.getElementById('reject-btn');
const pendingBadge = document.getElementById('pending-badge');

// User elements
const usersList = document.getElementById('users-list');
const userRoleFilter = document.getElementById('user-role-filter');
const approveUserBtn = document.getElementById('approve-user-btn');
const banUserBtn = document.getElementById('ban-user-btn');

// Dashboard stats elements
const totalUsersCount = document.getElementById('total-users-count');
const pendingCampaignsCount = document.getElementById('pending-campaigns-count');
const activeCampaignsCount = document.getElementById('active-campaigns-count');
const totalFunds = document.getElementById('total-funds');

// Global variables
let allUsers = [];
let allCampaigns = [];
let selectedCampaignId = null;
let selectedUserId = null;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;
    
    try {
        // Load all data
        await Promise.all([
            loadUsers(),
            loadCampaigns()
        ]);
        
        // Setup event listeners
        setupEventListeners();
        
        // Update dashboard stats
        updateDashboardStats();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to initialize dashboard. Please refresh the page.');
    }
});

// Load all campaigns
async function loadCampaigns() {
    try {
        const response = await fetch(`${API_URL}/campaigns`);
        allCampaigns = await response.json();
        
        // Display campaigns in both tabs
        displayCampaigns(allCampaigns, campaignStatusFilter.value);
        displayPendingCampaigns();
        
        return allCampaigns;
    } catch (error) {
        console.error('Error loading campaigns:', error);
        showError('Failed to load campaigns');
        return [];
    }
}

// Load campaigns with filtered status
async function loadFilteredCampaigns(status = 'all') {
    if (allCampaigns.length === 0) {
        await loadCampaigns();
    }
    
    displayCampaigns(allCampaigns, status);
}

// Load all users
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        allUsers = await response.json();
        
        // Display users
        displayUsers(allUsers, userRoleFilter.value);
        
        return allUsers;
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
        return [];
    }
}

// Load users with filtered role
async function loadFilteredUsers(role = 'all') {
    if (allUsers.length === 0) {
        await loadUsers();
    }
    
    displayUsers(allUsers, role);
}

// Update dashboard stats
function updateDashboardStats() {
    // Count users
    totalUsersCount.textContent = allUsers.length;
    
    // Count pending campaigns
    const pendingCount = allCampaigns.filter(c => !c.isApproved && c.status === 'pending').length;
    pendingCampaignsCount.textContent = pendingCount;
    pendingBadge.textContent = pendingCount;
    
    // Count active campaigns
    activeCampaignsCount.textContent = allCampaigns.filter(c => c.isApproved && c.status === 'active').length;
    
    // Calculate total funds raised
    const totalRaised = allCampaigns.reduce((total, campaign) => total + (campaign.currentAmount || 0), 0);
    totalFunds.textContent = `$${totalRaised.toLocaleString()}`;
}

// Get user name by ID
function getUserNameById(userId) {
    // Check if userId is undefined or null
    if (!userId) return 'Unknown';
    
    // Find user by ID (handling string/number type differences)
    const user = allUsers.find(u => u.id === userId || u.id === String(userId) || Number(u.id) === Number(userId));
    return user ? user.name : 'Unknown';
}

// Display campaigns in the campaigns tab with filtering
function displayCampaigns(campaigns, status = 'all') {
    // Filter campaigns based on status
    let filteredCampaigns = campaigns;
    if (status === 'pending') {
        filteredCampaigns = campaigns.filter(c => !c.isApproved && c.status === 'pending');
    } else if (status === 'active') {
        filteredCampaigns = campaigns.filter(c => c.isApproved && c.status === 'active');
    } else if (status === 'rejected') {
        filteredCampaigns = campaigns.filter(c => !c.isApproved && c.status === 'rejected');
    }
    
    // Display no campaigns message if none found
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
    
    // Generate campaign rows
    campaignsList.innerHTML = filteredCampaigns.map(campaign => {
        // Get status badge class
        let statusClass = '';
        if (campaign.status === 'pending' || !campaign.isApproved) {
            statusClass = 'status-pending';
        } else if (campaign.status === 'rejected') {
            statusClass = 'status-rejected';
        } else {
            statusClass = 'status-approved';
        }
        
        // Format creation date
        const createdDate = campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A';
        
        // Get creator name
        const creatorName = getUserNameById(campaign.creatorId);
        
        // Get correct image path
        const imagePath = getImagePath(campaign.image);
        
        return `
            <tr>
                <td>
                    <img src="${imagePath}" class="campaign-image" alt="${campaign.title}" 
                         onerror="this.src='../assets/images/90112949_1743953827906232_r.webp'">
                </td>
                <td>${campaign.title}</td>
                <td>${creatorName}</td>
                <td>$${campaign.goal.toLocaleString()}</td>
                <td>${createdDate}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${campaign.isApproved ? 'Approved' : (campaign.status === 'rejected' ? 'Rejected' : 'Pending')}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary action-btn" 
                            onclick="viewCampaign('${campaign.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${!campaign.isApproved && campaign.status !== 'rejected' ? `
                        <button class="btn btn-sm btn-outline-success action-btn" 
                                onclick="approveCampaign('${campaign.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger action-btn" 
                                onclick="rejectCampaign('${campaign.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-outline-danger action-btn" 
                            onclick="confirmDeleteCampaign('${campaign.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Display pending campaigns in the separate pending campaigns tab
function displayPendingCampaigns() {
    const pendingCampaigns = allCampaigns.filter(c => !c.isApproved && c.status === 'pending');
    
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
    
    pendingCampaignsList.innerHTML = pendingCampaigns.map(campaign => {
        // Format creation date
        const createdDate = campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A';
        
        // Get creator name
        const creatorName = getUserNameById(campaign.creatorId);
        
        // Get correct image path
        const imagePath = getImagePath(campaign.image);
        
        return `
            <tr>
                <td>
                    <img src="${imagePath}" class="campaign-image" alt="${campaign.title}" 
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
    }).join('');
}

// Display users in the users tab with filtering
function displayUsers(users, role = 'all') {
    // Filter users based on role
    let filteredUsers = users;
    if (role !== 'all') {
        filteredUsers = users.filter(u => u.role === role);
    }
    
    // Display no users message if none found
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
    
    // Generate user rows
    usersList.innerHTML = filteredUsers.map(user => {
        // Format creation date
        const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
        
        // Get appropriate status badge
        let statusBadge = '';
        if (!user.isActive) {
            statusBadge = '<span class="status-badge status-rejected">Banned</span>';
        } else if (user.status === 'pending') {
            statusBadge = '<span class="status-badge status-pending">Pending</span>';
        } else if (user.status === 'approved') {
            statusBadge = '<span class="status-badge status-approved">Approved</span>';
        } else {
            statusBadge = '<span class="status-badge status-approved">Active</span>';
        }
        
        // Determine action buttons based on user status
        let actionButtons = `
            <button class="btn btn-sm btn-outline-primary action-btn" 
                    onclick="viewUser('${user.id}')">
                <i class="fas fa-eye"></i>
            </button>
        `;
        
        // Show approve button for pending campaigners
        if (user.role === 'campaigner' && user.status === 'pending') {
            actionButtons += `
                <button class="btn btn-sm btn-outline-success action-btn" 
                        onclick="approveUser('${user.id}')">
                    <i class="fas fa-check"></i>
                </button>
            `;
        }
        
        // Show ban/unban button for all users except admin
        if (user.role !== 'admin') {
            actionButtons += `
                <button class="btn btn-sm btn-outline-danger action-btn" 
                        onclick="toggleUserBan('${user.id}')">
                    ${user.isActive ? '<i class="fas fa-ban"></i>' : '<i class="fas fa-undo"></i>'}
                </button>
            `;
        }
        
        return `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                <td>${statusBadge}</td>
                <td>${createdDate}</td>
                <td>
                    ${actionButtons}
                </td>
            </tr>
        `;
    }).join('');
}

// Get proper image path
function getImagePath(imagePath) {
    if (!imagePath) return '../assets/images/90112949_1743953827906232_r.webp';
    
    // Handle different image path formats
    if (imagePath.startsWith('data:')) {
        return imagePath; // Base64 data URL
    } else if (imagePath.startsWith('http')) {
        return imagePath; // External URL (from image hosting services)
    } else if (imagePath.includes('imgur.com') || imagePath.includes('postimages.org')) {
        return imagePath; // External image hosting URL
    } else {
        // Local path - ensure it has the correct relative path
        return `../${imagePath.startsWith('/') ? imagePath.substring(1) : imagePath}`;
    }
}

// View campaign details
async function viewCampaign(campaignId) {
    try {
        const campaign = currentCampaigns.find(c => c.id === campaignId);
        if (!campaign) throw new Error('Campaign not found');
        
        selectedCampaignId = campaignId;
        
        // Get creator name
        const creatorName = getUserNameById(campaign.creatorId);
        
        // Update modal content
        const campaignDetails = document.getElementById('campaign-details');
        const campaignModal = new bootstrap.Modal(document.getElementById('campaignModal'));
        
        // Format deadline
        const deadline = new Date(campaign.deadline).toLocaleDateString();
        
        // Calculate campaign progress
        const progress = (campaign.currentAmount / campaign.goal * 100).toFixed(1);
        
        // Get correct image path
        const imagePath = getImagePath(campaign.image);
        
        // Update modal content
        campaignDetails.innerHTML = `
            <div class="row">
                <div class="col-md-5">
                    <img src="${imagePath}" class="img-fluid rounded" alt="${campaign.title}"
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
                        <span class="status-badge ${campaign.isApproved ? 'status-approved' : (campaign.status === 'rejected' ? 'status-rejected' : 'status-pending')}">
                            ${campaign.isApproved ? 'Approved' : (campaign.status === 'rejected' ? 'Rejected' : 'Pending')}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <h5>Campaign Description</h5>
                <p>${campaign.description}</p>
            </div>
            
            ${campaign.rewards && campaign.rewards.length > 0 ? `
                <div class="mt-4">
                    <h5>Rewards</h5>
                    <div class="row">
                        ${campaign.rewards.map(reward => `
                            <div class="col-md-6 mb-3">
                                <div class="card">
                                    <div class="card-body">
                                        <h6>${reward.title}</h6>
                                        <p class="text-primary mb-2">$${reward.amount}</p>
                                        <p class="mb-0">${reward.description}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        // Update modal buttons based on campaign status
        const campaignActions = document.getElementById('campaign-actions');
        if (!campaign.isApproved && campaign.status !== 'rejected') {
            // Show approval buttons for pending campaigns
            approveBtn.style.display = 'block';
            rejectBtn.style.display = 'block';
        } else {
            // Hide approval buttons for approved/rejected campaigns
            approveBtn.style.display = 'none';
            rejectBtn.style.display = 'none';
        }
        
        // Show modal
        campaignModal.show();
        
    } catch (error) {
        console.error('Error viewing campaign:', error);
        showError('Failed to load campaign details');
    }
}

// Approve campaign
async function approveCampaign(campaignId) {
    try {
        const campaign = allCampaigns.find(c => c.id === campaignId);
        if (!campaign) throw new Error('Campaign not found');
        
        // Update campaign status
        const updatedCampaign = {
            ...campaign,
            isApproved: true,
            status: 'active'
        };
        
        // Send PATCH request to update only status fields
        await fetch(`${API_URL}/campaigns/${campaignId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                isApproved: true,
                status: 'active'
            })
        });
        
        // Reload campaigns after update
        await loadCampaigns();
        
        // Close modal if open
        const campaignModal = bootstrap.Modal.getInstance(document.getElementById('campaignModal'));
        if (campaignModal) campaignModal.hide();
        
        showSuccess('Campaign approved successfully!');
    } catch (error) {
        console.error('Error approving campaign:', error);
        showError('Failed to approve campaign');
    }
}

// Reject campaign
async function rejectCampaign(campaignId) {
    try {
        const campaign = currentCampaigns.find(c => c.id === campaignId);
        if (!campaign) throw new Error('Campaign not found');
        
        // Update campaign status
        const updatedCampaign = {
            ...campaign,
            isApproved: false,
            status: 'rejected'
        };
        
        // Send PATCH request to update only status fields
        await fetch(`${API_URL}/campaigns/${campaignId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                isApproved: false,
                status: 'rejected'
            })
        });
        
        // Reload campaigns after update
        await loadCampaigns(statusFilter.value);
        
        // Close modal if open
        const campaignModal = bootstrap.Modal.getInstance(document.getElementById('campaignModal'));
        if (campaignModal) campaignModal.hide();
        
        showSuccess('Campaign rejected successfully!');
    } catch (error) {
        console.error('Error rejecting campaign:', error);
        showError('Failed to reject campaign');
    }
}

// Confirm campaign deletion
function confirmDeleteCampaign(campaignId) {
    if (confirm('Are you sure you want to delete this campaign?')) {
        deleteCampaign(campaignId);
    }
}

// Delete campaign
async function deleteCampaign(campaignId) {
    try {
        // Send DELETE request
        await fetch(`${API_URL}/campaigns/${campaignId}`, {
            method: 'DELETE',
        });
        
        // Reload campaigns
        await loadCampaigns(statusFilter.value);
        
        showSuccess('Campaign deleted successfully!');
    } catch (error) {
        console.error('Error deleting campaign:', error);
        showError('Failed to delete campaign');
    }
}

// Check authentication status
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        window.location.href = '../login.html';
        return false;
    }
    return true;
}

// Setup event listeners
function setupEventListeners() {
    // Campaign status filter
    campaignStatusFilter.addEventListener('change', async () => {
        await loadFilteredCampaigns(campaignStatusFilter.value);
    });
    
    // User role filter
    userRoleFilter.addEventListener('change', async () => {
        await loadFilteredUsers(userRoleFilter.value);
    });
    
    // Approve button in campaign modal
    approveBtn.addEventListener('click', () => {
        if (selectedCampaignId) {
            approveCampaign(selectedCampaignId);
        }
    });
    
    // Reject button in campaign modal
    rejectBtn.addEventListener('click', () => {
        if (selectedCampaignId) {
            rejectCampaign(selectedCampaignId);
        }
    });
    
    // Approve user button in user modal
    approveUserBtn.addEventListener('click', () => {
        if (selectedUserId) {
            approveUser(selectedUserId);
        }
    });
    
    // Ban user button in user modal
    banUserBtn.addEventListener('click', () => {
        if (selectedUserId) {
            toggleUserBan(selectedUserId);
        }
    });
}

// View user details
async function viewUser(userId) {
    try {
        const user = allUsers.find(u => u.id === userId);
        if (!user) throw new Error('User not found');
        
        selectedUserId = userId;
        
        // Update modal content
        const userDetails = document.getElementById('user-details');
        const userModal = new bootstrap.Modal(document.getElementById('userModal'));
        
        // Format creation date
        const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
        
        // Update user actions based on user status
        approveUserBtn.style.display = (user.role === 'campaigner' && user.status === 'pending') ? 'block' : 'none';
        banUserBtn.textContent = user.isActive ? 'Ban User' : 'Unban User';
        banUserBtn.style.display = (user.role !== 'admin') ? 'block' : 'none';
        
        // Get appropriate status badge text
        let statusText = '';
        if (!user.isActive) {
            statusText = '<span class="status-badge status-rejected">Banned</span>';
        } else if (user.status === 'pending') {
            statusText = '<span class="status-badge status-pending">Pending</span>';
        } else if (user.status === 'approved') {
            statusText = '<span class="status-badge status-approved">Approved</span>';
        } else {
            statusText = '<span class="status-badge status-approved">Active</span>';
        }
        
        // Update modal content
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
                        <p>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
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
        
        // Show modal
        userModal.show();
    } catch (error) {
        console.error('Error viewing user:', error);
        showError('Failed to load user details');
    }
}

// Approve a pending user (specifically for campaigner role requests)
async function approveUser(userId) {
    try {
        const user = allUsers.find(u => u.id === userId);
        if (!user) throw new Error('User not found');
        
        // Only allow approving pending campaigner requests
        if (user.role !== 'campaigner' || user.status !== 'pending') {
            throw new Error('This user is not a pending campaigner');
        }
        
        // Update user status
        const updatedUser = {
            ...user,
            status: 'approved'
        };
        
        // Send PATCH request to update status
        await fetch(`${API_URL}/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'approved'
            })
        });
        
        // Reload users and update UI
        await loadUsers();
        
        // Close modal if open
        const userModal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
        if (userModal) userModal.hide();
        
        showSuccess('User approved successfully!');
    } catch (error) {
        console.error('Error approving user:', error);
        showError('Failed to approve user: ' + error.message);
    }
}

// Toggle user ban status
async function toggleUserBan(userId) {
    try {
        const user = allUsers.find(u => u.id === userId);
        if (!user) throw new Error('User not found');
        
        // Don't allow banning admin users
        if (user.role === 'admin') {
            throw new Error('Admin users cannot be banned');
        }
        
        // Toggle isActive flag
        const newActiveStatus = !user.isActive;
        
        // Send PATCH request to update isActive status
        await fetch(`${API_URL}/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                isActive: newActiveStatus
            })
        });
        
        // Reload users and update UI
        await loadUsers();
        
        // Close modal if open
        const userModal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
        if (userModal) userModal.hide();
        
        showSuccess(`User ${newActiveStatus ? 'unbanned' : 'banned'} successfully!`);
    } catch (error) {
        console.error('Error toggling user ban status:', error);
        showError('Failed to update user status: ' + error.message);
    }
}

// Utility functions
function showError(message) {
    alert(message); // Replace with a toast/alert component in production
}

function showSuccess(message) {
    alert(message); // Replace with a toast/alert component in production
}

// Logout function
function logout() {
    localStorage.removeItem('user');
    window.location.href = '../login.html';
}

// Make functions globally accessible
window.viewCampaign = viewCampaign;
window.approveCampaign = approveCampaign;
window.rejectCampaign = rejectCampaign;
window.confirmDeleteCampaign = confirmDeleteCampaign;
window.viewUser = viewUser;
window.approveUser = approveUser;
window.toggleUserBan = toggleUserBan;
window.logout = logout;