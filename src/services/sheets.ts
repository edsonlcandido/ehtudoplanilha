import { pb } from '../main';
import { API_ENDPOINTS } from '../config/env';
import { CacheService, CACHE_KEYS } from './cache';
import type { CategoryComplete } from '../types';

/**
 * Interface para resposta de lista de planilhas
 */
export interface GoogleSheet {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * Interface para status de configuração
 */
export interface ConfigStatus {
  hasRefreshToken: boolean;
  hasSheetId: boolean;
  sheetId?: string;
  sheetName?: string;
}

/**
 * Interface para lançamento
 */
export interface SheetEntry {
  rowIndex: number;
  data: string;
  conta: string;
  valor: number;
  descricao: string;
  categoria: string;
  tipo: string;
}

/**
 * Interface para resumo financeiro
 */
export interface FinancialSummary {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  porCategoria: {
    categoria: string;
    total: number;
  }[];
}

/**
 * Serviço para integração com Google Sheets via PocketBase hooks
 */
export class SheetsService {
  /**
   * Verifica se o usuário tem refresh token do Google
   */
  static async checkRefreshToken(): Promise<boolean> {
    try {
      const response = await pb.send<{ hasRefreshToken: boolean }>(
        API_ENDPOINTS.checkRefreshToken,
        { method: 'GET' }
      );
      return response.hasRefreshToken;
    } catch (error) {
      console.error('[SheetsService] Erro ao verificar refresh token:', error);
      return false;
    }
  }

  /**
   * Lista as planilhas do Google Drive do usuário
   */
  static async listGoogleSheets(): Promise<GoogleSheet[]> {
    try {
      const response = await pb.send<{ sheets: GoogleSheet[] }>(
        API_ENDPOINTS.listGoogleSheets,
        { method: 'GET' }
      );
      return response.sheets || [];
    } catch (error) {
      console.error('[SheetsService] Erro ao listar planilhas:', error);
      throw error;
    }
  }

  /**
   * Salva o ID da planilha selecionada
   */
  static async saveSheetId(sheetId: string, sheetName: string): Promise<void> {
    try {
      await pb.send(API_ENDPOINTS.saveSheetId, {
        method: 'POST',
        body: { 
          sheet_id: sheetId, 
          sheet_name: sheetName 
        },
      });
    } catch (error) {
      console.error('[SheetsService] Erro ao salvar sheet ID:', error);
      throw error;
    }
  }

  /**
   * Provisiona uma nova planilha a partir do template
   */
  static async provisionSheet(): Promise<{ sheetId: string; sheetName: string }> {
    try {
      const response = await pb.send<{ sheetId: string; sheetName: string }>(
        API_ENDPOINTS.provisionSheet,
        { method: 'POST' }
      );
      return response;
    } catch (error) {
      console.error('[SheetsService] Erro ao provisionar planilha:', error);
      throw error;
    }
  }

