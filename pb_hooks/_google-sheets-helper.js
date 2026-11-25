/// <reference path="../pb_data/types.d.ts" />

/**
 * Helper compartilhado para chamadas à Google Sheets API com auto-refresh de token.
 *
 * Carregado via `require()` DENTRO de cada handler que precisar.
 * NÃO usar variáveis top-level globais — cada handler roda em contexto isolado
 * (ver doc: https://pocketbase.io/docs/js-overview/).
 *
 * Padrão de uso em outro hook:
 *   const gsheets = require(`${__hooks}/_google-sheets-helper.pb.js`);
 *   const result = gsheets.callWithRefresh(googleInfo, { method, url, body });
 *
 * API exportada:
 *   - SHEET_NAME_DEFAULT:    nome padrão da aba de lançamentos
 *   - getGoogleInfo(userId): retorna registro google_infos ou null
 *   - refreshAccessToken(googleInfo): renova access_token via refresh_token; persiste
 *   - callWithRefresh(googleInfo, { method, url, body }): chama Sheets API com auto-refresh
 *   - buildSheetUrl(range, queryString): monta URL com placeholder {SHEET_ID}
 *   - parseRowIndexFromRange(updatedRange): extrai número da linha
 *   - getLancamentosRows(googleInfo, {fresh}): linhas da aba Lançamentos (sem cabeçalho) com cache
 *   - getCategoriasCompletas(googleInfo, {fresh}): categorias com tipo+orçamento, com cache
 */

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEET_NAME_DEFAULT = 'Lançamentos';

function getGoogleInfo(userId) {
  try {
    return $app.findFirstRecordByFilter(
      'google_infos',
      'user_id = {:userId}',
      { userId }
    );
  } catch (e) {
    return null;
  }
}

function refreshAccessToken(googleInfo) {
  const refreshToken = googleInfo.get('refresh_token');
  if (!refreshToken) return null;

  const clientId = $os.getenv('GOOGLE_CLIENT_ID');
  const clientSecret = $os.getenv('GOOGLE_CLIENT_SECRET');

  const body = [
    'refresh_token=' + encodeURIComponent(refreshToken),
    'client_id=' + encodeURIComponent(clientId),
    'client_secret=' + encodeURIComponent(clientSecret),
    'grant_type=refresh_token'
  ].join('&');

  const response = $http.send({
    url: OAUTH_TOKEN_URL,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body
  });

  if (response.statusCode !== 200) {
    console.log('[gsheets] Falha ao renovar token:', response.statusCode, response.raw);
    return null;
  }

  const newToken = response.json.access_token;
  if (!newToken) return null;

  googleInfo.set('access_token', newToken);
  $app.save(googleInfo);
  return newToken;
}

function callWithRefresh(googleInfo, request) {
  if (!googleInfo) {
    return { ok: false, status: 404, data: null, error: 'Registro do Google não encontrado', refreshed: false };
  }

  const accessToken = googleInfo.get('access_token');
  if (!accessToken) {
    return { ok: false, status: 400, data: null, error: 'Token de acesso não encontrado', refreshed: false };
  }

  const sheetId = googleInfo.get('sheet_id');
  if (!sheetId) {
    return { ok: false, status: 400, data: null, error: 'Nenhuma planilha configurada', refreshed: false };
  }

  const url = request.url.replace('{SHEET_ID}', sheetId);
  const method = request.method || 'GET';
  const bodyJson = request.body !== undefined ? JSON.stringify(request.body) : undefined;

  function doRequest(token) {
    return $http.send({
      url: url,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: bodyJson
    });
  }

  let response = doRequest(accessToken);
  let refreshed = false;

  if (response.statusCode === 401) {
    const newToken = refreshAccessToken(googleInfo);
    if (!newToken) {
      return {
        ok: false,
        status: 401,
        data: null,
        error: 'Token expirado e refresh não disponível ou falhou',
        refreshed: false
      };
    }
    response = doRequest(newToken);
    refreshed = true;
  }

  const ok = response.statusCode >= 200 && response.statusCode < 300;
  return {
    ok: ok,
    status: response.statusCode,
    data: ok ? response.json : null,
    error: ok ? null : (response.raw || ('HTTP ' + response.statusCode)),
    refreshed: refreshed
  };
}

function buildSheetUrl(range, queryString) {
  const q = queryString ? '?' + queryString : '';
  return SHEETS_API_BASE + '/{SHEET_ID}/values/' + encodeURI(range) + q;
}

/**
 * Constrói URL do endpoint values:append (POST). O ":append" é parte LITERAL
 * do path, não query string. Sem ele o Google retorna 404 genérico.
 * Ex: buildAppendUrl('Lançamentos!A:G', 'valueInputOption=USER_ENTERED')
 *   -> .../values/Lan%C3%A7amentos!A:G:append?valueInputOption=USER_ENTERED
 */
function buildAppendUrl(range, queryString) {
  const q = queryString ? '?' + queryString : '';
  return SHEETS_API_BASE + '/{SHEET_ID}/values/' + encodeURI(range) + ':append' + q;
}

/**
 * Constrói URL do endpoint values:clear (POST). O ":clear" é parte LITERAL
 * do path, semelhante ao ":append". Sem query string.
 * Ex: buildClearUrl('Lançamentos!A2:Z2000')
 *   -> .../values/Lan%C3%A7amentos!A2:Z2000:clear
 */
function buildClearUrl(range) {
  return SHEETS_API_BASE + '/{SHEET_ID}/values/' + encodeURI(range) + ':clear';
}

