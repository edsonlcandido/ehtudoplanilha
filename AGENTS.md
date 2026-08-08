# AGENTS.md — ehtudoplanilha

> Memória de projeto para o agente Mavis (e qualquer outro agente) trabalhar
> neste repo sem precisar perguntar o básico pro Edson. **Documento vivo** —
> atualize ao mexer em coisas que mudam premissas aqui.

---

## 1. O que é o projeto

**Planilha Eh Tudo** — SaaS financeiro multi-tenant onde cada usuário gerencia
lançamentos numa **planilha do Google Sheets própria** (do Drive do user).
O backend sincroniza entre o app e a planilha.

- **Live**: <https://planilha.ehtudo.app>
- **Repo**: <https://github.com/edsonlcandido/ehtudoplanilha>
- **Stack**:
  - Backend: **PocketBase** (SQLite) + JSVM hooks
  - Front web (`src/`): **Vite + TypeScript + Vanilla JS** (sem framework)
  - Front PWA (`pwa/`): **Vue 3 + Vite + vite-plugin-pwa**
  - Integrações: **Google OAuth 2.0** (PKCE), **Sheets API v4**, **Drive API v3**
  - Deploy: **Docker** (multi-stage) em **EasyPanel + Hostinger VPS**
- **Modelo de negócio**: gratuito (básico) + premium (OCR de comprovantes com IA via webhook n8n, app Android nativo em roadmap)

### Conceitos centrais

| Conceito | Onde fica | Quem controla |
|---|---|---|
| Usuários e auth | `users` (collection nativa PB) | PocketBase |
| Tokens Google + sheet_id | `google_infos` (collection) | PocketBase |
| Lançamentos | Planilha Google Sheets do user (aba `Lançamentos`) | Google Sheets |
| Categorias | Planilha Google Sheets do user (aba `Categorias`) | Google Sheets |
| Cache | localStorage do browser | Frontend |

**Premissa fundamental:** os dados financeiros ficam no Drive do próprio
usuário, não no nosso servidor. O PocketBase só guarda tokens + sheet_id.
Isso significa que se o user apagar a planilha, os dados morrem.

---

## 2. Topologia dos DOIS apps dentro do repo

Esse é o ponto onde mais gente se confunde. **São dois apps distintos
no mesmo monorepo**, com builds separados, que o Dockerfile junta em `pb_public/`:

```
ehtudoplanilha/
├── src/                  ← APP 1: Dashboard web (Vite + TS + Vanilla JS)
│   └── dist/             ← output do build (ignorado pelo git)
│
├── pwa/                  ← APP 2: PWA mobile (Vue 3 + Vite)
│   └── pwa/              ← output do build (ignorado pelo git)
│
├── pb_hooks/             ← Backend JS: custom endpoints PB
├── pb_migrations/        ← Schema versionado do PB
├── pb_data/              ← SQLite + storage (ignorado pelo git)
├── pb_public/            ← ⚠️ OUTPUT, regenerado pelo Dockerfile
│   ├── index.html        ← dashboard do APP 1
│   ├── dashboard/        ← páginas do APP 1
│   └── pwa/              ← APP 2 montado aqui
│
└── Dockerfile            ← multi-stage: builda src/ + pwa/ → monta pb_public
```

### APP 1: `src/` — Dashboard web

- **Stack**: Vite 6, TypeScript 5.7, Vanilla JS (módulos ES6), CSS BEM
- **Bibliotecas**: `pocketbase` (SDK JS)
- **Entry**: `src/main.ts` (instancia PB), `src/index.ts` (init de cada página)
- **Roteamento**: baseado em páginas HTML estáticas — cada página tem seu
  próprio `<script>` e importa o que precisa
- **Páginas**: `index.html`, `login.html`, `registro.html`, `dashboard/index.html`,
  `dashboard/lancamentos.html`, `dashboard/categorias.html`, `dashboard/configuracao.html`
- **Componentes**: `src/components/*.ts` (modais, listas, cards, toasts, menu)
- **Serviços**: `src/services/{auth,auth-oauth,google-oauth,sheets,cache,lancamentos}.ts`
- **CSS**: `src/css/` organizado em `base/`, `components/`, `layout/`, `pages/`
- **Build**: `src/dist/` → copiado para `pb_public/` (raiz) pelo Dockerfile

### APP 2: `pwa/` — PWA mobile

- **Stack**: Vue 3 (`<script setup>`), Vite 7, `vite-plugin-pwa`, vue-router 4
- **Foco**: **instalar no celular** (manifest + share target API pra aparecer
  no menu de share de imagens)
