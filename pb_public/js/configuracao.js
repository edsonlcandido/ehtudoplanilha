/**
 * Configuration page functionality
 * Handles Google OAuth integration and refresh token checking
 */

// Initialize PocketBase
const pb = new PocketBase(apiConfig.getBaseURL());

// State management
let hasRefreshToken = false;

/**
 * Check if user has a refresh token
 */
async function checkRefreshTokenStatus() {
    try {
        const response = await fetch('/check-refresh-token', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pb.authStore.token}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Erro ao verificar status do token: ' + response.statusText);
        }

        const data = await response.json();
        hasRefreshToken = data.hasRefreshToken;
        
        console.log('Refresh token status:', hasRefreshToken);
        return hasRefreshToken;
    } catch (error) {
        console.error('Error checking refresh token:', error);
        hasRefreshToken = false;
        return false;
    }
}

/**
 * Start Google OAuth flow (based on oauth-test.html)
 */
async function startOAuth() {
    const userId = pb.authStore.model?.id || '';

    try {
        // Get system variables from backend
        const response = await fetch('/env-variables', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pb.authStore.token}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar variáveis do sistema: ' + response.statusText);
        }

        const data = await response.json();
        
        // Build Google OAuth URL with obtained variables
        const clientId = data.GOOGLE_CLIENT_ID;
        const redirectUri = data.GOOGLE_REDIRECT_URI;
        const scope = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets';
        const state = userId; // Used to identify user after callback
        
        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth` +
            `?client_id=${encodeURIComponent(clientId)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=${encodeURIComponent(scope)}` +
            `&response_type=code` +
            `&access_type=offline` +
            `&prompt=consent` +
            `&state=${encodeURIComponent(userId)}`;

        // Redirect to OAuth URL
        window.location.href = oauthUrl;
    } catch (error) {
        console.error(error);
        alert('Erro ao iniciar OAuth: ' + error.message);
    }
}

/**
 * Update the authorization button based on refresh token status
 */
function updateAuthorizationButton() {
    const authButton = document.getElementById('google-auth-button');
    const authCard = document.getElementById('google-auth-card');
    
    if (!authButton || !authCard) {
        console.error('Authorization button or card not found');
        return;
    }

    if (hasRefreshToken) {
        // User already has a refresh token, hide the authorization card
        authCard.style.display = 'none';
        console.log('User already authorized, hiding authorization button');
    } else {
        // User needs to authorize, show the button and make it functional
        authCard.style.display = 'flex';
        authButton.onclick = startOAuth;
        authButton.disabled = false;
        authButton.textContent = 'Autorizar Acesso ao Drive';
        console.log('User needs to authorize, showing authorization button');
    }
}

/**
 * Handle OAuth callback success or error
 */
function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success) {
        alert('Autorização Google concluída com sucesso!');
        // Refresh the page to update the button status
        window.location.href = window.location.pathname;
    } else if (error) {
        alert('Erro na autorização: ' + error);
    }
}

/**
 * Initialize the configuration page
 */
async function initConfigurationPage() {
    // Check if this is an OAuth callback
    handleOAuthCallback();
    
    // Check refresh token status
    await checkRefreshTokenStatus();
    
    // Update button visibility based on token status
    updateAuthorizationButton();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initConfigurationPage);