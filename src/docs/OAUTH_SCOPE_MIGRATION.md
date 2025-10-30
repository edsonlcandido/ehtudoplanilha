# 🔐 Migração OAuth: Mudança de Escopo para `drive.file`

**Data:** 30 de Outubro de 2025  
**Objetivo:** Simplificar OAuth usando escopo menos permissivo para evitar validação do Google

---

## 📋 Resumo da Mudança

### ❌ Situação Atual
- **Escopos:** `https://www.googleapis.com/auth/drive` + `https://www.googleapis.com/auth/spreadsheets`
- **Problema:** Escopos amplos requerem validação do Google (processo demorado)
- **Método:** Copia template existente para criar planilha do usuário

### ✅ Nova Abordagem
- **Escopo:** `https://www.googleapis.com/auth/drive.file` (apenas)
- **Vantagem:** Sem necessidade de validação do Google
- **Método:** Criar planilha programaticamente com estrutura definida

---

## 🎯 O Que Funciona com `drive.file`

✅ **Permitido:**
- Criar novas planilhas via Sheets API
- Ler conteúdo de planilhas criadas pelo app
- Escrever/atualizar dados em planilhas criadas pelo app
- Deletar entradas em planilhas criadas pelo app
- Todas operações CRUD nos arquivos do próprio app

❌ **Não Funciona:**
- Copiar planilhas templates existentes
- Acessar/listar arquivos criados por outros apps
- Modificar planilhas não criadas pelo app

---

## 📂 Estrutura da Nova Planilha

A planilha será criada com duas abas:

### 📊 Aba "Lançamentos"
**Colunas (A:G):**
1. Data (A) - formato: dd/MM/yyyy hh:mm
2. Conta (B) - string
3. Valor (C) - número
4. Descrição (D) - string
5. Categoria (E) - string
6. Orçamento (F) - formato: dd/MM/yyyy
7. Observação (G) - string

**Header:** Linha 1 com títulos das colunas

### 📑 Aba "Categorias"
**Estrutura (A:B):**
- Coluna A: Nome da categoria
- Coluna B: Tipo da categoria

**44 Categorias Padrão:**
```
ALIMENTAÇÃO         | PRECISO
SUPERMERCADO        | PRECISO
MERCADO             | PRECISO
RESTAURANTE         | QUERO
DELIVERY            | QUERO
PADARIA             | PRECISO
AÇOUGUE             | PRECISO
FEIRA               | PRECISO
SAÚDE               | PRECISO
FARMÁCIA            | PRECISO
MÉDICO              | PRECISO
DENTISTA            | PRECISO
ACADEMIA            | QUERO
TERAPIA             | PRECISO
TRANSPORTE          | PRECISO
COMBUSTÍVEL         | PRECISO
ESTACIONAMENTO      | PRECISO
PEDÁGIO             | PRECISO
TRANSPORTE PÚBLICO  | PRECISO
APLICATIVO          | PRECISO
MORADIA             | PRECISO
ALUGUEL             | PRECISO
CONDOMÍNIO          | PRECISO
ÁGUA                | PRECISO
LUZ                 | PRECISO
GÁS                 | PRECISO
INTERNET            | PRECISO
TELEFONE            | PRECISO
EDUCAÇÃO            | PRECISO
ESCOLA              | PRECISO
CURSO               | QUERO
LIVROS              | QUERO
MATERIAL ESCOLAR    | PRECISO
LAZER               | QUERO
CINEMA              | QUERO
STREAMING           | QUERO
VIAGEM              | QUERO
PRESENTE            | QUERO
VESTUÁRIO           | QUERO
ROUPAS              | QUERO
CALÇADOS            | QUERO
BELEZA              | QUERO
INVESTIMENTOS       | INVESTIMENTOS
POUPANÇA            | INVESTIMENTOS
PREVIDÊNCIA         | INVESTIMENTOS
RENDA               | RENDA
SALÁRIO             | RENDA
FREELANCE           | RENDA
OUTROS              | QUERO
TRANSFERÊNCIA       | TRANSFERÊNCIA
SALDO INICIAL       | SALDO
```

---

## 🔧 Implementação - Passo a Passo

