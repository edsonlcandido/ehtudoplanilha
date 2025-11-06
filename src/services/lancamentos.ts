/**
 * Serviço de Lançamentos
 * Gerencia operações de lançamentos financeiros
 * Migrado de pb_public_/js/lancamentos-manager.js
 */

import { pb } from '../main';
import type { SheetEntry, SheetEntriesResponse, SortType } from '../types';
import { excelSerialToDate } from '../utils/date-helpers';
import { CacheService, CACHE_KEYS } from './cache';

/**
 * Serviço de gerenciamento de lançamentos
 */
class LancamentosService {
  
  /**
   * Busca lançamentos da planilha
   * @param limit - Número máximo de entradas (padrão: 100)
   * @param forceRefresh - Se true, ignora o cache e busca do servidor
   */
  async fetchEntries(limit = 100, forceRefresh = false): Promise<SheetEntriesResponse> {
    if (!pb) {
      throw new Error('PocketBase não inicializado');
    }

    // Se não for forceRefresh, tenta usar o cache
    if (!forceRefresh) {
      const cacheKey = CACHE_KEYS.SHEET_ENTRIES;
      const cached = CacheService.get<SheetEntriesResponse>(cacheKey);
      
      if (cached) {
        console.log('[LancamentosService] Usando dados do cache');
        // Se limit > 0 e o cache tem mais entradas, retorna apenas o necessário
        // Se limit === 0, retorna todas as entradas do cache
        if (limit > 0 && cached.entries && cached.entries.length > limit) {
          return {
            ...cached,
            entries: cached.entries.slice(0, limit),
          };
        }
        return cached;
      }
    }

    // Busca do servidor
    try {
      console.log('[LancamentosService] Buscando dados do servidor');
      const response = await fetch(`${pb.baseURL}/get-sheet-entries?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${pb.authStore.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar entradas da planilha');
      }

      // Salva no cache (sempre salva o resultado completo)
      const cacheKey = CACHE_KEYS.SHEET_ENTRIES;
      CacheService.set(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Erro ao buscar entradas da planilha:', error);
      throw error;
    }
  }

  /**
   * Invalida o cache de lançamentos
   * Deve ser chamado após operações que modificam os lançamentos
   */
  invalidateCache(): void {
    console.log('[LancamentosService] Invalidando caches de lançamentos');
    CacheService.clear(CACHE_KEYS.SHEET_ENTRIES);
    CacheService.clear(CACHE_KEYS.SHEET_CATEGORIES);
  }

  /**
   * Edita um lançamento na planilha
   */
  async editEntry(rowIndex: number, entry: Partial<SheetEntry>): Promise<any> {
    if (!pb) {
      throw new Error('PocketBase não inicializado');
    }

    try {
      const response = await fetch(`${pb.baseUrl}/edit-sheet-entry`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${pb.authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rowIndex,
          ...entry
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao editar lançamento');
      }

      // Invalida o cache após edição bem-sucedida
      this.invalidateCache();

      return data;
    } catch (error) {
      console.error('Erro ao editar lançamento:', error);
      throw error;
    }
  }

  /**
   * Deleta um lançamento da planilha
   */
  async deleteEntry(rowIndex: number): Promise<any> {
    if (!pb) {
      throw new Error('PocketBase não inicializado');
    }

    try {
      const response = await fetch(`${pb.baseUrl}/delete-sheet-entry`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${pb.authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rowIndex })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao deletar lançamento');
      }

      // Invalida o cache após deleção bem-sucedida
      this.invalidateCache();

      return data;
    } catch (error) {
      console.error('Erro ao deletar lançamento:', error);
      throw error;
    }
  }

  /**
   * Verifica se uma linha está totalmente em branco
   */
  isBlankEntry(entry: SheetEntry): boolean {
    if (!entry) return true;
    // Campos relevantes da interface SheetEntry
    const campos: (keyof SheetEntry)[] = ['data', 'conta', 'valor', 'descricao', 'categoria', 'orcamento', 'obs'];
    return campos.every(campo => {
      const valor = entry[campo];
      if (valor === null || valor === undefined) return true;
      if (typeof valor === 'number') {
        return false;
      }
      return String(valor).trim() === '';
    });
  }

  /**
   * Normaliza um lançamento (converte seriais para datas)
   */
  normalizeEntry(entry: SheetEntry): SheetEntry {
    const normalized = { ...entry };

    // Normaliza data
    if (typeof normalized.data === 'number') {
      const dateObj = excelSerialToDate(normalized.data);
      if (dateObj) {
        normalized.data = dateObj.toISOString();
      }
    }

    // Normaliza orçamento
    if (typeof normalized.orcamento === 'number') {
      const dateObj = excelSerialToDate(normalized.orcamento);
      if (dateObj) {
        normalized.orcamento = dateObj.toISOString().split('T')[0];
      }
    }

    return normalized;
  }

  /**
   * Ordena lançamentos
   */
  sortEntries(entries: SheetEntry[], sortBy: SortType): SheetEntry[] {
    const sorted = [...entries];

    if (sortBy === 'original') {
      return sorted.sort((a, b) => (b.rowIndex || 0) - (a.rowIndex || 0));
    }

    if (sortBy === 'date') {
      return sorted.sort((a, b) => {
        const dateA = this.getDateValue(a.data);
        const dateB = this.getDateValue(b.data);
        return dateB - dateA;
      });
    }

    if (sortBy === 'budget_date') {
      return sorted.sort((a, b) => {
        const budgetA = this.getDateValue(a.orcamento);
        const budgetB = this.getDateValue(b.orcamento);
        if (budgetA !== budgetB) {
          return budgetB - budgetA;
        }
        const dateA = this.getDateValue(a.data);
        const dateB = this.getDateValue(b.data);
        return dateB - dateA;
      });
    }

    return sorted;
  }

  /**
   * Obtém valor numérico de uma data para ordenação
   * Retorna Number.MAX_SAFE_INTEGER para datas inválidas (coloca no final)
   */
  private getDateValue(date: string | number | undefined): number {
    if (!date) return Number.MAX_SAFE_INTEGER;
    if (typeof date === 'number') return date;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
  }

  /**
   * Filtra lançamentos por termo de pesquisa
   */
  filterEntries(entries: SheetEntry[], searchTerm: string): SheetEntry[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return entries;
    }

    const term = searchTerm.toLowerCase().trim();

    return entries.filter(entry => {
      const data = this.formatDateForSearch(entry.data);
      const valor = String(entry.valor || '');
      const descricao = String(entry.descricao || '').toLowerCase();
      const categoria = String(entry.categoria || '').toLowerCase();
      const conta = String(entry.conta || '').toLowerCase();
      const obs = String(entry.obs || '').toLowerCase();

      return (
        data.includes(term) ||
        valor.includes(term) ||
        descricao.includes(term) ||
        categoria.includes(term) ||
        conta.includes(term) ||
        obs.includes(term)
      );
    });
  }

  /**
   * Formata data para pesquisa
   */
  private formatDateForSearch(date: string | number | undefined): string {
    if (!date) return '';
    
    let dateObj: Date | null = null;
    
    if (typeof date === 'number') {
      dateObj = excelSerialToDate(date);
    } else {
      dateObj = new Date(date);
    }

    if (!dateObj || isNaN(dateObj.getTime())) return '';

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  }

  /**
   * Busca contas únicas dos lançamentos
   */
  getUniqueAccounts(entries: SheetEntry[]): string[] {
    const accounts = new Set<string>();
    entries.forEach(entry => {
      if (entry.conta && typeof entry.conta === 'string') {
        accounts.add(entry.conta.trim());
      }
    });
    return Array.from(accounts).sort();
  }

  /**
   * Busca categorias únicas dos lançamentos
   */
  getUniqueCategories(entries: SheetEntry[]): string[] {
    const categories = new Set<string>();
    entries.forEach(entry => {
      if (entry.categoria && typeof entry.categoria === 'string') {
        categories.add(entry.categoria.trim());
      }
    });
    return Array.from(categories).sort();
  }

  /**
   * Busca descrições únicas dos lançamentos
   */
  getUniqueDescriptions(entries: SheetEntry[]): string[] {
    const descriptions = new Set<string>();
    entries.forEach(entry => {
      if (entry.descricao && typeof entry.descricao === 'string') {
        descriptions.add(entry.descricao.trim());
      }
    });
    return Array.from(descriptions).sort();
  }
}

// Exporta instância singleton
export const lancamentosService = new LancamentosService();
export default lancamentosService;
