/**
 * Página de Categorias
 * Gerencia a lista de categorias com drag-and-drop, edição e deleção
 */

import { pb } from '../main';
import { verifyTokenValidity } from '../services/auth';
import { API_ENDPOINTS } from '../config/env';
import { renderUserMenu } from '../components/user-menu';
import { showSuccessToast, showErrorToast } from '../components/toast';
import { CacheService, CACHE_KEYS } from '../services/cache';

// ============================================================================
// Tipos
// ============================================================================

interface Category {
  categoria: string;
  tipo: string;
}

interface CategoryComplete {
  categoria: string;
  tipo: string;
  orcamento?: number;
}

interface CategoriesCompleteResponse {
  success: boolean;
  categoriesComplete: CategoryComplete[];
  message?: string;
}

interface PostCategoriesResponse {
  success: boolean;
  message: string;
  count: number;
}

interface CategoriasState {
  categories: Category[];
  isLoading: boolean;
  isSaving: boolean;
  editIndex: number;
  deleteIndex: number;
}

// ============================================================================
// Estado da aplicação
// ============================================================================

const state: CategoriasState = {
  categories: [],
  isLoading: false,
  isSaving: false,
  editIndex: -1,
  deleteIndex: -1
};

// ============================================================================
// Funções de UI
// ============================================================================

/**
 * Mostra indicador de loading
 */
function showLoading(): void {
  const indicator = document.getElementById('loadingIndicator');
  const container = document.getElementById('categoriesContainer');
  if (indicator) indicator.style.display = 'flex';
  if (container) container.style.display = 'none';
}

/**
 * Esconde indicador de loading
 */
function hideLoading(): void {
  const indicator = document.getElementById('loadingIndicator');
  const container = document.getElementById('categoriesContainer');
  if (indicator) indicator.style.display = 'none';
  if (container) container.style.display = 'grid';
}

/**
 * Atualiza status de salvamento
 */
function updateSaveStatus(status: 'saving' | 'saved' | 'error' | 'hidden'): void {
  const statusContainer = document.getElementById('saveStatus');
  const statusText = document.getElementById('saveStatusText');
  
  if (!statusContainer || !statusText) return;
  
  statusContainer.classList.remove('categorias__status--saving', 'categorias__status--saved', 'categorias__status--error');
  
  switch (status) {
    case 'saving':
      statusContainer.style.display = 'flex';
      statusContainer.classList.add('categorias__status--saving');
      statusText.textContent = '⏳ Salvando...';
      break;
    case 'saved':
      statusContainer.style.display = 'flex';
      statusContainer.classList.add('categorias__status--saved');
      statusText.textContent = '✅ Salvo';
      setTimeout(() => updateSaveStatus('hidden'), 2000);
      break;
    case 'error':
      statusContainer.style.display = 'flex';
      statusContainer.classList.add('categorias__status--error');
      statusText.textContent = '❌ Erro ao salvar';
      break;
    case 'hidden':
      statusContainer.style.display = 'none';
      break;
  }
}

/**
 * Renderiza o badge de tipo
 */
function renderTypeBadge(tipo: string): string {
  const tipoUpper = (tipo || '').toUpperCase();
  let badgeClass = 'categoria-card__type-badge--default';
  let label = tipo || 'Não definido';
  
  if (tipoUpper === 'RECEITA') {
    badgeClass = 'categoria-card__type-badge--receita';
    label = 'Receita';
  } else if (tipoUpper === 'DESPESA') {
    badgeClass = 'categoria-card__type-badge--despesa';
    label = 'Despesa';
  }
  
  return `<span class="categoria-card__type-badge ${badgeClass}">${label}</span>`;
}

/**
 * Renderiza a lista de categorias
 */
