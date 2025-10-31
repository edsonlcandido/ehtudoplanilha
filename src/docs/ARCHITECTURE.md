# Arquitetura do Frontend (src/)

## Estrutura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   └── user-menu.ts
├── config/             # Configurações
│   └── env.ts
├── css/                # Estilos
│   ├── base/
│   ├── components/
│   ├── layout/
│   └── pages/
├── dashboard/          # Área autenticada
│   ├── configuracao.html
│   ├── configuracao.ts
│   ├── lancamentos.html
│   └── lancamentos.ts
├── services/           # Lógica de negócio
│   ├── auth.ts
│   ├── google-oauth.ts
│   └── sheets.ts
├── types/              # Tipos TypeScript
│   └── index.ts
├── index.html          # Landing page
├── login.html          # Autenticação
├── registro.html       # Cadastro
└── main.ts            # Inicialização PocketBase
```

## Camadas da Aplicação

### Services (Lógica de Negócio)
- `auth.ts`: Autenticação e gestão de usuário
- `sheets.ts`: Integração com Google Sheets
- `google-oauth.ts`: Fluxo OAuth 2.0

### Components (UI Reutilizável)
- `user-menu.ts`: Menu do usuário autenticado

### Types (Tipagem)
- `index.ts`: Interfaces User, GoogleInfo, etc.

### Config
- `env.ts`: URLs da API e endpoints do PocketBase
