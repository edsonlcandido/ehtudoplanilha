# Instruções ao Engenheiro de Software

Este documento orienta a implementação completa do SaaS multi-tenant usando PocketBase e Google Sheets, conforme definido em [arquitetura.md](arquitetura.md) e integrado na página de dashboard (`pb_public/dashboard/index.html`).

---

## 1. Configuração do PocketBase

1. Crie as coleções no Admin UI:
   - **users** (padrão: email, password)
   - **google_infos**  
     • `user_id` (relação 1:1 → users)  
     • `access_token` (Texto)  
     • `refresh_token` (Texto)  
     • `sheet_id` (Texto)

2. Regras de acesso (Collection Rules):
   - **users**:  
     ```pb_rule
     read:  @request.auth.id == @record.id
     write: @request.auth.id == @record.id
     ```
   - **google_infos**:  
     ```pb_rule
     read:  @request.auth.id == record.user_id.id
     write: @request.auth.id == record.user_id.id
     ```

3. Variáveis de ambiente (`.env` ou no container):
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=https://seu-dominio.com/google-oauth-callback
   SHEET_TEMPLATE_ID=...
   ```

---

## 2. Hooks do PocketBase (`pb_hooks/`)

Implemente os seguintes endpoints em JavaScript:

### 2.1. GET `/google-oauth-callback`
```js
// pb_hooks/google-redirect.pb.js (after hook)
const { code, state: userId } = request.query;
const tokens = await exchangeCodeForTokens(code);
await pb.collection('google_infos').updateOrCreate(
  { filter: { user_id: userId } },
  { user_id: userId, access_token: tokens.access_token, refresh_token: tokens.refresh_token }
);
reply.redirect('/dashboard');
```

### 2.2. POST `/google-refresh-token`
```js
// pb_hooks/google-refresh.pb.js (before hook)
const { userId } = await request.json();
const record = await pb.collection('google_infos').getFirstListItem(`user_id="${userId}"`);
const newTokens = await refreshToken(record.refresh_token);
await pb.collection('google_infos').update(record.id, { access_token: newTokens.access_token });
reply.send({ access_token: newTokens.access_token });
```

### 2.3. POST `/provision-sheet`
```js
// pb_hooks/provision-sheet.pb.js (after hook)
const userId = request.auth.record.id;
const info = await pb.collection('google_infos').getFirstListItem(`user_id="${userId}"`);
const copyRes = await fetch(`https://www.googleapis.com/drive/v3/files/${process.env.SHEET_TEMPLATE_ID}/copy`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${info.access_token}` }
});
const { id: sheetId } = await copyRes.json();
await pb.collection('google_infos').update(info.id, { sheet_id: sheetId });
reply.send({ sheet_id: sheetId });
```

### 2.4. POST `/append-entry`
```js
// pb_hooks/append-entry.pb.js (after hook)
const { userId, data, conta, valor, descricao, categoria, orcamento } = await request.json();
let info = await pb.collection('google_infos').getFirstListItem(`user_id="${userId}"`);
if (tokenExpired(info.access_token)) {
  // renova token e atualiza info.access_token...
}
await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${info.sheet_id}/values/Sheet1!A:F:append?valueInputOption=USER_ENTERED`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${info.access_token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ values: [[data, conta, valor, descricao, categoria, orcamento]] })
});
reply.send({ success: true, message: 'Lançamento inserido na planilha!' });
```

---

## 3. Frontend (`pb_public/dashboard/index.html`)

1. Garanta que `picnic.css` e `pocketbase.umd.js` estejam importados.
2. Ative o formulário de despesa (remova `disabled` do `<form>` e `<fieldset>`).
3. Adicione este script **após** `dashboard-auth.js`:
   ```html
   <script type="module">
   import { authHeaders, ensureAuth } from '../js/dashboard-auth.js';
   await ensureAuth();
   const form = document.getElementById('expenseForm');
   form.addEventListener('submit', async e => {
     e.preventDefault();
     const payload = {
       userId: pb.authStore.model.id,
       data: document.getElementById('expenseDate').value,
       conta: document.getElementById('expenseAccount').value,
       valor: parseFloat(document.getElementById('expenseValue').value),
       descricao: document.getElementById('expenseDescription').value,
       categoria: document.getElementById('expenseCategory').value,
       orcamento: document.getElementById('expenseBudget').value
     };
     const resp = await fetch('/append-entry', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', ...authHeaders() },
       body: JSON.stringify(payload)
     });
     const result = await resp.json();
     alert(result.message);
     form.reset();
   });
   </script>
   ```
4. No botão “⚙️ Configurar Integração” redirecione para `configuracao.html`.

---

## 4. Segurança e Manutenção

- Force HTTPS em produção.  
- Habilite CORS apenas para seu domínio.  
- Implemente rate-limit nos hooks.  
- Registre logs de erro e sucesso.  
- Automatize backup diário do SQLite.  
- Monitore cotas da API Google e implemente backoff em caso de erros 429.
