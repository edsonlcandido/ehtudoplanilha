# 📦 Resumo dos JavaScripts do Projeto Original (PB_PUBLIC)

Análise dos arquivos JavaScript **ATUALMENTE EM USO** em `pb_public/` baseada nos imports dos arquivos HTML.

> ⚠️ **Nota**: Este resumo contém apenas os arquivos que estão sendo carregados/importados pelos HTMLs do pb_public. Arquivos não usados foram removidos da análise.

---

## 🏗️ **ARQUITETURA GERAL**

### Estrutura de Pastas
```
pb_public/js/
├── config/           # Configurações
├── google/           # Integração Google (OAuth + Sheets API)
├── components/       # Componentes UI reutilizáveis
├── utils/            # Utilitários (conversões, formatações)
└── *.js              # Serviços e managers principais
```

---

## 📄 **ARQUIVOS PRINCIPAIS**

### **1. config/api-config.js** (~30 linhas) - ✅ **EM USO**
**Usado em:** `index.html`, `login.html`, `registro.html` (inline imports)

**O que faz:**
- Exporta `baseURL` do PocketBase
- Detecta ambiente (dev/prod) baseado no hostname
- `getBaseURL()` - Retorna URL base

**Refatoração:**
✅ **SIMILAR** a variáveis de ambiente do Vite

---

### **2. auth-service.js** (~50 linhas) - ✅ **EM USO**
**Usado em:** `login.html` (inline import)

**O que faz:**
- `realizarLogin(email, senha)` - Autentica via PocketBase
- `realizarLogout()` - Limpa authStore
- `estaAutenticado()` - Verifica se token é válido
- `obterUsuarioAtual()` - Retorna model do usuário logado

**Dependências:** `window.pb` (global)

**Refatoração:**
✅ **JÁ EXISTE** em `src/services/auth.ts` (equivalente completo)

---

### **3. menu-usuario.js** (~40 linhas) - ✅ **EM USO**
**Usado em:** `dashboard/configuracao.html` (dynamic import)

**O que faz:**
- `exibirMenuUsuario(menuElementId)` - Renderiza menu dinâmico
  - **Logado**: Mostra email + Dashboard (verde) + Configuração + Sair (vermelho)
  - **Deslogado**: Mostra Login + Registrar
- `inicializarMenuUsuario()` - Setup no DOMContentLoaded

**Dependências:** `auth-service.js`

**Refatoração:**
✅ **JÁ EXISTE** em `src/components/user-menu.ts` (equivalente)

---

### **4. protecao-dashboard.js** (~30 linhas) - ✅ **EM USO**
**Usado em:** `dashboard/configuracao.html` (dynamic import)

**O que faz:**
- `protegerPagina()` - Verifica autenticação e redireciona para login
- `inicializarDashboard()` - Chama proteção + inicializa menu
- Calcula path relativo para login baseado na profundidade da URL

**Dependências:** `auth-service.js`, `menu-usuario.js`

**Refatoração:**
⚠️ **SIMILAR** a `src/ts/protecao-dashboard.ts` mas precisa revisar lógica de path

---

## 🔑 **GOOGLE INTEGRATION**

### **5. google/oauth-service.js** (~197 linhas) - ✅ **EM USO**
**Usado em:** `configuracao.js` (importado)

**O que faz:**
- `checkRefreshTokenStatus()` - Verifica se usuário tem refresh_token no backend
- `getOAuthEnvironmentVariables()` - Busca CLIENT_ID e REDIRECT_URI do backend
- `startOAuthFlow()` - Redireciona para Google OAuth (constrói URL com scopes)
- `handleOAuthCallback()` - **NÃO IMPLEMENTADO** (callback é tratado pelo backend)
- `revokeGoogleAccess()` - Revoga acesso do Google

**Endpoints usados:**
- GET `/check-refresh-token`
- GET `/env-variables`
- POST `/revoke-google-access` (existe?)

**Dependências:** `api-config.js`

**Refatoração:**
✅ **JÁ EXISTE** em `src/services/google-oauth.ts` (precisa validar completude)

