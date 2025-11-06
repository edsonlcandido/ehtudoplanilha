import { pb } from '../main';
import { API_ENDPOINTS } from '../config/env';
import { CacheService, CACHE_KEYS } from './cache';

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
      
      // Invalida o cache após adicionar lançamento
      console.log('[SheetsService] Invalidando cache após adicionar lançamento');
      CacheService.clear(CACHE_KEYS.SHEET_ENTRIES);
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
      
      // Invalida o cache após editar lançamento
      console.log('[SheetsService] Invalidando cache após editar lançamento');
      CacheService.clear(CACHE_KEYS.SHEET_ENTRIES);
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
      
      // Invalida o cache após deletar lançamento
      console.log('[SheetsService] Invalidando cache após deletar lançamento');
      CacheService.clear(CACHE_KEYS.SHEET_ENTRIES);
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
   */
  static async getSheetCategories(): Promise<string[]> {
    try {
      const response = await pb.send<{ categories: string[] }>(
        API_ENDPOINTS.getSheetCategories,
        { method: 'GET' }
      );
      return response.categories || [];
    } catch (error) {
      console.error('[SheetsService] Erro ao obter categorias:', error);
      return [];
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
