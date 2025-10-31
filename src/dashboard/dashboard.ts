/**
 * Dashboard Principal
 * Apenas inicialização básica e menu de usuário
 */

import { renderUserMenu } from '../components/user-menu';
import { initEntryModal, openEntryModal, closeEntryModal } from '../components/entry-modal';

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

  // Botão de adicionar lançamento (toggle: abre/fecha)
  const addBtn = document.getElementById('openEntryModal');
  addBtn?.addEventListener('click', () => {
    const modal = document.getElementById('entryModal');
    const isOpen = modal?.style.display === 'flex';
    
    if (isOpen) {
      closeEntryModal();
    } else {
      openEntryModal();
    }
  });

  console.log('✅ Dashboard inicializado');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

