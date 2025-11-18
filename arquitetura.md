# Arquitetura do SaaS Planilha Eh Tudo

## 1. Visão Geral
SaaS multi-tenant onde cada usuário gerencia lançamentos financeiros em sua própria planilha do Google Sheets.  
Backend: PocketBase (SQLite) com hooks customizados para OAuth Google e escrita em Sheets.

## 2. Multi-Tenancy e Isolamento
- Estratégia: Banco único, coleções compartilhadas com regras de acesso restritivas.
- Coleções:
  - users (nativa: email + senha)
  - google_infos
    - user_id (rel 1:1 → users)
    - access_token
    - refresh_token (criptografado opcional)
    - sheet_id
    - sheet_name
    - created
    - updated
- Regras (versão PocketBase ≥ 0.28):
  - users:  
    read/write: `@request.auth.id = @record.id`
  - google_infos:  
    read/write: `@request.auth.id = @record.user_id`

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
| B      | tipo      | Texto | Livre ou controlado (ex.: "QUERO", "PRECISO", "RENDA","INVESTIMENTOS") |
| C | limite | Numero | 

Regras recomendadas:
- A coluna `categoria` da aba LANCAMENTOS deve referenciar (por validação de dados no Google Sheets, se possível) uma entrada existente na coluna `categoria` da aba CATEGORIAS.
- O campo `tipo` pode ser usado futuramente para relatórios agregados (ex.: separar fluxo de caixa por tipo).
- Opcional: Configurar validação de dados no Google Sheets para a coluna E (categoria) apontando para o intervalo `CATEGORIAS!A:A`.

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

#### 4.3.1 Lançamento Normal (Receita/Despesa)
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
11. Frontend **invalida cache** automaticamente (entries e categories)
12. Frontend recebe confirmação e recarrega página para exibir novo lançamento

**Importante sobre leitura posterior**: Quando o frontend busca lançamentos via `GET /get-sheet-entries`, o Google Sheets retorna valores `unformatted` (Excel Serial numbers). O frontend então usa os helpers de conversão (`excelSerialToDate`) para exibir as datas de forma legível.

(Validação futura: antes do append, opcionalmente ler `CATEGORIAS!A:A` para garantir que a categoria informada existe; em caso de ausência, retornar erro padronizado.)

#### 4.3.2 Lançamento Futuro
**Objetivo**: Criar lançamento planejado sem data/conta definida, a ser preenchido posteriormente.

1. Usuário preenche formulário simplificado:
   - **Orçamento**: campo `date` obrigatório (ex.: `2025-11-30`)
   - **Valor**: número (positivo=receita, negativo=despesa)
   - **Descrição**: texto obrigatório
   - **Categoria**: texto obrigatório
   - **Observação**: texto opcional
   - **Data e Conta**: deixadas em branco intencionalmente
2. Frontend formata orçamento para formato brasileiro (DD/MM/YYYY)
3. Frontend envia `POST /append-entry` com payload:
   ```json
   {
     "data": "",
     "conta": "",
     "valor": -250.00,
     "descricao": "Conta de luz",
     "categoria": "Contas",
     "orcamento": "30/11/2025",
     "observacao": "Vencimento estimado"
   }
   ```
4. Hook processa normalmente e insere linha na planilha:
   ```javascript
   [["", "", -250.00, "Conta de luz", "Contas", "30/11/2025", "Vencimento estimado"]]
   ```
5. Lançamento fica visível na planilha como "futuro" (sem data efetiva)
6. Frontend **invalida cache** automaticamente
7. Frontend recarrega página
8. **Completar lançamento futuro**: Usuário pode editar o lançamento posteriormente para adicionar data e conta quando efetivado

**Casos de uso**:
- Planejar despesas recorrentes (contas, parcelas)
- Orçamento mensal sem datas específicas
- Lançamentos a confirmar

#### 4.3.3 Transferência entre Contas
**Objetivo**: Movimentar valor entre duas contas sem impactar saldo total.

1. Usuário preenche formulário de transferência:
   - **Data**: campo `datetime-local` coleta data e hora (ex.: `2025-10-20T10:00`)
   - **Conta Origem**: texto obrigatório (ex.: "Banco A")
   - **Conta Destino**: texto obrigatório (ex.: "Banco B")
   - **Valor**: número positivo (ex.: 500.00)
   - **Orçamento**: campo `date` obrigatório
   - **Descrição**: texto (opcional, padrão: "Transferência: [origem] → [destino]")
   - **Categoria**: "Transferência" (categoria especial para transferências)
2. Frontend formata datas e cria **dois lançamentos**:
   - **Saída** (débito na conta origem):
     ```json
     {
       "data": "20/10/2025 10:00",
       "conta": "Banco A",
       "valor": -500.00,
       "descricao": "Transferência: Banco A → Banco B",
       "categoria": "Transferência",
       "orcamento": "31/10/2025"
     }
     ```
   - **Entrada** (crédito na conta destino):
     ```json
     {
       "data": "20/10/2025 10:00",
       "conta": "Banco B",
       "valor": 500.00,
       "descricao": "Transferência: Banco A → Banco B",
       "categoria": "Transferência",
       "orcamento": "31/10/2025"
     }
     ```
