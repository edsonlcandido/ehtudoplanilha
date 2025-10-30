# Serviços Disponíveis - API Reference

Este documento lista todos os serviços e endpoints disponíveis na aplicação.

## 📦 Serviços TypeScript

### 1. **AuthService** (`services/auth.ts`)

Gerenciamento de autenticação de usuários.

#### Funções Disponíveis

```typescript
import {
  isAuthenticated,
  getCurrentUser,
  logout,
  logoutAndReload,
  redirectToLogin,
  redirectToDashboard,
  onAuthChange
} from './services/auth';

// Verificar autenticação
const isAuth: boolean = isAuthenticated();

// Obter usuário atual
const user: User | null = getCurrentUser();

// Fazer logout
logout();

// Logout com reload
logoutAndReload();

// Redirecionar para login
redirectToLogin();

// Redirecionar para dashboard
redirectToDashboard();

// Observar mudanças de autenticação
onAuthChange((isAuth: boolean) => {
  console.log('Autenticação mudou:', isAuth);
});
```

---

### 2. **SheetsService** (`services/sheets.ts`)

Integração completa com Google Sheets API via hooks do PocketBase.

#### Configuração e Status

```typescript
import { SheetsService } from './services/sheets';

// Verificar se tem refresh token
const hasToken = await SheetsService.checkRefreshToken();

// Obter status completo de configuração
const status = await SheetsService.getConfigStatus();
// Retorna: { hasRefreshToken, hasSheetId, sheetId?, sheetName? }

// Obter planilha atual
const sheet = await SheetsService.getCurrentSheet();
```

#### Gerenciamento de Planilhas

```typescript
// Listar planilhas do usuário
const sheets = await SheetsService.listGoogleSheets();
// Retorna: GoogleSheet[] { id, name, modifiedTime?, webViewLink? }

// Salvar planilha selecionada
await SheetsService.saveSheetId('SHEET_ID', 'Nome da Planilha');

// Provisionar planilha do template
const { sheetId, sheetName } = await SheetsService.provisionSheet();

// Limpar conteúdo da planilha
await SheetsService.clearSheetContent();

// Deletar configuração da planilha
await SheetsService.deleteSheetConfig();
```

#### Operações com Lançamentos

```typescript
// Adicionar lançamento
await SheetsService.appendEntry({
  data: '2025-01-15',
  conta: 'Cartão Crédito',
  valor: -150.50,
  descricao: 'Supermercado',
  categoria: 'Alimentação',
  tipo: 'Despesa'
});

// Editar lançamento
await SheetsService.editEntry(rowIndex, {
  valor: -200.00,
  descricao: 'Supermercado + Farmácia'
});

// Deletar lançamento
await SheetsService.deleteEntry(rowIndex);

// Obter lançamentos do mês
const entries = await SheetsService.getSheetEntries('01', '2025');
// Retorna: SheetEntry[]
```

#### Relatórios e Análises

```typescript
// Resumo financeiro do mês
const summary = await SheetsService.getFinancialSummary('01', '2025');
// Retorna: { totalReceitas, totalDespesas, saldo, porCategoria[] }

// Meses disponíveis
const months = await SheetsService.getAvailableMonths();
// Retorna: string[] (ex: ['2025-01', '2025-02'])

// Categorias da planilha
const categories = await SheetsService.getSheetCategories();
// Retorna: string[]
```

#### Token Management

```typescript
// Renovar access token
await SheetsService.refreshToken();

// Revogar acesso ao Google
await SheetsService.revokeGoogleAccess();
```

---

### 3. **GoogleOAuthService** (`services/google-oauth.ts`)

Gerenciamento do fluxo OAuth 2.0 com Google.

#### Fluxo de Autorização