---

### **6. google/sheets-api.js** (~593 linhas) 🔥 **MEGA ARQUIVO** - ✅ **EM USO**
**Usado em:** Todos os managers (configuracao, sheets-manager, lancamentos-manager, contas-manager)

**O que faz:**

#### **Gerenciamento de Planilhas:**
- `listUserSheets()` - Lista sheets do Google Drive
- `saveSelectedSheet(sheetId, sheetName)` - Salva sheet_id no PocketBase
- `getCurrentSheet()` - Retorna sheet configurada
- `provisionSheet()` - Cria planilha a partir de template
- `clearSheetContent()` - Limpa conteúdo da planilha
- `deleteSheetConfiguration()` - Remove configuração

#### **Lançamentos (CRUD):**
- `appendEntry(entry)` - Adiciona lançamento (POST `/append-entry`)
- `getSheetEntries(limit)` - Lista lançamentos (GET `/get-sheet-entries?limit=X`)
- `editSheetEntry(rowIndex, updatedEntry)` - Edita lançamento (PUT `/edit-sheet-entry`)
- `deleteSheetEntry(rowIndex)` - Deleta lançamento (DELETE `/delete-sheet-entry`)

#### **Relatórios e Agregações:**
- `getFinancialSummary(orcamento, useCache)` - Busca resumo financeiro (GET `/get-financial-summary?orcamento=X`)
  - Retorna: `{ saldo, receitas, despesas, variacaoDespesas, contasSugeridas, categoriasSugeridas }`
  - **Cache em memória** por orçamento (5 min expiry)
- `getAvailableMonths()` - Lista meses disponíveis (GET `/get-available-months`)
- `getCategories()` - Lista categorias da aba "Categorias" (GET `/get-sheet-categories`)

**Endpoints usados:**
- `/list-google-sheets`
- `/save-sheet-id`
- `/get-current-sheet`
- `/provision-sheet`
- `/clear-sheet-content`
- `/delete-sheet-config`
- `/append-entry`
- `/get-sheet-entries`
- `/edit-sheet-entry`
- `/delete-sheet-entry`
- `/get-financial-summary`
- `/get-available-months`
- `/get-sheet-categories`

**Dependências:** Nenhuma (standalone)

**Refatoração:**
⚠️ **PARCIALMENTE EXISTE** em `src/services/sheets.ts`
- ✅ Tem: `listSheets`, `saveSheet`, `provisionSheet`
- ❌ Falta: CRUD de lançamentos, relatórios, cache

---

## 🎯 **MANAGERS (Lógica de Página)**

### **7. configuracao.js** (~377 linhas) - ✅ **EM USO**
**Usado em:** `dashboard/configuracao.html` (dynamic import)

**O que faz:**

#### **Sidebar State:**
- `setSidebarLinksState(enabled)` - Habilita/desabilita links "Lançamentos" e "Celular"
- `refreshSidebarLinksState()` - Verifica `/config-status` e atualiza sidebar

#### **OAuth:**
- `checkRefreshTokenStatus()` - Verifica refresh token
- `startOAuth()` - Inicia fluxo OAuth
- `updateAuthorizationButton()` - Atualiza UI do botão "Autorizar Google"
- `handleRevokeAccess()` - Revoga acesso do Google

#### **Planilhas (importa sheets-manager.js):**
- Usa `sheets-manager.js` para seleção e provisionamento

**Endpoints usados:**
- `/config-status`

**Dependências:** `google/oauth-service.js`, `google/sheets-api.js`, `sheets-manager.js`

**Refatoração:**
❌ **NÃO EXISTE** - Precisa criar `src/dashboard/configuracao.ts`

---

### **8. sheets-manager.js** (~544 linhas) - ✅ **EM USO**
**Usado em:** `dashboard/configuracao.html` (dynamic import)

**O que faz:**

