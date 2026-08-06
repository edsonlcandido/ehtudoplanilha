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
  // Implementação manual de atob — o goja (engine JS do PB) não tem
  // atob global. Decodifica base64 → string.
  function atob(input) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const str = String(input).replace(/=+$/, '');
    let output = '';
    for (let i = 0; i < str.length; i += 4) {
      const c1 = chars.indexOf(str.charAt(i));
      const c2 = chars.indexOf(str.charAt(i + 1));
      const c3 = chars.indexOf(str.charAt(i + 2));
      const c4 = chars.indexOf(str.charAt(i + 3));
      if (c1 < 0 || c2 < 0) continue;
      output += String.fromCharCode((c1 << 2) | (c2 >> 4));
      if (c3 >= 0 && c3 < 64) {
        output += String.fromCharCode(((c2 & 15) << 4) | (c3 >> 2));
      }
      if (c4 >= 0 && c4 < 64) {
        output += String.fromCharCode(((c3 & 3) << 6) | c4);
      }
    }
    return output;
  }

  // Aceita auth via:
  // 1) Header Authorization (se o browser enviar)
  // 2) Query string ?token=<jwt-do-pocketbase> (NÃO provider_token do Google)
  const info = c.requestInfo();
  const headers = info.headers || {};
  const query = info.query || {};
  const headerToken = headers["Authorization"] || "";
  const queryToken = query.token || "";
  let userId = c.auth?.id;

  if (!userId && queryToken) {
    try {
      const cleanToken = queryToken.startsWith("Bearer ") ? queryToken.substring(7) : queryToken;
      const parts = cleanToken.split(".");
      if (parts.length === 3) {
        const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadStr);
        // JWT do PocketBase tem { id, exp, iat, type } — não o provider_token do Google
        // que tem { collect_cid, name, email, ... }
        if (payload.id && payload.exp && payload.exp > Date.now() / 1000) {
          userId = payload.id;
        } else if (payload.collect_cid) {
          // É o provider_token do Google, não o JWT do PB
          return c.json(400, {
            error: 'Token enviado é o provider_token do Google, não o JWT do PocketBase',
            hint: 'No DevTools → Application → Local Storage → pocketbase_auth → copie o campo "token"',
            providerTokenPayload: payload
          });
        }
      }
    } catch (e) {
      console.log("[debug-sheet-info] Token decode error:", e && e.message);
    }
  }

  if (!userId) {
    return c.json(401, {
      error: 'Não autenticado. Forneça um JWT válido do PocketBase (não o provider_token do Google)',
      hint: 'Acesse logado (Authorization header do pb.send) ou passe ?token=<jwt-do-pocketbase>',
      help: 'DevTools → Application → Local Storage → pocketbase_auth → campo "token"',
      debug: {
        hasAuth: !!c.auth,
        headerTokenPresent: !!headerToken,
        queryTokenLength: queryToken.length,
        queryTokenFirst30: queryToken.substring(0, 30)
      }
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