```typescript
import { GoogleOAuthService } from './services/google-oauth';
import { getCurrentUser } from './services/auth';

// Iniciar fluxo OAuth
const user = getCurrentUser();
await GoogleOAuthService.startAuthFlow(user!.id);
// Redireciona automaticamente para página de consentimento do Google

// Obter variáveis de ambiente OAuth
const envVars = await GoogleOAuthService.getEnvVariables();
// Retorna: { clientId, redirectUri, scopes }

// Construir URL de autorização manualmente
const authUrl = await GoogleOAuthService.buildAuthUrl(userId);
```

#### Manipulação de Callback

```typescript
// Verificar se há código de autorização na URL
const hasCode = GoogleOAuthService.hasAuthCode();

// Obter código de autorização
const code = GoogleOAuthService.getAuthCode();

// Obter state (userId)
const userId = GoogleOAuthService.getState();

// Verificar erro
if (GoogleOAuthService.hasAuthError()) {
  const error = GoogleOAuthService.getAuthError();
  console.error('Erro OAuth:', error);
}

// Manipular callback automaticamente
const result = GoogleOAuthService.handleCallback();
if (result.success) {
  console.log('Autorização concluída!');
} else {
  console.error('Erro:', result.error);
}

// Limpar parâmetros da URL
GoogleOAuthService.clearUrlParams();
```

---

## 🔗 Endpoints da API (config/env.ts)

Todos os endpoints estão centralizados em `API_ENDPOINTS`:

```typescript
import { API_ENDPOINTS } from './config/env';

// Google OAuth
API_ENDPOINTS.googleOAuthCallback      // GET  - Callback OAuth
API_ENDPOINTS.googleRefreshToken       // POST - Renovar token

// Google Endpoints Auxiliares
API_ENDPOINTS.envVariables             // GET  - Variáveis ambiente
API_ENDPOINTS.checkRefreshToken        // GET  - Verifica refresh_token
API_ENDPOINTS.listGoogleSheets         // GET  - Lista planilhas
API_ENDPOINTS.saveSheetId              // POST - Salva planilha
API_ENDPOINTS.getCurrentSheet          // GET  - Planilha atual
API_ENDPOINTS.clearSheetContent        // POST - Limpa planilha
API_ENDPOINTS.configStatus             // GET  - Status config
API_ENDPOINTS.deleteSheetConfig        // POST - Deleta config
API_ENDPOINTS.revokeGoogleAccess       // POST - Revoga acesso

// Planilhas
API_ENDPOINTS.provisionSheet           // POST - Copia template

// Lançamentos
API_ENDPOINTS.appendEntry              // POST   - Adiciona
API_ENDPOINTS.editSheetEntry           // PUT    - Edita
API_ENDPOINTS.deleteSheetEntry         // DELETE - Deleta
API_ENDPOINTS.getSheetEntries          // GET    - Lista

// Relatórios
API_ENDPOINTS.getFinancialSummary      // GET - Resumo
API_ENDPOINTS.getAvailableMonths       // GET - Meses
API_ENDPOINTS.getSheetCategories       // GET - Categorias
```

---

## 🎯 Interfaces TypeScript

### User (`types/index.ts`)
```typescript
interface User extends RecordModel {
  email: string;
  username?: string;
  verified?: boolean;
  name?: string;
  emailVisibility?: boolean;
  avatar?: string;
}
```

### GoogleInfo (`types/index.ts`)
```typescript
interface GoogleInfo extends RecordModel {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  sheet_id?: string;
  sheet_name?: string;
  last_success_append_at?: string;
}
```

### SheetEntry (`services/sheets.ts`)
```typescript
interface SheetEntry {
  rowIndex: number;
  data: string;
  conta: string;
  valor: number;
  descricao: string;
  categoria: string;
  tipo: string;
}
```

### FinancialSummary (`services/sheets.ts`)
```typescript
interface FinancialSummary {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  porCategoria: {
    categoria: string;
    total: number;
  }[];
}
```

### ConfigStatus (`services/sheets.ts`)
```typescript
interface ConfigStatus {
  hasRefreshToken: boolean;
  hasSheetId: boolean;
  sheetId?: string;
  sheetName?: string;
}
```