#### **Modal de Seleção de Planilhas:**
- `openSheetsModal()` - Abre modal
- `closeSheetsModal()` - Fecha modal
- `loadGoogleSheets()` - Carrega lista de planilhas do Google
- `selectSheet(sheetId, sheetName)` - Seleciona planilha (destaque visual)
- `saveSelectedSheet()` - Salva planilha selecionada no backend

#### **Provisionamento:**
- `provisionTemplate()` - Cria nova planilha a partir de template
- `clearSheetContent()` - Limpa conteúdo da planilha existente

#### **UI States:**
- `showLoading()`, `showError()`, `showSheetsList()` - Estados do modal
- `loadCurrentSheetInfo()` - Carrega info da planilha atual e exibe no card

**Dependências:** `google/sheets-api.js`

**Refatoração:**
❌ **NÃO EXISTE** - Precisa criar componente modal de sheets

---

### **9. lancamentos-manager.js** (~1830 linhas) 🔥 **MAIOR ARQUIVO** - ✅ **EM USO**
**Usado em:** `dashboard/lancamentos.html` (dynamic import)

**O que faz:**

#### **CRUD de Lançamentos:**
- `loadEntries()` - Carrega lançamentos da planilha (via `getSheetEntries`)
- `addEntry(entry)` - Adiciona novo lançamento (abre modal + valida + chama `appendEntry`)
- `editEntry(entry)` - Edita lançamento existente (abre modal + valida + chama `editSheetEntry`)
- `deleteEntry(rowIndex)` - Deleta lançamento (confirma + chama `deleteSheetEntry`)

#### **Filtros e Busca:**
- `handleSearch(term)` - Filtra por texto (busca em todas as colunas)
- `handleSortChange(sortBy)` - Ordena por: data desc, data asc, valor desc, valor asc, original
- `handleHideBlankDatesChange(hide)` - Oculta/mostra linhas sem data
- `applySortingAndFilters()` - Aplica todos os filtros e ordenação

#### **Renderização:**
- `renderEntries()` - Renderiza tabela ou cards (mobile)
  - Desktop: Tabela HTML com colunas
  - Mobile: Cards individuais
- `normalizeEntry(entry)` - Normaliza dados (converte serial Excel → Date)

#### **Modais:**
- Integra com `entry-modal.js` (adicionar)
- Integra com `edit-entry-modal.js` (editar)

#### **Utils:**
- `isBlankEntry(entry)` - Verifica se linha é totalmente vazia
- `formatCurrency(valor)` - Formata moeda BRL
- `formatDate(serial)` - Converte serial Excel → DD/MM/YYYY

**Dependências:** `google/sheets-api.js`, `utils/sheet-entries.js`, `entry-modal.js`, `edit-entry-modal.js`

**Refatoração:**
❌ **NÃO EXISTE** - Precisa criar `src/dashboard/lancamentos.ts` (COMPLEXO!)

---

### **10. contas-manager.js** (~542 linhas) - ✅ **EM USO**
**Usado em:** `dashboard/index.html` (dynamic import)

**O que faz:**

#### **Visão Geral por Contas:**
- `carregarContas(orcamento)` - Carrega lançamentos e agrupa por conta
- `carregarOrcamentosDisponiveis()` - Lista orçamentos (meses) disponíveis
- `renderCards()` - Renderiza cards de contas com:
  - Nome da conta
  - Saldo (verde/vermelho)
  - Botão de detalhes (modal)

#### **Modal de Detalhes:**
- `showDetails(conta)` - Abre modal com lançamentos filtrados por conta
- Renderiza tabela de lançamentos da conta específica

#### **Seleção de Orçamento:**
- Select de orçamento (mês/ano)
- Atualiza cards quando muda orçamento

**Dependências:** `google/sheets-api.js`

**Refatoração:**
❌ **NÃO EXISTE** - Precisa criar (parte do dashboard principal?)

---

## 🎨 **COMPONENTES UI**

### **11. components/financial-cards.js** (~375 linhas) - ✅ **EM USO**
**Usado em:** `dashboard/index.html` (dynamic import)

**O que faz:**