  /**
   * Obtém a planilha atual do usuário
   */
  static async getCurrentSheet(): Promise<{ sheetId?: string; sheetName?: string }> {
    try {
      const response = await pb.send<{ sheetId?: string; sheetName?: string }>(
        API_ENDPOINTS.getCurrentSheet,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      console.error('[SheetsService] Erro ao obter planilha atual:', error);
      return {};
    }
  }

  /**
   * Obtém o status de configuração do usuário
   */
  static async getConfigStatus(): Promise<ConfigStatus> {
    try {
      const response = await pb.send<ConfigStatus>(
        API_ENDPOINTS.configStatus,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      console.error('[SheetsService] Erro ao obter status:', error);
      return {
        hasRefreshToken: false,
        hasSheetId: false,
      };
    }
  }

  /**
   * Adiciona um lançamento na planilha
   */
  static async appendEntry(entry: Omit<SheetEntry, 'rowIndex'>): Promise<void> {
    try {
      await pb.send(API_ENDPOINTS.appendEntry, {
        method: 'POST',
        body: entry,
      });
      
      // Invalida os caches após adicionar lançamento
      console.log('[SheetsService] Invalidando caches após adicionar lançamento');
      CacheService.clear(CACHE_KEYS.SHEET_ENTRIES);
      CacheService.clear(CACHE_KEYS.SHEET_CATEGORIES);
      CacheService.clear(CACHE_KEYS.SHEET_CATEGORIES_COMPLETE);
    } catch (error) {
      console.error('[SheetsService] Erro ao adicionar lançamento:', error);
      throw error;
    }
  }

  /**
   * Edita um lançamento existente
   */
  static async editEntry(rowIndex: number, entry: Partial<SheetEntry>): Promise<void> {
    try {
      await pb.send(API_ENDPOINTS.editSheetEntry, {
        method: 'PUT',
        body: { rowIndex, ...entry },
      });
      
      // Invalida os caches após editar lançamento
      console.log('[SheetsService] Invalidando caches após editar lançamento');
      CacheService.clear(CACHE_KEYS.SHEET_ENTRIES);
      CacheService.clear(CACHE_KEYS.SHEET_CATEGORIES);
      CacheService.clear(CACHE_KEYS.SHEET_CATEGORIES_COMPLETE);
    } catch (error) {
      console.error('[SheetsService] Erro ao editar lançamento:', error);
      throw error;
    }
  }

  /**
   * Deleta um lançamento
   */
  static async deleteEntry(rowIndex: number): Promise<void> {
    try {
      await pb.send(API_ENDPOINTS.deleteSheetEntry, {
        method: 'DELETE',
        body: { rowIndex },
      });
      
      // Invalida os caches após deletar lançamento
      console.log('[SheetsService] Invalidando caches após deletar lançamento');
      CacheService.clear(CACHE_KEYS.SHEET_ENTRIES);
      CacheService.clear(CACHE_KEYS.SHEET_CATEGORIES);
      CacheService.clear(CACHE_KEYS.SHEET_CATEGORIES_COMPLETE);
    } catch (error) {
      console.error('[SheetsService] Erro ao deletar lançamento:', error);
      throw error;
    }
  }

  /**
   * Obtém os lançamentos de um mês específico
   */
  static async getSheetEntries(month: string, year: string): Promise<SheetEntry[]> {
    try {
      const response = await pb.send<{ entries: SheetEntry[] }>(
        `${API_ENDPOINTS.getSheetEntries}?month=${month}&year=${year}`,
        { method: 'GET' }
      );
      return response.entries || [];
    } catch (error) {
      console.error('[SheetsService] Erro ao obter lançamentos:', error);
      throw error;
    }
  }

  /**
   * Obtém o resumo financeiro de um mês
   */
  static async getFinancialSummary(month: string, year: string): Promise<FinancialSummary> {
    try {
      const response = await pb.send<FinancialSummary>(
        `${API_ENDPOINTS.getFinancialSummary}?month=${month}&year=${year}`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      console.error('[SheetsService] Erro ao obter resumo financeiro:', error);
      throw error;
    }
  }

  /**
   * Obtém os meses disponíveis na planilha
   */
  static async getAvailableMonths(): Promise<string[]> {
    try {
      const response = await pb.send<{ months: string[] }>(
        API_ENDPOINTS.getAvailableMonths,
        { method: 'GET' }
      );
      return response.months || [];
    } catch (error) {
      console.error('[SheetsService] Erro ao obter meses disponíveis:', error);
      return [];
    }
  }

  /**
   * Obtém as categorias da planilha
   * @param forceRefresh - Se true, ignora o cache e busca do servidor
   */
  static async getSheetCategories(forceRefresh = false): Promise<string[]> {
    // Se não for forceRefresh, tenta usar o cache
    if (!forceRefresh) {
      const cached = CacheService.get<{ categories: string[] }>(CACHE_KEYS.SHEET_CATEGORIES);
      if (cached) {
        console.log('[SheetsService] Usando categorias do cache');
        return cached.categories || [];
      }
    }

    try {
      console.log('[SheetsService] Buscando categorias do servidor');
      const response = await pb.send<{ categories: string[] }>(
        API_ENDPOINTS.getSheetCategories,
        { method: 'GET' }
      );
      
      // Salva no cache
      CacheService.set(CACHE_KEYS.SHEET_CATEGORIES, response);
      
      return response.categories || [];
    } catch (error) {
      console.error('[SheetsService] Erro ao obter categorias:', error);
      return [];
    }
  }

  /**
   * Obtém as categorias completas da planilha (categoria, tipo, orcamento)
   * @param forceRefresh - Se true, ignora o cache e busca do servidor
   */
  static async getSheetCategoriesComplete(forceRefresh = false): Promise<CategoryComplete[]> {
    // Se não for forceRefresh, tenta usar o cache
    if (!forceRefresh) {
      const cached = CacheService.get<{ categoriesComplete: CategoryComplete[] }>(CACHE_KEYS.SHEET_CATEGORIES_COMPLETE);
      if (cached) {
        console.log('[SheetsService] Usando categorias completas do cache');
        return cached.categoriesComplete || [];
      }
    }

    try {
      console.log('[SheetsService] Buscando categorias completas do servidor');
      const response = await pb.send<{ categoriesComplete: CategoryComplete[] }>(
        API_ENDPOINTS.getSheetCategoriesComplete,
        { method: 'GET' }
      );
      
      // Salva no cache
      CacheService.set(CACHE_KEYS.SHEET_CATEGORIES_COMPLETE, response);
      
      return response.categoriesComplete || [];
    } catch (error) {
      console.error('[SheetsService] Erro ao obter categorias completas:', error);
      
      // Fallback: tenta usar o endpoint antigo e converte para o novo formato
      console.log('[SheetsService] Tentando fallback para endpoint de categorias antigas');
      try {
        const categories = await SheetsService.getSheetCategories(forceRefresh);
        return categories.map(cat => ({
          categoria: cat,
          tipo: '',
          orcamento: 0
        }));
      } catch (fallbackError) {
        console.error('[SheetsService] Erro no fallback:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Limpa o conteúdo da planilha
   */
  static async clearSheetContent(): Promise<void> {
    try {
      await pb.send(API_ENDPOINTS.clearSheetContent, {
        method: 'POST',
      });
    } catch (error) {
      console.error('[SheetsService] Erro ao limpar planilha:', error);
      throw error;
    }
  }

  /**
   * Deleta a configuração da planilha
   */
  static async deleteSheetConfig(): Promise<void> {
    try {
      await pb.send(API_ENDPOINTS.deleteSheetConfig, {
        method: 'POST',
      });
    } catch (error) {
      console.error('[SheetsService] Erro ao deletar configuração:', error);
      throw error;
    }
  }

  /**
   * Revoga o acesso ao Google
   */
  static async revokeGoogleAccess(): Promise<void> {
    try {
      await pb.send(API_ENDPOINTS.revokeGoogleAccess, {
        method: 'POST',
      });
    } catch (error) {
      console.error('[SheetsService] Erro ao revogar acesso:', error);
      throw error;
    }
  }

  /**
   * Renova o access token usando o refresh token
   */
  static async refreshToken(): Promise<void> {
    try {
      await pb.send(API_ENDPOINTS.googleRefreshToken, {
        method: 'POST',
      });
    } catch (error) {
      console.error('[SheetsService] Erro ao renovar token:', error);
      throw error;
    }
  }
}

export default SheetsService;
