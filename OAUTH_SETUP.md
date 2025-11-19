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
   - **Google+ API** (para autenticação OAuth)
   - **Google Sheets API** (se ainda não estiver habilitada)
   - **Google Drive API** (se ainda não estiver habilitada)

### 3. Configurar Tela de Consentimento OAuth

1. No menu lateral, vá em **APIs e Serviços** > **Tela de consentimento OAuth**
2. Selecione o tipo de usuário:
   - **Interno**: Somente para usuários da sua organização Google Workspace
   - **Externo**: Para qualquer usuário com conta Google (recomendado para SaaS público)
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
   - **URIs de redirecionamento autorizados**:
     - Desenvolvimento: `http://localhost:8090/api/oauth2-redirect`
     - Produção: `https://seudominio.com/api/oauth2-redirect`
5. Clique em **CRIAR**
6. Anote o **ID do cliente** e o **Segredo do cliente**

### 5. Configurar Variáveis de Ambiente

#### Desenvolvimento Local

1. Crie ou edite o arquivo `.env` na raiz do projeto:

```bash
# Google OAuth para Autenticação (Login/Registro)
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret

# Google OAuth para Google Sheets API (já existente)
GOOGLE_REDIRECT_URI=http://localhost:8090/google-oauth-callback
```

2. Execute o PocketBase com o script que carrega as variáveis:

```bash
./iniciar-pb.sh
```

#### Produção

Configure as variáveis de ambiente no seu servidor/container:

```bash
export GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="seu-client-secret"
export GOOGLE_REDIRECT_URI="https://seudominio.com/google-oauth-callback"
```

## Como Funciona

### Fluxo de Autenticação

1. **Usuário clica em "Entrar com Google"** na página de login ou registro
2. **Frontend inicia o fluxo OAuth**:
   - Chama `AuthOAuthService.loginWithGoogle()`
   - PocketBase abre popup com a página de consentimento do Google
3. **Usuário autoriza o aplicativo** no Google
4. **Google redireciona para `/api/oauth2-redirect`** com código de autorização
5. **PocketBase processa automaticamente via realtime connection**:
   - Troca o código por tokens de acesso
   - Cria usuário se não existir (registro automático)
   - Autentica o usuário e fecha o popup
6. **Frontend recebe resposta** e redireciona para o dashboard

### Diferença entre OAuth para Auth e OAuth para Sheets

O sistema usa OAuth do Google para duas finalidades diferentes:

1. **OAuth para Autenticação (NOVO)**:
   - Permite login/registro usando conta Google
   - Gerenciado nativamente pelo PocketBase
   - Usa credenciais `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
   - Fluxo: `login.html` → Google → PocketBase → `dashboard`

2. **OAuth para Google Sheets (EXISTENTE)**:
   - Permite acesso à planilha do usuário no Google Sheets
   - Gerenciado por hooks customizados em `pb_hooks/`
   - Usa mesmas credenciais mas com scopes diferentes
   - Fluxo: `configuracao.html` → Google → `/google-oauth-callback` → salva tokens

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
- Variáveis de ambiente não foram carregadas
- Verifique se o `.env` existe e está correto
- Reinicie o PocketBase com `./iniciar-pb.sh`

### Usuário não é criado
- Verifique os logs do PocketBase
- Confirme que os escopos estão corretos no Google Console
- Verifique se o email do Google está disponível

## Segurança

1. **Nunca commite credenciais**:
   - O arquivo `.env` está no `.gitignore`
   - Use `.env.example` como template

2. **Proteja o Client Secret**:
   - Armazene de forma segura em produção
   - Use variáveis de ambiente do servidor
   - Não exponha no frontend

3. **Configure domínios autorizados**:
   - Limite as origens JavaScript autorizadas
   - Configure URIs de redirecionamento específicas
   - Não use wildcards em produção

## Referências

- [PocketBase OAuth2 Documentation](https://pocketbase.io/docs/authentication/#oauth2-integration)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
