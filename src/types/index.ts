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
 * Modelo de categoria completa da planilha
 */
export interface CategoryComplete {
  categoria: string;
  tipo: string;
  orcamento: number;
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
 * Filtros avançados de lançamentos
 */
export interface LancamentosFilters {
  conta: string;
  dataInicio: string;
  dataFim: string;
  orcamento: string;
  categoria: string;
}

/**
 * Estado de filtros e ordenação
 */
export interface LancamentosState {
  entries: SheetEntry[];
  filteredEntries: SheetEntry[];
  originalEntries: SheetEntry[];
  searchTerm: string;
  sortBy: SortType;
  showConsolidated: boolean;
  showFuture: boolean;
  isLoading: boolean;
  filters: LancamentosFilters;
  filterPanelOpen: boolean;
}

/**
 * Resposta da API de lançamentos
 */
export interface SheetEntriesResponse {
  entries: SheetEntry[];
  total?: number;
}

/**
 * Agrupamento de uma conta dentro de um orçamento
 * Mantido pelo helper de grouping; o componente de resumo dos
 * filtros atualmente consome apenas os `totals` do GroupedSummary.
 */
export interface AccountGroup {
  conta: string;
  receitas: number;
  despesas: number;
  saldo: number;
  count: number;
  entries: SheetEntry[];
}

/**
 * Agrupamento de um orçamento contendo várias contas
 * Mantido pelo helper de grouping; o componente de resumo dos
 * filtros atualmente consome apenas os `totals` do GroupedSummary.
 */
export interface BudgetGroup {
  orcamento: string;        // chave normalizada (ex: "10/2025")
  orcamentoLabel: string;   // label exibido (ex: "Outubro/2025")
  receitas: number;
  despesas: number;
  saldo: number;
  count: number;
  accounts: AccountGroup[];
}

/**
 * Resultado do agrupamento das entradas filtradas.
 * O componente `grouped-summary.ts` consome apenas o campo `totals`.
 */
export interface GroupedSummary {
  groups: BudgetGroup[];
  totals: {
    receitas: number;
    despesas: number;
    saldo: number;
    count: number;
  };
}

/**
 * Agrupamento de uma conta dentro de um orçamento
 */
export interface AccountGroup {
  conta: string;
  receitas: number;
  despesas: number;
  saldo: number;
  count: number;
  entries: SheetEntry[];
}

/**
 * Agrupamento de um orçamento contendo várias contas
 */
export interface BudgetGroup {
  orcamento: string;
  orcamentoLabel: string;
  receitas: number;
  despesas: number;
  saldo: number;
  count: number;
  accounts: AccountGroup[];
}

/**
 * Resultado do agrupamento completo
 */
export interface GroupedSummary {
  groups: BudgetGroup[];
  totals: {
    receitas: number;
    despesas: number;
    saldo: number;
    count: number;
  };
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
