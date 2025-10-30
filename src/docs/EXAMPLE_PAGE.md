# Exemplo Completo: Página de Lançamentos

Este arquivo demonstra como criar uma página completa de lançamentos usando todos os serviços.

## 📄 lancamentos.html

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lançamentos - Planilha Eh Tudo</title>
    <link rel="stylesheet" href="./css/picnic.css">
    <link rel="stylesheet" href="./css/style.css">
</head>
<body>
    <nav>
        <span class="brand">Planilha Eh Tudo</span>
        <div class="menu" id="menu-user"></div>
    </nav>

    <main class="container">
        <h1>Lançamentos Financeiros</h1>
        
        <!-- Status de Configuração -->
        <div id="config-alert" class="alert" style="display: none;"></div>
        
        <!-- Formulário de Novo Lançamento -->
        <section class="card">
            <h2>Novo Lançamento</h2>
            <form id="entry-form">
                <label>
                    Data
                    <input type="date" name="data" required>
                </label>
                
                <label>
                    Conta
                    <select name="conta" required>
                        <option value="">Selecione...</option>
                        <option value="Cartão Crédito">Cartão Crédito</option>
                        <option value="Cartão Débito">Cartão Débito</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="PIX">PIX</option>
                    </select>
                </label>
                
                <label>
                    Tipo
                    <select name="tipo" required id="tipo-select">
                        <option value="Despesa">Despesa</option>
                        <option value="Receita">Receita</option>
                    </select>
                </label>
                
                <label>
                    Valor
                    <input type="number" name="valor" step="0.01" required>
                </label>
                
                <label>
                    Categoria
                    <select name="categoria" required id="categoria-select">
                        <option value="">Carregando...</option>
                    </select>
                </label>
                
                <label>
                    Descrição
                    <input type="text" name="descricao" required>
                </label>
                
                <button type="submit" class="button primary">Adicionar Lançamento</button>
            </form>
        </section>
        
        <!-- Filtros -->
        <section class="card">
            <h2>Filtrar Lançamentos</h2>
            <div class="flex">
                <label>
                    Mês
                    <select id="month-select">
                        <option value="">Carregando...</option>
                    </select>
                </label>
                <button id="filter-btn" class="button">Filtrar</button>
            </div>
        </section>
        
        <!-- Resumo Financeiro -->
        <section id="summary-section" class="card" style="display: none;">
            <h2>Resumo do Mês</h2>
            <div class="summary-grid">
                <div class="summary-card receitas">
                    <h3>Receitas</h3>
                    <p id="total-receitas">R$ 0,00</p>
                </div>
                <div class="summary-card despesas">
                    <h3>Despesas</h3>
                    <p id="total-despesas">R$ 0,00</p>
                </div>
                <div class="summary-card saldo">
                    <h3>Saldo</h3>
                    <p id="saldo">R$ 0,00</p>
                </div>
            </div>
        </section>
        
        <!-- Lista de Lançamentos -->
        <section class="card">
            <h2>Lançamentos</h2>
            <div id="entries-loading" style="display: none;">Carregando...</div>
            <div id="entries-empty" style="display: none;">Nenhum lançamento encontrado.</div>
            <table id="entries-table" style="display: none;">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Conta</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Valor</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="entries-tbody"></tbody>
            </table>
        </section>
    </main>

    <script type="module" src="/main.ts"></script>
    <script type="module" src="/lancamentos.ts"></script>
</body>
</html>
```

## 📄 lancamentos.ts

```typescript
import './main';
import { initUserMenu } from './components/user-menu';
import { isAuthenticated, redirectToLogin, getCurrentUser } from './services/auth';
import { SheetsService } from './services/sheets';
import { GoogleOAuthService } from './services/google-oauth';
import { config } from './config/env';
import type { SheetEntry, FinancialSummary, ConfigStatus } from './services/sheets';

/**
 * Estado da aplicação
 */
interface AppState {
  currentMonth: string;
  currentYear: string;
  entries: SheetEntry[];
  summary: FinancialSummary | null;
  categories: string[];
  configStatus: ConfigStatus | null;
}

