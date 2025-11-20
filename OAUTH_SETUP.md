# Configuração do Google OAuth

Este documento descreve como configurar a autenticação OAuth do Google para permitir que usuários façam login e registro usando suas contas Google.

## Pré-requisitos

1. Conta Google Cloud Platform (GCP)
2. Projeto criado no GCP
3. Acesso ao Console de APIs do Google

## Passos para Configuração

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o ID do projeto

### 2. Habilitar APIs Necessárias

1. No menu lateral, vá em **APIs e Serviços** > **Biblioteca**
2. Procure e habilite:
   - **Google+ API** ou **Google Identity API** (para autenticação OAuth)

### 3. Configurar Tela de Consentimento OAuth

1. No menu lateral, vá em **APIs e Serviços** > **Tela de consentimento OAuth**
2. Selecione o tipo de usuário:
   - **Interno**: Somente para usuários da sua organização Google Workspace
   - **Externo**: Para qualquer usuário com conta Google (recomendado para aplicações públicas)
3. Preencha as informações obrigatórias:
   - Nome do app: `Planilha Eh Tudo`
   - E-mail de suporte do usuário
   - Logotipo do app (opcional)
   - Domínio autorizado: seu domínio de produção
   - E-mail de contato do desenvolvedor
4. Em **Escopos**, adicione os escopos necessários:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
5. Salve e continue

### 4. Criar Credenciais OAuth 2.0

1. No menu lateral, vá em **APIs e Serviços** > **Credenciais**
2. Clique em **+ CRIAR CREDENCIAIS** > **ID do cliente OAuth 2.0**
3. Selecione o tipo de aplicativo: **Aplicativo da Web**
4. Configure:
   - **Nome**: `Planilha Eh Tudo - Web Client`
   - **Origens JavaScript autorizadas**:
     - Desenvolvimento: `http://localhost:8090`
     - Produção: `https://seudominio.com`
   - **URIs de redirecionamento autorizados** (IMPORTANTE: use as páginas de login/registro, não `/api/oauth2-redirect`):
     - Desenvolvimento: 
       - `http://localhost:8090/login.html`
       - `http://localhost:8090/registro.html`
     - Produção: 
       - `https://seudominio.com/login.html`
       - `https://seudominio.com/registro.html`
5. Clique em **CRIAR**
6. Anote o **ID do cliente** e o **Segredo do cliente**

### 5. Configurar OAuth no PocketBase Admin UI

**Não use variáveis de ambiente .env para OAuth de autenticação. Configure diretamente no PocketBase Admin UI:**

1. Acesse o PocketBase Admin UI: `http://localhost:8090/_/` (ou seu domínio de produção)
2. Faça login como administrador
3. No menu lateral, vá em **Collections** > **users**
4. Clique no ícone de configuração (⚙️) ao lado de "users"
5. Vá para a aba **Options** > **OAuth2**
6. Clique em **+ Add provider**
7. Selecione **Google**
8. Configure:
   - **Enabled**: ✅ Ativado
   - **Client ID**: cole o ID do cliente obtido no Google Cloud Console
   - **Client Secret**: cole o segredo do cliente obtido no Google Cloud Console
9. Clique em **Save**

## Como Funciona

### Fluxo de Autenticação (Manual Code Exchange)

1. **Usuário clica em "Entrar com Google"** na página de login ou registro
2. **Frontend inicia o fluxo OAuth**:
   - Chama `AuthOAuthService.loginWithGoogle()`
   - Obtém configuração OAuth via `listAuthMethods()`
   - PocketBase retorna URL OAuth pré-configurada com state e codeChallenge
   - Define redirect_uri como a página atual (login.html ou registro.html)
   - Salva state e codeVerifier no localStorage
   - Faz redirect direto para Google OAuth
3. **Usuário autoriza o aplicativo** no Google
4. **Google redireciona de volta** para a página de login/registro com parâmetros:
   - `code`: código de autorização
   - `state`: para validação CSRF