### **PASSO 1: Atualizar Escopos OAuth no Frontend**

#### 📄 Arquivo: `src/services/google/oauth.service.ts` (criar)

```typescript
/**
 * Serviço de autenticação OAuth com Google
 * Escopo: drive.file (acesso apenas a arquivos criados pelo app)
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/oauth/callback`;
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

export class GoogleOAuthService {
  /**
   * Inicia fluxo OAuth redirecionando para Google
   */
  static initiateOAuth(): void {
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', SCOPE);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    window.location.href = authUrl.toString();
  }

  /**
   * Valida state após callback
   */
  static validateState(receivedState: string): boolean {
    const savedState = sessionStorage.getItem('oauth_state');
    sessionStorage.removeItem('oauth_state');
    return savedState === receivedState;
  }
}
```

#### 📄 Arquivo: `src/config/google.config.ts` (criar)

```typescript
export const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  scope: 'https://www.googleapis.com/auth/drive.file',
  redirectUri: `${window.location.origin}/oauth/callback`,
} as const;
```

---

### **PASSO 2: Reescrever Hook `provision-sheet.pb.js`**

#### 📄 Arquivo: `pb_hooks/provision-sheet.pb.js`

```javascript
/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para criar planilha programaticamente no Drive do usuário
 * Usando escopo drive.file (sem necessidade de validação do Google)
 */

// Estrutura de categorias padrão
const CATEGORIAS_PADRAO = [
    ["Categoria", "Tipo"], // Header
    ["ALIMENTAÇÃO", "PRECISO"],
    ["SUPERMERCADO", "PRECISO"],
    ["MERCADO", "PRECISO"],
    ["RESTAURANTE", "QUERO"],
    ["DELIVERY", "QUERO"],
    ["PADARIA", "PRECISO"],
    ["AÇOUGUE", "PRECISO"],
    ["FEIRA", "PRECISO"],
    ["SAÚDE", "PRECISO"],
    ["FARMÁCIA", "PRECISO"],
    ["MÉDICO", "PRECISO"],
    ["DENTISTA", "PRECISO"],
    ["ACADEMIA", "QUERO"],
    ["TERAPIA", "PRECISO"],
    ["TRANSPORTE", "PRECISO"],
    ["COMBUSTÍVEL", "PRECISO"],
    ["ESTACIONAMENTO", "PRECISO"],
    ["PEDÁGIO", "PRECISO"],
    ["TRANSPORTE PÚBLICO", "PRECISO"],
    ["APLICATIVO", "PRECISO"],
    ["MORADIA", "PRECISO"],
    ["ALUGUEL", "PRECISO"],
    ["CONDOMÍNIO", "PRECISO"],
    ["ÁGUA", "PRECISO"],
    ["LUZ", "PRECISO"],
    ["GÁS", "PRECISO"],
    ["INTERNET", "PRECISO"],
    ["TELEFONE", "PRECISO"],
    ["EDUCAÇÃO", "PRECISO"],
    ["ESCOLA", "PRECISO"],
    ["CURSO", "QUERO"],
    ["LIVROS", "QUERO"],
    ["MATERIAL ESCOLAR", "PRECISO"],
    ["LAZER", "QUERO"],
    ["CINEMA", "QUERO"],
    ["STREAMING", "QUERO"],
    ["VIAGEM", "QUERO"],
    ["PRESENTE", "QUERO"],
    ["VESTUÁRIO", "QUERO"],
    ["ROUPAS", "QUERO"],
    ["CALÇADOS", "QUERO"],
    ["BELEZA", "QUERO"],
    ["INVESTIMENTOS", "INVESTIMENTOS"],
    ["POUPANÇA", "INVESTIMENTOS"],
    ["PREVIDÊNCIA", "INVESTIMENTOS"],
    ["RENDA", "RENDA"],
    ["SALÁRIO", "RENDA"],
    ["FREELANCE", "RENDA"],
    ["OUTROS", "QUERO"],
    ["TRANSFERÊNCIA", "TRANSFERÊNCIA"],
    ["SALDO INICIAL", "SALDO"]
];

/**
 * Cria planilha programaticamente usando Sheets API v4
 */
