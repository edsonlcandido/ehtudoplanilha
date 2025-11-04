/**
 * Dashboard Principal
 * Integração completa: menu, cards financeiros, detalhes e modal de lançamento
 */

import { pb } from '../main';
import { API_ENDPOINTS } from '../config/env';
import { renderUserMenu } from '../components/user-menu';
import { initEntryModal, openEntryModal, closeEntryModal } from '../components/entry-modal';
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
  type Entry 
} from '../utils/sheet-entries';

// ============================================================================
// Declarações globais para armazenar dados
// ============================================================================
declare global {
  interface Window {
    allEntries: Entry[];
    filteredEntries: Entry[];
    summaryByBudget: any[];
    budgetsInInterval: any[];
    allBudgets: any[];
  }
}

// ============================================================================
// Inicialização
// ============================================================================

async function init(): Promise<void> {
  // Renderiza menu do usuário
  renderUserMenu();

  // Inicializa eventos dos cards
  inicializarEventos();

  // Inicializa modal de lançamento
  await initEntryModal(() => {
    console.log('✅ Lançamento adicionado! Recarregue a página para ver as mudanças.');
    // TODO: Implementar atualização automática dos cards
    window.location.reload();
  });

  // Botão de adicionar lançamento (toggle: abre/fecha)
  const addBtn = document.getElementById('openEntryModal');
  addBtn?.addEventListener('click', () => {
    const modal = document.getElementById('entryModal');
    const isOpen = modal?.style.display === 'flex';
    
    if (isOpen) {
      closeEntryModal();
    } else {
      openEntryModal();
    }
  });

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
  }
}

/**
 * Carrega e renderiza os dados financeiros
 */
async function loadAndRenderData(): Promise<void> {
  // Mostra card de carregamento
  mostrarCardCarregamento();

  try {
    // Busca os lançamentos
    const responseEntries = await fetch(`${API_ENDPOINTS.getSheetEntries}?limit=0`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pb.authStore.token}`
      }
    });

    const sheetEntriesData = await responseEntries.json();
    const entries: Entry[] = sheetEntriesData?.entries ?? [];

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
    div.textContent = 'Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laraninha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.';
    header.appendChild(div);
  }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