- **Entry**: `pwa/src/main.js` (cria app, router, injeta PB)
- **Roteamento**: SPA com `vue-router` (`/` e `/login`)
- **Pages**: `pwa/src/components/{HomePage,LoginPage,EntryModal,UploadArea,ChatFAB,CartaoItem}.vue`
- **State**: composables (`pwa/src/composables/useAppendEntry.ts`)
- **Config**: `pwa/vite.config.js` define `base: '/pwa/'` e `outDir: 'pwa'`
- **Build**: `pwa/pwa/` → copiado para `pb_public/pwa/` pelo Dockerfile
- **Dev**: roda em `:5174` (porta fixa), proxy `/api` e os 21 custom
  endpoints do PB → PB em `:8090` (vide `vite.config.js`)

### Por que dois apps?

- **Dashboard** (`src/`): uso no PC, mais denso, planilha + análise visual
- **PWA** (`pwa/`): uso no celular, focado em **lançar rápido** e **compartilhar
  comprovante/imagem** direto do app de share do Android/iOS

---

## 3. ⚠️ Regra sagrada: `pb_public/` é OUTPUT, não editar

**O conteúdo de `pb_public/` é regenerado pelo Dockerfile a cada build.**
O diretório fica vazio no repo (`pb_public/` está no `.dockerignore`
e `.gitignore`) — o conteúdo é montado em runtime pelo Dockerfile a
partir dos builds de `src/` e `pwa/`. O `build-and-deploy.sh` faz:

1. Roda `npm run build` em `src/` → `src/dist/`
2. **Apaga quase tudo de `pb_public/`** (preserva só `js/` + `pwa/`)
3. Copia `src/dist/*` pra `pb_public/`
4. O PWA é montado separado pelo Dockerfile direto do `pwa/pwa/` (output do build)

**NUNCA** edite manualmente `pb_public/*.html` achando que está salvando
o trabalho — o próximo build **apaga**.

**Dev local sem Docker:** pra rodar `./pocketbase serve --dev` sem buildar
antes, é preciso popular `pb_public/` local (rodando `npm run build` em
`src/` e `pwa/` e copiando os outputs). O `build-and-deploy.sh` faz isso.

### História: por que `pb_public/` tinha conteúdo legado

O projeto **começou como JS puro** (HTML + ES modules direto em `pb_public/`,
servido pelo PocketBase, sem build step). O foco inicial era aprender JS.
Depois migrou pra **Vite + TypeScript** (`src/` e `pwa/`) e o build virou
multi-stage (Dockerfile).

A estrutura legada ficou commitada por um tempo em `pb_public/js/` (com
código antigo, cópia local do SDK do PocketBase, lodash, etc.) até ser
removida em 2026-08-06 nessa rodada de limpeza. Hoje:
- `pb_public/` é diretório vazio no repo
- O Dockerfile monta o conteúdo em runtime a partir dos builds
- Comentários "Migrado de `pb_public_/js/...`" nos headers de arquivos
  em `src/components/` e `src/services/` ainda referenciam o caminho
  antigo — é histórico, não impede nada, mas se você for reescrever
  algum desses arquivos, pode atualizar a referência.

---

## 4. Setup e dev local

### Pré-requisitos
- Node 18+ (Docker usa node 22-alpine; Vite 7 quer Node 20+)
- PocketBase binary (já commitado em `./pocketbase` no repo, v0.31+)
- Conta Google Cloud com OAuth client (pra testar OAuth)
- *(Sem template no Drive — a planilha é criada do zero pelo hook)*

### Variáveis de ambiente
Arquivo `.env` na raiz (gitignored):

```bash
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8090/google-oauth-callback
```

⚠️ O `.env.example` na raiz **só tem `GOOGLE_REDIRECT_URI`** e o resto
fica em outro lugar — a config completa do OAuth pro login fica
configurada **diretamente no PocketBase Admin UI** (`/_/`), não no `.env`.

### Comandos (Windows / PowerShell)

```powershell
# 1) Subir o PB (carrega .env)
./pocketbase.exe serve --dev

# 2) Dev do dashboard (src/)
cd src
npm install
npm run dev          # http://localhost:5173 (dashboard, porta fixa)

# 3) Dev do PWA (pwa/)
cd pwa
npm install
npm run dev          # http://localhost:5174 (PWA, porta fixa)
```

### Build local (sem Docker)

```bash
# Dashboard
cd src && npm install && npm run build    # gera src/dist/

# PWA
cd pwa && npm install && npm run build   # gera pwa/pwa/

# Copiar pro pb_public (raiz do repo)
# Em Windows pode usar o build-and-deploy.sh via WSL/Git Bash
# ou rodar manualmente:
Copy-Item -Path src\dist\* -Destination pb_public\ -Recurse -Force
```

---

## 5. Build e deploy (Docker)

O `Dockerfile` (raiz) é multi-stage:

1. **Estágio 1** (`frontend-builder`): builda `src/` com Node 22 → `/build/dist/`
2. **Estágio 2** (`pwa-builder`): builda `pwa/` com Node 22 → `/build/pwa/`
3. **Estágio 3** (imagem final): Alpine 3.22 + PocketBase + os dois builds
   montados em `/app/pb_public/`

