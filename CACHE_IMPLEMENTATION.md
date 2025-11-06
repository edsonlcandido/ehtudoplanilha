# Implementação de Cache para get-sheet-entries e get-sheet-categories

## Resumo

Esta implementação adiciona um sistema de cache no localStorage para otimizar as requisições aos endpoints `/get-sheet-entries` e `/get-sheet-categories`, reduzindo drasticamente o tempo de carregamento nas páginas de dashboard e lançamentos.

## Arquitetura

### 1. CacheService (`src/services/cache.ts`)

Serviço centralizado para gerenciar cache no localStorage:

- **TTL**: 5 minutos (300.000ms)
- **Armazenamento**: localStorage do browser
- **Estrutura dos dados**:
  ```typescript
  {
    data: T,              // Dados em cache
    timestamp: number,    // Momento em que foi salvo
    expiresAt: number     // Momento de expiração
  }
  ```

**Chaves de cache:**
- `SHEET_ENTRIES`: Cache de lançamentos
- `SHEET_CATEGORIES`: Cache de categorias

**Métodos principais:**
- `set(key, data, ttl)`: Salva dados no cache
- `get(key)`: Recupera dados (null se expirado)
- `clear(key)`: Remove item específico
- `clearAll()`: Remove todos os caches da aplicação
- `isValid(key)`: Verifica se cache está válido
- `getInfo(key)`: Retorna informações de debug

### 2. Modificações no LancamentosService

#### `fetchEntries(limit, forceRefresh)`

Fluxo de execução:

1. **Se forceRefresh = false** (padrão):
   - Verifica se existe cache válido
   - Se sim, retorna dados do cache (muito rápido)
   - Se não, busca do servidor

2. **Se forceRefresh = true**:
   - Ignora cache completamente
   - Busca dados do servidor
   - Atualiza cache com novos dados

3. **Lógica de limite**:
   - `limit = 0`: retorna todos os dados (sem limite)
   - `limit > 0`: retorna no máximo N entradas
   - Cache sempre armazena resultado completo

#### `invalidateCache()`

Limpa os caches de lançamentos e categorias. Chamado automaticamente após:
- `editEntry()`
- `deleteEntry()`

### 3. Modificações no SheetsService

#### `getSheetCategories(forceRefresh)`

Similar ao fetchEntries, verifica cache antes de buscar do servidor.

**Invalidação de cache adicionada em:**
- `appendEntry()`: após adicionar lançamento
- `editEntry()`: após editar lançamento
- `deleteEntry()`: após deletar lançamento

### 4. Modais que usam cache de categorias

#### Entry Modal (`src/components/entry-modal.ts`)
Usa `SheetsService.getSheetCategories()` em vez de fetch direto.

#### Future Entry Modal (`src/components/future-entry-modal.ts`)
Usa `SheetsService.getSheetCategories()` em vez de fetch direto.

**Resultado**: Elimina chamadas duplicadas ao `/get-sheet-categories`

### 5. Páginas que usam cache

#### Dashboard (`src/dashboard/dashboard.ts`)
```typescript
// Busca com cache (limit=0 = todas as entradas)
const data = await lancamentosService.fetchEntries(0, false);
```

#### Lançamentos (`src/dashboard/lancamentos.ts`)

**Carregamento normal:**
```typescript
// Usa cache se disponível
await loadEntries(false);
```

**Botão "Recarregar":**
```typescript
// Força atualização ignorando cache
await loadEntries(true);
```

### 6. Limpeza ao Logout

O `AuthService` foi modificado para limpar todos os caches ao fazer logout:

```typescript
export function logout(): void {
  CacheService.clearAll();  // Limpa caches
  pb.authStore.clear();     // Limpa autenticação
}
```

## Comportamento

### Primeira carga (cache vazio)
1. Usuário acessa dashboard ou lançamentos
2. `fetchEntries()` não encontra cache
3. Faz requisição HTTP para `/get-sheet-entries`
4. `getSheetCategories()` não encontra cache
5. Faz requisição HTTP para `/get-sheet-categories`
6. Salva ambas respostas no localStorage
7. Retorna dados

