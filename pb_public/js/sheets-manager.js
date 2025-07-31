/**
 * Módulo para gerenciamento de planilhas do Google
 * Fornece funcionalidades para seleção, visualização e provisionamento de planilhas
 */

// State management
let selectedSheetId = null;
let selectedSheetName = null;

/**
 * Abre modal de seleção de planilha
 */
export function openSheetsModal() {
    const modalCheckbox = document.getElementById('modal_sheets');
    modalCheckbox.checked = true;
    
    // Reset modal state
    resetModalState();
    
    // Carregar planilhas
    loadGoogleSheets();
}

/**
 * Fecha o modal de seleção
 */
export function closeSheetsModal() {
    const modalCheckbox = document.getElementById('modal_sheets');
    modalCheckbox.checked = false;
    selectedSheetId = null;
    selectedSheetName = null;
}

/**
 * Reinicia o estado do modal
 */
function resetModalState() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('sheetsListState').style.display = 'none';
    document.getElementById('confirmBtn').style.display = 'none';
    selectedSheetId = null;
    selectedSheetName = null;
}

/**
 * Carrega lista de planilhas do Google do usuário
 */
async function loadGoogleSheets() {
    try {
        resetModalState();

        const pb = window.pb;
        const response = await fetch('/list-google-sheets', {
            method: 'GET',
            headers: {
                'Authorization': pb.authStore.token,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('Planilhas carregadas:', data);
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao carregar planilhas');
        }

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
 */
function displaySheetsList(sheets) {
    const sheetsList = document.getElementById('sheetsList');
    
    if (sheets.length === 0) {
        sheetsList.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma planilha encontrada. Crie uma planilha no Google Sheets primeiro.</p>';
    } else {
        sheetsList.innerHTML = sheets.map(sheet => `
            <div class="sheet-item" style="border: 1px solid #ddd; padding: 1rem; margin: 0.5rem 0; border-radius: 4px; cursor: pointer; transition: background-color 0.2s;" 
                 onclick="window.selectSheet('${sheet.id}', '${escapeHtml(sheet.name)}')"
                 data-sheet-id="${sheet.id}">
                <strong>${escapeHtml(sheet.name)}</strong>
                ${sheet.modifiedTime ? `<small style="display: block; color: #666; margin-top: 0.25rem;">Modificada em: ${formatDate(sheet.modifiedTime)}</small>` : ''}
            </div>
        `).join('');
    }

    // Mostrar lista
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('sheetsListState').style.display = 'block';
}

/**
 * Seleciona uma planilha da lista
 */
export function selectSheet(sheetId, sheetName) {
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
    document.getElementById('confirmBtn').style.display = 'inline-block';
}

/**
 * Salva a planilha selecionada para o usuário
 */
export async function saveSelectedSheet() {
    if (!selectedSheetId) return;

    try {
        // Mostrar loading no botão
        const confirmBtn = document.getElementById('confirmBtn');
        const originalText = confirmBtn.textContent;
        confirmBtn.textContent = 'Salvando...';
        confirmBtn.disabled = true;

        const pb = window.pb;
        const response = await fetch('/save-sheet-id', {
            method: 'POST',
            headers: {
                'Authorization': pb.authStore.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sheet_id: selectedSheetId,
                sheet_name: selectedSheetName
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao salvar planilha');
        }

        if (data.success) {
            // Sucesso - fechar modal e mostrar feedback
            closeSheetsModal();
            import('./ui-feedback.js').then(module => {
                module.showSuccessMessage(`Planilha "${selectedSheetName}" selecionada com sucesso!`);
            });
        } else {
            throw new Error(data.message || 'Erro desconhecido');
        }

    } catch (error) {
        console.error('Erro ao salvar planilha:', error);
        alert('Erro ao salvar planilha: ' + error.message);
        
        // Restaurar botão
        const confirmBtn = document.getElementById('confirmBtn');
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    }
}

/**
 * Mostra mensagem de erro no modal
 */
function showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('sheetsListState').style.display = 'none';
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorState').style.display = 'block';
}

/**
 * Provisiona uma nova planilha template para o usuário
 */
export async function provisionTemplate() {
    const provisionBtn = document.getElementById('provisionSheetBtn');
    const originalText = provisionBtn.textContent;
    
    try {
        // Mostrar loading
        provisionBtn.textContent = 'Copiando...';
        provisionBtn.disabled = true;

        const pb = window.pb;
        const response = await fetch('/provision-sheet', {
            method: 'POST',
            headers: {
                'Authorization': pb.authStore.token,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao copiar template');
        }

        if (data.success) {
            const uiFeedback = await import('./ui-feedback.js');
            if (data.action === 'existing') {
                uiFeedback.showSuccessMessage('Você já possui uma planilha configurada!');
            } else {
                uiFeedback.showSuccessMessage(`Template copiado com sucesso! Planilha "${data.sheet_name}" criada no seu Google Drive.`);
            }
        } else {
            throw new Error(data.message || 'Erro desconhecido');
        }

    } catch (error) {
        console.error('Erro ao provisionar template:', error);
        const uiFeedback = await import('./ui-feedback.js');
        uiFeedback.showErrorMessage('Erro ao copiar template: ' + error.message);
    } finally {
        // Restaurar botão
        provisionBtn.textContent = originalText;
        provisionBtn.disabled = false;
    }
}