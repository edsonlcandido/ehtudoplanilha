/**
 * Página de Configuração
 * Gerencia autorização Google OAuth e criação de planilha
 */

import { renderUserMenu } from '../components/user-menu';
import { GoogleOAuthService } from '../services/google-oauth';
import { SheetsService } from '../services/sheets';
import { pb } from '../main';

// ============================================================================
// Estado da Página
// ============================================================================

interface PageState {
  hasRefreshToken: boolean;
  hasSheetId: boolean;
  sheetId?: string;
  sheetName?: string;
}

let pageState: PageState = {
  hasRefreshToken: false,
  hasSheetId: false,
};

// ============================================================================
// Elementos do DOM
// ============================================================================

const elements = {
  // Cartão 1: Autorização Google
  googleAuthButton: document.getElementById('google-auth-button') as HTMLButtonElement,
  revokeAuthButton: document.getElementById('revoke-auth-button') as HTMLButtonElement,
  
  // Cartão 2: Planilha
  currentSheetName: document.getElementById('current-sheet-name') as HTMLParagraphElement,
  currentSheetDescription: document.getElementById('current-sheet-description') as HTMLParagraphElement,
  openSheetLink: document.getElementById('openSheetLink') as HTMLAnchorElement,
  createSheetButton: document.getElementById('create-sheet-button') as HTMLButtonElement,
  sheetsList: document.getElementById('sheets-list') as HTMLDivElement,
  loadSheetsButton: document.getElementById('load-sheets-button') as HTMLButtonElement,
};

// ============================================================================
// Funções de UI
// ============================================================================

/**
 * Atualiza o botão de autorização Google
 */
function updateGoogleAuthButton(): void {
  if (!elements.googleAuthButton) return;

  if (pageState.hasRefreshToken) {
    elements.googleAuthButton.textContent = '✅ Conectado ao Google Drive';
    elements.googleAuthButton.classList.remove('primary');
    elements.googleAuthButton.classList.add('success');
    elements.googleAuthButton.disabled = true;
    
    // Mostrar botão de revogar
    if (elements.revokeAuthButton) {
      elements.revokeAuthButton.style.display = 'block';
    }
  } else {
    elements.googleAuthButton.textContent = '🔑 Autorizar com Google';
    elements.googleAuthButton.classList.remove('success');
    elements.googleAuthButton.classList.add('primary');
    elements.googleAuthButton.disabled = false;
    
    // Esconder botão de revogar
    if (elements.revokeAuthButton) {
      elements.revokeAuthButton.style.display = 'none';
    }
  }
}

/**
 * Atualiza as informações da planilha
 */
function updateSheetInfo(): void {
  if (!elements.currentSheetName || !elements.currentSheetDescription) return;

  if (pageState.hasSheetId && pageState.sheetName) {
    // Tem planilha configurada
    elements.currentSheetName.textContent = pageState.sheetName;
    elements.currentSheetName.style.color = '#27ae60';
    
    elements.currentSheetDescription.textContent = 
      'Sua planilha está pronta para uso. Clique no botão abaixo para abrir no Google Drive.';
    
    // Mostrar link para abrir planilha
    if (elements.openSheetLink && pageState.sheetId) {
      elements.openSheetLink.href = `https://docs.google.com/spreadsheets/d/${pageState.sheetId}`;
      elements.openSheetLink.style.display = 'block';
    }
    
    // Esconder botões de criar/selecionar
    if (elements.createSheetButton) {
      elements.createSheetButton.style.display = 'none';
    }
    if (elements.loadSheetsButton) {
      elements.loadSheetsButton.style.display = 'none';
    }
    if (elements.sheetsList) {
      elements.sheetsList.style.display = 'none';
    }
  } else {
    // Não tem planilha
    elements.currentSheetName.textContent = 'Nenhuma planilha configurada';
    elements.currentSheetName.style.color = '#e74c3c';
    
    if (pageState.hasRefreshToken) {
      elements.currentSheetDescription.textContent = 
        'Crie uma nova planilha ou selecione uma existente no seu Google Drive.';
      
      // Mostrar botões de criar/selecionar
      if (elements.createSheetButton) {
        elements.createSheetButton.style.display = 'block';
      }
      if (elements.loadSheetsButton) {
        elements.loadSheetsButton.style.display = 'block';
      }
    } else {
      elements.currentSheetDescription.textContent = 
        'Autorize o Google Drive primeiro para gerenciar suas planilhas.';
      
      // Esconder botões de criar/selecionar
      if (elements.createSheetButton) {
        elements.createSheetButton.style.display = 'none';
      }
      if (elements.loadSheetsButton) {
        elements.loadSheetsButton.style.display = 'none';
      }
    }
    
    // Esconder link
    if (elements.openSheetLink) {
      elements.openSheetLink.style.display = 'none';
    }
  }
}

