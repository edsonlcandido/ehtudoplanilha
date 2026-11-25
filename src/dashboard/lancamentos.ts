/**
 * Página de Lançamentos
 *
 * A página NÃO faz mais regra de negócio: ela monta o estado dos filtros,
 * envia pro backend e renderiza a resposta (já filtrada, ordenada e
 * normalizada). Ver pb_hooks/_lancamentos-domain.js.
 */

import { verifyTokenValidity } from '../services/auth';
import { renderUserMenu } from '../components/user-menu';
import { initEntryModal, openEntryModal, openEntryModalWithData } from '../components/entry-modal';
import { initEditEntryModal, openEditEntryModal, setEditModalEntries } from '../components/edit-entry-modal';
import { initFutureEntryModal, openFutureEntryModal } from '../components/future-entry-modal';
import { initTransferEntryModal, openTransferEntryModal } from '../components/transfer-entry-modal';
import { initBalanceAdjustModal, openBalanceAdjustModal } from '../components/balance-adjust-modal';
import { initFabMenu } from '../components/fab-menu';
import { renderEntries } from '../components/lancamentos-list';
import { renderGroupedSummary } from '../components/grouped-summary';
import lancamentosService from '../services/lancamentos';
import type { SortType, LancamentosState, SheetEntry } from '../types';
import { showSuccessToast, showErrorToast, showInfoToast } from '../components/toast';

// ============================================================================
// Estado da aplicação
// ============================================================================

const state: LancamentosState = {
  entries: [],
  meta: { contas: [], categorias: [], descricoes: [], orcamentos: [] },
  resumo: { receitas: 0, despesas: 0, saldo: 0, count: 0 },
  searchTerm: '',
  sortBy: 'original',
  showConsolidated: true,
  showFuture: false,
  isLoading: false,
  filters: {
    conta: '',
    dataInicio: '',
    dataFim: '',
    orcamento: '',
    categoria: ''
  },
  filterPanelOpen: false
};

/** Timer do debounce da busca */
let searchTimer: number | null = null;

/** Marca que precisa recarregar quando a request em andamento terminar */
let pendingReload = false;

/** Primeira carga da página (evita toast a cada filtro) */
let firstLoad = true;

// ============================================================================
// Funções de UI
// ============================================================================

function showLoading(): void {
  const indicator = document.getElementById('loadingIndicator');
  if (indicator) {
    indicator.style.display = 'flex';
  }
}