function parseRowIndexFromRange(updatedRange) {
  if (!updatedRange || typeof updatedRange !== 'string') return null;
  const m = updatedRange.match(/!A(\d+):/);
  return m ? parseInt(m[1], 10) : null;
}

// ============================================================================
// Leituras com cache (in-memory via $app.store())
// ============================================================================

/**
 * O cache vive em `$app.store()` — store em memória do processo do PocketBase.
 * Importante: NÃO dá pra guardar estado em variável top-level dos hooks!
 * Cada handler roda em contexto isolado (PB 0.31), então `let cache = {}` no
 * topo do arquivo é resetado a cada requisição. `$app.store()` persiste entre
 * requisições (e morre com o processo, o que é o comportamento desejado).
 *
 * TTLs:
 *  - lançamentos: 30s (evita bater na API do Google a cada troca de filtro)
 *  - categorias:  5min (categoria/tipo mudam raramente)
 */
const CACHE_TTL_ROWS = 30 * 1000;
const CACHE_TTL_CATEGORIES = 5 * 60 * 1000;

function storeGet(key) {
  try {
    return $app.store().get(key);
  } catch (e) {
    return null;
  }
}

function storeSet(key, value) {
  try {
    $app.store().set(key, value);
  } catch (e) {
    // cache é otimização: falha silenciosa não pode derrubar a request
  }
}

/**
 * Lê do cache se ainda estiver válido.
 */
function readCache(key, ttl) {
  const cached = storeGet(key);
  if (!cached || typeof cached !== 'object') return null;
  if (!cached.t || !cached.data) return null;
  if (Date.now() - cached.t > ttl) return null;
  return cached.data;
}

function writeCache(key, data) {
  storeSet(key, { t: Date.now(), data: data });
}

/**
 * Busca as linhas da aba "Lançamentos" (A:G), com cache curto.
 *
 * @param {*} googleInfo registro google_infos
 * @param {{fresh?:boolean, ttl?:number}} opts
 * @returns {{ok:boolean, status:number, rows:Array<Array<any>>, error:?string}}
 *          `rows` já vem SEM a linha de cabeçalho.
 */
function getLancamentosRows(googleInfo, opts) {
  const options = opts || {};
  const sheetId = googleInfo.get('sheet_id');
  if (!sheetId) {
    return { ok: false, status: 400, rows: [], error: 'Nenhuma planilha configurada' };
  }

  const cacheKey = 'sheet:' + sheetId + ':rows';

  if (!options.fresh) {
    const cached = readCache(cacheKey, options.ttl || CACHE_TTL_ROWS);
    if (cached) {
      return { ok: true, status: 200, rows: cached, fromCache: true };
    }
  }

  const url = buildSheetUrl(
    SHEET_NAME_DEFAULT + '!A1:G',
    'majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE'
  );

  const result = callWithRefresh(googleInfo, { method: 'GET', url: url });
  if (!result.ok) {
    return { ok: false, status: result.status, rows: [], error: result.error };
  }

  const values = (result.data && result.data.values) || [];
  // linha 1 é o cabeçalho
  const rows = values.slice(1);

  writeCache(cacheKey, rows);

  return { ok: true, status: 200, rows: rows, fromCache: false };
}

/**
 * Busca as categorias completas da aba "Categorias" (A:C), com cache longo.
 *
 * @param {*} googleInfo registro google_infos
 * @param {{fresh?:boolean}} opts
 * @returns {{ok:boolean, status:number, categorias:Array<object>, error:?string}}
 */
function getCategoriasCompletas(googleInfo, opts) {
  const options = opts || {};
  const sheetId = googleInfo.get('sheet_id');
  if (!sheetId) {
    return { ok: false, status: 400, categorias: [], error: 'Nenhuma planilha configurada' };
  }

  const cacheKey = 'sheet:' + sheetId + ':categorias';

  if (!options.fresh) {
    const cached = readCache(cacheKey, CACHE_TTL_CATEGORIES);
    if (cached) {
      return { ok: true, status: 200, categorias: cached, fromCache: true };
    }
  }

  // Aba de categorias: nome do produto é "Categorias" (a API do Sheets
  // resolve o nome da aba case-insensitive).
  const url = buildSheetUrl(
    'Categorias!A2:C',
    'majorDimension=ROWS'
  );

  const result = callWithRefresh(googleInfo, { method: 'GET', url: url });
  if (!result.ok) {
    return { ok: false, status: result.status, categorias: [], error: result.error };
  }

  const values = (result.data && result.data.values) || [];
  const categorias = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (!row || !row[0] || String(row[0]).trim() === '') continue;

    const orcamentoStr = row[2] ? String(row[2]).trim() : '0';
    let orcamento = 0;
    if (orcamentoStr) {
      const normalized = orcamentoStr.replace(/\s/g, '').replace(',', '.');
      orcamento = parseFloat(normalized) || 0;
    }

    categorias.push({
      categoria: String(row[0]).trim(),
      tipo: row[1] ? String(row[1]).trim().toUpperCase() : '',
      orcamento: orcamento
    });
  }

  writeCache(cacheKey, categorias);

  return { ok: true, status: 200, categorias: categorias, fromCache: false };
}

module.exports = {
  SHEET_NAME_DEFAULT: SHEET_NAME_DEFAULT,
  getGoogleInfo: getGoogleInfo,
  refreshAccessToken: refreshAccessToken,
  callWithRefresh: callWithRefresh,
  buildSheetUrl: buildSheetUrl,
  buildAppendUrl: buildAppendUrl,
  buildClearUrl: buildClearUrl,
  parseRowIndexFromRange: parseRowIndexFromRange,
  getLancamentosRows: getLancamentosRows,
  getCategoriasCompletas: getCategoriasCompletas
};