**Tempo**: ~500-2000ms (dependendo da rede e tamanho dos dados)
**Network**: 2 requests (get-sheet-entries + get-sheet-categories)

### Cargas subsequentes (cache válido)
1. Usuário acessa dashboard ou lançamentos
2. `fetchEntries()` encontra cache válido
3. `getSheetCategories()` encontra cache válido
4. Retorna dados do localStorage
5. **Não faz requisição HTTP**

**Tempo**: ~5-20ms (96-99% mais rápido!)
**Network**: 0 requests

### Após 5 minutos (cache expirado)
1. Cache expira automaticamente
2. Próxima carga funciona como "primeira carga"
3. Cache é renovado

### Botão Recarregar (forceRefresh)
1. Usuário clica em "Recarregar" na página de lançamentos
2. `loadEntries(true)` é chamado
3. Cache é ignorado
4. Busca dados frescos do servidor
5. Atualiza cache

### Após operações de modificação
1. Usuário adiciona/edita/deleta lançamento
2. Ambos os caches são invalidados automaticamente
3. Próxima carga busca dados atualizados

## Teste Manual

### Verificar cache funcionando:

1. **Abrir DevTools** (F12) → Console
2. **Primeira carga:**
   ```
   [LancamentosService] Buscando dados do servidor
   [Cache] Dados salvos: ehtudoplanilha:sheet-entries (TTL: 300000ms)
   [SheetsService] Buscando categorias do servidor
   [Cache] Dados salvos: ehtudoplanilha:sheet-categories (TTL: 300000ms)
   ```

3. **Segunda carga (< 5 min):**
   ```
   [LancamentosService] Usando dados do cache
   [Cache] Cache hit: ehtudoplanilha:sheet-entries (idade: 15s)
   [SheetsService] Usando categorias do cache
   [Cache] Cache hit: ehtudoplanilha:sheet-categories (idade: 15s)
   ```

4. **Após clicar em Recarregar:**
   ```
   [LancamentosService] Buscando dados do servidor
   [Cache] Dados salvos: ehtudoplanilha:sheet-entries (TTL: 300000ms)
   ```

### Verificar no Network tab:

1. **DevTools** → Network
2. **Primeira carga**: 2 requests
   - GET `/get-sheet-entries` ✓
   - GET `/get-sheet-categories` ✓
3. **Segunda carga**: 0 requests ✓

### Verificar no localStorage:

1. **DevTools** → Application → Local Storage
2. Procurar chaves:
   - `ehtudoplanilha:sheet-entries` ✓
   - `ehtudoplanilha:sheet-categories` ✓
3. Ver estrutura JSON com data, timestamp, expiresAt

## Benefícios

1. **Performance**: 96-99% mais rápido em cargas subsequentes
2. **Redução de carga no servidor**: Menos requisições ao PocketBase/Google Sheets
3. **Melhor UX**: Interface responde instantaneamente
4. **Economia de dados**: Para usuários com planos limitados
5. **Funciona offline**: Dados em cache disponíveis sem internet (por até 5 min)
6. **Elimina duplicação**: get-sheet-categories era chamado 2x por página

## Bug Corrigido

**Problema**: Cache não funcionava por erro de digitação
- Código errado: `pb.baseUrl` (minúsculo)
- Código correto: `pb.baseURL` (maiúsculo)
- **Commit**: 494218c

## Considerações de Segurança

- ✅ Dados em localStorage são específicos do domínio
- ✅ Cache é limpo automaticamente ao fazer logout
- ✅ TTL de 5 minutos evita dados muito desatualizados
- ✅ Token de autenticação não é armazenado no cache (já gerenciado pelo PocketBase)
- ✅ Invalidação automática após modificações

## Manutenção

### Adicionar novos tipos de cache:

1. Adicionar chave em `CACHE_KEYS`:
   ```typescript
   export const CACHE_KEYS = {
     SHEET_ENTRIES: 'ehtudoplanilha:sheet-entries',
     SHEET_CATEGORIES: 'ehtudoplanilha:sheet-categories',
     NEW_CACHE: 'ehtudoplanilha:new-cache',  // Adicionar aqui
   } as const;
   ```

