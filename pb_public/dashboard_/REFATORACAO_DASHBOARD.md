# Estratégia de Refatoração do Dashboard

Analisei o arquivo `pb_public/dashboard/index.html` do dashboard atual e percebi que é um arquivo grande com muitas responsabilidades misturadas: HTML, CSS inline e muito JavaScript. Isso dificulta a manutenção.

## Abordagem de Refatoração

Vou propor uma estratégia de refatoração progressiva em módulos pequenos e independentes, seguindo boas práticas de JavaScript vanilla moderno.

### 1. Estrutura de Arquivos

```
pb_public/
├── dashboard2/
│   ├── index.html (estrutura principal simplificada)
│   ├── css/
│   │   └── dashboard.css (estilos específicos)
│   └── js/
│       ├── components/
│       │   ├── financial-cards.js (componente dos cards)
│       │   └── month-selector.js (componente do seletor de meses)
│       ├── services/
│       │   ├── financial-service.js (carregamento de dados financeiros)
│       │   └── formatter-service.js (formatação de valores e datas)
│       ├── ui/
│       │   ├── modal-controller.js (controle do modal)
│       │   ├── form-handler.js (gerencia formulário de lançamento)
│       │   ├── autocomplete.js (autocomplete de campos)
│       │   └── table-utils.js (utilitários para tabelas responsivas)
│       └── dashboard-app.js (inicialização e integração)
``` 

### 2. Etapas da Refatoração

1. **Separar o HTML**: Manter apenas a estrutura HTML básica no `pb_public/dashboard/index.html`
2. **Extrair CSS**: Mover todos os estilos inline para um arquivo CSS dedicado
3. **Modularizar o JavaScript**: Dividir em módulos pequenos por função
4. **Implementar sistema de eventos**: Para comunicação entre módulos

### 3. Plano de Implementação

#### Primeira Fase: Estrutura Básica e CSS

1. Criar o arquivo `pb_public/dashboard/index.html` com a estrutura HTML essencial
2. Extrair estilos para `dashboard2/css/dashboard.css`

#### Segunda Fase: Componentes Principais

3. Implementar `month-selector.js` - Componente que gerencia o seletor de meses
4. Adaptar `financial-cards.js` - Para carregamento dinâmico dos cards financeiros

#### Terceira Fase: Serviços de Dados

5. Criar `financial-service.js` - Responsável por carregar dados financeiros
6. Implementar `formatter-service.js` - Para formatação de valores monetários e datas

#### Quarta Fase: Interface do Usuário

7. Desenvolver `modal-controller.js` - Gerencia o modal de novo lançamento
8. Implementar `form-handler.js` - Validação e envio de formulários
9. Criar `autocomplete.js` - Funcionalidade de autocompletar

#### Quinta Fase: Integração

10. Implementar `dashboard-app.js` - Arquivo principal para integrar os módulos

## Começando a Implementação

Abaixo segue uma versão inicial dos arquivos e trechos de código sugeridos para começar a refatoração.

### `pb_public/dashboard/index.html` (estrutura simplificada)

