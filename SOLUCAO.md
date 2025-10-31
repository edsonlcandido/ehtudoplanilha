# Resolução do Problema: Lista de Planilhas não Aparecia

## 🎯 Problema Original

A página de configuração (`/dashboard/configuracao.html`) não estava mostrando a lista de planilhas disponíveis do Google Drive quando o usuário clicava no botão "Carregar Minhas Planilhas".

## 🔍 Diagnóstico

O problema foi identificado:

1. **Código TypeScript em `/src`**: O projeto foi refatorado para usar TypeScript e Vite, com todo o código fonte movido para `/src`
2. **Build necessário**: O código TypeScript precisa ser compilado para JavaScript antes de ser servido pelo PocketBase
3. **PocketBase serve de `/pb_public`**: O servidor PocketBase serve arquivos estáticos apenas do diretório `/pb_public`
4. **Falta de processo de build**: Não havia um script automatizado para buildar e copiar os arquivos

## ✅ Solução Implementada

### 1. Script de Build Automatizado (`build-and-deploy.sh`)

Criamos um script que:
- ✅ Navega para `/src` e instala dependências npm (se necessário)
- ✅ Executa `npm run build` para compilar TypeScript → JavaScript
- ✅ Faz backup do `/pb_public` atual
- ✅ Limpa `/pb_public` preservando arquivos importantes (PWA, SDK)
- ✅ Copia arquivos buildados de `/src/dist` para `/pb_public`

**Como usar:**
```bash
./build-and-deploy.sh
```

### 2. Documentação Completa

Criamos três documentos:

#### `README.md` (Principal)
- Guia de início rápido
- Instruções de instalação
- Estrutura do projeto
- Troubleshooting específico para problemas de listagem

#### `BUILD.md` (Build e Deploy)
- Processo detalhado de build
- Comandos disponíveis (dev, build, preview)
- Workflow de desenvolvimento
- Seção específica sobre a página de configuração

#### `.env.example` (Configuração)
- Todas as variáveis de ambiente necessárias
- Incluindo `SHEET_TEMPLATE_ID` que estava faltando

### 3. Arquivos Buildados Atualizados

Executamos o build e atualizamos todos os arquivos em `/pb_public`:
- HTML compilado com referências corretas aos assets
- JavaScript minificado e otimizado
- CSS otimizado
- Funcionalidade de listagem corretamente implementada

## 🔧 Como Resolver o Problema

### Para executar agora:

```bash
# 1. Buildar o projeto
./build-and-deploy.sh

# 2. Iniciar o PocketBase
./iniciar-pb.sh
```

### Para testar a funcionalidade:

1. Abra o navegador em: **http://localhost:8090**
2. Faça login na aplicação
3. Vá para: **http://localhost:8090/dashboard/configuracao.html**
4. No cartão "Autorização Google Drive":
   - Se não estiver autorizado, clique em "🔑 Autorizar com Google"
   - Autorize o acesso ao Google Drive
5. No cartão "Planilha":
   - Clique em "📋 Carregar Minhas Planilhas"
   - **A lista de planilhas deve aparecer!** ✅

## 📊 Fluxo Técnico da Listagem

```
Frontend (configuracao.ts)
    ↓
    handleListSheets()
    ↓
    SheetsService.listGoogleSheets()
    ↓
    pb.send('/list-google-sheets')
    ↓
Backend (google-endpoints.pb.js)
    ↓
    Busca access_token em google_infos
    ↓
    Chama Google Drive API
    ↓
    Retorna lista de planilhas
    ↓
Frontend renderiza a lista
```

### Endpoints Envolvidos

- **Frontend**: `/assets/configuracao.js` (compilado de `/src/dashboard/configuracao.ts`)
- **Backend**: `/list-google-sheets` (hook em `/pb_hooks/google-endpoints.pb.js`)
- **API Externa**: Google Drive API v3

### Dados Retornados

```json
{
  "success": true,
  "sheets": [
    {
      "id": "1ABC...",
      "name": "Minha Planilha Financeira",
      "modifiedTime": "2025-10-31T20:30:00.000Z",
      "createdTime": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

## 🚨 Troubleshooting

### Problema: Lista ainda não aparece

**Verificar:**
1. Build foi executado? → Execute `./build-and-deploy.sh`
2. PocketBase está rodando? → Execute `./iniciar-pb.sh`
3. Usuário está autenticado? → Faça login na aplicação
4. Google Drive foi autorizado? → Vá em configuração e autorize
5. Variáveis de ambiente configuradas? → Verifique `.env`

### Problema: Erro "Token expirado"

**Solução:**
1. Vá em `/dashboard/configuracao.html`
2. Clique em "🚫 Revogar Autorização"
3. Clique em "🔑 Autorizar com Google"
4. Tente carregar planilhas novamente

### Problema: Erro "Usuário não autorizou acesso"

**Solução:**
1. O usuário precisa autorizar o Google Drive primeiro
2. Clique no botão "🔑 Autorizar com Google"
3. Conceda as permissões solicitadas
4. Depois clique em "📋 Carregar Minhas Planilhas"

## 📝 Para Desenvolvimento Futuro

### Sempre que modificar código:

1. **Editar apenas em `/src`** (NÃO edite em `/pb_public`)
2. Testar com dev server (opcional): `cd src && npm run dev`
3. Buildar para produção: `./build-and-deploy.sh`
4. Testar com PocketBase: `./iniciar-pb.sh`
5. Commit das mudanças

### Arquivos importantes:

- **Fonte**: `/src/dashboard/configuracao.ts` (página de configuração)
- **Serviço**: `/src/services/sheets.ts` (comunicação com backend)
- **Backend**: `/pb_hooks/google-endpoints.pb.js` (endpoint `/list-google-sheets`)
- **Build**: `build-and-deploy.sh` (script de build)

## ✅ Checklist de Verificação

- [x] Script de build criado e testado
- [x] Documentação completa escrita
- [x] Código TypeScript sem erros
- [x] Build executado com sucesso
- [x] Arquivos copiados para pb_public
- [x] PWA e SDKs preservados
- [x] Endpoint backend verificado
- [x] Frontend conectado ao endpoint
- [x] Revisão de código realizada
- [x] Verificação de segurança (CodeQL) realizada
- [ ] Teste manual pelo usuário (pendente)

## 🎉 Resultado Esperado

Após executar os passos acima, o usuário poderá:
1. ✅ Ver o botão "Carregar Minhas Planilhas" na página de configuração
2. ✅ Clicar no botão e ver a lista de planilhas do Google Drive
3. ✅ Selecionar uma planilha existente ou criar uma nova
4. ✅ Usar a aplicação normalmente para gerenciar lançamentos

---

**Data**: 31/10/2025
**Status**: ✅ Implementado e testado (aguardando teste manual do usuário)
