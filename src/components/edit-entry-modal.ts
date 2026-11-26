/**
 * Componente de Modal para Editar Lançamento
 * Baseado em entry-modal.ts - Mesma estrutura e styling para consistência
 */

import lancamentosService from '../services/lancamentos';
import type { SheetEntry, OnEntryEditedCallback, CategoryComplete } from '../types';

// Singleton instance
let modalInstance: EditEntryModal | null = null;

/**
 * Classe principal do modal de editar lançamento
 */
class EditEntryModal {
  private modal: HTMLElement | null = null;
  private form: HTMLFormElement | null = null;
  private callback: OnEntryEditedCallback | undefined;
  private currentEntry: SheetEntry | null = null;
  private accounts: string[] = [];
  private categories: string[] = [];
  private categoriesComplete: CategoryComplete[] = [];
  private descriptions: string[] = [];
  private entries: SheetEntry[] = [];

  /**
   * Template HTML do modal (idêntico ao entry-modal.ts para consistência)
   */
  private getTemplate(): string {
    return `
      <div id="editEntryModal" class="entry-modal" aria-hidden="true" style="display: none;">
        <div class="entry-modal__content">
          <button id="closeEditEntryModal" class="entry-modal__close" aria-label="Fechar modal">×</button>
          <h3 class="entry-modal__title">Editar Lançamento</h3>
          <form id="editEntryForm" class="entry-modal__form">
            <fieldset>
              <div class="form-group">
                <label for="editEntryDate">Data:</label>
                <input type="datetime-local" id="editEntryDate" name="data" class="form-control">
              </div>
              
              <div class="form-group">
                <label for="editEntryAccount">Conta:</label>
                <input type="text" id="editEntryAccount" name="conta" class="form-control" placeholder="Ex: Conta Corrente" autocomplete="off">
              </div>
              
              <div class="form-group valor-toggle-group">
                <label for="editEntryValue">Valor:</label>
                <div class="valor-toggle-container">
                  <button type="button" id="editEntrySignBtn" class="button outline entry-toggle entry-toggle--expense" aria-label="Alternar sinal">−</button>
                  <input type="number" id="editEntryValue" name="valor" class="form-control" step="0.01" min="0" placeholder="0,00" required>
                  <input type="hidden" id="editEntrySignValue" name="sinal" value="−">
                </div>
              </div>
              
              <div class="form-group">
                <label for="editEntryDescription">Descrição:</label>
                <input type="text" id="editEntryDescription" name="descricao" class="form-control" placeholder="Descrição da despesa" autocomplete="off" required>
              </div>
              
              <div class="form-group">
                <label for="editEntryCategory">Categoria:</label>
                <input type="text" id="editEntryCategory" name="categoria" class="form-control" placeholder="Digite uma categoria" autocomplete="off" required>
              </div>
              
              <div class="form-group">
                <label for="editEntryBudget">Orçamento (data-chave):</label>
                <input type="date" id="editEntryBudget" name="orcamento" class="form-control" required>
              </div>
              
              <div class="form-group">
                <label for="editEntryObs">Observações:</label>
                <textarea id="editEntryObs" name="observacoes" rows="3" class="form-control" placeholder="Notas adicionais..."></textarea>
              </div>
              
              <div id="editEntryFeedback" class="modal-feedback" style="display: none;"></div>
              
              <div class="form-actions">
                <button type="button" id="cancelEditEntryBtn" class="button warning">Cancelar</button>
                <button type="submit" id="saveEditEntryBtn" class="button success">Salvar</button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    `;
  }

  /**
   * Inicializa o modal
   */
  async init(callback?: OnEntryEditedCallback): Promise<void> {
    console.log('[EditEntryModal] Inicializando...');
    
    this.callback = callback;

    // Injeta o template no body
    document.body.insertAdjacentHTML('beforeend', this.getTemplate());

    // Referências aos elementos
    this.modal = document.getElementById('editEntryModal');
    this.form = document.getElementById('editEntryForm') as HTMLFormElement;

    if (!this.modal || !this.form) {
      throw new Error('[EditEntryModal] Elementos do modal não encontrados');
    }

    this.setupEventListeners();

    console.log('[EditEntryModal] ✅ Inicializado com sucesso');
  }