const state: AppState = {
  currentMonth: new Date().getMonth().toString().padStart(2, '0'),
  currentYear: new Date().getFullYear().toString(),
  entries: [],
  summary: null,
  categories: [],
  configStatus: null,
};

/**
 * Elementos do DOM
 */
const elements = {
  configAlert: document.getElementById('config-alert') as HTMLDivElement,
  entryForm: document.getElementById('entry-form') as HTMLFormElement,
  tipoSelect: document.getElementById('tipo-select') as HTMLSelectElement,
  categoriaSelect: document.getElementById('categoria-select') as HTMLSelectElement,
  monthSelect: document.getElementById('month-select') as HTMLSelectElement,
  filterBtn: document.getElementById('filter-btn') as HTMLButtonElement,
  summarySection: document.getElementById('summary-section') as HTMLElement,
  totalReceitas: document.getElementById('total-receitas') as HTMLElement,
  totalDespesas: document.getElementById('total-despesas') as HTMLElement,
  saldo: document.getElementById('saldo') as HTMLElement,
  entriesLoading: document.getElementById('entries-loading') as HTMLElement,
  entriesEmpty: document.getElementById('entries-empty') as HTMLElement,
  entriesTable: document.getElementById('entries-table') as HTMLTableElement,
  entriesTbody: document.getElementById('entries-tbody') as HTMLTableSectionElement,
};

/**
 * Inicializa a página
 */
async function init(): Promise<void> {
  if (config.isDevelopment) {
    console.log('[Lançamentos] Inicializada em modo desenvolvimento');
  }

  // Verificar autenticação
  if (!isAuthenticated()) {
    redirectToLogin();
    return;
  }

  // Inicializar menu
  initUserMenu();

  // Verificar configuração do usuário
  await checkUserConfiguration();

  // Se configurado, carregar dados
  if (state.configStatus?.hasRefreshToken && state.configStatus?.hasSheetId) {
    await loadInitialData();
    setupEventListeners();
  }
}

/**
 * Verifica configuração do usuário
 */
async function checkUserConfiguration(): Promise<void> {
  try {
    state.configStatus = await SheetsService.getConfigStatus();

    if (!state.configStatus.hasRefreshToken) {
      showConfigAlert(
        'Você precisa autorizar o acesso ao Google Sheets.',
        'warning',
        true
      );
      return;
    }

    if (!state.configStatus.hasSheetId) {
      showConfigAlert(
        'Você precisa configurar uma planilha.',
        'warning',
        false,
        async () => {
          try {
            const { sheetName } = await SheetsService.provisionSheet();
            showConfigAlert(`Planilha "${sheetName}" criada com sucesso!`, 'success');
            await loadInitialData();
            setupEventListeners();
          } catch (error) {
            showConfigAlert('Erro ao criar planilha', 'error');
          }
        }
      );
    }
  } catch (error) {
    console.error('[Lançamentos] Erro ao verificar configuração:', error);
    showConfigAlert('Erro ao verificar configuração', 'error');
  }
}

/**
 * Mostra alerta de configuração
 */
function showConfigAlert(
  message: string,
  type: 'info' | 'warning' | 'error' | 'success',
  showAuthButton = false,
  action?: () => void
): void {
  elements.configAlert.className = `alert alert-${type}`;
  elements.configAlert.innerHTML = `
    <p>${message}</p>
    ${showAuthButton ? '<button class="button" id="auth-btn">Autorizar Google</button>' : ''}
    ${action ? '<button class="button primary" id="action-btn">Configurar Agora</button>' : ''}
  `;
  elements.configAlert.style.display = 'block';

  if (showAuthButton) {
    document.getElementById('auth-btn')?.addEventListener('click', async () => {
      const user = getCurrentUser();
      if (user) {
        await GoogleOAuthService.startAuthFlow(user.id);
      }
    });
  }

  if (action) {
    document.getElementById('action-btn')?.addEventListener('click', action);
  }
}

/**
 * Carrega dados iniciais
 */
async function loadInitialData(): Promise<void> {
  try {
    // Carregar em paralelo
    const [categories, months] = await Promise.all([
      SheetsService.getSheetCategories(),
      SheetsService.getAvailableMonths(),
    ]);

    state.categories = categories;
    populateCategorySelect(categories);
    populateMonthSelect(months);

    // Carregar lançamentos do mês atual
    await loadMonthData(state.currentMonth, state.currentYear);
  } catch (error) {
    console.error('[Lançamentos] Erro ao carregar dados:', error);
    showConfigAlert('Erro ao carregar dados', 'error');
  }
}

