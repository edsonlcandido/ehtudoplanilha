/**
 * Gerenciador de planilhas Google Sheets
 * Responsável pela interface de seleção e provisionamento de planilhas
 */

import googleSheetsService from './google/sheets-api.js';

// Estado global do seletor de planilhas
let selectedSheetId = null;
let selectedSheetName = null;

/**
 * Inicializa o gerenciador de planilhas
 */
function initSheetsManager() {
    // Inicializa o serviço de planilhas com a instância do PocketBase
    googleSheetsService.init(window.pb);
    
    // Registra os event listeners para os botões e elementos do modal
    registerEventListeners();
    
    // Carrega informações da planilha atual
    loadCurrentSheetInfo();
}

/**
 * Registra todos os event listeners necessários
 */
function registerEventListeners() {
    const selectSheetBtn = document.getElementById('selectSheetBtn');
    const provisionSheetBtn = document.getElementById('provisionSheetBtn');
    const clearSheetBtn = document.getElementById('clearSheetBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const retryBtn = document.getElementById('retryBtn');
    
    if (selectSheetBtn) {
        selectSheetBtn.addEventListener('click', openSheetsModal);
    }
    
    if (provisionSheetBtn) {
        provisionSheetBtn.addEventListener('click', provisionTemplate);
    }
    
    if (clearSheetBtn) {
        clearSheetBtn.addEventListener('click', clearSheetContent);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeSheetsModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeSheetsModal);
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (selectedSheetId) {
                saveSelectedSheet();
            }
        });
    }
    
    if (retryBtn) {
        retryBtn.addEventListener('click', loadGoogleSheets);
    }
    
    // Adiciona a função de seleção de planilha ao escopo global
    window.selectSheet = selectSheet;
}

/**
 * Abre o modal de seleção de planilhas
 */
function openSheetsModal() {
    const modalCheckbox = document.getElementById('modal_sheets');
    if (modalCheckbox) {
        modalCheckbox.checked = true;
        
        // Reseta o estado do modal
        resetModalState();
        
        // Carrega as planilhas do usuário
        loadGoogleSheets();
    }
}

/**
 * Fecha o modal de seleção de planilhas
 */
function closeSheetsModal() {
    const modalCheckbox = document.getElementById('modal_sheets');
    if (modalCheckbox) {
        modalCheckbox.checked = false;
        selectedSheetId = null;
        selectedSheetName = null;
    }
}

/**
 * Reseta o estado do modal para o estado inicial de carregamento
 */
function resetModalState() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const sheetsListState = document.getElementById('sheetsListState');
    const confirmBtn = document.getElementById('confirmBtn');
    
    if (loadingState) loadingState.style.display = 'block';
    if (errorState) errorState.style.display = 'none';
    if (sheetsListState) sheetsListState.style.display = 'none';
    if (confirmBtn) confirmBtn.style.display = 'none';
    
    selectedSheetId = null;
    selectedSheetName = null;
}

/**
 * Carrega as planilhas do Google Sheets do usuário
 */
async function loadGoogleSheets() {
    try {
        resetModalState();
        const data = await googleSheetsService.listUserSheets();

        if (data.success && data.sheets) {
            displaySheetsList(data.sheets);
        } else {
            throw new Error('Resposta inválida do servidor');
        }
    } catch (error) {
        console.error('Erro ao carregar planilhas:', error);
        showError(error.message);
    }
}

/**
 * Exibe a lista de planilhas no modal
 * @param {Array} sheets - Lista de planilhas do usuário
 */
function displaySheetsList(sheets) {
    const sheetsList = document.getElementById('sheetsList');
    const loadingState = document.getElementById('loadingState');
    const sheetsListState = document.getElementById('sheetsListState');
    
    if (!sheetsList || !loadingState || !sheetsListState) return;
    
    const formattedSheets = googleSheetsService.formatSheetsForDisplay(sheets);

    if (formattedSheets.length === 0) {
        sheetsList.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma planilha encontrada. Crie uma planilha no Google Sheets primeiro.</p>';
    } else {
        sheetsList.innerHTML = formattedSheets.map(sheet => `
            <div class="sheet-item" style="border: 1px solid #ddd; padding: 1rem; margin: 0.5rem 0; border-radius: 4px; cursor: pointer; transition: background-color 0.2s;" 
                 onclick="selectSheet('${sheet.id}', '${sheet.name}')"
                 data-sheet-id="${sheet.id}">
                <strong>${sheet.name}</strong>
                ${sheet.modifiedTime ? `<small style="display: block; color: #666; margin-top: 0.25rem;">Modificada em: ${sheet.formattedModifiedDate}</small>` : ''}
            </div>
        `).join('');
    }

    // Mostrar lista
    loadingState.style.display = 'none';
    sheetsListState.style.display = 'block';
}

