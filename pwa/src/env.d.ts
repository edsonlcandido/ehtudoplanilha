/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Apenas vars nativas do Vite + a que o vite.config.js injeta via define.
  // Todas as URLs do PWA são derivadas em pwa/src/config.ts
  // (estratégia "Opção C": zero .env files, derivado de import.meta.env.DEV)
  readonly DEV: boolean
  readonly PROD: boolean
  readonly APP_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
