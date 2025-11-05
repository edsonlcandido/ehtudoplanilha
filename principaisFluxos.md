# Organização do Código em Fluxos

Para facilitar o desenvolvimento e manutenção, o código está organizado nos seguintes fluxos principais:

## Fluxos Identificados

1. **Fluxo de Autenticação e Gestão de Usuários**
   - Login/Logout (`src/login.ts`)
   - Registro de novos usuários (`src/registro.ts`)
   - Proteção de rotas do dashboard (`src/dashboard/dashboard.ts`)
   - Menu dinâmico baseado no estado de autenticação (`src/components/user-menu.ts`)
   - Serviço de autenticação (`src/services/auth.ts`)

2. **Fluxo de Integração com Google OAuth**
   - Iniciar autorização Google (`src/services/google-oauth.ts`)
   - Tratamento de callbacks OAuth (PocketBase hook)
   - Verificação e renovação de tokens (`src/services/google-oauth.ts`)
   - Redirecionamento após autenticação (`src/index.ts`)

3. **Fluxo de Gerenciamento de Planilhas**
   - Listar planilhas do usuário (`src/dashboard/configuracao.ts`)
   - Seleção de planilha existente
   - Criação de uma planilha nova
   - Salvar configuração de planilha para o usuário (`src/services/sheets.ts`)
   - Interface de configuração (`src/dashboard/configuracao.html`)

4. **Fluxo de Lançamentos Financeiros**
   - Adicionar entradas na planilha (`src/dashboard/lancamentos.ts`)
   - Formulário de lançamento (`src/components/entry-modal.ts`)
   - Validação de dados (`src/dashboard/lancamentos.html`)
   - Serviço de planilhas (`src/services/sheets.ts`)

5. **Fluxo de Feedback e UI**
   - Sistema de notificações (integrado em componentes)
   - Gerenciamento de modais (`src/components/entry-modal.ts`)
   - Estados de interface (carregando, erro, sucesso)
   - Utilidades de data (`src/utils/date-helpers.ts`)
   - Estilos de componentes (`src/css/components/`)

## Estrutura de Arquivos Atual

```
src/
├── index.html                  # Landing page
├── index.ts                    # Ponto de entrada / routing
├── main.ts                     # Inicialização geral
├── login.html                  # Página de login
├── login.ts                    # Lógica de login
├── registro.html               # Página de registro
├── registro.ts                 # Lógica de registro
├── privacidade.html            # Página de privacidade
├── termos.html                 # Página de termos
├── prints.html                 # Página de prints/showcase
│
├── dashboard/
│   ├── index.html              # Dashboard principal
│   ├── dashboard.ts            # Controlador do dashboard
│   ├── lancamentos.html        # Página de lançamentos
│   ├── lancamentos.ts          # Lógica de lançamentos
│   ├── configuracao.html       # Página de configuração
│   ├── configuracao.ts         # Lógica de configuração
│   └── css/
│       ├── style.css
│       ├── financial-cards.css
│       ├── modal-entry.css
│       ├── edit-entry-form.css
│       └── details.css
│
├── services/                   # Camada de serviços/API
│   ├── auth.ts                 # Autenticação
│   ├── google-oauth.ts         # Integração Google OAuth
│   └── sheets.ts               # Gerenciamento de planilhas
│
├── components/                 # Componentes reutilizáveis
│   ├── entry-modal.ts          # Modal de lançamento
│   └── user-menu.ts            # Menu de usuário
│
├── types/
│   └── index.ts                # Tipos TypeScript globais
│
├── utils/
│   └── date-helpers.ts         # Funções auxiliares de data
│
├── config/
│   ├── env.ts                  # Configurações de ambiente
│   └── constants.ts            # Constantes globais
│
├── css/
│   ├── main.css                # Estilos globais
│   ├── auth.css                # Estilos de autenticação
│   ├── dashboard.css           # Estilos do dashboard
│   ├── responsive-tables.css   # Responsivo
│   ├── picnic.css              # Framework Picnic CSS
│   │
│   ├── base/
│   │   ├── reset.css
│   │   ├── typography.css
│   │   └── variables.css
│   │
│   ├── components/
│   │   ├── buttons.css
│   │   ├── cards.css
│   │   ├── forms.css
│   │   ├── loading.css
│   │   ├── modals.css
│   │   ├── tables.css
│   │   └── user-menu.css
│   │
│   ├── layout/
│   │   ├── containers.css
│   │   ├── footer.css
│   │   ├── navigation.css
│   │   └── sidebar.css
│   │
│   └── pages/
│       ├── auth.css
│       ├── landing.css
│       ├── configuracao.css
│       └── lancamentos.css
│
└── docs/
    ├── CONFIGURACAO-DOCUMENTATION.md
    ├── ENTRY-MODAL-DOCUMENTATION.md
    └── JS_ORIGINAL_RESUMO.md
```

## Mapeamento de Dependências

- **Landing (`index.ts`)** → verifica auth → redireciona para login ou dashboard
- **Login/Registro** → `auth.ts` → PocketBase backend
- **Dashboard** → carrega `user-menu.ts` + página específica
- **Configuração** → `sheets.ts` para gerenciar planilhas
- **Lançamentos** → `entry-modal.ts` + `sheets.ts` para adicionar entradas
- **Google OAuth** → `google-oauth.ts` → tokens salvos em backend

## Build & Deploy

- **Ferramenta**: Vite
- **Configuração**: `vite.config.ts`
- **TypeScript**: `tsconfig.json`
- **Saída**: Compilado para `pb_public/` (PocketBase static files)