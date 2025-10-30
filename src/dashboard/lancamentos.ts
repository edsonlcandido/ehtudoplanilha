/**
 * Página de Lançamentos
 * Apenas inicialização básica e menu de usuário
 */

import { renderUserMenu } from '../components/user-menu';

// ============================================================================
// Inicialização
// ============================================================================

function init(): void {
  // Renderiza menu do usuário
  renderUserMenu();

  console.log('✅ Página de lançamentos inicializada');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
