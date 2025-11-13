/**
 * Dashboard Principal
 * Integração completa: menu, cards financeiros, detalhes e modal de lançamento
 */

import { pb } from '../main';
import { verifyTokenValidity } from '../services/auth';
import { API_ENDPOINTS } from '../config/env';
import { renderUserMenu } from '../components/user-menu';
import { initEntryModal, openEntryModal } from '../components/entry-modal';
import { initFutureEntryModal, openFutureEntryModal } from '../components/future-entry-modal';
import { initTransferEntryModal, openTransferEntryModal } from '../components/transfer-entry-modal';
import { initFabMenu } from '../components/fab-menu';
import { 
  renderizarCards, 
  inicializarEventos, 
  mostrarCardCarregamento, 
  mostrarErro 
} from '../components/financial-cards';
import { inicializarDetalhes } from '../components/details';
import { 
  aggregateByBudget, 
  filterEntriesByInterval, 
  budgetsInEntries,
  type Entry,
  type BudgetSummary,
  type BudgetInfo
} from '../utils/sheet-entries';
import lancamentosService from '../services/lancamentos';
import { renderCategoryBudgetChart } from '../components/category-budget-chart';

// ============================================================================
// Declarações globais para armazenar dados
// ============================================================================
declare global {
  interface Window {
    allEntries: Entry[];
    filteredEntries: Entry[];
    summaryByBudget: BudgetSummary[];
    budgetsInInterval: BudgetInfo[];
    allBudgets: BudgetInfo[];
  }
}

// ============================================================================
// Inicialização
// ============================================================================

async function init(): Promise<void> {
  // Verifica se o token é válido no início
  // Se receber 401, faz logout e redireciona para /
  const isTokenValid = await verifyTokenValidity();
  if (!isTokenValid) {
    console.warn('⚠️ Token inválido ou usuário não autenticado');
    return;
  }

  // Renderiza menu do usuário
  renderUserMenu();

  // Inicializa eventos dos cards
  inicializarEventos();

  // Inicializa modal de lançamento
  await initEntryModal(() => {
    console.log('✅ Lançamento adicionado! Recarregue a página para ver as mudanças.');
    window.location.reload();
  });

  // Inicializa modal de lançamento futuro
  await initFutureEntryModal(() => {
    console.log('✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças.');
    window.location.reload();
  });

  // Inicializa modal de transferência
  await initTransferEntryModal(() => {
    console.log('✅ Transferência realizada! Recarregue a página para ver as mudanças.');
    window.location.reload();
  });

  // Inicializa o menu FAB com as 3 opções
  initFabMenu(
    () => openEntryModal(),         // Receita/despesa
    () => openFutureEntryModal(),   // Lançamento futuro
    () => openTransferEntryModal()  // Transferência
  );

  // Verifica autenticação
  if (!pb.authStore.isValid) {
    console.log('⚠️ Usuário não autenticado');
    return;
  }

  // Verifica se a configuração do Google está completa
  const configStatus = await checkConfiguration();
  
  if (!configStatus.isValid) {
    showConfigurationRequired();
    return;
  }

  // Carrega e renderiza dados
  await loadAndRenderData();

  console.log('✅ Dashboard inicializado');
}

/**
 * Verifica status da configuração
 */
async function checkConfiguration(): Promise<{ isValid: boolean }> {
  try {
    const response = await fetch(`${API_ENDPOINTS.configStatus}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${pb.authStore.token}`
      }
    });

    const data = await response.json();
    return {
      isValid: data.hasRefreshToken && data.hasSheetId
    };
  } catch (error) {
    console.error('Erro ao verificar configuração:', error);
    return { isValid: false };
  }
}

/**
 * Mostra mensagem de configuração necessária
 */
function showConfigurationRequired(): void {
  const configBtn = document.getElementById('configBtn');
  if (configBtn) configBtn.style.display = '';

  const summaryCards = document.getElementById('summaryCards');
  if (summaryCards) summaryCards.style.display = 'none';

  const rightCol = document.querySelector('.dashboard__col--right.details') as HTMLElement;
  if (rightCol) rightCol.style.display = 'none';

  const addBtn = document.getElementById('openEntryModal');
  if (addBtn) addBtn.style.display = 'none';

  const header = document.querySelector('.dashboard__header');
  if (header && !document.getElementById('configMessage')) {
    const p = document.createElement('p');
    p.id = 'configMessage';
    p.style.marginTop = '1rem';
    p.textContent = 'Integração com Google não configurada. Clique em "Configurar Integração" para continuar.';
    header.appendChild(p);

    // Adiciona botão de configuração
    const button = document.createElement('a');
    button.href = '/dashboard/configuracao.html';
    button.className = 'button primary';
    button.style.marginTop = '1rem';
    button.style.display = 'inline-block';
    button.textContent = '⚙️ Configurar Integração';
    header.appendChild(button);
  }
}

