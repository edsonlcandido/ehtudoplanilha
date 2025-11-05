import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Lista de endpoints customizados do PocketBase (hooks)
 * Estes endpoints precisam ser proxied para o PocketBase em desenvolvimento
 */
const POCKETBASE_CUSTOM_ENDPOINTS = [
  // Google OAuth
  '/google-oauth-callback',
  '/google-refresh-token',
  // Google Auxiliares
  '/env-variables',
  '/check-refresh-token',
  '/list-google-sheets',
  '/save-sheet-id',
  '/get-current-sheet',
  '/clear-sheet-content',
  '/config-status',
  '/delete-sheet-config',
  '/revoke-google-access',
  // Planilhas
  '/provision-sheet',
  // Lançamentos
  '/append-entry',
  '/edit-sheet-entry',
  '/delete-sheet-entry',
  '/get-sheet-entries',
  // Relatórios
  '/get-financial-summary',
  '/get-available-months',
  '/get-sheet-categories',
];

/**
 * Cria configuração de proxy para um endpoint
 */
function createProxyConfig(target = 'http://localhost:8090') {
  return {
    target,
    changeOrigin: true,
    secure: false,
  };
}

/**
 * Gera objeto de proxy para todos os endpoints
 */
function generateProxyConfig() {
  const proxyConfig: Record<string, any> = {
    // Proxy para a API padrão do PocketBase
    '/api': createProxyConfig(),
  };

  // Adicionar proxy para cada endpoint customizado
  POCKETBASE_CUSTOM_ENDPOINTS.forEach((endpoint) => {
    proxyConfig[endpoint] = createProxyConfig();
  });

  return proxyConfig;
}

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        registro: resolve(__dirname, 'registro.html'),
        dashboard: resolve(__dirname, 'dashboard/index.html'),
        configuracao: resolve(__dirname, 'dashboard/configuracao.html'),
        lancamentos: resolve(__dirname, 'dashboard/lancamentos.html'),
      },
      output: {
        // Remove hash dos nomes dos arquivos
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: generateProxyConfig(),
  },
});
