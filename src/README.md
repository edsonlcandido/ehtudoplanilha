# Projeto Vite + TypeScript - Planilha Eh Tudo

Este diretório contém a versão refatorada da página inicial usando **Vite** e **TypeScript** com **boas práticas de arquitetura**.

## 📁 Estrutura do Projeto

```
src/
├── index.html              # Página principal
├── index.ts                # Entry point da página index
├── main.ts                 # Inicialização do PocketBase
├── vite-env.d.ts           # Tipos do Vite
│
├── config/
│   └── env.ts              # Configuração de ambiente (dev/prod)
│
├── services/
│   ├── auth.ts             # Serviço de autenticação
│   ├── sheets.ts           # ⭐ Serviço Google Sheets API
│   └── google-oauth.ts     # ⭐ Serviço Google OAuth 2.0
│
├── components/
│   └── user-menu.ts        # Componente de menu do usuário
│
├── types/
│   └── index.ts            # Definições de tipos TypeScript
│
├── css/
│   ├── picnic.css          # Framework CSS Picnic
│   └── style.css           # Estilos customizados
│
├── package.json            # Dependências e scripts
├── tsconfig.json           # Configuração TypeScript
├── 📄 vite.config.ts          # Config Vite
│
└── 📚 Documentação
    ├── README.md              # Este arquivo (guia principal)
    ├── ARCHITECTURE.md        # Diagrama de arquitetura
    ├── CONFIG_GUIDE.md        # Guia de configuração automática
    ├── API_REFERENCE.md       # ⭐ Referência completa da API
    └── USAGE_EXAMPLES.ts      # Exemplos de uso práticos
```

## 🏗️ Arquitetura e Boas Práticas

### **Separação de Responsabilidades**

#### `config/env.ts` - Configuração de Ambiente
- ✅ Detecta automaticamente ambiente (dev/prod)
- ✅ Define URL do PocketBase baseada no ambiente
  - **Dev**: `http://localhost:8090`
  - **Prod**: mesma origem (window.location.origin)
- ✅ Centraliza endpoints da API customizada
- ✅ Usa `import.meta.env.DEV` do Vite

#### `main.ts` - Inicialização
- ✅ Único ponto de inicialização do PocketBase
- ✅ Configuração automática baseada no ambiente
- ✅ Exporta instância tipada
- ✅ Torna disponível globalmente (`window.pb`)

#### `services/auth.ts` - Lógica de Autenticação
- ✅ Funções puras e testáveis
- ✅ `isAuthenticated()` - Verifica autenticação
- ✅ `getCurrentUser()` - Retorna usuário atual
- ✅ `logout()` - Limpa autenticação
- ✅ `logoutAndReload()` - Logout com reload
- ✅ `onAuthChange()` - Observer de mudanças

#### `services/sheets.ts` - ⭐ Integração Google Sheets
- ✅ Classe `SheetsService` com métodos estáticos
- ✅ CRUD completo de lançamentos
- ✅ Relatórios e resumos financeiros
- ✅ Gerenciamento de planilhas
- ✅ Renovação automática de tokens
- ✅ 20+ métodos tipados

#### `services/google-oauth.ts` - ⭐ OAuth 2.0 Google
- ✅ Classe `GoogleOAuthService`
- ✅ Construção automática de URL de autorização
- ✅ Manipulação de callbacks
- ✅ Limpeza de parâmetros da URL
- ✅ Detecção de erros OAuth

#### `components/user-menu.ts` - Componente de Menu
- ✅ Renderização condicional baseada em auth
- ✅ Escape de HTML para prevenir XSS
- ✅ Event listeners gerenciados
- ✅ Separação clara entre menu autenticado/guest

#### `types/index.ts` - Tipagem
- ✅ Interfaces bem definidas
- ✅ Tipos reutilizáveis
- ✅ Estende tipos do PocketBase corretamente


### **Entry Point Limpo**

