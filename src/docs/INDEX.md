# 📚 Documentação - Migração Vite + TypeScript

Bem-vindo à documentação do projeto migrado para Vite e TypeScript!

## 📖 Índice de Documentação

### 1. 🚀 Início Rápido
**[README.md](./README.md)** - Guia de introdução e setup inicial
- Visão geral do projeto
- Requisitos e instalação
- Como rodar em desenvolvimento
- Como fazer build para produção

### 2. 🏗️ Arquitetura
**[ARCHITECTURE.md](./ARCHITECTURE.md)** - Estrutura e padrões do projeto
- Diagrama de arquitetura
- Organização de pastas
- Padrões de design utilizados
- Fluxo de dados
- Camadas da aplicação (services, components, config)

### 3. ⚙️ Configuração
**[CONFIG_GUIDE.md](./CONFIG_GUIDE.md)** - Guia de configuração detalhado
- Configuração do Vite
- TypeScript config explicado
- Proxy de desenvolvimento
- Variáveis de ambiente
- Como funciona dev vs produção
- Troubleshooting de configuração

### 4. 📡 API Reference
**[API_REFERENCE.md](./API_REFERENCE.md)** - Referência completa da API
- **AuthService**: Funções de autenticação
- **SheetsService**: Integração com Google Sheets (20+ métodos)
- **GoogleOAuthService**: Fluxo OAuth 2.0
- Todos os endpoints do PocketBase (19 hooks)
- Exemplos de uso de cada método

### 5. 🔐 Login
**[LOGIN_GUIDE.md](./LOGIN_GUIDE.md)** - Guia da página de login
- Implementação completa do login
- Validação de formulário
- Tratamento de erros
- Estados de loading
- Redirecionamentos

### 6. � Registro
**[REGISTRO_GUIDE.md](./REGISTRO_GUIDE.md)** - Guia da página de registro
- Implementação completa do registro
- Validação de e-mail e senha
- Confirmação de senha
- Tratamento de erros específicos
- Redirecionamento após sucesso

### 7. �📄 Exemplo Completo
**[EXAMPLE_PAGE.md](./EXAMPLE_PAGE.md)** - Exemplo de página completa
- Página de lançamentos (lancamentos.html)
- Implementação passo a passo
- HTML + CSS + TypeScript
- Integração com serviços
- Boas práticas

### 7. 💻 Exemplos de Código
**[USAGE_EXAMPLES.ts](./USAGE_EXAMPLES.ts)** - Snippets de código reutilizáveis
- Exemplos práticos de uso
- Padrões de implementação
- Casos de uso comuns
- Código TypeScript comentado

---

## 🎯 Guia de Uso por Cenário

### Você está começando agora?
1. Leia o **[README.md](./README.md)** para setup inicial
2. Entenda a estrutura em **[ARCHITECTURE.md](./ARCHITECTURE.md)**
3. Configure o ambiente com **[CONFIG_GUIDE.md](./CONFIG_GUIDE.md)**

### Precisa implementar uma nova página?
1. Veja o exemplo completo em **[EXAMPLE_PAGE.md](./EXAMPLE_PAGE.md)**
2. Consulte a API em **[API_REFERENCE.md](./API_REFERENCE.md)**
3. Use snippets de **[USAGE_EXAMPLES.ts](./USAGE_EXAMPLES.ts)**

