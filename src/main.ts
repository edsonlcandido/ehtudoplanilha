import PocketBase from 'pocketbase';
import { config } from './config/env';
import type { PocketBaseInstance } from './types';

/**
 * Inicializa e exporta a instância do PocketBase
 * A URL é automaticamente configurada baseada no ambiente (dev/prod)
 */
const pb: PocketBaseInstance = new PocketBase(config.pocketbaseUrl);

// Log de debug em desenvolvimento
if (config.isDevelopment) {
  console.log('[PocketBase] Inicializado em modo desenvolvimento');
  console.log('[PocketBase] URL:', config.pocketbaseUrl);
}

/**
 * Exporta a instância do PocketBase
 */
export { pb };

/**
 * Torna disponível globalmente para compatibilidade com código legado
 */
if (typeof window !== 'undefined') {
  window.pb = pb;
}

/**
 * Injeta modal de logout no DOM
 * Este modal é usado em todas as páginas
 */
function injectLogoutModal(): void {
  // Verifica se já existe
  if (document.getElementById('logoutModal')) {
    return;
  }

  const modalHTML = `
    <div id="logoutModal" class="confirm-modal" style="display:none;">
      <div class="confirm-modal__content">
        <button class="confirm-modal__close" id="closeLogoutModal">×</button>
        <h3 class="confirm-modal__title">Confirmar Saída</h3>
        
        <div class="confirm-modal__body">
          <p class="confirm-modal__message">
            Deseja realmente sair? Você será desconectado.
          </p>
          
          <p class="confirm-modal__warning">
            Seus dados estão salvos e você pode fazer login novamente a qualquer momento.
          </p>
        </div>
        
        <div class="confirm-modal__actions">
          <button type="button" class="button" id="cancelLogoutBtn">Cancelar</button>
          <button type="button" class="button error" id="confirmLogoutBtn">🚪 Sair</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Injeta o modal quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectLogoutModal);
} else {
  injectLogoutModal();
}

export default pb;