```dockerfile
COPY --from=frontend-builder /build/dist/  /app/pb_public/   # dashboard
COPY --from=pwa-builder      /build/pwa/   /app/pb_public/pwa/  # PWA
COPY pb_hooks/ pb_migrations/ /app/        # backend
```

**Roda em `:8090`** (PB serve o `pb_public/` como static files + hooks + admin).

Há também `dockerfile.vite` (legado, sem PWA) — **provavelmente pode ser
removido** se ninguém usa mais.

### Deploy
- **Onde**: Easypanel (Hostinger VPS)
- **Como**: push pro GitHub, Easypanel detecta e rebuilda
- **TLS**: Easypanel termina TLS e passa pro container
- **Domínio**: `planilha.ehtudo.app`

---

## 6. PocketBase — convenções críticas

### Coleções

| Collection | Regra de acesso | Notas |
|---|---|---|
| `users` | `read/write: @request.auth.id = @record.id` | Nativa do PB |
| `google_infos` | `read/write: @request.auth.id = @record.user_id` | Tokens + sheet_id, **1:1 com user** |

Schema de `google_infos` (vide `pb_data/types.d.ts`):
```
user_id            (rel users)
access_token       (text, hidden — não filtrável pelo client)
refresh_token      (text, hidden)
expires_at         (date, opcional)
sheet_id           (text, opcional)
sheet_name         (text, opcional — só informativo, vide §10)
last_success_append_at  (date, opcional)
```

### ⚠️ Regras dos hooks JSVM (PocketBase)

> **Essas regras valem pra QUALQUER hook neste projeto.** Foram aprendidas
> na marra — vide MEMORY.md do agente pra referência completa.

1. **Cada handler roda em contexto isolado** (não existe `globalThis` compartilhado entre `.pb.js`)
2. **`require()` funciona DENTRO do handler, NÃO no top-level**
3. **Helper compartilhado deve ser `.js` puro** (não `.pb.js`)
   - Errado: `_google-sheets-helper.pb.js` (PB rejeita: `module is not defined`)
   - Certo: `_google-sheets-helper.js`
4. **`import` ESM não funciona em nenhum lugar** (PB 0.31+)
5. **Path wildcard no `routerAdd` usa sintaxe Go ServeMux, NÃO path-to-regexp**:
   - Errado: `routerAdd('GET', '/pwa/*', ...)` (nunca faz match)
   - Certo: `routerAdd('GET', '/pwa/{path...}', ...)`
6. **Versão PB**: 0.31+ (do CHANGELOG). `require()` foi adicionado em v0.25.5.

### Padrão de helper compartilhado

```js
// pb_hooks/_google-sheets-helper.js   ← extensão .js pura!
module.exports = {
  SHEET_NAME_DEFAULT: 'Lançamentos',
  getGoogleInfo(userId) { ... },
  refreshAccessToken(googleInfo) { ... },
  callWithRefresh(googleInfo, request) { ... },
  buildAppendUrl(range, query) { ... },
  parseRowIndexFromRange(updatedRange) { ... }
};
```

```js
// pb_hooks/append-entry.pb.js
routerAdd('POST', '/append-entry', (c) => {
  // require() DENTRO do handler:
  const gsheets = require(`${__hooks}/_google-sheets-helper.js`);

  // ... usa gsheets.callWithRefresh(...)
});
```

### Endpoints custom existentes

| Método | Path | Hook | Função |
|---|---|---|---|
| GET | `/google-oauth-callback` | `google-oauth-callback.pb.js` | Callback OAuth Google |
| POST | `/google-refresh-token` | `google-refresh-token.pb.js` | Renova access_token |
| POST | `/provision-sheet` | `provision-sheet.pb.js` | **Cria planilha do zero** no Drive do user (com abas `Lançamentos` + `Categorias` hardcoded, header de Lançamentos e categorias padrão). Idempotente — se já tem `sheet_id`, retorna existing. Nome do endpoint é legado. |
| GET | `/list-google-sheets` | `google-endpoints.pb.js` | Lista planilhas do user no Drive |
| GET | `/get-current-sheet` | `google-endpoints.pb.js` | sheet_id atual do user |
| POST | `/save-sheet-id` | `google-endpoints.pb.js` | Salva planilha selecionada |
| POST | `/clear-sheet-content` | `google-endpoints.pb.js` | Limpa lançamentos (preserva header) |
| POST | `/delete-sheet-config` | `google-endpoints.pb.js` | Desvincula planilha (zera sheet_id/name) |
| POST | `/revoke-google-access` | `google-endpoints.pb.js` | Revoga tokens Google + limpa config |
| GET | `/config-status` | `google-endpoints.pb.js` | Status de config (token + sheet) |
| GET | `/check-refresh-token` | `google-endpoints.pb.js` | User tem refresh_token? |
| GET | `/env-variables` | `google-endpoints.pb.js` | CLIENT_ID + REDIRECT_URI (público) |
| POST | `/append-entry` | `append-entry.pb.js` | Adiciona lançamento |
| POST | `/edit-sheet-entry` | `edit-sheet-entry.pb.js` | Edita lançamento |
| POST | `/delete-sheet-entry` | `delete-sheet-entry.pb.js` | Deleta lançamento |
| GET | `/get-sheet-entries` | `get-sheet-entries.pb.js` | Lista lançamentos (paginado) |
| GET | `/get-sheet-categories` | `get-sheet-categories.pb.js` | Lista categorias (legado) |
| GET | `/get-sheet-categories-complete` | `get-sheet-categories-complete.pb.js` | Categorias com tipo + orcamento |
| GET | `/get-available-months` | `get-available-months.pb.js` | Meses disponíveis (pelos lançamentos) |
| GET | `/get-financial-summary` | `get-financial-summary.pb.js` | Resumo financeiro agregado |
| POST | `/post-categories` | `post-categories.pb.js` | Sobrescreve aba Categorias |
| GET | `/pwa/{path...}` | `pwa-spa-fallback.pb.js` | SPA fallback pro PWA |