2. Usar nos serviços:
   ```typescript
   CacheService.set(CACHE_KEYS.NEW_CACHE, data);
   const cached = CacheService.get(CACHE_KEYS.NEW_CACHE);
   ```

### Ajustar TTL:

Modificar `DEFAULT_TTL` em `src/services/cache.ts`:
```typescript
private static readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutos
```

Ou passar TTL customizado:
```typescript
CacheService.set(key, data, 60 * 1000); // 1 minuto
```

## Troubleshooting

### Cache não está sendo usado:
- Verificar console do browser para logs `[Cache]`
- Verificar localStorage no DevTools
- Limpar cache manualmente: `localStorage.clear()`
- Verificar se não há erro de digitação (baseUrl vs baseURL)

### Dados desatualizados:
- Clicar em "Recarregar" para forçar atualização
- Aguardar 5 minutos para expiração automática
- Fazer logout/login (limpa todos os caches)

### Quota exceeded error:
- localStorage tem limite de ~5-10MB
- Cache é limpo automaticamente ao fazer logout
- Implementar limpeza de caches antigos se necessário

### get-sheet-categories sendo chamado múltiplas vezes:
- ✅ Corrigido: agora usa cache compartilhado
- Modais usam `SheetsService.getSheetCategories()` com cache
- Apenas 1 request na primeira carga

## Arquitetura

### 1. CacheService (`src/services/cache.ts`)

Serviço centralizado para gerenciar cache no localStorage:

- **TTL**: 5 minutos (300.000ms)
- **Armazenamento**: localStorage do browser
- **Estrutura dos dados**:
  ```typescript
  {
    data: T,              // Dados em cache
    timestamp: number,    // Momento em que foi salvo
    expiresAt: number     // Momento de expiração
  }
  ```

**Métodos principais:**
- `set(key, data, ttl)`: Salva dados no cache
- `get(key)`: Recupera dados (null se expirado)
- `clear(key)`: Remove item específico
- `clearAll()`: Remove todos os caches da aplicação
- `isValid(key)`: Verifica se cache está válido
- `getInfo(key)`: Retorna informações de debug

### 2. Modificações no LancamentosService

#### `fetchEntries(limit, forceRefresh)`

Fluxo de execução:

1. **Se forceRefresh = false** (padrão):
   - Verifica se existe cache válido
   - Se sim, retorna dados do cache (muito rápido)
   - Se não, busca do servidor

2. **Se forceRefresh = true**:
   - Ignora cache completamente
   - Busca dados do servidor
   - Atualiza cache com novos dados

3. **Lógica de limite**:
   - `limit = 0`: retorna todos os dados (sem limite)
   - `limit > 0`: retorna no máximo N entradas
   - Cache sempre armazena resultado completo

#### `invalidateCache()`

Limpa o cache de lançamentos. Chamado automaticamente após:
- `editEntry()`
- `deleteEntry()`

### 3. Modificações no SheetsService

Invalidação de cache adicionada em:
- `appendEntry()`: após adicionar lançamento
- `editEntry()`: após editar lançamento
- `deleteEntry()`: após deletar lançamento

### 4. Páginas que usam cache

#### Dashboard (`src/dashboard/dashboard.ts`)
```typescript
// Busca com cache (limit=0 = todas as entradas)
const data = await lancamentosService.fetchEntries(0, false);
```

#### Lançamentos (`src/dashboard/lancamentos.ts`)

**Carregamento normal:**
```typescript
// Usa cache se disponível
await loadEntries(false);
```

**Botão "Recarregar":**
```typescript
// Força atualização ignorando cache
await loadEntries(true);
```

### 5. Limpeza ao Logout

O `AuthService` foi modificado para limpar todos os caches ao fazer logout:

```typescript
export function logout(): void {
  CacheService.clearAll();  // Limpa caches
  pb.authStore.clear();     // Limpa autenticação
}
```

## Comportamento

### Primeira carga (cache vazio)
1. Usuário acessa dashboard ou lançamentos
2. `fetchEntries()` não encontra cache
3. Faz requisição HTTP para `/get-sheet-entries`
4. Salva resposta no localStorage
5. Retorna dados

