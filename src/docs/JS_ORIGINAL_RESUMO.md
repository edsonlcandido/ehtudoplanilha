# 📦 Resumo dos JavaScripts do Projeto Original

Análise completa dos arquivos JavaScript em `pb_public/js/` para planejar refatoração para TypeScript.

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

### **1. pb-instance.js** (11 linhas)
**O que faz:**
- Cria **singleton** do PocketBase
- Importa configuração de `api-config.js`
- Exporta instância única `pb` para uso global

**Dependências:** `api-config.js`

**Refatoração:**
✅ **JÁ EXISTE** em `src/services/pocketbase.ts` (mesmo conceito)

---

### **2. auth-service.js** (~50 linhas)
**O que faz:**
- `realizarLogin(email, senha)` - Autentica via PocketBase
- `realizarLogout()` - Limpa authStore
- `estaAutenticado()` - Verifica se token é válido
- `obterUsuarioAtual()` - Retorna model do usuário logado

**Dependências:** `window.pb` (global)

**Refatoração:**
✅ **JÁ EXISTE** em `src/services/auth.ts` (equivalente completo)

---

### **3. menu-usuario.js** (~40 linhas)
**O que faz:**
- `exibirMenuUsuario(menuElementId)` - Renderiza menu dinâmico
  - **Logado**: Mostra email + Dashboard (verde) + Configuração + Sair (vermelho)
  - **Deslogado**: Mostra Login + Registrar
- `inicializarMenuUsuario()` - Setup no DOMContentLoaded

**Dependências:** `auth-service.js`

**Refatoração:**
✅ **JÁ EXISTE** em `src/components/user-menu.ts` (equivalente)

---

### **4. protecao-dashboard.js** (~30 linhas)
**O que faz:**
- `protegerPagina()` - Verifica autenticação e redireciona para login
- `inicializarDashboard()` - Chama proteção + inicializa menu
- Calcula path relativo para login baseado na profundidade da URL

**Dependências:** `auth-service.js`, `menu-usuario.js`

**Refatoração:**
⚠️ **SIMILAR** a `src/ts/protecao-dashboard.ts` mas precisa revisar lógica de path

---

### **5. dashboard-auth.js** (~61 linhas)
**O que faz:**
- **Alternativa** ao `protecao-dashboard.js` (parece duplicado)
- `checkDashboardAuthentication()` - Verifica auth
- `renderDashboardUserMenu()` - Renderiza menu simplificado (só email + Sair)

**Dependências:** `window.pb` (global)

**Refatoração:**
❓ **DUPLICADO** - Verificar qual está sendo usado e consolidar

---

## 🔑 **GOOGLE INTEGRATION**

### **6. google/oauth-service.js** (~197 linhas)
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

### **7. google/sheets-api.js** (~593 linhas) 🔥 **MEGA ARQUIVO**
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

### **8. configuracao.js** (~377 linhas)
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

### **9. sheets-manager.js** (~544 linhas)
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

### **10. lancamentos-manager.js** (~1830 linhas) 🔥 **MAIOR ARQUIVO**
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

### **11. contas-manager.js** (~542 linhas)
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

### **12. components/financial-cards.js** (~375 linhas)
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

### **13. components/entry-modal.js** (~640 linhas)
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

### **14. components/edit-entry-modal.js** (~524 linhas)
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

### **15. components/config-verificator.js** (~80 linhas?)
**O que faz:**
- Verifica se configuração (Google OAuth + Sheet) está completa
- Exibe avisos se algo estiver faltando

**Refatoração:**
❓ **VERIFICAR SE É USADO**

---

### **16. components/orcamento-date-init.js** (~50 linhas?)
**O que faz:**
- Inicializa campo de orçamento (date picker) com mês atual

**Refatoração:**
❓ **VERIFICAR SE É USADO**

---

### **17. components/top-categories-chart.js** (~150 linhas?)
**O que faz:**
- Gráfico de barras horizontal com categorias mais gastas
- Usa Chart.js ou canvas nativo

**Refatoração:**
❓ **VERIFICAR SE É USADO** (pode ter sido removido)

---

### **18. components/details.js** + **details-template.js**
**O que faz:**
- Modal de detalhes de lançamentos por conta
- Usado pelo `contas-manager.js`

**Refatoração:**
❌ **NÃO EXISTE**

---

## 🛠️ **SERVIÇOS AUXILIARES**

### **19. accounts-service.js** (~243 linhas)
**O que faz:**

#### **Gerenciamento de Contas:**
- `getAccounts(forceRefresh)` - Lista de contas
  - **PRIORIDADE 1**: Busca da planilha via `getFinancialSummary().contasSugeridas`
  - **FALLBACK**: Contas padrão hardcoded
- `populateAccountsDatalist(datalistId)` - Popula datalist HTML
- **Cache** de 5 minutos

**Contas Padrão:**
```js
['Conta Corrente', 'Poupança', 'Cartão de Crédito', 
 'Cartão de Débito', 'Dinheiro', 'PIX', 'Outras']
```

