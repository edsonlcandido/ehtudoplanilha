/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para adicionar entradas na planilha do usuário
 * Endpoint: POST /append-entry
 *
 * Insere uma nova linha na aba de lançamentos usando values:append (atômico,
 * sem precisar de GET pra descobrir a próxima linha livre — o Sheets API cuida).
 *
 * Helper compartilhado em _google-sheets-helper.pb.js. Carregado via require()
 * DENTRO do handler, porque cada handler roda em contexto isolado no goja.
 */

routerAdd('POST', '/append-entry', (c) => {
  try {
    const gsheets = require(`${__hooks}/_google-sheets-helper.js`);

    const auth = c.auth;
    if (!auth || !auth.id) {
      return c.json(401, { error: 'Usuário não autenticado' });
    }

    const data = c.requestInfo().body;

    // Validação: valor e descrição são obrigatórios (data/conta podem ser vazios p/ lançamentos futuros)
    if (data.valor === undefined || data.descricao === undefined) {
      return c.json(400, { error: 'Campos obrigatórios faltando (valor e descrição)' });
    }

    const googleInfo = gsheets.getGoogleInfo(auth.id);
    if (!googleInfo) {
      return c.json(404, { error: 'Informações do Google não encontradas. Execute a autorização OAuth.' });
    }

    // Ordem: data, conta, valor, descrição, categoria, orçamento, observação
    const newRow = [
      data.data || '',
      data.conta || '',
      data.valor,
      data.descricao,
      data.categoria || '',
      data.orcamento || '',
      data.obs || ''
    ];

    // PREMISSA DO PRODUTO: nomes das abas ('Lançamentos' e 'Categorias') são
    // parte do contrato — NÃO usar o sheet_name salvo em google_infos. O
    // google_infos.sheet_name é apenas informativo; se estiver divergente do
    // real, quem renomeou a aba na planilha QUEbrou a integração por conta
    // própria. Mesmo padrão vale pra edit/delete/get/clear.
    const sheetName = gsheets.SHEET_NAME_DEFAULT;

    // values:append — atômico, sem race condition de GET+PUT
    // IMPORTANTE: o :append é parte literal do path, não query string.
    // Sem ele o Google Sheets retorna 404 genérico.
    const url = gsheets.buildAppendUrl(
      sheetName + '!A:G',
      'valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS'
    );

    const result = gsheets.callWithRefresh(googleInfo, {
      method: 'POST',
      url: url,
      body: { values: [newRow] }
    });

    if (!result.ok) {
      console.log('[append-entry] Falha ao inserir:', result.status, result.error);
      const status = result.status >= 400 && result.status < 600 ? result.status : 500;
      return c.json(status, { error: 'Erro ao adicionar entrada na planilha' });
    }

    // Extrai rowIndex do updatedRange retornado pela API (ex: "Lançamentos!A50:G50" -> 50)
    const rowIndex = gsheets.parseRowIndexFromRange(
      result.data && result.data.updates && result.data.updates.updatedRange
    );

    return c.json(200, {
      success: true,
      message: 'Lançamento adicionado com sucesso na planilha',
      rowIndex: rowIndex
    });
  } catch (e) {
    console.log('[append-entry] EXCEÇÃO não tratada:', e && e.message, e && e.stack);
    return c.json(500, { error: 'Erro interno do servidor', detail: e && e.message });
  }
}, $apis.requireAuth());