### GoogleSheet (`services/sheets.ts`)
```typescript
interface GoogleSheet {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}
```

---

## 📋 Exemplos de Uso Completos

### Fluxo de Configuração Inicial

```typescript
import { SheetsService } from './services/sheets';
import { GoogleOAuthService } from './services/google-oauth';
import { getCurrentUser } from './services/auth';

async function setupUserConfig() {
  // 1. Verificar status
  const status = await SheetsService.getConfigStatus();
  
  // 2. Se não tem refresh token, iniciar OAuth
  if (!status.hasRefreshToken) {
    const user = getCurrentUser();
    await GoogleOAuthService.startAuthFlow(user!.id);
    return; // Vai redirecionar
  }
  
  // 3. Se não tem planilha, provisionar
  if (!status.hasSheetId) {
    const { sheetId, sheetName } = await SheetsService.provisionSheet();
    console.log('Planilha criada:', sheetName);
  }
  
  // 4. Configuração completa!
  console.log('Usuário configurado!');
}
```

### Adicionar Lançamento Completo

```typescript
import { SheetsService } from './services/sheets';
import { isAuthenticated } from './services/auth';

async function addNewEntry(formData: any) {
  // 1. Verificar autenticação
  if (!isAuthenticated()) {
    throw new Error('Usuário não autenticado');
  }
  
  // 2. Verificar configuração
  const status = await SheetsService.getConfigStatus();
  if (!status.hasSheetId) {
    throw new Error('Planilha não configurada');
  }
  
  // 3. Adicionar lançamento
  try {
    await SheetsService.appendEntry({
      data: formData.data,
      conta: formData.conta,
      valor: parseFloat(formData.valor),
      descricao: formData.descricao,
      categoria: formData.categoria,
      tipo: formData.tipo
    });
    
    console.log('Lançamento adicionado com sucesso!');
  } catch (error) {
    // Se erro 401, tentar renovar token
    if (error.status === 401) {
      await SheetsService.refreshToken();
      // Tentar novamente
      await SheetsService.appendEntry(formData);
    } else {
      throw error;
    }
  }
}
```

### Dashboard com Resumo

```typescript
import { SheetsService } from './services/sheets';

async function loadDashboard(month: string, year: string) {
  const [summary, entries, categories] = await Promise.all([
    SheetsService.getFinancialSummary(month, year),
    SheetsService.getSheetEntries(month, year),
    SheetsService.getSheetCategories()
  ]);
  
  return { summary, entries, categories };
}
```

---

## 🔄 Tratamento de Erros

Todos os serviços fazem `console.error` automaticamente, mas você pode capturar erros:

```typescript
try {
  await SheetsService.appendEntry(data);
} catch (error) {
  if (error.status === 401) {
    // Token expirado
    await SheetsService.refreshToken();
  } else if (error.status === 404) {
    // Planilha não encontrada
    console.error('Configure uma planilha primeiro');
  } else {
    // Outro erro
    console.error('Erro ao adicionar:', error.message);
  }
}
```

---

## 🚀 Uso Direto do PocketBase

Se precisar fazer chamadas customizadas:

```typescript
import { pb } from './main';
import { API_ENDPOINTS } from './config/env';

// GET request
const response = await pb.send(API_ENDPOINTS.configStatus, {
  method: 'GET'
});

// POST request
const response = await pb.send(API_ENDPOINTS.appendEntry, {
  method: 'POST',
  body: { /* dados */ }
});

// PUT request
const response = await pb.send(API_ENDPOINTS.editSheetEntry, {
  method: 'PUT',
  body: { /* dados */ }
});

// DELETE request
const response = await pb.send(API_ENDPOINTS.deleteSheetEntry, {
  method: 'DELETE',
  body: { rowIndex: 5 }
});
```

---

**Documentação atualizada com todos os 19 endpoints dos hooks do PocketBase!** 🎉