---

## 7. Integração Google

### OAuth 2.0

- **Tipo**: Authorization Code com **PKCE** (state + code_verifier no localStorage)
- **Config**: Client ID/Secret ficam **só no PB Admin UI** (collection `users`
  → Options → OAuth2), nunca no frontend
- **Callback**: dois fluxos coexistentes no projeto:
  1. **Login OAuth do user** (PB nativo) → `/api/oauth2-redirect` → hook redireciona pro `/pwa/login` (vide `pwa/OAUTH_CONFIG.md`)
  2. **OAuth pra Sheets/Drive** (custom) → `/google-oauth-callback` → hook troca code por tokens → salva em `google_infos`

### Google Sheets API

- **Base URL**: `https://sheets.googleapis.com/v4/spreadsheets`
- **Operações usadas**:
  - `values.append` (range `Lançamentos!A:G` com `valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`)
  - `values.update` (pra edit)
  - `values.clear` (pra clear-sheet-content)
  - `values.get` (pra get-entries)
- **Refresh automático**: helper `callWithRefresh()` em `_google-sheets-helper.js`
  detecta 401 → renova token via `oauth2.googleapis.com/token` → retry

### Google Drive API

- **Listar planilhas**: query `mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
- **Criar planilha programaticamente** (sem template): feito pelo `provision-sheet.pb.js`
  na primeira vez que o user faz OAuth Google. Usa `POST /v4/spreadsheets` com
  `sheets: [{ properties: { title: "Lançamentos" } }, { properties: { title: "Categorias" } ]`
  (nomes **hardcoded** — vide §8). Depois popula header de `Lançamentos!A1:G1` e
  a lista padrão de categorias em `Categorias!A1:B<n>`. **Não usa template nem copia nada do nosso Drive**.

### Excel Serial (datas)

Datas no Sheets são armazenadas como **Excel Epoch Serial** (dias desde 30/12/1899).
Helpers em `src/utils/date-helpers.ts` (re-exportados por `src/types/index.ts`):

```typescript
toExcelSerial(date, dataHora=true)         // JS Date → serial
toExcelSerialDia(date)                     // usa meio-dia p/ evitar timezone
excelSerialToDate(serial, dataHora=false)  // serial → JS Date
excelSerialToMonthLabel(serial)            // serial → "MM/YYYY"
dateInputToDate('YYYY-MM-DD')              // input HTML5 → Date
dateTimeLocalToDate('YYYY-MM-DDTHH:MM')    // input HTML5 → Date
```

**Regra de formatação** (do `arquitetura.md`):
- Planilha armazena como serial (Sheet faz auto-conversão com `USER_ENTERED`)
- Backend recebe/devolve serial **sem converter**
- Frontend converte via helpers só pra exibir e pra montar payload de POST
- Formato brasileiro `DD/MM/YYYY` é a "interface" com o Sheets

### Estrutura da planilha (criada no primeiro acesso)

**Aba `Lançamentos` (A:G):**

| Col | Campo | Tipo | Formato |
|---|---|---|---|
| A | data | Data/Hora | `DD/MM/YYYY HH:mm` (formato BR) |
| B | conta | Texto | ex: "Carteira", "Banco" |
| C | valor | Número | positivo=receita, negativo=despesa |
| D | descricao | Texto | max 255 chars |
| E | categoria | Texto | deve existir na aba Categorias |
| F | orcamento | Data | `DD/MM/YYYY` (só data) |
| G | observacao | Texto | opcional |

**Aba `Categorias` (A:C):**

| Col | Campo | Tipo | Notas |
|---|---|---|---|
| A | categoria | Texto | Chave única |
| B | tipo | Texto | `QUERO`, `PRECISO`, `RENDA`, `INVESTIMENTOS` |
| C | limite | Número | Orçamento mensal (opcional) |

**Validação recomendada** (manual na planilha, vide `arquitetura.md` §3.2):
- Coluna E de Lançamentos → data validation apontando pra `Categorias!A:A`

---

## 8. ⚠️ Contrato de nomes: abas Sheets são hardcoded

> **As abas `Lançamentos` e `Categorias` são parte do CONTRATO DO PRODUTO.**
> Não usar o `sheet_name` salvo em `google_infos` — é só informativo.

**Aplicar em TODOS os hooks** que mexem com Sheets:
- `append-entry`, `edit-sheet-entry`, `delete-sheet-entry`
- `get-sheet-entries`, `get-sheet-categories-complete`
- `clear-sheet-content` e qualquer outro que referencie aba

Sempre usar a constante: `gsheets.SHEET_NAME_DEFAULT` (= `'Lançamentos'`).
Para categorias, o helper provavelmente tem `CATEGORIES_SHEET_NAME`
(= `'Categorias'`) — confirmar se existe no `_google-sheets-helper.js`.

Se o user renomear a aba na planilha, **ele quebrou a integração** —
não é config personalizável. Não tem como contornar sem mudar o código.

**Por quê**: o `google_infos.sheet_name` é só pra display ("minha planilha de
dezembro"). Se a UI permitisse que o user renomeasse e a gente confiasse no nome
salvo, teríamos ambiguidade (duas planilhas com mesmo nome, etc).

---

## 9. Frontend `src/` — convenções

### Estrutura de arquivos
- Cada página HTML tem um `<script type="module" src="...">` apontando pro TS
  correspondente. Ex: `dashboard/lancamentos.html` → `dashboard/lancamentos.ts`
- Componentes ficam em `src/components/*.ts` (são funções, não classes —
  vide `entry-modal.ts`, `lancamentos-list.ts`)
- Lógica de página fica em `src/dashboard/*.ts` (controller)
- Compartilhado vai pra `src/services/` ou `src/components/`

### Padrão de serviço
```typescript
// src/services/sheets.ts
import { pb } from '../main';
import { API_ENDPOINTS } from '../config/env';
import { CacheService, CACHE_KEYS } from './cache';

export class SheetsService {
  static async getSheetCategories(forceRefresh = false): Promise<string[]> {
    if (!forceRefresh) {
      const cached = CacheService.get<{ categories: string[] }>(CACHE_KEYS.SHEET_CATEGORIES);
      if (cached) return cached.categories || [];
    }
    const response = await pb.send<{ categories: string[] }>(API_ENDPOINTS.getSheetCategories);
    CacheService.set(CACHE_KEYS.SHEET_CATEGORIES, response);
    return response.categories || [];
  }
}
```

### Cache (localStorage)

`src/services/cache.ts`:
- **TTL padrão**: 5 minutos (300.000ms)
- **Chaves** (`CACHE_KEYS`):
  - `ehtudoplanilha:sheet-entries`
  - `ehtudoplanilha:sheet-categories`
  - `ehtudoplanilha:sheet-categories-complete`
- **Invalidação automática**: após `append`, `edit`, `delete` — sempre limpa
  `sheet-entries` + `sheet-categories`
- **Logout**: `CacheService.clearAll()` antes de limpar auth

### Auth
- **PocketBase SDK** (cliente `pocketbase` v0.26+)
- Token guardado no localStorage pelo SDK (chave `pocketbase_auth`)
- Header: `Authorization: <token>` (NÃO cookie — confirmado via `/debug-auth`)
- Validação no carregamento: `verifyTokenValidity()` em `src/services/auth.ts`
  faz fallback `authRefresh()` se `authStore.isValid === false`
- **Debug**: `pb_public/debug-localstorage.html` serve pra inspecionar localStorage

### Variáveis de ambiente (Vite)
- `src/config/env.ts` define a config por ambiente (dev/prod)
- `VITE_POCKETBASE_URL` e similares
- `src/vite-env.d.ts` declara os tipos

---

## 10. Frontend `pwa/` — convenções

### PWA / Manifest
- `base: '/pwa/'` (importante pra deploy em EasyPanel)
- `display: 'standalone'` (aparece como app instalado)
- **`share_target` no manifest** é o coração do app: permite o user
  **compartilhar imagem do app de galeria/fotos** direto pro PWA
  (vide `vite.config.js`)
- Aceita: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
  (PDF **removido do manifest em 2026-08-08** — o agente n8n não tá
  preparado pra ler PDF. **Ideia em aberto** pra reativar no futuro:
  melhorar OCR pra extrair texto de PDF, então readicionar
  `application/pdf` aqui e em `pwa/vite.config.js`)

### Service Worker
- `pwa/src/sw.js` usa `workbox-precaching` + `workbox-routing`
- Estratégia: `injectManifest` (não `generateSW`)
- **CRÍTICO**: `denylist: [/\/pwa\/login/]` no NavigationRoute
  - Motivo: `/pwa/login` é o `redirect_uri` do OAuth callback. Se o SW
    interceptar e servir `/pwa/index.html`, o handler pode descartar os
    query params (`code` + `state`) e o callback OAuth nunca é processado.
- POST em `/pwa/` (do share target) é interceptado e os dados são
  guardados em `Cache API` (`share-target-cache`), depois redireciona
  pro app com `?share=true`. A `HomePage.vue` lê do cache e exibe.

### Roteamento
- `vue-router` com `createWebHistory('/pwa/')`
- Rotas: `/` (HomePage, requiresAuth) e `/login` (LoginPage)
- `testLogin` no sessionStorage: bypass de auth pra testes (NÃO usar em prod)

### OAuth Login
- Fluxo manual com `listAuthMethods()` + `authWithOAuth2Code()`
- State e codeVerifier no localStorage
- O callback do PB nativo (`/api/oauth2-redirect`) cai no `/pwa/login` —
  config resolvida no PB Admin (vide `pwa/OAUTH_CONFIG.md`). Login
  funciona em ambos os apps (dashboard e PWA). **NÃO MEXER** sem testar
  em ambos.
- **Callback URL no Google Console**: `https://planilha.ehtudo.app/api/oauth2-redirect`
  (NÃO `/pwa/login` direto)

### Variáveis (Vite) — estratégia "Opção C", **zero .env files**

**Não existem `pwa/.env.development` nem `pwa/.env.production`.** Todas
as URLs são derivadas em `pwa/src/config.ts` baseado em
`import.meta.env.DEV`:

- **PocketBase**: SDK recebe `POCKETBASE_URL = ''` (vazio) → usa
  `window.location.origin` (que é a origem do PWA). Em dev, isso
  é `http://localhost:5174`; as chamadas `/api/*` e os 21 custom
  endpoints vão via Vite proxy pro PB em `:8090`. Em prod, é
  `https://planilha.ehtudo.app`; PB serve direto no mesmo domínio.
- **Dashboard URLs** (`DASHBOARD_URL`, etc): em dev apontam pra
  `http://localhost:5173/`; em prod usam paths relativos
  (`/dashboard/...`).
- **Webhooks n8n** (OCR/Chat): hardcoded em `config.ts` (mesmo em
  dev e prod, n8n é hospedado e acessível).
- **Endpoints PB** (`/get-sheet-entries`, etc): usados como paths
  relativos (sem `https://...`), mesma lógica do PB base.

Se precisar override temporário em dev (ex: webhook local), é
só editar `pwa/src/config.ts` — não precisa de env file.

O único var de Vite injetado é `APP_VERSION` (via `define` no
`vite.config.js`, lendo do `package.json`).

---

## 11. Fluxos principais (resumo)

### 11.1 Onboarding de user novo
1. User cria conta em `registro.html` (PB nativo)
2. User faz login → `verificaTokenValidity()` → ok
3. User clica "Conectar Google" no dashboard
4. Frontend gera PKCE + state, redireciona pro Google
5. Google → `/google-oauth-callback?code=...&state=...`
6. Hook `google-oauth-callback.pb.js` troca code por tokens, salva em `google_infos`
7. **Frontend** chama `POST /provision-sheet` (vide §6/§7). O hook:
   - Se já tem `sheet_id` salvo → retorna `action: existing` (idempotente)
   - Senão → cria planilha do zero via Sheets API com as abas `Lançamentos`
     e `Categorias` hardcoded, popula o header de Lançamentos e a lista
     padrão de categorias, salva `sheet_id` + `sheet_name` em `google_infos`
8. Planilha do user pronta pra receber lançamentos

### 11.2 Adicionar lançamento (fluxo normal)
1. User preenche form (em `EntryModal.vue` no PWA ou `entry-modal.ts` no dashboard)
2. Frontend formata datas pra `DD/MM/YYYY` ou `DD/MM/YYYY HH:mm`
3. `POST /append-entry` com payload
4. Hook valida, pega `google_infos`, monta `values:[[...]]`
5. Sheets API `values.append` (atômico, sem race condition)
6. Hook retorna `success: true, rowIndex`
7. Frontend invalida cache (`sheet-entries` + `sheet-categories`)
8. Frontend recarrega

### 11.3 Lançamento futuro
Mesmo fluxo, mas `data` e `conta` ficam vazios. Linha vai pra planilha
com colunas A e B em branco.

### 11.4 Transferência entre contas
Frontend faz **DOIS POSTs** sequenciais em `/append-entry`:
- Saída: `valor: -X, conta: origem`
- Entrada: `valor: +X, conta: destino`
- Mesma descrição, mesma data, mesma categoria "Transferência"

### 11.5 Compartilhar imagem no PWA
1. User abre app de galeria, escolhe imagem, "Compartilhar"
2. PWA aparece na lista de share targets (do `manifest.share_target`)
3. Android/iOS faz POST pra `/pwa/` com a imagem
4. Service Worker intercepta o POST, guarda no `Cache API`
5. SW redireciona pro app (`/pwa/?share=true`)
6. `HomePage.vue` lê do cache, exibe preview, manda pro webhook
   n8n (`VITE_WEBHOOK_URL`) que faz OCR e retorna os dados extraídos
7. User confirma/ajusta e adiciona o lançamento

---

## 12. Tarefas comuns — como fazer

### Adicionar endpoint novo no PB
1. Criar `pb_hooks/<nome>.pb.js`
2. Usar `routerAdd('GET|POST', '/path', handler, $apis.requireAuth())` se precisar auth
3. Se compartilhar lógica com outros hooks, criar `<nome>-helper.js`
   (extensão `.js` pura) e usar `require(\`${__hooks}/_helper.js\`)`
   DENTRO do handler
4. Documentar no cabeçalho do arquivo
5. **Não usar `globalThis`** — handlers são isolados
6. **Não usar `import`** — só `require()`
7. Se for mexer com Sheets, usar `gsheets.callWithRefresh()` e constante
   `SHEET_NAME_DEFAULT`

### Adicionar página nova no dashboard (src/)
1. Criar `src/<pagina>.html` + `src/<pagina>.ts`
2. Importar `main.ts` no topo do `.ts` (instancia PB)
3. Adicionar link de navegação em `src/components/user-menu.ts` se aplicável
4. CSS em `src/css/pages/<pagina>.css` + import em `src/css/pages.css` (se houver)
5. Adicionar endpoint no PB se precisar

### Adicionar página/componente no PWA (pwa/)
1. Criar componente em `pwa/src/components/<Nome>.vue` com `<script setup lang="ts">`
2. Adicionar rota em `pwa/src/main.js` no array `routes`
3. Se precisar de auth, setar `meta: { requiresAuth: true }`
4. Proteger com `meta.requiresAuth` no `beforeEach` (já existe o padrão)

### Adicionar nova URL/config
1. Adicionar constante em `pwa/src/config.ts` (com fallback
   baseado em `import.meta.env.DEV`)
2. Importar e usar nos componentes
3. Se for endpoint do PB que vai ser chamado via fetch direto
   (não via SDK), usar path relativo (Vite proxy cuida em dev,
   PB serve em prod)

### Debugar cache do frontend
- Abrir `http://localhost:8090/debug-localstorage.html` (servido pelo PB)
- Ou DevTools → Application → Local Storage → `ehtudoplanilha:*`
- `CacheService.clearAll()` no console

### Debugar hook PB
- `console.log()` direto no hook → aparece nos logs do PB (`./pocketbase serve --dev`)
- Pra hot-reload de hook, basta dar refresh no PB (ele reimporta)
- Pra hot-reload de helper, **mesma coisa** (require é cached por execução, então
  reiniciar o PB ou matar o runtime é necessário pra garantir)

---

## 13. Gotchas e pegadinhas conhecidas

| Tema | Detalhe |
|---|---|
| **PB JSVM handlers isolados** | Variáveis top-level num `.pb.js` NÃO são visíveis em outro. Use `require()` dentro do handler. |
| **Extensão de helper** | Helper compartilhado **deve ser `.js` puro** (não `.pb.js`). Senão PB rejeita com `ReferenceError: module is not defined`. |
| **Path wildcard em `routerAdd`** | Usar `{path...}` (Go ServeMux), NÃO `*` (path-to-regexp). |
| **`/pwa/login` no SW** | Deve estar no `denylist` do NavigationRoute senão OAuth callback perde os query params. |
| **Abas Sheets hardcoded** | `Lançamentos` e `Categorias` são contrato. NÃO ler do `google_infos.sheet_name`. |
| **`pb_public/` é output** | Não editar. Próximo build apaga. |
| **`pwa/pwa/` commitado** | Output do build do PWA. Commitado pra rodar dev sem buildar, mas em prod o Dockerfile regenera. |
| **Excel Serial** | Backend NÃO converte (devolve serial). Frontend converte via helpers pra exibir. |
| **`USER_ENTERED` no Sheets** | Permite enviar string `"31/10/2025 14:41"` e Sheets converte automaticamente pra serial. |
| **OAuth login vs OAuth Sheets** | Dois fluxos distintos. Login usa PB nativo + redirect custom. Sheets/Drive usa hook custom `/google-oauth-callback`. |
| **CLIENT_SECRET** | Só no PB (env var ou Admin UI). Nunca no frontend. |
| **Token no localStorage** | Chave `pocketbase_auth` (gerenciado pelo SDK). NÃO cookie. |
| **`authWithOAuth2()` automático** | Dá timeout (EventSource connect too long). Usar fluxo manual com `listAuthMethods()` + `authWithOAuth2Code()`. |
| **dev vs prod env** | PWA usa estratégia "Opção C" — **zero .env files**,
URLs derivadas em `pwa/src/config.ts` baseado em
`import.meta.env.DEV`. Dev: localhost:5174 + proxy → PB:8090.
Prod: relativo → mesmo domínio. Vide §10. |
| **Easypanel** | Termina TLS, mas NÃO envia `X-Forwarded-Host` (só `X-Forwarded-Proto`). Em prod, `request.url` chega como `localhost:3000` no Next.js — mas isso é problema de outro projeto (arvio), aqui não tem isso. |

---

## 14. Documentação de referência (no repo)

| Doc | Onde | Cobre |
|---|---|---|
| `README.md` | raiz | Apresentação + setup básico |
| `arquitetura.md` | raiz | **Arquitetura completa**, fluxos, formato de dados, sistema de cache — **leitura obrigatória** |
| `principaisFluxos.md` | raiz | **Desatualizado** — descreve estrutura antiga do `src/` (sem `pwa/`). Útil só como histórico. |
| `CHANGELOG.md` | raiz | Changelog do PocketBase (parece ser o upstream). Não é changelog do projeto. |
| `LICENSE.md` | raiz | MIT |
| `pb_hooks/README.md` | `pb_hooks/` | Documenta endpoints Google OAuth |
| `pwa/OAUTH_CONFIG.md` | `pwa/` | **Setup OAuth login** do PWA — bem completo |
| `pwa/ref/20251122 OAUTH_SETUP.md` | `pwa/ref/` | Idem, mais antigo |
| `pwa/ref/20251122 OAUTH_IMPLEMENTATION_SUMMARY.md` | `pwa/ref/` | Resumo da implementação |
| `pwa/ref/20251128 Authentication.md` | `pwa/ref/` | Fluxo de autenticação |
| `src/docs/20251105 CONFIGURACAO-DOCUMENTATION.md` | `src/docs/` | Página de configuração |
| `src/docs/20251105 ENTRY-MODAL-DOCUMENTATION.md` | `src/docs/` | Modal de lançamento |
| `src/docs/20251105 JS_ORIGINAL_RESUMO.md` | `src/docs/` | Histórico do código JS antes de migrar pra TS |
| `src/docs/20251122 OAUTH_SETUP.md` | `src/docs/` | OAuth (legado) |
| `src/docs/20251122 OAUTH_IMPLEMENTATION_SUMMARY.md` | `src/docs/` | OAuth (legado) |

**Nota**: tem documentação duplicada entre `src/docs/`, `pwa/ref/` e
`pwa/*.md` — provavelmente acumulada em diferentes ondas de refactor.
Vale a pena uma passada de limpeza eventualmente.

---

## 15. Pendências / débitos técnicos

Itens que valem atenção mas não estão quebrando nada:

- [ ] `principaisFluxos.md` desatualizado (estrutura antiga do `src/`)
- [ ] Documentação duplicada entre `src/docs/`, `pwa/ref/`, `pwa/*.md`
- [ ] Falta confirmar helper de `CATEGORIES_SHEET_NAME` no `_google-sheets-helper.js`

**Já limpos nesta sessão (2026-08-06):**
- ✅ `dockerfile.vite` (legado) — deletado
- ✅ `pwa/src/components/HelloWorld.vue` (template Vue) — deletado
- ✅ `src/docs/20251105 CONFIGURACAO-DOCUMENTATION.md` — stub substituiu conteúdo
- ✅ `src/docs/20251105 JS_ORIGINAL_RESUMO.md` — stub substituiu conteúdo
- ✅ Conteúdo de `pb_public/` (snapshot antigo commitado) — tudo deletado
- ✅ Env `SHEET_TEMPLATE_ID` removida do AGENTS.md, Dockerfile e dockerfile.vite
- ✅ Fluxo antigo de "copiar planilha template" removido de:
  README.md, arquitetura.md, pb_hooks/README.md, .github/copilot-instructions.md

---

## 16. Comandos úteis (cola)

```powershell
# Status
cd D:/repos/edsonlcandido/ehtudoplanilha
git status
git log --oneline -10

# Subir PB
./pocketbase.exe serve --dev
# ou
./iniciar-pb.sh       # só funciona em Git Bash / WSL

# Build dashboard
cd src
npm install
npm run build         # gera src/dist/

# Dev dashboard
npm run dev           # http://localhost:5173

# Build PWA
cd ../pwa
npm install
npm run build         # gera pwa/pwa/

# Dev PWA
npm run dev           # http://localhost:5174 (PWA, porta fixa)
```

---

## 17. Quando atualizar este arquivo

- Adicionar/remover **endpoint** no PB → atualizar §6
- Adicionar/remover **página** no src/ ou pwa/ → atualizar §9 / §10
- Adicionar/remover **env var** → atualizar §9 / §10
- Mudar **estrutura de pasta** → atualizar §2 e §3
- Descobrir um **novo gotcha** → atualizar §13
- Mexer em **helper de Sheets** (renomear constante, mudar contrato) → atualizar §8
- Limpar **débito técnico** → atualizar §15

**Princípio**: este arquivo é a **fonte de verdade** do "como o projeto
funciona". Se você (agente ou humano) fizer algo que mude uma premissa aqui,
atualize junto no mesmo PR.
