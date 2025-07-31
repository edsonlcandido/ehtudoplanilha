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
            cardDescription.textContent = 'Autorize o acesso ao Google Drive. Após a autorização, uma planilha template será automaticamente copiada para o seu Drive, pronta para uso.';
        }
        
        console.log('User needs to authorize, showing authorization button');
    }
}

/**
 * Handle OAuth callback success or error, including template provision status
 */
function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const provision = urlParams.get('provision');
    const sheetName = urlParams.get('sheet_name');
    const message = urlParams.get('message');

    if (success) {
        if (provision === 'true') {
            // OAuth e provisionamento de template bem-sucedidos
            const successMessage = message || `Autorização Google concluída e planilha "${sheetName || 'Controle Financeiro'}" copiada com sucesso!`;
            showSuccessMessage(successMessage);
        } else if (provision === 'false') {
            // OAuth bem-sucedido, mas falha no provisionamento automático
            showWarningMessage('Autorização Google concluída, mas houve um problema ao copiar a planilha template automaticamente. Você pode usar o botão "Selecionar Planilha" para escolher uma planilha existente ou tentar provisionar manualmente.');
        } else {
            // OAuth bem-sucedido, status de provisionamento desconhecido
            showSuccessMessage('Autorização Google concluída com sucesso!');
        }
        
        // Limpar URL e atualizar a página
        setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname);
            window.location.reload();
        }, 3000);
    } else if (error) {
        showErrorMessage('Erro na autorização: ' + decodeURIComponent(error));
    }
}

/**
 * Show success message with green background
 */
function showSuccessMessage(message) {
    showMessage(message, '#4caf50', '#ffffff');
}

/**
 * Show warning message with orange background
 */
function showWarningMessage(message) {
    showMessage(message, '#ff9800', '#ffffff');
}

/**
 * Show error message with red background
 */
function showErrorMessage(message) {
    showMessage(message, '#f44336', '#ffffff');
}

/**
 * Generic function to show messages
 */
function showMessage(message, backgroundColor, textColor) {
    // Criar elemento de feedback temporário
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: ${backgroundColor}; 
        color: ${textColor}; 
        padding: 1rem 1.5rem; 
        border-radius: 4px; 
        z-index: 9999; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 400px;
        word-wrap: break-word;
        font-size: 14px;
        line-height: 1.4;
    `;
    feedback.textContent = message;
    document.body.appendChild(feedback);

    // Remover após 5 segundos para mensagens mais longas
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 5000);
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