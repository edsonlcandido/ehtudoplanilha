/**
 * Página de Lançamentos
 * Gerencia a lista de lançamentos e modais
 */

import { renderUserMenu } from '../components/user-menu';
import { initEntryModal, openEntryModal, closeEntryModal } from '../components/entry-modal';
import { initEditEntryModal, openEditEntryModal, setEditModalEntries } from '../components/edit-entry-modal';
import { renderEntries } from '../components/lancamentos-list';
import lancamentosService from '../services/lancamentos';
import type { SortType, LancamentosState } from '../types';

// ============================================================================
// Estado da aplicação
// ============================================================================

const state: LancamentosState = {
  entries: [],
  filteredEntries: [],
  originalEntries: [],
  searchTerm: '',
  sortBy: 'original',
  hideBlankDates: true,
  isLoading: false
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
 * Mostra mensagem de feedback
 */
function showMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const container = document.getElementById('messageContainer');
  if (!container) return;

  const messageEl = document.createElement('div');
  messageEl.className = `lancamentos__message lancamentos__message--${type}`;
  messageEl.textContent = message;

  container.innerHTML = '';
  container.appendChild(messageEl);

  setTimeout(() => {
    messageEl.remove();
  }, 5000);
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
 */
async function loadEntries(): Promise<void> {
  if (state.isLoading) return;

  state.isLoading = true;
  state.entries = [];
  renderEntriesList();
  showLoading();

  try {
    const response = await lancamentosService.fetchEntries(100);
    const rawEntries = response.entries || [];
    
    // Filtra entradas em branco
    const cleaned = rawEntries.filter(e => !lancamentosService.isBlankEntry(e));
    
    // Backend retorna dados já no formato correto
    // lancamentos-list.ts encarrega de exibir corretamente
    state.originalEntries = cleaned;
    state.entries = [...state.originalEntries];

    applySortingAndFilters();
    showMessage('Lançamentos carregados com sucesso', 'success');
  } catch (error: any) {
    console.error('Erro ao carregar lançamentos:', error);
    showMessage('Erro ao carregar lançamentos: ' + error.message, 'error');
    state.entries = [];
    state.filteredEntries = [];
    renderEntriesList();
  } finally {
    state.isLoading = false;
    hideLoading();
  }
}

/**
 * Aplica ordenação e filtros
 */
function applySortingAndFilters(): void {
  // Base para aplicar filtros
  let viewEntries = [...state.originalEntries];

  // Filtra datas em branco se habilitado
  if (state.hideBlankDates) {
    viewEntries = viewEntries.filter(entry => {
      if (entry.data === null || entry.data === undefined) return false;
      if (typeof entry.data === 'string') {
        const trimmed = entry.data.trim();
        if (trimmed === '') return false;
      }
      return true;
    });
  }

  // Ordena conforme configuração
  viewEntries = lancamentosService.sortEntries(viewEntries, state.sortBy);

  // Aplica pesquisa
  if (state.searchTerm) {
    viewEntries = lancamentosService.filterEntries(viewEntries, state.searchTerm);
  }

  state.filteredEntries = viewEntries;
  state.entries = state.sortBy === 'original' 
    ? [...state.originalEntries]
    : lancamentosService.sortEntries([...state.originalEntries], state.sortBy);

  renderEntriesList();
  updateSearchResults();
}

/**
 * Renderiza lista de lançamentos
 */
function renderEntriesList(): void {
  const container = document.getElementById('entriesContainer');
  if (!container) return;

  const entriesToRender = state.searchTerm ? state.filteredEntries : state.filteredEntries.length > 0 ? state.filteredEntries : state.entries;
  container.innerHTML = renderEntries(entriesToRender);
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
 * Manipula mudança de ocultar datas em branco
 */
function handleHideBlankDatesChange(hide: boolean): void {
  state.hideBlankDates = hide;
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
 * Deleta um lançamento
 */
async function deleteEntry(rowIndex: number): Promise<void> {
  const entry = state.entries.find(e => e.rowIndex === rowIndex);
  if (!entry) {
    console.error('Lançamento não encontrado:', rowIndex);
    return;
  }

  if (!confirm(`Tem certeza que deseja excluir o lançamento?\n\nDescrição: ${entry.descricao}\nValor: R$ ${entry.valor}`)) {
    return;
  }

  try {
    await lancamentosService.deleteEntry(rowIndex);
    showMessage('Lançamento excluído com sucesso', 'success');
    await loadEntries();
  } catch (error: any) {
    console.error('Erro ao deletar lançamento:', error);
    showMessage('Erro ao deletar lançamento: ' + error.message, 'error');
  }
}

// Expõe funções globalmente para uso nos botões
(window as any).editEntry = editEntry;
(window as any).deleteEntry = deleteEntry;

// ============================================================================
// Inicialização
// ============================================================================

async function init(): Promise<void> {
  console.log('[Lançamentos] Inicializando página...');

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

  // Configura botões de adicionar (header e FAB)
  const addBtn = document.getElementById('openAddEntryModalBtn');
  const fabBtn = document.getElementById('openEntryModal');
  
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      console.log('🔓 Abrindo modal de adicionar lançamento...');
      openEntryModal();
    });
  }
  
  if (fabBtn) {
    fabBtn.addEventListener('click', () => {
      console.log('🔓 Toggle modal de adicionar lançamento (FAB)...');
      const modal = document.getElementById('entryModal');
      const isOpen = modal?.style.display === 'flex';
      
      if (isOpen) {
        closeEntryModal();
      } else {
        openEntryModal();
      }
    });
  }

  // Configura botão de atualizar
  const refreshBtn = document.getElementById('refreshEntriesBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      console.log('🔄 Atualizando lançamentos...');
      loadEntries();
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

  // Configura checkbox de ocultar datas em branco
  const hideBlankDatesCheck = document.getElementById('hideBlankDatesCheck') as HTMLInputElement;
  if (hideBlankDatesCheck) {
    hideBlankDatesCheck.checked = state.hideBlankDates;
    hideBlankDatesCheck.addEventListener('change', (e) => {
      handleHideBlankDatesChange((e.target as HTMLInputElement).checked);
    });
  }

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
  setEditModalEntries(state.entries);

  console.log('✅ Página de lançamentos inicializada');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

