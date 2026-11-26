/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook com o bloco "Detalhes" do Dashboard
 * Endpoint: GET /get-dashboard-details
 *
 * Calcula tudo que a seção de detalhes exibe (top 10 categorias, contas do
 * orçamento, gráfico de rosca por tipo e lançamentos por categoria) a partir
 * dos orçamentos selecionados. O frontend só renderiza.
 *
 * Query params:
 *   - orcamentos  str  seriais separados por vírgula (ex: "45932,45963").
 *                       vazio/ausente = nenhum orçamento selecionado.
 *   - fresh       '1'  ignora o cache do servidor
 *
 * Resposta:
 *   {
 *     success, orcamentos[],
 *     topCategorias: [{ categoria, total, count }],
 *     contas: [{ conta, total, count }],
 *     totalGeral,
 *     grafico: [{ tipo, valor, percentual }],
 *     graficoTotal,
 *     entradasPorCategoria: { "<categoria>": [entryDTO...] },
 *     categoriasCompletas: [{ categoria, tipo, orcamento }]
 *   }
 */

routerAdd('GET', '/get-dashboard-details', (c) => {
  try {
    const gsheets = require(`${__hooks}/_google-sheets-helper.js`);
    const domain = require(`${__hooks}/_lancamentos-domain.js`);

    const auth = c.auth;
    if (!auth || !auth.id) {
      return c.json(401, { error: 'Usuário não autenticado' });
    }

    const query = c.requestInfo().query || {};
    const fresh = query.fresh === '1' || query.fresh === 'true';

    const googleInfo = gsheets.getGoogleInfo(auth.id);
    if (!googleInfo) {
      return c.json(404, { error: 'Informações do Google não encontradas. Execute a autorização OAuth.' });
    }

    const sheet = gsheets.getLancamentosRows(googleInfo, { fresh: fresh });
    if (!sheet.ok) {
      console.log('[get-dashboard-details] Falha ao buscar:', sheet.status, sheet.error);
      const status = sheet.status >= 400 && sheet.status < 600 ? sheet.status : 500;
      return c.json(status, { error: 'Erro ao buscar dados da planilha' });
    }

    const entries = domain.normalizeRows(sheet.rows);

    // Orçamentos selecionados
    const orcamentos = [];
    if (query.orcamentos) {
      String(query.orcamentos).split(',').forEach(function (item) {
        const parsed = parseInt(item, 10);
        if (!Number.isNaN(parsed)) {
          orcamentos.push(parsed);
        }
      });
    }

    // Categorias com tipo (JOIN do gráfico por tipo)
    const catResult = gsheets.getCategoriasCompletas(googleInfo, { fresh: fresh });
    const categoriasCompletas = catResult.ok ? catResult.categorias : [];

    const details = domain.buildDetails(entries, orcamentos, categoriasCompletas);

    // Serializa as entradas por categoria
    const entradasPorCategoria = {};
    Object.keys(details.entradasPorCategoria).forEach(function (key) {
      entradasPorCategoria[key] = details.entradasPorCategoria[key].map(domain.serializeEntry);
    });

    return c.json(200, {
      success: true,
      orcamentos: details.orcamentos,
      topCategorias: details.topCategorias,
      contas: details.contas,
      totalGeral: details.totalGeral,
      grafico: details.grafico,
      graficoTotal: details.graficoTotal,
      entradasPorCategoria: entradasPorCategoria,
      categoriasCompletas: categoriasCompletas
    });
  } catch (e) {
    console.log('[get-dashboard-details] EXCEÇÃO não tratada:', e && e.message, e && e.stack);
    return c.json(500, { error: 'Erro interno do servidor', detail: e && e.message });
  }
}, $apis.requireAuth());