/**
 * Mostra mensagem de sucesso temporária
 */
function showSuccessMessage(message: string): void {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert success';
  alertDiv.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 99999; min-width: 300px; max-width: 500px;';
  alertDiv.innerHTML = `
    <strong>✅ Sucesso!</strong>
    <p>${message}</p>
  `;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 4000);
}

/**
 * Mostra mensagem de erro temporária
 */
function showErrorMessage(message: string): void {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert error';
  alertDiv.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 99999; min-width: 300px; max-width: 500px;';
  alertDiv.innerHTML = `
    <strong>❌ Erro!</strong>
    <p>${message}</p>
  `;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// ============================================================================
// Funções de Negócio
// ============================================================================

/**
 * Carrega o status de configuração do usuário
 */
async function loadConfigStatus(): Promise<void> {
  try {
    console.log('🔍 [loadConfigStatus] Iniciando...');
    const status = await SheetsService.getConfigStatus();
    
    console.log('📊 [loadConfigStatus] Status recebido do backend:', status);
    
    pageState = {
      hasRefreshToken: status.hasRefreshToken,
      hasSheetId: status.hasSheetId,
      sheetId: status.sheetId,
      sheetName: status.sheetName,
    };
    
    console.log('📊 [loadConfigStatus] PageState atualizado:', pageState);
    
    updateGoogleAuthButton();
    updateSheetInfo();
    
    console.log('✅ Status carregado:', pageState);
  } catch (error) {
    console.error('❌ Erro ao carregar status:', error);
    showErrorMessage('Erro ao carregar configurações. Tente recarregar a página.');
  }
}

/**
 * Cria uma nova planilha
 */
async function handleCreateNewSheet(): Promise<void> {
  try {
    // Atualizar UI para mostrar que está criando
    if (elements.currentSheetDescription) {
      elements.currentSheetDescription.textContent = '⏳ Criando sua planilha...';
    }
    
    console.log('📋 Criando nova planilha...');
    const result = await SheetsService.provisionSheet();
    
    console.log('✅ Planilha criada:', result);
    
    // Backend retorna sheet_name (snake_case), converter para sheetName (camelCase)
    const sheetName = (result as any).sheet_name || result.sheetName || 'Planilha Eh Tudo';
    const sheetId = (result as any).sheet_id || result.sheetId;
    
    // Atualizar estado local
    pageState.hasSheetId = true;
    pageState.sheetId = sheetId;
    pageState.sheetName = sheetName;
    
    updateSheetInfo();
    
    showSuccessMessage(`Planilha "${sheetName}" criada com sucesso! Você já pode começar a usar.`);
    
  } catch (error: any) {
    console.error('❌ Erro ao criar nova planilha:', error);
    showErrorMessage(
      error?.message || 'Erro ao criar planilha. Tente novamente.'
    );
  }
}

/**
 * Lista e exibe as planilhas disponíveis do usuário
 */
async function handleListSheets(): Promise<void> {
  try {
    console.log('📋 Listando planilhas do Google Drive...');
    
    // Desabilitar botão durante o carregamento
    if (elements.loadSheetsButton) {
      elements.loadSheetsButton.disabled = true;
      elements.loadSheetsButton.textContent = '⏳ Carregando...';
    }
    
    const sheets = await SheetsService.listGoogleSheets();
    
    console.log('✅ Planilhas encontradas:', sheets);
    
    if (sheets.length === 0) {
      showErrorMessage('Nenhuma planilha encontrada no seu Google Drive.');
      if (elements.sheetsList) {
        elements.sheetsList.innerHTML = '<p style="color: #999; text-align: center; padding: 1rem;">Nenhuma planilha encontrada.</p>';
      }
    } else {
      // Renderizar lista de planilhas
      if (elements.sheetsList) {
        elements.sheetsList.innerHTML = '<h4 style="margin-bottom: 1rem;">Selecione uma planilha:</h4>';
        
        const listContainer = document.createElement('div');
        listContainer.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto;';
        
        sheets.forEach(sheet => {
          const sheetItem = document.createElement('button');
          sheetItem.className = 'button';
          sheetItem.style.cssText = 'width: 100%; text-align: left; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; background-color: #f8f9fa; border: 1px solid #e0e0e0;';
          
          // Formatar data de modificação
          let modifiedDateText = '';
          if (sheet.modifiedTime) {
            const modifiedDate = new Date(sheet.modifiedTime);
            modifiedDateText = modifiedDate.toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
          
          sheetItem.innerHTML = `
            <div style="flex: 1; overflow: hidden;">
              <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #333;">${sheet.name}</strong>
              <small style="color: #666; display: block;">Modificado: ${modifiedDateText || 'N/A'}</small>
            </div>
            <span style="color: #27ae60; font-size: 1.2rem;">→</span>
          `;
          
          sheetItem.addEventListener('click', () => handleSelectSheet(sheet.id, sheet.name));
          
          listContainer.appendChild(sheetItem);
        });
        
        elements.sheetsList.appendChild(listContainer);
        elements.sheetsList.style.display = 'block';
      }
    }
    
    // Reabilitar botão
    if (elements.loadSheetsButton) {
      elements.loadSheetsButton.disabled = false;
      elements.loadSheetsButton.textContent = '🔄 Recarregar Lista';
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao listar planilhas:', error);
    showErrorMessage(
      error?.message || 'Erro ao listar planilhas. Tente novamente.'
    );
    
    // Reabilitar botão em caso de erro
    if (elements.loadSheetsButton) {
      elements.loadSheetsButton.disabled = false;
      elements.loadSheetsButton.textContent = '📋 Carregar Minhas Planilhas';
    }
  }
}

/**
 * Seleciona uma planilha existente
 */
async function handleSelectSheet(sheetId: string, sheetName: string): Promise<void> {
  try {
    console.log(`📋 Selecionando planilha: ${sheetName} (${sheetId})`);
    
    await SheetsService.saveSheetId(sheetId, sheetName);
    
    console.log('✅ Planilha selecionada com sucesso');
    
    // Atualizar estado local
    pageState.hasSheetId = true;
    pageState.sheetId = sheetId;
    pageState.sheetName = sheetName;
    
    updateSheetInfo();
    
    showSuccessMessage(`Planilha "${sheetName}" selecionada com sucesso!`);
    
  } catch (error: any) {
    console.error('❌ Erro ao selecionar planilha:', error);
    showErrorMessage(
      error?.message || 'Erro ao selecionar planilha. Tente novamente.'
    );
  }
}

/**
 * Inicia o fluxo de autorização OAuth
 */
async function handleGoogleAuth(): Promise<void> {
  try {
    const user = pb.authStore.record;
    if (!user?.id) {
      showErrorMessage('Usuário não autenticado.');
      return;
    }
    
    console.log('🔑 Iniciando fluxo OAuth...');
    await GoogleOAuthService.startAuthFlow(user.id);
  } catch (error) {
    console.error('❌ Erro ao iniciar OAuth:', error);
    showErrorMessage('Erro ao iniciar autorização com Google.');
  }
}

/**
 * Revoga a autorização OAuth do Google
 */
async function handleRevokeAuth(): Promise<void> {
  // Confirmar com o usuário
  const confirmed = confirm(
    'Tem certeza que deseja revogar a autorização do Google Drive?\n\n' +
    'Isso irá:\n' +
    '• Remover todos os tokens de acesso\n' +
    '• Limpar a configuração da planilha\n' +
    '• Será necessário autorizar novamente para usar o sistema\n\n' +
    'Deseja continuar?'
  );
  
  if (!confirmed) {
    return;
  }
  
  try {
    console.log('🚫 Revogando autorização Google...');
    
    // Desabilitar botão durante o processo
    if (elements.revokeAuthButton) {
      elements.revokeAuthButton.disabled = true;
      elements.revokeAuthButton.textContent = '⏳ Revogando...';
    }
    
    // Chamar endpoint de revogação
    await SheetsService.revokeGoogleAccess();
    
    console.log('✅ Autorização revogada com sucesso');
    
    // Atualizar estado local
    pageState.hasRefreshToken = false;
    pageState.hasSheetId = false;
    pageState.sheetId = undefined;
    pageState.sheetName = undefined;
    
    // Atualizar UI
    updateGoogleAuthButton();
    updateSheetInfo();
    
    showSuccessMessage('Autorização revogada com sucesso! Você pode autorizar novamente quando quiser.');
    
  } catch (error: any) {
    console.error('❌ Erro ao revogar autorização:', error);
    showErrorMessage(
      error?.message || 'Erro ao revogar autorização. Tente novamente.'
    );
    
    // Reabilitar botão em caso de erro
    if (elements.revokeAuthButton) {
      elements.revokeAuthButton.disabled = false;
      elements.revokeAuthButton.textContent = '🚫 Revogar Autorização';
    }
  }
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners(): void {
  // Cartão 1: Autorização Google
  elements.googleAuthButton?.addEventListener('click', handleGoogleAuth);
  elements.revokeAuthButton?.addEventListener('click', handleRevokeAuth);
  
  // Cartão 2: Planilha
  elements.createSheetButton?.addEventListener('click', handleCreateNewSheet);
  elements.loadSheetsButton?.addEventListener('click', handleListSheets);
}

// ============================================================================
// Inicialização
// ============================================================================

async function init(): Promise<void> {
  // Renderiza menu do usuário
  renderUserMenu();
  
  // Configura event listeners
  setupEventListeners();
  
  // Carrega status inicial
  await loadConfigStatus();
  
  console.log('✅ Página de configuração inicializada');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
