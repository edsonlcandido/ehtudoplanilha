/**
 * Componente de Modal para Transferência
 * Form com: data, valor, conta saída, conta entrada, orçamento
 * Categoria sempre "Transferência"
 */

import config from '../config/env';
import { pb } from '../main';
import type { OnEntryAddedCallback, SheetEntry } from '../types';

// Singleton instance
let modalInstance: TransferEntryModal | null = null;

interface TransferEntryFormData {
  data: string;      // DD/MM/YYYY HH:mm
  valor: number;
  contaSaida: string;
  contaEntrada: string;
  orcamento: string; // DD/MM/YYYY
}

/**
 * Classe principal do modal de transferência
 */
class TransferEntryModal {
  private modal: HTMLElement | null = null;
  private form: HTMLFormElement | null = null;
  private callback: OnEntryAddedCallback | undefined;
  private accounts: string[] = [];
  private entries: SheetEntry[] = [];

  /**
   * Template HTML do modal
   */
  private getTemplate(): string {
    return `
      <div id="transferEntryModal" class="entry-modal" aria-hidden="true" style="display: none;">
        <div class="entry-modal__content">
          <button id="closeTransferEntryModal" class="entry-modal__close" aria-label="Fechar modal">×</button>
          <h3 class="entry-modal__title">Transferência entre Contas</h3>
          <form id="transferForm" class="entry-modal__form">
            <fieldset>
              <div class="form-group">
                <label for="transferDate">Data:</label>
                <input type="datetime-local" id="transferDate" name="data" class="form-control" required>
              </div>
              
              <div class="form-group">
                <label for="transferValue">Valor:</label>
                <input type="number" id="transferValue" name="valor" class="form-control" step="0.01" min="0.01" placeholder="0,00" required>
              </div>
              
              <div class="form-group">
                <label for="transferAccountOut">Conta Saída:</label>
                <input type="text" id="transferAccountOut" name="contaSaida" class="form-control" placeholder="Ex: Conta Corrente" autocomplete="off" required>
              </div>
              
              <div class="form-group">
                <label for="transferAccountIn">Conta Entrada:</label>
                <input type="text" id="transferAccountIn" name="contaEntrada" class="form-control" placeholder="Ex: Poupança" autocomplete="off" required>
              </div>
              
              <div class="form-group">
                <label for="transferBudget">Orçamento (data-chave):</label>
                <input type="date" id="transferBudget" name="orcamento" class="form-control" required>
              </div>
              
              <div id="transferModalFeedback" class="modal-feedback" style="display: none;"></div>
              
              <div class="form-actions">
                <button type="reset" class="button warning">Limpar</button>
                <button type="submit" class="button success">Transferir</button>
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
    console.log('[TransferEntryModal] Inicializando...');
    
    this.callback = callback;

    // Injeta o template no body
    document.body.insertAdjacentHTML('beforeend', this.getTemplate());

    // Referências aos elementos
    this.modal = document.getElementById('transferEntryModal');
    this.form = document.getElementById('transferForm') as HTMLFormElement;

    if (!this.modal || !this.form) {
      throw new Error('[TransferEntryModal] Elementos do modal não encontrados');
    }

    // Event listeners
    this.setupEventListeners();

    // Carrega dados de autocomplete
    await this.loadAutocompleteData();

    console.log('[TransferEntryModal] ✅ Inicializado com sucesso');
  }

  /**
   * Configura event listeners
   */
  private setupEventListeners(): void {
    // Botão de fechar
    const closeBtn = document.getElementById('closeTransferEntryModal');
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

    // Submit do formulário
    this.form?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Autocomplete para contas
    this.setupAccountAutocomplete('transferAccountOut');
    this.setupAccountAutocomplete('transferAccountIn');
  }

  /**
   * Configura autocomplete para conta
   */
  private setupAccountAutocomplete(inputId: string): void {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (!input) return;

    const containerId = `${inputId}Suggestions`;
    let container = this.ensureSuggestionsContainer(containerId, input);

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
    suggestions: string[]
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
    suggestions: string[]
  ): void {
    container.innerHTML = '';
    const query = input.value.trim().toLowerCase();

    if (!query || query.length < 1) {
      this.showAllSuggestions(input, container, suggestions);
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
      });
      container.appendChild(item);
    });

    container.style.display = 'block';
  }

  /**
   * Carrega dados para autocomplete do backend
   */
  private async loadAutocompleteData(): Promise<void> {
    console.log('[TransferEntryModal] 📦 Carregando dados para autocomplete...');
    
    try {
      // Busca entries do backend
      const entriesUrl = `${config.pocketbaseUrl}/get-sheet-entries?limit=0`;
      
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
        
        // Extrai contas únicas
        this.accounts = [...new Set(
          this.entries
            .map(e => e.conta)
            .filter(c => c && c.trim())
        )].sort();
      }

      console.log('[TransferEntryModal] ✅ Dados carregados');

    } catch (error) {
      console.error('[TransferEntryModal] ⚠️ Erro ao carregar dados:', error);
    }
  }

  /**
   * Formata datetime-local "2025-10-31T14:41" para "31/10/2025 14:41"
   */
  private formatDateTimeLocal(datetimeStr: string): string {
    const [datePart, timePart] = datetimeStr.split('T');
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year} ${timePart}`;
  }

  /**
   * Formata date "2025-10-31" para "31/10/2025"
   */
  private formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Manipula o submit do formulário
   */
  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    if (!this.form) return;