function createSpreadsheet(accessToken, userName) {
    const spreadsheetTitle = `Planilha Eh Tudo - ${userName}`;
    
    const requestBody = {
        properties: {
            title: spreadsheetTitle,
            locale: "pt_BR",
            timeZone: "America/Sao_Paulo"
        },
        sheets: [
            {
                properties: {
                    title: "Lançamentos",
                    gridProperties: {
                        rowCount: 1000,
                        columnCount: 7,
                        frozenRowCount: 1
                    }
                },
                data: [{
                    startRow: 0,
                    startColumn: 0,
                    rowData: [{
                        values: [
                            { userEnteredValue: { stringValue: "Data" }, userEnteredFormat: { textFormat: { bold: true } } },
                            { userEnteredValue: { stringValue: "Conta" }, userEnteredFormat: { textFormat: { bold: true } } },
                            { userEnteredValue: { stringValue: "Valor" }, userEnteredFormat: { textFormat: { bold: true } } },
                            { userEnteredValue: { stringValue: "Descrição" }, userEnteredFormat: { textFormat: { bold: true } } },
                            { userEnteredValue: { stringValue: "Categoria" }, userEnteredFormat: { textFormat: { bold: true } } },
                            { userEnteredValue: { stringValue: "Orçamento" }, userEnteredFormat: { textFormat: { bold: true } } },
                            { userEnteredValue: { stringValue: "Observação" }, userEnteredFormat: { textFormat: { bold: true } } }
                        ]
                    }]
                }]
            },
            {
                properties: {
                    title: "Categorias",
                    gridProperties: {
                        rowCount: 100,
                        columnCount: 2,
                        frozenRowCount: 1
                    }
                }
            }
        ]
    };

    const createResponse = $http.send({
        url: "https://sheets.googleapis.com/v4/spreadsheets",
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });

    return createResponse;
}

/**
 * Popula aba Categorias com dados padrão
 */
