// Global configuration
const config = {
    API_URL: 'http://localhost:3000',
    ROUTES: {
        USERS: '/users',
        CAMPAIGNS: '/campaigns',
        PLEDGES: '/pledges',
        UPDATES: '/updates'
    },
    ROLES: {
        ADMIN: 'admin',
        CAMPAIGNER: 'campaigner',
        BACKER: 'backer'
    },
    STATUS: {
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected'
    },
    REDIRECTS: {
        admin: '/admin/dashboard.html',
        campaigner: '/campaigner/dashboard.html',
        backer: '/backer/dashboard.html'
    }
};

// Make config available globally
window.config = config;

// Prevent accidental modification of config
Object.freeze(config);
Object.freeze(config.ROUTES);
Object.freeze(config.ROLES);
Object.freeze(config.STATUS);
Object.freeze(config.REDIRECTS);

// Authentication check
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    const currentPath = window.location.pathname;

    // If no user is logged in
    if (!user) {
        // Redirect to login if trying to access protected paths
        if (currentPath.includes('/admin/') || 
            currentPath.includes('/campaigner/') || 
            currentPath.includes('/backer/')) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

    // If user is logged in
    if (currentPath === '/login.html' || currentPath === '/register.html') {
        // Redirect to appropriate dashboard
        window.location.href = config.REDIRECTS[user.role];
        return false;
    }

    // Role-based access control
    if (currentPath.includes('/admin/') && user.role !== 'admin') {
        window.location.href = config.REDIRECTS[user.role];
        return false;
    }
    if (currentPath.includes('/campaigner/') && user.role !== 'campaigner') {
        window.location.href = config.REDIRECTS[user.role];
        return false;
    }
    if (currentPath.includes('/backer/') && user.role !== 'backer') {
        window.location.href = config.REDIRECTS[user.role];
        return false;
    }

    return true;
}

// Run authentication check
checkAuth(); 