/**
 * Seleciona uma planilha na lista
 * @param {string} sheetId - ID da planilha selecionada
 * @param {string} sheetName - Nome da planilha selecionada
 */
function selectSheet(sheetId, sheetName) {
    // Remove seleção anterior
    document.querySelectorAll('.sheet-item').forEach(item => {
        item.style.backgroundColor = '';
        item.style.borderColor = '#ddd';
    });

    // Adiciona seleção atual
    const selectedItem = document.querySelector(`[data-sheet-id="${sheetId}"]`);
    if (selectedItem) {
        selectedItem.style.backgroundColor = '#e3f2fd';
        selectedItem.style.borderColor = '#2196f3';
    }

    selectedSheetId = sheetId;
    selectedSheetName = sheetName;

    // Mostrar botão confirmar
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
        confirmBtn.style.display = 'inline-block';
    }
}

/**
 * Salva a planilha selecionada para o usuário
 */
async function saveSelectedSheet() {
    if (!selectedSheetId) return;

    try {
        // Mostrar loading no botão
        const confirmBtn = document.getElementById('confirmBtn');
        if (!confirmBtn) return;
        
        const originalText = confirmBtn.textContent;
        confirmBtn.textContent = 'Salvando...';
        confirmBtn.disabled = true;

        const data = await googleSheetsService.saveSelectedSheet(selectedSheetId, selectedSheetName);
        console.log('Dados recebidos ao salvar planilha:', data);
        if (data.success) {
            // Sucesso - fechar modal e mostrar feedback
            closeSheetsModal();
            showSuccessMessage(`Planilha "${data.sheet_name}" selecionada com sucesso!`);
            
            // Recarregar informações da planilha atual
            setTimeout(() => {
                loadCurrentSheetInfo();
            }, 1000);
        } else {
            throw new Error(data.message || 'Erro desconhecido');
        }

    } catch (error) {
        console.error('Erro ao salvar planilha:', error);
        alert('Erro ao salvar planilha: ' + error.message);

        // Restaurar botão
        const confirmBtn = document.getElementById('confirmBtn');
        if (confirmBtn) {
            confirmBtn.textContent = 'Confirmar Seleção';
            confirmBtn.disabled = false;
        }
    }
}

/**
 * Exibe mensagem de erro no modal
 * @param {string} message - Mensagem de erro
 */
function showError(message) {
    const loadingState = document.getElementById('loadingState');
    const sheetsListState = document.getElementById('sheetsListState');
    const errorMessage = document.getElementById('errorMessage');
    const errorState = document.getElementById('errorState');
    
    if (!loadingState || !sheetsListState || !errorMessage || !errorState) return;
    
    loadingState.style.display = 'none';
    sheetsListState.style.display = 'none';
    errorMessage.textContent = message;
    errorState.style.display = 'block';
}

/**
 * Provisiona uma nova planilha template para o usuário
 */
async function provisionTemplate() {
    const provisionBtn = document.getElementById('provisionSheetBtn');
    if (!provisionBtn) return;
    
    const originalText = provisionBtn.textContent;

    try {
        // Mostrar loading
        provisionBtn.textContent = 'Copiando...';
        provisionBtn.disabled = true;

        const data = await googleSheetsService.provisionTemplateSheet();

        if (data.success) {
            if (data.action === 'existing') {
                showSuccessMessage('Você já possui uma planilha configurada!');
            } else {
                showSuccessMessage(`Template copiado com sucesso! Planilha "${data.sheet_name}" criada no seu Google Drive.`);
                // Recarregar informações da planilha atual
                setTimeout(() => {
                    loadCurrentSheetInfo();
                }, 1000);
            }
        } else {
            throw new Error(data.message || 'Erro desconhecido');
        }

    } catch (error) {
        console.error('Erro ao provisionar template:', error);
        showErrorMessage('Erro ao copiar template: ' + error.message);
    } finally {
        // Restaurar botão
        provisionBtn.textContent = originalText;
        provisionBtn.disabled = false;
    }
}

