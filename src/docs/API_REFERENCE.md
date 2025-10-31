# API Reference - Services e Tipos

## Services

### AuthService (`services/auth.ts`)

```typescript
import { isAuthenticated, getCurrentUser, logout } from './services/auth';

// Verificar se está autenticado
const isAuth: boolean = isAuthenticated();

// Obter usuário atual
const user: User | null = getCurrentUser();

// Fazer logout
logout();
```

### SheetsService (`services/sheets.ts`)

```typescript
import { SheetsService } from './services/sheets';

// Gerenciar planilhas
const sheets = await SheetsService.listGoogleSheets();
await SheetsService.provisionSheet();

// Lançamentos
await SheetsService.appendEntry({ data, conta, valor, descricao, categoria });
const entries = await SheetsService.getSheetEntries('01', '2025');

// Relatórios
const summary = await SheetsService.getFinancialSummary('01', '2025');
```

### GoogleOAuthService (`services/google-oauth.ts`)

```typescript
import { GoogleOAuthService } from './services/google-oauth';

// Iniciar OAuth
await GoogleOAuthService.startAuthFlow(userId);
```

## Tipos TypeScript

### User (`types/index.ts`)
```typescript
interface User extends RecordModel {
  email: string;
  username?: string;
  verified?: boolean;
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
}
```

### SheetEntry
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

## Endpoints PocketBase

Definidos em `config/env.ts` no objeto `API_ENDPOINTS`:

- OAuth: `googleOAuthCallback`, `googleRefreshToken`
- Planilhas: `listGoogleSheets`, `provisionSheet`, `saveSheetId`
- Lançamentos: `appendEntry`, `editSheetEntry`, `deleteSheetEntry`, `getSheetEntries`
- Relatórios: `getFinancialSummary`, `getAvailableMonths`, `getSheetCategories`