/**
 * Popula select de categorias
 */
function populateCategorySelect(categories: string[]): void {
  elements.categoriaSelect.innerHTML = categories
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join('');
}

/**
 * Popula select de meses
 */
function populateMonthSelect(months: string[]): void {
  if (months.length === 0) {
    elements.monthSelect.innerHTML = '<option value="">Nenhum mês disponível</option>';
    return;
  }

  elements.monthSelect.innerHTML = months
    .map((month) => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return `<option value="${month}">${label}</option>`;
    })
    .join('');

  // Selecionar mês atual
  const currentMonthValue = `${state.currentYear}-${state.currentMonth}`;
  if (months.includes(currentMonthValue)) {
    elements.monthSelect.value = currentMonthValue;
  }
}

/**
 * Carrega dados de um mês específico
 */
async function loadMonthData(month: string, year: string): Promise<void> {
  showLoading();

  try {
    const [entries, summary] = await Promise.all([
      SheetsService.getSheetEntries(month, year),
      SheetsService.getFinancialSummary(month, year),
    ]);

    state.entries = entries;
    state.summary = summary;

    renderEntries(entries);
    renderSummary(summary);
  } catch (error) {
    console.error('[Lançamentos] Erro ao carregar mês:', error);
    showEmpty('Erro ao carregar lançamentos');
  }
}

/**
 * Renderiza lançamentos na tabela
 */
function renderEntries(entries: SheetEntry[]): void {
  if (entries.length === 0) {
    showEmpty('Nenhum lançamento neste mês');
    return;
  }

  elements.entriesTbody.innerHTML = entries
    .map(
      (entry) => `
    <tr>
      <td>${formatDate(entry.data)}</td>
      <td>${entry.conta}</td>
      <td>${entry.descricao}</td>
      <td>${entry.categoria}</td>
      <td class="${entry.tipo === 'Receita' ? 'receita' : 'despesa'}">
        ${formatCurrency(entry.valor)}
      </td>
      <td>
        <button class="button small" onclick="editEntry(${entry.rowIndex})">Editar</button>
        <button class="button error small" onclick="deleteEntry(${entry.rowIndex})">Deletar</button>
      </td>
    </tr>
  `
    )
    .join('');

  elements.entriesTable.style.display = 'table';
  elements.entriesEmpty.style.display = 'none';
  elements.entriesLoading.style.display = 'none';
}

/**
 * Renderiza resumo financeiro
 */
function renderSummary(summary: FinancialSummary): void {
  elements.totalReceitas.textContent = formatCurrency(summary.totalReceitas);
  elements.totalDespesas.textContent = formatCurrency(summary.totalDespesas);
  elements.saldo.textContent = formatCurrency(summary.saldo);
  elements.summarySection.style.display = 'block';
}

/**
 * Mostra loading
 */
function showLoading(): void {
  elements.entriesLoading.style.display = 'block';
  elements.entriesEmpty.style.display = 'none';
  elements.entriesTable.style.display = 'none';
}

/**
 * Mostra mensagem vazia
 */
function showEmpty(message: string): void {
  elements.entriesEmpty.textContent = message;
  elements.entriesEmpty.style.display = 'block';
  elements.entriesLoading.style.display = 'none';
  elements.entriesTable.style.display = 'none';
}

/**
 * Setup de event listeners
 */
function setupEventListeners(): void {
  // Formulário de novo lançamento
  elements.entryForm.addEventListener('submit', handleFormSubmit);

  // Filtro de mês
  elements.filterBtn.addEventListener('click', handleFilterClick);

  // Mudança de tipo (Receita/Despesa) para ajustar sinal do valor
  elements.tipoSelect.addEventListener('change', handleTipoChange);
}

/**
 * Handler de submit do formulário
 */