/**
 * Exibe mensagem de sucesso
 * @param {string} message - Mensagem de sucesso
 */
function showSuccessMessage(message) {
    showMessage(message, '#4caf50', '#ffffff');
}

/**
 * Exibe mensagem de erro
 * @param {string} message - Mensagem de erro
 */
function showErrorMessage(message) {
    showMessage(message, '#f44336', '#ffffff');
}

/**
 * Exibe mensagem temporária na tela
 * @param {string} message - Mensagem a ser exibida
 * @param {string} backgroundColor - Cor de fundo
 * @param {string} textColor - Cor do texto
 */
function showMessage(message, backgroundColor, textColor) {
    // Criar elemento de feedback temporário
    const feedback = document.createElement('div');
    // Calcula deslocamento abaixo da navbar em telas pequenas
    const nav = document.querySelector('nav');
    const navHeight = nav ? nav.getBoundingClientRect().height : 60;
    // Para mobile usamos altura da nav + 12px; para desktop mantemos 20px
    const topOffset = window.innerWidth <= 768 ? (navHeight + 12) : 20;
    feedback.style.cssText = `
        position: fixed;
        top: ${topOffset}px;
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
        transition: opacity .3s ease, transform .3s ease; 
        opacity: 0; 
        transform: translateY(-5px);
    `;
    feedback.textContent = message;
    document.body.appendChild(feedback);

    // Força reflow e anima aparição
    requestAnimationFrame(() => {
        feedback.style.opacity = '1';
        feedback.style.transform = 'translateY(0)';
    });

    // Ajusta posição em um resize (curto) somente enquanto visível
    const resizeHandler = () => {
        if (!feedback.parentNode) return;
        const newNavHeight = nav ? nav.getBoundingClientRect().height : 60;
        const newTop = window.innerWidth <= 768 ? (newNavHeight + 12) : 20;
        feedback.style.top = newTop + 'px';
    };
    window.addEventListener('resize', resizeHandler);

    // Remover após 5 segundos
    setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.style.transform = 'translateY(-5px)';
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
            window.removeEventListener('resize', resizeHandler);
        }, 300);
    }, 5000);
}

/**
 * Carrega e exibe informações da planilha atual do usuário
 */
