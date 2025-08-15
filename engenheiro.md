# Instruções ao Engenheiro de Software (Revisado)

Baseado em arquitetura revisada em [arquitetura.md](arquitetura.md).

---

## 1. Coleções PocketBase

1. users (padrão)
2. google_infos
   - user_id (relation 1:1)
   - access_token (text)
   - refresh_token (text)
   - token_type (text)
   - scope (text)
   - expires_at (date)
   - sheet_id (text)
   - last_success_append_at (date, opcional)

### Regras
users:
read:  @request.auth.id = @record.id
write: @request.auth.id = @record.id

google_infos:
read:  @request.auth.id = @record.user_id
write: @request.auth.id = @record.user_id

---

## 2. Variáveis de Ambiente
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://seu-dominio.com/google-oauth-callback
SHEET_TEMPLATE_ID=...
APP_BASE_URL=https://seu-dominio.com
ENCRYPTION_KEY=...(opcional)

---

## 3. Utilitários (pb_hooks/_lib/)
_criar arquivos de apoio_

- oauth.js
  - exchangeCodeForTokens(code, codeVerifier)
  - refreshToken(refreshToken)
- tokens.js
  - isExpired(expires_at)
  - computeExpiresAt(expires_in)
- googleFetch.js
  - googleFetch(url, opts, { userId, autoRefresh: true })

---

## 4. Hooks

### 4.1 GET /google-oauth-callback (after)
Valida state + executa troca de código:
```js
/// pb_hooks/google-oauth-callback.pb.js
onAfterRequest(async ({ request, reply, pb }) => {
  if (request.path !== '/google-oauth-callback') return;

  try {
    const { code, state } = request.query;
    validateState(state); // lança erro se inválido

    const userId = extractUserIdFromState(state);
    const { access_token, refresh_token, expires_in, token_type, scope } =
      await exchangeCodeForTokens(code, getCodeVerifier(state));

    const expires_at = computeExpiresAt(expires_in);

    // Tenta localizar registro existente
    let rec;
    try {
      rec = await pb.collection('google_infos').getFirstListItem(`user_id="${userId}"`);
      await pb.collection('google_infos').update(rec.id, {
        access_token,
        refresh_token,
        token_type,
        scope,
        expires_at
      });
    } catch {
      await pb.collection('google_infos').create({
        user_id: userId,
        access_token,
        refresh_token,
        token_type,
        scope,
        expires_at
      });
    }

    reply.redirect('/dashboard');
  } catch (err) {
    console.error('[oauth-callback]', err);
    reply.code(400).send({ success: false, error: { code: 'OAUTH_CALLBACK_ERROR', message: 'Falha no callback OAuth.' } });
  }
});
```

### 4.2 POST /google-refresh-token (after)
```js
/// pb_hooks/google-refresh-token.pb.js
onAfterRequest(async ({ request, reply, pb }) => {
  if (request.path !== '/google-refresh-token' || request.method !== 'POST') return;

  try {
    const authUser = request.auth?.record;
    if (!authUser) return reply.code(401).send({ success: false, error: { code: 'UNAUTH', message: 'Não autenticado.' } });

    const info = await pb.collection('google_infos').getFirstListItem(`user_id="${authUser.id}"`);
    const { access_token, expires_in, token_type, scope } = await refreshToken(info.refresh_token);
    const expires_at = computeExpiresAt(expires_in);

    await pb.collection('google_infos').update(info.id, { access_token, expires_at, token_type, scope });

    reply.send({ success: true, data: { access_token, expires_at } });
  } catch (err) {
    console.error('[refresh-token]', err);
    reply.code(400).send({ success: false, error: { code: 'REFRESH_ERROR', message: 'Falha ao renovar token.' } });
  }
});
```

