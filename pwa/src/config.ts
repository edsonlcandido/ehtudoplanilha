/**
 * Configuração de URLs e endpoints do PWA.
 *
 * Estratégia "Opção C" — **zero .env files**, mas com URL **absoluta**
 * pro PocketBase (não vazia) por causa de uma armadilha do SDK
 * (vide `POCKETBASE_URL` abaixo).
 *
 * Em dev: POCKETBASE_URL = `http://localhost:5174/` → Vite proxy do PWA
 *         intercepta `/api/*` e os custom endpoints, repassando pro PB
 *         em `http://localhost:8090`.
 * Em prod: POCKETBASE_URL = `https://planilha.ehtudo.app/` → PB serve
 *          tudo no mesmo domínio.
 *
 * - **Dashboard**: derivado do `window.location` + `/dashboard/...` em
 *   prod, ou `http://localhost:5173/dashboard/...` em dev.
 * - **Webhooks n8n** (OCR/chat): hardcoded, mesmo em dev e prod
 *   (n8n é hospedado e acessível publicamente).
 *
 * Se precisar de override temporário em dev (ex: testar webhook
 * local), é só editar o valor aqui.
 */

const isDev = import.meta.env.DEV

// ─────────────────────────────────────────────────────────────────────
// PocketBase
// ─────────────────────────────────────────────────────────────────────

/**
 * URL do PocketBase.
 *
 * ⚠️ **DEVE ser absoluta.** Não passar `''` (vazio).
 *
 * Armadilha do SDK: `pocketbase@0.26.x` tem um `buildURL()` que, quando
 * recebe URL vazia/relativa, monta a URL final como
 * `window.location.origin + window.location.pathname + baseURL + path`.
 * Como o PWA roda em `/pwa/login` (subpath), isso vira
 * `http://host/pwa/login/api/...` em vez de `http://host/api/...` —
 * quebra todas as chamadas. Source: `pocketbase.es.mjs:1`, função
 * `buildURL`. Esse comportamento **também quebraria em prod** se o PWA
 * tentasse fazer chamadas via SDK a partir de uma rota em `/pwa/...`.
 *
 * - Em dev: `http://localhost:5174/` → Vite proxy intercepta `/api/*`
 *   e os custom endpoints, repassando pro PB em `:8090`.
 * - Em prod: `https://planilha.ehtudo.app/` → PB serve no mesmo domínio.
 *
 * Se quiser apontar pra outro ambiente, sobrescreve aqui.
 */
export const POCKETBASE_URL: string = isDev
  ? 'http://localhost:5174/'
  : 'https://planilha.ehtudo.app/'

// ─────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────

/**
 * URL base do dashboard.
 * - Dev: `http://localhost:5173/dashboard/` (Vite do dashboard)
 * - Prod: relativo (`/dashboard/`, mesmo domínio)
 */
export const DASHBOARD_URL: string = isDev
  ? 'http://localhost:5173/dashboard/'
  : '/dashboard/'

/**
 * URL da página de Lançamentos do dashboard.
 */
export const DASHBOARD_LANCAMENTOS_URL: string = isDev
  ? 'http://localhost:5173/dashboard/lancamentos.html'
  : '/dashboard/lancamentos.html'

/**
 * URL da página de Categorias do dashboard.
 */
export const DASHBOARD_CATEGORIAS_URL: string = isDev
  ? 'http://localhost:5173/dashboard/categorias.html'
  : '/dashboard/categorias.html'

/**
 * URL do PWA (compartilhar entre apps: "abrir no celular").
 * - Dev: `http://localhost:5174/pwa/`
 * - Prod: relativo (`/pwa/`)
 */
export const DASHBOARD_CELULAR_URL: string = isDev
  ? 'http://localhost:5174/pwa/'
  : '/pwa/'

// ─────────────────────────────────────────────────────────────────────
// Webhooks n8n (OCR + Chat)
// ─────────────────────────────────────────────────────────────────────

/**
 * Webhook de OCR (análise de upload de imagem).
 * Mesmo em dev e prod (n8n é hospedado e acessível).
 *
 * PRD-011: recebe imagem, retorna array de lançamentos.
 */
export const WEBHOOK_OCR_URL: string =
  'https://ehtudo-n8n.pfdgdz.easypanel.host/webhook/v1/planilha-eh-tudo-analise-upload'

/**
 * Webhook de Chat (agente de lançamentos).
 * Mesmo em dev e prod.
 *
 * PRD-012: recebe texto natural, retorna array de lançamentos.
 */
export const WEBHOOK_CHAT_URL: string =
  'https://ehtudo-n8n.pfdgdz.easypanel.host/webhook/v1/planilha-eh-tudo-analise-chat'

// ─────────────────────────────────────────────────────────────────────
// Endpoints do PocketBase (paths relativos)
// ─────────────────────────────────────────────────────────────────────
//
// Em dev: Vite proxy redireciona esses paths pro PB em :8090
// Em prod: PB serve esses paths no mesmo domínio
//
// Lista mantida alinhada com pb_hooks/* (vide AGENTS.md §6 e PRD-002)
const PB_CUSTOM_ENDPOINTS = [
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
] as const

export type PocketBaseEndpoint = (typeof PB_CUSTOM_ENDPOINTS)[number]

/** Lista de todos os custom endpoints (útil pra iteração). */
export const ALL_POCKETBASE_ENDPOINTS: readonly string[] = PB_CUSTOM_ENDPOINTS

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Versão do app (lida do package.json pelo vite.config.js via
 * `define: { 'import.meta.env.APP_VERSION': ... }`).
 */
export const APP_VERSION: string = import.meta.env.APP_VERSION || 'dev'

/**
 * Helper pra debugar a config no console.
 */
export function debugConfig(): void {
  console.log('[PWA Config]', {
    isDev,
    pocketbase: POCKETBASE_URL || '(window.location.origin)',
    dashboard: DASHBOARD_URL,
    webhookOcr: WEBHOOK_OCR_URL,
    webhookChat: WEBHOOK_CHAT_URL,
    appVersion: APP_VERSION,
  })
}
