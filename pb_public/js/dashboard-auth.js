/**
 * Dashboard Authentication Module
 * 
 * This script provides authentication protection for all dashboard pages.
 * Include this script in any dashboard page to ensure only authenticated users can access it.
 * 
 * Usage:
 * <script src="../js/dashboard-auth.js"></script>
 */

// Initialize PocketBase with API configuration
const pb = new PocketBase(apiConfig.getBaseURL());

/**
 * Checks if user is authenticated and redirects to login if not
 * @returns {boolean} true if authenticated, false otherwise
 */
function checkDashboardAuthentication() {
    if (!pb.authStore.isValid || !pb.authStore.model) {
        // User is not authenticated, redirect to login page
        // Calculate relative path to login based on current location
        const pathDepth = window.location.pathname.split('/').filter(p => p && p !== 'dashboard').length - 1;
        const loginPath = '../'.repeat(Math.max(1, pathDepth)) + 'login.html';
        window.location.href = loginPath;
        return false;
    }
    return true;
}

/**
 * Renders the user menu for dashboard pages
 * @param {string} menuElementId - ID of the menu element to update
 */
function renderDashboardUserMenu(menuElementId = 'menu-user') {
    const menuUser = document.getElementById(menuElementId);
    if (!menuUser) return;
    
    if (pb.authStore.isValid && pb.authStore.model) {
        // Calculate relative path to login based on current location
        const pathDepth = window.location.pathname.split('/').filter(p => p && p !== 'dashboard').length - 1;
        const loginPath = '../'.repeat(Math.max(1, pathDepth)) + 'login.html';
        
        menuUser.innerHTML = `
            <span class="pseudo button">${pb.authStore.model.email}</span>
            <button class="button error" id="logoutBtn">Sair</button>
        `;
        
        document.getElementById('logoutBtn').onclick = function() {
            pb.authStore.clear();
            // Redirect to home page instead of login page
            window.location.href = '/';
        };
    }
}

// Auto-run authentication check when script loads
checkDashboardAuthentication();

// Auto-render user menu when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    renderDashboardUserMenu();
});