```html
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <title>Dashboard - Seu App Financeiro</title>
    <link rel="stylesheet" href="../css/picnic.css">
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/responsive-tables.css">
    <link rel="stylesheet" href="./css/dashboard.css">
    <script src="../js/pocketbase/dist/pocketbase.umd.js"></script>
</head>

<body>
    <!-- NAV: menu dinâmico -->
    <nav>
        <a href="/" class="brand">
            <span>Planilha Eh Tudo</span>
        </a>
        <input id="bmenub" type="checkbox" class="show">
        <label for="bmenub" class="burger pseudo button">menu</label>
        <div class="menu" id="menu-user">
            <a href="#" class="pseudo button icon-picture">Demo</a>
            <a href="../login.html" class="button icon-puzzle" id="loginBtn">Login</a>
            <a href="../registro.html" class="button icon-user" id="registerBtn">Registrar</a>
        </div>
    </nav>
    
    <!-- Container principal com menu lateral -->
    <div class="app-container">
        <!-- Menu lateral fixo -->
        <aside class="sidebar-menu">
            <a href="index.html" class="active" title="Dashboard">
                <span class="menu-icon">🏠</span>
                <span class="menu-text">Dashboard</span>
            </a>
            <a href="lancamentos.html" title="Lançamentos">
                <span class="menu-icon">📋</span>
                <span class="menu-text">Lançamentos</span>
            </a>
        </aside>

        <!-- Conteúdo principal rolável -->
        <main class="main-content">
            <section class="section section-light dashboard-main">
                <div class="container text-center">
                    <h2>Bem-vindo ao seu Dashboard!</h2>
                    <p>Aqui você pode visualizar e inserir lançamentos de forma simples e rápida.</p>
                    
                    <!-- Botão de configuração -->
                    <div class="config-button-container">
                        <a href="configuracao.html" id="configBtn" class="button primary" style="display: none;">⚙️ Configurar Integração</a>
                    </div>

                    <!-- Seletor de Mês para Análise -->
                    <div id="month-selector-container" class="month-selector-container">
                        <!-- O componente será injetado aqui via JS -->
                    </div>

                    <!-- Cards Financeiros -->
                    <div id="financialCards" aria-live="polite"></div>

                    <!-- Container de Categorias Top 10 -->
                    <div id="topCategoriesContainer" class="container-tabela"></div>
                </div>
                
                <!-- Botão de adicionar lançamento (flutuante) -->
                <button id="openEntryModal" class="button add-entry-button" aria-label="Adicionar lançamento">+</button>
            </section>
        </main>
    </div>

    <!-- Modal de lançamento de despesas/receitas -->
    <div id="entryModal" class="entry-modal">
        <button id="closeEntryModal" aria-label="Fechar modal" class="close-modal-button">×</button>
        <div class="modal-content solution-card">
            <!-- Conteúdo do modal será carregado via JS -->
        </div>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
        <div class="container">
            <p>&copy; 2025 Planilha Eh Tudo. Simplificando suas finanças.</p>
        </div>
        <p>
            <small>Produzido por <a href="https://www.ehtudo.app">Eh!Tudo.app</a></small>
        </p>
    </footer>

    <!-- Scripts modularizados -->
    <script type="module" src="./js/dashboard-app.js"></script>
</body>
</html>
```

### `dashboard.css` (estilos extraídos)

```css
/* Estilos gerais da página */
body {
    max-width: 100vw;
    overflow-x: hidden;
}

/* Estilos para o container do seletor de mês */
.month-selector-container {
    margin-top: 2rem;
    margin-bottom: 1rem;
}

.month-selector-group {
    max-width: 300px;
    margin: 0 auto;
}

.config-button-container {
    margin-top: 2rem;
}

/* Estilos para tabelas roláveis */
.tabela-rolavel {
    width: 100%;
    overflow-x: auto;
    white-space: nowrap;
    border: 1px solid #ddd;
    padding: 5px;
    border-radius: 4px;
    -webkit-overflow-scrolling: touch; /* Rolagem suave em iOS */
    scrollbar-width: thin; /* Firefox */
    scrollbar-color: #ccc transparent; /* Firefox */
}

.tabela-rolavel table {
    min-width: 600px;
    width: 100%;
}

/* Estilo da barra de rolagem para Chrome e Safari */
.tabela-rolavel::-webkit-scrollbar {
    height: 8px;
    background-color: #f5f5f5;
}

.tabela-rolavel::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 4px;
}

/* Estilos do Modal */
.entry-modal {
    display: none;
    position: fixed;
    top: 60px;
    left: 0;
    width: 100%;
    height: calc(100% - 60px);
    background: rgba(0,0,0,0.5);
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.close-modal-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: transparent;
    border: none;
    color: inherit;
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 1002;
}

.modal-content {
    background: white;
    padding: 1.5rem;
    border-radius: 4px;
    max-width: 600px;
    width: 90%;
    position: relative;
    max-height: 90vh;
    overflow: auto;
}

/* Botão de adicionar lançamento */
.add-entry-button {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    font-size: 24px;
    line-height: 1;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 100;
    transition: transform 0.3s, background-color 0.3s;
}

.add-entry-button.modal-open {
    transform: rotate(45deg);
    background-color: #f44336;
}

/* Animação para skeleton loading */
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
}

/* Indicador visual de rolagem em dispositivos móveis */
@media (max-width: 768px) {
    .container-tabela {
        position: relative;
        max-width: 100%;
        overflow: hidden;
    }
    
    .top-categories-container {
        max-width: 100%;
        margin: 0;
        padding: 0 10px;
    }
    
    .tabela-rolavel {
        position: relative;
    }
    
    .tabela-rolavel::after {
        content: "→";
        position: absolute;
        right: 5px;
        top: 50%;
        transform: translateY(-50%);
        color: #999;
        animation: fadeInOut 1.5s infinite;
        pointer-events: none;
        background: rgba(255,255,255,0.7);
        padding: 5px;
    }
    
    @keyframes fadeInOut {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
    }
}
```