**Tempo**: ~500-2000ms (dependendo da rede e tamanho dos dados)

### Cargas subsequentes (cache válido)
1. Usuário acessa dashboard ou lançamentos
2. `fetchEntries()` encontra cache válido
3. Retorna dados do localStorage
4. **Não faz requisição HTTP**

**Tempo**: ~5-20ms (96-99% mais rápido!)

### Após 5 minutos (cache expirado)
1. Cache expira automaticamente
2. Próxima carga funciona como "primeira carga"
3. Cache é renovado

### Botão Recarregar (forceRefresh)
1. Usuário clica em "Recarregar" na página de lançamentos
2. `loadEntries(true)` é chamado
3. Cache é ignorado
4. Busca dados frescos do servidor
5. Atualiza cache

### Após operações de modificação
1. Usuário adiciona/edita/deleta lançamento
2. Cache é invalidado automaticamente
3. Próxima carga busca dados atualizados

## Teste Manual

### Verificar cache funcionando:

1. **Abrir DevTools** (F12) → Console
2. **Primeira carga:**
   ```
   [LancamentosService] Buscando dados do servidor
   [Cache] Dados salvos: ehtudoplanilha:sheet-entries (TTL: 300000ms)
   ```

3. **Segunda carga (< 5 min):**
   ```
   [LancamentosService] Usando dados do cache
   [Cache] Cache hit: ehtudoplanilha:sheet-entries (idade: 15s)
   ```

4. **Após clicar em Recarregar:**
   ```
   [LancamentosService] Buscando dados do servidor
   [Cache] Dados salvos: ehtudoplanilha:sheet-entries (TTL: 300000ms)
   ```

### Verificar no localStorage:

1. **DevTools** → Application → Local Storage
2. Procurar chave: `ehtudoplanilha:sheet-entries`
3. Ver estrutura:
   ```json
   {
     "data": {
       "success": true,
       "entries": [...],
       "total": 150,
       "limit": 100
     },
     "timestamp": 1699276800000,
     "expiresAt": 1699277100000
   }
   ```

## Benefícios

1. **Performance**: 96-99% mais rápido em cargas subsequentes
2. **Redução de carga no servidor**: Menos requisições ao PocketBase/Google Sheets
3. **Melhor UX**: Interface responde instantaneamente
4. **Economia de dados**: Para usuários com planos limitados
5. **Funciona offline**: Dados em cache disponíveis sem internet (por até 5 min)

## Considerações de Segurança

- ✅ Dados em localStorage são específicos do domínio
- ✅ Cache é limpo automaticamente ao fazer logout
- ✅ TTL de 5 minutos evita dados muito desatualizados
- ✅ Token de autenticação não é armazenado no cache (já gerenciado pelo PocketBase)
- ✅ Invalidação automática após modificações

## Manutenção

### Adicionar novos tipos de cache:

1. Adicionar chave em `CACHE_KEYS`:
   ```typescript
   export const CACHE_KEYS = {
     SHEET_ENTRIES: 'ehtudoplanilha:sheet-entries',
     NEW_CACHE: 'ehtudoplanilha:new-cache',  // Adicionar aqui
   } as const;
   ```

2. Usar nos serviços:
   ```typescript
   CacheService.set(CACHE_KEYS.NEW_CACHE, data);
   const cached = CacheService.get(CACHE_KEYS.NEW_CACHE);
   ```

### Ajustar TTL:

Modificar `DEFAULT_TTL` em `src/services/cache.ts`:
```typescript
private static readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutos
```

Ou passar TTL customizado:
```typescript
CacheService.set(key, data, 60 * 1000); // 1 minuto
```

## Troubleshooting

### Cache não está sendo usado:
- Verificar console do browser para logs `[Cache]`
- Verificar localStorage no DevTools
- Limpar cache manualmente: `localStorage.clear()`

### Dados desatualizados:
- Clicar em "Recarregar" para forçar atualização
- Aguardar 5 minutos para expiração automática
- Fazer logout/login (limpa todos os caches)

### Quota exceeded error:
- localStorage tem limite de ~5-10MB
- Cache é limpo automaticamente ao fazer logout
- Implementar limpeza de caches antigos se necessário
