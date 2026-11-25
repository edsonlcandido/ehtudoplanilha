/**
 * Componente de Modal para Transferência
 * Form com: data, valor, conta saída, conta entrada, orçamento
 * Categoria sempre "Transferência"
 */

import type { OnEntryAddedCallback, SheetEntry, LancamentosMeta } from '../types';
import lancamentosService, { primeiroDiaDoMes } from '../services/lancamentos';
import { SheetsService } from '../services/sheets';

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
  /** opções/datas-chave calculadas pelo backend */
  private meta: LancamentosMeta | null = null;

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
      // Busca entries usando LancamentosService (com cache)
      const response = await lancamentosService.fetchEntries({ limit: 0 });
      this.entries = response?.entries ?? [];
      this.meta = response?.meta ?? null;
      
      // Extrai contas únicas
      this.accounts = [...new Set(
        this.entries
          .map(e => e.conta)
          .filter(c => c && c.trim())
      )].sort();

      console.log('[TransferEntryModal] ✅ Dados carregados');

    } catch (error) {
      console.error('[TransferEntryModal] ⚠️ Erro ao carregar dados:', error);
    }
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
    
    // O payload vai no formato do formulário: a normalização pra "DD/MM/YYYY"
    // é feita no BACKEND.
    const data: TransferEntryFormData = {
      data: dataStr,
      valor: parseFloat(valorStr),
      contaSaida: formData.get('contaSaida') as string,
      contaEntrada: formData.get('contaEntrada') as string,
      orcamento: orcamentoStr,
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

      // Usa SheetsService que invalida o cache automaticamente
      await SheetsService.appendEntry(payloadSaida as any);

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

      // Usa SheetsService que invalida o cache automaticamente
      await SheetsService.appendEntry(payloadEntrada as any);

      console.log('[TransferEntryModal] ✅ Transferência realizada com sucesso');
      
      this.showFeedback('✅ Transferência realizada com sucesso!', 'success');
      
      // Limpa o formulário
      this.form?.reset();

      // Chama callback se fornecido
      if (this.callback) {
        this.callback({ success: true });
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
    
    // Adiciona classe ao botão FAB
    const fabBtn = document.getElementById('openEntryModal');
    if (fabBtn) {
      fabBtn.classList.add('modal-open');
      console.log('[TransferEntryModal] ✅ Classe modal-open adicionada ao botão FAB');
    }
    
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
    
    // Remove classe do botão FAB
    const fabBtn = document.getElementById('openEntryModal');
    if (fabBtn) {
      fabBtn.classList.remove('modal-open');
      console.log('[TransferEntryModal] ✅ Classe modal-open removida do botão FAB');
    }
    
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
   *
   * A REGRA é do backend (`meta.proximoOrcamento`): primeira data-chave que
   * ainda vai acontecer; se não houver, a última existente; se não existir
   * nenhuma, o primeiro dia do mês.
   */
  private fillNextBudget(): void {
    const budgetInput = document.getElementById('transferBudget') as HTMLInputElement;
    if (!budgetInput) return;

    budgetInput.value = this.meta?.proximoOrcamento || primeiroDiaDoMes();
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
