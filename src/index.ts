import './main';
import { initUserMenu } from './components/user-menu';
import { config } from './config/env';

/**
 * Inicializa a página index
 */
function init(): void {
  // Log de ambiente em desenvolvimento
  if (config.isDevelopment) {
    console.log('[Index] Página inicializada em modo desenvolvimento');
  }

  // Inicializa o menu do usuário
  initUserMenu();
}

/**
 * Garante que a inicialização ocorra após o DOM estar pronto
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