function hideLoading(): void {
  const indicator = document.getElementById('loadingIndicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

function showMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  if (type === 'success') {
    showSuccessToast(message);
  } else if (type === 'error') {
    showErrorToast(message);
  } else {
    showInfoToast(message, 'Info');
  }
}

function updateSearchResults(): void {
  const searchResults = document.getElementById('searchResults');
  const searchCount = document.getElementById('searchCount');
  const clearBtn = document.getElementById('clearSearchBtn');

  if (!searchResults || !searchCount || !clearBtn) return;

  if (state.searchTerm) {
    searchCount.textContent = `${state.entries.length} resultado(s) encontrado(s)`;
    searchResults.classList.add('lancamentos__search-results--visible');
    clearBtn.style.display = 'flex';
  } else {
    searchResults.classList.remove('lancamentos__search-results--visible');
    clearBtn.style.display = 'none';
  }
}

// ============================================================================
// Carregamento (tudo filtrado/ordenado no backend)
// ============================================================================

/**
 * Monta a query do backend a partir do estado atual da página
 */
function buildQuery(fresh: boolean) {
  return {
    limit: 0, // todas as linhas; a página exibe no máximo 100
    q: state.searchTerm,
    conta: state.filters.conta,
    categoria: state.filters.categoria,
    orcamento: state.filters.orcamento,
    dataInicio: state.filters.dataInicio,
    dataFim: state.filters.dataFim,
    tipo: currentTipo(),
    sort: state.sortBy,
    fresh
  };
}

/**
 * Tipo de lançamento conforme os checkboxes (consolidado / futuro)
 */
function currentTipo(): 'todos' | 'consolidado' | 'futuro' {
  if (state.showConsolidated && state.showFuture) return 'todos';
  if (state.showConsolidated) return 'consolidado';
  if (state.showFuture) return 'futuro';
  return 'todos';
}

/**
 * Carrega lançamentos da planilha (filtros/ordenação aplicados no backend)
 * @param forceRefresh - Se true, ignora o cache e busca do servidor
 */
async function loadEntries(forceRefresh = false): Promise<void> {
  if (state.isLoading) {
    // já tem uma request em andamento — garante que o resultado mais novo
    // (com os filtros atuais) seja carregado quando ela terminar
    pendingReload = true;
    return;
  }

  state.isLoading = true;

  // Só mostra o loader grande se não for refresh manual (botão)
  if (!forceRefresh) {
    showLoading();
  }

  try {
    const response = await lancamentosService.fetchEntries(buildQuery(forceRefresh));

    state.entries = response.entries || [];
    state.meta = response.meta || state.meta;
    state.resumo = response.resumo || state.resumo;

    // Popula os filtros com as opções disponíveis
    populateContaFilter();
    populateOrcamentoFilter();
    populateCategoriaFilter();

    renderEntriesList();

    if (firstLoad || forceRefresh) {
      const cacheMsg = forceRefresh ? ' (cache atualizado)' : '';
      showMessage('Lançamentos carregados com sucesso' + cacheMsg, 'success');
    }
    firstLoad = false;
  } catch (error: any) {
    console.error('Erro ao carregar lançamentos:', error);
    showMessage('Erro ao carregar lançamentos: ' + error.message, 'error');
    state.entries = [];
    state.resumo = { receitas: 0, despesas: 0, saldo: 0, count: 0 };
    renderEntriesList();
  } finally {
    state.isLoading = false;

    // Só esconde o loader grande se não for refresh manual
    if (!forceRefresh) {
      hideLoading();
    }

    if (pendingReload) {
      pendingReload = false;
      loadEntries();
    }
  }
}

/**
 * Renderiza lista de lançamentos
 */
function renderEntriesList(): void {
  const container = document.getElementById('entriesContainer');
  if (!container) return;

  // Limita aos 100 primeiros itens (limite de exibição)
  const limitedEntries = state.entries.slice(0, 100);

  // Renderiza o resumo dos filtros sempre que houver filtro ativo
  const summaryContainer = document.getElementById('groupedSummaryContainer');
  if (summaryContainer) {
    if (hasActiveFilters()) {
      summaryContainer.innerHTML = renderGroupedSummary(state.resumo, {
        conta: state.filters.conta,
        dataInicio: state.filters.dataInicio,
        dataFim: state.filters.dataFim,
        orcamento: state.filters.orcamento,
        categoria: state.filters.categoria,
        searchTerm: state.searchTerm
      });
    } else {
      summaryContainer.innerHTML = '';
    }
  }

  container.innerHTML = renderEntries(limitedEntries);
  updateSearchResults();
}

/**
 * Verifica se há pelo menos um filtro aplicado (decide se mostra o resumo)
 */
function hasActiveFilters(): boolean {
  if (state.searchTerm && state.searchTerm.trim() !== '') return true;
  const f = state.filters;
  return Boolean(f.conta || f.dataInicio || f.dataFim || f.orcamento || f.categoria);
}

// ============================================================================
// Event Handlers
// ============================================================================

function handleSortChange(sortType: SortType): void {
  state.sortBy = sortType;
  loadEntries();
}

function handleShowConsolidatedChange(show: boolean): void {
  state.showConsolidated = show;
  loadEntries();
}

function handleShowFutureChange(show: boolean): void {
  state.showFuture = show;
  loadEntries();
}

/**
 * Manipula pesquisa (com debounce pra não spammar o backend)
 */
function handleSearch(searchTerm: string): void {
  state.searchTerm = searchTerm.trim();

  if (searchTimer !== null) {
    window.clearTimeout(searchTimer);
  }

  searchTimer = window.setTimeout(() => {
    loadEntries();
  }, 400);
}

function clearSearch(): void {
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  if (searchInput) {
    searchInput.value = '';
  }
  state.searchTerm = '';
  loadEntries();
}

// ============================================================================
// Gerenciamento do painel de filtros
// ============================================================================

function openFilterPanel(): void {
  const panel = document.getElementById('filterPanel');
  const fabButton = document.getElementById('openFilterPanel');

  if (panel && fabButton) {
    panel.setAttribute('aria-hidden', 'false');
    fabButton.classList.add('active');
    state.filterPanelOpen = true;

    // Foca no primeiro campo do formulário
    setTimeout(() => {
      const firstInput = panel.querySelector('select, input') as HTMLElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 300);
  }
}

function closeFilterPanel(): void {
  const panel = document.getElementById('filterPanel');
  const fabButton = document.getElementById('openFilterPanel');

  if (panel && fabButton) {
    panel.setAttribute('aria-hidden', 'true');
    fabButton.classList.remove('active');
    state.filterPanelOpen = false;
  }
}

/**
 * Popula as opções de conta no filtro (opções vindas do backend)
 */
function populateContaFilter(): void {
  const select = document.getElementById('filterConta') as HTMLSelectElement;
  if (!select) return;

  const defaultOption = select.options[0];
  select.innerHTML = '';
  select.appendChild(defaultOption);

  state.meta.contas.forEach(conta => {
    const option = document.createElement('option');
    option.value = conta;
    option.textContent = conta;
    if (state.filters.conta === conta) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

/**
 * Popula as opções de orçamento no filtro (opções vindas do backend)
 */
function populateOrcamentoFilter(): void {
  const select = document.getElementById('filterOrcamento') as HTMLSelectElement;
  if (!select) return;

  const defaultOption = select.options[0];
  select.innerHTML = '';
  select.appendChild(defaultOption);

  // O backend já devolve do mais recente pro mais antigo
  state.meta.orcamentos.forEach(orc => {
    const option = document.createElement('option');
    option.value = orc.key;
    option.textContent = orc.labelMes || orc.label;
    if (state.filters.orcamento === orc.key) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

/**
 * Popula as opções de categoria no filtro (opções vindas do backend)
 */
function populateCategoriaFilter(): void {
  const select = document.getElementById('filterCategoria') as HTMLSelectElement;
  if (!select) return;

  const defaultOption = select.options[0];
  select.innerHTML = '';
  select.appendChild(defaultOption);

  state.meta.categorias.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    if (state.filters.categoria === cat) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

/**
 * Aplica os filtros do formulário (o filtro real é feito no backend)
 */
function applyFilters(): void {
  const contaSelect = document.getElementById('filterConta') as HTMLSelectElement;
  const dataInicioInput = document.getElementById('filterDataInicio') as HTMLInputElement;
  const dataFimInput = document.getElementById('filterDataFim') as HTMLInputElement;
  const categoriaSelect = document.getElementById('filterCategoria') as HTMLSelectElement;
  const orcamentoSelect = document.getElementById('filterOrcamento') as HTMLSelectElement;

  if (contaSelect) state.filters.conta = contaSelect.value;
  if (dataInicioInput) state.filters.dataInicio = dataInicioInput.value;
  if (dataFimInput) state.filters.dataFim = dataFimInput.value;
  if (categoriaSelect) state.filters.categoria = categoriaSelect.value;
  if (orcamentoSelect) state.filters.orcamento = orcamentoSelect.value;

  closeFilterPanel();

  const activeFiltersCount = [
    state.filters.conta,
    state.filters.dataInicio,
    state.filters.dataFim,
    state.filters.categoria,
    state.filters.orcamento
  ].filter(f => f).length;

  loadEntries();

  if (activeFiltersCount > 0) {
    showMessage(`${activeFiltersCount} filtro(s) aplicado(s)`, 'success');
  }
}

/**
 * Limpa todos os filtros
 */
function clearFilters(): void {
  state.filters = {
    conta: '',
    dataInicio: '',
    dataFim: '',
    orcamento: '',
    categoria: ''
  };

  const contaSelect = document.getElementById('filterConta') as HTMLSelectElement;
  const dataInicioInput = document.getElementById('filterDataInicio') as HTMLInputElement;
  const dataFimInput = document.getElementById('filterDataFim') as HTMLInputElement;
  const categoriaSelect = document.getElementById('filterCategoria') as HTMLSelectElement;
  const orcamentoSelect = document.getElementById('filterOrcamento') as HTMLSelectElement;

  if (contaSelect) contaSelect.value = '';
  if (dataInicioInput) dataInicioInput.value = '';
  if (dataFimInput) dataFimInput.value = '';
  if (categoriaSelect) categoriaSelect.value = '';
  if (orcamentoSelect) orcamentoSelect.value = '';

  closeFilterPanel();

  loadEntries();

  showMessage('Filtros limpos', 'info');
}

// ============================================================================
// Funções globais para botões
// ============================================================================

/**
 * Edita um lançamento
 */
function editEntry(rowIndex: number): void {
  const entry = state.entries.find(e => e.rowIndex === rowIndex);
  if (entry) {
    openEditEntryModal(entry);
  } else {
    console.error('Lançamento não encontrado:', rowIndex);
  }
}

/**
 * Copia um lançamento (abre modal de adicionar com dados pré-preenchidos)
 */
function copyEntry(rowIndex: number): void {
  const entry = state.entries.find(e => e.rowIndex === rowIndex);
  if (entry) {
    // Remove rowIndex e prepara dados para cópia
    // (a data-chave vai pronta do backend em `orcamentoInput`)
    const dataToCopy: Partial<SheetEntry> = {
      conta: entry.conta,
      valor: entry.valor,
      descricao: entry.descricao,
      categoria: entry.categoria,
      orcamentoInput: entry.orcamentoInput,
      obs: entry.obs
    };
    // Data será definida como atual no modal
    openEntryModalWithData(dataToCopy);
  } else {
    console.error('Lançamento não encontrado para copiar:', rowIndex);
  }
}

// ============================================================================
// Gerenciamento do Modal de Exclusão
// ============================================================================

let pendingDeleteRowIndex: number | null = null;

/**
 * Abre o modal de confirmação de exclusão
 */
function openDeleteModal(rowIndex: number): void {
  const entry = state.entries.find(e => e.rowIndex === rowIndex);
  if (!entry) {
    console.error('Lançamento não encontrado:', rowIndex);
    return;
  }

  pendingDeleteRowIndex = rowIndex;

  // Preenche os dados no modal
  const deleteRowNumber = document.getElementById('deleteRowNumber');
  const deleteDate = document.getElementById('deleteDate');
  const deleteValue = document.getElementById('deleteValue');
  const deleteDescription = document.getElementById('deleteDescription');

  if (deleteRowNumber) deleteRowNumber.textContent = String(entry.rowIndex || '-');
  if (deleteDate) deleteDate.textContent = entry.dataLabel || '-';
  if (deleteValue) {
    deleteValue.textContent = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(entry.valor);
  }
  if (deleteDescription) deleteDescription.textContent = entry.descricao || '-';

  // Exibe o modal
  const deleteModal = document.getElementById('deleteModal');
  if (deleteModal) {
    deleteModal.style.display = 'flex';
  }
}

/**
 * Fecha o modal de confirmação de exclusão
 */
function closeDeleteModal(): void {
  pendingDeleteRowIndex = null;

  const deleteModal = document.getElementById('deleteModal');
  if (deleteModal) {
    deleteModal.style.display = 'none';
  }
}

/**
 * Confirma e executa a exclusão do lançamento
 */
async function confirmDelete(): Promise<void> {
  if (pendingDeleteRowIndex === null) {
    console.error('Nenhum lançamento pendente para exclusão');
    return;
  }

  const rowIndex = pendingDeleteRowIndex;
  const deleteConfirmBtn = document.getElementById('deleteConfirmBtn') as HTMLButtonElement;

  // Desabilita o botão durante o processo
  if (deleteConfirmBtn) {
    deleteConfirmBtn.disabled = true;
    deleteConfirmBtn.textContent = 'Excluindo...';
  }

  try {
    await lancamentosService.deleteEntry(rowIndex);
    showMessage('Lançamento excluído com sucesso', 'success');
    closeDeleteModal();
    await loadEntries(true);
  } catch (error: any) {
    console.error('Erro ao deletar lançamento:', error);
    showMessage('Erro ao deletar lançamento: ' + error.message, 'error');
  } finally {
    // Reabilita o botão
    if (deleteConfirmBtn) {
      deleteConfirmBtn.disabled = false;
      deleteConfirmBtn.textContent = 'Excluir';
    }
  }
}

/**
 * Deleta um lançamento (abre o modal de confirmação)
 */
function deleteEntry(rowIndex: number): void {
  openDeleteModal(rowIndex);
}

// Expõe funções globalmente para uso nos botões
(window as any).editEntry = editEntry;
(window as any).copyEntry = copyEntry;
(window as any).deleteEntry = deleteEntry;
(window as any).lancamentosManager = {
  closeDeleteModal,
  confirmDelete,
  // Stubs para funções do split modal (funcionalidade futura)
  closeSplitModal: () => {
    const splitModal = document.getElementById('splitModal');
    if (splitModal) splitModal.style.display = 'none';
  },
  confirmSplit: () => {
    console.warn('Funcionalidade de divisão de parcelas não implementada');
  }
};

// ============================================================================
// Inicialização
// ============================================================================

async function init(): Promise<void> {
  console.log('[Lançamentos] Inicializando página...');

  // Verifica se o token é válido no início
  const isTokenValid = await verifyTokenValidity();
  if (!isTokenValid) {
    console.warn('⚠️ Token inválido ou usuário não autenticado');
    return;
  }

  // Renderiza menu do usuário
  renderUserMenu();

  // Inicializa modal de adicionar lançamento
  await initEntryModal((result) => {
    console.log('✅ Lançamento adicionado:', result);
    loadEntries(true);
  });

  // Inicializa modal de edição
  await initEditEntryModal((result) => {
    console.log('✅ Lançamento editado:', result);
    loadEntries(true);
  });

  // Inicializa modal de lançamento futuro
  await initFutureEntryModal((result) => {
    console.log('✅ Lançamento futuro adicionado:', result);
    loadEntries(true);
  });

  // Inicializa modal de transferência
  await initTransferEntryModal((result) => {
    console.log('✅ Transferência realizada:', result);
    loadEntries(true);
  });

  // Inicializa modal de ajuste de saldo
  await initBalanceAdjustModal((result) => {
    console.log('✅ Saldo ajustado:', result);
    loadEntries(true);
  });

  // Inicializa o menu FAB com as opções
  initFabMenu(
    () => openEntryModal(),         // Receita/despesa
    () => openFutureEntryModal(),   // Lançamento futuro
    () => openTransferEntryModal(), // Transferência
    () => openBalanceAdjustModal()  // Ajuste de saldo
  );

  // Configura botão de adicionar do header (se existir)
  const addBtn = document.getElementById('openAddEntryModalBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      console.log('🔓 Abrindo modal de adicionar lançamento...');
      openEntryModal();
    });
  }

  // Configura botão de atualizar
  const refreshBtn = document.getElementById('refreshEntriesBtn') as HTMLButtonElement;
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      console.log('🔄 Atualizando lançamentos (forceRefresh=true)...');

      // Desabilita botão e mostra loader
      const originalText = refreshBtn.innerHTML;
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '⏳ Atualizando...';

      try {
        await loadEntries(true); // força atualização do cache
      } finally {
        // Restaura botão
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = originalText;
      }
    });
  }

  // Configura pesquisa
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearch((e.target as HTMLInputElement).value);
    });
  }

  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      clearSearch();
    });
  }

  // Configura ordenação
  const sortSelect = document.getElementById('sortSelect') as HTMLSelectElement;
  if (sortSelect) {
    sortSelect.value = state.sortBy;
    sortSelect.addEventListener('change', (e) => {
      handleSortChange((e.target as HTMLSelectElement).value as SortType);
    });
  }

  // Configura checkbox de lançamentos consolidados
  const showConsolidatedCheck = document.getElementById('showConsolidatedCheck') as HTMLInputElement;
  if (showConsolidatedCheck) {
    showConsolidatedCheck.checked = state.showConsolidated;
    showConsolidatedCheck.addEventListener('change', (e) => {
      handleShowConsolidatedChange((e.target as HTMLInputElement).checked);
    });
  }

  // Configura checkbox de lançamentos futuros
  const showFutureCheck = document.getElementById('showFutureCheck') as HTMLInputElement;
  if (showFutureCheck) {
    showFutureCheck.checked = state.showFuture;
    showFutureCheck.addEventListener('change', (e) => {
      handleShowFutureChange((e.target as HTMLInputElement).checked);
    });
  }

  // Configura painel de filtros
  const openFilterBtn = document.getElementById('openFilterPanel');
  if (openFilterBtn) {
    openFilterBtn.addEventListener('click', () => {
      console.log('🔍 Abrindo painel de filtros...');
      openFilterPanel();
    });
  }

  const closeFilterBtn = document.getElementById('closeFilterPanel');
  if (closeFilterBtn) {
    closeFilterBtn.addEventListener('click', () => {
      console.log('❌ Fechando painel de filtros...');
      closeFilterPanel();
    });
  }

  const filterOverlay = document.getElementById('filterPanelOverlay');
  if (filterOverlay) {
    filterOverlay.addEventListener('click', () => {
      console.log('🖱️ Clique no overlay - fechando painel de filtros...');
      closeFilterPanel();
    });
  }

  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      console.log('✅ Aplicando filtros...');
      applyFilters();
    });
  }

  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      console.log('🧹 Limpando filtros...');
      clearFilters();
    });
  }

  // Fecha painel com tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.filterPanelOpen) {
      closeFilterPanel();
    }
  });

  // Escuta evento de entrada editada
  document.addEventListener('entry:edited', () => {
    console.log('📝 Entrada editada, recarregando...');
    setTimeout(() => {
      loadEntries(true);
    }, 300);
  });

  // Carrega lançamentos
  await loadEntries();

  // Atualiza autocomplete do modal de edição quando entradas são carregadas
  setEditModalEntries(state.entries);

  // Verifica se há parâmetros de filtro na URL
  applyUrlFilters();

  console.log('✅ Página de lançamentos inicializada');
}

/**
 * Aplica filtros baseados nos parâmetros da URL
 */
function applyUrlFilters(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const conta = urlParams.get('conta');
  const categoria = urlParams.get('categoria');

  if (conta) {
    console.log('[Lançamentos] Filtrando por conta:', conta);
    handleSearch(conta);
  } else if (categoria) {
    console.log('[Lançamentos] Filtrando por categoria:', categoria);
    handleSearch(categoria);
  }

  // Preenche o campo de busca se houver filtro
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  if (searchInput && (conta || categoria)) {
    searchInput.value = conta || categoria || '';
  }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
