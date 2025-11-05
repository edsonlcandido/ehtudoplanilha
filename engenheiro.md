# Instruções ao Engenheiro de Software

Baseado em arquitetura detalhada em [arquitetura.md](arquitetura.md).

---

## 1. Visão Geral
SaaS multi-tenant onde cada usuário gerencia lançamentos financeiros em sua própria planilha do Google Sheets.  
Backend: PocketBase (SQLite) com hooks customizados para OAuth Google e escrita em Sheets.

---

## 2. Multi-Tenancy e Isolamento

### 2.1 Estratégia
Banco único, coleções compartilhadas com regras de acesso restritivas.

### 2.2 Coleções PocketBase

1. **users** (nativa: email + senha)
2. **google_infos**
   - user_id (rel 1:1 → users)
   - access_token (text)
   - refresh_token (text, criptografado opcional)
   - sheet_id (text)
   - sheet_name (text)
   - created (date)
   - updated (date)

### 2.3 Regras de Acesso (PocketBase ≥ 0.28)
**users:**
- read/write: `@request.auth.id = @record.id`

**google_infos:**
- read/write: `@request.auth.id = @record.user_id`

---

## 3. Estrutura da Planilha Modelo

A planilha modelo deve conter duas abas:

### 3.1 Aba de Lançamentos (ex.: LANCAMENTOS)

#### Formato na Planilha Google Sheets
| Coluna | Campo       | Tipo    | Formato / Observação |
|--------|-------------|---------|----------------------|
| A      | data        | Data/Hora | 20/10/2025 16:52 (formato brasileiro) |
| B      | conta       | Texto   | ex.: Carteira, Banco |
| C      | valor       | Número  | Decimal (.) - positivo para receita, negativo para despesa |
| D      | descricao   | Texto   | máx 255 chars |
| E      | categoria   | Texto   | Deve existir na aba CATEGORIAS |
| F      | orcamento   | Data    | 31/10/2025 (somente data, sem hora) |
| G      | observacao  | Texto   | opcional |

Range de append: `LANCAMENTOS!A:G`

#### Formato de Conversão (Frontend ↔ Backend ↔ Sheets API)

**1. Leitura da Planilha (Sheets API → Backend)**
- Google Sheets retorna datas como **Excel Epoch Serial** (número de dias desde 31/12/1899)
- Exemplo: 45581.703472222 representa 20/10/2025 16:52
- O backend NÃO converte, retorna o serial numérico tal como vem da API

**2. Frontend - Conversão de Leitura**
```javascript
// Funções em utils/sheet-entries.js
excelSerialToDate(serial, dataHora = false)
// dataHora=true: retorna Date com hora (ex.: 45581.703472222 → 20/10/2025 16:52)
// dataHora=false: retorna Date sem hora (ex.: 45581 → 20/10/2025 00:00)
```

**3. Formulário de Inserção (Frontend)**
- **Campo "Data"**: `<input type="datetime-local">` → coleta data E hora (formato: `2025-10-20T16:52`)
- **Campo "Orçamento"**: `<input type="date">` → coleta SOMENTE data (formato: `2025-10-31`)

**4. Preparação para Envio (Frontend → Backend)**
```javascript
// Campo DATA - formata string para formato brasileiro DD/MM/YYYY HH:mm
// Converte "2025-10-31T14:41" → "31/10/2025 14:41"
const [datePart, timePart] = datetimeInput.value.split('T')
const [year, month, day] = datePart.split('-')
payload.data = `${day}/${month}/${year} ${timePart}`  // "31/10/2025 14:41"

// Campo ORÇAMENTO - formata string para formato brasileiro DD/MM/YYYY
// Converte "2025-10-31" → "31/10/2025"
const [ano, mes, dia] = budgetInput.value.split('-')
payload.orcamento = `${dia}/${mes}/${ano}`  // "31/10/2025"
```