5. **Frontend detecta o callback OAuth**:
   - Verifica presença do parâmetro `code` na URL
   - Valida o `state` recebido contra o salvo
   - Chama `authWithOAuth2Code()` para trocar o código por tokens
   - PocketBase autentica o usuário e cria conta se não existir
   - Limpa a URL e redireciona para o dashboard

**Por que não usar `authWithOAuth2()`?**

Mesmo com `urlCallback`, o PocketBase SDK tenta estabelecer uma conexão EventSource primeiro, causando:
- ❌ Timeout em ambientes com restrições
- ❌ Bloqueio por extensões de navegador
- ❌ Problemas de CORS/rede específicos

**Solução implementada (Manual OAuth Code Exchange)**:
- ✅ Usa `listAuthMethods()` para obter URL OAuth pré-configurada
- ✅ PocketBase retorna URL com state, codeChallenge, codeVerifier já gerados
- ✅ Define redirect_uri como a própria página (não /api/oauth2-redirect)
- ✅ Salva state e codeVerifier no localStorage para uso posterior
- ✅ Redirect direto com `window.location.href` (sem EventSource)
- ✅ Recebe callback na mesma página e troca código manualmente via `authWithOAuth2Code()`
- ✅ Funciona universalmente em qualquer ambiente

**Diferença do fluxo automático**:
- ❌ Automático: usa `/api/oauth2-redirect` e PocketBase gerencia tudo (mas falha com EventSource)
- ✅ Manual: redirect_uri aponta para frontend, que troca o código usando `authWithOAuth2Code()`

**Configuração do redirect_uri**:
No Google Cloud Console, configure as URIs:
- `https://seudominio.com/login.html`
- `https://seudominio.com/registro.html`

Não use `/api/oauth2-redirect` pois estamos fazendo troca manual do código.

### Validação do Código OAuth

O código OAuth retornado pelo Google é automaticamente validado em múltiplos níveis:

#### 1. Validação de State (CSRF Protection)

Ao iniciar o fluxo OAuth, o PocketBase gera um `state` único que é:
- Salvo no `localStorage` do navegador
- Incluído na URL de autorização do Google
- Retornado pelo Google junto com o código

**Validação no código** (`src/services/auth-oauth.ts`, linha 169-172):
```typescript
const savedState = localStorage.getItem('oauth_state');
if (state !== savedState) {
  throw new Error('State OAuth inválido. Possível ataque CSRF.');
}
```

Isso previne ataques CSRF (Cross-Site Request Forgery), garantindo que o callback OAuth veio de uma solicitação legítima iniciada pelo seu aplicativo.

#### 2. Validação do Code Verifier (PKCE)

O sistema usa PKCE (Proof Key for Code Exchange) para maior segurança:
- PocketBase gera um `codeVerifier` aleatório
- É salvo no `localStorage` para uso posterior
- Um `codeChallenge` derivado é enviado ao Google
- No callback, o `codeVerifier` original é usado para validar a troca

**Validação no código** (`src/services/auth-oauth.ts`, linha 174-178):
```typescript
const codeVerifier = localStorage.getItem('oauth_code_verifier');
if (!codeVerifier) {
  throw new Error('Code verifier não encontrado');
}
```

#### 3. Validação pelo PocketBase

Quando chamamos `authWithOAuth2Code()`, o PocketBase:
1. Verifica se o `code` é válido e não expirou
2. Valida o `codeVerifier` contra o `codeChallenge`
3. Troca o código por tokens (access_token, refresh_token)
4. Valida os tokens com o Google
5. Obtém informações do usuário (email, nome, foto)
6. Cria ou atualiza o registro do usuário no banco de dados

**Troca de código** (`src/services/auth-oauth.ts`, linha 185-190):
```typescript
const authData = await pb.collection('users').authWithOAuth2Code(
  'google',
  code,
  codeVerifier,
  redirectUrl
);
```

#### 4. Tratamento de Erros