`index.ts` agora é apenas um orquestrador:
```typescript
import './main';                          // Inicializa PocketBase
import { initUserMenu } from './components/user-menu';
import { config } from './config/env';

function init(): void {
  if (config.isDevelopment) {
    console.log('[Index] Modo desenvolvimento');
  }
  initUserMenu();
}
```

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
cd src
npm install
```

### 2. Modo Desenvolvimento

```bash
npm run dev
```

**URL do PocketBase em dev**: `http://localhost:8090`  
**Frontend**: `http://localhost:5173` (porta padrão Vite)

### 3. Build para Produção

```bash
npm run build
```

Gera na pasta `dist/`:
- HTML estático
- JS compilado e minificado (com tree-shaking)
- CSS otimizado

**URL do PocketBase em prod**: mesma origem do deploy

### 4. Preview da Build

```bash
npm run preview
```

## 🔧 Configuração Automática de Ambiente

### Desenvolvimento
```typescript
// Detectado automaticamente quando:
// - import.meta.env.DEV === true
// - hostname === localhost/127.0.0.1
// - port === 5173/5500

const config = {
  isDevelopment: true,
  pocketbaseUrl: 'http://localhost:8090'
}
```

### Produção
```typescript
// Quando buildar com npm run build:
const config = {
  isDevelopment: false,
  pocketbaseUrl: window.location.origin  // mesma URL
}
```

## 📦 Endpoints Centralizados

Todos os **19 endpoints** dos hooks do PocketBase estão em `config/env.ts`:

```typescript
export const API_ENDPOINTS = {
  // Google OAuth (2 endpoints)
  googleOAuthCallback: '/google-oauth-callback',
  googleRefreshToken: '/google-refresh-token',
  
  // Google Auxiliares (9 endpoints)
  envVariables: '/env-variables',
  checkRefreshToken: '/check-refresh-token',
  listGoogleSheets: '/list-google-sheets',
  saveSheetId: '/save-sheet-id',
  getCurrentSheet: '/get-current-sheet',
  clearSheetContent: '/clear-sheet-content',
  configStatus: '/config-status',
  deleteSheetConfig: '/delete-sheet-config',
  revokeGoogleAccess: '/revoke-google-access',
  
  // Planilhas (1 endpoint)
  provisionSheet: '/provision-sheet',
  
  // Lançamentos (4 endpoints)
  appendEntry: '/append-entry',
  editSheetEntry: '/edit-sheet-entry',
  deleteSheetEntry: '/delete-sheet-entry',
  getSheetEntries: '/get-sheet-entries',
  
  // Relatórios (3 endpoints)
  getFinancialSummary: '/get-financial-summary',
  getAvailableMonths: '/get-available-months',
  getSheetCategories: '/get-sheet-categories',
}
```

### Uso dos Endpoints

```typescript
import { API_ENDPOINTS } from './config/env';
import { pb } from './main';

// Método direto
const response = await pb.send(API_ENDPOINTS.appendEntry, {
  method: 'POST',
  body: data
});

// Ou use os serviços (recomendado)
import { SheetsService } from './services/sheets';
await SheetsService.appendEntry(data);
```

## 🎯 Benefícios da Refatoração

✅ **Código organizado**: Cada arquivo tem uma responsabilidade clara  
✅ **Type Safety**: TypeScript previne erros em tempo de dev  
✅ **Testável**: Funções puras, fácil de mockar  
✅ **Manutenível**: Mudanças isoladas, fácil de encontrar código  
✅ **Escalável**: Adicionar features não bagunça estrutura  
✅ **Reusável**: Services e components podem ser importados  
✅ **Seguro**: Escape HTML, validação de tipos  

## 🔄 Deploy

### PocketBase (pb_public/)
```bash
npm run build
cp -r dist/* ../pb_public/
```

### Netlify/Vercel
```bash
# Build command
npm run build

# Publish directory
dist
```

## 🎨 Adicionar Nova Página

