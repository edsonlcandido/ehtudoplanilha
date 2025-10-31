/**
 * Dashboard Principal
 * Apenas inicialização básica e menu de usuário
 */

import { renderUserMenu } from '../components/user-menu';
import { initEntryModal, openEntryModal } from '../components/entry-modal';

// ============================================================================
// Inicialização
// ============================================================================

async function init(): Promise<void> {
  // Renderiza menu do usuário
  renderUserMenu();

  // Inicializa modal de lançamento
  await initEntryModal(() => {
    console.log('✅ Lançamento adicionado! Recarregue a página para ver as mudanças.');
    // TODO: Implementar reload automático dos cards
  });

  // Botão de adicionar lançamento
  const addBtn = document.getElementById('openEntryModal');
  addBtn?.addEventListener('click', () => {
    openEntryModal();
  });

  console.log('✅ Dashboard inicializado');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