### Precisa integrar com Google Sheets?
1. Consulte **SheetsService** em **[API_REFERENCE.md](./API_REFERENCE.md)**
2. Veja exemplos em **[USAGE_EXAMPLES.ts](./USAGE_EXAMPLES.ts)**
3. Entenda o OAuth em **[API_REFERENCE.md](./API_REFERENCE.md#googleoauthservice)**

### Problemas de configuração?
1. Veja **[CONFIG_GUIDE.md](./CONFIG_GUIDE.md)** seção Troubleshooting
2. Verifique o proxy do Vite
3. Confira variáveis de ambiente

### Dúvidas sobre autenticação?
1. Leia **[LOGIN_GUIDE.md](./LOGIN_GUIDE.md)** para login
2. Leia **[REGISTRO_GUIDE.md](./REGISTRO_GUIDE.md)** para registro
3. Consulte **AuthService** em **[API_REFERENCE.md](./API_REFERENCE.md)**

---

## 🔧 Ordem Recomendada de Leitura

### Para Desenvolvedores Novos no Projeto
```
README.md → ARCHITECTURE.md → CONFIG_GUIDE.md → EXAMPLE_PAGE.md
```

### Para Implementar Nova Funcionalidade
```
ARCHITECTURE.md → API_REFERENCE.md → USAGE_EXAMPLES.ts → EXAMPLE_PAGE.md
```

### Para Resolver Problemas
```
CONFIG_GUIDE.md (Troubleshooting) → API_REFERENCE.md
```

---

## 📦 Estrutura de Arquivos

```
src/
├── docs/                          # 📚 Você está aqui!
│   ├── INDEX.md                   # Este arquivo
│   ├── README.md                  # 🚀 Início
│   ├── ARCHITECTURE.md            # 🏗️ Arquitetura
│   ├── CONFIG_GUIDE.md            # ⚙️ Configuração
│   ├── API_REFERENCE.md           # 📡 API
│   ├── LOGIN_GUIDE.md             # 🔐 Login
│   ├── REGISTRO_GUIDE.md          # 📝 Registro
│   ├── EXAMPLE_PAGE.md            # 📄 Exemplo
│   └── USAGE_EXAMPLES.ts          # 💻 Código
├── config/
│   ├── env.ts                     # Configuração de ambiente
│   └── api-config.js              # Config original (legado)
├── services/
│   ├── auth.ts                    # Autenticação
│   ├── sheets.ts                  # Google Sheets
│   └── google-oauth.ts            # OAuth 2.0
├── components/
│   └── user-menu.ts               # Menu do usuário
├── types/
│   └── index.ts                   # Tipos TypeScript
├── css/
│   └── auth.css                   # Estilos de autenticação
├── main.ts                        # Inicialização global
├── index.ts                       # Lógica da index page
├── login.ts                       # Lógica da login page
├── registro.ts                    # Lógica da registro page
├── index.html                     # Página inicial
├── login.html                     # Página de login
├── registro.html                  # Página de registro
├── vite.config.ts                 # Config do Vite
├── tsconfig.json                  # Config do TypeScript
└── package.json                   # Dependências
```

---

## 🎓 Recursos Adicionais

### Tecnologias Utilizadas
- [Vite](https://vitejs.dev/) - Build tool
- [TypeScript](https://www.typescriptlang.org/) - Linguagem
- [PocketBase](https://pocketbase.io/) - Backend
- [Picnic CSS](https://picnicss.com/) - Framework CSS

### Links Úteis
- [PocketBase JavaScript SDK](https://github.com/pocketbase/js-sdk)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Vite Proxy Config](https://vitejs.dev/config/server-options.html#server-proxy)

---

## 💡 Dicas

- **Use TypeScript**: Aproveite a tipagem para evitar erros
- **Consulte os exemplos**: Há código pronto para reutilizar
- **Teste em dev**: O proxy simula produção perfeitamente
- **Leia os comentários**: O código está bem documentado

---

## 🤝 Contribuindo

Ao adicionar novas funcionalidades:

1. **Documente no código** (comentários TSDoc)
2. **Atualize API_REFERENCE.md** (se adicionar métodos)
3. **Adicione exemplos em USAGE_EXAMPLES.ts**
4. **Atualize CONFIG_GUIDE.md** (se mudar config)

---

**Última atualização**: Janeiro 2025  
**Versão**: 1.0.0  
**Status**: ✅ Completo e funcional
