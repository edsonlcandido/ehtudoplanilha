# Estrutura do Projeto - Diagrama

## 📊 Arquitetura Visual

```
┌─────────────────────────────────────────────────────────┐
│                      index.html                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  <script type="module" src="/main.ts">          │  │
│  │  <script type="module" src="/index.ts">         │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ↓                             ↓
    ┌───────────────┐            ┌────────────────┐
    │   main.ts     │            │   index.ts     │
    │ ============= │            │ ============== │
    │ • Importa     │            │ • Importa      │
    │   config/env  │            │   ./main       │
    │ • Cria pb     │            │ • Importa      │
    │ • Exporta pb  │            │   components   │
    │ • window.pb   │            │ • Inicializa   │
    └───────────────┘            │   menu         │
            │                     └────────────────┘
            │                              │
            ↓                              ↓
    ┌───────────────┐            ┌────────────────┐
    │  config/env   │            │ components/    │
    │ ============= │            │   user-menu    │
    │ • Detecta     │            │ ============== │
    │   ambiente    │            │ • Renderiza    │
    │ • Define URL  │            │   menu         │
    │   PocketBase  │            │ • Usa          │
    │ • Endpoints   │            │   services/    │
    │   API         │            │   auth         │
    └───────────────┘            └────────────────┘
                                          │
                                          ↓
                                 ┌────────────────┐
                                 │ services/auth  │
                                 │ ============== │
                                 │ • isAuth()     │
                                 │ • getUser()    │
                                 │ • logout()     │
                                 │ • onAuthChange │
                                 └────────────────┘
                                          │
                                          ↓
                                 ┌────────────────┐
                                 │   types/       │
                                 │ ============== │
                                 │ • User         │
                                 │ • GoogleInfo   │
                                 │ • PocketBase   │
                                 └────────────────┘
```

## 🔄 Fluxo de Dados

### Inicialização (Dev)
```
1. Browser carrega index.html
   ↓
2. main.ts executa
   ├─ config/env.ts detecta: isDevelopment = true
   ├─ Define pocketbaseUrl = 'http://localhost:8090'
   └─ Cria instância: new PocketBase('http://localhost:8090')
   ↓
3. index.ts executa
   ├─ Importa pb de main.ts
   ├─ Chama initUserMenu()
   └─ userMenu verifica pb.authStore
   ↓
4. Página renderizada com menu correto
```

### Inicialização (Prod)
```
1. Browser carrega index.html
   ↓
2. main.ts executa
   ├─ config/env.ts detecta: isDevelopment = false
   ├─ Define pocketbaseUrl = window.location.origin
   └─ Cria instância: new PocketBase(window.location.origin)
   ↓
3. index.ts executa (mesmo fluxo)
```

## 🎯 Responsabilidades

### Camada de Configuração
```
config/env.ts
└─ Responsabilidade: Ambiente e URLs
   ├─ ✅ Detectar dev/prod
   ├─ ✅ Definir URL do PocketBase
   └─ ✅ Centralizar endpoints
```

### Camada de Infraestrutura
```
main.ts
└─ Responsabilidade: Setup inicial
   ├─ ✅ Criar instância PocketBase
   ├─ ✅ Exportar para outros módulos
   └─ ✅ Disponibilizar globalmente
```

### Camada de Serviços
```
services/auth.ts
└─ Responsabilidade: Lógica de negócio
   ├─ ✅ Autenticação
   ├─ ✅ Gestão de usuário
   └─ ✅ Observers
```

### Camada de Componentes
```
components/user-menu.ts
└─ Responsabilidade: UI
   ├─ ✅ Renderização do menu
   ├─ ✅ Event handlers
   └─ ✅ Segurança (XSS)
```

### Camada de Apresentação
```
index.ts
└─ Responsabilidade: Orquestração
   ├─ ✅ Importar dependências
   ├─ ✅ Inicializar componentes
   └─ ✅ DOM ready handling
```

## 📦 Dependências entre Módulos

```
types/index.ts
   ↑
   │ (importa tipos)
   │
services/auth.ts
   ↑ (usa pb)        ↑ (importa tipos)
   │                 │
   ├─────────────────┤
   │                 │
main.ts         components/user-menu.ts
   ↑ (importa pb)    ↑ (usa auth service)
   │                 │
   ├─────────────────┤
   │                 │
   └─────index.ts────┘
          ↑
          │
     index.html
```

## 🔐 Isolamento e Reutilização

### ✅ Módulos Reutilizáveis
```typescript
// Em qualquer arquivo novo:

// 1. Usar PocketBase
import { pb } from './main';

// 2. Usar autenticação
import { isAuthenticated, getCurrentUser } from './services/auth';

// 3. Usar configuração
import { config, API_ENDPOINTS } from './config/env';

// 4. Usar tipos
import type { User, GoogleInfo } from './types';

// 5. Usar componentes
import { initUserMenu } from './components/user-menu';
```

## 🧪 Testabilidade

### Funções Puras (Fácil de Testar)
```typescript
// services/auth.ts
export function isAuthenticated(): boolean {
  return pb.authStore.isValid && pb.authStore.model !== null;
}

// Teste:
// Mock pb.authStore → teste retorno true/false
```

### Componentes Isolados
```typescript
// components/user-menu.ts
export function renderUserMenu(): void {
  // ...
}

// Teste:
// 1. Mock DOM (getElementById)
// 2. Mock auth service
// 3. Verificar innerHTML correto
```

## 🚀 Escalabilidade

### Adicionar Nova Feature
```
1. Criar service (se necessário)
   src/services/sheets.ts
   
2. Criar component (se necessário)
   src/components/entry-form.ts
   
3. Criar página
   src/lancamentos.html
   src/lancamentos.ts
   
4. Atualizar vite.config.ts
   input: { lancamentos: 'lancamentos.html' }
```

### Manter Consistência
```
✅ Sempre importar './main' primeiro
✅ Usar services ao invés de acessar pb diretamente
✅ Usar API_ENDPOINTS do config
✅ Tipar com interfaces de types/
✅ Log com config.isDevelopment
```

## 📚 Patterns Aplicados

| Pattern | Onde | Benefício |
|---------|------|-----------|
| **Singleton** | main.ts (pb) | Uma instância PB global |
| **Service Layer** | services/ | Lógica isolada |
| **Component** | components/ | UI reutilizável |
| **Configuration** | config/env.ts | Centralização |
| **Observer** | onAuthChange() | Reatividade |
| **Factory** | config (cria URL) | Flexibilidade |
| **Module** | ES Modules | Isolamento |

---

Esta estrutura garante:
- ✅ **Separação clara** de responsabilidades
- ✅ **Código reutilizável** e modular
- ✅ **Fácil manutenção** e debug
- ✅ **Testável** com mocks
- ✅ **Escalável** para novos recursos
- ✅ **Type-safe** com TypeScript
