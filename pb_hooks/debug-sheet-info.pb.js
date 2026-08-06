/// <reference path="../pb_data/types.d.ts" />

/**
 * Endpoint de DEBUG: lista as abas e a primeira linha da planilha do user.
 *
 * POR QUE EXISTE: o /get-sheet-entries está retornando 0 entries mesmo o
 * user tendo lançamentos. Suspeita: nome da aba pode estar diferente do
 * SHEET_NAME_DEFAULT hardcoded ("Lançamentos").
 *
 * COMO USAR: acessar /debug-sheet-info logado. O response vai mostrar
 * todas as abas da planilha, os metadados do google_infos, e os primeiros
 * valores retornados pelo Sheets API com o range atual.
 *
 * REMOVER depois que o bug for resolvido.
 */
routerAdd('GET', '/debug-sheet-info', (c) => {
  // Aceita auth via:
  // 1) Header Authorization (se o browser enviar)
  // 2) Query string ?token=<jwt> (pra acessar pela URL sem header)
  const info = c.requestInfo();
  const headers = info.headers || {};
  const query = info.query || {};
  const headerToken = headers["Authorization"] || "";
  const queryToken = query.token || "";
  let userId = c.auth?.id;

  // DEBUG: log de tudo que recebemos
  console.log("[debug-sheet-info] request:", JSON.stringify({
    hasAuth: !!c.auth,
    authId: c.auth?.id,
    headerTokenPresent: !!headerToken,
    queryType: typeof query,
    queryKeys: Object.keys(query),
    queryTokenLength: queryToken.length,
    queryTokenFirst30: queryToken.substring(0, 30),
    queryStringified: JSON.stringify(query).substring(0, 200)
  }));

  if (!userId && queryToken) {
    try {
      const cleanToken = queryToken.startsWith("Bearer ") ? queryToken.substring(7) : queryToken;
      const parts = cleanToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp > Date.now() / 1000) {
          userId = payload.id;
        }
      }
    } catch (e) {
      console.log("[debug-sheet-info] Token decode error:", e && e.message);
    }
  }

  if (!userId) {
    return c.json(401, {
      error: 'Não autenticado',
      debug: {
        hasAuth: !!c.auth,
        headerTokenPresent: !!headerToken,
        queryType: typeof query,
        queryKeys: Object.keys(query),
        queryTokenLength: queryToken.length,
        queryTokenFirst30: queryToken.substring(0, 30),
        queryStringified: JSON.stringify(query).substring(0, 200)
      },
      hint: 'Acesse logado (Authorization header) ou passe ?token=<seu-jwt-do-pocketbase>'
    });
  }

  const gsheets = require(`${__hooks}/_google-sheets-helper.js`);

  const googleInfo = gsheets.getGoogleInfo(auth.id);
  if (!googleInfo) {
    return c.json(404, { error: 'google_infos não encontrado' });
  }

  const sheetId = googleInfo.get('sheet_id');
  const sheetNameInDb = googleInfo.get('sheet_name');
  const accessToken = googleInfo.get('access_token');

  // 1) Lista metadados da planilha (abas)
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`;
  const metaResult = gsheets.callWithRefresh(googleInfo, {
    method: 'GET',
    url: metaUrl
  });

  // 2) Tenta buscar com o nome DEFAULT
  const rangeDefault = gsheets.SHEET_NAME_DEFAULT + '!A1:G5';
  const urlDefault = gsheets.buildSheetUrl(rangeDefault, 'majorDimension=ROWS');
  const resultDefault = gsheets.callWithRefresh(googleInfo, {
    method: 'GET',
    url: urlDefault
  });

  // 3) Tenta sem nome de aba (primeira aba)
  const urlFirst = gsheets.buildSheetUrl('A1:G5', 'majorDimension=ROWS');
  const resultFirst = gsheets.callWithRefresh(googleInfo, {
    method: 'GET',
    url: urlFirst
  });

  // 4) Tenta com nome em MAIÚSCULAS (caso a aba esteja como "LANCAMENTOS")
  const rangeUpper = 'LANCAMENTOS!A1:G5';
  const urlUpper = gsheets.buildSheetUrl(rangeUpper, 'majorDimension=ROWS');
  const resultUpper = gsheets.callWithRefresh(googleInfo, {
    method: 'GET',
    url: urlUpper
  });

  return c.json(200, {
    userId: auth.id,
    googleInfo: {
      hasSheetId: !!sheetId,
      sheetIdMasked: sheetId ? sheetId.substring(0, 10) + '...' : null,
      sheetNameInDb: sheetNameInDb || '(vazio)',
      hasAccessToken: !!accessToken
    },
    sheetsApi: {
      sheetNameExpected: gsheets.SHEET_NAME_DEFAULT,
      metaResult: metaResult.ok ? {
        sheets: metaResult.data.sheets?.map(s => ({
          title: s.properties.title,
          sheetId: s.properties.sheetId,
          rowCount: s.properties.gridProperties?.rowCount
        }))
      } : { error: metaResult.error, status: metaResult.status },
      testWithDefaultName: {
        range: rangeDefault,
        ok: resultDefault.ok,
        status: resultDefault.status,
        error: resultDefault.error,
        firstRow: resultDefault.data?.values?.[0] || null,
        totalRows: resultDefault.data?.values?.length || 0
      },
      testFirstSheetOnly: {
        range: 'A1:G5',
        ok: resultFirst.ok,
        status: resultFirst.status,
        error: resultFirst.error,
        firstRow: resultFirst.data?.values?.[0] || null,
        totalRows: resultFirst.data?.values?.length || 0
      },
      testUppercase: {
        range: rangeUpper,
        ok: resultUpper.ok,
        status: resultUpper.status,
        error: resultUpper.error,
        firstRow: resultUpper.data?.values?.[0] || null,
        totalRows: resultUpper.data?.values?.length || 0
      }
    }
  });
})
