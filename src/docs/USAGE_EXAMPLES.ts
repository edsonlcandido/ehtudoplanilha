/**
 * Exemplos de uso da arquitetura refatorada
 * Este arquivo demonstra como usar os serviços e componentes criados
 */

// ============================================
// 1. Importando o PocketBase
// ============================================

import { pb } from './main';

// Agora você tem acesso ao PocketBase em qualquer arquivo
console.log('PocketBase URL:', pb.baseUrl);


// ============================================
// 2. Usando o serviço de autenticação
// ============================================

import {
  isAuthenticated,
  getCurrentUser,
  logout,
  logoutAndReload,
  redirectToLogin,
  redirectToDashboard,
  onAuthChange
} from './services/auth';

// Verificar se usuário está autenticado
if (isAuthenticated()) {
  console.log('Usuário está logado');
  
  // Pegar dados do usuário
  const user = getCurrentUser();
  console.log('Email:', user?.email);
}

// Logout simples
logout();

// Logout com reload automático
logoutAndReload();

// Observar mudanças na autenticação
onAuthChange((isAuth) => {
  if (isAuth) {
    console.log('Usuário fez login');
  } else {
    console.log('Usuário fez logout');
  }
});


// ============================================
// 3. Usando a configuração de ambiente
// ============================================

import { config, API_ENDPOINTS } from './config/env';

// Verificar ambiente
if (config.isDevelopment) {
  console.log('Rodando em desenvolvimento');
  console.log('PocketBase URL:', config.pocketbaseUrl);
}

// Usar endpoints tipados
async function appendEntry(data: any) {
  try {
    const response = await pb.send(API_ENDPOINTS.appendEntry, {
      method: 'POST',
      body: data,
    });
    return response;
  } catch (error) {
    console.error('Erro ao adicionar lançamento:', error);
    throw error;
  }
}

// Todos os endpoints disponíveis
console.log('Endpoints disponíveis:', Object.keys(API_ENDPOINTS));


// ============================================
// 3.1. Usando o serviço de Sheets
// ============================================

import { SheetsService } from './services/sheets';
import type { SheetEntry, FinancialSummary } from './services/sheets';

// Verificar se tem configuração
async function checkUserConfig() {
  const status = await SheetsService.getConfigStatus();
  
  if (!status.hasRefreshToken) {
    console.log('Usuário precisa autorizar Google');
    // Redirecionar para OAuth
  }
  
  if (!status.hasSheetId) {
    console.log('Usuário precisa provisionar planilha');
    // Provisionar planilha
  }
  
  return status;
}

// Provisionar nova planilha
async function setupSheet() {
  const { sheetId, sheetName } = await SheetsService.provisionSheet();
  console.log('Planilha criada:', sheetName, sheetId);
}

// Adicionar lançamento
async function addExpense() {
  await SheetsService.appendEntry({
    data: '2025-01-15',
    conta: 'Cartão Crédito',
    valor: -150.50,
    descricao: 'Supermercado',
    categoria: 'Alimentação',
    tipo: 'Despesa'
  });
}

// Obter lançamentos do mês
async function getMonthEntries() {
  const entries = await SheetsService.getSheetEntries('01', '2025');
  console.log('Lançamentos:', entries);
}

// Obter resumo financeiro
async function getMonthSummary() {
  const summary: FinancialSummary = await SheetsService.getFinancialSummary('01', '2025');
  console.log('Receitas:', summary.totalReceitas);
  console.log('Despesas:', summary.totalDespesas);
  console.log('Saldo:', summary.saldo);
}


// ============================================
// 3.2. Usando o serviço de OAuth Google
// ============================================

import { GoogleOAuthService } from './services/google-oauth';
import { getCurrentUser } from './services/auth';

// Iniciar fluxo OAuth
async function startGoogleAuth() {
  const user = getCurrentUser();
  if (!user) {
    console.error('Usuário não autenticado');
    return;
  }
  
  await GoogleOAuthService.startAuthFlow(user.id);
  // Redireciona automaticamente para Google
}