#### **Renderiza 3 Cards:**
1. **Saldo** (verde/vermelho): Receitas - Despesas
2. **Despesas** (vermelho): Total de despesas + variação vs mês anterior
3. **Receitas** (verde): Total de receitas

#### **Features:**
- Toggle de visibilidade (botão olho) - salva preferência no localStorage
- Loading states (skeleton)
- Animação de contadores
- Responsivo (mobile stack vertical)

#### **Métodos:**
- `update(data)` - Atualiza dados dos cards
- `formatarMoeda(valor)` - BRL
- `formatarVariacaoDespesas(variacao)` - Exibe % + ícone 📈📉
- `toggleDespesasVisibility()` / `toggleReceitasVisibility()`

**Dependências:** Nenhuma (standalone)

**Refatoração:**
⚠️ **EXISTE PARCIAL** em `pb_public/dashboard/css/financial-cards.css`
- Precisa criar componente TypeScript equivalente

---

### **12. components/entry-modal.js** (~640 linhas) - ✅ **EM USO**
**Usado em:** `dashboard/lancamentos.html` (dynamic import)

**O que faz:**

#### **Modal de Adicionar Lançamento:**
- Form com campos: Data, Conta, Valor, Descrição, Categoria, Orçamento, Obs
- **Toggle +/−** para receita/despesa
- **Autocomplete** para: Conta, Categoria, Descrição, Orçamento
  - Carrega sugestões da planilha via `getFinancialSummary`
- **Validação** de campos obrigatórios
- **Submit** → chama `appendEntry` do sheets-api

#### **Features:**
- Datalist para autocomplete
- Conversão Date → Serial Excel (via utils)
- Feedback de sucesso/erro
- Limpa form após submit

**Dependências:** `utils/sheet-entries.js`, `api-config.js`

**Refatoração:**
❌ **NÃO EXISTE** - Precisa criar componente modal

---

### **13. components/edit-entry-modal.js** (~524 linhas) - ✅ **EM USO**
**Usado em:** `dashboard/lancamentos.html` (dynamic import)

**O que faz:**

#### **Modal de Editar Lançamento:**
- **Similar** ao entry-modal mas para edição
- Preenche form com dados existentes
- Submit → chama `editSheetEntry` (passa rowIndex)

#### **Diferenças:**
- Recebe `currentEntry` com rowIndex
- Não limpa form (mantém dados em caso de erro)
- Callback `onSave` para atualizar lista

**Dependências:** `utils/sheet-entries.js`

**Refatoração:**
❌ **NÃO EXISTE** - Precisa criar componente modal de edição

---

### **14. components/details.js** + **details-template.js** - ✅ **EM USO**
**Usado em:** `dashboard/index.html` (dynamic import)

**O que faz:**
- Modal de detalhes de lançamentos por conta
- Usado pelo `contas-manager.js`

**Refatoração:**
❌ **NÃO EXISTE**

---

## 🧰 **UTILS**

### **15. utils/sheet-entries.js** (~210 linhas) - ✅ **EM USO**
**Usado em:** `entry-modal.js`, `edit-entry-modal.js`, `lancamentos-manager.js`

**O que faz:**

#### **Conversões de Data:**
- `toExcelSerial(date, dataHora)` - Date → Serial Excel (com correção de timezone e leap year bug)
- `excelSerialToDate(serial, dataHora)` - Serial Excel → Date
- `toExcelSerialDia(date)` - Date → Serial sem hora (meio-dia)
- `excelSerialToMonthLabel(serial)` - Serial → "jan/25" ou "2025-01"

#### **Intervalos e Filtros:**
- `getIntervalSerials(startDate, endDate)` - Retorna { startSerial, endSerial }
- `filterEntriesByInterval(entries, startSerial, endSerial)` - Filtra lançamentos por período
- `aggregateByBudget(entries)` - Agrupa por orçamento

#### **Formatação:**
- `formatCurrency(valor)` - BRL
- `formatDate(serial)` - DD/MM/YYYY

**Dependências:** `api-config.js`

**Refatoração:**
❌ **NÃO EXISTE** - Precisa criar utils de conversão

