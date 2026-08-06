/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para buscar as últimas entradas da planilha do usuário
 * Endpoint: GET /get-sheet-entries
 * Retorna as últimas linhas da aba "Lançamentos" formatadas para exibição
 * Query params opcionais: limit (padrão: 100; 0 = todas)
 *
 * Helper compartilhado em _google-sheets-helper.js.
 */

routerAdd('GET', '/get-sheet-entries', (c) => {
  try {
    const gsheets = require(`${__hooks}/_google-sheets-helper.js`);

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

    const googleInfo = gsheets.getGoogleInfo(auth.id);
    if (!googleInfo) {
      return c.json(404, { error: 'Informações do Google não encontradas. Execute a autorização OAuth.' });
    }

    // PREMISSA DO PRODUTO: nome da aba hardcoded
    const sheetName = gsheets.SHEET_NAME_DEFAULT;

    // GET /values/{range}?valueRenderOption=UNFORMATTED_VALUE&majorDimension=ROWS
    const url = gsheets.buildSheetUrl(
      sheetName + '!A1:G',
      'majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE'
    );

    const result = gsheets.callWithRefresh(googleInfo, {
      method: 'GET',
      url: url
    });

    if (!result.ok) {
      console.log('[get-sheet-entries] Falha ao buscar:', result.status, result.error);
      const status = result.status >= 400 && result.status < 600 ? result.status : 500;
      return c.json(status, { error: 'Erro ao buscar dados da planilha' });
    }

    const data = result.data;
    if (!data || !data.values || data.values.length === 0) {
      // DEBUG temporário: log o que o Google retornou
      console.log('[get-sheet-entries] data.values vazio. Debug:', JSON.stringify({
        dataIsNull: data === null,
        dataKeys: data ? Object.keys(data) : null,
        range: data?.range,
        valuesLength: data?.values?.length,
        sheetId: googleInfo.get('sheet_id')
      }));
      return c.json(200, {
        success: true,
        entries: [],
        total: 0,
        message: 'Nenhum lançamento encontrado na planilha',
        debug: {
          range: data?.range,
          sheetId: googleInfo.get('sheet_id')?.substring(0, 10) + '...'
        }
      });
    }

    // Pula a primeira linha (cabeçalho)
    const rows = data.values.slice(1);

    // Formatar entradas e filtrar linhas totalmente em branco
    const entries = rows
      .map((row, index) => ({
        rowIndex: index + 2,
        data: row[0] || '',
        conta: String(row[1] || ''),
        valor: (row[2] !== undefined && row[2] !== null && row[2] !== '') ? row[2] : 0,
        descricao: String(row[3] || ''),
        categoria: String(row[4] || ''),
        orcamento: row[5] || '',
        obs: String(row[6] || '')
      }))
      .filter(e => {
        // Mantém se tem valor numérico != 0, OU se algum campo textual está preenchido
        const temValorNumerico = typeof e.valor === 'number' && e.valor !== 0;
        if (temValorNumerico) return true;
        const campos = [e.data, e.conta, e.descricao, e.categoria, e.orcamento, e.obs];
        return !campos.every(v => {
          if (v === null || v === undefined) return true;
          if (typeof v === 'number') return v === 0;
          return String(v).trim() === '';
        });
      });

    // Mais recentes primeiro (linhas maiores = mais embaixo na planilha)
    let recentEntries = entries.sort((a, b) => b.rowIndex - a.rowIndex);
    if (limit > 0) {
      recentEntries = recentEntries.slice(0, limit);
    }

    return c.json(200, {
      success: true,
      entries: recentEntries,
      total: rows.length,
      limit: limit
    });
  } catch (e) {
    console.log('[get-sheet-entries] EXCEÇÃO não tratada:', e && e.message, e && e.stack);
    return c.json(500, { error: 'Erro interno do servidor', detail: e && e.message });
  }
}, $apis.requireAuth());
