/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para deletar uma entrada específica na planilha do usuário
 * Endpoint: DELETE /delete-sheet-entry
 * Remove uma linha específica na aba "Lançamentos" da planilha (limpa o conteúdo)
 * Body: { rowIndex: number }
 *
 * Helper compartilhado em _google-sheets-helper.js.
 */

routerAdd('DELETE', '/delete-sheet-entry', (c) => {
  try {
    const gsheets = require(`${__hooks}/_google-sheets-helper.js`);

    const auth = c.auth;
    if (!auth || !auth.id) {
      return c.json(401, { error: 'Usuário não autenticado' });
    }

    const data = c.requestInfo().body;

    // Validação
    if (data.rowIndex === undefined || data.rowIndex === null) {
      return c.json(400, { error: 'rowIndex é obrigatório' });
    }
    if (!Number.isInteger(data.rowIndex) || data.rowIndex < 2) {
      return c.json(400, { error: 'rowIndex deve ser inteiro >= 2' });
    }

    const googleInfo = gsheets.getGoogleInfo(auth.id);
    if (!googleInfo) {
      return c.json(404, { error: 'Informações do Google não encontradas. Execute a autorização OAuth.' });
    }

    // PREMISSA DO PRODUTO: nome da aba hardcoded
    const sheetName = gsheets.SHEET_NAME_DEFAULT;

    // Endpoint :clear: POST /values/{range}:clear (sem body, sem query string)
    const range = sheetName + '!A' + data.rowIndex + ':G' + data.rowIndex;
    const url = gsheets.buildClearUrl(range);

    const result = gsheets.callWithRefresh(googleInfo, {
      method: 'POST',
      url: url,
      body: undefined
    });

    if (!result.ok) {
      console.log('[delete-sheet-entry] Falha ao limpar:', result.status, result.error);
      const status = result.status >= 400 && result.status < 600 ? result.status : 500;
      return c.json(status, { error: 'Erro ao deletar entrada da planilha' });
    }

    return c.json(200, {
      success: true,
      message: 'Lançamento removido com sucesso da planilha'
    });
  } catch (e) {
    console.log('[delete-sheet-entry] EXCEÇÃO não tratada:', e && e.message, e && e.stack);
    return c.json(500, { error: 'Erro interno do servidor', detail: e && e.message });
  }
}, $apis.requireAuth());
