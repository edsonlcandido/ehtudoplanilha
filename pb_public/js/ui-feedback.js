/**
 * Módulo para gerenciamento de feedback visual para o usuário
 * Fornece funções para exibir mensagens de sucesso, erro e aviso
 */

/**
 * Exibe mensagem de sucesso com fundo verde
 * @param {string} message - Mensagem a ser exibida
 */
export function showSuccessMessage(message) {
    showMessage(message, '#4caf50', '#ffffff');
}

/**
 * Exibe mensagem de erro com fundo vermelho
 * @param {string} message - Mensagem a ser exibida
 */
export function showErrorMessage(message) {
    showMessage(message, '#f44336', '#ffffff');
}

/**
 * Exibe mensagem de aviso com fundo laranja
 * @param {string} message - Mensagem a ser exibida
 */
export function showWarningMessage(message) {
    showMessage(message, '#ff9800', '#ffffff');
}

/**
 * Função genérica para exibir mensagens
 * @param {string} message - Mensagem a ser exibida
 * @param {string} backgroundColor - Cor de fundo
 * @param {string} textColor - Cor do texto
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

    // Remover após 5 segundos
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 5000);
}