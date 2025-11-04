/**
 * Componente de Modal para Editar Lançamento
 * Migrado de pb_public_/js/components/edit-entry-modal.js
 * Mantém mesma estrutura do entry-modal.ts
 */

import lancamentosService from '../services/lancamentos';
import type { SheetEntry, OnEntryEditedCallback } from '../types';
import {
  toExcelSerial,
  toExcelSerialDia,
  excelSerialToDate
} from '../utils/date-helpers';

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
  private descriptions: string[] = [];

  /**
   * Template HTML do modal
   */
  private getTemplate(): string {
    return `
      <div id="editEntryModal" class="edit-entry-modal" aria-hidden="true">
        <div class="edit-entry-modal__content">
          <button id="closeEditEntryModal" class="edit-entry-modal__close" aria-label="Fechar modal">×</button>
          <h3 class="edit-entry-modal__title">Editar Lançamento</h3>
          <form id="editEntryForm" class="edit-entry-modal__form">
            <fieldset style="border: none; padding: 0; margin: 0;">
              <div class="form-group">
                <label for="editEntryDate">Data:</label>
                <input type="datetime-local" id="editEntryDate" name="data" class="form-control" required>
              </div>
              
              <div class="form-group">
                <label for="editEntryAccount">Conta:</label>
                <div class="edit-entry-modal__input-container">
                  <input type="text" id="editEntryAccount" name="conta" class="form-control" placeholder="Ex: Conta Corrente" required>
                  <div id="editAccountSuggestions" class="edit-entry-modal__suggestions"></div>
                </div>
              </div>
              
              <div class="form-group">
                <label for="editEntryValue">Valor:</label>
                <div class="edit-entry-modal__valor-toggle">
                  <button type="button" id="editEntrySignBtn" class="edit-entry-modal__sign-btn" aria-label="Alternar sinal">−</button>
                  <input type="number" id="editEntryValue" name="valor" class="form-control edit-entry-modal__valor-input" step="0.01" min="0" placeholder="0,00" required>
                  <input type="hidden" id="editEntrySignValue" name="sinal" value="-">
                </div>
              </div>
              
              <div class="form-group">
                <label for="editEntryDescription">Descrição:</label>
                <div class="edit-entry-modal__input-container">
                  <input type="text" id="editEntryDescription" name="descricao" class="form-control" placeholder="Descrição" required>
                  <div id="editDescriptionSuggestions" class="edit-entry-modal__suggestions"></div>
                </div>
              </div>
              
              <div class="form-group">
                <label for="editEntryCategory">Categoria:</label>
                <div class="edit-entry-modal__input-container">
                  <input type="text" id="editEntryCategory" name="categoria" class="form-control" placeholder="Digite uma categoria" required>
                  <div id="editCategorySuggestions" class="edit-entry-modal__suggestions"></div>
                </div>
              </div>
              
              <div class="form-group">
                <label for="editEntryBudget">Orçamento (data-chave):</label>
                <input type="date" id="editEntryBudget" name="orcamento" class="form-control" required>
              </div>
              
              <div class="form-group">
                <label for="editEntryObs">Observações:</label>
                <textarea id="editEntryObs" name="observacoes" rows="3" class="form-control" placeholder="Notas adicionais..."></textarea>
              </div>
              
              <div id="editEntryFeedback" class="edit-entry-modal__feedback"></div>
              
              <div class="edit-entry-modal__actions">
                <button type="button" id="cancelEditEntryBtn" class="button">Cancelar</button>
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
    this.setupAutocomplete();

    console.log('[EditEntryModal] Inicializado com sucesso');
  }

  /**
   * Configura event listeners
   */
  private setupEventListeners(): void {
    // Botão de fechar
    const closeBtn = document.getElementById('closeEditEntryModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Botão de cancelar
    const cancelBtn = document.getElementById('cancelEditEntryBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.close());
    }

    // Fechar ao clicar fora do modal
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    // Toggle de sinal
    const signBtn = document.getElementById('editEntrySignBtn');
    if (signBtn) {
      signBtn.addEventListener('click', () => this.toggleSign());
    }

    // Submit do formulário
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  }

  /**
   * Configura autocomplete para campos
   */
  private setupAutocomplete(): void {
    const accountInput = document.getElementById('editEntryAccount') as HTMLInputElement;
    const descriptionInput = document.getElementById('editEntryDescription') as HTMLInputElement;
    const categoryInput = document.getElementById('editEntryCategory') as HTMLInputElement;

    if (accountInput) {
      this.setupFieldAutocomplete(accountInput, 'editAccountSuggestions', () => this.accounts);
    }

    if (descriptionInput) {
      this.setupFieldAutocomplete(descriptionInput, 'editDescriptionSuggestions', () => this.descriptions);
    }

    if (categoryInput) {
      this.setupFieldAutocomplete(categoryInput, 'editCategorySuggestions', () => this.categories);
    }
  }

  /**
   * Configura autocomplete para um campo específico
   */
  private setupFieldAutocomplete(
    input: HTMLInputElement,
    suggestionsId: string,
    getSuggestions: () => string[]
  ): void {
    const suggestionsEl = document.getElementById(suggestionsId);
    if (!suggestionsEl) return;

    input.addEventListener('input', () => {
      const value = input.value.trim().toLowerCase();
      if (value.length < 1) {
        suggestionsEl.classList.remove('edit-entry-modal__suggestions--visible');
        return;
      }

      const suggestions = getSuggestions();
      const filtered = suggestions
        .filter(s => s.toLowerCase().includes(value))
        .slice(0, 8);

      if (filtered.length === 0) {
        suggestionsEl.classList.remove('edit-entry-modal__suggestions--visible');
        return;
      }

      suggestionsEl.innerHTML = filtered
        .map(s => `<div class="edit-entry-modal__suggestion" data-value="${s}">${s}</div>`)
        .join('');

      suggestionsEl.classList.add('edit-entry-modal__suggestions--visible');

      // Event listener para cada sugestão
      suggestionsEl.querySelectorAll('.edit-entry-modal__suggestion').forEach(el => {
        el.addEventListener('click', () => {
          const value = el.getAttribute('data-value');
          if (value) {
            input.value = value;
            suggestionsEl.classList.remove('edit-entry-modal__suggestions--visible');
            input.focus();
          }
        });
      });
    });

    // Fecha sugestões ao clicar fora
    document.addEventListener('click', (e) => {
      if (e.target !== input && e.target !== suggestionsEl) {
        suggestionsEl.classList.remove('edit-entry-modal__suggestions--visible');
      }
    });
  }

  /**
   * Alterna sinal do valor
   */
  private toggleSign(): void {
    const signBtn = document.getElementById('editEntrySignBtn');
    const signValue = document.getElementById('editEntrySignValue') as HTMLInputElement;
    
    if (!signBtn || !signValue) return;

    const isExpense = signBtn.textContent?.trim() === '−';
    
    if (isExpense) {
      signBtn.textContent = '+';
      signBtn.className = 'edit-entry-modal__sign-btn edit-entry-modal__sign-btn--income';
      signValue.value = '+';
    } else {
      signBtn.textContent = '−';
      signBtn.className = 'edit-entry-modal__sign-btn edit-entry-modal__sign-btn--expense';
      signValue.value = '-';
    }
  }

  /**
   * Aplica estado do sinal
   */
  private applySignState(isExpense: boolean): void {
    const signBtn = document.getElementById('editEntrySignBtn');
    const signValue = document.getElementById('editEntrySignValue') as HTMLInputElement;
    
    if (!signBtn || !signValue) return;

    if (isExpense) {
      signBtn.textContent = '−';
      signBtn.className = 'edit-entry-modal__sign-btn edit-entry-modal__sign-btn--expense';
      signValue.value = '-';
    } else {
      signBtn.textContent = '+';
      signBtn.className = 'edit-entry-modal__sign-btn edit-entry-modal__sign-btn--income';
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
    this.modal.classList.add('edit-entry-modal--visible');
    this.modal.setAttribute('aria-hidden', 'false');
  }

  /**
   * Preenche o formulário com dados do lançamento
   */
  private populateForm(entry: SheetEntry): void {
    // Data
    const dateInput = document.getElementById('editEntryDate') as HTMLInputElement;
    if (dateInput && entry.data) {
      let dateValue = '';
      if (typeof entry.data === 'number') {
        const dateObj = excelSerialToDate(entry.data);
        if (dateObj) {
          dateValue = dateObj.toISOString().slice(0, 16);
        }
      } else {
        const dateObj = new Date(entry.data);
        if (!isNaN(dateObj.getTime())) {
          dateValue = dateObj.toISOString().slice(0, 16);
        }
      }
      dateInput.value = dateValue;
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

    // Orçamento
    const budgetInput = document.getElementById('editEntryBudget') as HTMLInputElement;
    if (budgetInput && entry.orcamento) {
      let budgetValue = '';
      if (typeof entry.orcamento === 'number') {
        const dateObj = excelSerialToDate(entry.orcamento);
        if (dateObj) {
          budgetValue = dateObj.toISOString().split('T')[0];
        }
      } else {
        budgetValue = entry.orcamento.split('T')[0];
      }
      budgetInput.value = budgetValue;
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
    this.modal.classList.remove('edit-entry-modal--visible');
    this.modal.setAttribute('aria-hidden', 'true');
    this.currentEntry = null;

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
  private async handleSubmit(): Promise<void> {
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
      const dateInput = formData.get('data') as string;
      const budgetInput = formData.get('orcamento') as string;
      const valueInput = parseFloat(formData.get('valor') as string);
      const signValue = formData.get('sinal') as string;

      // Valida datas
      const dateObj = new Date(dateInput);
      const budgetObj = new Date(budgetInput);
      
      if (isNaN(dateObj.getTime())) {
        throw new Error('Data inválida');
      }
      
      if (isNaN(budgetObj.getTime())) {
        throw new Error('Data de orçamento inválida');
      }

      const value = signValue === '-' ? -Math.abs(valueInput) : Math.abs(valueInput);

      const payload: Partial<SheetEntry> = {
        data: toExcelSerial(dateObj),
        conta: formData.get('conta') as string,
        valor: value,
        descricao: formData.get('descricao') as string,
        categoria: formData.get('categoria') as string,
        orcamento: toExcelSerialDia(budgetObj),
        obs: formData.get('observacoes') as string || ''
      };

      console.log('[EditEntryModal] Enviando edição:', payload);

      // Envia para o serviço
      await lancamentosService.editEntry(this.currentEntry.rowIndex, payload);

      this.showFeedback('Lançamento editado com sucesso!', 'success');

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
      console.error('[EditEntryModal] Erro ao editar:', error);
      this.showFeedback(error.message || 'Erro ao editar lançamento', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar';
      }
    }
  }

  /**
   * Mostra feedback no modal
   */
  private showFeedback(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000): void {
    const feedback = document.getElementById('editEntryFeedback');
    if (!feedback) return;

    feedback.className = `edit-entry-modal__feedback edit-entry-modal__feedback--${type} edit-entry-modal__feedback--visible`;
    feedback.textContent = message;

    if (duration > 0) {
      setTimeout(() => {
        this.clearFeedback();
      }, duration);
    }
  }

  /**
   * Limpa feedback
   */
  private clearFeedback(): void {
    const feedback = document.getElementById('editEntryFeedback');
    if (feedback) {
      feedback.className = 'edit-entry-modal__feedback';
      feedback.textContent = '';
    }
  }

  /**
   * Define lista de lançamentos (para autocomplete)
   */
  setEntries(entries: SheetEntry[]): void {
    this.accounts = lancamentosService.getUniqueAccounts(entries);
    this.categories = lancamentosService.getUniqueCategories(entries);
    this.descriptions = lancamentosService.getUniqueDescriptions(entries);
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
