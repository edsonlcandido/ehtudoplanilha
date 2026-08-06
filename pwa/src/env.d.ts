/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WEBHOOK_URL: string
  readonly VITE_GET_ENTRIES_URL: string
  readonly VITE_GET_CATEGORIES_URL: string
  readonly VITE_APPEND_ENTRY_URL: string
  readonly VITE_DASHBOARD_URL: string
  readonly APP_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
