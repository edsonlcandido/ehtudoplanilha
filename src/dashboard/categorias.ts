/**
 * Página de Categorias
 * Gerencia a lista de categorias com drag-and-drop, edição e deleção
 */

import { pb } from '../main';
import { verifyTokenValidity } from '../services/auth';
import { API_ENDPOINTS } from '../config/env';
import { renderUserMenu } from '../components/user-menu';
import { showSuccessToast, showErrorToast } from '../components/toast';

// ============================================================================
// Tipos
// ============================================================================

interface Category {
  categoria: string;
  tipo: string;
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
                onclick="editCategory(${index})">
          ✏️
        </button>
        <button class="categoria-card__action categoria-card__action--delete" 
                title="Excluir categoria"
                onclick="deleteCategory(${index})">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
  
  // Adiciona o card de adicionar no final
  const addCardHTML = `
    <button class="categorias__add-card" onclick="openAddModal()">
      <span class="categorias__add-card-icon">➕</span>
      <span>Nova Categoria</span>
    </button>
  `;
  
  container.innerHTML = cardsHTML + addCardHTML;
  
  // Configura drag and drop nos cards
  setupDragAndDrop();
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
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao carregar categorias');
    }
    
    // Mapeia para o formato simplificado (sem orçamento)
    state.categories = (data.categoriesComplete || []).map((cat: any) => ({
      categoria: cat.categoria,
      tipo: cat.tipo
    }));
    
    renderCategories();
    
    if (forceRefresh) {
      showSuccessToast('Categorias atualizadas com sucesso');
    }
  } catch (error: any) {
    console.error('Erro ao carregar categorias:', error);
    showErrorToast('Erro ao carregar categorias: ' + error.message);
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
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao salvar categorias');
    }
    
    updateSaveStatus('saved');
    return true;
  } catch (error: any) {
    console.error('Erro ao salvar categorias:', error);
    updateSaveStatus('error');
    showErrorToast('Erro ao salvar categorias: ' + error.message);
    return false;
  } finally {
    state.isSaving = false;
  }
}

// ============================================================================
// Modal de Adicionar/Editar
// ============================================================================

/**
 * Abre modal para adicionar categoria
 */
function openAddModal(): void {
  state.editIndex = -1;
  
  const modal = document.getElementById('categoryModal');
  const title = document.getElementById('categoryModalTitle');
  const nameInput = document.getElementById('categoryName') as HTMLInputElement;
  const typeSelect = document.getElementById('categoryType') as HTMLSelectElement;
  const indexInput = document.getElementById('categoryEditIndex') as HTMLInputElement;
  
  if (title) title.textContent = 'Nova Categoria';
  if (nameInput) nameInput.value = '';
  if (typeSelect) typeSelect.value = '';
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
  const typeSelect = document.getElementById('categoryType') as HTMLSelectElement;
  const indexInput = document.getElementById('categoryEditIndex') as HTMLInputElement;
  
  if (title) title.textContent = 'Editar Categoria';
  if (nameInput) nameInput.value = cat.categoria;
  if (typeSelect) typeSelect.value = cat.tipo.toUpperCase();
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
  const typeSelect = document.getElementById('categoryType') as HTMLSelectElement;
  const indexInput = document.getElementById('categoryEditIndex') as HTMLInputElement;
  
  const name = nameInput?.value.trim();
  const type = typeSelect?.value || '';
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
// Funções globais
// ============================================================================

// Expõe funções globalmente para uso nos botões inline
(window as any).editCategory = openEditModal;
(window as any).deleteCategory = openDeleteModal;
(window as any).openAddModal = openAddModal;

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
