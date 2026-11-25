/**
 * Componente de Modal para Ajuste de Saldo da Conta
 *
 * O usuário informa o NOVO saldo desejado para uma conta e o app cria um
 * lançamento de ajuste na planilha com:
 *   - data/hora : momento do ajuste (agora)
 *   - conta     : conta que está sendo ajustada
 *   - valor     : DELTA (novo saldo - saldo atual), para que a soma dos
 *                 lançamentos da conta passe a ser exatamente o novo saldo
 *   - categoria : "Outras"
 *   - descrição: "Ajuste de saldo (<novo saldo>)"
 *   - orçamento : data-chave do mês corrente
 *
 * Exemplo: saldo atual -3200, novo saldo -4000 -> lançamento de -800.
 */

import type { OnEntryAddedCallback, SheetEntry } from '../types';
import lancamentosService from '../services/lancamentos';
import { SheetsService } from '../services/sheets';
import { formatarMoeda } from './financial-cards';

// Singleton instance
let modalInstance: BalanceAdjustModal | null = null;

/**
 * Categoria usada no lançamento de ajuste (categoria padrão da planilha)
 */
const CATEGORIA_AJUSTE = 'Outras';

interface BalanceAdjustFormData {
  conta: string;
  saldoAtual: number;
  novoSaldo: number;
  delta: number;
}

/**
 * Classe principal do modal de ajuste de saldo
 */
class BalanceAdjustModal {
  private modal: HTMLElement | null = null;
  private form: HTMLFormElement | null = null;
  private callback: OnEntryAddedCallback | undefined;
  private entries: SheetEntry[] = [];
  /** Contas disponíveis (para o autocomplete) */
  private accounts: string[] = [];
  /** Saldo atual por conta (mesma base usada pelo dashboard) */
  private saldoPorConta: Map<string, number> = new Map();