**5. Backend - Recebe e Envia para Sheets API**
```javascript
// append-entry.pb.js
const values = [
  [
    requestData.data,           // string "31/10/2025 14:41" → Sheets API interpreta automaticamente
    requestData.conta,          // string
    requestData.valor,          // number (positivo ou negativo)
    requestData.descricao,      // string
    requestData.categoria,      // string
    requestData.orcamento,      // string "31/10/2025" → Sheets API interpreta automaticamente
    ''                          // observação (vazio por padrão)
  ]
]
```

**6. Google Sheets API - Processamento**
- Quando `valueInputOption=USER_ENTERED`:
  - String datetime `"31/10/2025 14:41"` → interpretada como data/hora e convertida para serial Excel internamente
  - String date `"31/10/2025"` → interpretada como data (sem hora) e convertida para serial Excel internamente
  - A célula fica formatada como "Data/Hora" (coluna A) ou "Data" (coluna F)
  - **IMPORTANTE**: O Sheets armazena SEMPRE no formato Excel Serial (número), mas o `valueInputOption=USER_ENTERED` permite enviar strings formatadas que são automaticamente convertidas

#### Resumo dos Formatos por Camada
| Camada | Campo DATA | Campo ORÇAMENTO |
|--------|-----------|-----------------|
| **Planilha Google (armazenamento interno)** | Excel Serial com fração (45581.703) | Excel Serial inteiro (45581) |
| **Sheets API → Backend (leitura)** | Serial number unformatted (45581.703) | Serial number unformatted (45581) |
| **Backend → Frontend (GET)** | Serial number (45581.703) - SEM conversão | Serial number (45581) - SEM conversão |
| **Frontend (exibição/leitura)** | Convertido via `excelSerialToDate(s, true)` → "20/10/2025 16:52" | Convertido via `excelSerialToDate(s, false)` → "31/10/2025" |
| **Formulário (input HTML5)** | `datetime-local`: "2025-10-20T16:52" | `date`: "2025-10-31" |
| **Frontend → Backend (POST)** | String formatada: "31/10/2025 14:41" | String formatada: "31/10/2025" |
| **Backend → Sheets API (escrita)** | String enviada como está (Sheets converte internamente) | String enviada como está (Sheets converte internamente) |

**IMPORTANTE**: 
- **Leitura**: O Google Sheets retorna valores `unformatted` (Excel Serial numbers). O frontend usa helpers para converter para Date/String legível.
- **Escrita**: O frontend pode enviar strings formatadas (ex: "31/10/2025 14:41") e o Google Sheets com `valueInputOption=USER_ENTERED` interpreta e converte automaticamente para Excel Serial internamente.

#### Funções Auxiliares (Frontend)
```javascript
// Conversão JS Date → Excel Serial (com hora)
toExcelSerial(date, dataHora = true)

// Conversão JS Date → Excel Serial (somente dia, inteiro)
// USA MEIO-DIA (12:00) INTERNAMENTE para evitar timezone issues
toExcelSerialDia(date)

// Conversão Excel Serial → JS Date
excelSerialToDate(serial, dataHora = false)

// Formatação para exibição "DD/MM/YYYY"
excelSerialToMonthLabel(serial)

// Helpers para inputs HTML5
dateInputToDate(dateString)      // 'YYYY-MM-DD' → Date às 12:00
dateTimeLocalToDate(datetimeStr) // 'YYYY-MM-DDTHH:MM' → Date com hora
```

**Localização:** `src/utils/date-helpers.ts` (exportados via `src/types/index.ts`)

### 3.2 Aba de Categorias (ex.: CATEGORIAS)
| Coluna | Campo     | Tipo  | Observação |
|--------|-----------|-------|-----------|
| A      | categoria | Texto | Nome único da categoria (chave) |
| B      | tipo      | Texto | Livre ou controlado (ex.: "despesa", "receita") |