### `js/dashboard-app.js` (coordenador principal)

```javascript
/**
 * Arquivo principal do Dashboard - Coordena a inicialização de todos os módulos
 */
import apiConfig from '../../js/config/api-config.js';
import { inicializarMenuUsuario } from '../../js/menu-usuario.js';
import { initMonthSelector } from './components/month-selector.js';
import { initFinancialCards } from './components/financial-cards.js';
import { initTopCategoriesChart } from './components/top-categories-chart.js';
import { initModalController } from './ui/modal-controller.js';
import { initFormHandler } from './ui/form-handler.js';
import { initTableUtils } from './ui/table-utils.js';
import { 
    checkConfigStatus, 
    loadFinancialData,
    loadAvailableMonths
} from './services/financial-service.js';

// Inicializa o PocketBase globalmente
window.pb = new PocketBase(apiConfig.getBaseURL());

// Armazena o estado global da aplicação
const appState = {
    currentMonth: null,
    components: {
        financialCards: null,
        topCategoriesChart: null
    }
};

// Função principal de inicialização
async function initDashboard() {
    // Inicializa componentes da UI
    inicializarMenuUsuario();
    initModalController();
    initTableUtils();
    
    // Inicializa o componente de cartões financeiros (loading state)
    appState.components.financialCards = initFinancialCards('financialCards', {
        showToggleButtons: true
    });
    
    try {
        // Verifica o status de configuração
        const configStatus = await checkConfigStatus();
        const configBtn = document.getElementById('configBtn');
        
        // Exibe botão de configuração se necessário
        if (!configStatus.validConfig) {
            console.log('Configuração incompleta, campos faltando:', configStatus.missing);
            configBtn.style.display = '';
            return;
        }
        
        console.log('Configuração OK, carregando dados...');
        
        // Carrega meses disponíveis
        const availableMonths = await loadAvailableMonths();
        appState.currentMonth = initMonthSelector('month-selector-container', availableMonths, onMonthChange);
        
        // Carrega dados financeiros iniciais
        const summaryData = await loadFinancialData(appState.currentMonth);
        
        // Inicializa componente de categorias
        appState.components.topCategoriesChart = initTopCategoriesChart('topCategoriesContainer', {
            limit: 10,
            periodo: 'atual',
            mesBase: appState.currentMonth
        }, summaryData);
        
        // Inicializa o formulário de lançamentos
        initFormHandler(onFormSubmitSuccess);
        
    } catch (error) {
        console.error('Erro na inicialização do dashboard:', error);
        document.getElementById('configBtn').style.display = '';
    }
    
    // Carrega o módulo de proteção do dashboard após pequeno delay
    setTimeout(() => {
        import('../../js/protecao-dashboard.js')
            .then(() => console.log('Módulo de proteção carregado'))
            .catch(err => console.error('Erro ao carregar proteção:', err));
    }, 100);
}

// Função chamada quando o mês é alterado
async function onMonthChange(newMonth) {
    if (!newMonth || newMonth === appState.currentMonth) return;
    
    console.log(`Alterando mês de análise: ${appState.currentMonth} -> ${newMonth}`);
    appState.currentMonth = newMonth;
    
    try {
        // Mostra estado de loading nos cards
        appState.components.financialCards.renderLoading();
        
        // Carrega novos dados financeiros
        const summaryData = await loadFinancialData(newMonth, true);
        
        // Atualiza componentes com novos dados
        appState.components.financialCards.updateData(summaryData);
        
        if (appState.components.topCategoriesChart) {
            appState.components.topCategoriesChart.updateMonth(newMonth, summaryData);
        }
        
        // Notifica outros componentes sobre a mudança de mês
        document.dispatchEvent(new CustomEvent('monthChanged', { 
            detail: { newMonth, summaryData } 
        }));
        
    } catch (error) {
        console.error('Erro ao atualizar dados para o novo mês:', error);
        appState.components.financialCards.renderError('Erro ao carregar dados do mês selecionado');
    }
}

// Função chamada após envio bem-sucedido do formulário
async function onFormSubmitSuccess() {
    // Recarrega dados financeiros para atualizar o dashboard
    try {
        const updatedData = await loadFinancialData(appState.currentMonth, true);
        appState.components.financialCards.updateData(updatedData);
        
        if (appState.components.topCategoriesChart) {
            appState.components.topCategoriesChart.updateData(updatedData);
        }
    } catch (error) {
        console.error('Erro ao atualizar dados após novo lançamento:', error);
    }
}

// Inicializa o dashboard quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initDashboard);
```

