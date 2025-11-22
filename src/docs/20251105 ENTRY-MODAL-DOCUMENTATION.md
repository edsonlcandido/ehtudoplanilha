# 📄 Documentação - Dashboard Entry Modal Component

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura HTML](#estrutura-html)
4. [Tipos e Interfaces](#tipos-e-interfaces)
5. [Funcionalidades Principais](#funcionalidades-principais)
6. [Fluxos de Dados](#fluxos-de-dados)
7. [Autocomplete System](#autocomplete-system)
8. [API e Endpoints](#api-e-endpoints)
9. [Estilos CSS](#estilos-css)
10. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

O **Entry Modal** é um componente responsável por capturar lançamentos financeiros (despesas/receitas) do usuário. É acionado pelo botão FAB (Floating Action Button) com o ícone `+` no dashboard.

### Objetivos Principais:
- ✅ Formulário rápido para lançar despesas/receitas
- ✅ Autocomplete inteligente de campos
- ✅ Toggle entre despesa (−) e receita (+)
- ✅ Validação de dados antes do envio
- ✅ Feedback visual de sucesso/erro
- ✅ Integração com backend via API

### Funcionalidades:
- 📋 Captura de 7 campos (data, conta, valor, sinal, descrição, categoria, orçamento)
- 🔄 Autocomplete para: conta, descrição, categoria
- ✨ Auto-preenchimento de categoria baseado em descrição
- 🎛️ Toggle visual entre despesa (−) e receita (+)
- ⌨️ Atalho ESC para fechar
- 🖱️ Click outside para fechar
- 📱 Responsivo em mobile/desktop

### Tecnologias:
- **TypeScript** - Tipagem forte
- **Vanilla DOM API** - Sem dependências
- **CSS BEM** - Classe `entry-modal__*`
- **Singleton Pattern** - Uma instância global
- **Event Listeners** - Interatividade robusta

---

## 🏗️ Arquitetura

### Estrutura de Camadas

```
┌──────────────────────────────────────┐
│  Dashboard (dashboard.ts)             │
│  - Botão FAB (+)                      │
│  - Inicializa EntryModal              │
└────────────┬─────────────────────────┘
             │
┌────────────┴─────────────────────────┐
│  EntryModal Class                     │
│  - Template HTML                      │
│  - Event Listeners                    │
│  - Validação                          │
│  - Envio de dados                     │
└────────────┬─────────────────────────┘
             │
┌────────────┴─────────────────────────┐
│  Autocomplete System                  │
│  - Categoria (baseado em histórico)   │
│  - Descrição (sugestões)              │
│  - Conta (histórico)                  │
└────────────┬─────────────────────────┘
             │
┌────────────┴─────────────────────────┐
│  Backend APIs                         │
│  - /get-sheet-entries                 │
│  - /get-sheet-categories              │
│  - /append-entry                      │
└──────────────────────────────────────┘
```

### Arquivos Envolvidos

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/components/entry-modal.ts` | Classe principal, lógica, estado |
| `src/dashboard/css/modal-entry.css` | Estilos do modal, layout |
| `src/types/index.ts` | Tipos TypeScript (EntryFormData, SheetEntry) |
| `src/dashboard/dashboard.ts` | Inicializa e usa o modal |
| `src/dashboard/index.html` | HTML que contém `#openEntryModal` |

### Padrão de Design: Singleton

```typescript
let modalInstance: EntryModal | null = null;

class EntryModal {
  static async getInstance(callback?: OnEntryAddedCallback): Promise<EntryModal> {
    if (!modalInstance) {
      modalInstance = new EntryModal();
      await modalInstance.init(callback);
    }
    return modalInstance;
  }
}

// Uso:
const modal = await EntryModal.getInstance();
modal.open();
```

---

## 🏷️ Estrutura HTML

### Template do Modal (Gerado Dinamicamente)

```html
<div id="entryModal" class="entry-modal" aria-hidden="true" style="display: none;">
  <div class="entry-modal__content">
    <!-- Botão de Fechar -->
    <button id="closeEntryModal" class="entry-modal__close" aria-label="Fechar modal">
      ×
    </button>

    <!-- Título -->
    <h3 class="entry-modal__title">Lançamento de Despesa/Receita</h3>

    <!-- Formulário -->
    <form id="expenseForm" class="entry-modal__form">
      <fieldset>
        
        <!-- Campo 1: Data -->
        <div class="form-group">
          <label for="expenseDate">Data:</label>
          <input 
            type="datetime-local" 
            id="expenseDate" 
            name="data" 
            class="form-control" 
            required
          >
        </div>
        
        <!-- Campo 2: Conta (com autocomplete) -->
        <div class="form-group">
          <label for="expenseAccount">Conta:</label>
          <input 
            type="text" 
            id="expenseAccount" 
            name="conta" 
            class="form-control" 
            placeholder="Ex: Conta Corrente" 
            autocomplete="off" 
            required
          >
          <!-- Container de sugestões será injetado aqui -->
        </div>
        
        <!-- Campo 3: Valor com Toggle de Sinal -->
        <div class="form-group valor-toggle-group">
          <label for="expenseValue">Valor:</label>
          <div class="valor-toggle-container">
            <!-- Botão de Toggle −/+ -->
            <button 
              type="button" 
              id="expenseSignBtn" 
              class="button outline entry-toggle entry-toggle--expense" 
              aria-label="Alternar sinal"
            >
              −
            </button>
            
            <!-- Input de Valor -->
            <input 
              type="number" 
              id="expenseValue" 
              name="valor" 
              class="form-control" 
              step="0.01" 
              min="0" 
              placeholder="0,00" 
              required
            >
            
            <!-- Hidden: Sinal (+ ou −) -->
            <input 
              type="hidden" 
              id="expenseSignValue" 
              name="sinal" 
              value="−"
            >
          </div>
        </div>
        
        <!-- Campo 4: Descrição (com autocomplete) -->
        <div class="form-group">
          <label for="expenseDescription">Descrição:</label>
          <input 
            type="text" 
            id="expenseDescription" 
            name="descricao" 
            class="form-control" 
            placeholder="Descrição da despesa" 
            autocomplete="off" 
            required
          >
          <!-- Container de sugestões será injetado aqui -->
        </div>
        
        <!-- Campo 5: Categoria (com autocomplete) -->
        <div class="form-group">
          <label for="expenseCategory">Categoria:</label>
          <input 
            type="text" 
            id="expenseCategory" 
            name="categoria" 
            class="form-control" 
            placeholder="Digite uma categoria" 
            autocomplete="off" 
            required
          >
          <!-- Container de sugestões será injetado aqui -->
        </div>
        
        <!-- Campo 6: Orçamento (data-chave) -->
        <div class="form-group">
          <label for="expenseBudget">Orçamento (data-chave):</label>
          <input 
            type="date" 
            id="expenseBudget" 
            name="orcamento" 
            class="form-control" 
            required
          >
        </div>
        
        <!-- Feedback de Erro/Sucesso -->
        <div id="modalFeedback" class="modal-feedback" style="display: none;"></div>
        
        <!-- Botões de Ação -->
        <div class="form-actions">
          <button type="reset" class="button warning">
            Limpar
          </button>
          <button type="submit" class="button success">
            Salvar
          </button>
        </div>
        
      </fieldset>
    </form>
  </div>
</div>
```

### Hierarquia de Elementos

```
#entryModal (overlay)
├── .entry-modal__content (card)
│   ├── #closeEntryModal (×)
│   ├── .entry-modal__title (h3)
│   └── #expenseForm (form)
│       ├── .form-group (data)
│       ├── .form-group (conta) + #accountSuggestions
│       ├── .valor-toggle-group
│       │   └── .valor-toggle-container
│       │       ├── #expenseSignBtn (toggle)
│       │       ├── #expenseValue (input)
│       │       └── #expenseSignValue (hidden)
│       ├── .form-group (descrição) + #descSuggestions
│       ├── .form-group (categoria) + #catSuggestions
│       ├── .form-group (orçamento)
│       ├── #modalFeedback (feedback)
│       └── .form-actions
│           ├── button[type=reset]
│           └── button[type=submit]
```

---

## 📊 Tipos e Interfaces

### EntryFormData
Dados do formulário após validação.

```typescript
interface EntryFormData {
  data: string;           // "31/10/2025" (formatado)
  conta: string;          // "Nubank"
  valor: number;          // 123.45
  sinal: string;          // "−" (despesa) ou "+" (receita)
  descricao: string;      // "Compra no supermercado"
  categoria: string;      // "Alimentação"
  orcamento: string;      // "31/10/2025" (data-chave)
}
```

### SheetEntry
Entrada da planilha (histórico).

```typescript
interface SheetEntry {
  rowIndex: number;       // Índice da linha
  data: string;           // Data da entrada
  conta: string;          // Conta
  valor: number;          // Valor
  descricao: string;      // Descrição
  categoria: string;      // Categoria
  tipo: string;           // Tipo (receita/despesa)
}
```

### EntryPayload
Payload enviado para backend.

```typescript
interface EntryPayload {
  data: string;           // Data formatada
  conta: string;
  valor: number;
  descricao: string;
  categoria: string;
  tipo: string;           // "receita" ou "despesa"
  orcamento: string;
}
```

### OnEntryAddedCallback
Callback executado ao adicionar entrada.

```typescript
type OnEntryAddedCallback = (entry: EntryFormData) => void | Promise<void>;
```

**Exemplo:**
```typescript
const callback: OnEntryAddedCallback = (entry) => {
  console.log('Entrada adicionada:', entry);
  // Atualizar UI, recarregar dados, etc
};

const modal = await EntryModal.getInstance(callback);
```

---

## ⚙️ Funcionalidades Principais

### 1. Inicialização

```typescript
async init(callback?: OnEntryAddedCallback): Promise<void> {
  // 1. Injeta template no body
  document.body.insertAdjacentHTML('beforeend', this.getTemplate());
  
  // 2. Obtém referências aos elementos
  this.modal = document.getElementById('entryModal');
  this.form = document.getElementById('expenseForm');
  
  // 3. Configura event listeners
  this.setupEventListeners();
  
  // 4. Carrega dados de autocomplete
  await this.loadAutocompleteData();
}
```

**Fluxo:**
```
init()
  ├─ Injeta HTML no body
  ├─ Obtém referências DOM
  ├─ Configura listeners
  │  ├─ Botão fechar
  │  ├─ Click outside
  │  ├─ ESC key
  │  ├─ Toggle sinal
  │  └─ Form submit
  ├─ Carrega dados
  │  ├─ GET /get-sheet-entries (contas, descrições)
  │  └─ GET /get-sheet-categories (categorias)
  └─ Inicializa autocompletes
     ├─ Categoria
     ├─ Descrição
     └─ Conta
```

### 2. Abrir/Fechar Modal

```typescript
open(): void {
  // Seta data/hora atual
  this.setDefaultDateTime();
  
  // Mostra modal com flex
  if (this.modal) {
    this.modal.style.display = 'flex';
    this.modal.setAttribute('aria-hidden', 'false');
    
    // Focus no primeiro campo
    const firstInput = this.form?.querySelector('input');
    firstInput?.focus();
  }
}

close(): void {
  // Esconde modal
  if (this.modal) {
    this.modal.style.display = 'none';
    this.modal.setAttribute('aria-hidden', 'true');
    
    // Reseta formulário
    this.form?.reset();
  }
}
```

### 3. Toggle de Sinal (−/+)

```typescript
toggleSign(): void {
  // Obtém estado atual
  const signBtn = document.getElementById('expenseSignBtn');
  const isExpense = signBtn?.textContent?.trim() === '−';
  
  // Alterna para o oposto
  this.setSignState(!isExpense);
}

setSignState(isExpense: boolean): void {
  const signBtn = document.getElementById('expenseSignBtn');
  const signValue = document.getElementById('expenseSignValue') as HTMLInputElement;
  
  if (isExpense) {
    // Modo Despesa
    signBtn.textContent = '−';
    signBtn.classList.add('entry-toggle--expense');
    signBtn.classList.remove('entry-toggle--income');
    signValue.value = '−';
  } else {
    // Modo Receita
    signBtn.textContent = '+';
    signBtn.classList.add('entry-toggle--income');
    signBtn.classList.remove('entry-toggle--expense');
    signValue.value = '+';
  }
}
```

**Visual:**
```
Modo Despesa (Padrão)        Modo Receita (Clicado)
┌──────────────────┐        ┌──────────────────┐
│ [−] [123.45]     │        │ [+] [123.45]     │
└──────────────────┘        └──────────────────┘
```

### 4. Validação de Formulário

```typescript
private validateForm(formData: FormData): boolean {
  // 1. Valida que todos os campos obrigatórios estão preenchidos
  const data = formData.get('data');
  const conta = formData.get('conta');
  const valor = formData.get('valor');
  const descricao = formData.get('descricao');
  const categoria = formData.get('categoria');
  const orcamento = formData.get('orcamento');
  
  if (!data || !conta || !valor || !descricao || !categoria || !orcamento) {
    this.showFeedback('Preencha todos os campos obrigatórios', 'error');
    return false;
  }
  
  // 2. Valida que o valor é positivo
  const numValue = parseFloat(valor as string);
  if (numValue <= 0) {
    this.showFeedback('Valor deve ser maior que zero', 'error');
    return false;
  }
  
  return true;
}
```

### 5. Envio de Dados

```typescript
async handleSubmit(e: SubmitEvent): Promise<void> {
  e.preventDefault();
  
  const formData = new FormData(this.form);
  
  // 1. Valida
  if (!this.validateForm(formData)) return;
  
  // 2. Monta payload
  const payload: EntryPayload = {
    data: this.formatDateTimeLocal(formData.get('data') as string),
    conta: formData.get('conta') as string,
    valor: parseFloat(formData.get('valor') as string),
    descricao: formData.get('descricao') as string,
    categoria: formData.get('categoria') as string,
    tipo: formData.get('sinal') === '−' ? 'despesa' : 'receita',
    orcamento: this.formatDate(formData.get('orcamento') as string),
  };
  
  // 3. Envia para backend
  try {
    this.showFeedback('Salvando...', 'info');
    
    const response = await fetch(`${config.pocketbaseUrl}/append-entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pb.authStore.token}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }
    
    // 4. Sucesso
    this.showFeedback('✅ Lançamento adicionado com sucesso!', 'success');
    
    // 5. Executa callback
    if (this.callback) {
      await this.callback(payload as EntryFormData);
    }
    
    // 6. Fecha modal
    setTimeout(() => this.close(), 1500);
    
  } catch (error) {
    this.showFeedback(`❌ Erro: ${error.message}`, 'error');
  }
}
```

**Fluxo de Envio:**
```
1. handleSubmit(e)
   ├─ e.preventDefault() → cancela comportamento padrão
   ├─ Coleta dados do formulário
   ├─ Valida campos
   ├─ Formata data/hora
   ├─ Monta payload JSON
   └─ Envia para backend

2. Backend processa
   ├─ Valida autenticação
   ├─ Obtém sheet_id do usuário
   ├─ Chama Google Sheets API
   └─ Insere linha na aba "Lançamentos"

3. Backend retorna resposta
   ├─ 200 OK → Sucesso
   └─ 4xx/5xx → Erro

4. Frontend tratando resultado
   ├─ Sucesso → Mostra feedback
   ├─ Executa callback
   └─ Fecha modal
```

---

## 🔄 Fluxos de Dados

### Fluxo 1: Carregamento de Dados de Autocomplete

```typescript
async loadAutocompleteData(): Promise<void> {
  try {
    // 1. Busca entradas históricas
    const entriesUrl = `${config.pocketbaseUrl}/get-sheet-entries`;
    const responseEntries = await fetch(entriesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${pb.authStore.token}`,
      },
    });
    
    if (responseEntries.ok) {
      const data = await responseEntries.json();
      this.entries = data?.entries || [];
      
      // Extrai contas únicas
      this.accounts = [...new Set(
        this.entries
          .map(e => e.conta)
          .filter(c => c && c.trim())
      )].sort();
      
      // Extrai descrições únicas
      this.descriptions = [...new Set(
        this.entries
          .map(e => e.descricao)
          .filter(d => d && d.trim())
      )].sort();
    }
    
    // 2. Busca categorias
    const categoriesUrl = `${config.pocketbaseUrl}/get-sheet-categories`;
    const responseCat = await fetch(categoriesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${pb.authStore.token}`,
      },
    });
    
    if (responseCat.ok) {
      const catData = await responseCat.json();
      this.categories = catData?.categories || [];
    }
    
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}
```

**Dados Carregados:**
- ✅ `this.accounts` - Lista de contas únicas do histórico
- ✅ `this.descriptions` - Lista de descrições únicas do histórico
- ✅ `this.categories` - Lista de categorias da planilha
- ✅ `this.entries` - Histórico completo (para auto-preenchimento)

### Fluxo 2: Autocomplete na Digitação

```
Usuário começa a digitar em "Descrição"
  ↓
input event disparado
  ↓
showSuggestions(input, container, suggestions)
  ├─ Obtém valor digitado (query)
  ├─ Filtra sugestões que correspondem
  ├─ Renderiza container com items
  └─ Usuário pode clicar em um item
     ├─ Preenche o campo com a sugestão
     ├─ Auto-preenche categoria se possível
     └─ Oculta container de sugestões
```

**Exemplo de Filtragem:**
```typescript
private showSuggestions(
  input: HTMLInputElement,
  container: HTMLDivElement,
  suggestions: string[],
  onSelect?: (value: string) => void
): void {
  const query = input.value.trim().toLowerCase();
  
  // Filtra: case-insensitive, começa com a query
  const filtered = suggestions.filter(s =>
    s.toLowerCase().startsWith(query)
  );
  
  // Renderiza até 10 sugestões
  container.innerHTML = '';
  
  filtered.slice(0, 10).forEach(s => {
    const item = document.createElement('div');
    item.textContent = s;
    item.addEventListener('click', () => {
      input.value = s;
      container.style.display = 'none';
      onSelect?.(s);
    });
    container.appendChild(item);
  });
  
  container.style.display = filtered.length > 0 ? 'block' : 'none';
}
```

---

## 🎯 Autocomplete System

### Sistema de 3 Autocompletes

#### 1. Autocomplete de Conta

```typescript
private setupAccountAutocomplete(): void {
  const input = document.getElementById('expenseAccount') as HTMLInputElement;
  const container = this.ensureSuggestionsContainer('accountSuggestions', input);
  
  // Mostra sugestões quando clica (sem filtro)
  input.addEventListener('focus', () => {
    if (this.accounts.length > 0 && !input.value.trim()) {
      this.showAllSuggestions(input, container, this.accounts);
    }
  });
  
  // Filtra enquanto digita
  input.addEventListener('input', () => {
    this.showSuggestions(input, container, this.accounts);
  });
  
  // Oculta ao perder foco
  input.addEventListener('blur', () => {
    setTimeout(() => container.style.display = 'none', 200);
  });
}
```

**Comportamento:**
- Ao focar no campo vazio: mostra todas as contas
- Enquanto digita: filtra contas por correspondência
- Ao clicar em sugestão: preenche o campo
- Ao perder foco: oculta sugestões

#### 2. Autocomplete de Descrição com Auto-preenchimento de Categoria

```typescript
private setupDescriptionAutocomplete(): void {
  const input = document.getElementById('expenseDescription') as HTMLInputElement;
  const container = this.ensureSuggestionsContainer('descSuggestions', input);
  
  input.addEventListener('focus', () => {
    if (this.descriptions.length > 0 && !input.value.trim()) {
      // Mostra com callback para auto-preencher categoria
      this.showAllSuggestions(input, container, this.descriptions, (value) => {
        this.autoFillCategoryFromDescription(value);
      });
    }
  });
  
  input.addEventListener('input', () => {
    this.showSuggestions(input, container, this.descriptions, (value) => {
      this.autoFillCategoryFromDescription(value);
    });
  });
}

private autoFillCategoryFromDescription(description: string): void {
  // Busca entrada histórica com essa descrição
  const entry = this.entries.find(e =>
    e.descricao?.toLowerCase() === description.toLowerCase()
  );
  
  // Se encontrou, preenche categoria automaticamente
  if (entry?.categoria) {
    const categoryInput = document.getElementById('expenseCategory') as HTMLInputElement;
    categoryInput.value = entry.categoria;
  }
}
```

**Inteligência:**
- Usuário seleciona descrição
- Sistema encontra entrada histórica com essa descrição
- Auto-preenche a categoria associada
- Economia de digitação!

#### 3. Autocomplete de Categoria

```typescript
private setupCategoryAutocomplete(): void {
  const input = document.getElementById('expenseCategory') as HTMLInputElement;
  const container = this.ensureSuggestionsContainer('catSuggestions', input);
  
  // Mostra todas as categorias da planilha
  input.addEventListener('focus', () => {
    if (this.categories.length > 0) {
      this.showAllSuggestions(input, container, this.categories);
    }
  });
  
  // Filtra enquanto digita
  input.addEventListener('input', () => {
    this.showSuggestions(input, container, this.categories);
  });
}
```

**Fonte de Dados:**
- Categorias vêm diretamente da aba "Categorias" da planilha
- Mantido em sincronia com backend
- Usuário pode digitar categoria nova (não listada)

### Container de Sugestões

```typescript
private ensureSuggestionsContainer(id: string, input: HTMLInputElement): HTMLDivElement {
  let container = document.getElementById(id) as HTMLDivElement;
  
  if (!container) {
    // Cria container dinamicamente
    container = document.createElement('div');
    container.id = id;
    container.classList.add('entry-modal__suggestions');
    container.setAttribute('role', 'listbox');
    
    // Insere logo após o input (no mesmo div parent)
    const parent = input.parentElement;
    if (parent) {
      parent.style.position = parent.style.position || 'relative';
      parent.appendChild(container);
    }
  }
  
  return container;
}
```

**HTML Gerado Dinamicamente:**
```html
<div class="form-group">
  <label for="expenseAccount">Conta:</label>
  <input id="expenseAccount" ...>
  
  <!-- Container injetado aqui -->
  <div 
    id="accountSuggestions" 
    class="entry-modal__suggestions" 
    role="listbox"
  >
    <div role="option">Nubank</div>
    <div role="option">Bradesco</div>
    <div role="option">Itaú</div>
  </div>
</div>
```

---

## 🔌 API e Endpoints

### 1. GET `/get-sheet-entries` - Listar Entradas

**Requisição:**
```http
GET /get-sheet-entries HTTP/1.1
Authorization: Bearer {USER_TOKEN}
Content-Type: application/json
```

**Resposta (200):**
```json
{
  "entries": [
    {
      "rowIndex": 1,
      "data": "31/10/2025",
      "conta": "Nubank",
      "valor": 123.45,
      "descricao": "Compra no supermercado",
      "categoria": "Alimentação",
      "tipo": "despesa"
    },
    {
      "rowIndex": 2,
      "data": "30/10/2025",
      "conta": "Bradesco",
      "valor": 5000.00,
      "descricao": "Salário",
      "categoria": "Salário",
      "tipo": "receita"
    }
  ]
}
```

**Uso no Modal:**
```typescript
// Extrai dados para autocomplete
this.entries = data.entries;
this.accounts = [...new Set(entries.map(e => e.conta))];
this.descriptions = [...new Set(entries.map(e => e.descricao))];
```

---

### 2. GET `/get-sheet-categories` - Listar Categorias

**Requisição:**
```http
GET /get-sheet-categories HTTP/1.1
Authorization: Bearer {USER_TOKEN}
```

**Resposta (200):**
```json
{
  "success": true,
  "categories": [
    "Salário",
    "13º salário",
    "Férias",
    "Aluguel",
    "Condomínio",
    "Luz",
    "Água",
    "Alimentação",
    "Transporte",
    "Saúde",
    "Lazer",
    "Educação",
    "Assinaturas"
  ]
}
```

**Uso no Modal:**
```typescript
// Popula autocomplete de categoria
this.categories = catData.categories;
```

---

### 3. POST `/append-entry` - Adicionar Lançamento

**Requisição:**
```http
POST /append-entry HTTP/1.1
Authorization: Bearer {USER_TOKEN}
Content-Type: application/json

{
  "data": "31/10/2025 14:41",
  "conta": "Nubank",
  "valor": 123.45,
  "descricao": "Compra no supermercado",
  "categoria": "Alimentação",
  "tipo": "despesa",
  "orcamento": "31/10/2025"
}
```

**Resposta Sucesso (200):**
```json
{
  "success": true,
  "message": "Lançamento adicionado com sucesso",
  "rowIndex": 42
}
```

**Resposta Erro (400):**
```json
{
  "error": "Campo obrigatório ausente: categoria"
}
```

**Resposta Erro (401):**
```json
{
  "error": "Usuário não autenticado"
}
```

**Fluxo no Modal:**
```typescript
const response = await fetch(`${config.pocketbaseUrl}/append-entry`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${pb.authStore.token}`,
  },
  body: JSON.stringify(payload),
});

if (response.ok) {
  // Sucesso
  showFeedback('✅ Lançamento adicionado com sucesso!');
  this.callback?.(entry);
  setTimeout(() => this.close(), 1500);
} else {
  // Erro
  const error = await response.json();
  showFeedback(`❌ Erro: ${error.error}`);
}
```

---

## 🎨 Estilos CSS

### Arquivo: `modal-entry.css`

#### Modal Overlay

```css
#entryModal {
  position: fixed;
  inset: 60px 0 0 0;  /* top:60px, left:0, right:0, bottom:0 */
  width: 100%;
  height: calc(100% - 60px);
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);  /* Fundo escurecido */
  z-index: 1000;
  padding: 1rem;
  box-sizing: border-box;
}

#entryModal[style*="display: flex"] {
  /* Quando aberto */
  display: flex !important;
}
```

#### Modal Content (Card)

```css
.modal-content.solution-card {
  background: white;
  padding: 1.5rem;
  border-radius: 4px;
  max-width: 600px;
  width: 90%;
  position: relative;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
```

#### Botão de Fechar

```css
#closeEntryModal {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 1002;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.15s ease, transform 0.08s ease;
}

#closeEntryModal:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

#closeEntryModal:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}
```

#### Valor com Toggle

```css
.valor-toggle-group {
  margin-bottom: 1rem;
}

.valor-toggle-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

#expenseSignBtn {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  font-size: 1.25rem;
  font-weight: bold;
  transition: all 0.2s ease;
}

#expenseSignBtn.entry-toggle--expense {
  color: #e74c3c;  /* Vermelho para despesa */
}

#expenseSignBtn.entry-toggle--income {
  color: #27ae60;  /* Verde para receita */
}

#expenseValue {
  flex: 1;
  min-width: 0;
}
```

#### Container de Sugestões

```css
.entry-modal__suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1001;
  display: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.entry-modal__suggestion {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.entry-modal__suggestion:hover {
  background-color: #f0f0f0;
}

.entry-modal__suggestion[aria-selected="true"] {
  background-color: #e8f4f8;
  font-weight: 600;
}
```

#### Responsividade

```css
@media (max-width: 768px) {
  #entryModal {
    inset: 0;  /* Cobre toda a tela */
    z-index: 9999;  /* Acima de tudo */
  }
  
  .modal-content.solution-card {
    max-height: 95vh !important;
    width: 95%;
  }
}
```

---

## 💡 Exemplos de Uso

### Inicialização no Dashboard

```typescript
// src/dashboard/dashboard.ts

import { EntryModal } from '../components/entry-modal';

async function initEntryModal(): Promise<void> {
  const openBtn = document.getElementById('openEntryModal');
  
  if (!openBtn) return;
  
  // Inicializa modal
  const modal = await EntryModal.getInstance(
    // Callback ao adicionar
    async (entry) => {
      console.log('✅ Entrada adicionada:', entry);
      
      // Recarrega dados do dashboard
      await loadDashboardData();
    }
  );
  
  // Abre ao clicar no botão FAB
  openBtn.addEventListener('click', () => {
    modal.open();
  });
}

// Inicializa quando DOM está pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEntryModal);
} else {
  initEntryModal();
}
```

### Fluxo Completo do Usuário

```
1. Usuário clica botão FAB (+)
   └─ modal.open()
   
2. Modal abre com dados precarregados
   ├─ Data/hora atual já preenchida
   ├─ Conta, descrição, categoria com autocomplete
   └─ Sinal padrão em "despesa" (−)
   
3. Usuário digita no campo "Descrição"
   ├─ Sistema mostra sugestões
   ├─ Usuário seleciona uma sugestão
   ├─ Campo é preenchido
   └─ Categoria é auto-preenchida se encontrada
   
4. Usuário alterna sinal para receita (+)
   └─ Botão muda visualmente (verde)
   
5. Usuário preenche/confirma campos restantes
   ├─ Valor
   ├─ Categoria (se não foi auto-preenchida)
   └─ Orçamento (data-chave)
   
6. Usuário clica "Salvar"
   ├─ Validação de formulário
   ├─ Requisição POST ao backend
   ├─ Backend insere na planilha
   ├─ Backend retorna sucesso
   ├─ Modal mostra feedback "✅ Sucesso"
   ├─ Executa callback (recarrega dashboard)
   └─ Fecha modal após 1.5s
   
7. Dashboard atualizado com nova entrada
```

### Tratamento de Erros

```typescript
// Campo obrigatório faltando
try {
  await fetch('/append-entry', {
    method: 'POST',
    body: JSON.stringify({
      // categoria faltando
      data: "31/10/2025",
      conta: "Nubank",
      valor: 123.45,
      // categoria: "Alimentação",  ← FALTANDO
      tipo: "despesa",
    }),
  });
} catch (error) {
  // Backend retorna 400
  // Modal mostra: "❌ Erro: Campo obrigatório ausente: categoria"
}
```

---

## 🔐 Segurança

### Validação Frontend

```typescript
// 1. Campos obrigatórios
if (!data || !conta || !valor || !descricao || !categoria || !orcamento) {
  showFeedback('Preencha todos os campos obrigatórios', 'error');
  return;
}

// 2. Valor positivo
if (parseFloat(valor) <= 0) {
  showFeedback('Valor deve ser maior que zero', 'error');
  return;
}

// 3. Formato de data válido
const dateObj = new Date(data);
if (isNaN(dateObj.getTime())) {
  showFeedback('Data inválida', 'error');
  return;
}
```

### Validação Backend

- ✅ Autenticação obrigatória
- ✅ Autorização (apenas usuário autenticado)
- ✅ Validação de schema
- ✅ Proteção contra SQL injection (via ORM PocketBase)
- ✅ Rate limiting (recomendado)

---

## 📚 Referências

- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [ARIA: listbox role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/listbox_role)
- [HTML datetime-local input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local)

---

**Versão:** 1.0  
**Última atualização:** 03 de Novembro de 2025  
**Autores:** GitHub Copilot, Edson Candido