function populateCategorias(spreadsheetId, accessToken) {
    const requestBody = {
        values: CATEGORIAS_PADRAO
    };

    const populateResponse = $http.send({
        url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Categorias!A1:B${CATEGORIAS_PADRAO.length}?valueInputOption=RAW`,
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });

    return populateResponse;
}

/**
 * Renova access token usando refresh token
 */
function refreshAccessToken(refreshToken) {
    const clientId = $os.getenv("GOOGLE_CLIENT_ID");
    const clientSecret = $os.getenv("GOOGLE_CLIENT_SECRET");

    const refreshRequestBody = [
        `refresh_token=${encodeURIComponent(refreshToken)}`,
        `client_id=${encodeURIComponent(clientId)}`,
        `client_secret=${encodeURIComponent(clientSecret)}`,
        `grant_type=refresh_token`
    ].join('&');

    const tokenResponse = $http.send({
        url: "https://oauth2.googleapis.com/token",
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: refreshRequestBody
    });

    return tokenResponse;
}

routerAdd("POST", "/provision-sheet", (c) => {
    const authUser = c.auth;
    if (!authUser || !authUser.id) {
        return c.json(401, { "error": "Usuário não autenticado" });
    }

    const userId = authUser.id;
    const userName = authUser.get("name") || "Usuário";

    try {
        // Buscar informações do Google para o usuário
        const googleInfo = $app.findFirstRecordByFilter(
            "google_infos",
            "user_id = {:userId}",
            { userId: userId }
        );

        if (!googleInfo) {
            return c.json(404, { 
                "error": "Informações do Google não encontradas. Execute primeiro a autorização OAuth." 
            });
        }

        let accessToken = googleInfo.get("access_token");
        if (!accessToken) {
            return c.json(404, { 
                "error": "Token de acesso não encontrado. Execute novamente a autorização OAuth." 
            });
        }

        // Verificar se já existe uma planilha configurada
        const existingSheetId = googleInfo.get("sheet_id");
        if (existingSheetId && existingSheetId.trim() !== "") {
            return c.json(200, {
                "success": true,
                "message": "Usuário já possui uma planilha configurada",
                "sheet_id": existingSheetId,
                "action": "existing"
            });
        }

        console.log(`Criando nova planilha para usuário ${userId}`);

        // Criar planilha
        let createResponse = createSpreadsheet(accessToken, userName);

        // Se token expirado, renovar e tentar novamente
        if (createResponse.statusCode === 401) {
            console.log("Token expirado, renovando...");
            
            const refreshToken = googleInfo.get("refresh_token");
            if (!refreshToken) {
                return c.json(401, { 
                    "error": "Token expirado e refresh token não disponível. Execute novamente a autorização OAuth." 
                });
            }

            const tokenResponse = refreshAccessToken(refreshToken);
            if (tokenResponse.statusCode !== 200) {
                console.log("Erro ao renovar token:", tokenResponse.json);
                return c.json(400, { 
                    "error": "Falha ao renovar token de acesso. Execute novamente a autorização OAuth." 
                });
            }

            // Atualizar token no banco
            const newTokenData = tokenResponse.json;
            accessToken = newTokenData.access_token;
            googleInfo.set("access_token", accessToken);
            $app.save(googleInfo);

            // Tentar criar planilha novamente
            createResponse = createSpreadsheet(accessToken, userName);
        }

        // Verificar se criação foi bem-sucedida
        if (createResponse.statusCode !== 200) {
            console.log("Erro ao criar planilha:", createResponse.json);
            const errorData = createResponse.json;
            return c.json(createResponse.statusCode, { 
                "error": `Falha ao criar planilha: ${errorData.error?.message || 'Erro desconhecido'}` 
            });
        }

        const createData = createResponse.json;
        const newSheetId = createData.spreadsheetId;
        const sheetUrl = createData.spreadsheetUrl;

        console.log(`Planilha criada: ${newSheetId}`);

        // Popula aba Categorias
        const populateResponse = populateCategorias(newSheetId, accessToken);
        if (populateResponse.statusCode !== 200) {
            console.log("Aviso: Erro ao popular categorias:", populateResponse.json);
            // Não falha o processo, apenas loga
        }

        // Salvar informações da planilha
        googleInfo.set("sheet_id", newSheetId);
        googleInfo.set("sheet_name", createData.properties?.title || `Planilha Eh Tudo - ${userName}`);
        $app.save(googleInfo);

        console.log(`Planilha provisionada com sucesso para usuário ${userId}`);

        return c.json(200, {
            "success": true,
            "message": "Planilha criada com sucesso no seu Google Drive!",
            "sheet_id": newSheetId,
            "sheet_name": createData.properties?.title || `Planilha Eh Tudo - ${userName}`,
            "sheet_url": sheetUrl,
            "action": "created"
        });

    } catch (error) {
        console.log("Erro interno ao provisionar planilha:", error);
        return c.json(500, { 
            "error": "Erro interno do servidor ao criar planilha",
            "details": error.message || String(error)
        });
    }
}, $apis.requireAuth());
```

---

### **PASSO 3: Atualizar Variáveis de Ambiente**

#### 📄 Arquivo: `.env` (raiz do projeto)

```bash
# Remover esta variável (não é mais necessária)
# SHEET_TEMPLATE_ID=xxxxxxxxxxxxx

# Manter estas
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=https://planilha.ehtudo.app/google-oauth-callback
```

---

### **PASSO 4: Atualizar Frontend Original (pb_public)**

#### 📄 Arquivo: `pb_public/js/google/oauth-service.js`

**Localizar linha ~100:**
```javascript
const scope = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets';
```

**Substituir por:**
```javascript
const scope = 'https://www.googleapis.com/auth/drive.file';
```

#### 📄 Arquivo: `pb_public/js/config/api-config.js`

**Localizar linha ~26:**
```javascript
scopes: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets',
```

**Substituir por:**
```javascript
scopes: 'https://www.googleapis.com/auth/drive.file',
```

---

### **PASSO 5: Testar Fluxo Completo**

#### 🧪 Checklist de Testes

1. **OAuth Flow**
   - [ ] Usuário clica em "Autorizar com Google"
   - [ ] Redireciona para Google
   - [ ] Tela de consentimento mostra apenas "Ver e gerenciar os arquivos do Google Drive criados ou abertos por este app"
   - [ ] Callback retorna código de autorização
   - [ ] Backend troca código por tokens

2. **Provisionamento**
   - [ ] POST `/provision-sheet` cria nova planilha
   - [ ] Planilha aparece no Google Drive do usuário
   - [ ] Aba "Lançamentos" tem header correto (7 colunas)
   - [ ] Aba "Categorias" tem 44 categorias + header

3. **Operações CRUD**
   - [ ] POST `/append-entry` adiciona lançamento
   - [ ] GET `/get-sheet-entries` retorna lançamentos
   - [ ] PATCH `/edit-sheet-entry` atualiza lançamento
   - [ ] DELETE `/delete-sheet-entry` remove lançamento
   - [ ] GET `/get-sheet-categories` retorna categorias

4. **Refresh Token**
   - [ ] Após 1h, token expira
   - [ ] Sistema renova automaticamente
   - [ ] Operações continuam funcionando

---

## 🚀 Deploy

### Ordem de Deployment

1. ✅ **Backend Hooks** (`pb_hooks/`)
   - Subir novo `provision-sheet.pb.js`
   - Reiniciar PocketBase

2. ✅ **Frontend Original** (`pb_public/`)
   - Atualizar `oauth-service.js`
   - Atualizar `api-config.js`

3. ✅ **Frontend Vite** (`src/`)
   - Criar serviços TypeScript
   - Build e deploy

### Comandos

```bash
# Backend (PocketBase)
cd /caminho/do/projeto
./iniciar-pb.sh

# Frontend Vite
cd src
npm run build
# Copiar dist/ para servidor
```

---

## 📊 Diferenças: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Escopos OAuth** | `drive` + `spreadsheets` | `drive.file` |
| **Validação Google** | ✅ Necessária | ❌ Não necessária |
| **Método Criação** | Copia template | Cria programaticamente |
| **Permissões** | Acesso a TODAS planilhas | Apenas planilhas do app |
| **Template ID** | Requer var ambiente | Não necessário |
| **Categorias** | No template | Hard-coded no backend |
| **Complexidade** | Média | Baixa |

---

## 🐛 Troubleshooting

### Erro: "Token expirado"
**Causa:** Access token válido por 1h  
**Solução:** Sistema renova automaticamente com refresh token

### Erro: "Insufficient permissions"
**Causa:** Usuário autorizou com escopo antigo  
**Solução:** 
1. Revogar acesso em https://myaccount.google.com/permissions
2. Autorizar novamente

### Erro: "Planilha não encontrada"
**Causa:** Tentando acessar planilha não criada pelo app  
**Solução:** Escopo `drive.file` só permite planilhas do próprio app

### Categorias não aparecem
**Causa:** Erro ao popular aba  
**Solução:** Verificar logs do PocketBase, tentar reprovisionar

---

## 📝 Notas Importantes

1. **Usuários Existentes:** Precisarão reprovisionar planilha (revogar e autorizar novamente)
2. **Migração de Dados:** Se necessário, exportar dados da planilha antiga antes
3. **Backup:** Template antigo pode ser mantido como backup
4. **Testes:** Testar em conta Google de desenvolvimento primeiro
5. **Logs:** Monitorar logs do PocketBase durante rollout

---

## ✅ Checklist Final

- [ ] Código do `provision-sheet.pb.js` atualizado
- [ ] Frontend `oauth-service.js` atualizado
- [ ] Frontend `api-config.js` atualizado
- [ ] Variável `SHEET_TEMPLATE_ID` removida do `.env`
- [ ] Backend reiniciado
- [ ] Teste completo realizado
- [ ] Documentação atualizada
- [ ] Deploy em produção

---

## 🎉 Resultado Esperado

Após a implementação:
- ✅ OAuth simplificado (sem validação Google)
- ✅ Planilhas criadas automaticamente
- ✅ 44 categorias pré-configuradas
- ✅ Todas operações CRUD funcionando
- ✅ Melhor experiência do usuário

---

**Autor:** GitHub Copilot  
**Data:** 30/10/2025 - 03:45 AM  
**Versão:** 1.0  
**Status:** Pronto para implementação 🚀

---

## 💤 Boa Noite!

Amanhã você implementa isso com calma. Qualquer dúvida, é só perguntar! 😴✨