    const formData = new FormData(this.form);
    
    const dataStr = formData.get('data') as string;
    const orcamentoStr = formData.get('orcamento') as string;
    const valorStr = formData.get('valor') as string;
    
    const dataFormatada = this.formatDateTimeLocal(dataStr);
    const orcamentoFormatado = this.formatDate(orcamentoStr);
    
    const data: TransferEntryFormData = {
      data: dataFormatada,
      valor: parseFloat(valorStr),
      contaSaida: formData.get('contaSaida') as string,
      contaEntrada: formData.get('contaEntrada') as string,
      orcamento: orcamentoFormatado,
    };

    await this.submitTransfer(data);
  }

  /**
   * Envia as duas transações de transferência para o backend
   */
  private async submitTransfer(data: TransferEntryFormData): Promise<void> {
    this.showFeedback('Enviando...', 'info');
    this.setFormDisabled(true);

    try {
      // Primeiro lançamento: Saída (negativo)
      const payloadSaida = {
        data: data.data,
        conta: data.contaSaida,
        valor: -Math.abs(data.valor), // Garante que seja sempre negativo
        descricao: `Transferência para ${data.contaEntrada}`,
        categoria: 'Transferência',
        orcamento: data.orcamento,
      };

      console.log('[TransferEntryModal] 📤 Enviando saída:', payloadSaida);

      const responseSaida = await fetch(`${config.pocketbaseUrl}/append-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
        },
        body: JSON.stringify(payloadSaida),
      });

      const resultSaida = await responseSaida.json();

      if (!responseSaida.ok) {
        throw new Error(resultSaida.message || 'Erro ao adicionar lançamento de saída');
      }

      // Segundo lançamento: Entrada (positivo)
      const payloadEntrada = {
        data: data.data,
        conta: data.contaEntrada,
        valor: Math.abs(data.valor), // Garante que seja sempre positivo
        descricao: `Transferência de ${data.contaSaida}`,
        categoria: 'Transferência',
        orcamento: data.orcamento,
      };

      console.log('[TransferEntryModal] 📤 Enviando entrada:', payloadEntrada);

      const responseEntrada = await fetch(`${config.pocketbaseUrl}/append-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
        },
        body: JSON.stringify(payloadEntrada),
      });

      const resultEntrada = await responseEntrada.json();

      if (!responseEntrada.ok) {
        throw new Error(resultEntrada.message || 'Erro ao adicionar lançamento de entrada');
      }

      console.log('[TransferEntryModal] ✅ Sucesso:', { saida: resultSaida, entrada: resultEntrada });
      
      this.showFeedback('✅ Transferência realizada com sucesso!', 'success');
      
      // Limpa o formulário
      this.form?.reset();

      // Chama callback se fornecido
      if (this.callback) {
        this.callback({ saida: resultSaida, entrada: resultEntrada });
      }

      // Fecha o modal após 1.5s
      setTimeout(() => this.close(), 1500);

    } catch (error) {
      console.error('[TransferEntryModal] ❌ Erro:', error);
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
    const feedback = document.getElementById('transferModalFeedback');
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
    
    console.log('[TransferEntryModal] Modal aberto');
    this.modal.style.display = 'flex';
    this.modal.setAttribute('aria-hidden', 'false');
    
    // Preenche data atual
    this.fillCurrentDateTime();
    
    // Preenche próximo orçamento
    this.fillNextBudget();
    
    // Foca no primeiro campo
    const firstInput = this.form?.querySelector('input') as HTMLInputElement;
    firstInput?.focus();
  }

  /**
   * Fecha o modal
   */
  close(): void {
    if (!this.modal) return;
    
    console.log('[TransferEntryModal] Modal fechado');
    this.modal.style.display = 'none';
    this.modal.setAttribute('aria-hidden', 'true');
    
    // Limpa feedback
    const feedback = document.getElementById('transferModalFeedback');
    if (feedback) {
      feedback.style.display = 'none';
    }
  }

  /**
   * Preenche campo de data com data/hora atual
   */
  private fillCurrentDateTime(): void {
    const dateInput = document.getElementById('transferDate') as HTMLInputElement;
    if (!dateInput) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Preenche campo de orçamento com a próxima data disponível
   */
  private fillNextBudget(): void {
    const budgetInput = document.getElementById('transferBudget') as HTMLInputElement;
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
 * Inicializa o modal de transferência
 */
export async function initTransferEntryModal(callback?: OnEntryAddedCallback): Promise<TransferEntryModal> {
  if (modalInstance) {
    console.warn('[TransferEntryModal] Modal já inicializado');
    return modalInstance;
  }

  modalInstance = new TransferEntryModal();
  await modalInstance.init(callback);
  
  return modalInstance;
}

/**
 * Abre o modal
 */
export function openTransferEntryModal(): void {
  if (!modalInstance) {
    console.error('[TransferEntryModal] Modal não inicializado. Chame initTransferEntryModal() primeiro.');
    return;
  }
  
  modalInstance.open();
}

/**
 * Fecha o modal
 */
export function closeTransferEntryModal(): void {
  if (!modalInstance) {
    console.error('[TransferEntryModal] Modal não inicializado.');
    return;
  }
  
  modalInstance.close();
}

/**
 * Retorna a instância do modal
 */
export function getTransferEntryModalInstance(): TransferEntryModal | null {
  return modalInstance;
}
