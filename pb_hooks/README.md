# Google OAuth Integration - PocketBase Hooks

Este conjunto de arquivos implementa a integração com Google OAuth para obter tokens de acesso ao Google Sheets API usando uma estrutura modular.

## Arquivos Criados

### Backend Hooks (pb_hooks)

#### 1. `pb_hooks/google-oauth-callback.pb.js`
Hook para o callback do Google OAuth:
- **Endpoint GET `/google-oauth-callback`**: Recebe o código de autorização do Google e troca por tokens
- Provisiona planilha template automaticamente após autorização

#### 2. `pb_hooks/google-refresh-token.pb.js`
Hook para renovação de tokens:
- **Endpoint POST `/google-refresh-token`**: Renova o access_token usando o refresh_token

#### 3. `pb_hooks/google-endpoints.pb.js`
Endpoints auxiliares para integração Google:
- **Endpoint GET `/env-variables`**: Retorna variáveis de ambiente OAuth
- **Endpoint GET `/check-refresh-token`**: Verifica se usuário possui refresh token
- **Endpoint GET `/list-google-sheets`**: Lista planilhas do usuário
- **Endpoint POST `/save-sheet-id`**: Salva planilha selecionada

#### 4. `pb_hooks/provision-sheet.pb.js`
Hook para provisionamento de planilhas:
- **Endpoint POST `/provision-sheet`**: Copia planilha template para o usuário

#### 5. `pb_hooks/get-sheet-categories.pb.js`
Hook para buscar categorias da planilha:
- **Endpoint GET `/get-sheet-categories`**: Retorna lista de nomes de categorias da aba CATEGORIAS (coluna A)
- Mantido para retrocompatibilidade com PWA

#### 6. `pb_hooks/get-sheet-categories-complete.pb.js`
Hook para buscar categorias completas da planilha:
- **Endpoint GET `/get-sheet-categories-complete`**: Retorna categorias completas (categoria, tipo, orcamento)
- Lê colunas A (categoria), B (tipo) e C (orcamento) da aba CATEGORIAS
- Formato de resposta:
  ```json
  {
    "success": true,
    "categoriesComplete": [
      {"categoria": "Transporte", "tipo": "DESPESA", "orcamento": 500},
      {"categoria": "Salário", "tipo": "RECEITA", "orcamento": 0}
    ]
  }
  ```
- Filtra apenas categorias do tipo DESPESA com orçamento > 0 para análise de orçamento
- Implementa refresh token automático igual aos outros endpoints

### Frontend Modules (pb_public/js)

#### 1. `pb_public/js/google/oauth-service.js`
Módulo ES6 para serviços OAuth:
- Gerencia fluxo de autenticação OAuth
- Verifica status de refresh token
- Inicia fluxo de autorização

#### 2. `pb_public/js/google/sheets-api.js`
Módulo ES6 para API Sheets:
- Lista planilhas do usuário
- Salva planilha selecionada
- Provisiona templates
- Formata dados para exibição

#### 3. `pb_public/js/config/api-config.js`
Configurações da API e OAuth:
- URLs base da aplicação
- Configurações OAuth do Google
- Endpoints da API

### Páginas Atualizadas

#### 1. `pb_public/oauth-test.html`
Página de teste refatorada para usar módulos ES6

#### 2. `pb_public/dashboard/configuracao.html`
Página de configuração usando módulos ES6 para gerenciamento de planilhas

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

### JavaScript Example (usando módulos ES6)
```javascript
// Importar serviços
import googleOAuthService from './js/google/oauth-service.js';
import googleSheetsService from './js/google/sheets-api.js';

// Inicializar serviços
googleOAuthService.init(pb);
googleSheetsService.init(pb);

// Iniciar OAuth
async function startGoogleAuth() {
  try {
    await googleOAuthService.startOAuthFlow();
  } catch (error) {
    console.error('Erro OAuth:', error);
  }
}

// Listar planilhas
async function listSheets() {
  try {
    const data = await googleSheetsService.listUserSheets();
    console.log('Planilhas:', data.sheets);
  } catch (error) {
    console.error('Erro ao listar planilhas:', error);
  }
}
```

## Vantagens da Estrutura Modular

1. **Separação de responsabilidades**: Cada arquivo tem uma função específica
2. **Manutenibilidade**: Mais fácil de entender e modificar
3. **Reutilização**: Módulos podem ser importados em diferentes páginas
4. **Testabilidade**: Cada módulo pode ser testado independentemente
5. **Escalabilidade**: Fácil adicionar novos módulos ou funcionalidades

## Próximos Passos

1. **Testes automatizados**: Implementar testes unitários para os módulos
2. **Validação de tipos**: Adicionar TypeScript para maior segurança
3. **Cache de tokens**: Implementar cache local para melhor performance
4. **Error handling**: Melhorar tratamento de erros com retry automático
5. **Documentação**: Expandir JSDoc nos módulos