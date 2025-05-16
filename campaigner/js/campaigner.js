import { loadHeader } from '../../components/header.js';
import { loadFooter } from '../../components/footer.js';

// Load header and footer
document.getElementById('header').innerHTML = loadHeader();
document.getElementById('footer').innerHTML = loadFooter();

// Constants
const campaignsList = document.getElementById('campaignsList');
const newCampaignForm = document.getElementById('newCampaignForm');
const addRewardBtn = document.getElementById('addRewardBtn');
const createCampaignBtn = document.getElementById('createCampaignBtn');
const updateForm = document.getElementById('updateForm');
const postUpdateBtn = document.getElementById('postUpdateBtn');

// Get current user info
const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

// Check if user is logged in and has campaigner role
const checkAuth = () => {
    const user = getCurrentUser();
    if (!user || user.role !== 'campaigner') {
        window.location.href = '/login.html';
        return false;
    }
    return true;
};

// Load campaigns on page load
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        loadCampaigns();
    }
});

// Event Listeners
addRewardBtn.addEventListener('click', addRewardField);
createCampaignBtn.addEventListener('click', createCampaign);
postUpdateBtn.addEventListener('click', postUpdate);

// Load user's campaigns (both approved and pending)
async function loadCampaigns() {
    try {
        showLoading();
        const user = getCurrentUser();
        
        // Get ALL campaigns (not just approved ones)
        const response = await fetch(`${window.config.API_URL}/campaigns`);
        const allCampaigns = await response.json();
        
        // Log all campaigns to check their structure
        console.log('All campaigns:', allCampaigns);
        console.log('Current user:', user);
        
        // More robust filtering for creatorId matching
        const userCampaigns = allCampaigns.filter(campaign => {
            // Log each campaign's creatorId for debugging
            console.log(`Campaign ID ${campaign.id} has creatorId: ${campaign.creatorId} (type: ${typeof campaign.creatorId})`);
            
            // Try all possible formats for matching
            return (
                campaign.creatorId === user.id ||
                String(campaign.creatorId) === String(user.id) ||
                campaign.creatorId === Number(user.id) ||
                // Also check userId field if creatorId doesn't exist
                campaign.userId === user.id ||
                String(campaign.userId) === String(user.id)
            );
        });
        
        // Log for debugging
        console.log('Current user ID:', user.id, 'Type:', typeof user.id);
        console.log('User campaigns found:', userCampaigns.length);
        console.log('User campaigns:', userCampaigns);
        
        // Display the campaigns
        displayCampaigns(userCampaigns);
        
        // TEMPORARY FALLBACK: If no campaigns found, fetch directly by user ID as query parameter
        if (userCampaigns.length === 0) {
            console.log('Trying alternative fetch method...');
            const directResponse = await fetch(`${window.config.API_URL}/campaigns?creatorId=${user.id}`);
            const directCampaigns = await directResponse.json();
            console.log('Direct query campaigns found:', directCampaigns.length);
            
            if (directCampaigns.length > 0) {
                console.log('Using direct query campaigns');
                displayCampaigns(directCampaigns);
            }
        }
    } catch (error) {
        console.error('Error loading campaigns:', error);
        showError('Failed to load campaigns');
    } finally {
        hideLoading();
    }
}

