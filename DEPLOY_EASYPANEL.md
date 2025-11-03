# Deploy no EasyPanel VPS com dockerfile.vite

Este guia explica como fazer deploy da aplicação no EasyPanel usando o `dockerfile.vite`.

## 📋 Pré-requisitos

- Conta no EasyPanel
- VPS configurado com EasyPanel
- Repositório Git (GitHub, GitLab, etc.)

## 🚀 Configuração no EasyPanel

### 1. Criar Novo Projeto

1. Acesse seu painel EasyPanel
2. Clique em **"Create Project"**
3. Escolha **"Docker"** como tipo de projeto

### 2. Configurar Source

**Opção A: Via GitHub (Recomendado)**
1. Conecte seu repositório GitHub
2. Selecione o repositório: `edsonlcandido/ehtudoplanilha`
3. Branch: `main` (ou sua branch preferida)

**Opção B: Via Git URL**
```
https://github.com/edsonlcandido/ehtudoplanilha.git
```

### 3. Configurar Build

- **Dockerfile Path**: `dockerfile.vite`
- **Context Path**: `.` (raiz do repositório)
- **Build Args** (opcional):
  - `PB_VERSION=0.30.0`

### 4. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente no painel EasyPanel:

```env
# Google OAuth (OBRIGATÓRIO)
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URI=https://seu-dominio.com/google-oauth-callback

# Template da Planilha (OBRIGATÓRIO)
SHEET_TEMPLATE_ID=id_da_sua_planilha_template

# Timezone (opcional)
TZ=America/Sao_Paulo
```

⚠️ **IMPORTANTE**: Atualize `GOOGLE_REDIRECT_URI` com o domínio do seu VPS!

### 5. Configurar Porta

- **Container Port**: `8090`
- **Protocol**: HTTP

### 6. Configurar Volume (Persistência de Dados)

Para manter os dados do PocketBase entre deploys:

- **Mount Path**: `/app/pb_data`
- **Type**: Volume
- **Name**: `pocketbase-data` (ou nome de sua preferência)

### 7. Configurar Domínio

1. Adicione seu domínio no EasyPanel
2. Configure SSL/HTTPS (Let's Encrypt)
3. Aponte para a porta 8090

### 8. Deploy

1. Clique em **"Deploy"**
2. Aguarde o build e deploy completar
3. Acesse seu domínio para testar

## 🔧 Configurações Avançadas

### Resources (Recursos)

**Recomendações mínimas:**
- **CPU**: 0.5 core
- **Memory**: 512 MB
- **Storage**: 1 GB para volume

**Para produção:**
- **CPU**: 1-2 cores
- **Memory**: 1-2 GB
- **Storage**: 5-10 GB para volume

### Health Check

O Dockerfile já inclui um health check automático:
- **Endpoint**: `http://localhost:8090/api/health`
- **Interval**: 30s
- **Timeout**: 3s
- **Retries**: 3

### Auto Deploy

Configure deploy automático no GitHub:
1. Vá em Settings do projeto no EasyPanel
2. Ative **"Auto Deploy"**
3. Escolha branch (ex: `main`)
4. Cada push na branch fará deploy automático

## 🧪 Testar Build Localmente

Antes de fazer deploy, teste o build localmente:

```bash
# Build da imagem
docker build -f dockerfile.vite -t planilha-eh-tudo:test .

# Executar container de teste
docker run -d \
  -p 8090:8090 \
  -e GOOGLE_CLIENT_ID=seu_client_id \
  -e GOOGLE_CLIENT_SECRET=seu_secret \
  -e GOOGLE_REDIRECT_URI=http://localhost:8090/google-oauth-callback \
  -e SHEET_TEMPLATE_ID=seu_template_id \
  --name planilha-test \
  planilha-eh-tudo:test

# Verificar logs
docker logs -f planilha-test

# Acessar
# http://localhost:8090

# Parar e remover
docker stop planilha-test
docker rm planilha-test
```

## 📊 Estrutura do Build

O `dockerfile.vite` executa os seguintes passos:

```
1. Estágio Frontend (Node.js)
   ├── Copia package.json
   ├── npm install
   ├── Copia código fonte /src
   └── npm run build → /build/dist

2. Estágio PocketBase
   ├── Download PocketBase v0.30.0
   └── Descompacta binário

3. Estágio Final (Alpine)
   ├── Copia executável PocketBase
   ├── Copia /build/dist → /app/pb_public
   ├── Copia pb_hooks/
   ├── Copia pb_migrations/
   ├── Preserva PWA e SDK
   └── Configura usuário não-root
```

## 🔍 Troubleshooting

### Build falha no npm install

**Solução**: Verifique se `src/package.json` está commitado no repositório

```bash
git add src/package.json
git commit -m "Add package.json"
git push
```

### Erro de permissão em /app/pb_data

**Solução**: O volume precisa ter permissões corretas. No EasyPanel, isso é automático.

### Aplicação não conecta ao Google

**Verificar**:
1. ✅ Variáveis de ambiente configuradas corretamente
2. ✅ `GOOGLE_REDIRECT_URI` usando HTTPS e domínio correto
3. ✅ Credenciais Google OAuth configuradas no Google Cloud Console
4. ✅ Domínio autorizado nas configurações OAuth

### Dados são perdidos após redeploy

**Solução**: Configure volume persistente conforme passo 6

## 📝 Diferenças do Dockerfile Original

| Aspecto | Dockerfile | dockerfile.vite |
|---------|-----------|-----------------|
| Build Frontend | ❌ Não | ✅ Sim (Vite/TypeScript) |
| Copia /src | ❌ Não | ✅ Sim |
| Build de /src | ❌ Não | ✅ npm run build |
| Copia para pb_public | ✅ Manual | ✅ Automático |
| Multi-stage | ✅ Sim (2 estágios) | ✅ Sim (3 estágios) |
| Tamanho Final | ~50 MB | ~70 MB |
| Node.js na imagem final | ❌ Não | ❌ Não |

## 🆘 Suporte

- **Documentação EasyPanel**: https://easypanel.io/docs
- **Issues**: https://github.com/edsonlcandido/ehtudoplanilha/issues
- **Build Local**: Ver `BUILD.md` no repositório

---

**Data de criação**: Novembro 2025  
**Dockerfile**: `dockerfile.vite`  
**PocketBase Version**: 0.30.0
