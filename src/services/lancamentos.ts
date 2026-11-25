/**
 * Serviço de Lançamentos
 *
 * Fala com o backend (hooks do PocketBase) e devolve dados JÁ NORMALIZADOS:
 * conversão de data, classificação (consolidado/futuro/transferência),
 * filtros, ordenação e agregações são responsabilidade do backend.
 *
 * Ver pb_hooks/_lancamentos-domain.js (fonte única das regras).
 */

import { pb } from '../main';
import type {
  SheetEntriesResponse,
  DashboardData,
  DashboardDetails,
  LancamentosMeta,
  SortType,
  SheetEntry
} from '../types';
import { CacheService, CACHE_KEYS } from './cache';

/**
 * Filtros/ordenações aceitos pelo endpoint /get-sheet-entries
 */
export interface LancamentosQuery {
  /** máximo de registros (0 = todos) */
  limit?: number;
  offset?: number;
  /** busca textual */
  q?: string;
  conta?: string;
  categoria?: string;
  /** data-chave do orçamento (serial "45991"; aceita também "30/11/2025") */
  orcamento?: string;
  /** "YYYY-MM-DD" */
  dataInicio?: string;
  dataFim?: string;
  tipo?: 'todos' | 'consolidado' | 'futuro' | 'nenhum';
  sort?: SortType;
  /** "YYYY-MM-DD" — dia local do cliente (default: hoje no cliente) */
  hoje?: string;
  /** ignora o cache (botão "atualizar") */
  fresh?: boolean;
}

/**
 * Dia local no formato "YYYY-MM-DD".
 *
 * O backend usa como referência (data-chave sugerida nos formulários,
 * intervalo dos orçamentos em destaque). TEM que ser o dia local do cliente:
 * o fuso do servidor não pode decidir isso.
 */
export function hojeLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Primeiro dia do mês atual ("YYYY-MM-01").
 *
 * Usado só como FALLBACK quando o backend não devolveu a sugestão de
 * data-chave (falha de rede). A regra em si é do backend
 * (meta.proximoOrcamento / meta.orcamentoMesAtual).
 */
export function primeiroDiaDoMes(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

const META_VAZIA: LancamentosMeta = {
  contas: [],
  categorias: [],
  descricoes: [],
  orcamentos: [],
  proximoOrcamento: '',
  orcamentoMesAtual: ''
};

/**
 * Monta a query string da API (só envia o que está preenchido)
 */
function buildQueryString(query: LancamentosQuery): string {
  const params = new URLSearchParams();

  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset) params.set('offset', String(query.offset));
  if (query.q) params.set('q', query.q);
  if (query.conta) params.set('conta', query.conta);
  if (query.categoria) params.set('categoria', query.categoria);
  if (query.orcamento) params.set('orcamento', query.orcamento);
  if (query.dataInicio) params.set('dataInicio', query.dataInicio);
  if (query.dataFim) params.set('dataFim', query.dataFim);
  if (query.tipo && query.tipo !== 'todos') params.set('tipo', query.tipo);
  if (query.sort && query.sort !== 'original') params.set('sort', query.sort);
  // sempre manda o dia local do cliente (o backend precisa dele)
  params.set('hoje', query.hoje || hojeLocal());
  if (query.fresh) params.set('fresh', '1');

  return params.toString();
}

/**
 * Chave de cache do conjunto filtrado (inclui os filtros na chave)
 */
function entriesCacheKey(queryString: string): string {
  return `${CACHE_KEYS.SHEET_ENTRIES}:${queryString}`;
}

/**
 * Serviço de gerenciamento de lançamentos
 */
class LancamentosService {