### `services/financial-service.js` (exemplo)

```javascript
/**
 * Serviço para gerenciamento de dados financeiros
 */
import apiConfig from '../../../js/config/api-config.js';
import googleSheetsService from '../../../js/google/sheets-api.js';

// Inicializa o serviço de Google Sheets
googleSheetsService.init(window.pb);

/**
 * Verifica o status de configuração da integração com Google Sheets
 * @returns {Promise<Object>} Status da configuração
 */
export async function checkConfigStatus() {
    try {
        const response = await fetch(`${apiConfig.getBaseURL()}/config-status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.pb.authStore.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro na requisição de configuração');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro ao verificar configuração:', error);
        return { validConfig: false, error: error.message };
    }
}

/**
 * Carrega os meses disponíveis para análise
 * @returns {Promise<Array>} Array de meses disponíveis
 */
export async function loadAvailableMonths() {
    try {
        const response = await googleSheetsService.getAvailableMonths();
        
        if (response.success && response.meses && response.meses.length > 0) {
            return response.meses;
        }
        
        return [];
    } catch (error) {
        console.error('Erro ao carregar meses disponíveis:', error);
        return [];
    }
}

/**
 * Carrega dados financeiros para um determinado mês
 * @param {string} month - Mês no formato AAAA-MM
 * @param {boolean} forceRefresh - Se deve forçar atualização do cache
 * @returns {Promise<Object>} Dados financeiros
 */
export async function loadFinancialData(month, forceRefresh = false) {
    try {
        console.log('Carregando dados financeiros...', 'mês:', month, 'forceRefresh:', forceRefresh);
        
        // Determina mês base padrão se não for passado
        let targetMonth = month;
        if (!targetMonth) {
            const now = new Date();
            targetMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2, '0')}`;
        }
        
        // Se forçar refresh, limpa o cache primeiro
        if (forceRefresh) {
            googleSheetsService.clearFinancialSummaryCache(targetMonth);
        }
        
        // Carrega os dados do mês
        const summaryData = await googleSheetsService.getFinancialSummary(targetMonth, { 
            force: forceRefresh 
        });
        
        // Disponibiliza dados de histórico e contas para os componentes de autocomplete
        if (summaryData && summaryData.success) {
            // Dispara evento com os dados de sugestões
            document.dispatchEvent(new CustomEvent('suggestionsLoaded', {
                detail: {
                    historico: summaryData.historicoLancamentos || [],
                    contas: summaryData.contasSugeridas || []
                }
            }));
        }
        
        return summaryData;
    } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
        throw error;
    }
}

/**
 * Adiciona uma nova entrada financeira
 * @param {Object} entryData - Dados do lançamento
 * @returns {Promise<Object>} Resultado da operação
 */
export async function addFinancialEntry(entryData) {
    try {
        return await googleSheetsService.addEntry(entryData);
    } catch (error) {
        console.error('Erro ao adicionar lançamento:', error);
        throw error;
    }
}
```

### `components/month-selector.js` (exemplo)

```javascript
/**
 * Componente de seletor de mês
 */

/**
 * Inicializa o componente de seletor de mês
 * @param {string} containerId - ID do elemento container
 * @param {Array} availableMonths - Lista de meses disponíveis
 * @param {Function} onChange - Função a ser chamada quando o mês mudar
 * @returns {string} O mês atualmente selecionado
 */
export function initMonthSelector(containerId, availableMonths, onChange) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Cria a estrutura do seletor
    const html = `
        <div class="form-group month-selector-group">
            <label for="monthSelector" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
                📅 Mês para Análise:
            </label>
            <select id="monthSelector" class="form-control" aria-label="Selecionar mês para análise">
                ${availableMonths.length > 0 
                  ? availableMonths.map(month => `<option value="${month.valor}">${month.texto}</option>`).join('')
                  : '<option value="">Nenhum mês disponível</option>'}
            </select>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Seleciona o elemento recém-criado
    const selector = document.getElementById('monthSelector');
    if (!selector) return null;
    
    // Determina o mês atual para ser selecionado por padrão
    const now = new Date();
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    
    // Encontra o mês atual na lista ou seleciona o primeiro disponível
    let selectedMonth = currentMonth;
    const currentMonthOption = selector.querySelector(`option[value="${currentMonth}"]`);
    
    if (currentMonthOption) {
        currentMonthOption.selected = true;
    } else if (availableMonths.length > 0) {
        selector.selectedIndex = 0;
        selectedMonth = availableMonths[0].valor;
    }
    
    // Adiciona o listener de eventos
    selector.addEventListener('change', (e) => {
        const newMonth = e.target.value;
        if (newMonth && typeof onChange === 'function') {
            onChange(newMonth);
        }
    });
    
    return selectedMonth;
}
```

### `ui/modal-controller.js` (exemplo)

```javascript
/**
 * Controlador para o modal de lançamentos
 */