**Regras recomendadas:**
- A coluna `categoria` da aba LANCAMENTOS deve referenciar (por validação de dados no Google Sheets, se possível) uma entrada existente na coluna `categoria` da aba CATEGORIAS.
- O campo `tipo` pode ser usado futuramente para relatórios agregados (ex.: separar fluxo de caixa por tipo).
- Opcional: Configurar validação de dados no Google Sheets para a coluna E (categoria) apontando para o intervalo `CATEGORIAS!A:A`.

---

## 4. Fluxos Principais

### 4.1 Onboarding OAuth
1. Usuário cria conta e autentica no PocketBase.
2. Frontend gera PKCE (code_verifier + code_challenge) e state assinado.
3. Redireciona para endpoint de autorização Google.
4. Google redireciona para `/google-oauth-callback?code=...&state=...`
5. Hook valida state, troca code por tokens, salva tokens + `expires_at`.

### 4.2 Provisionamento da Planilha
1. Usuário aciona `POST /provision-sheet`.
2. Hook verifica se já existe `sheet_id`; se existir pode retornar 409 ou reutilizar.
3. Copia template (Drive API).
4. Atualiza `sheet_id` no registro.

### 4.3 Inserção de Lançamentos
1. Usuário preenche formulário:
   - **Data**: campo `datetime-local` coleta data e hora (ex.: `2025-10-20T16:52`)
   - **Orçamento**: campo `date` coleta apenas data (ex.: `2025-10-31`)
   - **Valor**: número (positivo=receita, negativo=despesa)
   - **Conta, Descrição, Categoria**: texto
2. Frontend formata ambos os campos de data para formato brasileiro (DD/MM/YYYY ou DD/MM/YYYY HH:mm)
3. Frontend envia `POST /append-entry` com payload:
   ```json
   {
     "data": "31/10/2025 14:41",
     "conta": "Banco",
     "valor": -150.50,
     "descricao": "Supermercado",
     "categoria": "Alimentação",
     "orcamento": "31/10/2025"
   }
   ```
4. Hook resolve `userId` via `request.auth`, obtém `google_infos`
5. Hook valida `expires_at`; se expirado → refresh automático
6. Hook monta array de valores:
   ```javascript
   [["31/10/2025 14:41", "Banco", -150.50, "Supermercado", "Alimentação", "31/10/2025", ""]]
   ```
7. Chama Sheets API `values:append` em `LANCAMENTOS!A:G` com `valueInputOption=USER_ENTERED`
8. Google Sheets interpreta automaticamente:
   - String datetime "31/10/2025 14:41" → Converte internamente para Excel Serial com hora
   - String date "31/10/2025" → Converte internamente para Excel Serial sem hora
9. Hook atualiza `last_success_append_at`
10. Retorna sucesso ao frontend
11. Frontend recebe confirmação e atualiza UI (ou recarrega dados)

**Importante sobre leitura posterior**: Quando o frontend busca lançamentos via `GET /get-sheet-entries`, o Google Sheets retorna valores `unformatted` (Excel Serial numbers). O frontend então usa os helpers de conversão (`excelSerialToDate`) para exibir as datas de forma legível.

(Validação futura: antes do append, opcionalmente ler `CATEGORIAS!A:A` para garantir que a categoria informada existe; em caso de ausência, retornar erro padronizado.)

---

## 5. Endpoints Custom

### 5.1 GET /google-oauth-callback
```javascript
routerAdd("GET", "/google-oauth-callback", (c) => {
  // 1. Validar state (anti-CSRF)
  // 2. Trocar code por tokens via oauth.js
  // 3. Salvar tokens e calcular expires_at
  // 4. Redirecionar para dashboard
});
```
**Localização:** `pb_hooks/google-oauth-callback.pb.js`

### 5.2 POST /google-refresh-token
```javascript
routerAdd("POST", "/google-refresh-token", (c) => {
  // 1. Verificar autenticação
  // 2. Pegar refresh_token do usuário
  // 3. Obter novos tokens
  // 4. Atualizar no banco
});
```
**Descrição:** Renova `access_token` usando `refresh_token`