function renderCategories(): void {
  const container = document.getElementById('categoriesContainer');
  if (!container) return;
  
  if (state.categories.length === 0) {
    container.innerHTML = `
      <div class="categorias__empty" style="grid-column: 1 / -1;">
        <div class="categorias__empty-icon">🏷️</div>
        <p class="categorias__empty-text">Nenhuma categoria encontrada</p>
        <p>Clique em "Nova Categoria" para adicionar a primeira.</p>
      </div>
    `;
    return;
  }
  
  const cardsHTML = state.categories.map((cat, index) => `
    <div class="categoria-card" 
         draggable="true" 
         data-index="${index}">
      <div class="categoria-card__drag-handle" title="Arraste para reordenar">
        ⋮⋮
      </div>
      <div class="categoria-card__content">
        <div class="categoria-card__name">${escapeHtml(cat.categoria)}</div>
        <div class="categoria-card__type">
          ${renderTypeBadge(cat.tipo)}
        </div>
      </div>
      <div class="categoria-card__actions">
        <button class="categoria-card__action categoria-card__action--edit" 
                title="Editar categoria"
                data-action="edit"
                data-index="${index}">
          ✏️
        </button>
        <button class="categoria-card__action categoria-card__action--delete" 
                title="Excluir categoria"
                data-action="delete"
                data-index="${index}">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
  
  // Adiciona o card de adicionar no final
  const addCardHTML = `
    <button class="categorias__add-card" data-action="add">
      <span class="categorias__add-card-icon">➕</span>
      <span>Nova Categoria</span>
    </button>
  `;
  
  container.innerHTML = cardsHTML + addCardHTML;
  
  // Configura drag and drop nos cards
  setupDragAndDrop();
  
  // Configura event delegation para ações
  setupActionHandlers();
}

/**
 * Escapa HTML para evitar XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================================
// Event Delegation para Ações
// ============================================================================

/**
 * Configura event delegation para ações dos cards
 * Usa data attributes ao invés de inline handlers para evitar XSS
 */
function setupActionHandlers(): void {
  const container = document.getElementById('categoriesContainer');
  if (!container) return;
  
  // Remove listener anterior se existir
  container.removeEventListener('click', handleActionClick);
  
  // Adiciona listener com delegation
  container.addEventListener('click', handleActionClick);
}

/**
 * Handler centralizado para clicks nos botões de ação
 */
function handleActionClick(e: Event): void {
  const target = e.target as HTMLElement;
  const button = target.closest('[data-action]') as HTMLElement;
  
  if (!button) return;
  
  const action = button.dataset.action;
  const index = button.dataset.index ? parseInt(button.dataset.index, 10) : -1;
  
  switch (action) {
    case 'edit':
      if (index >= 0) openEditModal(index);
      break;
    case 'delete':
      if (index >= 0) openDeleteModal(index);
      break;
    case 'add':
      openAddModal();
      break;
  }
}

// ============================================================================
// Drag and Drop
// ============================================================================

let draggedIndex: number | null = null;

/**
 * Configura drag and drop nos cards
 */
function setupDragAndDrop(): void {
  const container = document.getElementById('categoriesContainer');
  if (!container) return;
  
  const cards = container.querySelectorAll('.categoria-card[draggable="true"]');
  
  cards.forEach((card) => {
    card.addEventListener('dragstart', handleDragStart as EventListener);
    card.addEventListener('dragend', handleDragEnd as EventListener);
    card.addEventListener('dragover', handleDragOver as EventListener);
    card.addEventListener('dragenter', handleDragEnter as EventListener);
    card.addEventListener('dragleave', handleDragLeave as EventListener);
    card.addEventListener('drop', handleDrop as unknown as EventListener);
  });
}

function handleDragStart(e: DragEvent): void {
  const target = e.currentTarget as HTMLElement;
  draggedIndex = parseInt(target.dataset.index || '-1', 10);
  target.classList.add('categoria-card--dragging');
  
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(draggedIndex));
  }
}

function handleDragEnd(e: DragEvent): void {
  const target = e.currentTarget as HTMLElement;
  target.classList.remove('categoria-card--dragging');
  draggedIndex = null;
  
  // Remove visual de todos os cards
  document.querySelectorAll('.categoria-card--drag-over').forEach(card => {
    card.classList.remove('categoria-card--drag-over');
  });
}

function handleDragOver(e: DragEvent): void {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
}

function handleDragEnter(e: DragEvent): void {
  e.preventDefault();
  const target = e.currentTarget as HTMLElement;
  const targetIndex = parseInt(target.dataset.index || '-1', 10);
  
  if (draggedIndex !== null && targetIndex !== draggedIndex) {
    target.classList.add('categoria-card--drag-over');
  }
}

function handleDragLeave(e: DragEvent): void {
  const target = e.currentTarget as HTMLElement;
  target.classList.remove('categoria-card--drag-over');
}

async function handleDrop(e: DragEvent): Promise<void> {
  e.preventDefault();
  const target = e.currentTarget as HTMLElement;
  target.classList.remove('categoria-card--drag-over');
  
  const targetIndex = parseInt(target.dataset.index || '-1', 10);
  
  if (draggedIndex === null || targetIndex === -1 || draggedIndex === targetIndex) {
    return;
  }
  
  // Reordena o array
  const [removed] = state.categories.splice(draggedIndex, 1);
  state.categories.splice(targetIndex, 0, removed);
  
  // Re-renderiza
  renderCategories();
  
  // Salva automaticamente
  await saveCategories();
}

// ============================================================================
// Funções de API
// ============================================================================

/**
 * Carrega categorias do backend
 */
async function loadCategories(forceRefresh = false): Promise<void> {
  if (state.isLoading) return;
  
  state.isLoading = true;
  showLoading();
  
  try {
    const response = await fetch(`${pb.baseURL}${API_ENDPOINTS.getSheetCategoriesComplete}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${pb.authStore.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data: CategoriesCompleteResponse = await response.json();
    
    if (!response.ok) {
      throw new Error((data as { error?: string }).error || 'Erro ao carregar categorias');
    }
    
    // Mapeia para o formato simplificado (sem orçamento)
    state.categories = (data.categoriesComplete || []).map((cat: CategoryComplete) => ({
      categoria: cat.categoria,
      tipo: cat.tipo
    }));
    
    renderCategories();
    
    if (forceRefresh) {
      showSuccessToast('Categorias atualizadas com sucesso');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao carregar categorias:', error);
    showErrorToast('Erro ao carregar categorias: ' + errorMessage);
    state.categories = [];
    renderCategories();
  } finally {
    state.isLoading = false;
    hideLoading();
  }
}

/**
 * Salva categorias no backend
 */
async function saveCategories(): Promise<boolean> {
  if (state.isSaving) return false;
  
  state.isSaving = true;
  updateSaveStatus('saving');
  
  try {
    const response = await fetch(`${pb.baseURL}${API_ENDPOINTS.postCategories}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pb.authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categories: state.categories
      })
    });
    
    const data: PostCategoriesResponse = await response.json();
    
    if (!response.ok) {
      throw new Error((data as { error?: string }).error || 'Erro ao salvar categorias');
    }
    
    updateSaveStatus('saved');
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao salvar categorias:', error);
    updateSaveStatus('error');
    showErrorToast('Erro ao salvar categorias: ' + errorMessage);
    return false;
  } finally {
    state.isSaving = false;
  }
}

// ============================================================================
// Modal de Adicionar/Editar
// ============================================================================

/**
 * Obtém os tipos únicos das categorias existentes (do cache ou estado atual)
 */
function getUniqueTipos(): string[] {
  // Primeiro, tenta obter do cache de categorias completas
  const cached = CacheService.get<{ categoriesComplete: CategoryComplete[] }>(CACHE_KEYS.SHEET_CATEGORIES_COMPLETE);
  
  let allCategories: { tipo: string }[] = [];
  
  if (cached && cached.categoriesComplete) {
    allCategories = cached.categoriesComplete;
  }
  
  // Também considera as categorias do estado atual (caso tenham sido editadas)
  allCategories = [...allCategories, ...state.categories];
  
  // Extrai tipos únicos (não vazios)
  const tipos = new Set<string>();
  allCategories.forEach(cat => {
    if (cat.tipo && cat.tipo.trim() !== '') {
      tipos.add(cat.tipo.toUpperCase());
    }
  });
  
  // Se não houver nenhum tipo, adiciona opções padrão
  if (tipos.size === 0) {
    tipos.add('RECEITA');
    tipos.add('DESPESA');
  }
  
  // Converte para array e ordena
  return Array.from(tipos).sort();
}

/**
 * Garante que o container de sugestões existe
 */
function ensureSuggestionsContainer(): HTMLDivElement {
  const field = document.querySelector('.categoria-modal__field--autocomplete');
  if (!field) {
    throw new Error('Campo de autocomplete não encontrado');
  }

  let container = document.getElementById('typeSuggestions') as HTMLDivElement;
  if (!container) {
    container = document.createElement('div');
    container.id = 'typeSuggestions';
    container.classList.add('categoria-modal__suggestions');
    container.setAttribute('role', 'listbox');
    field.appendChild(container);
  }
  return container;
}

/**
 * Mostra todas as sugestões de tipo
 */
function showAllTypeSuggestions(input: HTMLInputElement, container: HTMLDivElement): void {
  const tipos = getUniqueTipos();
  container.innerHTML = '';

  if (tipos.length === 0) {
    container.classList.remove('categoria-modal__suggestions--visible');
    return;
  }

  tipos.forEach(tipo => {
    const item = document.createElement('div');
    item.setAttribute('role', 'option');
    item.classList.add('categoria-modal__suggestion');
    item.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
    item.addEventListener('click', () => {
      input.value = tipo;
      container.classList.remove('categoria-modal__suggestions--visible');
      input.focus();
    });
    container.appendChild(item);
  });

  container.classList.add('categoria-modal__suggestions--visible');
}

/**
 * Mostra sugestões filtradas de tipo
 */
function showFilteredTypeSuggestions(input: HTMLInputElement, container: HTMLDivElement): void {
  const query = input.value.trim().toLowerCase();
  const tipos = getUniqueTipos();
  
  container.innerHTML = '';

  // Se não tem query, mostra todas
  if (!query || query.length < 1) {
    showAllTypeSuggestions(input, container);
    return;
  }

  const filtered = tipos.filter(tipo => tipo.toLowerCase().includes(query));

  if (filtered.length === 0) {
    container.classList.remove('categoria-modal__suggestions--visible');
    return;
  }

  filtered.forEach(tipo => {
    const item = document.createElement('div');
    item.setAttribute('role', 'option');
    item.classList.add('categoria-modal__suggestion');
    item.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
    item.addEventListener('click', () => {
      input.value = tipo;
      container.classList.remove('categoria-modal__suggestions--visible');
      input.focus();
    });
    container.appendChild(item);
  });

  container.classList.add('categoria-modal__suggestions--visible');
}

/**
 * Configura autocomplete para o campo de tipo
 */
function setupTypeAutocomplete(): void {
  const input = document.getElementById('categoryType') as HTMLInputElement;
  if (!input) return;

  const container = ensureSuggestionsContainer();

  // Mostra sugestões ao focar
  input.addEventListener('focus', () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      showAllTypeSuggestions(input, container);
    } else {
      showFilteredTypeSuggestions(input, container);
    }
  });

  // Filtra conforme digita
  input.addEventListener('input', () => {
    showFilteredTypeSuggestions(input, container);
  });

  // Esconde ao perder foco (com delay para permitir click)
  input.addEventListener('blur', () => {
    setTimeout(() => {
      container.classList.remove('categoria-modal__suggestions--visible');
    }, 200);
  });
}

/**
 * Abre modal para adicionar categoria
 */
function openAddModal(): void {
  state.editIndex = -1;
  
  const modal = document.getElementById('categoryModal');
  const title = document.getElementById('categoryModalTitle');
  const nameInput = document.getElementById('categoryName') as HTMLInputElement;
  const typeInput = document.getElementById('categoryType') as HTMLInputElement;
  const indexInput = document.getElementById('categoryEditIndex') as HTMLInputElement;
  
  if (title) title.textContent = 'Nova Categoria';
  if (nameInput) nameInput.value = '';
  if (typeInput) typeInput.value = '';
  if (indexInput) indexInput.value = '-1';
  
  if (modal) modal.classList.add('categoria-modal--visible');
  if (nameInput) nameInput.focus();
}

/**
 * Abre modal para editar categoria
 */
function openEditModal(index: number): void {
  const cat = state.categories[index];
  if (!cat) return;
  
  state.editIndex = index;
  
  const modal = document.getElementById('categoryModal');
  const title = document.getElementById('categoryModalTitle');
  const nameInput = document.getElementById('categoryName') as HTMLInputElement;
  const typeInput = document.getElementById('categoryType') as HTMLInputElement;
  const indexInput = document.getElementById('categoryEditIndex') as HTMLInputElement;
  
  if (title) title.textContent = 'Editar Categoria';
  if (nameInput) nameInput.value = cat.categoria;
  if (typeInput) typeInput.value = cat.tipo || '';
  if (indexInput) indexInput.value = String(index);
  
  if (modal) modal.classList.add('categoria-modal--visible');
  if (nameInput) nameInput.focus();
}

/**
 * Fecha modal de categoria
 */
function closeCategoryModal(): void {
  const modal = document.getElementById('categoryModal');
  if (modal) modal.classList.remove('categoria-modal--visible');
  state.editIndex = -1;
}

/**
 * Salva categoria do modal
 */
async function saveCategoryFromModal(): Promise<void> {
  const nameInput = document.getElementById('categoryName') as HTMLInputElement;
  const typeInput = document.getElementById('categoryType') as HTMLInputElement;
  const indexInput = document.getElementById('categoryEditIndex') as HTMLInputElement;
  
  const name = nameInput?.value.trim();
  const type = typeInput?.value.trim().toUpperCase() || '';
  const index = parseInt(indexInput?.value || '-1', 10);
  
  if (!name) {
    showErrorToast('O nome da categoria é obrigatório');
    return;
  }
  
  // Verifica duplicatas (exceto se estiver editando a mesma)
  const existingIndex = state.categories.findIndex(
    (cat, i) => cat.categoria.toLowerCase() === name.toLowerCase() && i !== index
  );
  
  if (existingIndex !== -1) {
    showErrorToast('Já existe uma categoria com este nome');
    return;
  }
  
  if (index === -1) {
    // Adicionar nova
    state.categories.push({
      categoria: name,
      tipo: type
    });
  } else {
    // Editar existente
    state.categories[index] = {
      categoria: name,
      tipo: type
    };
  }
  
  closeCategoryModal();
  renderCategories();
  
  const success = await saveCategories();
  if (success) {
    showSuccessToast(index === -1 ? 'Categoria adicionada com sucesso' : 'Categoria atualizada com sucesso');
  }
}

// ============================================================================
// Modal de Deletar
// ============================================================================

/**
 * Abre modal de confirmação de exclusão
 */
function openDeleteModal(index: number): void {
  const cat = state.categories[index];
  if (!cat) return;
  
  state.deleteIndex = index;
  
  const modal = document.getElementById('deleteCategoryModal');
  const nameDisplay = document.getElementById('deleteCategoryName');
  const indexInput = document.getElementById('deleteCategoryIndex') as HTMLInputElement;
  
  if (nameDisplay) nameDisplay.textContent = cat.categoria;
  if (indexInput) indexInput.value = String(index);
  
  if (modal) modal.classList.add('categoria-modal--visible');
}

/**
 * Fecha modal de exclusão
 */
function closeDeleteModal(): void {
  const modal = document.getElementById('deleteCategoryModal');
  if (modal) modal.classList.remove('categoria-modal--visible');
  state.deleteIndex = -1;
}

/**
 * Confirma exclusão de categoria
 */
async function confirmDelete(): Promise<void> {
  if (state.deleteIndex === -1) return;
  
  state.categories.splice(state.deleteIndex, 1);
  
  closeDeleteModal();
  renderCategories();
  
  const success = await saveCategories();
  if (success) {
    showSuccessToast('Categoria excluída com sucesso');
  }
}

// ============================================================================
// Inicialização
// ============================================================================

async function init(): Promise<void> {
  console.log('[Categorias] Inicializando página...');
  
  // Verifica se o token é válido
  const isTokenValid = await verifyTokenValidity();
  if (!isTokenValid) {
    console.warn('⚠️ Token inválido ou usuário não autenticado');
    return;
  }
  
  // Renderiza menu do usuário
  renderUserMenu();
  
  // Configura botão de atualizar
  const refreshBtn = document.getElementById('refreshCategoriesBtn') as HTMLButtonElement;
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const originalText = refreshBtn.innerHTML;
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '⏳ Atualizando...';
      
      try {
        await loadCategories(true);
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = originalText;
      }
    });
  }
  
  // Configura botão de adicionar (header)
  const addBtn = document.getElementById('addCategoryBtn');
  if (addBtn) {
    addBtn.addEventListener('click', openAddModal);
  }
  
  // Configura modal de categoria
  const closeCategoryModalBtn = document.getElementById('closeCategoryModal');
  const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
  const categoryForm = document.getElementById('categoryForm');
  
  if (closeCategoryModalBtn) {
    closeCategoryModalBtn.addEventListener('click', closeCategoryModal);
  }
  if (cancelCategoryBtn) {
    cancelCategoryBtn.addEventListener('click', closeCategoryModal);
  }
  if (categoryForm) {
    categoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveCategoryFromModal();
    });
  }
  
  // Configura autocomplete para o campo de tipo
  setupTypeAutocomplete();
  
  // Configura modal de exclusão
  const closeDeleteModalBtn = document.getElementById('closeDeleteCategoryModal');
  const cancelDeleteBtn = document.getElementById('cancelDeleteCategoryBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteCategoryBtn');
  
  if (closeDeleteModalBtn) {
    closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  }
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  }
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', confirmDelete);
  }
  
  // Fecha modais ao clicar fora
  const categoryModal = document.getElementById('categoryModal');
  const deleteModal = document.getElementById('deleteCategoryModal');
  
  if (categoryModal) {
    categoryModal.addEventListener('click', (e) => {
      if (e.target === categoryModal) closeCategoryModal();
    });
  }
  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) closeDeleteModal();
    });
  }
  
  // Carrega categorias
  await loadCategories();
  
  console.log('✅ Página de categorias inicializada');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
