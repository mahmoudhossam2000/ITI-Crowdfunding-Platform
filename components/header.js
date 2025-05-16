// Function to load and insert header
export function loadHeader() {
    // Get user from localStorage for proper role-based header
    const userString = localStorage.getItem('user');
    let user = null;
    let isLoggedIn = false;
    
    // Parse user data if exists
    if (userString && userString !== 'undefined' && userString !== 'null') {
        try {
            user = JSON.parse(userString);
            // Consider user logged in if we have a valid user object with id, name, and role
            isLoggedIn = Boolean(user && user.id && user.name && user.role);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    // Build path to home (in admin dashboard, we need to go up one level)
    const currentPath = window.location.pathname;
    const isInAdminSection = currentPath.includes('/admin/');
    const isInDashboard = currentPath.includes('dashboard.html');
    const homePath = isInAdminSection ? '../index.html' : '/index.html';
    
    return `
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div class="container">
            <a class="navbar-brand" href="${homePath}">
                <h3 class="m-0 text-primary">CrowdFund</h3>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="${homePath}">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="${homePath}#discover">Discover</a>
                    </li>
                    ${isLoggedIn ? (
                        user.role === 'admin' ? `
                            <li class="nav-item">
                                <a class="nav-link" href="${isInAdminSection ? './dashboard.html' : '/admin/dashboard.html'}">Admin Dashboard</a>
                            </li>
                        ` : user.role === 'campaigner' ? `
                            <li class="nav-item">
                                <a class="nav-link" href="${isInAdminSection ? '../campaigner/dashboard.html' : '/campaigner/dashboard.html'}">My Campaigns</a>
                            </li>
                        ` : user.role === 'backer' ? `
                            <li class="nav-item">
                                <a class="nav-link" href="${isInAdminSection ? '../backer/dashboard.html' : '/backer/dashboard.html'}">My Pledges</a>
                            </li>
                        ` : ''
                    ) : ''}
                </ul>
                <form class="d-flex me-3 search-form">
                    <div class="input-group">
                        <input class="form-control" type="search" placeholder="Search campaigns..." aria-label="Search">
                        <button class="btn btn-outline-primary" type="submit">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </form>
                <div class="d-flex gap-2">
                    ${isLoggedIn ? `
                        <span class="navbar-text me-2">
                            <i class="fas fa-user me-1"></i> ${user.name || 'User'}
                        </span>
                    ` : `
                        <a href="${isInAdminSection ? '../login.html' : '/login.html'}" class="btn btn-outline-primary">Sign In</a>
                        <a href="${isInAdminSection ? '../register.html' : '/register.html'}" class="btn btn-primary">Start Fundraising</a>
                    `}
                </div>
            </div>
        </div>
    </nav>
    `;
} 