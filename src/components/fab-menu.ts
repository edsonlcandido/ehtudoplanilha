/**
 * Componente FAB Menu
 * Menu expansível do botão flutuante de adicionar lançamento
 */

// Singleton instance
let fabMenuInstance: FabMenu | null = null;

/**
 * Classe do menu FAB expansível
 */
class FabMenu {
  private fabButton: HTMLElement | null = null;
  private menuContainer: HTMLElement | null = null;
  private isExpanded: boolean = false;

  /**
   * Template HTML do menu FAB
   */
  private getTemplate(): string {
    return `
      <div id="fabMenuContainer" class="fab-menu" style="display: none;">
        <button 
          id="fabOptionTransfer" 
          class="fab-menu__option" 
          aria-label="Transferência"
          title="Transferência">
          <span class="fab-menu__icon">⇄</span>
          <span class="fab-menu__label">Transferência</span>
        </button>
        
        <button 
          id="fabOptionFuture" 
          class="fab-menu__option" 
          aria-label="Lançamento futuro"
          title="Lançamento futuro">
          <span class="fab-menu__icon">📅</span>
          <span class="fab-menu__label">Lançamento futuro</span>
        </button>
        
        <button 
          id="fabOptionEntry" 
          class="fab-menu__option" 
          aria-label="Receita/despesa"
          title="Receita/despesa">
          <span class="fab-menu__icon">💲</span>
          <span class="fab-menu__label">Receita/despesa</span>
        </button>
      </div>
    `;
  }

  /**
   * Inicializa o menu FAB
   */
  init(
    onEntryClick: () => void,
    onFutureClick: () => void,
    onTransferClick: () => void
  ): void {
    console.log('[FabMenu] Inicializando...');

    // Injeta o template no body
    document.body.insertAdjacentHTML('beforeend', this.getTemplate());

    // Referências aos elementos
    this.menuContainer = document.getElementById('fabMenuContainer');
    this.fabButton = document.getElementById('openEntryModal');

    if (!this.menuContainer || !this.fabButton) {
      throw new Error('[FabMenu] Elementos do FAB menu não encontrados');
    }

    // Substitui o texto do botão FAB por um ícone
    this.fabButton.innerHTML = '+';

    // Event listeners
    this.setupEventListeners(onEntryClick, onFutureClick, onTransferClick);

    console.log('[FabMenu] ✅ Inicializado com sucesso');
  }

  /**
   * Configura event listeners
   */
  private setupEventListeners(
    onEntryClick: () => void,
    onFutureClick: () => void,
    onTransferClick: () => void
  ): void {
    if (!this.fabButton || !this.menuContainer) return;

    // Toggle do menu ao clicar no FAB
    this.fabButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Opção: Receita/despesa
    const optionEntry = document.getElementById('fabOptionEntry');
    optionEntry?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.collapse();
      onEntryClick();
    });

    // Opção: Lançamento futuro
    const optionFuture = document.getElementById('fabOptionFuture');
    optionFuture?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.collapse();
      onFutureClick();
    });

    // Opção: Transferência
    const optionTransfer = document.getElementById('fabOptionTransfer');
    optionTransfer?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.collapse();
      onTransferClick();
    });

    // Fecha o menu ao clicar fora
    document.addEventListener('click', (e) => {
      if (
        this.isExpanded &&
        !this.menuContainer?.contains(e.target as Node) &&
        !this.fabButton?.contains(e.target as Node)
      ) {
        this.collapse();
      }
    });

    // Fecha o menu com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isExpanded) {
        this.collapse();
      }
    });
  }

  /**
   * Alterna a expansão do menu
   */
  toggle(): void {
    if (this.isExpanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  /**
   * Expande o menu
   */
  expand(): void {
    if (!this.menuContainer || !this.fabButton) return;

    this.isExpanded = true;
    this.menuContainer.style.display = 'flex';
    this.fabButton.classList.add('fab-button--expanded');
    
    // Anima a entrada dos itens
    setTimeout(() => {
      this.menuContainer?.classList.add('fab-menu--visible');
    }, 10);

    console.log('[FabMenu] Menu expandido');
  }

  /**
   * Colapsa o menu
   */
  collapse(): void {
    if (!this.menuContainer || !this.fabButton) return;

    this.isExpanded = false;
    this.menuContainer.classList.remove('fab-menu--visible');
    this.fabButton.classList.remove('fab-button--expanded');
    
    // Aguarda a animação antes de esconder
    setTimeout(() => {
      if (this.menuContainer) {
        this.menuContainer.style.display = 'none';
      }
    }, 300);

    console.log('[FabMenu] Menu colapsado');
  }

  /**
   * Verifica se o menu está expandido
   */
  isMenuExpanded(): boolean {
    return this.isExpanded;
  }
}

// ============================================================================
// API Pública
// ============================================================================

/**
 * Inicializa o menu FAB
 */
export function initFabMenu(
  onEntryClick: () => void,
  onFutureClick: () => void,
  onTransferClick: () => void
): FabMenu {
  if (fabMenuInstance) {
    console.warn('[FabMenu] Menu já inicializado');
    return fabMenuInstance;
  }

  fabMenuInstance = new FabMenu();
  fabMenuInstance.init(onEntryClick, onFutureClick, onTransferClick);
  
  return fabMenuInstance;
}

/**
 * Retorna a instância do menu FAB
 */
export function getFabMenuInstance(): FabMenu | null {
  return fabMenuInstance;
}
