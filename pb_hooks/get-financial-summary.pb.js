/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para buscar resumo financeiro da planilha do usuário
 * Endpoint: GET /get-financial-summary
 * Retorna receitas, despesas e saldo do mês atual e anterior para calcular variações
 * Query params:
 *   - orcamento: serial Excel | AAAA-MM | AAAA-MM-DD (opcional, default mês atual)
 *   - include_entries: 'true' pra incluir as últimas entradas
 *   - entries_limit: int (default 50)
 *
 * Helper compartilhado em _google-sheets-helper.js.
 */

routerAdd('GET', '/get-financial-summary', (c) => {
  try {
    const gsheets = require(`${__hooks}/_google-sheets-helper.js`);

    const auth = c.auth;
    if (!auth || !auth.id) {
      return c.json(401, { error: 'Usuário não autenticado' });
    }

    const googleInfo = gsheets.getGoogleInfo(auth.id);
    if (!googleInfo) {
      return c.json(404, { error: 'Informações do Google não encontradas. Execute a autorização OAuth.' });
    }

    // PREMISSA DO PRODUTO: nome da aba hardcoded
    const sheetName = gsheets.SHEET_NAME_DEFAULT;

    // GET /values/Lançamentos!A1:G
    const url = gsheets.buildSheetUrl(
      sheetName + '!A1:G',
      'majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE'
    );

    const result = gsheets.callWithRefresh(googleInfo, {
      method: 'GET',
      url: url
    });

    if (!result.ok) {
      console.log('[get-financial-summary] Falha ao buscar:', result.status, result.error);
      const status = result.status >= 400 && result.status < 600 ? result.status : 500;
      return c.json(status, { error: 'Erro ao buscar dados da planilha' });
    }

    const data = result.data;

    if (!data.values || data.values.length === 0) {
      return c.json(200, {
        success: true,
        receitas: 0,
        despesas: 0,
        saldo: 0,
        receitasAnterior: 0,
        despesasAnterior: 0,
        saldoAnterior: 0,
        variacaoDespesas: 0,
        message: 'Nenhum lançamento encontrado na planilha'
      });
    }

    // ==== PARSING DO QUERY PARAM 'orcamento' (mês base) ====
    // Aceita:
    //  - Serial Excel (ex: 45870)
    //  - AAAA-MM (ex: 2025-08) -> assume dia 01
    //  - AAAA-MM-DD (ex: 2025-08-01)
    const query = c.requestInfo().query || {};
    const orcamentoParam = query['orcamento'];
    const includeEntries = query['include_entries'] === 'true';
    const entriesLimit = parseInt(query['entries_limit'], 10) || 50;

    const excelEpochUTC = Date.UTC(1899, 11, 30); // 1899-12-30
    const toExcelSerial = (msUTC) => Math.floor((msUTC - excelEpochUTC) / 86400000);
    const fromYearMonth = (year, monthZeroIdx) => Date.UTC(year, monthZeroIdx, 1);

    const agora = new Date();

    let baseFirstDayUTC; // ms UTC do primeiro dia do mês selecionado
    let mesAtualFormatado; // AAAA-MM do mês base selecionado

    if (orcamentoParam) {
      const trimmed = String(orcamentoParam).trim();
      if (/^\d+$/.test(trimmed)) {
        // Número puro -> tratamos como serial Excel diretamente (1º dia do mês)
        const serial = parseInt(trimmed, 10);
        if (serial < 10000 || serial > 100000) {
          return c.json(400, { error: "Parâmetro 'orcamento' serial Excel fora da faixa esperada" });
        }
        baseFirstDayUTC = excelEpochUTC + serial * 86400000;
        const tmp = new Date(baseFirstDayUTC);
        mesAtualFormatado = `${tmp.getUTCFullYear()}-${String(tmp.getUTCMonth() + 1).padStart(2, '0')}`;
      } else if (/^\d{4}-\d{2}$/.test(trimmed)) {
        const [anoStr, mesStr] = trimmed.split('-');
        const year = parseInt(anoStr, 10);
        const month = parseInt(mesStr, 10) - 1;
        baseFirstDayUTC = fromYearMonth(year, month);
        mesAtualFormatado = `${year}-${mesStr}`;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [anoStr, mesStr] = trimmed.split('-');
        const year = parseInt(anoStr, 10);
        const month = parseInt(mesStr, 10) - 1;
        baseFirstDayUTC = fromYearMonth(year, month);
        mesAtualFormatado = `${year}-${mesStr}`;
      } else {
        return c.json(400, { error: "Formato inválido para 'orcamento'. Use serial Excel ou AAAA-MM." });
      }
    } else {
      // Default: mês atual
      baseFirstDayUTC = fromYearMonth(agora.getUTCFullYear(), agora.getUTCMonth());
      mesAtualFormatado = `${agora.getUTCFullYear()}-${String(agora.getUTCMonth() + 1).padStart(2, '0')}`;
    }

    // Mês anterior ao base
    const baseDateObj = new Date(baseFirstDayUTC);
    const firstDayAnteriorUTC = fromYearMonth(baseDateObj.getUTCFullYear(), baseDateObj.getUTCMonth() - 1);

    const mesAtualOrcamento = toExcelSerial(baseFirstDayUTC);
    const mesAnteriorOrcamento = toExcelSerial(firstDayAnteriorUTC);

    const dataAnterior = new Date(firstDayAnteriorUTC);
    const mesAnteriorFormatado = `${dataAnterior.getUTCFullYear()}-${String(dataAnterior.getUTCMonth() + 1).padStart(2, '0')}`;

    // Resumos financeiros
    let receitasAtual = 0;
    let despesasAtual = 0;
    let receitasAnterior = 0;
    let despesasAnterior = 0;

    // Processar cada linha de dados
    data.values.forEach(row => {
      if (row.length >= 6) {
        // Com valueRenderOption=UNFORMATTED_VALUE, valores vêm como números
        const valor = typeof row[2] === 'number' ? row[2] : parseFloat(String(row[2]).replace(',', '.')) || 0;
        const orcamento = row[5]; // Valor numérico no formato Excel

        if (orcamento === mesAtualOrcamento) {
          if (valor > 0) receitasAtual += valor;
          else if (valor < 0) despesasAtual += Math.abs(valor);
        } else if (orcamento === mesAnteriorOrcamento) {
          if (valor > 0) receitasAnterior += valor;
          else if (valor < 0) despesasAnterior += Math.abs(valor);
        }
      }
    });

    // Calcular saldos
    const saldoAtual = receitasAtual - despesasAtual;
    const saldoAnterior = receitasAnterior - despesasAnterior;

    // Variação percentual das despesas
    const variacaoDespesas = despesasAnterior === 0
      ? (despesasAtual > 0 ? 100 : 0)
      : ((despesasAtual - despesasAnterior) / despesasAnterior) * 100;

    const resultado = {
      success: true,
      receitas: receitasAtual,
      despesas: despesasAtual,
      saldo: saldoAtual,
      receitasAnterior: receitasAnterior,
      despesasAnterior: despesasAnterior,
      saldoAnterior: saldoAnterior,
      variacaoDespesas: parseFloat(variacaoDespesas.toFixed(1)),
      mesAtual: mesAtualFormatado,
      mesAnterior: mesAnteriorFormatado,
      mesAtualSerial: mesAtualOrcamento,
      mesAnteriorSerial: mesAnteriorOrcamento,
      orcamentoParam: orcamentoParam || null,
      totalLancamentosAtual: data.values.filter(row =>
        row.length >= 6 && row[5] === mesAtualOrcamento
      ).length,
      totalLancamentosAnterior: data.values.filter(row =>
        row.length >= 6 && row[5] === mesAnteriorOrcamento
      ).length
    };

    // Histórico único de descrição -> categoria (colunas D e E)
    const historicoMap = {};
    data.values.forEach(row => {
      if (row.length >= 5) {
        const descricao = String(row[3]).trim();
        const categoria = String(row[4]).trim();
        if (descricao) historicoMap[descricao] = categoria;
      }
    });
    resultado.historicoLancamentos = Object.entries(historicoMap).map(([descricao, categoria]) => ({ descricao, categoria }));

    // Lista única de contas (coluna B, índice 1)
    const contasSet = new Set();
    data.values.forEach(row => {
      if (row.length > 2 && row[1] != null) {
        contasSet.add(String(row[1]));
      }
    });
    resultado.contasSugeridas = Array.from(contasSet);

    // Categorias mais gastas do mês atual
    const categoriasPorMes = {};
    data.values.forEach(row => {
      if (row.length >= 6) {
        const valor = typeof row[2] === 'number' ? row[2] : parseFloat(String(row[2]).replace(',', '.')) || 0;
        const categoria = String(row[4]).trim();
        const orcamento = row[5];
        if (valor < 0 && orcamento === mesAtualOrcamento && categoria) {
          categoriasPorMes[categoria] = (categoriasPorMes[categoria] || 0) + Math.abs(valor);
        }
      }
    });
    resultado.categorias = Object.entries(categoriasPorMes).map(([categoria, valor]) => ({ categoria, valor }));

    // Entradas recentes (opcional)
    if (includeEntries) {
      const rows = data.values.slice(1); // pula cabeçalho
      const entries = rows.map((row, index) => ({
        rowIndex: index + 2,
        data: row[0] || '',
        conta: row[1] || '',
        valor: row[2] || 0,
        descricao: row[3] || '',
        categoria: row[4] || '',
        orcamento: row[5] || '',
        obs: row[6] || ''
      }));
      // Mais recentes primeiro
      const recentEntries = entries.reverse().slice(0, entriesLimit);
      resultado.entries = recentEntries;
      resultado.totalEntries = rows.length;
      resultado.entriesLimit = entriesLimit;
    }

    return c.json(200, resultado);
  } catch (e) {
    console.log('[get-financial-summary] EXCEÇÃO não tratada:', e && e.message, e && e.stack);
    return c.json(500, { error: 'Erro interno do servidor', detail: e && e.message });
  }
}, $apis.requireAuth());
