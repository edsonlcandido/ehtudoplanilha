import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Read package.json version so we can inject into the build
const pkgPath = fileURLToPath(new URL('./package.json', import.meta.url))
const pkg = JSON.parse(readFileSync(pkgPath, { encoding: 'utf-8' }))

// https://vitejs.dev/config/
export default defineConfig({
  base: '/pwa/',
  define: {
    // Make the package version available as import.meta.env.APP_VERSION
    'import.meta.env.APP_VERSION': JSON.stringify(pkg.version),
  },
  // Dev server options (proxy to avoid CORS when calling PocketBase at :8090)
  server: {
    proxy: {
      // Proxy any request starting with /api to the local PocketBase instance
      // and remove the /api prefix before forwarding.
      // Example: import.meta.env.VITE_API_URL can be set to '/api/' in development.
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
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
                accept: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
              },
            ],
          },
        },
      },
    }),
  ],
})
