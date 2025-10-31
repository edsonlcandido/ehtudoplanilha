# Planilha Eh Tudo 📊

SaaS de controle financeiro pessoal integrado com Google Sheets. Gerencie seus lançamentos financeiros diretamente em uma planilha do Google Drive com interface web moderna e responsiva.

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js** 18+ (para build do frontend)
- **PocketBase** 0.28+ (já incluído no repositório)
- **Conta Google** (para OAuth e Google Sheets API)

### 1. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas credenciais Google:

```bash
cp .env.example .env
```

Edite `.env` e configure:

```env
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8090/google-oauth-callback
SHEET_TEMPLATE_ID=id_da_planilha_template
```

> 📚 **Como obter credenciais Google**: Ver [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### 2. Buildar o Frontend

O projeto usa TypeScript e Vite. Execute o script de build:

```bash
./build-and-deploy.sh
```

Este comando:
- ✅ Instala dependências npm
- ✅ Compila TypeScript para JavaScript
- ✅ Otimiza e minifica arquivos
- ✅ Copia para `pb_public/` (servido pelo PocketBase)

> 📖 **Detalhes do processo de build**: Ver [BUILD.md](BUILD.md)

### 3. Iniciar o PocketBase

```bash
./iniciar-pb.sh
```

Acesse: **http://localhost:8090**

## 📁 Estrutura do Projeto

```
ehtudoplanilha/
├── src/                    # ⚡ Código TypeScript/Vite (EDITE AQUI)
│   ├── dashboard/          # Páginas do dashboard
│   ├── services/           # Serviços (API, OAuth)
│   ├── components/         # Componentes reutilizáveis
│   └── config/             # Configurações
│
├── pb_public/              # 📦 Arquivos buildados (gerados automaticamente)
│   ├── assets/             # JS/CSS compilados
│   └── dashboard/          # HTML compilado
│
├── pb_hooks/               # 🔌 Hooks customizados PocketBase
├── pb_migrations/          # 🗃️ Migrações do banco
│
├── build-and-deploy.sh     # Script de build
└── iniciar-pb.sh           # Script para iniciar PocketBase
```

> ⚠️ **IMPORTANTE**: Edite arquivos em `/src`, não em `/pb_public`!

## 🎯 Funcionalidades Principais

### 1. Autenticação
- ✅ Registro de usuários
- ✅ Login/Logout
- ✅ Sessão persistente

### 2. Integração Google Drive
- ✅ OAuth 2.0 com Google
- ✅ Listar planilhas existentes
- ✅ Criar nova planilha a partir de template
- ✅ Selecionar planilha ativa
- ✅ Revogação de acesso

### 3. Gestão de Lançamentos
- ✅ Adicionar receitas/despesas
- ✅ Categorização
- ✅ Filtros por mês/ano
- ✅ Sincronização automática com Google Sheets

### 4. Dashboard
- ✅ Resumo financeiro
- ✅ Gráficos por categoria
- ✅ Saldo atual

## 🛠️ Desenvolvimento

### Executar em modo desenvolvimento

```bash
cd src
npm run dev
```

Acesse: **http://localhost:5173** (com hot reload)

> O Vite faz proxy automático para PocketBase em `localhost:8090`

### Workflow de desenvolvimento

1. **Editar código**: Modificar arquivos em `/src`
2. **Testar**: `cd src && npm run dev`
3. **Buildar**: `./build-and-deploy.sh`
4. **Testar com PocketBase**: `./iniciar-pb.sh`
5. **Commit**: Commitar mudanças

## 🐛 Troubleshooting

### Problema: Página não carrega ou está desatualizada

**Solução**: Execute o build novamente

```bash
./build-and-deploy.sh
```

### Problema: Lista de planilhas não aparece

**Verificar**:
1. ✅ Build executado recentemente
2. ✅ Usuário autenticado no sistema
3. ✅ Autorização Google concedida
4. ✅ Variáveis `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` configuradas
5. ✅ PocketBase rodando

**Solução**: 
- Vá para `/dashboard/configuracao.html`
- Se necessário, clique em "Revogar Autorização"
- Clique em "Autorizar com Google"
- Após autorizar, clique em "Carregar Minhas Planilhas"

### Problema: Erro de compilação TypeScript

**Solução**: Reinstalar dependências

```bash
cd src
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 Documentação Adicional

- **[BUILD.md](BUILD.md)** - Guia completo de build e deploy
- **[arquitetura.md](arquitetura.md)** - Arquitetura do sistema
- **[principaisFluxos.md](principaisFluxos.md)** - Fluxos principais
- **[pb_hooks/README.md](pb_hooks/README.md)** - Documentação dos hooks
- **[src/docs/](src/docs/)** - Documentação do frontend

## 🐳 Docker

```bash
# Build
docker build -t planilha-eh-tudo .

# Run
docker run -p 8090:8090 \
  -e GOOGLE_CLIENT_ID=seu_id \
  -e GOOGLE_CLIENT_SECRET=seu_secret \
  planilha-eh-tudo
```

> ⚠️ Execute `./build-and-deploy.sh` ANTES de buildar a imagem Docker

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Faça suas mudanças em `/src`
4. Execute o build: `./build-and-deploy.sh`
5. Commit: `git commit -m 'Adiciona nova funcionalidade'`
6. Push: `git push origin feature/nova-funcionalidade`
7. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença especificada no arquivo [LICENSE.md](LICENSE.md).

## 🆘 Suporte

- 📧 Email: [suporte](mailto:contato@ehtudo.app)
- 🐛 Issues: [GitHub Issues](https://github.com/edsonlcandido/ehtudoplanilha/issues)
- 📖 Docs: [Documentação](https://github.com/edsonlcandido/ehtudoplanilha/tree/main/src/docs)

---

Desenvolvido com ❤️ por [Eh!Tudo.app](https://www.ehtudo.app)