async function loadCurrentSheetInfo() {
    try {
        const data = await googleSheetsService.getCurrentSheetInfo();
        
        const currentSheetCard = document.getElementById('current-sheet-card');
        const currentSheetName = document.getElementById('current-sheet-name');
        const currentSheetDescription = document.getElementById('current-sheet-description');
        
        if (!currentSheetCard || !currentSheetName || !currentSheetDescription) {
            console.warn('Elementos do card da planilha atual não encontrados');
            return;
        }
        
        // O card sempre é exibido, independente de ter planilha ou não
        currentSheetCard.style.display = 'flex';
        
        const clearSheetBtn = document.getElementById('clearSheetBtn');
        const provisionSheetBtn = document.getElementById('provisionSheetBtn');
        const deleteSheetConfigBtn = document.getElementById('deleteSheetConfigBtn');
        
        if (data.success && data.hasSheet) {
            // Usuário tem uma planilha configurada
            const sheetName = data.sheet_name || 'Planilha sem nome';
            const sheetId = data.sheet_id;
            
            if (sheetId) {
                // Criar link para a planilha com ícone de acesso externo
                const sheetUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/edit`;
                const externalIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 0.25rem; vertical-align: middle;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15,3 21,3 21,9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
                
                // Escapar HTML para prevenir XSS
                const escapedSheetName = sheetName.replace(/[&<>"']/g, function(match) {
                    const escapeMap = {
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;',
                        '"': '&quot;',
                        "'": '&#x27;'
                    };
                    return escapeMap[match];
                });
                
                currentSheetName.innerHTML = `<a href="${sheetUrl}" target="_blank" rel="noopener noreferrer" style="color: #2196f3; text-decoration: underline; display: inline-flex; align-items: center;">${escapedSheetName}${externalIcon}</a>`;
            } else {
                currentSheetName.textContent = sheetName;
            }
            
            currentSheetDescription.textContent = 'Sua planilha de controle financeiro está configurada e pronta para uso.';
            if (clearSheetBtn) clearSheetBtn.style.display = 'block';
            if (deleteSheetConfigBtn) deleteSheetConfigBtn.style.display = 'block'; // Mostra o botão de desvincular
            if (provisionSheetBtn) {
                provisionSheetBtn.className = 'button secondary';
                provisionSheetBtn.style.flex = '1';
            }
        } else {
            // Usuário não tem planilha configurada
            currentSheetName.textContent = 'Nenhuma planilha selecionada';
            currentSheetDescription.textContent = 'Você ainda não possui uma planilha configurada.';
            if (clearSheetBtn) clearSheetBtn.style.display = 'none';
            if (deleteSheetConfigBtn) deleteSheetConfigBtn.style.display = 'none'; // Esconde o botão de desvincular
            if (provisionSheetBtn) {
                provisionSheetBtn.className = 'button primary';
                provisionSheetBtn.style.flex = '1';
                provisionSheetBtn.style.width = '100%';
            }
        }
        
    } catch (error) {
        console.error('Erro ao carregar informações da planilha atual:', error);
        // Em caso de erro, mostrar o card mas sem planilha configurada
        const currentSheetCard = document.getElementById('current-sheet-card');
        const currentSheetName = document.getElementById('current-sheet-name');
        const currentSheetDescription = document.getElementById('current-sheet-description');
        const clearSheetBtn = document.getElementById('clearSheetBtn');
        const provisionSheetBtn = document.getElementById('provisionSheetBtn');
        
        if (currentSheetCard) {
            currentSheetCard.style.display = 'flex';
        }
        
        if (currentSheetName) {
            currentSheetName.textContent = 'Nenhuma planilha selecionada';
        }
        
        if (currentSheetDescription) {
            currentSheetDescription.textContent = 'Erro ao carregar informações da planilha. Tente novamente mais tarde.';
        }
        
        if (clearSheetBtn) {
            clearSheetBtn.style.display = 'none';
        }
        
        if (provisionSheetBtn) {
            provisionSheetBtn.className = 'button primary';
            provisionSheetBtn.style.flex = '1';
            provisionSheetBtn.style.width = '100%';
        }
    }
}

/**
 * Limpa o conteúdo da planilha atual
 */
async function clearSheetContent() {
    const clearBtn = document.getElementById('clearSheetBtn');
    if (!clearBtn) return;
    
    // Confirmar ação com o usuário
    const confirmClear = confirm('Tem certeza que deseja limpar todo o conteúdo da planilha? Esta ação não pode ser desfeita.');
    if (!confirmClear) return;
    
    const originalText = clearBtn.textContent;

    try {
        // Mostrar loading
        clearBtn.textContent = 'Limpando...';
        clearBtn.disabled = true;

        const data = await googleSheetsService.clearSheetContent();

        if (data.success) {
            showSuccessMessage('Conteúdo da planilha limpo com sucesso!');
        } else {
            throw new Error(data.message || 'Erro desconhecido');
        }

    } catch (error) {
        console.error('Erro ao limpar planilha:', error);
        showErrorMessage('Erro ao limpar planilha: ' + error.message);
    } finally {
        // Restaurar botão
        clearBtn.textContent = originalText;
        clearBtn.disabled = false;
    }
}

// Inicialização: se o script for carregado após DOMContentLoaded, executa imediatamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSheetsManager);
} else {
    initSheetsManager();
}

// Exportar funções para uso em outros módulos
export { 
    initSheetsManager,
    openSheetsModal,
    provisionTemplate,
    loadCurrentSheetInfo,
    clearSheetContent,
    showSuccessMessage,
    showErrorMessage,
    showMessage
};
