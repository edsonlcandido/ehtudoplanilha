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

export default pb;
