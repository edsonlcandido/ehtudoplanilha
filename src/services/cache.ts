/**
 * Serviço de Cache no LocalStorage
 * Implementa cache com TTL para otimizar requisições ao backend
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Chaves de cache usadas pela aplicação
 */
export const CACHE_KEYS = {
  SHEET_ENTRIES: 'ehtudoplanilha:sheet-entries',
  SHEET_CATEGORIES: 'ehtudoplanilha:sheet-categories',
} as const;

/**
 * Serviço de cache com TTL
 */
export class CacheService {
  /**
   * TTL padrão: 5 minutos (em milissegundos)
   */
  private static readonly DEFAULT_TTL = 5 * 60 * 1000;

  /**
   * Armazena dados no cache
   */
  static set<T>(key: string, data: T, ttl: number = CacheService.DEFAULT_TTL): void {
    try {
      const now = Date.now();
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
      };
      localStorage.setItem(key, JSON.stringify(cacheEntry));
      console.log(`[Cache] Dados salvos: ${key} (TTL: ${ttl}ms)`);
    } catch (error) {
      console.error(`[Cache] Erro ao salvar no cache (${key}):`, error);
    }
  }

  /**
   * Recupera dados do cache
   * Retorna null se não existir ou estiver expirado
   */
  static get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) {
        console.log(`[Cache] Cache vazio: ${key}`);
        return null;
      }

      const cacheEntry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();

      // Verifica se expirou
      if (now >= cacheEntry.expiresAt) {
        console.log(`[Cache] Cache expirado: ${key}`);
        CacheService.clear(key);
        return null;
      }

      console.log(`[Cache] Cache hit: ${key} (idade: ${Math.round((now - cacheEntry.timestamp) / 1000)}s)`);
      return cacheEntry.data;
    } catch (error) {
      console.error(`[Cache] Erro ao recuperar do cache (${key}):`, error);
      return null;
    }
  }

  /**
   * Remove um item específico do cache
   */
  static clear(key: string): void {
    try {
      localStorage.removeItem(key);
      console.log(`[Cache] Cache limpo: ${key}`);
    } catch (error) {
      console.error(`[Cache] Erro ao limpar cache (${key}):`, error);
    }
  }

  /**
   * Remove todos os caches da aplicação
   */
  static clearAll(): void {
    try {
      Object.values(CACHE_KEYS).forEach(key => {
        CacheService.clear(key);
      });
      console.log('[Cache] Todos os caches limpos');
    } catch (error) {
      console.error('[Cache] Erro ao limpar todos os caches:', error);
    }
  }

  /**
   * Verifica se um cache existe e está válido
   */
  static isValid(key: string): boolean {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return false;

      const cacheEntry: CacheEntry<any> = JSON.parse(cached);
      const now = Date.now();

      return now < cacheEntry.expiresAt;
    } catch (error) {
      console.error(`[Cache] Erro ao verificar validade do cache (${key}):`, error);
      return false;
    }
  }

  /**
   * Obtém informações sobre o cache (para debug)
   */
  static getInfo(key: string): { exists: boolean; age?: number; ttl?: number } | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) {
        return { exists: false };
      }

      const cacheEntry: CacheEntry<any> = JSON.parse(cached);
      const now = Date.now();
      const age = now - cacheEntry.timestamp;
      const ttl = cacheEntry.expiresAt - now;

      return {
        exists: true,
        age: Math.round(age / 1000), // em segundos
        ttl: ttl > 0 ? Math.round(ttl / 1000) : 0, // em segundos
      };
    } catch (error) {
      console.error(`[Cache] Erro ao obter info do cache (${key}):`, error);
      return null;
    }
  }
}

export default CacheService;
