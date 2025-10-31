/**
 * Componente de Modal para Adicionar Lançamento
 * Baseado em pb_public_/js/components/entry-modal.js
 */

import config from '../config/env';
import { pb } from '../main';
import { toExcelSerialDia } from '../utils/date-helpers';
import type { EntryFormData, EntryPayload, OnEntryAddedCallback, SheetEntry } from '../types';

// Singleton instance
let modalInstance: EntryModal | null = null;

/**
 * Classe principal do modal de adicionar lançamento
 */
class EntryModal {
  private modal: HTMLElement | null = null;
  private form: HTMLFormElement | null = null;
  private callback: OnEntryAddedCallback | undefined;
  private accounts: string[] = [];
  private categories: string[] = [];
  private descriptions: string[] = [];
  private entries: SheetEntry[] = [];

  /**
   * Template HTML do modal (exatamente como no pb_public_)
   */
  private getTemplate(): string {
    return `
      <div id="entryModal" class="entry-modal" aria-hidden="true" style="display: none;">
        <div class="entry-modal__content">
          <button id="closeEntryModal" class="entry-modal__close" aria-label="Fechar modal">×</button>
          <h3 class="entry-modal__title">Lançamento de Despesa/Receita</h3>
          <form id="expenseForm" class="entry-modal__form">
            <fieldset>
              <div class="form-group">
                <label for="expenseDate">Data:</label>
                <input type="datetime-local" id="expenseDate" name="data" class="form-control" required>
              </div>
              
              <div class="form-group">
                <label for="expenseAccount">Conta:</label>
                <input type="text" id="expenseAccount" name="conta" class="form-control" placeholder="Ex: Conta Corrente" autocomplete="off" required>
              </div>
              
              <div class="form-group valor-toggle-group">
                <label for="expenseValue">Valor:</label>
                <div class="valor-toggle-container">
                  <button type="button" id="expenseSignBtn" class="button outline entry-toggle entry-toggle--expense" aria-label="Alternar sinal">−</button>
                  <input type="number" id="expenseValue" name="valor" class="form-control" step="0.01" min="0" placeholder="0,00" required>
                  <input type="hidden" id="expenseSignValue" name="sinal" value="−">
                </div>
              </div>
              
              <div class="form-group">
                <label for="expenseDescription">Descrição:</label>
                <input type="text" id="expenseDescription" name="descricao" class="form-control" placeholder="Descrição da despesa" autocomplete="off" required>
              </div>
              
              <div class="form-group">
                <label for="expenseCategory">Categoria:</label>
                <input type="text" id="expenseCategory" name="categoria" class="form-control" placeholder="Digite uma categoria" autocomplete="off" required>
              </div>
              
              <div class="form-group">
                <label for="expenseBudget">Orçamento (data-chave):</label>
                <input type="date" id="expenseBudget" name="orcamento" class="form-control" required>
              </div>
              
              <div id="modalFeedback" class="modal-feedback" style="display: none;"></div>
              
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
    console.log('[EntryModal] Inicializando...');
    
    this.callback = callback;

    // Injeta o template no body
    document.body.insertAdjacentHTML('beforeend', this.getTemplate());

    // Referências aos elementos
    this.modal = document.getElementById('entryModal');
    this.form = document.getElementById('expenseForm') as HTMLFormElement;

    if (!this.modal || !this.form) {
      throw new Error('[EntryModal] Elementos do modal não encontrados');
    }

    // Event listeners
    this.setupEventListeners();
    
    // Inicializa estado do sinal como despesa
    this.setSignState(true);

    // Carrega dados de autocomplete
    await this.loadAutocompleteData();

    console.log('[EntryModal] ✅ Inicializado com sucesso');
  }

  /**
   * Configura event listeners
   */
  private setupEventListeners(): void {
    // Botão de fechar
    const closeBtn = document.getElementById('closeEntryModal');
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
    const signBtn = document.getElementById('expenseSignBtn');
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

    // Autocomplete para conta
    this.setupAccountAutocomplete();
  }

  /**
   * Configura autocomplete para categoria
   */
  private setupCategoryAutocomplete(): void {
    const input = document.getElementById('expenseCategory') as HTMLInputElement;
    if (!input) return;

    let container = this.ensureSuggestionsContainer('catSuggestions', input);

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
    const input = document.getElementById('expenseDescription') as HTMLInputElement;
    if (!input) return;

    let container = this.ensureSuggestionsContainer('descSuggestions', input);

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
      const categoryInput = document.getElementById('expenseCategory') as HTMLInputElement;
      if (categoryInput) {
        categoryInput.value = entry.categoria;
      }
    }
  }

  /**
   * Configura autocomplete para conta
   */
  private setupAccountAutocomplete(): void {
    const input = document.getElementById('expenseAccount') as HTMLInputElement;
    if (!input) return;

    let container = this.ensureSuggestionsContainer('accountSuggestions', input);

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
   * Carrega dados para autocomplete do backend
   */
  private async loadAutocompleteData(): Promise<void> {
    console.log('[EntryModal] 📦 Carregando dados para autocomplete...');
    console.log('[EntryModal] Auth token:', pb.authStore.token ? 'Presente' : 'Ausente');
    
    try {
      // Busca entries do backend
      const entriesUrl = `${config.pocketbaseUrl}/get-sheet-entries?limit=0`;
      console.log('[EntryModal] Buscando entries de:', entriesUrl);
      
      const responseEntries = await fetch(entriesUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
        },
      });
      
      if (responseEntries.ok) {
        const data = await responseEntries.json();
        this.entries = data?.entries ?? [];
        
        console.log('[EntryModal] Entries recebidos:', this.entries.length);
        
        // Extrai contas únicas
        this.accounts = [...new Set(
          this.entries
            .map(e => e.conta)
            .filter(c => c && c.trim())
        )].sort();
        
        console.log('[EntryModal] Contas extraídas:', this.accounts);
        
        // Extrai descrições únicas
        this.descriptions = [...new Set(
          this.entries
            .map(e => e.descricao)
            .filter(d => d && d.trim())
        )].sort();
        
        console.log('[EntryModal] Descrições extraídas:', this.descriptions.length);
      } else {
        console.warn('[EntryModal] ⚠️ Erro ao buscar entries:', responseEntries.status, responseEntries.statusText);
        const errorText = await responseEntries.text();
        console.warn('[EntryModal] Resposta:', errorText);
      }

      // Busca categorias do backend
      const categoriesUrl = `${config.pocketbaseUrl}/get-sheet-categories`;
      console.log('[EntryModal] Buscando categorias de:', categoriesUrl);
      
      const responseCat = await fetch(categoriesUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
        },
      });
      
      if (responseCat.ok) {
        const catData = await responseCat.json();
        this.categories = catData?.success && Array.isArray(catData.categories) 
          ? catData.categories 
          : [];
        
        console.log('[EntryModal] Categorias recebidas:', this.categories);
      } else {
        console.warn('[EntryModal] ⚠️ Erro ao buscar categorias:', responseCat.status, responseCat.statusText);
        const errorText = await responseCat.text();
        console.warn('[EntryModal] Resposta:', errorText);
      }

      console.log('[EntryModal] ✅ Dados carregados:', {
        accounts: this.accounts.length,
        categories: this.categories.length,
        descriptions: this.descriptions.length,
      });

    } catch (error) {
      console.error('[EntryModal] ⚠️ Erro ao carregar dados:', error);
      // Continua com arrays vazios
    }
  }

  /**
   * Alterna o sinal entre + e -
   */
  private toggleSign(): void {
    const signBtn = document.getElementById('expenseSignBtn');
    const isExpense = signBtn?.textContent?.trim() === '−';
    this.setSignState(!isExpense);
  }

  /**
   * Define o estado do sinal (despesa ou receita)
   */
  private setSignState(isExpense: boolean): void {
    const signBtn = document.getElementById('expenseSignBtn');
    const signValue = document.getElementById('expenseSignValue') as HTMLInputElement;
    
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

    const formData = new FormData(this.form);
    
    // Pega valores do formulário
    const dataStr = formData.get('data') as string;          // "2025-10-31T14:41"
    const orcamentoStr = formData.get('orcamento') as string; // "2025-10-31"
    const valorStr = formData.get('valor') as string;
    
    // Converte orçamento para serial INTEIRO (igual ao original)
    const [ano, mes, dia] = orcamentoStr.split('-').map(n => parseInt(n, 10));
    const dataSimples = new Date(ano, mes - 1, dia); // 00:00 local
    const orcamentoSerial = toExcelSerialDia(dataSimples); // sempre inteiro
    
    const data: EntryFormData = {
      data: dataStr, // Mantém como string
      conta: formData.get('conta') as string,
      valor: parseFloat(valorStr),
      descricao: formData.get('descricao') as string,
      categoria: formData.get('categoria') as string,
      orcamento: orcamentoStr,
    };

    // Aplica o sinal ao valor
    const sign = (document.getElementById('expenseSignValue') as HTMLInputElement)?.value;
    const sinal = (sign === '−' || sign === '-') ? -1 : 1;
    data.valor = sinal * Math.abs(data.valor);

    await this.submitEntry(data, orcamentoSerial);
  }

  /**
   * Envia o lançamento para o backend
   */
  private async submitEntry(data: EntryFormData, orcamentoSerial: number): Promise<void> {
    this.showFeedback('Enviando...', 'info');
    this.setFormDisabled(true);

    try {
      const payload: EntryPayload = {
        data: data.data,           // String datetime-local "2025-10-31T14:41"
        conta: data.conta,
        valor: data.valor,
        descricao: data.descricao,
        categoria: data.categoria,
        orcamento: orcamentoSerial, // Número inteiro
      };

      console.log('[EntryModal] 📤 Enviando:', payload);

      const response = await fetch(`${config.pocketbaseUrl}/append-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao adicionar lançamento');
      }

