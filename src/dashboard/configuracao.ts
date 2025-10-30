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
  
  // Cartão 2: Planilha
  currentSheetName: document.getElementById('current-sheet-name') as HTMLParagraphElement,
  currentSheetDescription: document.getElementById('current-sheet-description') as HTMLParagraphElement,
  openSheetLink: document.getElementById('openSheetLink') as HTMLAnchorElement,
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
  } else {
    elements.googleAuthButton.textContent = '🔑 Autorizar com Google';
    elements.googleAuthButton.classList.remove('success');
    elements.googleAuthButton.classList.add('primary');
    elements.googleAuthButton.disabled = false;
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
  } else {
    // Não tem planilha
    elements.currentSheetName.textContent = 'Nenhuma planilha configurada';
    elements.currentSheetName.style.color = '#e74c3c';
    
    if (pageState.hasRefreshToken) {
      elements.currentSheetDescription.textContent = 
        '⏳ Criando sua planilha automaticamente...';
    } else {
      elements.currentSheetDescription.textContent = 
        'Autorize o Google Drive para criar sua planilha automaticamente.';
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
  alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
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
  alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
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
    
    // Se tem refresh token mas não tem planilha, criar automaticamente
    if (pageState.hasRefreshToken && !pageState.hasSheetId) {
      console.log('🔄 Usuário autorizado sem planilha, criando automaticamente...');
      console.log('🔄 hasRefreshToken:', pageState.hasRefreshToken);
      console.log('🔄 hasSheetId:', pageState.hasSheetId);
      await createSheetAutomatically();
    } else {
      console.log('ℹ️ Não criar planilha automaticamente porque:');
      console.log('  - hasRefreshToken:', pageState.hasRefreshToken);
      console.log('  - hasSheetId:', pageState.hasSheetId);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar status:', error);
    showErrorMessage('Erro ao carregar configurações. Tente recarregar a página.');
  }
}

/**
 * Cria planilha automaticamente após autorização
 */
async function createSheetAutomatically(): Promise<void> {
  try {
    // Atualizar UI para mostrar que está criando
    if (elements.currentSheetDescription) {
      elements.currentSheetDescription.textContent = '⏳ Criando sua planilha automaticamente...';
    }
    
    console.log('📋 Criando planilha automaticamente...');
    const result = await SheetsService.provisionSheet();
    
    console.log('✅ Planilha criada:', result);
    
    // Atualizar estado local
    pageState.hasSheetId = true;
    pageState.sheetId = result.sheetId;
    pageState.sheetName = result.sheetName;
    
    updateSheetInfo();
    
    showSuccessMessage(`Planilha "${result.sheetName}" criada com sucesso! Você já pode começar a usar.`);
    
  } catch (error: any) {
    console.error('❌ Erro ao criar planilha automaticamente:', error);
    showErrorMessage(
      error?.message || 'Erro ao criar planilha automaticamente. Tente recarregar a página.'
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

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners(): void {
  // Cartão 1: Autorização Google
  elements.googleAuthButton?.addEventListener('click', handleGoogleAuth);
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
