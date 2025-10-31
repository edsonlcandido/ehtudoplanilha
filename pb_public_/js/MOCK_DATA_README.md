# Mecanismo de Dados Mockados para Desenvolvimento

## 📋 Visão Geral

Este mecanismo permite que você desenvolva e teste o sistema **sem precisar de conexão com o backend real** ou planilhas Google Sheets configuradas. Ele usa arquivos JSON locais para simular as respostas da API.

## 🎯 Objetivo

Resolver o problema de **"não saber quais opções estão disponíveis nas primeiras inserções"** fornecendo dados de exemplo desde o início, especialmente útil para:

- **Autocomplete de contas**: Sugere contas baseadas em lançamentos anteriores
- **Autocomplete de categorias**: Sugere categorias disponíveis
- **Testes sem backend**: Desenvolve e testa funcionalidades offline
- **Ambiente de demonstração**: Mostra o sistema funcionando com dados realistas

## 📁 Arquivos Mockados

### 1. `sheetEntriesResponse.json`
**Localização**: `pb_public_/dashboard/sheetEntriesResponse.json`

Contém lançamentos de exemplo com estrutura:
```json
{
  "entries": [
    {
      "categoria": "Restaurantes",
      "conta": "NUCONTA",
      "data": 45915.35625,
      "descricao": "Ayslan Fazzian",
      "obs": "",
      "orcamento": 45930,
      "rowIndex": 401,
      "valor": -13
    }
  ],
  "success": true,
  "total": 400
}
```

**Usado para extrair**:
- ✅ Contas únicas (campo `conta`)
- ✅ Descrições (campo `descricao`)
- ✅ Observações (campo `obs`)
- ✅ Dados para visualização de lançamentos

### 2. `getSheetCategoriesResponse.json`
**Localização**: `pb_public_/dashboard/getSheetCategoriesResponse.json`

Contém categorias de exemplo:
```json
{
  "categories": [
    "13º salário",
    "Imóvel",
    "Férias",
    "Alimentação",
    "..."
  ],
  "success": true
}
```

**Usado para**:
- ✅ Sugestões de categorias em autocomplete
- ✅ Validação de categorias

## 🔧 Como Funciona

### Ativação Automática

O sistema de dados mockados **ativa automaticamente** quando:

1. **Modo de teste**: `sessionStorage.getItem('testLogin') === 'true'`
2. **Localhost**: Rodando em `localhost` ou `127.0.0.1`

### Fluxo de Dados

```
┌─────────────────────────────────────────┐
│  Componente solicita dados              │
│  (ex: formulário de lançamento)         │
└──────────────────┬──────────────────────┘
                   │
                   v
┌─────────────────────────────────────────┐
│  AccountsService / CategoriesService    │
│  Verifica: mockDataService.shouldUse... │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        v                     v
   ✅ Modo Dev          ❌ Modo Produção
        │                     │
        v                     v
   MockDataService      GoogleSheetsService
   (JSON local)         (API real)
        │                     │
        └──────────┬──────────┘
                   │
                   v
          ┌────────────────┐
          │  Cache Local   │
          │  (5 minutos)   │
          └────────┬───────┘
                   │
                   v
          ┌────────────────┐
          │   Componente   │
          │  (autocomplete)│
          └────────────────┘
```

## 💻 Uso nos Serviços

### AccountsService

```javascript
import mockDataService from './mock-data-service.js';

async getAccounts(forceRefresh = false) {
  // PRIORIDADE 0: Dados mockados em modo dev
  if (mockDataService.shouldUseMockData()) {
    const mockAccounts = await mockDataService.getUniqueAccounts();
    return mockAccounts;
  }
  
  // PRIORIDADE 1: Planilha Google Sheets
  // PRIORIDADE 2: Contas padrão
}
```

### CategoriesService

```javascript
import mockDataService from './mock-data-service.js';

async getCategories(forceRefresh = false) {
  // PRIORIDADE 0: Dados mockados em modo dev
  if (mockDataService.shouldUseMockData()) {
    const mockCategories = await mockDataService.getCategories();
    return mockCategories;
  }
  
  // PRIORIDADE 1: Aba "Categorias" da planilha
  // PRIORIDADE 2: Categorias padrão
}
```