  /**
   * Busca lançamentos já filtrados/ordenados pelo backend
   */
  async fetchEntries(query: LancamentosQuery = {}): Promise<SheetEntriesResponse> {
    if (!pb) {
      throw new Error('PocketBase não inicializado');
    }

    const queryString = buildQueryString(query);
    const cacheKey = entriesCacheKey(queryString);

    if (!query.fresh) {
      const cached = CacheService.get<SheetEntriesResponse>(cacheKey);
      if (cached && cached.entries) {
        console.log('[LancamentosService] Usando dados do cache');
        return cached;
      }
    }

    try {
      console.log('[LancamentosService] Buscando dados do servidor');
      // `pb.send()` já devolve o JSON parseado e adiciona o header
      // `Authorization: <authStore.token>` automaticamente.
      // Passar SÓ o path — o SDK já prepende o baseURL.
      const data = await pb.send(
        `/get-sheet-entries${queryString ? `?${queryString}` : ''}`,
        { method: 'GET' }
      );

      const response: SheetEntriesResponse = {
        success: data.success,
        entries: data.entries || [],
        total: data.total ?? 0,
        count: data.count ?? data.entries?.length ?? 0,
        limit: data.limit ?? 0,
        offset: data.offset ?? 0,
        meta: data.meta || META_VAZIA,
        resumo: data.resumo || { receitas: 0, despesas: 0, saldo: 0, count: 0 },
        filtros: {
          q: data.filtros?.q || '',
          conta: data.filtros?.conta || '',
          categoria: data.filtros?.categoria || '',
          orcamento: data.filtros?.orcamento || '',
          dataInicio: data.filtros?.dataInicio || '',
          dataFim: data.filtros?.dataFim || '',
          tipo: data.filtros?.tipo || 'todos',
          sort: data.filtros?.sort || 'original',
          // filtros ativos já com o texto pronto (vem pronto do backend)
          ativos: data.filtros?.ativos || []
        }
      };

      CacheService.set(cacheKey, response);
      return response;
    } catch (error: any) {
      console.error('Erro ao buscar entradas da planilha:', error);
      const msg = error?.data?.message || error?.message || 'Erro ao carregar entradas da planilha';
      throw new Error(msg);
    }
  }

  /**
   * Dados agregados do dashboard (cards, contas, orçamentos em destaque)
   * @param hoje - dia local no formato "YYYY-MM-DD"
   */
  async fetchDashboardData(hoje: string, fresh = false): Promise<DashboardData> {
    if (!pb) {
      throw new Error('PocketBase não inicializado');
    }

    const cacheKey = fresh ? `${CACHE_KEYS.DASHBOARD_DATA}:fresh` : CACHE_KEYS.DASHBOARD_DATA;

    if (!fresh) {
      const cached = CacheService.get<DashboardData>(cacheKey);
      if (cached && cached.budgets) {
        console.log('[LancamentosService] Usando dashboard do cache');
        return cached;
      }
    }

    try {
      const params = new URLSearchParams({ hoje });
      if (fresh) params.set('fresh', '1');

      const data = await pb.send(`/get-dashboard-data?${params.toString()}`, {
        method: 'GET'
      });

      const response: DashboardData = {
        success: data.success,
        hoje: data.hoje || hoje,
        intervalo: data.intervalo || { inicioSerial: 0, fimSerial: 0 },
        budgets: data.budgets || [],
        budgetsInInterval: data.budgetsInInterval || [],
        accounts: data.accounts || [],
        meta: data.meta || META_VAZIA,
        resumo: data.resumo || { receitas: 0, despesas: 0, saldo: 0, count: 0 },
        totalLancamentos: data.totalLancamentos || 0
      };

      CacheService.set(cacheKey, response);
      return response;
    } catch (error: any) {
      console.error('Erro ao buscar dados do dashboard:', error);
      const msg = error?.data?.message || error?.message || 'Erro ao carregar dados do dashboard';
      throw new Error(msg);
    }
  }