let modalOpenState = false;

/**
 * Inicializa o controlador de modal
 */
export function initModalController() {
    const modal = document.getElementById('entryModal');
    const openBtn = document.getElementById('openEntryModal');
    const closeBtn = document.getElementById('closeEntryModal');
    
    if (!modal || !openBtn || !closeBtn) {
        console.error('Elementos do modal não encontrados');
        return;
    }
    
    // Inicializa o conteúdo do modal
    initModalContent();
    
    // Configura eventos
    openBtn.addEventListener('click', toggleModal);
    closeBtn.addEventListener('click', closeModal);
    
    // Fecha o modal quando clicado fora do conteúdo
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Fecha o modal com tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOpenState) closeModal();
    });
}

/**
 * Alterna o estado do modal (aberto/fechado)
 */
function toggleModal() {
    const modal = document.getElementById('entryModal');
    const openBtn = document.getElementById('openEntryModal');
    
    if (modalOpenState) {
        closeModal();
    } else {
        modalOpenState = true;
        modal.style.display = 'flex';
        openBtn.classList.add('modal-open');
        openBtn.textContent = '×';
        openBtn.setAttribute('aria-label', 'Fechar modal');
    }
}

/**
 * Fecha o modal
 */
export function closeModal() {
    const modal = document.getElementById('entryModal');
    const openBtn = document.getElementById('openEntryModal');
    
    modalOpenState = false;
    modal.style.display = 'none';
    openBtn.classList.remove('modal-open');
    openBtn.textContent = '+';
    openBtn.setAttribute('aria-label', 'Adicionar lançamento');
}

/**
 * Inicializa o conteúdo do modal
 */
