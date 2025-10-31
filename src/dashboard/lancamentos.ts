/**
 * Página de Lançamentos
 * Gerencia a lista de lançamentos e modais
 */

import { renderUserMenu } from '../components/user-menu';
import { initEntryModal, openEntryModal } from '../components/entry-modal';

// ============================================================================
// Inicialização
// ============================================================================

async function init(): Promise<void> {
  // Renderiza menu do usuário
  renderUserMenu();

  // Inicializa modal de adicionar lançamento
  await initEntryModal((result) => {
    console.log('✅ Lançamento adicionado:', result);
    // Recarrega a página para mostrar o novo lançamento
    window.location.reload();
  });

  // Configura botões de adicionar (header e FAB)
  const addBtn = document.getElementById('openAddEntryModalBtn');
  const fabBtn = document.getElementById('openEntryModal');
  
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      console.log('🔓 Abrindo modal de adicionar lançamento...');
      openEntryModal();
    });
  }
  
  if (fabBtn) {
    fabBtn.addEventListener('click', () => {
      console.log('🔓 Abrindo modal de adicionar lançamento (FAB)...');
      openEntryModal();
    });
  }

  console.log('✅ Página de lançamentos inicializada');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

