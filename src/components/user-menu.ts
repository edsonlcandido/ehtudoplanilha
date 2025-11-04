import { isAuthenticated, getCurrentUser, logoutAndReload } from '../services/auth';

/**
 * Renderiza o menu do usuário baseado no estado de autenticação
 */
export function renderUserMenu(): void {
  const menuUser = document.getElementById('menu-user');
  
  if (!menuUser) {
    console.error('[UserMenu] Elemento #menu-user não encontrado no DOM');
    return;
  }

  if (isAuthenticated()) {
    renderAuthenticatedMenu(menuUser);
  } else {
    renderGuestMenu(menuUser);
  }
}

/**
 * Renderiza menu para usuário autenticado
 */
function renderAuthenticatedMenu(menuElement: HTMLElement): void {
  const user = getCurrentUser();
  
  if (!user) {
    renderGuestMenu(menuElement);
    return;
  }

  // Limpa classes antigas
  menuElement.classList.remove('user-menu--guest');
  menuElement.classList.add('user-menu--authenticated');

  menuElement.innerHTML = `
    <div class="user-menu__item">
      <span class="user-menu__email" title="${escapeHtml(user.email)}">
        ${escapeHtml(user.email)}
      </span>
    </div>
    
    <div class="user-menu__separator"></div>
    
    <div class="user-menu__item">
      <a 
        href="/dashboard/index.html" 
        class="user-menu__button user-menu__button--primary user-menu__button--icon"
        id="dashboardBtn"
        title="Ir para Dashboard"
      >
        <span>🏠</span>
        <span>Dashboard</span>
      </a>
    </div>
    
    <div class="user-menu__item">
      <a 
        href="/dashboard/configuracao.html" 
        class="user-menu__button user-menu__button--secondary user-menu__button--icon"
        id="configBtn"
        title="Abrir Configuração"
      >
        <span>⚙️</span>
        <span>Config</span>
      </a>
    </div>
    
    <div class="user-menu__item">
      <button 
        type="button"
        class="user-menu__button user-menu__button--danger user-menu__button--icon"
        id="logoutBtn"
        title="Sair da aplicação"
        aria-label="Fazer logout"
      >
        <span>🚪</span>
        <span>Sair</span>
      </button>
    </div>
  `;
  
  // Adiciona listeners aos botões
  setupAuthenticatedMenuListeners();
}

/**
 * Renderiza menu para usuário não autenticado
 */
function renderGuestMenu(menuElement: HTMLElement): void {
  // Limpa classes antigas
  menuElement.classList.remove('user-menu--authenticated');
  menuElement.classList.add('user-menu--guest');

  menuElement.innerHTML = `
    <div class="user-menu__item">
      <a 
        href="/" 
        class="user-menu__button user-menu__button--secondary user-menu__button--icon"
        title="Voltar à página inicial"
      >
        <span>🏠</span>
        <span>Home</span>
      </a>
    </div>
    
    <div class="user-menu__item">
      <a 
        href="/login.html" 
        class="user-menu__button user-menu__button--primary user-menu__button--icon"
        id="loginBtn"
        title="Fazer login"
      >
        <span>🔑</span>
        <span>Login</span>
      </a>
    </div>
    
    <div class="user-menu__item">
      <a 
        href="/registro.html" 
        class="user-menu__button user-menu__button--secondary user-menu__button--icon"
        id="registerBtn"
        title="Criar nova conta"
      >
        <span>👤</span>
        <span>Registrar</span>
      </a>
    </div>
  `;
}

/**
 * Configura listeners para o menu autenticado
 */
function setupAuthenticatedMenuListeners(): void {
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

/**
 * Handler do botão de logout
 */
function handleLogout(event: Event): void {
  event.preventDefault();
  
  // Confirmação com feedback visual
  const shouldLogout = confirm('Deseja realmente sair? Você será desconectado.');
  
  if (shouldLogout) {
    // Opcional: adicionar loading state
    const logoutBtn = event.target as HTMLButtonElement;
    if (logoutBtn) {
      logoutBtn.disabled = true;
      logoutBtn.classList.add('is-loading');
      logoutBtn.textContent = '🔄 Saindo...';
    }
    
    logoutAndReload();
  }
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Inicializa o menu do usuário
 * Pode ser chamado múltiplas vezes com segurança
 */
export function initUserMenu(): void {
  renderUserMenu();
}