---

## ⚙️ **BIBLIOTECAS AUXILIARES**

### **16. jsonquery.bundle.js** - ✅ **EM USO**
**Usado em:** `dashboard/index.html` (script tag)

**O que faz:**
- Biblioteca externa para queries em objetos JSON
- Usada para filtros e agregações nos lançamentos

**Refatoração:**
❓ **AVALIAR** - Pode ser substituído por funções nativas TypeScript

---

## 📊 **RESUMO ESTATÍSTICO (APENAS ARQUIVOS EM USO)**

| Tipo | Quantidade | Linhas Totais |
|------|------------|---------------|
| **Config** | 1 | ~30 |
| **Serviços de Auth** | 2 | ~80 |
| **Google Integration** | 2 | ~790 |
| **Managers (Páginas)** | 4 | ~3293 |
| **Componentes UI** | 3 | ~1539 |
| **Utils** | 1 | ~210 |
| **Bibliotecas** | 1 | ? |
| **TOTAL** | **14** | **~5942 linhas** |

> **Removidos do resumo original:** 8 arquivos não utilizados (pb-instance.js, dashboard-auth.js, accounts-service.js, categories-service.js, config-verificator.js, orcamento-date-init.js, top-categories-chart.js, PWA files)

---

## 🚨 **PRIORIDADES DE REFATORAÇÃO**

### ✅ **JÁ EXISTEM (Parcialmente completos):**
1. `api-config.js` → Variáveis de ambiente Vite ✅
2. `auth-service.js` → `services/auth.ts` ✅
3. `menu-usuario.js` → `components/user-menu.ts` ✅
4. `protecao-dashboard.js` → Similar mas precisa revisar ⚠️
5. `google/oauth-service.js` → `services/google-oauth.ts` ⚠️ (verificar completude)
6. `google/sheets-api.js` → `services/sheets.ts` ⚠️ (PARCIAL - falta CRUD e relatórios)

### 🔥 **ALTA PRIORIDADE (Funcionalidades Core):**
1. **`lancamentos-manager.js`** (1830 linhas) - Página de lançamentos
   - CRUD completo
   - Filtros e busca
   - Modais de adicionar/editar
   
2. **`configuracao.js`** (377 linhas) - Página de configuração
   - OAuth flow
   - Seleção de planilha
   - Estado da sidebar

3. **`sheets-manager.js`** (544 linhas) - Modal de seleção de planilhas
   
4. **Completar `sheets.ts`** - Adicionar:
   - `getSheetEntries()` ❌
   - `appendEntry()` ❌
   - `editSheetEntry()` ❌
   - `deleteSheetEntry()` ❌
   - `getFinancialSummary()` ❌
   - `getAvailableMonths()` ❌
   - `getCategories()` ❌

### ⚙️ **MÉDIA PRIORIDADE (Serviços de Suporte):**
1. **`utils/sheet-entries.js`** - Conversões Excel serial (CRÍTICO para lançamentos)
2. **`contas-manager.js`** - Visão geral por contas (dashboard)

### 🎨 **COMPONENTES UI (Podem ser feitos gradualmente):**
1. **`financial-cards.js`** - Cards de resumo financeiro
2. **`entry-modal.js`** - Modal de adicionar lançamento
3. **`edit-entry-modal.js`** - Modal de editar lançamento
4. **`details.js`** - Modal de detalhes por conta

### ⏸️ **BAIXA PRIORIDADE:**
1. Consolidar duplicados (protecao-dashboard vs implementação atual)
2. Avaliar substituição do jsonquery.bundle.js por código nativo

---

## 💡 **RECOMENDAÇÕES PARA REFATORAÇÃO**

### 1. **Consolidar Serviços Duplicados**
- Decidir entre `protecao-dashboard.js` vs `dashboard-auth.js`
- Usar apenas um padrão de proteção de rotas