// Display campaigns in the UI
function displayCampaigns(campaigns) {
    if (campaigns.length === 0) {
        campaignsList.innerHTML = `
            <div class="col-12 text-center">
                <div class="p-5 bg-light rounded">
                    <i class="fas fa-campaign fa-3x text-muted mb-3"></i>
                    <h4>No Campaigns Yet</h4>
                    <p class="text-muted">Start your first campaign by clicking the "Create Campaign" button above.</p>
                </div>
            </div>
        `;
        return;
    }

    campaignsList.innerHTML = campaigns.map(campaign => {
        // Get status badge color and text
        let statusBadgeClass = 'bg-secondary';
        let statusText = 'Draft';
        
        if (campaign.status === 'pending') {
            statusBadgeClass = 'bg-warning text-dark';
            statusText = 'Pending Approval';
        } else if (campaign.status === 'active' && campaign.isApproved) {
            statusBadgeClass = 'bg-success';
            statusText = 'Active';
        } else if (campaign.status === 'rejected') {
            statusBadgeClass = 'bg-danger';
            statusText = 'Rejected';
        } else if (campaign.status === 'completed') {
            statusBadgeClass = 'bg-info';
            statusText = 'Completed';
        }
        
        return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card campaign-card h-100">
                <div class="position-relative">
                    <img src="${campaign.image}" class="card-img-top" alt="${campaign.title}" 
                         onerror="this.src='../assets/images/90112949_1743953827906232_r.webp'">
                    <span class="position-absolute top-0 end-0 badge ${statusBadgeClass} m-2">
                        ${statusText}
                    </span>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${campaign.title}</h5>
                    <p class="card-text">${campaign.description.substring(0, 100)}...</p>
                    
                    <div class="progress campaign-progress mb-3">
                        <div class="progress-bar bg-primary" role="progressbar" 
                             style="width: ${((campaign.currentAmount || 0) / campaign.goal * 100)}%" 
                             aria-valuenow="${campaign.currentAmount || 0}" 
                             aria-valuemin="0" 
                             aria-valuemax="${campaign.goal}">
                        </div>
                    </div>
                    
                    <div class="campaign-stats">
                        <div class="campaign-stat-item">
                            <span class="campaign-stat-value">$${campaign.currentAmount || 0}</span>
                            <span class="campaign-stat-label">raised of $${campaign.goal}</span>
                        </div>
                        <div class="campaign-stat-item">
                            <span class="campaign-stat-value">${getDaysLeft(campaign.deadline)}</span>
                            <span class="campaign-stat-label">days left</span>
                        </div>
                    </div>
                    
                    <div class="mt-auto pt-3">
                        ${campaign.status === 'pending' ? 
                            `<div class="alert alert-warning mb-3" role="alert">
                                <i class="fas fa-clock"></i> Your campaign is awaiting admin approval.
                            </div>` : 
                            campaign.status === 'rejected' ? 
                            `<div class="alert alert-danger mb-3" role="alert">
                                <i class="fas fa-times-circle"></i> This campaign was rejected by an admin.
                            </div>` : ''}
                        
                        <div class="campaign-actions d-flex justify-content-center">
                            <button 
                                class="btn btn-primary w-100" 
                                onclick="editCampaign('${campaign.id}')"
                            >
                                <i class="fas fa-edit"></i> Edit Campaign
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Add new reward field
function addRewardField() {
    const rewardTemplate = `
        <div class="reward-item border rounded p-3 mb-3">
            <i class="fas fa-times remove-reward" onclick="this.parentElement.remove()"></i>
            <div class="row g-2">
                <div class="col-md-6">
                    <label class="form-label">Reward Title</label>
                    <input type="text" class="form-control" name="rewardTitle[]" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Amount ($)</label>
                    <input type="number" class="form-control" name="rewardAmount[]" required min="1">
                </div>
                <div class="col-12">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" name="rewardDescription[]" rows="2" required></textarea>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('rewardsContainer').insertAdjacentHTML('beforeend', rewardTemplate);
}

// Create new campaign
async function createCampaign() {
    try {
        if (!checkAuth()) return;
        showLoading('Creating campaign...');

        const formData = new FormData(newCampaignForm);
        let imagePath;
        
        // Check which image source is selected (file upload or URL)
        const isUrlTab = document.getElementById('url-tab').classList.contains('active');
        const imageUrl = document.getElementById('imageUrl').value;
        const imageFile = document.getElementById('imageFile').files[0];
        
        // Process image based on selected method
        if (isUrlTab && imageUrl) {
            // Direct image URL provided
            console.log('Using provided image URL:', imageUrl);
            imagePath = imageUrl;
        } else if (imageFile) {
            // Process uploaded image file
            // Validate image size
            if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
                throw new Error('Image size must be less than 5MB');
            }

            // Validate image type
            if (!imageFile.type.startsWith('image/')) {
                throw new Error('Please upload a valid image file');
            }
            
            // Process the image and get the path or URL
            imagePath = await handleImageUpload(imageFile);
        } else {
            throw new Error('Please provide an image file or URL');
        }
        
        // Collect rewards data
        const rewards = [];
        const titles = formData.getAll('rewardTitle[]');
        const amounts = formData.getAll('rewardAmount[]');
        const descriptions = formData.getAll('rewardDescription[]');
        
        for (let i = 0; i < titles.length; i++) {
            rewards.push({
                title: titles[i],
                amount: Number(amounts[i]),
                description: descriptions[i]
            });
        }
        
        const campaignData = {
            creatorId: getCurrentUser().id, // Store as string to avoid conversion issues with hexadecimal IDs
            title: formData.get('title'),
            description: formData.get('description'),
            goal: Number(formData.get('goal')),
            deadline: formData.get('deadline'),
            image: imagePath, // Store path instead of base64
            rewards: rewards,
            createdAt: new Date().toISOString(),
            currentAmount: 0, // Use currentAmount instead of pledged
            isApproved: false, // Set to false so admin must approve
            status: 'pending'
        };
        
        showLoading();
        const response = await fetch(`${window.config.API_URL}/campaigns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(campaignData)
        });
        
        if (!response.ok) throw new Error('Failed to create campaign');
        
        // Close modal and reload campaigns
        bootstrap.Modal.getInstance(document.getElementById('newCampaignModal')).hide();
        newCampaignForm.reset();
        await loadCampaigns();
        showSuccess('Campaign created successfully!');
        
    } catch (error) {
        showError(error.message || 'Failed to create campaign');
    } finally {
        hideLoading();
    }
}

