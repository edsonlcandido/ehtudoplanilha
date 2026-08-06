# Configuração OAuth Google - Planilha Eh Tudo PWA

## 🔧 Endpoint de Callback OAuth

O sistema usa um hook customizado do PocketBase para redirecionar o callback OAuth para o frontend Vue.js.

### URL de Callback a Configurar no Google Cloud Console:

**Importante: Configure APENAS esta URL no Google Cloud Console:**

```
https://planilha.ehtudo.app/api/oauth2-redirect
```

## 📋 Passo a Passo da Configuração

### 1. Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Selecione seu projeto (ou crie um novo)
3. Vá em **APIs e Serviços** > **Credenciais**
4. Crie ou edite suas credenciais OAuth 2.0
5. Em **URIs de redirecionamento autorizados**, adicione:
   ```
   https://planilha.ehtudo.app/api/oauth2-redirect
   ```
6. Salve as alterações

### 2. PocketBase Admin UI

1. Acesse: https://planilha.ehtudo.app/_/
2. Faça login como administrador
3. Vá em **Collections** > **users**
4. Clique no ícone ⚙️ (configurações)
5. Vá para a aba **Options** > **OAuth2**
6. Clique em **+ Add provider**
7. Selecione **Google**
8. Configure:
   - ✅ **Enabled**: Ativado
   - **Client ID**: (do Google Cloud Console)
   - **Client Secret**: (do Google Cloud Console)
9. Clique em **Save**

### 3. Arquivos do Sistema

O sistema já está configurado com:

✅ **Frontend**: `src/services/auth-oauth.ts`
- Implementa fluxo manual OAuth sem EventSource
- Usa `listAuthMethods()` para obter URL OAuth
- Salva state e codeVerifier no localStorage
- Redireciona para Google OAuth

✅ **Hook PocketBase**: `pb_hooks/oauth-redirect.pb.js`
- Intercepta `/api/oauth2-redirect`
- Redireciona para `/pwa/login` com parâmetros
- Trata erros do Google OAuth

✅ **Componente Login**: `src/components/LoginPage.vue`
- Detecta callback OAuth automaticamente
- Valida state e troca código por tokens
- Redireciona para home após sucesso

## 🔄 Fluxo Completo OAuth

```
1. Usuário clica "Continuar com Google"
   ↓
2. Frontend chama AuthOAuthService.loginWithGoogle()
   ↓
3. Busca provedores OAuth via listAuthMethods()
   ↓
4. Salva state e codeVerifier no localStorage
   ↓
5. Redireciona para Google OAuth
   ↓
6. Usuário autoriza no Google
   ↓
7. Google → https://planilha.ehtudo.app/api/oauth2-redirect?code=...&state=...
   ↓
8. Hook PocketBase intercepta e redireciona → /pwa/login?code=...&state=...
   ↓
9. LoginPage detecta callback OAuth
   ↓
10. Valida state (proteção CSRF)
   ↓
11. Chama authWithOAuth2Code() para trocar código por tokens
   ↓
12. PocketBase valida com Google e cria/atualiza usuário
   ↓
13. Limpa localStorage e parâmetros da URL
   ↓
14. Redireciona para /pwa/ (home)
   ↓
✅ Usuário autenticado!
```

## 🔐 Segurança Implementada

### 1. **State Validation (CSRF Protection)**
- PocketBase gera state único
- Salvo no localStorage
- Validado no callback

### 2. **PKCE (Proof Key for Code Exchange)**
- PocketBase gera codeVerifier e codeChallenge
- codeVerifier salvo no localStorage
- Usado na troca de código por tokens

### 3. **Validação de Tokens**
- PocketBase valida tokens com Google
- Obtém informações do usuário
- Cria registro seguro no banco

### 4. **Limpeza de Dados**
- localStorage limpo após autenticação
- Parâmetros removidos da URL
- Sessão segura armazenada no PocketBase

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"
**Causa**: URL de callback não está no Google Cloud Console

**Solução**:
1. Verifique se adicionou exatamente: `https://planilha.ehtudo.app/api/oauth2-redirect`
2. Não use `http://` (apenas `https://`)
3. Não adicione barra no final
4. Aguarde alguns minutos após salvar (propagação)

### Erro: "OAuth provider not configured"
**Causa**: OAuth não configurado no PocketBase

**Solução**:
1. Acesse PocketBase Admin UI
2. Configure Google OAuth conforme seção 2
3. Certifique-se de salvar as alterações

### Erro: "State OAuth inválido"
**Causa**: localStorage foi limpo ou sessão expirou

**Solução**:
1. Limpe o cache do navegador
2. Tente fazer login novamente
3. Verifique se cookies/localStorage estão habilitados

### Erro: "EventSource connect took too long"
**Causa**: Tentativa de usar método automático `authWithOAuth2()`

**Solução**: ✅ Já resolvido! O sistema usa fluxo manual sem EventSource.

## ✅ Checklist de Configuração

- [ ] Client ID e Client Secret criados no Google Cloud Console
- [ ] URI de callback adicionada: `https://planilha.ehtudo.app/api/oauth2-redirect`
- [ ] OAuth configurado no PocketBase Admin UI
- [ ] Hook `pb_hooks/oauth-redirect.pb.js` está no servidor
- [ ] Testar login com Google
- [ ] Verificar se usuário é criado na collection `users`
- [ ] Confirmar redirecionamento para dashboard

## 📝 Notas Importantes

1. **Não use `/pwa/login` como redirect_uri no Google Console**
   - O Google deve chamar `/api/oauth2-redirect`
   - O hook do PocketBase faz o redirect para `/pwa/login`

2. **O hook precisa estar no servidor**
   - Copie `pb_hooks/oauth-redirect.pb.js` para o servidor de produção
   - O PocketBase carrega hooks automaticamente no boot

3. **Frontend funciona localmente**
   - Pode rodar Vite dev server na porta 5173
   - OAuth sempre usa a URL do PocketBase (8090 ou produção)

4. **Não exponha credenciais**
   - Client Secret está apenas no PocketBase Admin UI
   - Nunca no código frontend ou arquivos `.env`

---

**Status**: ✅ Implementação completa e pronta para uso

**Última atualização**: 28 de novembro de 2025