function initModalContent() {
    const modalContent = document.querySelector('#entryModal .modal-content');
    if (!modalContent) return;
    
    modalContent.innerHTML = `
    <section class="section" style="padding:2rem 0; margin:0;">
        <div class="container">
            <div class="row">
                <div class="col-md-8 col-lg-6 mx-auto">
                    <div class="solution-card">
                        <h3 style="margin-bottom: 1.5rem;">Lançamento de Despesa/Receita</h3>
                        <form id="expenseForm">
                            <fieldset>
                                <!-- Data e Hora -->
                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label for="expenseDate">Data:</label>
                                    <input type="datetime-local" id="expenseDate" name="data" class="form-control" required>
                                </div>
                                <!-- Conta -->
                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label for="expenseAccount">Conta:</label>
                                    <input type="text" id="expenseAccount" name="conta" class="form-control" placeholder="Ex: Conta Corrente, Cartão de Crédito" required>
                                </div>
                                <!-- Valor com toggle de sinal -->
                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label for="expenseValue">Valor:</label>
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <button type="button" id="expenseSignBtn" class="button outline" aria-label="Alternar sinal" style="background-color: white; color: inherit; border: 1px solid #ccc; width: 2.5rem; text-align: center;">-</button>
                                        <input type="number" id="expenseValue" name="valor" class="form-control" step="0.01" min="0" placeholder="0,00" required>
                                        <input type="hidden" id="expenseSignValue" name="sinal" value="-">
                                    </div>
                                </div>
                                <!-- Descrição -->
                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label for="expenseDescription">Descrição:</label>
                                    <input type="text" id="expenseDescription" name="descricao" class="form-control" placeholder="Descrição da despesa" required>
                                </div>
                                <!-- Categoria: combobox com filtro -->
                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label for="expenseCategory">Categoria:</label>
                                    <input type="text" id="expenseCategory" name="categoria" class="form-control" placeholder="Selecione ou digite uma categoria" list="categoriaList" autocomplete="off" required>
                                    <datalist id="categoriaList"></datalist>
                                </div>
                                <!-- Orçamento -->
                                <div class="form-group" style="margin-bottom: 1.5rem;">
                                    <label for="expenseBudget">Orçamento:</label>
                                    <select id="expenseBudget" name="orcamento" class="form-control" required></select>
                                </div>
                                <!-- Botões -->
                                <div class="form-group" style="display:flex; justify-content:space-around; align-items:center; margin-top:2rem;">
                                    <button type="reset" class="button warning">Limpar</button>
                                    <button type="submit" class="button success">Salvar</button>
                                </div>
                            </fieldset>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>
    `;
    
    // Define a data/hora atual no formulário
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const localDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    const localTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    const dateInput = document.getElementById('expenseDate');
    if (dateInput) {
        dateInput.value = `${localDate}T${localTime}`;
    }
    
    // Inicializa o seletor de orçamento
    initBudgetSelector();
}

/**
 * Inicializa o seletor de orçamento com meses próximos
 */
function initBudgetSelector() {
    const expenseBudgetSelect = document.getElementById('expenseBudget');
    if (!expenseBudgetSelect) return;
    
    // Meses em português
    const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const now = new Date();
    const atual = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Adiciona meses (-6 a +6 meses do atual)
    for (let i = -6; i <= 6; i++) {
        const d = new Date(atual.getFullYear(), atual.getMonth() + i, 1);
        const mesNome = meses[d.getMonth()];
        const anoCurto = String(d.getFullYear()).slice(-2);
        const valor = `${mesNome}/${anoCurto}`;
        
        const opt = document.createElement('option');
        opt.value = valor;
        opt.textContent = valor.charAt(0).toUpperCase() + valor.slice(1);
        if (i === 0) opt.selected = true;
        
        expenseBudgetSelect.appendChild(opt);
    }
    
    // Inicializa controle de sinal (+/-)
    initSignToggle();
}

/**
 * Inicializa o toggle de sinal (+/-)
 */
function initSignToggle() {
    const signBtn = document.getElementById('expenseSignBtn');
    const signValue = document.getElementById('expenseSignValue');
    
    if (!signBtn || !signValue) return;
    
    let currentSign = '-';
    
    const updateSign = () => {
        signBtn.textContent = currentSign;
        signBtn.style.color = currentSign === '+' ? 'green' : 'red';
        signValue.value = currentSign;
    };
    
    signBtn.addEventListener('click', () => {
        currentSign = currentSign === '+' ? '-' : '+';
        updateSign();
    });
    
    updateSign();
}
```

### `ui/form-handler.js` (exemplo)

```javascript
/**
 * Gerenciador do formulário de lançamentos
 */
import { addFinancialEntry } from '../services/financial-service.js';
import { closeModal } from './modal-controller.js';
import { formatCurrency, formatDate, formatBudgetDate } from '../services/formatter-service.js';
import { initAutocomplete } from './autocomplete.js';
import categoriesService from '../../../js/categories-service.js';

// Armazena o callback de sucesso
let onSubmitSuccessCallback = null;

/**
 * Inicializa o gerenciador de formulário
 * @param {Function} onSubmitSuccess - Callback chamado após envio bem-sucedido
 */
