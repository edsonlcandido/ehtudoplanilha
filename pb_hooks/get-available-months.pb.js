/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para buscar meses únicos disponíveis na coluna "orcamento" da planilha
 * Endpoint: GET /get-available-months
 * Retorna lista de meses únicos formatados para seleção no frontend
 *
 * Helper compartilhado em _google-sheets-helper.js.
 */

routerAdd('GET', '/get-available-months', (c) => {
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

    // GET /values/Lançamentos!F:F?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE
    const url = gsheets.buildSheetUrl(
      sheetName + '!F:F',
      'majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE'
    );

    const result = gsheets.callWithRefresh(googleInfo, {
      method: 'GET',
      url: url
    });

    if (!result.ok) {
      console.log('[get-available-months] Falha ao buscar:', result.status, result.error);
      const status = result.status >= 400 && result.status < 600 ? result.status : 500;
      return c.json(status, { error: 'Erro ao acessar planilha do Google Sheets' });
    }

    const data = result.data;

    if (!data.values || data.values.length === 0) {
      return c.json(200, {
        success: true,
        meses: [],
        message: 'Nenhum lançamento encontrado na planilha'
      });
    }

    // Extrair valores únicos da coluna orçamento (excluindo cabeçalho)
    const mesesUnicos = new Set();
    const excelEpochUTC = Date.UTC(1899, 11, 30); // 1899-12-30

    data.values.forEach((row, index) => {
      // Pula a primeira linha (cabeçalho)
      if (index === 0 || !row[0]) return;

      const valorOrcamento = row[0];
      if (valorOrcamento && typeof valorOrcamento === 'number') {
        // Converter serial Excel para data
        const msUTC = excelEpochUTC + valorOrcamento * 86400000;
        const date = new Date(msUTC);

        // Formatar como AAAA-MM
        const ano = date.getUTCFullYear();
        const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
        const mesFormatado = `${ano}-${mes}`;

        mesesUnicos.add(mesFormatado);
      }
    });

    // Set -> array e ordenar por data (mais recente primeiro)
    const mesesArray = Array.from(mesesUnicos).sort((a, b) => b.localeCompare(a));

    // Formatar para exibição em português
    const mesesNomes = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const mesesFormatados = mesesArray.map(mesAno => {
      const [ano, mesNum] = mesAno.split('-');
      const mesNome = mesesNomes[parseInt(mesNum, 10) - 1];
      const anoCurto = ano.slice(-2);

      return {
        valor: mesAno, // AAAA-MM para enviar ao backend
        texto: `${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}/${anoCurto}`, // Janeiro/25
        completo: `${mesNome} de ${ano}` // Janeiro de 2025
      };
    });

    return c.json(200, {
      success: true,
      meses: mesesFormatados,
      total: mesesFormatados.length
    });
  } catch (e) {
    console.log('[get-available-months] EXCEÇÃO não tratada:', e && e.message, e && e.stack);
    return c.json(500, { error: 'Erro interno do servidor', detail: e && e.message });
  }
}, $apis.requireAuth());