  /**
   * Configura event listeners
   */
  private setupEventListeners(): void {
    // Botão de fechar
    const closeBtn = document.getElementById('closeEditEntryModal');
    closeBtn?.addEventListener('click', () => this.close());

    // Botão de cancelar
    const cancelBtn = document.getElementById('cancelEditEntryBtn');
    cancelBtn?.addEventListener('click', () => this.close());

    // Fechar ao clicar fora do conteúdo
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.style.display === 'flex') {
        this.close();
      }
    });

    // Toggle de sinal (+/-)
    const signBtn = document.getElementById('editEntrySignBtn');
    signBtn?.addEventListener('click', () => this.toggleSign());

    // Submit do formulário
    this.form?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Autocomplete para categoria
    this.setupCategoryAutocomplete();

    // Autocomplete para descrição
    this.setupDescriptionAutocomplete();

    // Autocomplete para conta
    this.setupAccountAutocomplete();
  }

  /**
   * Configura autocomplete para categoria
   */
  private setupCategoryAutocomplete(): void {
    const input = document.getElementById('editEntryCategory') as HTMLInputElement;
    if (!input) return;

    let container = this.ensureSuggestionsContainer('editCatSuggestions', input);

    // Mostra todas as categorias ao focar (antes de digitar)
    input.addEventListener('focus', () => {
      if (this.categories.length > 0) {
        this.showAllSuggestions(input, container, this.categories);
      }
    });

    input.addEventListener('input', () => {
      this.showSuggestions(input, container, this.categories);
    });

    input.addEventListener('blur', () => {
      setTimeout(() => container.style.display = 'none', 200);
    });
  }

  /**
   * Configura autocomplete para descrição
   */
  private setupDescriptionAutocomplete(): void {
    const input = document.getElementById('editEntryDescription') as HTMLInputElement;
    if (!input) return;

    let container = this.ensureSuggestionsContainer('editDescSuggestions', input);

    // Mostra sugestões ao focar
    input.addEventListener('focus', () => {
      if (this.descriptions.length > 0) {
        const query = input.value.trim().toLowerCase();
        if (!query) {
          this.showAllSuggestions(input, container, this.descriptions, (value) => {
            this.autoFillCategoryFromDescription(value);
          });
        }
      }
    });

    input.addEventListener('input', () => {
      this.showSuggestions(input, container, this.descriptions, (value) => {
        this.autoFillCategoryFromDescription(value);
      });
    });

    input.addEventListener('blur', () => {
      setTimeout(() => container.style.display = 'none', 200);
    });
  }

  /**
   * Auto-preenche categoria baseado na descrição
   */
  private autoFillCategoryFromDescription(description: string): void {
    const entry = this.entries.find(e => 
      e.descricao && e.descricao.trim().toLowerCase() === description.toLowerCase()
    );
    if (entry && entry.categoria) {
      const categoryInput = document.getElementById('editEntryCategory') as HTMLInputElement;
      if (categoryInput) {
        categoryInput.value = entry.categoria;
      }
    }
  }

  /**
   * Configura autocomplete para conta
   */
  private setupAccountAutocomplete(): void {
    const input = document.getElementById('editEntryAccount') as HTMLInputElement;
    if (!input) return;

    let container = this.ensureSuggestionsContainer('editAccountSuggestions', input);

    // Mostra sugestões ao focar
    input.addEventListener('focus', () => {
      if (this.accounts.length > 0) {
        const query = input.value.trim().toLowerCase();
        if (!query) {
          this.showAllSuggestions(input, container, this.accounts);
        }
      }
    });

    input.addEventListener('input', () => {
      this.showSuggestions(input, container, this.accounts);
    });

    input.addEventListener('blur', () => {
      setTimeout(() => container.style.display = 'none', 200);
    });
  }

  /**
   * Garante que existe um container de sugestões
   */
  private ensureSuggestionsContainer(id: string, input: HTMLInputElement): HTMLDivElement {
    let container = document.getElementById(id) as HTMLDivElement;
    if (!container) {
      container = document.createElement('div');
      container.id = id;
      container.classList.add('entry-modal__suggestions');
      container.setAttribute('role', 'listbox');
      const parent = input.parentElement;
      if (parent) {
        parent.style.position = parent.style.position || 'relative';
        parent.appendChild(container);
      }
    }
    return container;
  }

  /**
   * Mostra todas as sugestões (sem filtrar)
   */
  private showAllSuggestions(
    input: HTMLInputElement,
    container: HTMLDivElement,
    suggestions: string[],
    onSelect?: (value: string) => void
  ): void {
    container.innerHTML = '';

    if (suggestions.length === 0) {
      container.style.display = 'none';
      return;
    }

    // Limita a 20 itens iniciais para não sobrecarregar
    const itemsToShow = suggestions.slice(0, 20);

    itemsToShow.forEach(s => {
      const item = document.createElement('div');
      item.setAttribute('role', 'option');
      item.classList.add('entry-modal__suggestion');
      item.textContent = s;
      item.addEventListener('click', () => {
        input.value = s;
        container.style.display = 'none';
        input.focus();
        if (onSelect) {
          onSelect(s);
        }
      });
      container.appendChild(item);
    });

    container.style.display = 'block';
  }

  /**
   * Mostra sugestões de autocomplete (filtradas)
   */
  private showSuggestions(
    input: HTMLInputElement, 
    container: HTMLDivElement, 
    suggestions: string[],
    onSelect?: (value: string) => void
  ): void {
    container.innerHTML = '';
    const query = input.value.trim().toLowerCase();

    // Se não tem query, mostra todas
    if (!query || query.length < 1) {
      this.showAllSuggestions(input, container, suggestions, onSelect);
      return;
    }

    if (suggestions.length === 0) {
      container.style.display = 'none';
      return;
    }

    const filtered = suggestions.filter(s => s.toLowerCase().includes(query));

    if (filtered.length === 0) {
      container.style.display = 'none';
      return;
    }

    filtered.forEach(s => {
      const item = document.createElement('div');
      item.setAttribute('role', 'option');
      item.classList.add('entry-modal__suggestion');
      item.textContent = s;
      item.addEventListener('click', () => {
        input.value = s;
        container.style.display = 'none';
        input.focus();
        if (onSelect) {
          onSelect(s);
        }
      });
      container.appendChild(item);
    });

    container.style.display = 'block';
  }

  /**
   * Alterna o sinal entre + e -
   */
  private toggleSign(): void {
    const signBtn = document.getElementById('editEntrySignBtn');
    const isExpense = signBtn?.textContent?.trim() === '−';
    this.setSignState(!isExpense);
  }

  /**
   * Define o estado do sinal (despesa ou receita)
   */
  private setSignState(isExpense: boolean): void {
    const signBtn = document.getElementById('editEntrySignBtn');
    const signValue = document.getElementById('editEntrySignValue') as HTMLInputElement;
    
    if (!signBtn || !signValue) return;

    if (isExpense) {
      signBtn.textContent = '−';
      signBtn.classList.add('entry-toggle--expense');
      signBtn.classList.remove('entry-toggle--income');
      signValue.value = '−';
    } else {
      signBtn.textContent = '+';
      signBtn.classList.remove('entry-toggle--expense');
      signBtn.classList.add('entry-toggle--income');
      signValue.value = '+';
    }
  }

  /**
   * Abre o modal com um lançamento para edição
   */
  open(entry: SheetEntry): void {
    if (!this.modal || !entry) return;

    console.log('[EditEntryModal] Abrindo modal para edição:', entry);

    this.currentEntry = entry;
    this.populateForm(entry);
    
    this.modal.style.display = 'flex';
    this.modal.setAttribute('aria-hidden', 'false');

    // Oculta o botão FAB
    const fabBtn = document.getElementById('openEntryModal');
    if (fabBtn) {
      fabBtn.style.visibility = 'hidden';
      console.log('[EditEntryModal] ✅ Botão FAB oculto');
    }

    // Foca no primeiro campo
    const firstInput = this.form?.querySelector('input');
    firstInput?.focus();
  }

  /**
   * Aplica estado do sinal (para preenchimento do formulário)
   */
  private applySignState(isExpense: boolean): void {
    const signBtn = document.getElementById('editEntrySignBtn');
    const signValue = document.getElementById('editEntrySignValue') as HTMLInputElement;
    
    if (!signBtn || !signValue) return;

    if (isExpense) {
      signBtn.textContent = '−';
      signBtn.classList.add('entry-toggle--expense');
      signBtn.classList.remove('entry-toggle--income');
      signValue.value = '−';
    } else {
      signBtn.textContent = '+';
      signBtn.classList.remove('entry-toggle--expense');
      signBtn.classList.add('entry-toggle--income');
      signValue.value = '+';
    }
  }

  /**
   * Define o estado do sinal (despesa ou receita)
   */
  private populateForm(entry: SheetEntry): void {
    // Data (já vem pronta do backend em dataInput)
    const dateInput = document.getElementById('editEntryDate') as HTMLInputElement;
    if (dateInput) {
      dateInput.value = entry.dataInput || '';
    }

    // Conta
    const accountInput = document.getElementById('editEntryAccount') as HTMLInputElement;
    if (accountInput) {
      accountInput.value = entry.conta || '';
    }

    // Valor e sinal
    const valueInput = document.getElementById('editEntryValue') as HTMLInputElement;
    if (valueInput && entry.valor !== undefined) {
      const absValue = Math.abs(entry.valor);
      valueInput.value = absValue.toString();
      this.applySignState(entry.valor < 0);
    }

    // Descrição
    const descriptionInput = document.getElementById('editEntryDescription') as HTMLInputElement;
    if (descriptionInput) {
      descriptionInput.value = entry.descricao || '';
    }

    // Categoria
    const categoryInput = document.getElementById('editEntryCategory') as HTMLInputElement;
    if (categoryInput) {
      categoryInput.value = entry.categoria || '';
    }

    // Orçamento (já vem pronto do backend em orcamentoInput)
    const budgetInput = document.getElementById('editEntryBudget') as HTMLInputElement;
    if (budgetInput) {
      budgetInput.value = entry.orcamentoInput || '';
    }

    // Observações
    const obsInput = document.getElementById('editEntryObs') as HTMLTextAreaElement;
    if (obsInput) {
      obsInput.value = entry.obs || '';
    }
  }

  /**
   * Fecha o modal
   */
  close(): void {
    if (!this.modal) return;

    this.modal.style.display = 'none';
    this.modal.setAttribute('aria-hidden', 'true');
    this.currentEntry = null;

    // Mostra o botão FAB novamente
    const fabBtn = document.getElementById('openEntryModal');
    if (fabBtn) {
      fabBtn.style.visibility = 'visible';
      console.log('[EditEntryModal] ✅ Botão FAB visível');
    }

    // Limpa o formulário
    if (this.form) {
      this.form.reset();
    }

    // Limpa feedback
    this.clearFeedback();
  }

  /**
   * Verifica se o modal está aberto
   */
  isOpen(): boolean {
    return this.modal?.style.display === 'flex';
  }

  /**
   * Processa o envio do formulário
   */
  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.form || !this.currentEntry || !this.currentEntry.rowIndex) {
      console.error('[EditEntryModal] Dados insuficientes para edição');
      return;
    }

    const formData = new FormData(this.form);
    const saveBtn = document.getElementById('saveEditEntryBtn') as HTMLButtonElement;

    // Desabilita botão durante envio
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Salvando...';
    }

    try {
      // Prepara dados
      const dateValue = formData.get('data') as string;
      const budgetInput = formData.get('orcamento') as string;
      const valueInput = parseFloat(formData.get('valor') as string);
      const signValue = formData.get('sinal') as string;

      // Valida orçamento (obrigatório)
      if (!budgetInput || isNaN(new Date(budgetInput).getTime())) {
        throw new Error('Data de orçamento inválida');
      }

      // Valida data apenas se preenchida
      if (dateValue && dateValue.trim() !== '') {
        // Valida formato datetime-local (YYYY-MM-DDTHH:MM)
        if (!dateValue.includes('T')) {
          throw new Error('Formato de data/hora inválido');
        }

        if (isNaN(new Date(dateValue).getTime())) {
          throw new Error('Data inválida');
        }
      }

      const value = (signValue === '−' || signValue === '-') ? -Math.abs(valueInput) : Math.abs(valueInput);

      // O payload vai no formato do formulário: a normalização pra "DD/MM/YYYY"
      // é feita no BACKEND (pb_hooks/_lancamentos-domain.js).
      const payload: Partial<SheetEntry> = {
        data: dateValue,
        conta: formData.get('conta') as string,
        valor: value,
        descricao: formData.get('descricao') as string,
        categoria: formData.get('categoria') as string,
        orcamento: budgetInput,
        obs: formData.get('observacoes') as string || ''
      };

      console.log('[EditEntryModal] 📤 Enviando edição:', payload);

      // Envia para o serviço
      await lancamentosService.editEntry(this.currentEntry.rowIndex, payload);

      this.showFeedback('✅ Lançamento editado com sucesso!', 'success');

      // Aguarda um pouco e fecha
      setTimeout(() => {
        this.close();
        
        // Dispara evento para atualizar a lista
        const event = new CustomEvent('entry:edited', { 
          detail: { rowIndex: this.currentEntry?.rowIndex, entry: payload } 
        });
        document.dispatchEvent(event);

        // Callback se definido
        if (this.callback) {
          this.callback({ success: true, entry: payload });
        }
      }, 500);

    } catch (error: any) {
      console.error('[EditEntryModal] ❌ Erro ao editar:', error);
      this.showFeedback(
        `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'error'
      );
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar';
      }
    }
  }

  /**
   * Mostra mensagem de feedback
   */
  private showFeedback(message: string, type: 'info' | 'success' | 'error'): void {
    const feedback = document.getElementById('editEntryFeedback');
    if (!feedback) return;

    feedback.textContent = message;
    feedback.className = `modal-feedback modal-feedback--${type}`;
    feedback.style.display = 'block';

    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        this.clearFeedback();
      }, 5000);
    }
  }

  /**
   * Limpa feedback
   */
  private clearFeedback(): void {
    const feedback = document.getElementById('editEntryFeedback');
    if (feedback) {
      feedback.className = 'modal-feedback';
      feedback.textContent = '';
      feedback.style.display = 'none';
    }
  }

  /**
   * Define lista de lançamentos (para autocomplete)
   */
  async setEntries(entries: SheetEntry[]): Promise<void> {
    this.entries = entries;

    // Contas e descrições únicas (para o autocomplete)
    this.accounts = [...new Set(
      entries.map(e => e.conta).filter(c => c && c.trim())
    )].sort();
    this.descriptions = [...new Set(
      entries.map(e => e.descricao).filter(d => d && d.trim())
    )].sort();

    // Extrai categorias únicas dos entries
    const entriesCategories = [...new Set(
      entries.map(e => e.categoria).filter(c => c && c.trim())
    )].sort();
    
    // Tenta carregar categorias completas do backend (com cache)
    try {
      const { SheetsService } = await import('../services/sheets');
      this.categoriesComplete = await SheetsService.getSheetCategoriesComplete();
      
      // Usa categorias completas se disponíveis, senão usa as dos entries
      if (this.categoriesComplete.length > 0) {
        this.categories = this.categoriesComplete.map(c => c.categoria);
        console.log('[EditEntryModal] Categorias completas carregadas:', this.categoriesComplete.length);
      } else {
        this.categories = entriesCategories;
        console.log('[EditEntryModal] Usando categorias dos entries:', this.categories.length);
      }
    } catch (error) {
      console.warn('[EditEntryModal] Erro ao carregar categorias completas, usando entries:', error);
      this.categories = entriesCategories;
    }
  }
}

/**
 * Inicializa o modal de edição
 */
export async function initEditEntryModal(callback?: OnEntryEditedCallback): Promise<EditEntryModal | null> {
  if (modalInstance) {
    console.log('[EditEntryModal] Reutilizando instância existente');
    return modalInstance;
  }

  try {
    modalInstance = new EditEntryModal();
    await modalInstance.init(callback);
    return modalInstance;
  } catch (error) {
    console.error('[EditEntryModal] Erro ao inicializar:', error);
    return null;
  }
}

/**
 * Abre o modal de edição
 */
export function openEditEntryModal(entry: SheetEntry): void {
  if (modalInstance) {
    modalInstance.open(entry);
  } else {
    console.error('[EditEntryModal] Modal não inicializado');
  }
}

/**
 * Fecha o modal de edição
 */
export function closeEditEntryModal(): void {
  if (modalInstance) {
    modalInstance.close();
  }
}

/**
 * Define lançamentos para autocomplete
 */
export function setEditModalEntries(entries: SheetEntry[]): void {
  if (modalInstance) {
    modalInstance.setEntries(entries);
  }
}
