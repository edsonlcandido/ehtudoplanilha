/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para editar uma entrada específica na planilha do usuário
 * Endpoint: PUT /edit-sheet-entry
 * Edita uma linha específica na aba "Lançamentos" da planilha
 * Body: { rowIndex: number, data?: string, conta?: string, valor: number, descricao?: string, categoria: string, orcamento: string, obs?: string }
 * Campos obrigatórios: rowIndex, valor, categoria, orcamento
 *
 * Helper compartilhado em _google-sheets-helper.js.
 */

routerAdd('PUT', '/edit-sheet-entry', (c) => {
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
    if (data.valor === undefined || data.valor === null) {
      return c.json(400, { error: 'Campo valor é obrigatório' });
    }
    if (!data.categoria || String(data.categoria).trim() === '') {
      return c.json(400, { error: 'Campo categoria é obrigatório' });
    }
    if (!data.orcamento || data.orcamento === '') {
      return c.json(400, { error: 'Campo orçamento (data-chave) é obrigatório' });
    }

    const googleInfo = gsheets.getGoogleInfo(auth.id);
    if (!googleInfo) {
      return c.json(404, { error: 'Informações do Google não encontradas. Execute a autorização OAuth.' });
    }

    // PREMISSA DO PRODUTO: nome da aba hardcoded
    const sheetName = gsheets.SHEET_NAME_DEFAULT;

    // Valores na ordem: data, conta, valor, descrição, categoria, orçamento, observação
    const values = [[
      data.data || '',
      data.conta || '',
      data.valor,
      data.descricao || '',
      data.categoria,
      data.orcamento,
      data.obs || ''
    ]];

    // PUT /values/{range}?valueInputOption=USER_ENTERED
    const range = sheetName + '!A' + data.rowIndex + ':G' + data.rowIndex;
    const url = gsheets.buildSheetUrl(range, 'valueInputOption=USER_ENTERED');

    const result = gsheets.callWithRefresh(googleInfo, {
      method: 'PUT',
      url: url,
      body: { values: values }
    });

    if (!result.ok) {
      console.log('[edit-sheet-entry] Falha ao editar:', result.status, result.error);
      const status = result.status >= 400 && result.status < 600 ? result.status : 500;
      return c.json(status, { error: 'Erro ao editar entrada na planilha' });
    }

    return c.json(200, {
      success: true,
      message: 'Lançamento editado com sucesso na planilha',
      rowIndex: data.rowIndex,
      updated: {
        data: data.data || '',
        conta: data.conta || '',
        valor: data.valor,
        descricao: data.descricao || '',
        categoria: data.categoria,
        orcamento: data.orcamento,
        obs: data.obs || ''
      }
    });
  } catch (e) {
    console.log('[edit-sheet-entry] EXCEÇÃO não tratada:', e && e.message, e && e.stack);
    return c.json(500, { error: 'Erro interno do servidor', detail: e && e.message });
  }
}, $apis.requireAuth());