### 4.3 POST /provision-sheet (after)
```js
/// pb_hooks/provision-sheet.pb.js
onAfterRequest(async ({ request, reply, pb }) => {
  if (request.path !== '/provision-sheet' || request.method !== 'POST') return;

  try {
    const user = request.auth?.record;
    if (!user) return reply.code(401).send({ success: false, error: { code: 'UNAUTH', message: 'Não autenticado.' } });

    const info = await pb.collection('google_infos').getFirstListItem(`user_id="${user.id}"`);

    if (info.sheet_id) {
      return reply.code(409).send({ success: false, error: { code: 'ALREADY_PROVISIONED', message: 'Planilha já provisionada.' } });
    }

    // Refresh se expirada
    if (isExpired(info.expires_at)) {
      await refreshAndPersist(pb, info);
    }

    const copyRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${process.env.SHEET_TEMPLATE_ID}/copy`,
      { method: 'POST', headers: { Authorization: `Bearer ${info.access_token}` } }
    );

    if (!copyRes.ok) {
      const txt = await copyRes.text();
      throw new Error(`Erro ao copiar template: ${txt}`);
    }

    const { id: sheetId } = await copyRes.json();
    await pb.collection('google_infos').update(info.id, { sheet_id: sheetId });

    reply.send({ success: true, data: { sheet_id: sheetId } });
  } catch (err) {
    console.error('[provision-sheet]', err);
    reply.code(400).send({ success: false, error: { code: 'PROVISION_ERROR', message: 'Falha ao provisionar planilha.' } });
  }
});
```

### 4.4 POST /append-entry (after)
```js
/// pb_hooks/append-entry.pb.js
onAfterRequest(async ({ request, reply, pb }) => {
  if (request.path !== '/append-entry' || request.method !== 'POST') return;

  try {
    const user = request.auth?.record;
    if (!user) return reply.code(401).send({ success: false, error: { code: 'UNAUTH', message: 'Não autenticado.' } });

    const body = await request.json();
    const { data, conta, valor, descricao, categoria, orcamento } = body;

    // Validações básicas
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return reply.code(422).send({ success: false, error: { code: 'INVALID_DATE', message: 'Data inválida.' } });
    }
    if (typeof valor !== 'number' || Number.isNaN(valor)) {
      return reply.code(422).send({ success: false, error: { code: 'INVALID_VALUE', message: 'Valor deve ser numérico.' } });
    }

    const info = await pb.collection('google_infos').getFirstListItem(`user_id="${user.id}"`);
    if (!info.sheet_id) {
      return reply.code(409).send({ success: false, error: { code: 'NO_SHEET', message: 'Planilha não provisionada.' } });
    }

    if (isExpired(info.expires_at)) {
      await refreshAndPersist(pb, info);
    }

    const range = 'LANCAMENTOS!A:F';
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${info.sheet_id}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${info.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [[data, conta || '', valor, descricao || '', categoria || '', orcamento || '']]
        })
      }
    );

    if (!appendRes.ok) {
      const txt = await appendRes.text();
      throw new Error(`Sheets append error: ${txt}`);
    }

    await pb.collection('google_infos').update(info.id, { last_success_append_at: new Date().toISOString() });

    reply.send({ success: true, data: { message: 'Lançamento inserido com sucesso.' } });
  } catch (err) {
    console.error('[append-entry]', err);
    reply.code(400).send({ success: false, error: { code: 'APPEND_ERROR', message: 'Falha ao inserir lançamento.' } });
  }
});
```

---

## 5. Frontend Ajustes (dashboard)
- Não enviar userId no payload.
- Mostrar estado:
  - Se não provisionado → botão “Provisionar Planilha”.
  - Se provisionado → formulário habilitado.
- Tratar erros uniformemente:
  ```js
  if (!resp.ok) {
    const err = await resp.json();
    alert(err.error?.message || 'Erro inesperado.');
    return;
  }
  ```

---

## 6. Logs
Formato sugerido (stdout):
{"ts":"2025-08-14T19:00:00Z","userId":"abc123","action":"append-entry","success":true,"latencyMs":42}

---

## 7. Testes (Lista mínima)
- OAuth inicial (state válido / inválido)
- Refresh automático no append
- Append com planilha não provisionada
- Provisionar duas vezes (deve bloquear)
- Token expirado (manipular expires_at passado)
- Erro 429 (simulação → retry/backoff futuro)
- Campos inválidos (data e valor)

---

## 8. Roadmap Técnico
- Adicionar /list-entries com leitura paginada (usando Sheets batchGet)
- Implementar caching de categorias
- Exportar CSV direto do Sheets
- Mecanismo de soft delete (inserir coluna extra futuramente)