### 2. **Completar Service Layer**
Expandir `src/services/sheets.ts` com:
```typescript
// CRUD de Lançamentos
getSheetEntries(limit?: number): Promise<Entry[]>
appendEntry(entry: Entry): Promise<void>
editSheetEntry(rowIndex: number, entry: Entry): Promise<void>
deleteSheetEntry(rowIndex: number): Promise<void>

// Relatórios
getFinancialSummary(orcamento?: string, useCache?: boolean): Promise<FinancialSummary>
getAvailableMonths(): Promise<string[]>
getCategories(): Promise<string[]>
```

### 3. **Criar Utils de Conversão** ⚠️ **CRÍTICO**
```typescript
// src/utils/excel-serial.ts
toExcelSerial(date: Date, withTime?: boolean): number
excelSerialToDate(serial: number, withTime?: boolean): Date
formatCurrency(value: number): string
formatDate(serial: number): string
```

### 4. **Componentizar Modais**
Criar componentes reutilizáveis:
- `src/components/entry-form-modal.ts` - Form genérico
- `src/components/sheets-selector-modal.ts` - Seleção de planilhas
- `src/components/details-modal.ts` - Detalhes de conta

### 5. **Criar Managers de Página**
```typescript
// src/dashboard/lancamentos.ts
class LancamentosManager {
  async init()
  async loadEntries()
  async addEntry(entry: Entry)
  async editEntry(rowIndex: number, entry: Entry)
  async deleteEntry(rowIndex: number)
  handleSearch(term: string)
  handleSortChange(sortBy: string)
  renderEntries()
}

// src/dashboard/configuracao.ts
class ConfiguracaoManager {
  async init()
  async checkOAuthStatus()
  async startOAuthFlow()
  async loadCurrentSheet()
  async updateSidebarState()
}
```

---

## 📝 **PRÓXIMOS PASSOS SUGERIDOS**

### Fase 1: Completar Service Layer (1-2 semanas)
1. ⚠️ **CRÍTICO**: Criar `utils/excel-serial.ts` (necessário para todos os lançamentos)
2. Expandir `sheets.ts` com CRUD completo
3. Validar `google-oauth.ts` completude

### Fase 2: Página de Configuração (1 semana)
1. `dashboard/configuracao.ts`
2. Componente de seleção de planilhas
3. Integração OAuth completa

### Fase 3: Página de Lançamentos (2-3 semanas) 🔥
1. `dashboard/lancamentos.ts`
2. Modal de adicionar lançamento
3. Modal de editar lançamento
4. Filtros e busca
5. Renderização desktop/mobile

### Fase 4: Dashboard Principal (1 semana)
1. `dashboard/dashboard.ts`
2. Financial cards component
3. Visão por contas (opcional)

### Fase 5: Polimento e Testes (1 semana)
1. Testes E2E
2. Tratamento de erros
3. Loading states
4. Responsividade

---

**Total Estimado:** 5-7 semanas para refatoração completa 🎯

## 📌 **ARQUIVOS REMOVIDOS DA ANÁLISE (NÃO USADOS)**

Os seguintes arquivos existem em `pb_public/js/` mas **NÃO são importados/usados** pelos HTMLs atuais:

1. ❌ **`pb-instance.js`** - Substituído por `window.pb = new PocketBase()` inline
2. ❌ **`dashboard-auth.js`** - Duplicado/não usado (usa protecao-dashboard.js)
3. ❌ **`accounts-service.js`** - Não importado (lógica inline nos managers)
4. ❌ **`categories-service.js`** - Não importado (lógica inline nos managers)
5. ❌ **`components/config-verificator.js`** - Não importado
6. ❌ **`components/orcamento-date-init.js`** - Não importado
7. ❌ **`components/top-categories-chart.js`** - Não importado
8. ❌ **`components/lancamentos-patch.js`** - Não importado
9. ❌ **`pwa/sw.js`** - PWA não ativo no pb_public
10. ❌ **`pwa/registerSW.js`** - PWA não ativo no pb_public

> **Nota**: Estes arquivos podem ser mantidos no repositório como referência, mas não precisam ser priorizados na refatoração pois não estão em uso ativo.

