/**
 * Configuration page functionality
 * Handles Google OAuth integration and refresh token checking
 */

// Use a instância global do PocketBase
const pb = window.pb;

// State management
let hasRefreshToken = false;

/**
 * Check if user has a refresh token
 */
async function checkRefreshTokenStatus() {
    try {
        const baseUrl = pb.baseUrl;
        const response = await fetch(`${baseUrl}/check-refresh-token`, {
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
        const baseUrl = pb.baseUrl;
        const response = await fetch(`${baseUrl}/env-variables`, {
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
        // User already has a refresh token, show connected status
        authCard.style.display = 'flex';
        authButton.style.backgroundColor = '#28a745';
        authButton.style.borderColor = '#28a745';
        authButton.disabled = true;
        authButton.textContent = '✓ Google Drive Conectado';
        authButton.onclick = null;
        
        // Update card description
        const cardDescription = authCard.querySelector('p');
        if (cardDescription) {
            cardDescription.textContent = 'Sua conta está conectada ao Google Drive e pronta para usar.';
        }
        
        console.log('User already authorized, showing connected status');
    } else {
        // User needs to authorize, show the button and make it functional
        authCard.style.display = 'flex';
        authButton.onclick = startOAuth;
        authButton.disabled = false;
        authButton.textContent = 'Autorizar Acesso ao Drive';
        
        // Ensure card description is correct
        const cardDescription = authCard.querySelector('p');
        if (cardDescription) {
            cardDescription.textContent = 'Autorize o acesso ao Google Drive para integrar sua planilha de controle financeiro.';
        }
        
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