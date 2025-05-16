// Get image URL (handles both local and external images)
function getImageUrl(imagePath) {
    // If no image path is provided, return a local placeholder from existing images
    if (!imagePath) return '../assets/images/90112949_1743953827906232_r.webp';
    
    // Check if the imagePath is a base64 encoded string (data URL)
    if (imagePath.startsWith('data:image')) {
        // It's already a data URL, return as is
        return imagePath;
    }
    
    // Check if it's any type of external URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // Handle specific image hosting services (in case the URL doesn't have http/https prefix)
    if (imagePath.includes('imgur.com') || 
        imagePath.includes('postimages.org') || 
        imagePath.includes('i.ibb.co')) {
        // Ensure it has https prefix
        return imagePath.startsWith('//') ? `https:${imagePath}` : `https://${imagePath}`;
    }
    
    // Handle local paths - ensure no double slashes
    // First remove any leading slash from the image path
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    
    // For relative paths, prepend the root path
    // In production, you might use a CDN or API endpoint
    return `../${cleanPath}`;
}

// Load featured campaigns
async function loadFeaturedCampaigns() {
    try {
        const response = await fetch(`${config.API_URL}${config.ROUTES.CAMPAIGNS}?isApproved=true&_sort=createdAt&_order=desc&_limit=6`);
        const campaigns = await response.json();
        
        const campaignsContainer = document.getElementById('featured-campaigns');
        
        if (campaigns.length === 0) {
            campaignsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">No campaigns available yet. Be the first to start one!</p>
                </div>
            `;
            return;
        }

        campaignsContainer.innerHTML = campaigns.map(campaign => {
            const progress = (campaign.currentAmount / campaign.goal) * 100;
            const daysLeft = Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            const imageUrl = getImageUrl(campaign.image);
            
            return `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <img src="${imageUrl}" 
                             class="card-img-top" 
                             alt="${campaign.title}"
                             style="height: 200px; object-fit: cover;"
                             onerror="this.src='../assets/images/90112949_1743953827906232_r.webp'">
                        <div class="card-body">
                            <h5 class="card-title">${campaign.title}</h5>
                            <p class="card-text text-muted">${campaign.description ? campaign.description.substring(0, 100) + '...' : ''}</p>
                            <div class="progress mb-3">
                                <div class="progress-bar" role="progressbar" style="width: ${progress}%" 
                                     aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">$${campaign.currentAmount.toLocaleString()} raised</small>
                                <small class="text-muted">${daysLeft} days left</small>
                            </div>
                        </div>
                        <div class="card-footer bg-white border-0">
                            <a href="campaign.html?id=${campaign.id}" class="btn btn-outline-primary w-100">Learn More</a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading campaigns:', error);
        document.getElementById('featured-campaigns').innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">Error loading campaigns. Please try again later.</p>
            </div>
        `;
    }
}

// Check authentication status and update navigation
function updateNavigation() {
    const user = JSON.parse(localStorage.getItem('user'));
    const navbarNav = document.getElementById('navbarNav');
    
    if (user) {
        // User is logged in
        const authButtons = `
            <div class="d-flex gap-2">
                <a href="${user.role}/dashboard.html" class="btn btn-outline-primary">Dashboard</a>
                <button onclick="logout()" class="btn btn-primary">Logout</button>
            </div>
        `;
        navbarNav.querySelector('.d-flex').innerHTML = authButtons;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('user');
    window.location.reload();
}

// Initialize home page
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedCampaigns();
    updateNavigation();
}); 