  /**
   * Template HTML do modal
   */
  private getTemplate(): string {
    return `
      <div id="balanceAdjustModal" class="entry-modal" aria-hidden="true" style="display: none;">
        <div class="entry-modal__content">
          <button id="closeBalanceAdjustModal" class="entry-modal__close" aria-label="Fechar modal">×</button>
          <h3 class="entry-modal__title">Ajuste de Saldo da Conta</h3>
          <form id="balanceAdjustForm" class="entry-modal__form">
            <fieldset>
              <div class="form-group">
                <label for="balanceAdjustAccount">Conta:</label>
                <input
                  type="text"
                  id="balanceAdjustAccount"
                  name="conta"
                  class="form-control"
                  placeholder="Ex: Conta Corrente"
                  autocomplete="off"
                  required
                >
              </div>

              <div class="form-group">
                <label for="balanceAdjustCurrent">Saldo atual da conta:</label>
                <output id="balanceAdjustCurrent" class="balance-adjust__current">R$ 0,00</output>
              </div>

              <div class="form-group">
                <label for="balanceAdjustTarget">Novo saldo:</label>
                <input
                  type="number"
                  id="balanceAdjustTarget"
                  name="novoSaldo"
                  class="form-control"
                  step="0.01"
                  placeholder="-4000"
                  required
                >
                <small class="balance-adjust__hint">
                  Use valor negativo para saldo devedor. Ex.: -4000
                </small>
              </div>

              <div id="balanceAdjustPreview" class="balance-adjust__preview" style="display: none;"></div>

              <div id="balanceAdjustFeedback" class="modal-feedback" style="display: none;"></div>

              <div class="form-actions">
                <button type="reset" class="button warning">Limpar</button>
                <button type="submit" class="button success">Ajustar saldo</button>
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
    console.log('[BalanceAdjustModal] Inicializando...');

    this.callback = callback;

    // Injeta o template no body
    document.body.insertAdjacentHTML('beforeend', this.getTemplate());

    // Referências aos elementos
    this.modal = document.getElementById('balanceAdjustModal');
    this.form = document.getElementById('balanceAdjustForm') as HTMLFormElement;

    if (!this.modal || !this.form) {
      throw new Error('[BalanceAdjustModal] Elementos do modal não encontrados');
    }

    this.setupEventListeners();

    // Carrega lançamentos (para montar contas e saldos)
    await this.loadData();

    console.log('[BalanceAdjustModal] ✅ Inicializado com sucesso');
  }

  /**
   * Configura event listeners
   */
  private setupEventListeners(): void {
    // Botão de fechar
    const closeBtn = document.getElementById('closeBalanceAdjustModal');
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

    // Reset do formulário
    this.form?.addEventListener('reset', () => {
      setTimeout(() => {
        this.updatePreview();
        this.showFeedback('', 'info');
      }, 0);
    });

    // Conta digitada -> recalcula saldo atual e preview
    const accountInput = document.getElementById('balanceAdjustAccount') as HTMLInputElement;
    accountInput?.addEventListener('input', () => this.updatePreview());

    // Novo saldo digitado -> recalcula preview
    const targetInput = document.getElementById('balanceAdjustTarget') as HTMLInputElement;
    targetInput?.addEventListener('input', () => this.updatePreview());

    // Autocomplete de contas (mesmo padrão do modal de lançamento)
    this.setupAccountAutocomplete();
  }

  /**
   * Configura autocomplete para conta (idêntico ao do modal de lançamento)
   */
  private setupAccountAutocomplete(): void {
    const input = document.getElementById('balanceAdjustAccount') as HTMLInputElement;
    if (!input) return;

    const container = this.ensureSuggestionsContainer('balanceAdjustAccountSuggestions', input);

    // Mostra todas as contas ao focar (antes de digitar)
    input.addEventListener('focus', () => {
      if (this.accounts.length > 0) {
        this.showAllSuggestions(input, container, this.accounts);
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
        this.updatePreview();
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

    // Se não tem query, mostra todas
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
        this.updatePreview();
      });
      container.appendChild(item);
    });

    container.style.display = 'block';
  }

  /**
   * Carrega lançamentos e monta o mapa conta -> saldo
   */
  private async loadData(): Promise<void> {
    try {
      const response = await lancamentosService.fetchEntries({ limit: 0 });
      this.entries = response?.entries ?? [];
      this.buildSaldoPorConta();
    } catch (error) {
      console.error('[BalanceAdjustModal] ⚠️ Erro ao carregar dados:', error);
      this.entries = [];
      this.buildSaldoPorConta();
    }
  }

  /**
   * Calcula o saldo por conta.
   * Usa a MESMA base do dashboard (soma de todos os lançamentos da conta,
   * inclusive os futuros), para que o resultado bata com o valor exibido.
   */
  private buildSaldoPorConta(): void {
    const map = new Map<string, number>();

    this.entries.forEach(entry => {
      const conta = String(entry.conta || '').trim();
      if (!conta) return;

      const valor = Number(entry.valor) || 0;
      map.set(conta, (map.get(conta) || 0) + valor);
    });

    this.saldoPorConta = map;

    // Lista de contas para o autocomplete (mesma ordem do modal de lançamento)
    this.accounts = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Preenche o campo de conta (usado ao abrir o modal pelo card do dashboard)
   */
  private fillAccountInput(conta?: string): void {
    const input = document.getElementById('balanceAdjustAccount') as HTMLInputElement;
    if (!input) return;

    input.value = conta || '';
  }

  /**
   * Retorna a conta informada no campo
   */
  private getSelectedConta(): string {
    const input = document.getElementById('balanceAdjustAccount') as HTMLInputElement;
    return input?.value?.trim() || '';
  }

  /**
   * Verifica se a conta informada existe nos lançamentos
   */
  private contaExiste(conta: string): boolean {
    if (!conta) return false;
    if (this.saldoPorConta.has(conta)) return true;
    return Array.from(this.saldoPorConta.keys())
      .some(c => c.toLowerCase() === conta.toLowerCase());
  }

  /**
   * Retorna o saldo atual da conta informada
   */
  private getCurrentSaldo(): number {
    const conta = this.getSelectedConta();
    if (!conta) return 0;

    if (this.saldoPorConta.has(conta)) {
      return this.saldoPorConta.get(conta) || 0;
    }

    // Fallback: mesma conta com caixa diferente (ex.: "nubank" vs "NUBANK")
    const found = Array.from(this.saldoPorConta.entries())
      .find(([c]) => c.toLowerCase() === conta.toLowerCase());

    return found ? found[1] : 0;
  }

  /**
   * Atualiza o campo "Saldo atual" e o preview do lançamento
   */
  private updatePreview(): void {
    const currentEl = document.getElementById('balanceAdjustCurrent');
    const previewEl = document.getElementById('balanceAdjustPreview');
    const targetInput = document.getElementById('balanceAdjustTarget') as HTMLInputElement;

    const conta = this.getSelectedConta();
    const saldoAtual = this.getCurrentSaldo();
    const contaExiste = this.contaExiste(conta);

    if (currentEl) {
      currentEl.textContent = conta ? formatarMoeda(saldoAtual) : '—';
    }

    const targetStr = targetInput?.value?.trim() || '';
    const hasTarget = targetStr !== '' && !isNaN(Number(targetStr));

    if (!previewEl) return;

    if (!conta || !hasTarget) {
      previewEl.style.display = 'none';
      previewEl.innerHTML = '';
      return;
    }

    const novoSaldo = Number(targetStr);
    const delta = Number((novoSaldo - saldoAtual).toFixed(2));

    previewEl.style.display = 'block';
    previewEl.innerHTML = `
      <div class="balance-adjust__preview-title">Lançamento que será criado</div>
      ${contaExiste ? '' : `
      <div class="balance-adjust__preview-warning">
        ⚠️ Conta sem lançamentos no app — saldo atual considerado R$ 0,00
      </div>`}
      <div class="balance-adjust__preview-line">
        <span>Saldo atual</span>
        <strong>${formatarMoeda(saldoAtual)}</strong>
      </div>
      <div class="balance-adjust__preview-line">
        <span>Novo saldo</span>
        <strong>${formatarMoeda(novoSaldo)}</strong>
      </div>
      <div class="balance-adjust__preview-line">
        <span>Valor do lançamento</span>
        <strong class="${delta < 0 ? 'is-negative' : 'is-positive'}">${formatarMoeda(delta)}</strong>
      </div>
      <div class="balance-adjust__preview-line">
        <span>Descrição</span>
        <strong>${this.buildDescription(novoSaldo)}</strong>
      </div>
      <div class="balance-adjust__preview-line">
        <span>Categoria</span>
        <strong>${CATEGORIA_AJUSTE}</strong>
      </div>
    `;
  }

  /**
   * Monta a descrição do lançamento de ajuste
   * Ex.: saldo novo -4000 -> "Ajuste de saldo (-4000)"
   */
  private buildDescription(novoSaldo: number): string {
    return `Ajuste de saldo (${this.formatTargetValue(novoSaldo)})`;
  }

  /**
   * Formata o valor alvo para a descrição (sem separador de milhar)
   */
  private formatTargetValue(value: number): string {
    const rounded = Number(Number(value).toFixed(2));
    return String(rounded);
  }

  /**
   * Manipula o submit do formulário
   */
  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.form) return;

    const formData = new FormData(this.form);
    const conta = (formData.get('conta') as string || '').trim();
    const targetStr = (formData.get('novoSaldo') as string || '').trim();

    if (!conta) {
      this.showFeedback('Selecione a conta que será ajustada.', 'error');
      return;
    }

    if (targetStr === '' || isNaN(Number(targetStr))) {
      this.showFeedback('Informe o novo saldo da conta.', 'error');
      return;
    }

    const data: BalanceAdjustFormData = {
      conta,
      saldoAtual: this.getCurrentSaldo(),
      novoSaldo: Number(targetStr),
      delta: 0
    };
    data.delta = Number((data.novoSaldo - data.saldoAtual).toFixed(2));

    // Não faz sentido criar um lançamento de valor zero
    if (data.delta === 0) {
      this.showFeedback(
        `O saldo de ${conta} já é ${formatarMoeda(data.saldoAtual)}. Nenhum ajuste é necessário.`,
        'info'
      );
      return;
    }

    await this.submitAdjust(data);
  }

  /**
   * Envia o lançamento de ajuste para o backend
   */
  private async submitAdjust(data: BalanceAdjustFormData): Promise<void> {
    this.showFeedback('Enviando...', 'info');
    this.setFormDisabled(true);

    try {
      const now = new Date();

      const payload = {
        data: this.formatDateTime(now),
        conta: data.conta,
        valor: data.delta,
        descricao: this.buildDescription(data.novoSaldo),
        categoria: CATEGORIA_AJUSTE,
        orcamento: this.resolveBudgetDate()
      };

      console.log('[BalanceAdjustModal] 📤 Enviando:', payload);

      // Usa SheetsService que invalida o cache automaticamente
      await SheetsService.appendEntry(payload as any);

      console.log('[BalanceAdjustModal] ✅ Ajuste de saldo criado com sucesso');

      this.showFeedback('✅ Saldo atualizado com sucesso!', 'success');

      // Limpa o formulário
      this.form?.reset();

      // Chama callback se fornecido
      if (this.callback) {
        this.callback({ success: true });
      }

      // Fecha o modal após 1.5s
      setTimeout(() => this.close(), 1500);

    } catch (error) {
      console.error('[BalanceAdjustModal] ❌ Erro:', error);
      this.showFeedback(
        `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'error'
      );
    } finally {
      this.setFormDisabled(false);
    }
  }

  /**
   * Resolve a data-chave (orçamento) do lançamento.
   * Usa a data-chave já existente no mês corrente; se não houver, usa o
   * primeiro dia do mês corrente.
   *
   * A data-chave chega pronta do backend em `orcamentoInput` ("YYYY-MM-DD"),
   * então aqui é só comparação de string (sem matemática de data).
   */
  private resolveBudgetDate(): string {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const candidates = this.entries
      .map(entry => entry.orcamentoInput)
      .filter((value): value is string => !!value)
      .filter(value => value.slice(0, 7) === currentMonth)
      .sort();

    if (candidates.length > 0) {
      return candidates[0];
    }

    return `${currentMonth}-01`;
  }

  /**
   * Data/hora atual no formato do formulário ("YYYY-MM-DDTHH:MM")
   */
  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Mostra mensagem de feedback
   */
  private showFeedback(message: string, type: 'info' | 'success' | 'error'): void {
    const feedback = document.getElementById('balanceAdjustFeedback');
    if (!feedback) return;

    if (!message) {
      feedback.style.display = 'none';
      feedback.textContent = '';
      return;
    }

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
   * @param conta - Conta pré-selecionada (opcional)
   */
  open(conta?: string): void {
    if (!this.modal) return;

    console.log('[BalanceAdjustModal] Modal aberto', conta ? `para a conta ${conta}` : '');

    this.modal.style.display = 'flex';
    this.modal.setAttribute('aria-hidden', 'false');

    // Adiciona classe ao botão FAB
    const fabBtn = document.getElementById('openEntryModal');
    if (fabBtn) {
      fabBtn.classList.add('modal-open');
    }

    // Recarrega dados para garantir saldo atualizado
    this.loadData().then(() => {
      this.fillAccountInput(conta);
      this.updatePreview();
    });

    // Foca no campo de conta
    setTimeout(() => {
      const accountInput = document.getElementById('balanceAdjustAccount') as HTMLInputElement;
      accountInput?.focus();
    }, 100);
  }

  /**
   * Fecha o modal
   */
  close(): void {
    if (!this.modal) return;

    console.log('[BalanceAdjustModal] Modal fechado');

    this.modal.style.display = 'none';
    this.modal.setAttribute('aria-hidden', 'true');

    // Remove classe do botão FAB
    const fabBtn = document.getElementById('openEntryModal');
    if (fabBtn) {
      fabBtn.classList.remove('modal-open');
    }

    // Limpa feedback
    const feedback = document.getElementById('balanceAdjustFeedback');
    if (feedback) {
      feedback.style.display = 'none';
    }
  }
}

// ============================================================================
// API Pública
// ============================================================================

/**
 * Inicializa o modal de ajuste de saldo
 */
export async function initBalanceAdjustModal(callback?: OnEntryAddedCallback): Promise<BalanceAdjustModal> {
  if (modalInstance) {
    console.warn('[BalanceAdjustModal] Modal já inicializado');
    return modalInstance;
  }

  modalInstance = new BalanceAdjustModal();
  await modalInstance.init(callback);

  return modalInstance;
}

/**
 * Abre o modal de ajuste de saldo
 * @param conta - Conta pré-selecionada (opcional)
 */
export function openBalanceAdjustModal(conta?: string): void {
  if (!modalInstance) {
    console.error('[BalanceAdjustModal] Modal não inicializado. Chame initBalanceAdjustModal() primeiro.');
    return;
  }

  modalInstance.open(conta);
}

/**
 * Fecha o modal de ajuste de saldo
 */
export function closeBalanceAdjustModal(): void {
  if (!modalInstance) {
    console.error('[BalanceAdjustModal] Modal não inicializado.');
    return;
  }

  modalInstance.close();
}

/**
 * Retorna a instância do modal
 */
export function getBalanceAdjustModalInstance(): BalanceAdjustModal | null {
  return modalInstance;
}
