import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Read package.json version so we can inject into the build
const pkgPath = fileURLToPath(new URL('./package.json', import.meta.url))
const pkg = JSON.parse(readFileSync(pkgPath, { encoding: 'utf-8' }))

/**
 * Lista de endpoints custom do PocketBase (mesmo do dashboard).
 * Em dev: PWA roda em :5174 e Vite proxy redireciona esses paths pro PB em :8090.
 * Em prod: PocketBase serve esses paths diretamente no mesmo domínio.
 */
const POCKETBASE_CUSTOM_ENDPOINTS = [
  '/google-oauth-callback',
  '/google-refresh-token',
  '/env-variables',
  '/check-refresh-token',
  '/list-google-sheets',
  '/save-sheet-id',
  '/get-current-sheet',
  '/clear-sheet-content',
  '/config-status',
  '/delete-sheet-config',
  '/revoke-google-access',
  '/provision-sheet',
  '/append-entry',
  '/edit-sheet-entry',
  '/delete-sheet-entry',
  '/get-sheet-entries',
  '/get-financial-summary',
  '/get-available-months',
  '/get-sheet-categories',
  '/get-sheet-categories-complete',
  '/post-categories',
]

const PB_TARGET = 'http://localhost:8090'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/pwa/',
  define: {
    // Make the package version available as import.meta.env.APP_VERSION
    'import.meta.env.APP_VERSION': JSON.stringify(pkg.version),
  },
  server: {
    // PWA sempre em 5174 em dev (dashboard em 5173, PB em 8090)
    port: 5174,
    strictPort: true,
    proxy: {
      // Proxy /api/* (usado pelo SDK PocketBase) -> PB em :8090
      // IMPORTANTE: NÃO fazer rewrite. O PB espera os endpoints em /api/*.
      // VITE_API_URL vazio -> SDK usa window.location.origin -> chama http://localhost:5174/api/*
      // -> Vite proxy repassa sem reescrever -> PB recebe /api/* corretamente.
      '/api': {
        target: PB_TARGET,
        changeOrigin: true,
        secure: false,
      },
      // Proxy dos endpoints custom (chamados pelo PWA sem prefixo /api).
      // Em prod esses paths são servidos pelo próprio PB.
      ...Object.fromEntries(
        POCKETBASE_CUSTOM_ENDPOINTS.map((endpoint) => [
          endpoint,
          {
            target: PB_TARGET,
            changeOrigin: true,
            secure: false,
          },
        ])
      ),
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: [
      'eh-tudo-planilha-pwa.aiyfgd.easypanel.host',
      '.easypanel.host', // Permite qualquer subdomínio do easypanel.host
      'localhost'
    ],
  },
  build: {
    outDir: 'pwa',
    emptyOutDir: true,
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      devOptions: {
        enabled: true, // Set to true to enable PWA in development mode for testing A2HS
        type: 'module',
      },
      manifest: {
        name: 'Planilha Eh Tudo',
        short_name: 'Planilha Eh Tudo',
        description: 'Planilha Eh Tudo',
        // Custom non-standard field to keep version visible in the generated manifest
        // Nota: campo custom não afeta o Android/Chrome version mostrado, mas é útil
        // para inspeção e para leitura interna do app (ex: fetch('/manifest.webmanifest')).
        version: pkg.version,
        theme_color: '#3B82F6',
        background_color: '#F9FAFB',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: './pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: './pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: './pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
        share_target: {
          action: './',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'file', // Use a generic name for files
                accept: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
              },
            ],
          },
        },
      },
    }),
  ],
})
