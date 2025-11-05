# 📄 Documentação - Dashboard Index (`pb_public_/dashboard/index.html`)

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura e Fluxo](#arquitetura-e-fluxo)
3. [Estrutura HTML](#estrutura-html)
4. [Inicialização e Ciclo de Vida](#inicialização-e-ciclo-de-vida)
5. [Componentes Principais](#componentes-principais)
6. [Fluxos de Dados](#fluxos-de-dados)
7. [Eventos e Comunicação](#eventos-e-comunicação)
8. [Estados e Renderização](#estados-e-renderização)
9. [API e Endpoints](#api-e-endpoints)
10. [Segurança e Validação](#segurança-e-validação)

---

## 🎯 Visão Geral

O **Dashboard Index** é a página principal do aplicativo após autenticação. Apresenta um resumo financeiro com cards de orçamentos, detalhes agregados e tabela de top categorias.

### Objetivos Principais:
- ✅ Exibir resumo financeiro por orçamento (data-chave)
- ✅ Mostrar saldo total, receitas e despesas
- ✅ Listar contas e seus saldos
- ✅ Top 10 categorias de gastos
- ✅ Validar integração com Google Drive
- ✅ Permitir adição de novos lançamentos

### Funcionalidades:
- 📊 **Cards de Orçamento** - Um card por data (orçamento)
- 🔀 **Toggle de Intervalo** - Ativo vs. Inativo (fora do período)
- 💾 **Atualização em Tempo Real** - Novo lançamento atualiza dashboard
- 📋 **Detalhes Agregados** - Contas e categorias ao clicar em card
- ⚙️ **Verificação de Config** - Valida Google Drive antes de carregar dados
- 🚀 **Lazy Loading** - Dados carregados apenas quando necessário

### Tecnologias:
- **Vanilla JavaScript** (ES6+ Modules)
- **PocketBase** - Backend
- **Picnic CSS** - Framework de estilos
- **JSONQuery** - Agregação de dados
- **Event Emitter Pattern** - Comunicação entre componentes

---

## 🏗️ Arquitetura e Fluxo

### Fluxo de Inicialização

```
1. HTML carregado (DOMContentLoaded)
   ↓
2. Injeta template do modal no body
   ↓
3. Inicializa PocketBase globalmente
   ↓
4. Inicializa menu de usuário
   ↓
5. Configura event listeners dos cards
   ↓
6. Inicializa modal de lançamento
   ↓
7. Verifica configuração do Google
   ├─ Se inválida:
   │  ├─ Mostra botão "Configurar Integração"
   │  ├─ Esconde cards e detalhes
   │  └─ Desabilita links da sidebar
   └─ Se válida:
      ├─ Busca lançamentos (GET /get-sheet-entries)
      ├─ Busca categorias (GET /get-sheet-categories)
      ├─ Dispara evento 'sheet:loaded'
      ├─ Renderiza cards de orçamento
      └─ Inicializa detalhes (primeiro orçamento)
```

### Arquitetura em Componentes

```
┌─────────────────────────────────────┐
│  Dashboard Index (index.html)        │
│  - Orquestração principal            │
│  - Validação de config               │
│  - Carregamento de dados             │
└────────────┬────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───┴──────┐    ┌─────┴──────┐
│  Coluna  │    │   Coluna   │
│  Esquerda│    │   Direita  │
│          │    │            │
│ Financial│    │  Details   │
│  Cards   │    │ Aggregates │
└──────────┘    └────────────┘
    │                 │
    ├─ Cards         ├─ Saldo
    │  ├─ Ativo      │  Contas
    │  ├─ Inativo    │  Top 10
    │  └─ Click      │  Categorias
    │                │
    └─ FAB (+)       │
       Lançamento    │
```

### Arquivos Envolvidos

| Arquivo | Responsabilidade |
|---------|------------------|
| `pb_public_/dashboard/index.html` | HTML principal, orquestração |
| `pb_public_/dashboard/js/components/financial-cards.js` | Renderização de cards |
| `pb_public_/dashboard/js/components/details.js` | Detalhes agregados |
| `pb_public_/dashboard/js/components/details-template.js` | Template HTML dos detalhes |
| `pb_public_/js/components/config-verificator.js` | Valida configuração Google |
| `pb_public_/js/components/entry-modal.js` | Modal de novo lançamento |
| `pb_public_/js/utils/sheet-entries.js` | Utilitários de agregação |
| `pb_public_/css/style.css` | Estilos globais |
| `pb_public_/dashboard/css/style.css` | Estilos do dashboard |

---

## 🏷️ Estrutura HTML

### Layout Principal

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <!-- Meta tags, favicon, stylesheets -->
  <link rel="stylesheet" href="../css/picnic.css">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="./css/style.css">
  <link rel="stylesheet" href="./css/financial-cards.css">
  <link rel="stylesheet" href="./css/modal-entry.css">
  <link rel="stylesheet" href="./css/details.css">
</head>

<body>
  <!-- NAV: Menu superior dinâmico -->
  <nav>
    <!-- Logo, menu responsivo, user menu -->
  </nav>

  <!-- Container principal com layout 2 colunas -->
  <div class="app-container">
    
    <!-- Sidebar esquerda: Menu de navegação -->
    <aside class="sidebar-menu">
      <a href="index.html" class="active">🏠 Dashboard</a>
      <a href="lancamentos.html">📋 Lançamentos</a>
      <a href="/pwa">📱 Celular</a>
    </aside>

    <!-- Conteúdo principal -->
    <main class="main-content">
      <section class="section section-light dashboard-main">
        <div class="container dashboard__content">
          
          <!-- Header de boas-vindas -->
          <header class="dashboard__header">
            <h2 class="dashboard__title">Bem-vindo ao seu Dashboard!</h2>
            <p class="dashboard__subtitle">...</p>
            <a href="configuracao.html" id="configBtn" class="button primary" style="display: none;">
              ⚙️ Configurar Integração
            </a>
          </header>

          <!-- Row com 2 colunas: cards (esquerda) + detalhes (direita) -->
          <div class="dashboard__row">
            
            <!-- Coluna Esquerda: Financial Cards -->
            <div class="dashboard__col dashboard__col--left">
              <div id="summaryCards" class="summary-cards">
                <!-- Cards renderizados dinamicamente -->
              </div>
              
              <!-- Botão FAB para novo lançamento -->
              <div style="margin-top:1rem;">
                <button id="openEntryModal" class="button">+</button>
              </div>
            </div>

            <!-- Coluna Direita: Details Aggregates -->
            <aside class="dashboard__col dashboard__col--right details">
              <!-- Template injetado dinamicamente -->
            </aside>
            
          </div>
        </div>
      </section>
    </main>
  </div>

  <!-- FOOTER -->
  <footer class="footer">...</footer>

  <!-- Scripts: Inicialização do dashboard -->
  <script type="module">
    // ... (descrito abaixo)
  </script>
</body>
</html>
```

### Estrutura de Elementos

```
<body>
├── <nav>                    ← Menu superior
├── <div class="app-container">
│   ├── <aside class="sidebar-menu">
│   │   ├── <a> Dashboard
│   │   ├── <a> Lançamentos
│   │   └── <a> Celular
│   │
│   └── <main class="main-content">
│       └── <section class="section section-light dashboard-main">
│           └── <div class="container dashboard__content">
│               ├── <header class="dashboard__header">
│               │   ├── <h2> Bem-vindo...
│               │   ├── <p> Descrição...
│               │   └── <a id="configBtn"> Configurar
│               │
│               └── <div class="dashboard__row">
│                   ├── <div class="dashboard__col--left">
│                   │   ├── <div id="summaryCards"> Cards
│                   │   └── <button id="openEntryModal"> +
│                   │
│                   └── <aside class="dashboard__col--right details">
│                       ├── <div class="details__aggregates">
│                       │   ├── <h3> Saldo e contas
│                       │   ├── <h3> Saldo
│                       │   └── <div class="details__cards">
│                       │
│                       └── <div class="details__top-categories">
│                           ├── <h3> Top 10
│                           └── <table class="details__table">
│
└── <footer class="footer">
```

---

## ⚙️ Inicialização e Ciclo de Vida

### Script de Inicialização Principal

```typescript
// 1. Injeta modal no body
document.body.insertAdjacentHTML('beforeend', entryModalTemplate);

// 2. Inicializa PocketBase globalmente
window.pb = new PocketBase(apiConfig.getBaseURL());

// 3. Inicializa componentes
inicializarMenuUsuario();
inicializarEventos();
inicializarModalDeLancamento();

// 4. Verifica configuração do Google
const configVerificator = new ConfigVerificator({ configBtnId: 'configBtn' }).init();
const cfgResult = await configVerificator.verificarConfiguracao(pb);
const isConfigValid = cfgResult && cfgResult.validConfig === true;

// 5. Se config inválida: para aqui
if (!isConfigValid) {
  // Mostra botão de config
  // Esconde cards e detalhes
  setSidebarLinksEnabled(false);
  return;
}

// 6. Se config válida: carrega dados
const responseEntries = await fetch(`/get-sheet-entries?limit=0`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${pb.authStore.token}`
  }
});
const sheetEntriesData = await responseEntries.json();
const entries = sheetEntriesData?.entries ?? [];

// 7. Busca categorias
const responseCat = await fetch(`/get-sheet-categories`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${pb.authStore.token}`
  }
});
const catData = await responseCat.json();
const categories = catData?.categories ?? [];

// 8. Dispara evento 'sheet:loaded'
document.dispatchEvent(new CustomEvent('sheet:loaded', {
  detail: { allentries: entries, entries, categories }
}));

// 9. Se sem entradas: mostra mensagem
if (!entries || entries.length === 0) {
  // Esconde cards
  // Mostra: "Insira o primeiro lançamento"
  return;
}

// 10. Processa orçamentos e renderiza
const allSummaries = aggregateByBudget(entries);
const entriesInInterval = filterEntriesByInterval(entries);
const currentSummary = aggregateByBudget(entriesInInterval);

renderizarCards(allSummaries, budgetsInIntervalMap);
inicializarDetalhes(entries, budgetsInInterval);

// 11. Ouve evento de novo lançamento
document.addEventListener('entry:created', (ev) => {
  const newEntry = ev.detail?.entry;
  atualizarCardsComNovoLancamento(newEntry, updatedEntries);
});
```

### Estados Possíveis

```
┌─────────────────────────────┐
│ ESTADO: CARREGANDO           │
│ - Verificando config         │
│ - Buscando dados             │
│ - Renderizando componentes   │
└──────────┬────────────────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌──────────┐  ┌────────────┐
│ INVÁLIDO │  │   VÁLIDO   │
│  CONFIG  │  │  COM DADOS │
└──────────┘  └────────────┘
     │              │
     │              ├─ Sem Entradas
     │              │  └─ Mostra: "Insira 1º lançamento"
     │              │
     │              └─ Com Entradas
     │                 └─ Cards + Detalhes
     │
     └─ Mostra: "Configurar Integração"
```

---

## 🧩 Componentes Principais

### 1. Financial Cards (Coluna Esquerda)

**Responsabilidade:** Renderizar cards de orçamento

```typescript
function renderizarCards(summary, intervalBudgets) {
  // summary: Array de resumos
  // intervalBudgets: Map de orçamentos no período
  
  const container = document.getElementById('summaryCards');
  
  // Ordena por data (decrescente)
  const sorted = summary.sort((a, b) => b.orcamento - a.orcamento);
  
  sorted.forEach(item => {
    const isInInterval = intervalBudgets[item.label] === true;
    
    if (isInInterval) {
      // Card ATIVO: mostra todos detalhes + botão de fechar
      container.appendChild(criarCardAtivo(item));
    } else {
      // Card INATIVO: apenas label + valor (clicável)
      container.appendChild(criarCardInativo(item));
    }
  });
}
```

**Card Ativo (Exemplo):**
```html
<div class="financial-card receitas compacto" data-budget="31/10/2025">
  <button class="card-close">✕</button>
  <div class="card-header">
    <h3 class="card-title">31/10/2025</h3>
  </div>
  <div class="card-value">R$ 1.234,56</div>
  <div class="card-actions">
    <button class="button pseudo card-toggle">Mostrar detalhes</button>
  </div>
  <div class="card-details">
    <div class="card-muted">Receitas: R$ 5.000,00</div>
    <div class="card-muted">Despesas: R$ -3.765,44</div>
  </div>
</div>
```

**Card Inativo (Exemplo):**
```html
<div class="financial-card receitas inactive compacto" data-budget="30/10/2025">
  <div class="card-header">
    <h3 class="card-title">30/10/2025</h3>
  </div>
  <div class="card-value">R$ 2.500,00</div>
</div>
```

**Estados Visuais:**
```
ATIVO (in-interval)
┌──────────────────────┐
│ ✕  30/10/2025       │ ← Com botão de fechar
├──────────────────────┤
│ R$ 1.234,56          │
├──────────────────────┤
│ [Mostrar detalhes]   │
├──────────────────────┤
│ Receitas: R$ 5.000   │
│ Despesas: -R$ 3.765  │
└──────────────────────┘

INATIVO (fora do intervalo)
┌──────────────────────┐
│  29/10/2025         │
├──────────────────────┤
│ R$ 2.500,00         │ ← Sem detalhes, clicável
└──────────────────────┘
```

### 2. Details Component (Coluna Direita)

**Responsabilidade:** Mostrar agregados quando card é clicado

```typescript
function inicializarDetalhes(entries, budgetsInInterval) {
  const container = document.querySelector('.details');
  
  // Estado interno
  let selectedBudgets = budgetsInInterval.map(b => b.orcamento);
  let currentEntries = entries;
  
  // Ao clicar em um card inativo:
  // 1. Injeta template dos detalhes
  // 2. Filtra entradas do orçamento selecionado
  // 3. Renderiza contas e top 10 categorias
  
  function renderizarDetalhes(orcamentos) {
    const filtered = currentEntries.filter(e => 
      orcamentos.includes(e.orcamento)
    );
    
    // Calcula saldo total
    const saldoTotal = filtered.reduce((acc, e) => acc + e.valor, 0);
    
    // Agrupa por conta
    const contas = agruparPorConta(filtered);
    
    // Agrupa por categoria (apenas despesas)
    const categorias = agruparPorCategoria(filtered)
      .filter(item => item.total < 0)
      .sort((a, b) => a.total - b.total);
    
    // Renderiza HTML
    container.innerHTML = detailsTemplate;
    container.querySelector('#detail-saldo').textContent = formatarMoeda(saldoTotal);
    // ... renderiza contas e categorias
  }
}
```

**Template Detalhes (Estrutura):**
```html
<div class="details__aggregates">
  <h3 class="details__title">Saldo e contas</h3>
  <h3 id="detail-budget-label">31/10/2025</h3>
  <h3><span id="detail-saldo">R$ 1.234,56</span></h3>
  
  <div class="details__cards" id="detail-accounts-cards">
    <!-- Contas renderizadas dinamicamente -->
    <div class="details__card">
      <div class="details__card-title">Nubank</div>
      <div class="details__card-value">R$ 500,00</div>
    </div>
  </div>
</div>

<div class="details__top-categories">
  <h3 class="details__title">Top 10 Gastos por Categoria</h3>
  <table class="details__table primary">
    <thead>
      <tr>
        <th>#</th>
        <th>Categoria</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody id="detail-categories-list">
      <!-- Categorias renderizadas dinamicamente -->
    </tbody>
  </table>
</div>
```

### 3. Entry Modal

**Responsabilidade:** Capturar novo lançamento

```typescript
inicializarModalDeLancamento()
  // - Injeta template
  // - Configura event listeners
  // - Carrega autocompletes
  
// Ao clicar "Salvar":
// 1. Valida formulário
// 2. POST /append-entry
// 3. Dispara evento 'entry:created'
// 4. Dashboard atualiza cards
```

### 4. Config Verificator

**Responsabilidade:** Validar Google Drive integration

```typescript
const configVerificator = new ConfigVerificator({ 
  configBtnId: 'configBtn' 
}).init();

const result = await configVerificator.verificarConfiguracao(pb);

// result.validConfig === true/false
// result.mensagem: "Configuração válida" ou erro
```

---

## 🔄 Fluxos de Dados

### Fluxo 1: Carregamento Inicial

```
1. Page Load
   ↓
2. Verificar Config Google
   ├─ GET /check-refresh-token (backend)
   ├─ Valida se usuario tem google_infos
   └─ Se válido: continua; se não: para
   ↓
3. Buscar Entradas
   ├─ GET /get-sheet-entries?limit=0
   ├─ Retorna: { entries: [...] }
   └─ Armazena em window.allEntries
   ↓
4. Buscar Categorias
   ├─ GET /get-sheet-categories
   ├─ Retorna: { categories: [...] }
   └─ Armazena em window.categories
   ↓
5. Processar Dados
   ├─ aggregateByBudget(entries) → Array de resumos
   ├─ filterEntriesByInterval(entries) → Entradas do período
   └─ budgetsInEntries(entries) → Orçamentos únicos
   ↓
6. Renderizar Cards
   ├─ renderizarCards(allSummaries, intervalBudgetsMap)
   └─ Cards renderizados no #summaryCards
   ↓
7. Inicializar Detalhes
   ├─ inicializarDetalhes(entries, budgetsInInterval)
   └─ Aguarda clique em card para renderizar
```

**Dados Carregados:**
```javascript
window.allEntries = [
  {
    rowIndex: 1,
    data: "31/10/2025",
    conta: "Nubank",
    valor: 123.45,
    descricao: "Compra",
    categoria: "Alimentação",
    tipo: "despesa",
    orcamento: "2025-10-31"  // timestamp
  },
  // ...
];

window.allBudgets = [
  { orcamento: "2025-10-31", label: "31/10/2025" },
  { orcamento: "2025-10-30", label: "30/10/2025" }
];

window.budgetsInInterval = [
  { orcamento: "2025-10-31", label: "31/10/2025" }
];

window.summaryByBudget = [
  {
    orcamento: "2025-10-31",
    label: "31/10/2025",
    sum: 1234.56,
    incomes: 5000.00,
    expenses: -3765.44
  }
];
```

### Fluxo 2: Novo Lançamento (Em Tempo Real)

```
1. Usuário clica botão FAB (+)
   ↓
2. Modal de lançamento abre
   ↓
3. Usuário preenche e clica "Salvar"
   ↓
4. Frontend valida
   ↓
5. Frontend POST /append-entry
   └─ Payload: { data, conta, valor, descricao, categoria, tipo, orcamento }
   ↓
6. Backend insere na Google Sheets
   ├─ Obtém sheet_id do usuario
   ├─ Chama Sheets API v4
   └─ Insere linha na aba "Lançamentos"
   ↓
7. Backend retorna { success: true, rowIndex }
   ↓
8. Frontend dispara evento 'entry:created'
   └─ detail: { entry: {...} }
   ↓
9. Dashboard ouve 'entry:created'
   ├─ Adiciona entry a window.allEntries
   ├─ Recalcula agregações
   ├─ Atualiza cards
   └─ Atualiza detalhes se necessário
   ↓
10. UI reflete nova entrada em tempo real
```

### Fluxo 3: Interação com Cards

```
Usuário clica em card inativo
   ↓
Evento 'click' disparado
   ↓
cardClickHandler executado
   ├─ Obtém data do orçamento (e.g., "2025-10-30")
   └─ Chama renderizarDetalhes(["2025-10-30"])
   ↓
Details renderizado com dados do orçamento
   ├─ Saldo total
   ├─ Contas e saldos
   └─ Top 10 categorias (despesas)
   ↓
Usuário vê detalhes do período selecionado
   ↓
Usuário clica X (fechar)
   ├─ Evento handleCloseClick
   └─ Card volta ao estado inativo
```

---

## 📣 Eventos e Comunicação

### Event Emitter Pattern

**Events Utilizados:**

| Event | Disparado | Ouvido Por | Payload |
|-------|-----------|-----------|---------|
| `sheet:loaded` | init script | components | `{ allentries, entries, categories }` |
| `entry:created` | entry-modal.js | dashboard | `{ entry: {...} }` |
| `cards:updated` | financial-cards.js | details.js | `{ entry, allEntries, budgetsInInterval }` |

**Exemplo de Uso:**

```javascript
// Disparar evento
document.dispatchEvent(new CustomEvent('sheet:loaded', {
  detail: {
    allentries: entries,
    entries: entries.slice(0, 200),
    categories
  }
}));

// Ouvir evento
document.addEventListener('sheet:loaded', (ev) => {
  const { allentries, entries, categories } = ev.detail;
  console.log('Dados carregados:', entries.length);
});
```

---

## 📊 Estados e Renderização

### Estado do Dashboard

```typescript
interface DashboardState {
  // Dados
  allEntries: SheetEntry[];        // Todos os lançamentos
  categories: string[];            // Categorias da planilha
  allBudgets: Budget[];           // Todos os orçamentos
  budgetsInInterval: Budget[];    // Orçamentos no período atual
  
  // UI
  isConfigValid: boolean;         // Google Drive configurado?
  selectedBudgets: number[];      // Orçamentos selecionados nos detalhes
  
  // Renderização
  summaryByBudget: BudgetSummary[]; // Resumos por orçamento
  intervalBudgetsMap: Map<string, boolean>; // Mapa de orçamentos ativos
}
```

### Estados de Carregamento

```css
/* Mientras se cargan datos */
.loading {
  opacity: 0.6;
  pointer-events: none;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
```

---

## 🔌 API e Endpoints

### 1. GET `/get-sheet-entries?limit=0` - Listar Lançamentos

**Requisição:**
```http
GET /get-sheet-entries?limit=0 HTTP/1.1
Authorization: Bearer {USER_TOKEN}
```

**Resposta:**
```json
{
  "entries": [
    {
      "rowIndex": 1,
      "data": "31/10/2025",
      "conta": "Nubank",
      "valor": 123.45,
      "descricao": "Compra",
      "categoria": "Alimentação",
      "tipo": "despesa",
      "orcamento": 1730332800  // timestamp
    }
  ]
}
```

---

### 2. GET `/get-sheet-categories` - Listar Categorias

**Requisição:**
```http
GET /get-sheet-categories HTTP/1.1
Authorization: Bearer {USER_TOKEN}
```

**Resposta:**
```json
{
  "success": true,
  "categories": [
    "Alimentação",
    "Transporte",
    "Moradia",
    "Saúde"
  ]
}
```

---

### 3. POST `/append-entry` - Adicionar Lançamento

**Requisição:**
```http
POST /append-entry HTTP/1.1
Authorization: Bearer {USER_TOKEN}
Content-Type: application/json

{
  "data": "31/10/2025 14:30",
  "conta": "Nubank",
  "valor": 123.45,
  "descricao": "Compra no supermercado",
  "categoria": "Alimentação",
  "tipo": "despesa",
  "orcamento": "31/10/2025"
}
```

**Resposta (200):**
```json
{
  "success": true,
  "rowIndex": 42,
  "entry": {
    "rowIndex": 42,
    "data": "31/10/2025 14:30",
    "conta": "Nubank",
    "valor": 123.45,
    "descricao": "Compra no supermercado",
    "categoria": "Alimentação",
    "tipo": "despesa",
    "orcamento": "31/10/2025"
  }
}
```

---

### 4. GET `/check-refresh-token` - Verificar Config

**Requisição:**
```http
GET /check-refresh-token HTTP/1.1
Authorization: Bearer {USER_TOKEN}
```

**Resposta:**
```json
{
  "hasRefreshToken": true,
  "userId": "user123"
}
```

---

## 🔐 Segurança e Validação

### Validações Frontend

```javascript
// 1. Autenticação obrigatória
if (!pb.authStore.isValid) {
  redirect('/login');
}

// 2. Google Drive integrado
const configValid = await configVerificator.verificarConfiguracao(pb);
if (!configValid) {
  mostrarConfigButton();
  disableContentArea();
}

// 3. Entradas vazias tratadas
if (!entries || entries.length === 0) {
  mostrarMensagem('Insira o primeiro lançamento');
}
```

### Validações Backend

- ✅ `@requireAuth()` - Autenticação obrigatória
- ✅ Validação de schema - Campos obrigatórios
- ✅ Proteção contra SQL injection (via ORM)
- ✅ Autorização - Usuário acessa apenas seus dados
- ✅ Rate limiting (recomendado)

---

## 📱 Responsividade

### Breakpoints

```css
/* Desktop */
@media (min-width: 1024px) {
  .dashboard__row {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
  }
}

/* Tablet */
@media (max-width: 1024px) and (min-width: 768px) {
  .dashboard__row {
    grid-template-columns: 1fr 1fr;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .dashboard__row {
    grid-template-columns: 1fr;
  }
  
  .details {
    display: none; /* Ou expandível */
  }
}
```

---

## 🚀 Otimizações

### Performance

```javascript
// 1. Lazy Loading de Detalhes
// - Detalhes só renderizados ao clicar em card
// - Não renderiza todos os orçamentos de uma vez

// 2. Agregação Eficiente
// - JSONQuery para operações em array
// - Map em vez de array para lookup de orçamentos

// 3. Event Delegation
// - Um listener em container em vez de por card
// - Melhora performance com muitos cards

// 4. Virtual Scrolling (futuro)
// - Se muitos cards, considerar virtual scrolling
```

---

## 📚 Referências

- [PocketBase Docs](https://pocketbase.io)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Custom Events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)
- [JSONQuery GitHub](https://github.com/jqlang/jq)
- [Picnic CSS](https://picnicss.com)

---

**Versão:** 1.0  
**Última atualização:** 03 de Novembro de 2025  
**Autores:** GitHub Copilot, Edson Candido
