/**
 * Módulo de gerenciamento da página de configuração
 * Inicializa os componentes e gerencia a interação
 */

import { openSheetsModal, closeSheetsModal, selectSheet, saveSelectedSheet, provisionTemplate } from './sheets-manager.js';
import { showSuccessMessage, showErrorMessage, showWarningMessage } from './ui-feedback.js';
import { escapeHtml, formatDate } from './utils.js';

/**
 * Inicializa os eventos da página
 */
export function initConfigPage() {
    // Inicializar quando o DOM estiver carregado
    document.addEventListener('DOMContentLoaded', function() {
        const selectSheetBtn = document.getElementById('selectSheetBtn');
        const provisionSheetBtn = document.getElementById('provisionSheetBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const confirmBtn = document.getElementById('confirmBtn');
        const modalOverlay = document.getElementById('modalOverlay');

        // Abrir modal ao clicar no botão
        selectSheetBtn.addEventListener('click', openSheetsModal);

        // Provisionar template manualmente
        provisionSheetBtn.addEventListener('click', provisionTemplate);

        // Fechar modal ao clicar em cancelar ou overlay
        cancelBtn.addEventListener('click', closeSheetsModal);
        modalOverlay.addEventListener('click', closeSheetsModal);

        // Confirmar seleção
        confirmBtn.addEventListener('click', function() {
            saveSelectedSheet();
        });

        // Expor funções globalmente para interação com o DOM
        window.selectSheet = selectSheet;
        window.escapeHtml = escapeHtml;
        window.formatDate = formatDate;
    });

    // Verificar parâmetros da URL para feedback do OAuth
    handleOAuthCallback();
}

/**
 * Processa respostas de callback do OAuth
 */
function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const provision = urlParams.get('provision');
    const sheetName = urlParams.get('sheet_name');
    const message = urlParams.get('message');

    if (success === 'true') {
        if (provision === 'true' && sheetName) {
            showSuccessMessage(`Autorização concluída e planilha "${sheetName}" criada com sucesso!`);
        } else if (provision === 'false') {
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