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

  menuElement.innerHTML = `
    <span class="pseudo button">${escapeHtml(user.email)}</span>
    <a href="dashboard/index.html" class="button success" id="dashboardBtn">Dashboard</a>
    <button class="button error" id="logoutBtn">Sair</button>
  `;
  
  // Adiciona listener ao botão de logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

/**
 * Renderiza menu para usuário não autenticado
 */
function renderGuestMenu(menuElement: HTMLElement): void {
  menuElement.innerHTML = `
    <a href="/" class="pseudo button icon-picture">Home</a>
    <a href="login.html" class="button icon-puzzle" id="loginBtn">Login</a>
    <a href="registro.html" class="button icon-user" id="registerBtn">Registrar</a>
  `;
}

/**
 * Handler do botão de logout
 */
function handleLogout(event: Event): void {
  event.preventDefault();
  
  // Confirmação opcional
  const shouldLogout = confirm('Deseja realmente sair?');
  if (shouldLogout) {
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
