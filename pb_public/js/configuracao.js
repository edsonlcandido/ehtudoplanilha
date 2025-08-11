/**
 * Configuration page functionality
 * Handles Google OAuth integration and refresh token checking
 */

import googleOAuthService from './google/oauth-service.js';
import googleSheetsService from './google/sheets-api.js';

// Use a instância global do PocketBase
const pb = window.pb;

// State management
let hasRefreshToken = false;

/**
 * Check if user has a refresh token
 */
async function checkRefreshTokenStatus() {
    try {
        hasRefreshToken = await googleOAuthService.checkRefreshTokenStatus();
        return hasRefreshToken;
    } catch (error) {
        console.error('Error checking refresh token:', error);
        hasRefreshToken = false;
        return false;
    }
}

/**
 * Start Google OAuth flow
 */
async function startOAuth() {
    try {
        await googleOAuthService.startOAuthFlow();
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
            cardDescription.textContent = 'Sua conta está conectada ao Google Drive. Agora você pode selecionar ou criar uma planilha para uso.';
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
            cardDescription.textContent = 'Autorize o acesso ao Google Drive. Após a autorização, você poderá selecionar ou criar uma planilha para uso.';
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
        showSuccessMessage('Autorização Google concluída com sucesso! Agora você pode selecionar uma planilha existente ou criar uma nova.');
        
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
        z-index: 10001; 
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
    // Initialize OAuth service with PocketBase instance
    googleOAuthService.init(pb);
    
    // Check if this is an OAuth callback
    handleOAuthCallback();
    
    // Check refresh token status
    await checkRefreshTokenStatus();
    
    // Update button visibility based on token status
    updateAuthorizationButton();
}

// Adiciona o listener para o botão de desvincular
document.addEventListener('DOMContentLoaded', () => {
    const deleteSheetConfigBtn = document.getElementById('deleteSheetConfigBtn');

    if (deleteSheetConfigBtn) {
        deleteSheetConfigBtn.addEventListener('click', async () => {
            if (!confirm('Tem certeza de que deseja desvincular sua planilha atual? Esta ação não pode ser desfeita.')) {
                return;
            }

            try {
                deleteSheetConfigBtn.disabled = true;
                deleteSheetConfigBtn.textContent = 'Desvinculando...';

                // Para este exemplo, vamos usar o serviço importado diretamente
                googleSheetsService.init(pb);

                await googleSheetsService.deleteSheetConfig();

                showSuccessMessage('Planilha desvinculada com sucesso!');
                
                setTimeout(() => {
                    window.location.reload(); // Recarrega a página para atualizar o estado da UI
                }, 2000);

            } catch (error) {
                console.error('Erro ao desvincular planilha:', error);
                showErrorMessage(`Não foi possível desvincular a planilha: ${error.message}`);
                deleteSheetConfigBtn.disabled = false;
                deleteSheetConfigBtn.textContent = 'Desvincular Planilha';
            }
        });
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initConfigurationPage);