// Verificar callback OAuth na página
function checkOAuthCallback() {
  const result = GoogleOAuthService.handleCallback();
  
  if (result.success) {
    console.log('Autorização bem-sucedida!');
    // Atualizar UI
  } else if (result.error) {
    console.error('Erro na autorização:', result.error);
    // Mostrar mensagem de erro
  }
}


// ============================================
// 4. Usando o componente de menu
// ============================================

import { initUserMenu, renderUserMenu } from './components/user-menu';

// Inicializar o menu (faz tudo automaticamente)
initUserMenu();

// Ou re-renderizar manualmente quando necessário
renderUserMenu();


// ============================================
// 5. Estrutura de uma nova página
// ============================================

// arquivo: nova-pagina.ts
/*
import './main';  // SEMPRE importar primeiro
import { initUserMenu } from './components/user-menu';
import { isAuthenticated, redirectToLogin } from './services/auth';
import { config } from './config/env';

function init(): void {
  // Log em dev
  if (config.isDevelopment) {
    console.log('[NovaPagina] Inicializada');
  }

  // Verificar autenticação se necessário
  if (!isAuthenticated()) {
    redirectToLogin();
    return;
  }

  // Inicializar menu
  initUserMenu();

  // Lógica específica da página
  setupEventListeners();
  loadData();
}

function setupEventListeners(): void {
  // Event listeners da página
}

function loadData(): void {
  // Carregar dados da página
}

// DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
*/


// ============================================
// 6. Tipagem com TypeScript
// ============================================

import type { User, GoogleInfo, PocketBaseInstance } from './types';

// Funções fortemente tipadas
async function updateUserProfile(userId: string, data: Partial<User>) {
  const record = await pb.collection('users').update<User>(userId, data);
  return record;
}

async function getGoogleInfo(userId: string): Promise<GoogleInfo | null> {
  try {
    const record = await pb
      .collection('google_infos')
      .getFirstListItem<GoogleInfo>(`user_id="${userId}"`);
    return record;
  } catch (error) {
    return null;
  }
}


// ============================================
// 7. Boas práticas
// ============================================

// ✅ SEMPRE importar './main' primeiro
// ✅ Usar serviços ao invés de acessar pb.authStore diretamente
// ✅ Usar API_ENDPOINTS ao invés de hardcoded strings
// ✅ Usar tipos TypeScript para autocomplete e validação
// ✅ Adicionar logs em desenvolvimento com config.isDevelopment
// ✅ Tratar erros adequadamente
// ✅ Usar funções pequenas e focadas

// ❌ NÃO fazer isso:
// const user = pb.authStore.model;  // Use getCurrentUser()
// const url = 'http://localhost:8090';  // Use config.pocketbaseUrl
// await pb.send('/append-entry', ...);  // Use API_ENDPOINTS.appendEntry


// ============================================
// 8. Exemplo completo: Página de dashboard
// ============================================

/*
// dashboard.ts
import './main';
import { initUserMenu } from './components/user-menu';
import { isAuthenticated, getCurrentUser, redirectToLogin } from './services/auth';
import { config, API_ENDPOINTS } from './config/env';
import type { User } from './types';

interface DashboardData {
  summary: any;
  entries: any[];
}

async function init(): Promise<void> {
  // Verificar autenticação
  if (!isAuthenticated()) {
    redirectToLogin();
    return;
  }

  // Inicializar UI
  initUserMenu();
  showLoadingState();

  try {
    // Carregar dados
    const data = await loadDashboardData();
    renderDashboard(data);
  } catch (error) {
    showErrorMessage('Erro ao carregar dashboard');
    console.error(error);
  }
}

async function loadDashboardData(): Promise<DashboardData> {
  const user = getCurrentUser() as User;
  
  const [summary, entries] = await Promise.all([
    pb.send(API_ENDPOINTS.getFinancialSummary, {
      method: 'POST',
      body: { month: '01', year: '2025' }
    }),
    pb.send(API_ENDPOINTS.getSheetEntries, {
      method: 'POST',
      body: { month: '01', year: '2025' }
    })
  ]);

  return { summary, entries };
}

function renderDashboard(data: DashboardData): void {
  // Renderizar dados no DOM
}

function showLoadingState(): void {
  // Mostrar loading
}

function showErrorMessage(message: string): void {
  // Mostrar erro
}

// DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
*/

export {};
