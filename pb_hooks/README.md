# Google OAuth Integration - PocketBase Hook

Este arquivo implementa a integração com Google OAuth para obter tokens de acesso ao Google Sheets API.

## Arquivos Criados

### 1. `pb_hooks/google-redirect.pb.js`
Hook principal que implementa:
- **Endpoint GET `/google-oauth-callback`**: Recebe o código de autorização do Google e troca por tokens
- **Endpoint POST `/google-refresh-token`**: Renova o access_token usando o refresh_token

### 2. `.env.example`
Arquivo com exemplo das variáveis de ambiente necessárias

### 3. `pb_public/oauth-test.html`
Página de teste para verificar o fluxo OAuth

## Configuração Necessária

### Variáveis de Ambiente
```bash
GOOGLE_CLIENT_ID=SEU_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=SEU_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:8090/google-oauth-callback
```

### Google Cloud Console
1. Criar projeto no Google Cloud Console
2. Habilitar APIs:
   - Google Sheets API
   - Google Drive API
3. Criar credenciais OAuth 2.0:
   - Tipo: Aplicação Web
   - URI de redirecionamento: `http://localhost:8090/google-oauth-callback` (ou sua URL de produção)

## Fluxo de Funcionamento

### 1. Autorização Initial
```
1. Frontend → Google OAuth URL (com state=user_id)
2. Usuário autoriza no Google
3. Google → /google-oauth-callback?code=XXX&state=user_id
4. Hook troca código por tokens
5. Tokens salvos na coleção google_infos
```

### 2. Renovação de Token
```
1. Frontend → POST /google-refresh-token
2. Hook busca refresh_token do usuário
3. Hook faz requisição ao Google para renovar
4. Novo access_token salvo no banco
```

## Estrutura da Resposta do Google

### Token Exchange Response
```json
{
  "access_token": "ya29.a0AW...b-lA",
  "expires_in": 3599,
  "refresh_token": "1//0AZ...u_lA",
  "scope": "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets",
  "token_type": "Bearer"
}
```

### Refresh Token Response
```json
{
  "access_token": "ya29.a0AW...new",
  "expires_in": 3599,
  "token_type": "Bearer"
}
```

## Coleção google_infos

### Campos
- `id`: ID único do registro
- `user_id`: Referência ao usuário (_pb_users_auth_)
- `access_token`: Token de acesso ao Google APIs
- `refresh_token`: Token para renovação
- `sheet_id`: ID da planilha Google (usado em outras partes do sistema)
- `created`: Data de criação
- `updated`: Data de atualização

## Segurança

### Implementado
- Mascaramento do access_token na resposta JSON
- Validação de entrada (code, user_id)
- Tratamento de erros HTTP
- Logs para debug (sem expor tokens)

### Recomendações
- Usar HTTPS em produção
- Configurar CORS adequadamente
- Implementar rate limiting
- Validar origem das requisições
- Rotacionar client_secret periodicamente

## Teste

### Via Página de Teste
1. Acesse `http://localhost:8090/oauth-test.html`
2. Configure as variáveis de ambiente
3. Digite um User ID de teste
4. Clique em "Iniciar Autorização Google"

### Via curl (Renovação)
```bash
curl -X POST http://localhost:8090/google-refresh-token \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user-123"}'
```

## Possíveis Erros

### Configuração
- `GOOGLE_CLIENT_ID` não definido ou inválido
- `GOOGLE_CLIENT_SECRET` não definido ou inválido
- URI de redirecionamento não configurado no Google Console

### Runtime
- Código de autorização expirado
- Refresh token inválido ou revogado
- Usuário não encontrado na base
- Falha na comunicação com Google APIs

## Integração com Frontend

### JavaScript Example
```javascript
// Iniciar OAuth
function startGoogleAuth(userId) {
  const params = new URLSearchParams({
    client_id: 'SEU_CLIENT_ID.apps.googleusercontent.com',
    redirect_uri: 'http://localhost:8090/google-oauth-callback',
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    state: userId
  });
  
  window.location.href = `https://accounts.google.com/oauth/authorize?${params}`;
}

// Renovar token
async function refreshGoogleToken(userId) {
  const response = await fetch('/google-refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  
  return response.json();
}
```

## Próximos Passos

1. **Implementar frontend**: Integrar com as páginas existentes
2. **Adicionar provisionamento**: Criar planilha modelo automaticamente
3. **Implementar N8N integration**: Webhook para inserir dados na planilha
4. **Adicionar validação de escopo**: Verificar permissões necessárias
5. **Implementar revogação**: Endpoint para revogar tokens