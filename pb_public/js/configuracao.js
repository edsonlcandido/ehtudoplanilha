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
    let revokeContainer = document.getElementById('revoke-access-container');
    
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

        // Adiciona link de revogação se não existir
        if (!revokeContainer) {
            revokeContainer = document.createElement('div');
            revokeContainer.id = 'revoke-access-container';
            revokeContainer.style.marginTop = '1rem';
            revokeContainer.innerHTML = `
                <small style="display:block; color:#555;">Deseja revogar o acesso? <button id="revokeAccessLink" class="button small error" style="display:inline-block; padding: .25rem .5rem; font-size: .7rem;">Revogar</button></small>
            `;
            authCard.appendChild(revokeContainer);
            const revokeBtn = revokeContainer.querySelector('#revokeAccessLink');
            if (revokeBtn) {
                revokeBtn.addEventListener('click', handleRevokeClick);
            }
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

        // Remove container de revogação se existir
        if (revokeContainer) {
            revokeContainer.remove();
        }
        
        console.log('User needs to authorize, showing authorization button');
    }
}

// Handler para clicar em revogar
async function handleRevokeClick(e) {
    e.preventDefault();
    // Cria modal simples inline
    let existingModal = document.getElementById('revokeModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'revokeModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:10000;padding:1rem;';
    modal.innerHTML = `
        <div style="background:#fff;max-width:420px;width:100%;padding:1.25rem 1.5rem;border-radius:8px;box-shadow:0 10px 28px rgba(0,0,0,.25);">
            <h4 style="margin-top:0;margin-bottom:.75rem;">Revogar acesso Google</h4>
            <p style="font-size:.9rem;line-height:1.4;">Esta ação irá <strong>revogar os tokens</strong>, limpar a planilha vinculada e você precisará autorizar novamente para voltar a usar as integrações.<br><br>Digite <code style="background:#eee;padding:2px 4px;border-radius:3px;">revogar</code> para confirmar.</p>
            <input id="revokeConfirmInput" type="text" placeholder="Digite revogar" style="width:100%;margin:.5rem 0 1rem 0;" />
            <div style="display:flex;gap:.5rem;justify-content:flex-end;">
                <button class="button secondary" id="cancelRevokeBtn">Cancelar</button>
                <button class="button error" id="confirmRevokeBtn" disabled>Revogar</button>
            </div>
        </div>`;
    document.body.appendChild(modal);

    const input = modal.querySelector('#revokeConfirmInput');
    const confirmBtn = modal.querySelector('#confirmRevokeBtn');
    const cancelBtn = modal.querySelector('#cancelRevokeBtn');

    input.addEventListener('input', () => {
        confirmBtn.disabled = input.value.trim().toLowerCase() !== 'revogar';
    });

    cancelBtn.addEventListener('click', () => modal.remove());

    confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Revogando...';
        try {
            await googleOAuthService.revokeAccess();
            modal.remove();
            showSuccessMessage('Acesso Google revogado. Você pode autorizar novamente quando quiser.');
            hasRefreshToken = false;
            updateAuthorizationButton();
            // Atualiza card da planilha para estado "sem planilha".
            const currentSheetName = document.getElementById('current-sheet-name');
            const currentSheetDescription = document.getElementById('current-sheet-description');
            const clearSheetBtn = document.getElementById('clearSheetBtn');
            const deleteSheetConfigBtn = document.getElementById('deleteSheetConfigBtn');
            const provisionSheetBtn = document.getElementById('provisionSheetBtn');

            // Se sheets-manager expôs função global, usa para garantir consistência
            if (window.loadCurrentSheetInfo) {
                try { window.loadCurrentSheetInfo(); } catch(e){ console.warn('Falha ao recarregar info da planilha após revogação:', e); }
            } else {
                // Fallback manual
                if (currentSheetName) currentSheetName.textContent = 'Nenhuma planilha selecionada';
                if (currentSheetDescription) currentSheetDescription.textContent = 'Você ainda não possui uma planilha configurada.';
                if (clearSheetBtn) clearSheetBtn.style.display = 'none';
                if (deleteSheetConfigBtn) deleteSheetConfigBtn.style.display = 'none';
                if (provisionSheetBtn) {
                    provisionSheetBtn.className = 'button primary';
                    provisionSheetBtn.style.width = '100%';
                }
            }
        } catch (error) {
            console.error('Erro ao revogar acesso:', error);
            showErrorMessage('Falha ao revogar acesso: ' + error.message);
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Revogar';
        }
    });
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

// Inicializa quando DOM estiver pronto; se o listener for registrado após o evento já ter ocorrido (import dinâmico), chama imediatamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfigurationPage);
} else {
    // DOM já carregado
    initConfigurationPage();
}