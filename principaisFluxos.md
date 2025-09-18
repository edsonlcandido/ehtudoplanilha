# Organização do Código em Fluxos

Para facilitar o desenvolvimento e manutenção, o código está organizado nos seguintes fluxos principais:

## Fluxos Identificados
1. Fluxo de Autenticação e Gestão de Usuários
- Login/Logout
- Registro de novos usuários
- Proteção de rotas do dashboard
- Menu dinâmico baseado no estado de autenticação

2. Fluxo de Integração com Google OAuth
- Iniciar autorização Google
- Tratamento de callbacks OAuth
- Verificação e renovação de tokens
- Redirecionamento após autenticação

3. Fluxo de Gerenciamento de Planilhas
- Listar planilhas do usuário
- Seleção de planilha existente
- Provisionamento (cópia) da planilha template
- Salvar configuração de planilha para o usuário

4. Fluxo de Feedback e UI
- Sistema de notificações (sucesso, erro, aviso)
- Gerenciamento de modais
- Estados de interface (carregando, erro, etc.)
- Utilidades UI (formatação, escape HTML)

5. Fluxo de Configuração
- Configuração da API
- Detecção de ambiente (dev/prod)
- Constantes globais da aplicação

6. Fluxo de Lançamentos Financeiros
- Adicionar entradas na planilha
- Formulário de lançamento
- Validação de dados

## Estrutura de Arquivos Proposta

pb_public/
├── js/
│   ├── auth/
│   │   ├── auth-service.js
│   │   ├── auth-ui.js
│   │   └── auth-routes.js
│   ├── google/
│   │   ├── oauth-service.js
│   │   └── sheets-api.js
│   ├── sheets/
│   │   ├── sheets-manager.js
│   │   ├── sheets-ui.js
│   │   └── sheets-provisioning.js
│   ├── ui/
│   │   ├── notifications.js
│   │   ├── modals.js
│   │   └── utils.js
│   ├── config/
│   │   ├── api-config.js
│   │   └── constants.js
│   └── financial/
│       ├── expense-form.js
│       └── expense-service.js