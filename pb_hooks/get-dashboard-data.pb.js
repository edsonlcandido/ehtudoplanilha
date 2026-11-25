/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook com os dados agregados do Dashboard
 * Endpoint: GET /get-dashboard-data
 *
 * O dashboard NÃO faz mais nenhuma agregação no frontend: cards de orçamento,
 * saldo por conta, orçamentos em destaque e opções de filtro chegam prontos.
 *
 * Query params (todos opcionais):
 *   - hoje   "YYYY-MM-DD" dia local do cliente (define o intervalo dos
 *            orçamentos em destaque: hoje-5 .. hoje+35). Sem ele, usa o
 *            dia do servidor.
 *   - fresh  '1' ignora o cache do servidor
 *
 * Resposta:
 *   {
 *     success, hoje,
 *     intervalo: { inicioSerial, fimSerial },
 *     budgets: [{ serial, label, sum, incomes, expenses, count, inInterval }],
 *     budgetsInInterval: [serial...],
 *     accounts: [{ conta, total, count }],
 *     meta: { contas[], categorias[], descricoes[], orcamentos[] },
 *     resumo: { receitas, despesas, saldo, count },
 *     totalLancamentos
 *   }
 */

routerAdd('GET', '/get-dashboard-data', (c) => {
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
      console.log('[get-dashboard-data] Falha ao buscar:', sheet.status, sheet.error);
      const status = sheet.status >= 400 && sheet.status < 600 ? sheet.status : 500;
      return c.json(status, { error: 'Erro ao buscar dados da planilha' });
    }

    const entries = domain.normalizeRows(sheet.rows);

    // Intervalo de referência (orçamentos "em destaque")
    const hoje = query.hoje ? String(query.hoje) : domain.formatDateInput(domain.civilToday());
    const hojeCivil = domain.parseDateValue(hoje) || domain.civilToday();

    const meta = domain.buildMeta(entries, hojeCivil);
    const intervalo = domain.intervalSerials(hoje);

    const entriesInInterval = domain.filterByInterval(entries, intervalo.startSerial, intervalo.endSerial);

    // Orçamentos com lançamentos dentro do intervalo
    const budgetsInInterval = [];
    const inIntervalSet = {};
    domain.aggregateByBudget(entriesInInterval).forEach(function (b) {
      budgetsInInterval.push(b.serial);
      inIntervalSet[b.serial] = true;
    });

    // Cards de orçamento (todos, com flag dos que estão no intervalo)
    const budgets = domain.aggregateByBudget(entries).map(function (b) {
      return {
        serial: b.serial,
        label: b.label,
        sum: b.sum,
        incomes: b.incomes,
        expenses: b.expenses,
        count: b.count,
        inInterval: inIntervalSet[b.serial] === true
      };
    });

    // Saldo por conta (todos os lançamentos, inclusive futuros)
    const accounts = domain.aggregateByAccount(entries);

    return c.json(200, {
      success: true,
      hoje: hoje,
      intervalo: {
        inicioSerial: intervalo.startSerial,
        fimSerial: intervalo.endSerial
      },
      budgets: budgets,
      budgetsInInterval: budgetsInInterval,
      accounts: accounts,
      meta: meta,
      resumo: domain.summarize(entries),
      totalLancamentos: entries.length
    });
  } catch (e) {
    console.log('[get-dashboard-data] EXCEÇÃO não tratada:', e && e.message, e && e.stack);
    return c.json(500, { error: 'Erro interno do servidor', detail: e && e.message });
  }
}, $apis.requireAuth());