/**
 * Carrega e renderiza os dados financeiros
 */
async function loadAndRenderData(): Promise<void> {
  // Mostra card de carregamento
  mostrarCardCarregamento();

  try {
    // Busca os lançamentos usando o serviço (com cache)
    // limit=0 significa buscar todas as entradas
    const sheetEntriesData = await lancamentosService.fetchEntries(0, false);
    // As entradas vindas do backend já estão no formato correto para Entry
    const entries: Entry[] = (sheetEntriesData?.entries ?? []) as any as Entry[];

    // Se não houver lançamentos, mostra mensagem
    if (!entries || entries.length === 0) {
      showNoEntriesMessage();
      return;
    }

    // Armazena globalmente
    window.allEntries = entries;

    // Processa orçamentos e filtra por intervalo
    const allSummaries = aggregateByBudget(entries);
    window.allBudgets = budgetsInEntries(entries);
    
    const entriesInInterval = filterEntriesByInterval(entries);
    const currentSummary = aggregateByBudget(entriesInInterval);
    const budgetsInIntervalList = budgetsInEntries(entriesInInterval);
    
    window.filteredEntries = entriesInInterval;
    window.summaryByBudget = currentSummary;
    window.budgetsInInterval = budgetsInIntervalList;

    // Cria mapa de orçamentos no intervalo
    const budgetsInIntervalMap: Record<string, boolean> = {};
    currentSummary.forEach(budget => {
      budgetsInIntervalMap[budget.label] = true;
    });

    // Renderiza cards e detalhes
    renderizarCards(allSummaries, budgetsInIntervalMap);
    inicializarDetalhes(entries, budgetsInIntervalList);

    // Renderiza gráfico de despesas por tipo usando entries filtrados (ativos)
    await renderBudgetChart(entriesInInterval);

  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    mostrarErro('Não foi possível carregar os dados. Verifique sua conexão e tente novamente.');
  }
}

/**
 * Mostra mensagem quando não há lançamentos
 */
function showNoEntriesMessage(): void {
  const summaryCards = document.getElementById('summaryCards');
  if (summaryCards) summaryCards.style.display = 'none';

  const rightCol = document.querySelector('.dashboard__col--right.details') as HTMLElement;
  if (rightCol) rightCol.style.display = 'none';

  const addBtn = document.getElementById('openEntryModal');
  if (addBtn) addBtn.style.display = '';

  const header = document.querySelector('.dashboard__header');
  if (header && !document.getElementById('firstEntryMessage')) {
    const div = document.createElement('div');
    div.id = 'firstEntryMessage';
    div.style.marginTop = '1rem';
    div.className = 'notice';
    div.textContent = 'Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.';
    header.appendChild(div);
  }
}

/**
 * Renderiza o gráfico de despesas por categoria
 */
async function renderBudgetChart(entries: Entry[], retryCount: number = 0): Promise<void> {
  const MAX_RETRIES = 3;
  
  try {
    console.log('[Dashboard] Preparando gráfico de despesas...');
    
    // Verifica se o container existe no DOM
    const chartContainer = document.getElementById('categoryBudgetChart');
    if (!chartContainer) {
      if (retryCount < MAX_RETRIES) {
        console.warn(`[Dashboard] Container categoryBudgetChart não encontrado (tentativa ${retryCount + 1}/${MAX_RETRIES}), aguardando...`);
        // Tenta novamente após um pequeno delay
        setTimeout(() => renderBudgetChart(entries, retryCount + 1), 200);
        return;
      } else {
        console.warn('[Dashboard] Container categoryBudgetChart não encontrado após múltiplas tentativas. Gráfico não será renderizado.');
        console.log('[Dashboard] Elementos no DOM:', {
          aside: document.querySelector('.dashboard__col--right.details'),
          topCategories: document.querySelector('.details__top-categories'),
          allDivs: Array.from(document.querySelectorAll('div[id]')).map(d => d.id)
        });
        return;
      }
    }
    
    console.log('[Dashboard] Container encontrado, preparando dados...');

    // Converte entries para o formato esperado pelo chart
    const chartEntries = entries.map(e => ({
      categoria: (e as any).categoria || '',
      valor: (e as any).valor || 0,
      tipo: (e as any).tipo || ''
    }));

    console.log('[Dashboard] Renderizando gráfico de despesas...');
    renderCategoryBudgetChart('categoryBudgetChart', chartEntries);
    console.log('[Dashboard] ✅ Gráfico de despesas renderizado com sucesso');
    
  } catch (error) {
    console.error('[Dashboard] Erro ao renderizar gráfico de despesas:', error);
    // Não quebra o dashboard se o gráfico falhar
  }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

