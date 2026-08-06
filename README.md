# Planilha Eh Tudo

> **Controle Financeiro: Liberdade da Planilha + Agilidade de um App**

Una a flexibilidade do Google Sheets com a velocidade de lançar gastos em segundos pelo navegador ou celular. Sem a rigidez dos apps financeiros tradicionais.

🔗 **[Acesse o app](https://planilha.ehtudo.app)**

---

## 🎯 O melhor dos dois mundos

### Use o App quando precisar
- ⚡ Registrar gastos em segundos no celular
- ⚡ Lançar despesas na fila do mercado
- ⚡ Enviar comprovantes, prints e extratos (leitura automática com IA)
- ⚡ Categorização rápida com sugestões
- ⚡ Ver saldos das contas instantaneamente

### Use a Planilha quando quiser
- ✅ Visualizar saldos e análises completas
- ✅ Fazer lançamentos futuros (sem data/conta)
- ✅ Editar ou apagar lançamentos rapidamente
- ✅ Criar fórmulas e dashboards personalizados
- ✅ Copiar e colar múltiplos lançamentos

**💡 A mágica acontece quando você usa ambos:** lance gastos rapidamente pelo app e analise tudo na planilha com a flexibilidade que você já conhece.

---

## 🚀 Como funciona em 3 passos

1. **Comece no app** - Cadastre-se em 30 segundos e comece a lançar gastos direto do celular. Interface simples e rápida - feita para usar no dia a dia.

2. **Descubra a planilha integrada** - Todos os seus lançamentos já estão organizados numa planilha Google Sheets criada para você. Acesse quando quiser para ver relatórios e análises.

3. **Personalize do seu jeito** - Adicione suas próprias categorias, crie fórmulas personalizadas, monte dashboards. A planilha é sua - use todo o poder do Google Sheets!

---

## 💰 Modelo de Negócio

- **Gratuito**: Funcionalidades básicas de lançamento e sincronização com planilha
- **Premium**: 
  - 🤖 Leitura inteligente de comprovantes com IA (aprende com seus lançamentos)
  - 📱 App nativo Android com captura automática de notificações bancárias *(em breve)*

---

## 🛠️ Stack Técnica

### Backend
- **[PocketBase](https://pocketbase.io/)** (v0.28+) - Backend as a Service com SQLite
  - Autenticação JWT integrada
  - Hooks customizados em JavaScript para endpoints
  - API REST automática com regras de acesso granulares
  - Migrações versionadas
  
### Frontend
- **TypeScript** - Tipagem estática e melhor DX
- **Vite** - Build tool moderna e rápida (HMR, tree-shaking)
- **Vanilla JavaScript** (módulos ES6+) - Sem frameworks pesados, máxima performance
- **CSS modular com metodologia BEM** - Componentes reutilizáveis e escaláveis
- **[Picnic CSS](https://picnicss.com/)** - Framework CSS minimalista para base

### Integrações
- **Google OAuth 2.0** - Autenticação segura com PKCE
- **Google Sheets API v4** - Leitura e escrita de dados
- **Google Drive API v3** - Listagem de planilhas do Drive do usuário

### Infraestrutura & DevOps
- **Docker** - Containerização da aplicação
- **EasyPanel** - Gerenciamento de containers e deployments
- **Hostinger VPS** - Hospedagem em servidor virtual privado

### Arquitetura
- **Multi-tenant SaaS** - Isolamento de dados por usuário via regras de acesso
- **Sistema de cache** - LocalStorage com TTL (5 min) para otimizar requisições
- **[PWA](https://github.com/edsonlcandido/planilha-eh-tudo-pwa)** - Progressive Web App com offline-first e instalação mobile

### Padrões & Práticas
- **Component-based architecture** - Componentes reutilizáveis (modais, cards, forms)
- **Service Layer Pattern** - Camada de serviços para API calls (`SheetsService`, `AuthService`, etc.)
- **BEM (Block Element Modifier)** - Nomenclatura CSS consistente
- **Invalidação automática de cache** - Cache limpo após mutações (POST/PUT/DELETE)
- **Error handling centralizado** - Toast notifications para feedback visual

### Recursos Avançados
- **IA para OCR de comprovantes** - Extração automática de dados de imagens
- **Sistema de categorias inteligente** - Aprende com histórico do usuário
- **Lançamentos futuros** - Planejamento sem data/conta definida
- **Transferências entre contas** - Movimentação com saldo neutro

---

## 📂 Estrutura do Projeto

```
ehtudoplanilha/
├── pb_hooks/              # PocketBase custom hooks (endpoints)
├── pb_migrations/         # Database migrations
├── pb_public/             # Build output (servido pelo PocketBase)
├── src/                   # Source code
│   ├── components/        # Componentes reutilizáveis (modals, cards, etc)
│   ├── services/          # Service layer (API calls)
│   ├── utils/             # Helpers e utilitários
│   ├── css/               # Estilos modulares (BEM)
│   │   ├── base/          # Reset, variables, typography
│   │   ├── components/    # Componentes CSS
│   │   ├── layout/        # Navigation, footer
│   │   └── pages/         # Estilos específicos de páginas
│   └── dashboard/         # Páginas do dashboard
├── arquitetura.md         # Documentação técnica completa
└── README.md              # Este arquivo
```

---

## 🏃 Rodando Localmente

### Pré-requisitos
- Node.js 18+
- PocketBase binary (baixar de [pocketbase.io](https://pocketbase.io))
- Credenciais OAuth Google (client_id + client_secret)

### Setup

1. **Clone o repositório**
```bash
git clone https://github.com/edsonlcandido/ehtudoplanilha.git
cd ehtudoplanilha
```

2. **Configure variáveis de ambiente**
```bash
# Crie arquivo .env na raiz
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8090/google-oauth-callback
```

3. **Instale dependências do frontend**
```bash
cd src
npm install
```

4. **Build do frontend**
```bash
npm run build  # Produção
npm run dev    # Desenvolvimento com HMR
```

5. **Inicie o PocketBase**
```bash
# Na raiz do projeto
./iniciar-pb.sh  # Linux/Mac
# ou
./pocketbase serve --dev  # Windows
```

6. **Acesse a aplicação**
- Frontend: http://localhost:8090
- Admin UI: http://localhost:8090/_/

---

## 📖 Documentação

- **[arquitetura.md](./arquitetura.md)** - Arquitetura completa, fluxos, formato de dados, sistema de cache
- **[pb_hooks/README.md](./pb_hooks/README.md)** - Documentação dos endpoints customizados

---

## 🔒 Segurança

- OAuth 2.0 com PKCE (Proof Key for Code Exchange)
- State assinado para prevenção de CSRF
- Refresh automático de tokens expirados
- Regras de acesso baseadas em `@request.auth.id`
- Dados financeiros armazenados no Google Drive do usuário (não no servidor)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE.md) para mais detalhes.

---

## 👤 Autor

**Edson Candido**

- Website: [planilha.ehtudo.app](https://planilha.ehtudo.app)
- Email: planilha@ehtudo.app
- GitHub: [@edsonlcandido](https://github.com/edsonlcandido)
- GitHub: [@ehtudoapp](https://github.com/ehtudoapp)

---

**Produzido por [Eh!Tudo.app](https://www.ehtudo.app)**.