      console.log('[EntryModal] ✅ Sucesso:', result);
      
      this.showFeedback('✅ Lançamento adicionado com sucesso!', 'success');
      
      // Limpa o formulário
      this.form?.reset();
      this.setSignState(true); // Volta para despesa

      // Chama callback se fornecido
      if (this.callback) {
        this.callback(result);
      }

      // Fecha o modal após 1.5s
      setTimeout(() => this.close(), 1500);

    } catch (error) {
      console.error('[EntryModal] ❌ Erro:', error);
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
    const feedback = document.getElementById('modalFeedback');
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
    
    console.log('[EntryModal] Modal aberto');
    this.modal.style.display = 'flex';
    this.modal.setAttribute('aria-hidden', 'false');
    
    // Foca no primeiro campo
    const firstInput = this.form?.querySelector('input');
    firstInput?.focus();
    
    // Garante que o sinal inicia como despesa
    this.setSignState(true);
  }

  /**
   * Fecha o modal
   */
  close(): void {
    if (!this.modal) return;
    
    console.log('[EntryModal] Modal fechado');
    this.modal.style.display = 'none';
    this.modal.setAttribute('aria-hidden', 'true');
    
    // Limpa feedback
    const feedback = document.getElementById('modalFeedback');
    if (feedback) {
      feedback.style.display = 'none';
    }
  }
}

// ============================================================================
// API Pública
// ============================================================================

/**
 * Inicializa o modal de adicionar lançamento
 */
export async function initEntryModal(callback?: OnEntryAddedCallback): Promise<EntryModal> {
  if (modalInstance) {
    console.warn('[EntryModal] Modal já inicializado');
    return modalInstance;
  }

  modalInstance = new EntryModal();
  await modalInstance.init(callback);
  
  return modalInstance;
}

/**
 * Abre o modal
 */
export function openEntryModal(): void {
  if (!modalInstance) {
    console.error('[EntryModal] Modal não inicializado. Chame initEntryModal() primeiro.');
    return;
  }
  
  modalInstance.open();
}

/**
 * Fecha o modal
 */
export function closeEntryModal(): void {
  if (!modalInstance) {
    console.error('[EntryModal] Modal não inicializado.');
    return;
  }
  
  modalInstance.close();
}

/**
 * Retorna a instância do modal
 */
export function getEntryModalInstance(): EntryModal | null {
  return modalInstance;
}
