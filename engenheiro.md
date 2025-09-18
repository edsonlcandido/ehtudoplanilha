# Instruções ao Engenheiro de Software

Baseado em arquitetura detalhada em [arquitetura.md](arquitetura.md).

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
```javascript
routerAdd("GET", "/google-oauth-callback", (c) => {
  // 1. Validar state (anti-CSRF)
  // 2. Trocar code por tokens via oauth.js
  // 3. Salvar tokens e calcular expires_at
  // 4. Redirecionar para dashboard
});
```

### 4.2 POST /google-refresh-token (after)
```javascript
routerAdd("POST", "/google-refresh-token", (c) => {
  // 1. Verificar autenticação
  // 2. Pegar refresh_token do usuário
  // 3. Obter novos tokens
  // 4. Atualizar no banco
});
```

### 4.3 POST /provision-sheet (after)
```javascript
routerAdd("POST", "/provision-sheet", (c) => {
  // 1. Verificar autenticação
  // 2. Se já tem sheet_id: 409 ou reutilizar
  // 3. Copiar template via Drive API
  // 4. Atualizar sheet_id
});
```

### 4.4 POST /append-entry (after)
```javascript
routerAdd("POST", "/append-entry", (c) => {
  // 1. Extrair dados do request
  // 2. Validar campos (data, valor)
  // 3. Verificar expires_at e refresh se necessário
  // 4. Append via Sheets API
  // 5. Atualizar last_success_append_at
});
```

---

## 5. Frontend Ajustes (dashboard)
- Não enviar userId no payload.
- Mostrar estado:
  - Se não provisionado → botão "Provisionar Planilha".
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