1. Crie `nova-pagina.html`
2. Crie `nova-pagina.ts`:
   ```typescript
   import './main';  // Sempre importar
   import { initUserMenu } from './components/user-menu';
   
   function init() {
     initUserMenu();
     // Lógica específica da página
   }
   
   // DOM ready
   if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', init);
   } else {
     init();
   }
   ```

3. Atualize `vite.config.ts`:
   ```typescript
   input: {
     main: resolve(__dirname, 'index.html'),
     novaPagina: resolve(__dirname, 'nova-pagina.html'),
   }
   ```

## 📚 Patterns Utilizados

- **Service Layer**: Lógica de negócio isolada
- **Component Pattern**: UI components reutilizáveis
- **Configuration Pattern**: Centralização de config
- **Observer Pattern**: `onAuthChange()`
- **Single Responsibility**: Um arquivo, uma responsabilidade
- **Dependency Injection**: Serviços recebem dependências

## 📄 Licença

Este projeto mantém a mesma licença do repositório principal.

```bash
npm run dev
```

Abre o servidor de desenvolvimento em `http://localhost:5500`

### 3. Build para Produção

```bash
npm run build
```

Gera os arquivos estáticos na pasta `dist/`:
- `index.html` - HTML estático
- `assets/main-[hash].js` - JavaScript compartilhado
- `assets/index-[hash].js` - JavaScript específico da página
- `assets/style-[hash].css` - CSS compilado

### 4. Preview da Build

```bash
npm run preview
```

Visualiza a build de produção localmente.

## 📝 Arquitetura

### `main.ts` - Código Compartilhado

- **ApiConfig**: Classe que gerencia configuração da API e URLs
- **PocketBase**: Instância global do cliente PocketBase
- Disponibiliza `window.pb` para compatibilidade com código legado

### `index.ts` - Lógica Específica da Página

- **renderUserMenu()**: Renderiza menu baseado no estado de autenticação
- **initIndexPage()**: Inicializa a página após o DOM carregar
- Gerencia logout do usuário

### `types/index.ts` - Tipagem TypeScript

- **User**: Interface para modelo de usuário
- **GoogleInfo**: Interface para dados do Google OAuth
- **GoogleOAuthConfig**: Configuração dos endpoints OAuth
- **IApiConfig**: Interface da classe ApiConfig
- **PocketBaseInstance**: Tipo para instância do PocketBase

## 🎯 Funcionalidades Mantidas

✅ Mesma aparência visual (Picnic CSS + styles customizados)  
✅ Menu dinâmico baseado em autenticação  
✅ Integração com PocketBase  
✅ Logout de usuário  
✅ Links para dashboard, login e registro  

## 🔧 Melhorias com TypeScript

- ✨ **Type Safety**: Tipos fortes para PocketBase, User, GoogleInfo
- 🐛 **Menos Erros**: Detecção de erros em tempo de desenvolvimento
- 📚 **IntelliSense**: Autocomplete e documentação inline
- 🔍 **Refactoring**: Refatoração segura com IDE
- 📖 **Documentação**: JSDoc comments para melhor entendimento

## 📦 Dependências

- **vite** (^6.0.5): Build tool e dev server
- **typescript** (^5.7.3): Compilador TypeScript
- **pocketbase** (^0.24.1): Cliente PocketBase
- **@types/node** (^22.10.2): Tipos Node.js para Vite config

## 🔄 Deploy

Os arquivos gerados na pasta `dist/` são **HTML estático + JS compilado**, prontos para deploy em:

- PocketBase `pb_public/` (substituindo arquivos atuais)
- Netlify, Vercel, GitHub Pages
- Qualquer servidor web estático

## 🎨 Customização

Para adicionar novas páginas:

1. Crie `nova-pagina.html` na raiz de `src/`
2. Crie `nova-pagina.ts` com a lógica específica
3. Atualize `vite.config.ts` com o novo entry point:

```typescript
input: {
  main: resolve(__dirname, 'index.html'),
  novaPagina: resolve(__dirname, 'nova-pagina.html'),
}
```

## 📄 Licença

Este projeto mantém a mesma licença do repositório principal.