3. Frontend envia **duas requisições** `POST /append-entry` sequencialmente
4. Hook processa cada lançamento normalmente
5. Resultado na planilha: duas linhas com valores opostos e mesma descrição
6. Frontend **invalida cache** após ambas as inserções
7. Frontend recarrega página

**Características**:
- **Saldo neutro**: soma dos valores é zero (-500 + 500 = 0)
- **Rastreabilidade**: mesma descrição e timestamp facilita identificação
- **Categoria especial**: "Transferência" permite filtrar/excluir de relatórios de despesas
- **Atômica no frontend**: ambas as operações devem ser concluídas ou nenhuma

**Casos de uso**:
- Transferências entre contas bancárias
- Movimentação entre carteira e banco
- Aporte em investimentos
- Pagamento de cartão com conta corrente

## 5. Endpoints Custom (Resumo)
- `GET /google-oauth-callback`
- `POST /google-refresh-token`
- `POST /provision-sheet`
- `POST /append-entry`

## 6. Segurança
- OAuth: PKCE para cliente público + state assinado para evitar CSRF.
- Tokens: armazenar `expires_at`, refresh automático.
- Frontend: não enviar userId explícito, usar auth do PocketBase.
- Regras de acesso: baseadas em `@request.auth.id`.

## 7. Escalabilidade & Operações
- Backups SQLite: a cada 6h + retenção 7 dias + teste de restauração semanal.
- Monitorar limites (Drive/Sheets) → retry exponencial em 429/5xx.

## 8. Variáveis de Ambiente
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://seu-dominio.com/google-oauth-callback
```

## 9. Sistema de Cache (LocalStorage)

### 9.1 Visão Geral
Sistema de cache no localStorage para otimizar requisições aos endpoints `get-sheet-entries` e `get-sheet-categories`, reduzindo latência e carga no servidor.

### 9.2 Implementação

#### CacheService (`src/services/cache.ts`)
Serviço centralizado para gerenciar cache com TTL (Time To Live).

**Características:**
- **TTL padrão**: 5 minutos (300.000ms)
- **Armazenamento**: localStorage do browser
- **Chaves de cache**:
  - `ehtudoplanilha:sheet-entries` - Cache de lançamentos
  - `ehtudoplanilha:sheet-categories` - Cache de categorias

**Estrutura dos dados em cache:**
```typescript
{
  data: T,              // Dados armazenados
  timestamp: number,    // Momento da criação do cache
  expiresAt: number     // Momento de expiração (timestamp + TTL)
}
```

**Métodos principais:**
- `set(key, data, ttl?)` - Salva dados no cache
- `get(key)` - Recupera dados (retorna null se expirado)
- `clear(key)` - Remove item específico
- `clearAll()` - Remove todos os caches da aplicação
- `isValid(key)` - Verifica se cache está válido
- `getInfo(key)` - Retorna informações de debug

### 9.3 Integração com Serviços

#### LancamentosService (`src/services/lancamentos.ts`)
```typescript
async fetchEntries(limit = 100, forceRefresh = false): Promise<SheetEntriesResponse> {
  // Se não for forceRefresh, tenta usar o cache
  if (!forceRefresh) {
    const cached = CacheService.get<SheetEntriesResponse>(CACHE_KEYS.SHEET_ENTRIES);
    if (cached) {
      console.log('[LancamentosService] Usando dados do cache');
      return cached;
    }
  }
  
  // Busca do servidor
  const data = await fetch(`${pb.baseURL}/get-sheet-entries?limit=${limit}`);
  
  // Salva no cache
  CacheService.set(CACHE_KEYS.SHEET_ENTRIES, data);
  
  return data;
}
```

**Parâmetros:**
- `limit`: Número de entradas a retornar (0 = todas)
- `forceRefresh`: Se `true`, ignora cache e busca do servidor

#### SheetsService (`src/services/sheets.ts`)
```typescript
static async getSheetCategories(forceRefresh = false): Promise<string[]> {
  // Verifica cache primeiro
  if (!forceRefresh) {
    const cached = CacheService.get<{ categories: string[] }>(CACHE_KEYS.SHEET_CATEGORIES);
    if (cached) {
      return cached.categories || [];
    }
  }
  
  // Busca do servidor e salva no cache
  const response = await pb.send<{ categories: string[] }>(API_ENDPOINTS.getSheetCategories);
  CacheService.set(CACHE_KEYS.SHEET_CATEGORIES, response);
  
  return response.categories || [];
}
```

### 9.4 Invalidação Automática de Cache

O cache é **automaticamente invalidado** nas seguintes operações:

**Após adicionar lançamento** (`SheetsService.appendEntry()`):
```typescript
await pb.send(API_ENDPOINTS.appendEntry, { method: 'POST', body: entry });