export function initFormHandler(onSubmitSuccess) {
    onSubmitSuccessCallback = onSubmitSuccess;
    
    // Inicializa o formulário
    const expenseForm = document.getElementById('expenseForm');
    if (!expenseForm) return;
    
    // Inicializa o autocomplete
    initFormAutocomplete();
    
    // Carrega as categorias
    loadCategories();
    
    // Configura o envio do formulário
    expenseForm.addEventListener('submit', handleFormSubmit);
}

/**
 * Inicializa os componentes de autocomplete do formulário
 */
function initFormAutocomplete() {
    // Escuta o evento de sugestões carregadas
    document.addEventListener('suggestionsLoaded', (event) => {
        const { historico, contas } = event.detail;
        
        // Inicializa autocomplete para descrição
        initAutocomplete('expenseDescription', historico.map(item => ({
            text: item.descricao,
            value: item.descricao,
            metadata: { categoria: item.categoria }
        })), handleDescriptionSelect);
        
        // Inicializa autocomplete para conta
        initAutocomplete('expenseAccount', contas.map(conta => ({
            text: conta,
            value: conta
        })));
    });
}

/**
 * Manipula a seleção de uma descrição do autocomplete
 * @param {Object} item - Item selecionado
 */
function handleDescriptionSelect(item) {
    if (item && item.metadata && item.metadata.categoria) {
        const categoryInput = document.getElementById('expenseCategory');
        if (categoryInput) {
            categoryInput.value = item.metadata.categoria;
        }
    }
}

/**
 * Carrega as categorias disponíveis
 */