## 🎨 Benefícios

### Para Desenvolvimento
- ✅ **Trabalhe offline**: Não precisa de internet ou backend rodando
- ✅ **Dados consistentes**: Sempre os mesmos dados para testes
- ✅ **Desenvolvimento rápido**: Sem esperar APIs lentas
- ✅ **Testes confiáveis**: Reproduz cenários facilmente

### Para UX
- ✅ **Autocomplete funcional**: Usuário vê sugestões desde o início
- ✅ **Aprendizado guiado**: Vê exemplos de como preencher
- ✅ **Menos erros**: Categorias e contas já pré-definidas
- ✅ **Experiência fluida**: Não precisa lembrar nomes exatos

## 📊 Dados Disponíveis

### Contas Únicas Extraídas
Do arquivo `sheetEntriesResponse.json`:
- NUCONTA
- NUBANK
- Banco do Brasil
- Carteira
- etc.

### Categorias Disponíveis
Do arquivo `getSheetCategoriesResponse.json`:
- 73 categorias pré-definidas
- Incluindo: Alimentação, Transporte, Moradia, Saúde, Educação, etc.

## 🔍 Logs e Debug

O MockDataService fornece logs detalhados:

```
[MockDataService] 🔧 Modo de desenvolvimento ativado
[MockDataService] 📦 Carregando dados mockados...
[MockDataService] ✅ Dados carregados: 400 lançamentos, 73 categorias
[MockDataService] 💳 8 contas únicas extraídas: [...]
[AccountsService] 🔧 Modo dev: usando contas mockadas
[AccountsService] ✅ 8 contas mockadas carregadas
[CategoriesService] 🔧 Modo dev: usando categorias mockadas
[CategoriesService] ✅ 73 categorias mockadas carregadas
```

## 🚀 Como Usar

### 1. Ativar Modo Dev (Login de Teste)
```javascript
// No formulário de login
sessionStorage.setItem('testLogin', 'true');
```

### 2. Os Serviços Detectam Automaticamente
```javascript
// Nenhuma configuração adicional necessária!
// Os serviços verificam automaticamente:
mockDataService.shouldUseMockData() // true em modo dev
```

### 3. Componentes Usam Normalmente
```javascript
// No seu componente/formulário
const contas = await accountsService.getAccounts();
const categorias = await categoriesService.getCategories();

// Recebe dados mockados em dev, dados reais em prod!
```

## 🔄 Atualizar Dados Mockados

### Capturar Novos Dados
1. Faça login com usuário real
2. Abra DevTools → Network
3. Faça uma requisição para:
   - `/get-sheet-entries` → Copie resposta para `sheetEntriesResponse.json`
   - `/get-sheet-categories` → Copie resposta para `getSheetCategoriesResponse.json`

### Limpar Cache
```javascript
// No console do navegador
mockDataService.clearCache();
```

## 🎯 Próximos Passos

Com esse mecanismo funcionando, você pode:

1. ✅ **Implementar formulário de adicionar** com autocomplete funcional
2. ✅ **Testar sem backend** durante desenvolvimento
3. ✅ **Demonstrar o sistema** para stakeholders com dados realistas
4. ✅ **Desenvolver offline** em locais sem internet

## 📚 API do MockDataService

```javascript
// Verificar se deve usar mock
mockDataService.shouldUseMockData() // boolean

// Obter contas únicas
await mockDataService.getUniqueAccounts() // string[]

// Obter categorias
await mockDataService.getCategories() // string[]

// Obter todos os lançamentos
await mockDataService.getEntries() // object[]

// Obter descrições únicas (útil para autocomplete)
await mockDataService.getUniqueDescriptions() // string[]

// Obter observações únicas
await mockDataService.getUniqueObservations() // string[]

// Estatísticas
await mockDataService.getStatistics() // object

// Limpar cache
mockDataService.clearCache()
```

## ⚠️ Importante

- **Produção**: Em produção (sem `testLogin`), os serviços usam a API real automaticamente
- **Performance**: Dados são carregados uma vez e cacheados
- **Consistência**: Mesma interface para dev e prod - código não muda!

---

**Pronto!** Agora você tem um ambiente de desenvolvimento completo com dados mockados funcionais! 🎉
