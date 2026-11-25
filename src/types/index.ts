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

// ============================================================================
// DTO de lançamento (normalizado pelo backend)
// ============================================================================

/**
 * Lançamento devolvido pelo backend já normalizado.
 *
 * IMPORTANTE: os campos `data` e `orcamento` mantêm o valor CRU da planilha
 * (serial Excel ou string) por compatibilidade. Os campos derivados são o que
 * o frontend deve usar — não é preciso converter nada aqui.
 */
export interface SheetEntry {
  /** número da linha na planilha (2 = primeira linha de dados) */
  rowIndex: number;

  /** valor cru da coluna A (serial Excel ou string) */
  data: string | number;
  /** serial Excel da data (null quando não há data) */
  dataSerial: number | null;
  /** "31/10/2025 14:41" — pronto pra exibição */
  dataLabel: string | null;
  /** "2025-10-31T14:41" — pronto pra <input type="datetime-local"> */
  dataInput: string | null;

  conta: string;
  valor: number;
  descricao: string;
  categoria: string;

  /** valor cru da coluna F (serial Excel ou string) */
  orcamento: string | number;
  /** serial Excel do dia da data-chave (null quando não há orçamento) */
  orcamentoSerial: number | null;
  /** "31/10/2025" — pronto pra exibição */
  orcamentoLabel: string | null;
  /** "2025-10-31" — pronto pra <input type="date"> */
  orcamentoInput: string | null;

  obs: string;

  /** lançamento sem data (futuro) */
  isFuturo: boolean;
  /** categoria "Transferência" */
  isTransferencia: boolean;
  isReceita: boolean;
  isDespesa: boolean;
}

/** Alias semântico do DTO */
export type Lancamento = SheetEntry;

/**
 * Modelo de categoria completa da planilha
 */
export interface CategoryComplete {
  categoria: string;
  tipo: string;
  orcamento: number;
}

/**
 * Totais calculados no backend
 */
export interface ResumoTotais {
  receitas: number;
  despesas: number;
  saldo: number;
  count: number;
}

/**
 * Opção de orçamento para o filtro (montada pelo backend)
 *
 * O orçamento é a DATA: uma opção por data-chave.
 */
export interface OrcamentoOption {
  /** serial Excel do dia (é o value do <option>) */
  serial: number;
  /** "31/10/2025" — DATA COMPLETA, é o texto exibido */
  label: string;
}

/**
 * Opções de filtro calculadas pelo backend a partir de TODOS os lançamentos
 */
export interface LancamentosMeta {
  contas: string[];
  categorias: string[];
  descricoes: string[];
  orcamentos: OrcamentoOption[];
  /** próxima data-chave sugerida ("YYYY-MM-DD") — já pronta pro <input type="date"> */
  proximoOrcamento: string;
  /** data-chave já existente no mês corrente ("YYYY-MM-DD") */
  orcamentoMesAtual: string;
}

/**
 * Filtro ativo, já com o texto pronto pra tela.
 *
 * O backend decide o que está ativo e como cada um é escrito — o frontend
 * só desenha o pill. Ex.: { tipo: 'orcamento', rotulo: 'Orçamento',
 * valor: '30/11/2026' }
 */
export interface FiltroAtivo {
  tipo: 'conta' | 'categoria' | 'orcamento' | 'periodo' | 'busca';
  rotulo: string;
  valor: string;
}

/**
 * Filtros aplicados (eco do que o backend interpretou)
 */
export interface LancamentosFiltrosBackend {
  q: string;
  conta: string;
  categoria: string;
  orcamento: string;
  dataInicio: string;
  dataFim: string;
  tipo: string;
  sort: string;
  /** filtros realmente aplicados, com o texto pronto pra tela */
  ativos: FiltroAtivo[];
}

/**
 * Resposta da API de lançamentos
 */
export interface SheetEntriesResponse {
  success?: boolean;
  entries: SheetEntry[];
  total: number;
  count: number;
  limit: number;
  offset: number;
  meta: LancamentosMeta;
  resumo: ResumoTotais;
  filtros: LancamentosFiltrosBackend;
}

// ============================================================================
// Dashboard
// ============================================================================

/**
 * Resumo de um orçamento (card do dashboard)
 *
 * O orçamento é a DATA: cada data-chave é um orçamento.
 */
export interface BudgetSummary {
  /** serial Excel da data-chave */
  serial: number;
  /** "31/10/2025" */
  label: string;
  sum: number;
  incomes: number;
  expenses: number;
  count: number;
  /** orçamento dentro do intervalo atual (destacado no card) */
  inInterval: boolean;
}

/**
 * Saldo agregado por conta
 */
export interface AccountSummary {
  conta: string;
  total: number;
  count: number;
}

/**
 * Resposta do endpoint /get-dashboard-data
 */
export interface DashboardData {
  success?: boolean;
  /** "YYYY-MM-DD" — dia usado como referência do intervalo */
  hoje: string;
  intervalo: {
    inicioSerial: number;
    fimSerial: number;
  };
  budgets: BudgetSummary[];
  /** seriais dos orçamentos em destaque */
  budgetsInInterval: number[];
  accounts: AccountSummary[];
  meta: LancamentosMeta;
  resumo: ResumoTotais;
  totalLancamentos: number;
}

/**
 * Categoria agregada (top 10 do dashboard)
 */
export interface CategoriaAggregate {
  categoria: string;
  total: number;
  count: number;
}

/**
 * Fatia do gráfico de rosca (despesas por tipo de categoria)
 */
export interface GraficoTipo {
  tipo: string;
  valor: number;
  percentual: number;
}

/**
 * Resposta do endpoint /get-dashboard-details
 */
export interface DashboardDetails {
  success?: boolean;
  orcamentos: number[];
  topCategorias: CategoriaAggregate[];
  contas: AccountSummary[];
  totalGeral: number;
  grafico: GraficoTipo[];
  graficoTotal: number;
  entradasPorCategoria: Record<string, SheetEntry[]>;
  categoriasCompletas: CategoryComplete[];
}

// ============================================================================
// Formulários e estado
// ============================================================================

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
 * (data/orçamento vão no formato do formulário — o backend normaliza)
 */
export interface EntryPayload {
  data: string;
  conta: string;
  valor: number;
  descricao: string;
  categoria: string;
  orcamento: string;
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
  /** total de lançamentos que passaram pelos filtros (o backend pagina) */
  total: number;
  meta: LancamentosMeta;
  resumo: ResumoTotais;
  /** filtros ativos com o texto pronto pra tela (vem do backend) */
  filtrosAtivos: FiltroAtivo[];
  searchTerm: string;
  sortBy: SortType;
  showConsolidated: boolean;
  showFuture: boolean;
  isLoading: boolean;
  filters: LancamentosFilters;
  filterPanelOpen: boolean;
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