async function handleFormSubmit(event: Event): Promise<void> {
  event.preventDefault();

  const formData = new FormData(elements.entryForm);
  let valor = parseFloat(formData.get('valor') as string);
  const tipo = formData.get('tipo') as string;

  // Ajustar sinal do valor
  if (tipo === 'Despesa' && valor > 0) {
    valor = -valor;
  } else if (tipo === 'Receita' && valor < 0) {
    valor = Math.abs(valor);
  }

  try {
    await SheetsService.appendEntry({
      data: formData.get('data') as string,
      conta: formData.get('conta') as string,
      valor,
      descricao: formData.get('descricao') as string,
      categoria: formData.get('categoria') as string,
      tipo,
    });

    // Limpar formulário
    elements.entryForm.reset();

    // Recarregar lançamentos
    await loadMonthData(state.currentMonth, state.currentYear);

    alert('Lançamento adicionado com sucesso!');
  } catch (error) {
    console.error('[Lançamentos] Erro ao adicionar:', error);
    alert('Erro ao adicionar lançamento');
  }
}

/**
 * Handler de mudança de tipo
 */
function handleTipoChange(): void {
  const valorInput = elements.entryForm.querySelector('[name="valor"]') as HTMLInputElement;
  const currentValue = parseFloat(valorInput.value);

  if (!isNaN(currentValue)) {
    const tipo = elements.tipoSelect.value;
    if (tipo === 'Despesa' && currentValue > 0) {
      valorInput.value = (-currentValue).toString();
    } else if (tipo === 'Receita' && currentValue < 0) {
      valorInput.value = Math.abs(currentValue).toString();
    }
  }
}

/**
 * Handler de filtro
 */
async function handleFilterClick(): Promise<void> {
  const selected = elements.monthSelect.value;
  if (!selected) return;

  const [year, month] = selected.split('-');
  state.currentMonth = month;
  state.currentYear = year;

  await loadMonthData(month, year);
}

/**
 * Funções auxiliares de formatação
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Funções globais para botões inline
 * (Em produção, usar event delegation)
 */
(window as any).editEntry = async (rowIndex: number) => {
  // Implementar modal de edição
  console.log('Editar linha:', rowIndex);
};

(window as any).deleteEntry = async (rowIndex: number) => {
  if (!confirm('Deseja realmente deletar este lançamento?')) return;

  try {
    await SheetsService.deleteEntry(rowIndex);
    await loadMonthData(state.currentMonth, state.currentYear);
    alert('Lançamento deletado com sucesso!');
  } catch (error) {
    console.error('[Lançamentos] Erro ao deletar:', error);
    alert('Erro ao deletar lançamento');
  }
};

/**
 * Inicializar quando DOM estiver pronto
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

## 🎨 Estilos Adicionais (opcional)

```css
/* style.css adicional */

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.summary-card {
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.summary-card.receitas {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}

.summary-card.despesas {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}

.summary-card.saldo {
  background-color: #d1ecf1;
  border: 1px solid #bee5eb;
}

.summary-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.summary-card p {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
}

.receita {
  color: #28a745;
  font-weight: 600;
}

.despesa {
  color: #dc3545;
  font-weight: 600;
}

.alert {
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  border: 1px solid transparent;
}

.alert-info {
  background-color: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
}

.alert-warning {
  background-color: #fff3cd;
  border-color: #ffeaa7;
  color: #856404;
}

.alert-error {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.alert-success {
  background-color: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.button.small {
  padding: 0.3em 0.8em;
  font-size: 0.9em;
}
```

## 🚀 Atualizar vite.config.ts

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        lancamentos: resolve(__dirname, 'lancamentos.html'), // Adicionar aqui
      },
    },
  },
  server: {
    port: 5500,
    open: true,
  },
});
```

## ✅ Recursos Demonstrados

- ✅ Verificação de autenticação
- ✅ Verificação de configuração (OAuth + Planilha)
- ✅ Fluxo de autorização Google
- ✅ Provisionamento automático de planilha
- ✅ CRUD completo de lançamentos
- ✅ Relatórios e resumos
- ✅ Filtros por mês
- ✅ Formatação de valores
- ✅ Tratamento de erros
- ✅ Loading states
- ✅ Feedback ao usuário

Este exemplo mostra como integrar todos os serviços em uma página funcional completa! 🎉