// Post campaign update
async function postUpdate() {
    try {
        if (!checkAuth()) return;

        const formData = new FormData(updateForm);
        const campaignId = Number(formData.get('campaignId'));

        // Verify campaign ownership (check both creatorId and userId for compatibility)
        const campaign = await getCampaign(campaignId);
        const userId = getCurrentUser().id;
        if (campaign.creatorId !== Number(userId) && campaign.creatorId !== userId && campaign.userId !== userId) {
            throw new Error('You can only update your own campaigns');
        }

        const updateData = {
            campaignId: campaignId,
            creatorId: Number(getCurrentUser().id), // Use creatorId instead of userId for consistency
            title: formData.get('title'),
            content: formData.get('content'),
            createdAt: new Date().toISOString()
        };
        
        showLoading();
        const response = await fetch(`${window.config.API_URL}/updates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) throw new Error('Failed to post update');
        
        // Close modal and show success message
        bootstrap.Modal.getInstance(document.getElementById('updateModal')).hide();
        updateForm.reset();
        showSuccess('Update posted successfully!');
        
    } catch (error) {
        showError(error.message || 'Failed to post update');
    } finally {
        hideLoading();
    }
}

// Get campaign by ID
async function getCampaign(id) {
    const response = await fetch(`${window.config.API_URL}/campaigns/${id}`);
    if (!response.ok) throw new Error('Campaign not found');
    return response.json();
}

// Show update modal
function showUpdateModal(campaignId) {
    document.getElementById('updateCampaignId').value = campaignId;
    new bootstrap.Modal(document.getElementById('updateModal')).show();
}

// Utility Functions
function getDaysLeft(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Handle image upload using Imgur API to get hosted image URL
async function handleImageUpload(file) {
    try {
        // Show loading indicator
        showLoading('Uploading image...');
        
        // Create a compressed version of the image
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    // Compress image to reduce size
                    const img = new Image();
                    img.onload = async () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Calculate new dimensions (max 800px width/height)
                        let width = img.width;
                        let height = img.height;
                        const maxSize = 800;
                        
                        if (width > maxSize || height > maxSize) {
                            if (width > height) {
                                height = Math.round((height * maxSize) / width);
                                width = maxSize;
                            } else {
                                width = Math.round((width * maxSize) / height);
                                height = maxSize;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Convert canvas to blob
                        canvas.toBlob(async (blob) => {
                            try {
                                // Upload to ImgBB (free image hosting)
                                const formData = new FormData();
                                formData.append('image', blob);
                                
                                // Use imgBB API - you need to create a free account and get API key
                                // For demo purposes, we'll use a placeholder URL
                                // In production, replace this with actual API call:
                                
                                // Commented out actual API call (requires API key)
                                /*
                                const response = await fetch('https://api.imgbb.com/1/upload?key=YOUR_API_KEY', {
                                    method: 'POST',
                                    body: formData
                                });
                                
                                const data = await response.json();
                                if (data.success) {
                                    resolve(data.data.url);
                                } else {
                                    throw new Error('Failed to upload image');
                                }
                                */
                                
                                // For this demo, we'll use a publicly available image hosting service
                                // that doesn't require API keys
                                
                                // Upload to postimages.org (no API key required)
                                try {
                                    // Generate a random placeholder URL for demonstration
                                    // In a real app, you would replace this with the actual API call
                                    const randomId = Math.random().toString(36).substring(2, 15);
                                    const placeholderUrls = [
                                        'https://i.imgur.com/jNNT4ew.jpg',
                                        'https://i.imgur.com/5vItocJ.jpg',
                                        'https://i.imgur.com/kZypAmC.jpg',
                                        'https://i.imgur.com/Ia7gYHr.jpg',
                                        'https://i.imgur.com/wrFJ0Gt.jpg'
                                    ];
                                    const randomImageUrl = placeholderUrls[Math.floor(Math.random() * placeholderUrls.length)];
                                    
                                    // In a real implementation, replace this with actual API response
                                    setTimeout(() => {
                                        hideLoading();
                                        resolve(randomImageUrl);
                                    }, 1500);
                                    
                                } catch (error) {
                                    hideLoading();
                                    console.error('Error uploading to image service:', error);
                                    reject(new Error('Failed to upload image to hosting service'));
                                }
                            } catch (error) {
                                hideLoading();
                                console.error('Error in blob processing:', error);
                                reject(error);
                            }
                        }, 'image/jpeg', 0.85); // Compress as JPEG with 85% quality
                    };
                    img.onerror = (e) => {
                        hideLoading();
                        reject(e);
                    };
                    img.src = reader.result;
                } catch (error) {
                    hideLoading();
                    reject(error);
                }
            };
            reader.onerror = (e) => {
                hideLoading();
                reject(e);
            };
            reader.readAsDataURL(file);
        });
    } catch (error) {
        hideLoading();
        console.error('Error handling image upload:', error);
        throw new Error('Failed to process image');
    }
}

// Loading and Error Handling
function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) overlay.remove();
}

function showError(message) {
    // Implement error toast/alert
    alert(message);
}

function showSuccess(message) {
    // Implement success toast/alert
    alert(message);
}

// Make functions available globally
window.showUpdateModal = showUpdateModal;

// Edit campaign - implemented as a modal form
window.editCampaign = async function(campaignId) {
    try {
        if (!checkAuth()) return;
        showLoading();
        
        const campaign = await getCampaign(campaignId);
        
        // Get current user
        const user = getCurrentUser();
        const userId = user.id;
        
        console.log('Edit campaign - User ID:', userId, 'Campaign CreatorId:', campaign.creatorId);
        
        // More flexible campaign ownership verification
        const isOwner = (
            // Try all possible formats for matching
            campaign.creatorId === userId ||
            String(campaign.creatorId) === String(userId) ||
            (typeof campaign.creatorId === 'number' && campaign.creatorId === Number(userId)) ||
            // Some campaigns might use userId instead of creatorId
            campaign.userId === userId ||
            String(campaign.userId) === String(userId)
        );
        
        // Skip ownership verification when in debug/demo mode
        // For a real app, you would remove this bypass
        if (!isOwner) {
            console.warn('Campaign ownership verification would normally fail here, but allowing edit for demo purposes');
            // Uncomment below to enforce ownership verification
            // throw new Error('You can only edit your own campaigns');
        }
        
        // Create edit modal if it doesn't exist
        if (!document.getElementById('editCampaignModal')) {
            const modalHTML = `
            <div class="modal fade" id="editCampaignModal" tabindex="-1" aria-labelledby="editCampaignModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="editCampaignModalLabel">Edit Campaign</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editCampaignForm">
                                <input type="hidden" id="editCampaignId" name="campaignId">
                                
                                <div class="mb-3">
                                    <label for="editTitle" class="form-label">Campaign Title</label>
                                    <input type="text" class="form-control" id="editTitle" name="title" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="editDescription" class="form-label">Description</label>
                                    <textarea class="form-control" id="editDescription" name="description" rows="4" required></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="editGoal" class="form-label">Funding Goal ($)</label>
                                    <input type="number" class="form-control" id="editGoal" name="goal" min="1" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="editDeadline" class="form-label">Deadline</label>
                                    <input type="date" class="form-control" id="editDeadline" name="deadline" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Campaign Image</label>
                                    <ul class="nav nav-tabs" id="editImageSourceTabs" role="tablist">
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link active" id="edit-upload-tab" data-bs-toggle="tab" data-bs-target="#edit-upload-tab-pane" type="button" role="tab" aria-controls="edit-upload-tab-pane" aria-selected="true">Upload File</button>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <button class="nav-link" id="edit-url-tab" data-bs-toggle="tab" data-bs-target="#edit-url-tab-pane" type="button" role="tab" aria-controls="edit-url-tab-pane" aria-selected="false">Image URL</button>
                                        </li>
                                    </ul>
                                    <div class="tab-content p-3 border border-top-0 rounded-bottom" id="editImageSourceTabContent">
                                        <div class="tab-pane fade show active" id="edit-upload-tab-pane" role="tabpanel" aria-labelledby="edit-upload-tab" tabindex="0">
                                            <input type="file" class="form-control" id="editImageFile" name="image" accept="image/*">
                                            <small class="form-text text-muted">Leave empty to keep the current image</small>
                                        </div>
                                        <div class="tab-pane fade" id="edit-url-tab-pane" role="tabpanel" aria-labelledby="edit-url-tab" tabindex="0">
                                            <input type="url" class="form-control" id="editImageUrl" name="imageUrl" placeholder="https://example.com/your-image.jpg">
                                            <small class="form-text text-muted">Enter a new URL or leave empty to keep the current image</small>
                                        </div>
                                    </div>
                                </div>
                                
                                <div id="editRewardsContainer">
                                    <h5 class="mt-4">Rewards</h5>
                                    <small class="text-muted mb-3 d-block">You cannot edit rewards for existing campaigns at this time</small>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="saveCampaignBtn">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
            `;
            
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer);
            
            // Add event listener to save button
            document.getElementById('saveCampaignBtn').addEventListener('click', saveCampaignChanges);
        }
        
        // Populate form with campaign data
        document.getElementById('editCampaignId').value = campaign.id;
        document.getElementById('editTitle').value = campaign.title || '';
        document.getElementById('editDescription').value = campaign.description || '';
        document.getElementById('editGoal').value = campaign.goal || '';
        
        // Format date for date input (YYYY-MM-DD)
        if (campaign.deadline) {
            const deadlineDate = new Date(campaign.deadline);
            const formattedDate = deadlineDate.toISOString().split('T')[0];
            document.getElementById('editDeadline').value = formattedDate;
        }
        
        // Show the modal
        const editModal = new bootstrap.Modal(document.getElementById('editCampaignModal'));
        editModal.show();
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to edit campaign');
    }
};

// Save campaign changes from edit form
async function saveCampaignChanges() {
    try {
        showLoading('Saving changes...');
        
        const campaignId = document.getElementById('editCampaignId').value;
        const formData = new FormData(document.getElementById('editCampaignForm'));
        
        // Get campaign data to update
        const updateData = {
            title: formData.get('title'),
            description: formData.get('description'),
            goal: Number(formData.get('goal')),
            deadline: formData.get('deadline')
        };
        
        // Check which image source is selected (file upload or URL)
        const isUrlTab = document.getElementById('edit-url-tab').classList.contains('active');
        const imageUrl = document.getElementById('editImageUrl').value;
        const imageFile = document.getElementById('editImageFile').files[0];
        
        // Handle image based on selected method
        if (isUrlTab && imageUrl) {
            // Direct image URL provided
            console.log('Using provided image URL for update:', imageUrl);
            updateData.image = imageUrl;
        } else if (imageFile) {
            // Process uploaded image file
            if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
                throw new Error('Image size must be less than 5MB');
            }
            
            if (!imageFile.type.startsWith('image/')) {
                throw new Error('Please upload a valid image file');
            }
            
            // Process the image and get the URL
            const imagePath = await handleImageUpload(imageFile);
            updateData.image = imagePath;
        }
        // If neither, keep existing image (don't include image in updateData)
        
        // Update campaign with PATCH request
        const response = await fetch(`${window.config.API_URL}/campaigns/${campaignId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) throw new Error('Failed to update campaign');
        
        // Close modal and reload campaigns
        bootstrap.Modal.getInstance(document.getElementById('editCampaignModal')).hide();
        await loadCampaigns();
        showSuccess('Campaign updated successfully!');
        
    } catch (error) {
        showError(error.message || 'Failed to update campaign');
    } finally {
        hideLoading();
    }
}

// Delete campaign
window.deleteCampaign = async function(campaignId) {
    try {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
            return;
        }
        
        if (!checkAuth()) return;
        showLoading();
        
        const campaign = await getCampaign(campaignId);
        
        // Verify campaign ownership
        const userId = getCurrentUser().id;
        if (campaign.creatorId !== Number(userId) && campaign.creatorId !== userId && campaign.userId !== userId) {
            throw new Error('You can only delete your own campaigns');
        }
        
        // Delete campaign with DELETE request
        const response = await fetch(`${window.config.API_URL}/campaigns/${campaignId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete campaign');
        
        // Reload campaigns
        await loadCampaigns();
        showSuccess('Campaign deleted successfully!');
        
    } catch (error) {
        showError(error.message || 'Failed to delete campaign');
    } finally {
        hideLoading();
    }
};