### 5.3 POST /provision-sheet
```javascript
routerAdd("POST", "/provision-sheet", (c) => {
  // 1. Verificar autenticação
  // 2. Se já tem sheet_id: 409 ou reutilizar
  // 3. Copiar template via Drive API
  // 4. Atualizar sheet_id
});
```
**Descrição:** Copia template e grava `sheet_id`

### 5.4 POST /append-entry
```javascript
routerAdd("POST", "/append-entry", (c) => {
  // 1. Extrair dados do request (NÃO enviar userId do frontend)
  // 2. Validar campos (data, valor)
  // 3. Verificar expires_at e refresh se necessário
  // 4. Append via Sheets API (LANCAMENTOS!A:G)
  // 5. Atualizar last_success_append_at
});
```
**Descrição:** Payload contém campos como `data`, `conta`, `valor`, `descricao`, `categoria`; hook escreve em `LANCAMENTOS!A:G`

---

## 6. Variáveis de Ambiente
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://seu-dominio.com/google-oauth-callback
```

**Importante:** Defina variáveis de ambiente em um `.env` na raiz (ver `pb_hooks/README.md` e `arquitetura.md`).

---

## 7. Segurança

- **OAuth**: PKCE para cliente público + state assinado para evitar CSRF.
- **Tokens**: armazenar `expires_at`, refresh automático.
- **Frontend**: não enviar userId explícito, usar auth do PocketBase (`request.auth`).
- **Regras de acesso**: baseadas em `@request.auth.id`.

---

## 8. Frontend Ajustes (dashboard)
- Não enviar userId no payload.
- Mostrar estado:
  - Se não provisionado → botão "Provisionar Planilha".
  - Se provisionado → formulário habilitado.
- Tratar erros uniformemente:
  ```js
  if (!resp.ok) {
    const err = await resp.json();
    alert(err.error?.message || 'Erro inesperado.');
    return;
  }
  ```

---

## 9. Escalabilidade & Operações

- **Backups SQLite**: a cada 6h + retenção 7 dias + teste de restauração semanal.
- **Monitorar limites (Drive/Sheets)**: retry exponencial em 429/5xx.

---

## 10. Utilitários (pb_hooks/_lib/)
_criar arquivos de apoio_

- oauth.js
  - exchangeCodeForTokens(code, codeVerifier)
  - refreshToken(refreshToken)
- tokens.js
  - isExpired(expires_at)
  - computeExpiresAt(expires_in)
- googleFetch.js
  - googleFetch(url, opts, { userId, autoRefresh: true })

---

## 11. Logs
Formato sugerido (stdout):
```json
{"ts":"2025-08-14T19:00:00Z","userId":"abc123","action":"append-entry","success":true,"latencyMs":42}
```

---

## 12. Testes (Lista mínima)
- OAuth inicial (state válido / inválido)
- Refresh automático no append
- Append com planilha não provisionada
- Provisionar duas vezes (deve bloquear)

---

## 13. Debug e Operações Comuns

- **Ver banco SQLite**: `pb_data/data.db` (abra com DB Browser for SQLite para inspecionar registros durante dev).
- **Logs**: execute `./pocketbase serve --dev` via `iniciar-pb.sh` e observe stdout; hooks usam `console.log` em pontos-chave.
- **Erros de token/Sheets**: ver `pb_hooks/google-endpoints.pb.js` para padrões de retry e refresh automático (busca refresh_token e re-tenta 401).

---

## 14. Roadmap Futuro
- Login e cadastro OAuth google
- Novos tipos de lançamentos (lançamento futuro, transferência, pagamento parcelado)
- Ver lançamentos da categoria selecionada
- Melhorar a IA para processamento da imagem e geração de lançamentos

---

## 15. Os detalhes
- Mensagens via toast, converter para um componente user base da pagina de configuração
- Alert para revogar o token google, configuar para alinhar para um modal com aparencia do modal delete e utros entry-form edit-entry-form
- Botão de adicionar na página de lançamentos ao editar uma transação o simbolo "+" se desloca um pouco para a direita