**Dependências:** `window.googleSheetsService` (global)

**Refatoração:**
❌ **NÃO EXISTE** - Precisa criar service

---

### **20. categories-service.js** (~145 linhas)
**O que faz:**

#### **Gerenciamento de Categorias:**
- `getCategories(forceRefresh)` - Lista de categorias
  - **PRIORIDADE 1**: Busca da aba "Categorias" via `getCategories()`
  - **FALLBACK**: Categorias padrão hardcoded
- `populateCategoriesDatalist(datalistId)` - Popula datalist HTML
- **Cache** de 5 minutos

**Categorias Padrão:**
```js
['Alimentação', 'Transporte', 'Moradia', 'Saúde',
 'Educação', 'Lazer', 'Vestuário', 'Outras']
```

**Dependências:** `window.googleSheetsService` (global)

**Refatoração:**
❌ **NÃO EXISTE** - Precisa criar service

---

## 🧰 **UTILS**

### **21. utils/sheet-entries.js** (~210 linhas)
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

## ⚙️ **CONFIG**

### **22. config/api-config.js** (~30 linhas)
**O que faz:**
- Exporta `baseURL` do PocketBase
- Detecta ambiente (dev/prod) baseado no hostname
- `getBaseURL()` - Retorna URL base

**Refatoração:**
✅ **SIMILAR** a variáveis de ambiente do Vite

---

## 📱 **PWA (Service Worker)**

### **23. pwa/sw.js** + **registerSW.js**
**O que faz:**
- Service Worker para cache offline
- Manifest para PWA

**Refatoração:**
❓ **BAIXA PRIORIDADE** - PWA pode ser implementado depois

---

## 📊 **RESUMO ESTATÍSTICO**

| Tipo | Quantidade | Linhas Totais |
|------|------------|---------------|
| **Serviços de Auth** | 3 | ~140 |
| **Google Integration** | 2 | ~790 |
| **Managers (Páginas)** | 4 | ~3293 |
| **Componentes UI** | 7 | ~2200 |
| **Serviços Auxiliares** | 2 | ~388 |
| **Utils** | 1 | ~210 |
| **Config** | 1 | ~30 |
| **PWA** | 2 | ~100 |
| **TOTAL** | **22** | **~7151 linhas** |

---

## 🚨 **PRIORIDADES DE REFATORAÇÃO**

### ✅ **JÁ EXISTEM (80% completos):**
1. `pb-instance.js` → `services/pocketbase.ts` ✅
2. `auth-service.js` → `services/auth.ts` ✅
3. `menu-usuario.js` → `components/user-menu.ts` ✅
4. `google/oauth-service.js` → `services/google-oauth.ts` ✅ (verificar completude)
5. `google/sheets-api.js` → `services/sheets.ts` ⚠️ (PARCIAL - falta CRUD e relatórios)

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
1. **`accounts-service.js`** - Service de contas com cache
2. **`categories-service.js`** - Service de categorias com cache
3. **`utils/sheet-entries.js`** - Conversões Excel serial
4. **`contas-manager.js`** - Visão geral por contas (dashboard)

### 🎨 **COMPONENTES UI (Podem ser feitos gradualmente):**
1. **`financial-cards.js`** - Cards de resumo financeiro
2. **`entry-modal.js`** - Modal de adicionar lançamento
3. **`edit-entry-modal.js`** - Modal de editar lançamento
4. **`details.js`** - Modal de detalhes por conta

### ⏸️ **BAIXA PRIORIDADE:**
1. PWA (service worker)
2. Charts (se não estiver sendo usado)
3. Código duplicado (`dashboard-auth.js` vs `protecao-dashboard.js`)

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

### 3. **Criar Utils de Conversão**
```typescript
// src/utils/excel-serial.ts
toExcelSerial(date: Date, withTime?: boolean): number
excelSerialToDate(serial: number, withTime?: boolean): Date
formatCurrency(value: number): string
formatDate(serial: number): string
```

### 4. **Criar Services de Cache**
```typescript
// src/services/accounts-service.ts
class AccountsService {
  private cache: string[] | null = null;
  private cacheTimestamp: number | null = null;
  
  async getAccounts(forceRefresh = false): Promise<string[]>
  async populateDatalist(elementId: string): Promise<void>
}

// src/services/categories-service.ts
// Similar
```

### 5. **Componentizar Modais**
Criar componentes reutilizáveis:
- `src/components/entry-form-modal.ts` - Form genérico
- `src/components/sheets-selector-modal.ts` - Seleção de planilhas
- `src/components/details-modal.ts` - Detalhes de conta

### 6. **Criar Managers de Página**
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
1. Expandir `sheets.ts` com CRUD completo
2. Criar `accounts-service.ts`
3. Criar `categories-service.ts`
4. Criar `utils/excel-serial.ts`

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

**Total Estimado:** 6-8 semanas para refatoração completa 🎯
