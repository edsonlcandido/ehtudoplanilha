/**
 * Página de Lançamentos
 * Gerencia a lista de lançamentos e modais
 */

import { verifyTokenValidity } from '../services/auth';
import { renderUserMenu } from '../components/user-menu';
import { initEntryModal, openEntryModal, openEntryModalWithData } from '../components/entry-modal';
import { initEditEntryModal, openEditEntryModal, setEditModalEntries } from '../components/edit-entry-modal';
import { initFutureEntryModal, openFutureEntryModal } from '../components/future-entry-modal';
import { initTransferEntryModal, openTransferEntryModal } from '../components/transfer-entry-modal';
import { initFabMenu } from '../components/fab-menu';
import { renderEntries } from '../components/lancamentos-list';
import lancamentosService from '../services/lancamentos';
import type { SortType, LancamentosState, SheetEntry } from '../types';
import { excelSerialToDateTimeLabel, excelSerialToDate } from '../utils/date-helpers';
import { showSuccessToast, showErrorToast, showInfoToast } from '../components/toast';

// ============================================================================
// Estado da aplicação
// ============================================================================

const state: LancamentosState = {
  entries: [],
  filteredEntries: [],
  originalEntries: [],
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

// ============================================================================
// Funções de UI
// ============================================================================

/**
 * Mostra indicador de loading
 */
function showLoading(): void {
  const indicator = document.getElementById('loadingIndicator');
  if (indicator) {
    indicator.style.display = 'flex';
  }
}

/**
 * Esconde indicador de loading
 */
function hideLoading(): void {
  const indicator = document.getElementById('loadingIndicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

/**
 * Mostra mensagem de feedback usando toast
 */
function showMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  if (type === 'success') {
    showSuccessToast(message);
  } else if (type === 'error') {
    showErrorToast(message);
  } else {
    showInfoToast(message, 'Info');
  }
}

/**
 * Atualiza resultados de pesquisa
 */
function updateSearchResults(): void {
  const searchResults = document.getElementById('searchResults');
  const searchCount = document.getElementById('searchCount');
  const clearBtn = document.getElementById('clearSearchBtn');

  if (!searchResults || !searchCount || !clearBtn) return;

  if (state.searchTerm) {
    searchCount.textContent = `${state.filteredEntries.length} resultado(s) encontrado(s)`;
    searchResults.classList.add('lancamentos__search-results--visible');
    clearBtn.style.display = 'flex';
  } else {
    searchResults.classList.remove('lancamentos__search-results--visible');
    clearBtn.style.display = 'none';
  }
}

// ============================================================================
// Funções de gerenciamento de dados
// ============================================================================

/**
 * Carrega lançamentos da planilha
 * @param forceRefresh - Se true, ignora cache e busca do servidor
 */
async function loadEntries(forceRefresh = false): Promise<void> {
  if (state.isLoading) return;

  state.isLoading = true;
  state.entries = [];
  renderEntriesList();
  
  // Só mostra o loader grande se não for refresh manual (botão)
  if (!forceRefresh) {
    showLoading();
  }

  try {
    const response = await lancamentosService.fetchEntries(0, forceRefresh);
    const rawEntries = response.entries || [];
    
    // Filtra entradas em branco
    const cleaned = rawEntries.filter(e => !lancamentosService.isBlankEntry(e));
    
    // Backend retorna dados já no formato correto
    // lancamentos-list.ts encarrega de exibir corretamente
    state.originalEntries = cleaned;
    state.entries = [...state.originalEntries];

    // Popula os filtros com as opções disponíveis
    populateContaFilter();
    populateOrcamentoFilter();
    populateCategoriaFilter();

    applySortingAndFilters();
    
    const cacheMsg = forceRefresh ? ' (cache atualizado)' : '';
    showMessage('Lançamentos carregados com sucesso' + cacheMsg, 'success');
  } catch (error: any) {
    console.error('Erro ao carregar lançamentos:', error);
    showMessage('Erro ao carregar lançamentos: ' + error.message, 'error');
    state.entries = [];
    state.filteredEntries = [];
    renderEntriesList();
  } finally {
    state.isLoading = false;
    
    // Só esconde o loader grande se não for refresh manual
    if (!forceRefresh) {
      hideLoading();
    }
  }
}

/**
 * Aplica ordenação e filtros
 */
function applySortingAndFilters(): void {
  // Base para aplicar filtros
  let viewEntries = [...state.originalEntries];

  // Aplica filtros avançados PRIMEIRO
  viewEntries = applyAdvancedFilters(viewEntries);

  // Aplica pesquisa (busca nas entradas já filtradas)
  if (state.searchTerm) {
    viewEntries = lancamentosService.filterEntries(viewEntries, state.searchTerm);
  }

  // Filtra por tipo de lançamento (consolidado/futuro)
  viewEntries = viewEntries.filter(entry => {
    const hasDate = entry.data !== null 
      && entry.data !== undefined 
      && !(typeof entry.data === 'string' && entry.data.trim() === '');
    
    // Se tem data, é consolidado; se não tem, é futuro
    if (hasDate) {
      return state.showConsolidated;
    } else {
      return state.showFuture;
    }
  });

  // Ordena conforme configuração
  viewEntries = lancamentosService.sortEntries(viewEntries, state.sortBy);

  state.filteredEntries = viewEntries;
  state.entries = viewEntries; // Atualiza state.entries com as entradas filtradas

  renderEntriesList();
  updateSearchResults();
}

/**
 * Renderiza lista de lançamentos
 */
function renderEntriesList(): void {
  const container = document.getElementById('entriesContainer');
  if (!container) return;

  // Sempre usa filteredEntries, que já contém o resultado dos filtros aplicados
  const entriesToRender = state.filteredEntries;
  
  // Limita aos 100 primeiros itens
  const limitedEntries = entriesToRender.slice(0, 100);
  
  container.innerHTML = renderEntries(limitedEntries);
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Manipula mudança de ordenação
 */
function handleSortChange(sortType: SortType): void {
  state.sortBy = sortType;
  applySortingAndFilters();
}

/**
 * Manipula mudança de checkbox de lançamentos consolidados
 */
function handleShowConsolidatedChange(show: boolean): void {
  state.showConsolidated = show;
  applySortingAndFilters();
}

/**
 * Manipula mudança de checkbox de lançamentos futuros
 */
function handleShowFutureChange(show: boolean): void {
  state.showFuture = show;
  applySortingAndFilters();
}

/**
 * Manipula pesquisa
 */
function handleSearch(searchTerm: string): void {
  state.searchTerm = searchTerm.trim();
  applySortingAndFilters();
}

/**
 * Limpa pesquisa
 */
function clearSearch(): void {
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  if (searchInput) {
    searchInput.value = '';
  }
  state.searchTerm = '';
  applySortingAndFilters();
}

// ============================================================================
// Funções de gerenciamento do painel de filtros
// ============================================================================

/**
 * Abre o painel de filtros
 */
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

/**
 * Fecha o painel de filtros
 */
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
 * Popula as opções de conta no filtro
 */
function populateContaFilter(): void {
  const select = document.getElementById('filterConta') as HTMLSelectElement;
  if (!select) return;

  // Extrai contas únicas dos lançamentos
  const contas = new Set<string>();
  state.originalEntries.forEach(entry => {
    if (entry.conta && entry.conta.trim()) {
      contas.add(entry.conta.trim());
    }
  });

  // Ordena alfabeticamente
  const sortedContas = Array.from(contas).sort();

  // Mantém a opção "Todas as contas"
  const defaultOption = select.options[0];
  select.innerHTML = '';
  select.appendChild(defaultOption);

  // Adiciona as opções
  sortedContas.forEach(conta => {
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
 * Popula as opções de orçamento no filtro
 */
function populateOrcamentoFilter(): void {
  const select = document.getElementById('filterOrcamento') as HTMLSelectElement;
  if (!select) return;

  // Extrai orçamentos únicos dos lançamentos
  const orcamentos = new Set<string>();
  state.originalEntries.forEach(entry => {
    if (entry.orcamento) {
      let orcamentoStr = '';
      if (typeof entry.orcamento === 'number') {
        // Converte número Excel para string de data
        const date = excelSerialToDate(entry.orcamento);
        if (date) {
          orcamentoStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        }
      } else if (typeof entry.orcamento === 'string') {
        orcamentoStr = entry.orcamento.trim();
      }
      if (orcamentoStr) {
        orcamentos.add(orcamentoStr);
      }
    }
  });

  // Ordena
  const sortedOrcamentos = Array.from(orcamentos).sort().reverse(); // Mais recentes primeiro

  // Mantém a opção "Todos os orçamentos"
  const defaultOption = select.options[0];
  select.innerHTML = '';
  select.appendChild(defaultOption);

  // Adiciona as opções
  sortedOrcamentos.forEach(orc => {
    const option = document.createElement('option');
    option.value = orc;
    option.textContent = orc;
    if (state.filters.orcamento === orc) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

/**
 * Popula as opções de categoria no filtro
 */
function populateCategoriaFilter(): void {
  const select = document.getElementById('filterCategoria') as HTMLSelectElement;
  if (!select) return;

  const categorias = new Set<string>();
  state.originalEntries.forEach(entry => {
    if (entry.categoria && entry.categoria.trim()) {
      categorias.add(entry.categoria.trim());
    }
  });

  const sortedCategorias = Array.from(categorias).sort();

  const defaultOption = select.options[0];
  select.innerHTML = '';
  select.appendChild(defaultOption);

  sortedCategorias.forEach(cat => {
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
 * Aplica os filtros avançados
 */
function applyAdvancedFilters(entries: SheetEntry[]): SheetEntry[] {
  let filtered = [...entries];

  // Filtro por conta
  if (state.filters.conta) {
    filtered = filtered.filter(entry => 
      entry.conta && entry.conta.trim() === state.filters.conta
    );
  }

  // Filtro por data (intervalo)
  if (state.filters.dataInicio || state.filters.dataFim) {
    filtered = filtered.filter(entry => {
      if (!entry.data) return false;

      let entryDate: Date | null = null;
      if (typeof entry.data === 'number') {
        entryDate = excelSerialToDate(entry.data);
        if (entryDate) {
          // Normaliza para meia-noite do dia
          entryDate.setHours(0, 0, 0, 0);
        }
      } else if (typeof entry.data === 'string') {
        // Tenta parsear string de data no formato DD/MM/YYYY HH:mm
        const parts = entry.data.split(' ')[0].split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          entryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          // Normaliza para meia-noite do dia
          entryDate.setHours(0, 0, 0, 0);
        }
      }

      if (!entryDate || isNaN(entryDate.getTime())) return false;

      // Verifica data início
      if (state.filters.dataInicio) {
        // Cria data a partir do input (formato YYYY-MM-DD)
        const [year, month, day] = state.filters.dataInicio.split('-').map(Number);
        const dataInicio = new Date(year, month - 1, day);
        dataInicio.setHours(0, 0, 0, 0);
        if (entryDate < dataInicio) return false;
      }

      // Verifica data fim
      if (state.filters.dataFim) {
        // Cria data a partir do input (formato YYYY-MM-DD)
        const [year, month, day] = state.filters.dataFim.split('-').map(Number);
        const dataFim = new Date(year, month - 1, day);
        dataFim.setHours(23, 59, 59, 999);
        if (entryDate > dataFim) return false;
      }

      return true;
    });
  }

  // Filtro por categoria
  if (state.filters.categoria) {
    filtered = filtered.filter(entry =>
      entry.categoria && entry.categoria.trim() === state.filters.categoria
    );
  }

  // Filtro por orçamento
  if (state.filters.orcamento) {
    filtered = filtered.filter(entry => {
      if (!entry.orcamento) return false;

      let orcamentoStr = '';
      if (typeof entry.orcamento === 'number') {
        const date = excelSerialToDate(entry.orcamento);
        if (date) {
          orcamentoStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        }
      } else if (typeof entry.orcamento === 'string') {
        orcamentoStr = entry.orcamento.trim();
      }

      return orcamentoStr === state.filters.orcamento;
    });
  }

  return filtered;
}

/**
 * Aplica os filtros do formulário
 */
function applyFilters(): void {
  const contaSelect = document.getElementById('filterConta') as HTMLSelectElement;
  const dataInicioInput = document.getElementById('filterDataInicio') as HTMLInputElement;
  const dataFimInput = document.getElementById('filterDataFim') as HTMLInputElement;
  const categoriaSelect = document.getElementById('filterCategoria') as HTMLSelectElement;
  const orcamentoSelect = document.getElementById('filterOrcamento') as HTMLSelectElement;

  // Atualiza o estado com os valores dos filtros
  if (contaSelect) state.filters.conta = contaSelect.value;
  if (dataInicioInput) state.filters.dataInicio = dataInicioInput.value;
  if (dataFimInput) state.filters.dataFim = dataFimInput.value;
  if (categoriaSelect) state.filters.categoria = categoriaSelect.value;
  if (orcamentoSelect) state.filters.orcamento = orcamentoSelect.value;

  // Fecha o painel
  closeFilterPanel();

  // Aplica os filtros
  applySortingAndFilters();

  // Mostra mensagem de feedback
  const activeFiltersCount = [
    state.filters.conta,
    state.filters.dataInicio,
    state.filters.dataFim,
    state.filters.categoria,
    state.filters.orcamento
  ].filter(f => f).length;

  if (activeFiltersCount > 0) {
    showMessage(`${activeFiltersCount} filtro(s) aplicado(s)`, 'success');
  }
}

/**
 * Limpa todos os filtros
 */
function clearFilters(): void {
  // Limpa o estado
  state.filters = {
    conta: '',
    dataInicio: '',
    dataFim: '',
    orcamento: '',
    categoria: ''
  };

  // Limpa os campos do formulário
  const contaSelect = document.getElementById('filterConta') as HTMLSelectElement;
  const dataInicioInput = document.getElementById('filterDataInicio') as HTMLInputElement;
  const dataFimInput = document.getElementById('filterDataFim') as HTMLInputElement;
  const orcamentoSelect = document.getElementById('filterOrcamento') as HTMLSelectElement;
  const categoriaSelect = document.getElementById('filterCategoria') as HTMLSelectElement;

  if (contaSelect) contaSelect.value = '';
  if (dataInicioInput) dataInicioInput.value = '';
  if (dataFimInput) dataFimInput.value = '';
  if (orcamentoSelect) orcamentoSelect.value = '';
  if (categoriaSelect) categoriaSelect.value = '';

  // Fecha o painel
  closeFilterPanel();

  // Reaplica os filtros (agora sem filtros avançados)
  applySortingAndFilters();

  showMessage('Filtros limpos', 'info');
}

// ============================================================================
// Funções globais para botões
// ============================================================================

/**
 * Edita um lançamento
 */
function editEntry(rowIndex: number): void {
  const entry = state.originalEntries.find(e => e.rowIndex === rowIndex);
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
  const entry = state.originalEntries.find(e => e.rowIndex === rowIndex);
  if (entry) {
    // Remove rowIndex e prepara dados para cópia
    const dataToCopy: Partial<SheetEntry> = {
      conta: entry.conta,
      valor: entry.valor,
      descricao: entry.descricao,
      categoria: entry.categoria,
      orcamento: entry.orcamento,
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
  const entry = state.originalEntries.find(e => e.rowIndex === rowIndex);
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
  
  // Formata a data corretamente
  if (deleteDate) {
    let formattedDate = '-';
    if (entry.data) {
      if (typeof entry.data === 'number') {
        // Se for número Excel serial, converte para formato brasileiro
        formattedDate = excelSerialToDateTimeLabel(entry.data);
      } else if (typeof entry.data === 'string') {
        // Se já for string, usa como está (já está formatado)
        formattedDate = entry.data;
      }
    }
    deleteDate.textContent = formattedDate;
  }
  
  if (deleteValue) deleteValue.textContent = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(entry.valor);
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
    await loadEntries();
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
    const modal = document.getElementById('splitModal');
    if (modal) modal.style.display = 'none';
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
    loadEntries();
  });

  // Inicializa modal de edição
  await initEditEntryModal((result) => {
    console.log('✅ Lançamento editado:', result);
    loadEntries();
  });

  // Inicializa modal de lançamento futuro
  await initFutureEntryModal((result) => {
    console.log('✅ Lançamento futuro adicionado:', result);
    loadEntries();
  });

  // Inicializa modal de transferência
  await initTransferEntryModal((result) => {
    console.log('✅ Transferência realizada:', result);
    loadEntries();
  });

  // Inicializa o menu FAB com as 3 opções
  initFabMenu(
    () => openEntryModal(),         // Receita/despesa
    () => openFutureEntryModal(),   // Lançamento futuro
    () => openTransferEntryModal()  // Transferência
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
      loadEntries();
    }, 300);
  });

  // Carrega lançamentos
  await loadEntries();

  // Atualiza autocomplete do modal de edição quando entradas são carregadas
  setEditModalEntries(state.originalEntries);

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

