/**
 * Componente de Modal para Lançamento Futuro
 * Form simplificado com: valor, descrição, categoria, orçamento
 */

import config from '../config/env';
import { pb } from '../main';
import type { OnEntryAddedCallback, SheetEntry } from '../types';
import { SheetsService } from '../services/sheets';
import lancamentosService from '../services/lancamentos';

// Singleton instance
let modalInstance: FutureEntryModal | null = null;

interface FutureEntryFormData {
  valor: number;
  descricao: string;
  categoria: string;
  orcamento: string; // DD/MM/YYYY
}

/**
 * Classe principal do modal de lançamento futuro
 */
class FutureEntryModal {
  private modal: HTMLElement | null = null;
  private form: HTMLFormElement | null = null;
  private callback: OnEntryAddedCallback | undefined;
  private categories: string[] = [];
  private descriptions: string[] = [];
  private entries: SheetEntry[] = [];

  /**
   * Template HTML do modal
   */
  private getTemplate(): string {
    return `
      <div id="futureEntryModal" class="entry-modal" aria-hidden="true" style="display: none;">
        <div class="entry-modal__content">
          <button id="closeFutureEntryModal" class="entry-modal__close" aria-label="Fechar modal">×</button>
          <h3 class="entry-modal__title">Lançamento Futuro</h3>
          <form id="futureExpenseForm" class="entry-modal__form">
            <fieldset>
              <div class="form-group valor-toggle-group">
                <label for="futureExpenseValue">Valor:</label>
                <div class="valor-toggle-container">
                  <button type="button" id="futureExpenseSignBtn" class="button outline entry-toggle entry-toggle--expense" aria-label="Alternar sinal">−</button>
                  <input type="number" id="futureExpenseValue" name="valor" class="form-control" step="0.01" min="0" placeholder="0,00" required>
                  <input type="hidden" id="futureExpenseSignValue" name="sinal" value="−">
                </div>
              </div>
              
              <div class="form-group">
                <label for="futureExpenseDescription">Descrição:</label>
                <input type="text" id="futureExpenseDescription" name="descricao" class="form-control" placeholder="Descrição do lançamento" autocomplete="off" required>
              </div>
              
              <div class="form-group">
                <label for="futureExpenseCategory">Categoria:</label>
                <input type="text" id="futureExpenseCategory" name="categoria" class="form-control" placeholder="Digite uma categoria" autocomplete="off" required>
              </div>
              
              <div class="form-group">
                <label for="futureExpenseBudget">Orçamento (data-chave):</label>
                <input type="date" id="futureExpenseBudget" name="orcamento" class="form-control" required>
              </div>
              
              <div id="futureModalFeedback" class="modal-feedback" style="display: none;"></div>
              
              <div class="form-actions">
                <button type="reset" class="button warning">Limpar</button>
                <button type="submit" class="button success">Salvar</button>
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
  async init(callback?: OnEntryAddedCallback): Promise<void> {
    console.log('[FutureEntryModal] Inicializando...');
    
    this.callback = callback;

    // Injeta o template no body
    document.body.insertAdjacentHTML('beforeend', this.getTemplate());

    // Referências aos elementos
    this.modal = document.getElementById('futureEntryModal');
    this.form = document.getElementById('futureExpenseForm') as HTMLFormElement;

    if (!this.modal || !this.form) {
      throw new Error('[FutureEntryModal] Elementos do modal não encontrados');
    }

    // Event listeners
    this.setupEventListeners();
    
    // Inicializa estado do sinal como despesa
    this.setSignState(true);

    // Carrega dados de autocomplete
    await this.loadAutocompleteData();

    console.log('[FutureEntryModal] ✅ Inicializado com sucesso');
  }

  /**
   * Configura event listeners
   */
  private setupEventListeners(): void {
    // Botão de fechar
    const closeBtn = document.getElementById('closeFutureEntryModal');
    closeBtn?.addEventListener('click', () => this.close());

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
    const signBtn = document.getElementById('futureExpenseSignBtn');
    signBtn?.addEventListener('click', () => this.toggleSign());

    // Submit do formulário
    this.form?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Reset do formulário
    this.form?.addEventListener('reset', () => {
      // Volta para despesa após reset
      setTimeout(() => this.setSignState(true), 0);
    });

    // Autocomplete para categoria
    this.setupCategoryAutocomplete();

    // Autocomplete para descrição
    this.setupDescriptionAutocomplete();
  }

  /**
   * Configura autocomplete para categoria
   */
  private setupCategoryAutocomplete(): void {
    const input = document.getElementById('futureExpenseCategory') as HTMLInputElement;
    if (!input) return;

    let container = this.ensureSuggestionsContainer('futureCatSuggestions', input);

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
    const input = document.getElementById('futureExpenseDescription') as HTMLInputElement;
    if (!input) return;

    let container = this.ensureSuggestionsContainer('futureDescSuggestions', input);

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
      const categoryInput = document.getElementById('futureExpenseCategory') as HTMLInputElement;
      if (categoryInput) {
        categoryInput.value = entry.categoria;
      }
    }
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
   * Carrega dados para autocomplete do backend
   */
  private async loadAutocompleteData(): Promise<void> {
    console.log('[FutureEntryModal] 📦 Carregando dados para autocomplete...');
    
    try {
      // Busca entries usando LancamentosService (com cache)
      const response = await lancamentosService.fetchEntries(0, false);
      this.entries = response?.entries ?? [];
      
      // Extrai descrições únicas
      this.descriptions = [...new Set(
        this.entries
          .map(e => e.descricao)
          .filter(d => d && d.trim())
      )].sort();

      // Busca categorias usando SheetsService (com cache)
      this.categories = await SheetsService.getSheetCategories();

      console.log('[FutureEntryModal] ✅ Dados carregados');

    } catch (error) {
      console.error('[FutureEntryModal] ⚠️ Erro ao carregar dados:', error);
    }
  }

  /**
   * Alterna o sinal entre + e -
   */
  private toggleSign(): void {
    const signBtn = document.getElementById('futureExpenseSignBtn');
    const isExpense = signBtn?.textContent?.trim() === '−';
    this.setSignState(!isExpense);
  }

  /**
   * Formata date "2025-10-31" para "31/10/2025"
   */
  private formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Define o estado do sinal (despesa ou receita)
   */
  private setSignState(isExpense: boolean): void {
    const signBtn = document.getElementById('futureExpenseSignBtn');
    const signValue = document.getElementById('futureExpenseSignValue') as HTMLInputElement;
    
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
   * Manipula o submit do formulário
   */
  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    if (!this.form) return;

    try {
      const formData = new FormData(this.form);
      
      const orcamentoStr = formData.get('orcamento') as string;
      const valorStr = formData.get('valor') as string;
      const descricao = formData.get('descricao') as string;
      const categoria = formData.get('categoria') as string;
      
      // Validação dos campos
      if (!orcamentoStr || !valorStr || !descricao || !categoria) {
        this.showFeedback('❌ Todos os campos são obrigatórios', 'error');
        return;
      }
      
      const valor = parseFloat(valorStr);
      if (isNaN(valor) || valor <= 0) {
        this.showFeedback('❌ Valor inválido', 'error');
        return;
      }
      
      const orcamentoFormatado = this.formatDate(orcamentoStr);
      
      const data: FutureEntryFormData = {
        valor: valor,
        descricao: descricao,
        categoria: categoria,
        orcamento: orcamentoFormatado,
      };

      // Aplica o sinal ao valor
      const sign = (document.getElementById('futureExpenseSignValue') as HTMLInputElement)?.value;
      const sinal = (sign === '−' || sign === '-') ? -1 : 1;
      data.valor = sinal * Math.abs(data.valor);

      await this.submitEntry(data);
    } catch (error) {
      console.error('[FutureEntryModal] ❌ Erro no handleSubmit:', error);
      this.showFeedback(
        `❌ Erro ao processar formulário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'error'
      );
    }
  }

  /**
   * Envia o lançamento para o backend
   * Usa data e conta vazias para lançamento futuro (conforme especificação)
   */
  private async submitEntry(data: FutureEntryFormData): Promise<void> {
    this.showFeedback('Enviando...', 'info');
    this.setFormDisabled(true);

    try {
      const payload = {
        data: '',  // Data vazia para lançamento futuro (será preenchida posteriormente)
        conta: '', // Conta vazia para lançamento futuro (será preenchida posteriormente)
        valor: data.valor,
        descricao: data.descricao,
        categoria: data.categoria,
        orcamento: data.orcamento,
      };

      console.log('[FutureEntryModal] 📤 Enviando:', payload);
      console.log('[FutureEntryModal] 📍 URL:', `${config.pocketbaseUrl}/append-entry`);
      console.log('[FutureEntryModal] 🔑 Token presente:', !!pb.authStore.token);

      const response = await fetch(`${config.pocketbaseUrl}/append-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
        },
        body: JSON.stringify(payload),
      });

      console.log('[FutureEntryModal] 📡 Response status:', response.status);

      const result = await response.json();
      console.log('[FutureEntryModal] 📦 Response data:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao adicionar lançamento futuro');
      }

      console.log('[FutureEntryModal] ✅ Sucesso:', result);
      
      this.showFeedback('✅ Lançamento futuro adicionado com sucesso!', 'success');
      
      // Limpa o formulário
      this.form?.reset();
      this.setSignState(true);

      // Chama callback se fornecido
      if (this.callback) {
        this.callback(result);
      }

      // Fecha o modal após 1.5s
      setTimeout(() => this.close(), 1500);

    } catch (error) {
      console.error('[FutureEntryModal] ❌ Erro completo:', error);
      console.error('[FutureEntryModal] ❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      this.showFeedback(
        `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'error'
      );
    } finally {
      this.setFormDisabled(false);
    }
  }

  /**
   * Mostra mensagem de feedback
   */
  private showFeedback(message: string, type: 'info' | 'success' | 'error'): void {
    const feedback = document.getElementById('futureModalFeedback');
    if (!feedback) return;

    feedback.textContent = message;
    feedback.className = `modal-feedback modal-feedback--${type}`;
    feedback.style.display = 'block';

    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        feedback.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Habilita/desabilita o formulário
   */
  private setFormDisabled(disabled: boolean): void {
    if (!this.form) return;

    const inputs = this.form.querySelectorAll('input, button, select, textarea');
    inputs.forEach(input => {
      (input as HTMLInputElement | HTMLButtonElement).disabled = disabled;
    });
  }

  /**
   * Abre o modal
   */
  open(): void {
    if (!this.modal) return;
    
    console.log('[FutureEntryModal] Modal aberto');
    this.modal.style.display = 'flex';
    this.modal.setAttribute('aria-hidden', 'false');
    
    // Adiciona classe ao botão FAB
    const fabBtn = document.getElementById('openEntryModal');
    if (fabBtn) {
      fabBtn.classList.add('modal-open');
      console.log('[FutureEntryModal] ✅ Classe modal-open adicionada ao botão FAB');
    }
    
    // Preenche próximo orçamento
    this.fillNextBudget();
    
    // Foca no primeiro campo
    const firstInput = this.form?.querySelector('input[type="number"]') as HTMLInputElement;
    firstInput?.focus();
    
    // Garante que o sinal inicia como despesa
    this.setSignState(true);
  }

  /**
   * Fecha o modal
   */
  close(): void {
    if (!this.modal) return;
    
    console.log('[FutureEntryModal] Modal fechado');
    this.modal.style.display = 'none';
    this.modal.setAttribute('aria-hidden', 'true');
    
    // Remove classe do botão FAB
    const fabBtn = document.getElementById('openEntryModal');
    if (fabBtn) {
      fabBtn.classList.remove('modal-open');
      console.log('[FutureEntryModal] ✅ Classe modal-open removida do botão FAB');
    }
    
    // Limpa feedback
    const feedback = document.getElementById('futureModalFeedback');
    if (feedback) {
      feedback.style.display = 'none';
    }
  }

  /**
   * Preenche campo de orçamento com a próxima data disponível
   */
  private fillNextBudget(): void {
    const budgetInput = document.getElementById('futureExpenseBudget') as HTMLInputElement;
    if (!budgetInput) return;
    
    // Extrai datas de orçamento únicas dos entries
    const budgetDates = [...new Set(
      this.entries
        .map(e => e.orcamento)
        .filter(o => o !== null && o !== undefined && !isNaN(Number(o)))
        .map(o => Number(o))
    )].sort((a, b) => a - b);
    
    if (budgetDates.length === 0) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      budgetInput.value = `${year}-${month}-01`;
      return;
    }
    
    const now = new Date();
    const todaySerial = Math.floor((now.getTime() - new Date(1899, 11, 31).getTime()) / 86400000) + 1;
    
    const nextBudget = budgetDates.find(d => d >= todaySerial);
    
    if (nextBudget) {
      const date = new Date(1899, 11, 31);
      date.setDate(date.getDate() + nextBudget - 1);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      budgetInput.value = `${year}-${month}-${day}`;
    } else {
      const lastBudget = budgetDates[budgetDates.length - 1];
      const date = new Date(1899, 11, 31);
      date.setDate(date.getDate() + lastBudget - 1);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      budgetInput.value = `${year}-${month}-${day}`;
    }
  }
}

// ============================================================================
// API Pública
// ============================================================================

/**
 * Inicializa o modal de lançamento futuro
 */
export async function initFutureEntryModal(callback?: OnEntryAddedCallback): Promise<FutureEntryModal> {
  if (modalInstance) {
    console.warn('[FutureEntryModal] Modal já inicializado');
    return modalInstance;
  }

  modalInstance = new FutureEntryModal();
  await modalInstance.init(callback);
  
  return modalInstance;
}

/**
 * Abre o modal
 */
export function openFutureEntryModal(): void {
  if (!modalInstance) {
    console.error('[FutureEntryModal] Modal não inicializado. Chame initFutureEntryModal() primeiro.');
    return;
  }
  
  modalInstance.open();
}

/**
 * Fecha o modal
 */
export function closeFutureEntryModal(): void {
  if (!modalInstance) {
    console.error('[FutureEntryModal] Modal não inicializado.');
    return;
  }
  
  modalInstance.close();
}

/**
 * Retorna a instância do modal
 */
export function getFutureEntryModalInstance(): FutureEntryModal | null {
  return modalInstance;
}
