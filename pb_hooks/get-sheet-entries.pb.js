/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para buscar os lançamentos da planilha do usuário
 * Endpoint: GET /get-sheet-entries
 *
 * Este endpoint é o "read model" da aplicação: TODAS as regras de negócio
 * (conversão de data, classificação consolidado/futuro, transferências,
 * filtros, ordenação e agregações) são aplicadas AQUI, no backend.
 * O frontend apenas envia o estado dos filtros e renderiza a resposta.
 *
 * Query params (todos opcionais):
 *   - limit        int  (default 100; 0 = todas)
 *   - offset       int  (default 0)
 *   - q            str  busca textual (data, valor, descrição, categoria, conta, obs)
 *   - conta        str  nome exato da conta
 *   - categoria    str  nome exato da categoria
 *   - orcamento    str  chave do orçamento "MM/YYYY"
 *   - dataInicio   str  "YYYY-MM-DD"
 *   - dataFim      str  "YYYY-MM-DD"
 *   - tipo         str  'todos' (default) | 'consolidado' | 'futuro'
 *   - sort         str  'original' (default) | 'date' | 'budget_date'
 *   - fresh        '1'  ignora o cache do servidor (botão "atualizar")
 *
 * Resposta:
 *   {
 *     success, entries[], total, count, limit, offset,
 *     meta:    { contas[], categorias[], descricoes[], orcamentos[] },
 *     resumo:  { receitas, despesas, saldo, count },
 *     filtros: { ...eco dos filtros aplicados }
 *   }
 *
 * Helpers:
 *   - _google-sheets-helper.js  (leitura da planilha + cache)
 *   - _lancamentos-domain.js    (regras de negócio)
 */

routerAdd('GET', '/get-sheet-entries', (c) => {
  try {
    const gsheets = require(`${__hooks}/_google-sheets-helper.js`);
    const domain = require(`${__hooks}/_lancamentos-domain.js`);

    const auth = c.auth;
    if (!auth || !auth.id) {
      return c.json(401, { error: 'Usuário não autenticado' });
    }

    const query = c.requestInfo().query || {};

    // Interpreta limit:
    //  - ausente        -> default 100
    //  - >0             -> retorna esse número
    //  - 0              -> sem limite (todas as linhas)
    //  - inválido/neg   -> fallback 100
    let limit = 100;
    if (query.limit !== undefined) {
      const parsed = parseInt(query.limit, 10);
      if (!Number.isNaN(parsed)) {
        if (parsed === 0) {
          limit = 0;
        } else if (parsed > 0) {
          limit = parsed;
        }
      }
    }

    let offset = 0;
    if (query.offset !== undefined) {
      const parsed = parseInt(query.offset, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        offset = parsed;
      }
    }

    const fresh = query.fresh === '1' || query.fresh === 'true';

    const googleInfo = gsheets.getGoogleInfo(auth.id);
    if (!googleInfo) {
      return c.json(404, { error: 'Informações do Google não encontradas. Execute a autorização OAuth.' });
    }

    // Leitura da planilha (com cache curto em $app.store())
    const sheet = gsheets.getLancamentosRows(googleInfo, { fresh: fresh });
    if (!sheet.ok) {
      console.log('[get-sheet-entries] Falha ao buscar:', sheet.status, sheet.error);
      const status = sheet.status >= 400 && sheet.status < 600 ? sheet.status : 500;
      return c.json(status, { error: 'Erro ao buscar dados da planilha' });
    }

    // Normalização: linhas cruas -> DTO (data/label/flags já calculados)
    const allEntries = domain.normalizeRows(sheet.rows);
    const meta = domain.buildMeta(allEntries);

    if (allEntries.length === 0) {
      return c.json(200, {
        success: true,
        entries: [],
        total: 0,
        count: 0,
        limit: limit,
        offset: offset,
        meta: meta,
        resumo: { receitas: 0, despesas: 0, saldo: 0, count: 0 },
        filtros: {
          q: '', conta: '', categoria: '', orcamento: '',
          dataInicio: '', dataFim: '', tipo: 'todos', sort: 'original'
        }
      });
    }

    // Filtros
    const filtros = {
      q: query.q ? String(query.q) : '',
      conta: query.conta ? String(query.conta) : '',
      categoria: query.categoria ? String(query.categoria) : '',
      orcamento: query.orcamento ? String(query.orcamento) : '',
      dataInicio: query.dataInicio ? String(query.dataInicio) : '',
      dataFim: query.dataFim ? String(query.dataFim) : '',
      tipo: query.tipo ? String(query.tipo) : 'todos',
      sort: query.sort ? String(query.sort) : 'original'
    };

    const filtered = domain.applyFilters(allEntries, filtros);
    const sorted = domain.sortEntries(filtered, filtros.sort);
    const resumo = domain.summarize(filtered);

    // Paginação
    const total = sorted.length;
    const page = limit > 0 ? sorted.slice(offset, offset + limit) : sorted.slice(offset);

    return c.json(200, {
      success: true,
      entries: page.map(domain.serializeEntry),
      total: total,
      count: page.length,
      limit: limit,
      offset: offset,
      meta: meta,
      resumo: resumo,
      filtros: filtros
    });
  } catch (e) {
    console.log('[get-sheet-entries] EXCEÇÃO não tratada:', e && e.message, e && e.stack);
    return c.json(500, { error: 'Erro interno do servidor', detail: e && e.message });
  }
}, $apis.requireAuth());