async function loadCategories() {
    try {
        if (window.categoriesService && typeof window.categoriesService.populateDatalist === 'function') {
            await window.categoriesService.populateDatalist('categoriaList');
            console.log('Categorias carregadas via serviço centralizado');
        } else {
            console.warn('Serviço de categorias não disponível');
            
            // Fallback com categorias padrão
            const dataList = document.getElementById('categoriaList');
            if (dataList) {
                dataList.innerHTML = '';
                ['Alimentação', 'Transporte', 'Moradia', 'Saúde',
                 'Educação', 'Lazer', 'Vestuário', 'Outras']
                 .forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat;
                    dataList.appendChild(opt);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

/**
 * Manipula o envio do formulário
 * @param {Event} e - Evento de submit
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    
    try {
        // Coleta os dados do formulário
        const data = formatDate(document.getElementById('expenseDate').value);
        const conta = document.getElementById('expenseAccount').value.trim();
        const valorBase = parseFloat(document.getElementById('expenseValue').value);
        const sinal = document.getElementById('expenseSignValue').value;
        const valor = sinal === '-' ? -Math.abs(valorBase) : Math.abs(valorBase);
        const descricao = document.getElementById('expenseDescription').value.trim();
        const categoria = document.getElementById('expenseCategory').value.trim();
        const orcamento = formatBudgetDate(document.getElementById('expenseBudget').value);

        const entryData = {
            data,
            conta,
            valor: valor.toFixed(2).replace('.', ','),
            descricao,
            categoria,
            orcamento
        };

        // Envia os dados
        const resultado = await addFinancialEntry(entryData);

        if (resultado.success) {
            showMessage('success', 'Lançamento enviado com sucesso!');
            resetForm();
            
            // Chama o callback de sucesso
            if (typeof onSubmitSuccessCallback === 'function') {
                onSubmitSuccessCallback();
            }
            
            // Fecha o modal após um breve delay
            setTimeout(() => {
                closeModal();
            }, 1000);
        } else {
            throw new Error(resultado.error || 'Erro ao enviar lançamento');
        }
    } catch (error) {
        console.error('Erro ao enviar dados:', error);
        showMessage('error', 'Erro ao enviar lançamento: ' + (error.message || error));
    } finally {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}

/**
 * Limpa os campos do formulário
 */
function resetForm() {
    document.getElementById('expenseAccount').value = '';
    document.getElementById('expenseValue').value = '';
    document.getElementById('expenseDescription').value = '';
    document.getElementById('expenseCategory').value = '';
    
    // Reseta o sinal para negativo
    const signBtn = document.getElementById('expenseSignBtn');
    const signValue = document.getElementById('expenseSignValue');
    if (signBtn && signValue) {
        signBtn.textContent = '-';
        signBtn.style.color = 'red';
        signValue.value = '-';
    }
}

/**
 * Exibe uma mensagem para o usuário
 * @param {string} type - Tipo de mensagem (success/error)
 * @param {string} text - Texto da mensagem
 */
export function showMessage(type, text) {
    let msgEl = document.getElementById('feedback-message');
    if (!msgEl) {
        msgEl = document.createElement('div');
        msgEl.id = 'feedback-message';
        Object.assign(msgEl.style, {
            position: 'fixed',
            top: '70px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: '10000'
        });
        document.body.appendChild(msgEl);
    }
    
    if (type === 'success') {
        msgEl.style.backgroundColor = '#4CAF50';
        msgEl.style.color = 'white';
    } else {
        msgEl.style.backgroundColor = '#F44336';
        msgEl.style.color = 'white';
    }
    
    msgEl.textContent = text;
    msgEl.style.display = 'block';
    
    setTimeout(() => {
        msgEl.style.display = 'none';
    }, 5000);
}
```

### `services/formatter-service.js` (exemplo)

```javascript
/**
 * Serviço de formatação para valores e datas
 */

/**
 * Formata um valor para moeda brasileira
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado
 */
export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

/**
 * Formata uma data de formulário para o formato brasileiro
 * @param {string} dateTime - Data no formato "YYYY-MM-DDThh:mm"
 * @returns {string} Data formatada como "DD/MM/YYYY hh:mm"
 */
export function formatDate(dateTime) {
    const dt = new Date(dateTime);
    const dia = String(dt.getDate()).padStart(2, '0');
    const mes = String(dt.getMonth() + 1).padStart(2, '0');
    const ano = dt.getFullYear();
    const hora = String(dt.getHours()).padStart(2, '0');
    const minuto = String(dt.getMinutes()).padStart(2, '0');
    
    return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}

/**
 * Formata uma data de orçamento
 * @param {string} budgetDate - Data no formato "mesNome/AA" (ex: setembro/25)
 * @returns {string} Data formatada como "01/MM/YYYY"
 */
export function formatBudgetDate(budgetDate) {
    if (!budgetDate) return '';
    
    const meses = ['janeiro','fevereiro','março','abril','maio','junho',
                   'julho','agosto','setembro','outubro','novembro','dezembro'];
    
    const [mesNome, anoCurto] = budgetDate.split('/');
    const mesIndex = meses.indexOf(mesNome.toLowerCase());
    
    if (mesIndex === -1) return '';
    
    const ano = '20' + anoCurto;
    const mes = String(mesIndex + 1).padStart(2, '0');
    
    return `01/${mes}/${ano}`;
}

/**
 * Formata uma variação percentual para despesas
 * @param {number} variation - Valor da variação
 * @returns {Object} Objeto com texto, classe CSS e ícone
 */
export function formatExpenseVariation(variation) {
    const sinal = variation >= 0 ? '+' : '';
    // Para despesas: variação negativa é boa (menos gastos = verde), positiva é ruim (mais gastos = vermelho)
    const icone = variation > 0 ? '📈' : variation < 0 ? '📉' : '📊';
    const classe = variation > 0 ? 'variation-negative' : 
                 variation < 0 ? 'variation-positive' : 'variation-neutral';
    
    return {
        texto: `${sinal}${variation.toFixed(1)}% em relação ao mês anterior`,
        classe,
        icone
    };
}
```

## Próximos passos

- Aplicar essas divisões de arquivos no repositório em pequenos commits (um arquivo por commit). Recomendo começar extraindo o HTML e o CSS, depois criar `dashboard-app.js` e implementar apenas `month-selector.js` e `modal-controller.js` para validar o fluxo.
- Testar cada passo abrindo `pb_public/dashboard/index.html` em um servidor local (por exemplo `npx http-server pb_public`) e validar que não há regressões.

## Observações finais

- Mantive o foco em módulos pequenos para que você possa aprender passo a passo com JavaScript vanilla.
- Posso começar a aplicar essas mudanças automaticamente neste repositório em pequenos commits se você autorizar — vou criar um checklist de arquivos a mudar e aplico um por vez.


---

Arquivo gerado automaticamente para orientar a refatoração do dashboard.