O sistema trata diversos tipos de erros:
- **Código inválido ou expirado**: Mostrado ao usuário
- **State inválido**: Indica possível ataque CSRF
- **Code verifier ausente**: Problema na sessão do navegador
- **Erro do Google**: Exibido com descrição detalhada

**Tratamento de erros** (`src/services/auth-oauth.ts`, linha 209-225):
```typescript
catch (error: any) {
  console.error('[AuthOAuth] Erro ao processar callback OAuth:', error);
  // Limpa dados temporários
  localStorage.removeItem('oauth_state');
  localStorage.removeItem('oauth_code_verifier');
  // Mostra erro ao usuário
  alert(`Erro: ${errorMsg}`);
}
```

### Onde Encontrar o Código de Validação

Todo o código de validação OAuth está em:
- **Arquivo**: `src/services/auth-oauth.ts`
- **Método principal**: `handleOAuthCallback()` (linha 129-226)
- **Validações específicas**:
  - State: linha 169-172
  - Code verifier: linha 174-178
  - Troca de código: linha 185-190
  - Tratamento de erros: linha 209-225

## Arquivos Relacionados

### Frontend
- `src/services/auth-oauth.ts` - Serviço de autenticação OAuth
- `src/login.html` e `src/login.ts` - Página de login com botão Google
- `src/registro.html` e `src/registro.ts` - Página de registro com botão Google

### Backend
- Configuração OAuth no PocketBase Admin UI
- `pb_hooks/google-oauth-callback.pb.js` - Callback para Sheets OAuth (diferente, não relacionado ao login)

## Testes

### Testar Localmente

1. Configure as variáveis de ambiente no `.env`
2. Inicie o PocketBase: `./iniciar-pb.sh`
3. Acesse `http://localhost:8090/login.html`
4. Clique em "Entrar com Google"
5. Autorize o aplicativo
6. Verifique se foi redirecionado para o dashboard

### Verificar Configuração

1. Verifique se o OAuth está configurado no Admin UI:
   - Acesse o Admin UI: `http://localhost:8090/_/`
   - Vá em Collections > users > Edit (⚙️) > Options > OAuth2
   - Confirme que o Google está habilitado e configurado

2. Verifique se o usuário foi criado:
   - Acesse o Admin UI do PocketBase: `http://localhost:8090/_/`
   - Vá em Collections > users
   - Verifique se o usuário OAuth foi criado com o email do Google

## Troubleshooting

### Erro: "Popup bloqueado"
- O navegador bloqueou o popup
- Habilite popups para o site

### Erro: "redirect_uri_mismatch"
- A URI de redirecionamento não está configurada no Google Console
- Adicione a URL exata em "URIs de redirecionamento autorizados"

### Erro: "OAuth provider not configured"
- OAuth não foi configurado no PocketBase Admin UI
- Acesse `http://localhost:8090/_/` e configure o Google OAuth conforme seção 5
- Verifique se o Client ID e Secret estão corretos

### Usuário não é criado
- Verifique os logs do PocketBase
- Confirme que os escopos estão corretos no Google Console
- Verifique se o email do Google está disponível

## Segurança

1. **Proteja o Client Secret**:
   - Configure apenas via PocketBase Admin UI
   - Armazene de forma segura no banco de dados do PocketBase
   - Não exponha no frontend ou em arquivos de configuração

2. **Configure domínios autorizados**:
   - Limite as origens JavaScript autorizadas no Google Console
   - Configure URIs de redirecionamento específicas (login.html, registro.html)
   - Não use wildcards em produção

3. **Validações de segurança implementadas**:
   - **State validation**: Previne ataques CSRF
   - **PKCE (Code Verifier/Challenge)**: Previne interceptação de código
   - **HTTPS obrigatório em produção**: O Google requer HTTPS para OAuth
   - **Tokens armazenados de forma segura**: PocketBase gerencia tokens no httpOnly cookie

## Referências

- [PocketBase OAuth2 Documentation](https://pocketbase.io/docs/authentication/#oauth2-integration)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