// Invalida ambos os caches
CacheService.clear(CACHE_KEYS.SHEET_ENTRIES);
CacheService.clear(CACHE_KEYS.SHEET_CATEGORIES);
```

**Após editar lançamento** (`SheetsService.editEntry()`):
```typescript
await pb.send(API_ENDPOINTS.editSheetEntry, { method: 'PUT', body: { rowIndex, ...entry } });

// Invalida ambos os caches
CacheService.clear(CACHE_KEYS.SHEET_ENTRIES);
CacheService.clear(CACHE_KEYS.SHEET_CATEGORIES);
```

**Após deletar lançamento** (`SheetsService.deleteEntry()` e `LancamentosService.deleteEntry()`):
```typescript
await pb.send(API_ENDPOINTS.deleteSheetEntry, { method: 'DELETE', body: { rowIndex } });

// Invalida ambos os caches
CacheService.clear(CACHE_KEYS.SHEET_ENTRIES);
CacheService.clear(CACHE_KEYS.SHEET_CATEGORIES);
```

**Ao fazer logout** (`AuthService.logout()`):
```typescript
export function logout(): void {
  CacheService.clearAll();  // Limpa todos os caches
  pb.authStore.clear();     // Limpa autenticação
}
```

### 9.5 Uso nos Componentes

#### Modais (Entry, Future, Transfer)
Todos os modais usam o cache compartilhado:
```typescript
// Carregamento de dados para autocomplete
const response = await lancamentosService.fetchEntries(0, false);
this.entries = response?.entries ?? [];

// Carregamento de categorias
this.categories = await SheetsService.getSheetCategories();
```

#### Página de Lançamentos
```typescript
// Carregamento normal (usa cache)
async function loadEntries(forceRefresh = false): Promise<void> {
  const response = await lancamentosService.fetchEntries(100, forceRefresh);
  // ...
}

// Botão "Recarregar" - força atualização
refreshBtn.addEventListener('click', () => {
  loadEntries(true); // forceRefresh=true
});
```

#### Dashboard
```typescript
// Busca todas as entradas com cache
const data = await lancamentosService.fetchEntries(0, false);
```

### 9.6 Fluxo de Funcionamento

**1ª carga (cache vazio):**
1. Usuário acessa página
2. `fetchEntries()` não encontra cache
3. Faz requisição HTTP para `/get-sheet-entries`
4. Salva resposta no localStorage
5. Retorna dados

**Tempo**: ~500-2000ms (dependendo da rede)
**Network**: 2 requests (get-sheet-entries + get-sheet-categories)

**2ª carga (< 5 min, cache válido):**
1. Usuário acessa página
2. `fetchEntries()` encontra cache válido
3. Retorna dados do localStorage
4. **Não faz requisição HTTP**

**Tempo**: ~5-20ms (96-99% mais rápido!)
**Network**: 0 requests

**Após 5 minutos (cache expirado):**
1. Cache expira automaticamente
2. Próxima carga funciona como "primeira carga"
3. Cache é renovado

**Após adicionar/editar/deletar:**
1. Operação é executada
2. Cache é invalidado automaticamente
3. Próxima carga busca dados atualizados

### 9.7 Logs do Console

**Cache hit (usando cache):**
```
[LancamentosService] Usando dados do cache
[Cache] Cache hit: ehtudoplanilha:sheet-entries (idade: 15s)
[SheetsService] Usando categorias do cache
[Cache] Cache hit: ehtudoplanilha:sheet-categories (idade: 15s)
```

**Cache miss (buscando do servidor):**
```
[LancamentosService] Buscando dados do servidor
[Cache] Dados salvos: ehtudoplanilha:sheet-entries (TTL: 300000ms)
[SheetsService] Buscando categorias do servidor
[Cache] Dados salvos: ehtudoplanilha:sheet-categories (TTL: 300000ms)
```

**Invalidação após mutação:**
```
[SheetsService] Invalidando caches após adicionar lançamento
[Cache] Cache limpo: ehtudoplanilha:sheet-entries
[Cache] Cache limpo: ehtudoplanilha:sheet-categories
```

### 9.8 Benefícios

- ✅ **Performance**: 96-99% mais rápido em cargas subsequentes
- ✅ **Redução de carga no servidor**: Menos requisições ao PocketBase/Google Sheets
- ✅ **Melhor UX**: Interface responde instantaneamente
- ✅ **Economia de dados**: Para usuários com planos limitados
- ✅ **Funciona offline**: Dados em cache disponíveis sem internet (por até 5 min)
- ✅ **Elimina duplicação**: Endpoints não são mais chamados múltiplas vezes na mesma página

### 9.9 Considerações de Segurança

- ✅ Dados em localStorage são específicos do domínio
- ✅ Cache é limpo automaticamente ao fazer logout
- ✅ TTL de 5 minutos evita dados muito desatualizados
- ✅ Token de autenticação não é armazenado no cache (gerenciado pelo PocketBase)
- ✅ Invalidação automática após modificações garante consistência

## 10. Roadmap Futuro
- Login e cadastro OAuth google
- Melhorar a IA para processamento da imagem e geração de lançamentos