  /**
   * Bloco "Detalhes" do dashboard para os orçamentos selecionados
   * @param orcamentos - seriais dos orçamentos selecionados
   */
  async fetchDashboardDetails(orcamentos: number[], fresh = false): Promise<DashboardDetails> {
    if (!pb) {
      throw new Error('PocketBase não inicializado');
    }

    const lista = (orcamentos || []).join(',');
    const cacheKey = `${CACHE_KEYS.DASHBOARD_DETAILS}:${lista}${fresh ? ':fresh' : ''}`;

    if (!fresh) {
      const cached = CacheService.get<DashboardDetails>(cacheKey);
      if (cached) {
        console.log('[LancamentosService] Usando detalhes do cache');
        return cached;
      }
    }

    try {
      const params = new URLSearchParams({ orcamentos: lista });
      if (fresh) params.set('fresh', '1');

      const data = await pb.send(`/get-dashboard-details?${params.toString()}`, {
        method: 'GET'
      });

      const response: DashboardDetails = {
        success: data.success,
        orcamentos: data.orcamentos || [],
        topCategorias: data.topCategorias || [],
        contas: data.contas || [],
        totalGeral: data.totalGeral || 0,
        grafico: data.grafico || [],
        graficoTotal: data.graficoTotal || 0,
        entradasPorCategoria: data.entradasPorCategoria || {},
        categoriasCompletas: data.categoriasCompletas || []
      };

      CacheService.set(cacheKey, response);
      return response;
    } catch (error: any) {
      console.error('Erro ao buscar detalhes do dashboard:', error);
      const msg = error?.data?.message || error?.message || 'Erro ao carregar detalhes do dashboard';
      throw new Error(msg);
    }
  }

  /**
   * Invalida o cache de lançamentos
   * Deve ser chamado após operações que modificam os lançamentos
   */
  invalidateCache(): void {
    console.log('[LancamentosService] Invalidando caches de lançamentos');
    CacheService.clearPrefix(CACHE_KEYS.SHEET_ENTRIES);
    CacheService.clearPrefix(CACHE_KEYS.DASHBOARD_DATA);
    CacheService.clearPrefix(CACHE_KEYS.DASHBOARD_DETAILS);
    CacheService.clear(CACHE_KEYS.SHEET_CATEGORIES);
    CacheService.clear(CACHE_KEYS.SHEET_CATEGORIES_COMPLETE);
  }

  /**
   * Edita um lançamento na planilha
   */
  async editEntry(rowIndex: number, entry: Partial<SheetEntry>): Promise<any> {
    if (!pb) {
      throw new Error('PocketBase não inicializado');
    }

    try {
      // `pb.send()` retorna o JSON parseado. Erros 4xx/5xx viram
      // `ClientResponseError` lançado pelo SDK.
      // Passar SÓ o path — SDK já prepende `pb.baseURL`.
      const data = await pb.send('/edit-sheet-entry', {
        method: 'PUT',
        body: JSON.stringify({
          rowIndex,
          ...entry
        })
      });

      // Invalida o cache após edição bem-sucedida
      this.invalidateCache();

      return data;
    } catch (error: any) {
      console.error('Erro ao editar lançamento:', error);
      const msg = error?.data?.message || error?.message || 'Erro ao editar lançamento';
      throw new Error(msg);
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
      // `pb.send()` retorna o JSON parseado. Erros 4xx/5xx viram
      // `ClientResponseError` lançado pelo SDK.
      // Passar SÓ o path — SDK já prepende `pb.baseURL`.
      const data = await pb.send('/delete-sheet-entry', {
        method: 'DELETE',
        body: JSON.stringify({ rowIndex })
      });

      // Invalida o cache após deleção bem-sucedida
      this.invalidateCache();

      return data;
    } catch (error: any) {
      console.error('Erro ao deletar lançamento:', error);
      const msg = error?.data?.message || error?.message || 'Erro ao deletar lançamento';
      throw new Error(msg);
    }
  }
}

// Exporta instância singleton
export const lancamentosService = new LancamentosService();
export default lancamentosService;
