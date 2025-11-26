/**
 * Configuração de ambiente
 * Detecta automaticamente se está em desenvolvimento ou produção
 */

interface EnvConfig {
  isDevelopment: boolean;
  pocketbaseUrl: string;
  googleOAuthScopes: string;
}

/**
 * Verifica se está em ambiente de desenvolvimento
 */
function isDevelopmentEnvironment(): boolean {
  // Vite define import.meta.env.DEV automaticamente
  if (import.meta.env.DEV !== undefined) {
    return import.meta.env.DEV;
  }
  
  // Fallback: verificação manual
  return false;
}

/**
 * Obtém a URL base do PocketBase
 * Com proxy do Vite, sempre usa window.location.origin
 * O proxy redireciona automaticamente para localhost:8090 em dev
 */
function getPocketBaseUrl(): string {
  // Sempre usa a mesma origem
  // Em dev: Vite proxy redireciona para localhost:8090
  // Em prod: PocketBase serve tudo da mesma origem
  return window.location.origin;
}

/**
 * Configuração exportada
 */
export const config: EnvConfig = {
  isDevelopment: isDevelopmentEnvironment(),
  pocketbaseUrl: getPocketBaseUrl(),
  googleOAuthScopes: 'https://www.googleapis.com/auth/drive.file',
};

/**
 * Endpoints da API customizada do PocketBase
 * Baseados nos hooks em pb_hooks/*.pb.js
 */
export const API_ENDPOINTS = {
  // Google OAuth (google-oauth-callback.pb.js, google-refresh-token.pb.js)
  googleOAuthCallback: '/google-oauth-callback',      // GET  - Callback OAuth Google
  googleRefreshToken: '/google-refresh-token',        // POST - Renovar access_token
  
  // Google Endpoints Auxiliares (google-endpoints.pb.js)
  envVariables: '/env-variables',                     // GET  - Variáveis ambiente OAuth
  checkRefreshToken: '/check-refresh-token',          // GET  - Verifica se tem refresh_token
  listGoogleSheets: '/list-google-sheets',            // GET  - Lista planilhas do usuário
  saveSheetId: '/save-sheet-id',                      // POST - Salva planilha selecionada
  getCurrentSheet: '/get-current-sheet',              // GET  - Pega planilha atual
  clearSheetContent: '/clear-sheet-content',          // POST - Limpa conteúdo planilha
  configStatus: '/config-status',                     // GET  - Status da configuração
  deleteSheetConfig: '/delete-sheet-config',          // POST - Deleta configuração planilha
  revokeGoogleAccess: '/revoke-google-access',        // POST - Revoga acesso Google
  
  // Planilhas (provision-sheet.pb.js)
  provisionSheet: '/provision-sheet',                 // POST - Copia template para usuário
  
  // Lançamentos (append-entry.pb.js, edit-sheet-entry.pb.js, delete-sheet-entry.pb.js)
  appendEntry: '/append-entry',                       // POST   - Adiciona lançamento
  editSheetEntry: '/edit-sheet-entry',                // PUT    - Edita lançamento
  deleteSheetEntry: '/delete-sheet-entry',            // DELETE - Deleta lançamento
  
  // Consultas (get-sheet-entries.pb.js)
  getSheetEntries: '/get-sheet-entries',              // GET - Pega lançamentos da planilha
  
  // Relatórios (get-financial-summary.pb.js, get-available-months.pb.js, get-sheet-categories.pb.js)
  getFinancialSummary: '/get-financial-summary',      // GET - Resumo financeiro
  getAvailableMonths: '/get-available-months',        // GET - Meses disponíveis
  getSheetCategories: '/get-sheet-categories',        // GET - Categorias da planilha
  getSheetCategoriesComplete: '/get-sheet-categories-complete', // GET - Categorias completas (categoria, tipo, orcamento)
  
  // Categorias (post-categories.pb.js)
  postCategories: '/post-categories',                 // POST - Atualiza categorias na planilha
} as const;

/**
 * Type helper para endpoints
 */
export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];

export default config;
