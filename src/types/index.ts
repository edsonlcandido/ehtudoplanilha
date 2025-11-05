import PocketBase, { type RecordModel } from 'pocketbase';

/**
 * Modelo de usuário do PocketBase
 * Estende RecordModel com propriedades específicas de usuário
 */
export interface User extends RecordModel {
  email: string;
  username?: string;
  verified?: boolean;
  name?: string;
  emailVisibility?: boolean;
  avatar?: string;
}

/**
 * Modelo de registro google_infos
 */
export interface GoogleInfo extends RecordModel {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  sheet_id?: string;
  sheet_name?: string;
  last_success_append_at?: string;
}

/**
 * Modelo de lançamento financeiro
 */
export interface SheetEntry {
  data: string | number;
  conta: string;
  valor: number;
  descricao: string;
  categoria: string;
  orcamento: string | number;
  obs?: string;
  rowIndex?: number;
}

/**
 * Dados do formulário de lançamento
 */
export interface EntryFormData {
  data: string;
  conta: string;
  valor: number;
  descricao: string;
  categoria: string;
  orcamento: string;
  obs?: string;
}

/**
 * Payload para enviar ao backend
 */
export interface EntryPayload {
  data: string;
  conta: string;
  valor: number;
  descricao: string;
  categoria: string;
  orcamento: string | number;
  obs?: string;
}

/**
 * Callback quando lançamento é adicionado
 */
export type OnEntryAddedCallback = (result: any) => void;

/**
 * Callback quando lançamento é editado
 */
export type OnEntryEditedCallback = (result: any) => void;

/**
 * Tipos de ordenação de lançamentos
 */
export type SortType = 'original' | 'budget_date' | 'date';

/**
 * Estado de filtros e ordenação
 */
export interface LancamentosState {
  entries: SheetEntry[];
  filteredEntries: SheetEntry[];
  originalEntries: SheetEntry[];
  searchTerm: string;
  sortBy: SortType;
  hideBlankDates: boolean;
  isLoading: boolean;
}

/**
 * Resposta da API de lançamentos
 */
export interface SheetEntriesResponse {
  entries: SheetEntry[];
  total?: number;
}

/**
 * Instância global do PocketBase
 */
export type PocketBaseInstance = PocketBase;

/**
 * Declaração global para window.pb
 */
declare global {
  interface Window {
    pb: PocketBaseInstance;
  }
}

/**
 * Re-exporta utilitários de conversão de data
 * Funções para converter entre JavaScript Date e Excel Serial
 */
export {
  toExcelSerial,
  toExcelSerialDia,
  excelSerialToDate,
  excelSerialToMonthLabel,
  excelSerialToDateTimeLabel,
  dateTimeLocalToDate,
  dateInputToDate,
  getIntervalSerials,
  filterEntriesByInterval
} from '../utils/date-helpers';
