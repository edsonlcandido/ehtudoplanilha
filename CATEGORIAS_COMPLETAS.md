# Categorias Completas e Gráfico de Orçamento

## Visão Geral

Este documento descreve a implementação de categorias completas e o gráfico de orçamento por categoria no Planilha Eh Tudo.

## Backend

### Endpoint: GET `/get-sheet-categories-complete`

Retorna informações completas das categorias da aba CATEGORIAS do Google Sheets.

#### Parâmetros
- Nenhum (usa autenticação do usuário)

#### Resposta de Sucesso
```json
{
  "success": true,
  "categoriesComplete": [
    {
      "categoria": "Transporte",
      "tipo": "DESPESA",
      "orcamento": 500
    },
    {
      "categoria": "Salário",
      "tipo": "RECEITA",
      "orcamento": 0
    }
  ]
}
```

#### Campos
- `categoria` (string): Nome da categoria
- `tipo` (string): Tipo da categoria - "DESPESA" ou "RECEITA"
- `orcamento` (number): Valor do orçamento mensal para a categoria

#### Características
- Lê colunas A (categoria), B (tipo) e C (orçamento) da aba CATEGORIAS
- Ignora linhas vazias ou sem categoria
- Converte orçamento para número (aceita vírgula ou ponto como separador decimal)
- Implementa refresh automático de token OAuth quando necessário
- Mantém retrocompatibilidade com endpoint `/get-sheet-categories`

## Frontend

### Interface TypeScript

```typescript
interface CategoryComplete {
  categoria: string;
  tipo: string;
  orcamento: number;
}
```

### Cache

Nova chave de cache: `SHEET_CATEGORIES_COMPLETE`
- TTL: 5 minutos (igual ao cache de categorias simples)
- Invalidado automaticamente após mutações (append, edit, delete)
- Localização: `localStorage` do navegador

### Service Method

```typescript
// Em SheetsService
static async getSheetCategoriesComplete(forceRefresh = false): Promise<CategoryComplete[]>
```

#### Características
- Usa cache por padrão (`forceRefresh = false`)
- Implementa fallback para endpoint antigo se falhar
- Converte automaticamente formato antigo para novo se necessário

### Uso nos Modais

Todos os modais de formulário agora usam categorias completas:

#### Entry Modal (`entry-modal.ts`)
```typescript
// Carrega categorias completas
this.categoriesComplete = await SheetsService.getSheetCategoriesComplete();

// Extrai nomes para autocomplete
this.categories = this.categoriesComplete.map(c => c.categoria);
```

#### Future Entry Modal (`future-entry-modal.ts`)
```typescript
// Mesmo padrão que Entry Modal
this.categoriesComplete = await SheetsService.getSheetCategoriesComplete();
this.categories = this.categoriesComplete.map(c => c.categoria);
```

#### Edit Entry Modal (`edit-entry-modal.ts`)
```typescript
// Carrega de forma assíncrona durante setEntries()
async setEntries(entries: SheetEntry[]): Promise<void> {
  // ... código existente ...
  
  // Tenta carregar categorias completas
  this.categoriesComplete = await SheetsService.getSheetCategoriesComplete();
  this.categories = this.categoriesComplete.map(c => c.categoria);
}
```

## Componente: Gráfico de Orçamento

### Localização
- Componente: `src/components/category-budget-chart.ts`
- CSS: `src/css/components/category-budget-chart.css`
- Integração: `src/dashboard/dashboard.ts`

### Características

1. **Gráfico de Rosca (Donut Chart)**
   - Renderizado em SVG puro (sem bibliotecas externas)
   - Mostra proporção de cada categoria no orçamento total
   - Hover mostra detalhes de cada segmento

2. **Filtros**
   - Mostra apenas categorias do tipo DESPESA
   - Mostra apenas categorias com orçamento > 0
   - Limita a 10 categorias (ordenadas por % de uso)

3. **Indicadores de Status**
   - 🟢 OK: < 80% do orçamento usado
   - 🟡 Warning: 80-99% do orçamento usado
   - 🔴 Over: ≥ 100% do orçamento usado

4. **Layout**
   - Gráfico à esquerda
   - Legenda à direita com valores e percentuais
   - Resumo de totais no rodapé

### Uso

```typescript
import { renderCategoryBudgetChart } from '../components/category-budget-chart';

// Renderizar gráfico
const chartEntries = entries.map(e => ({
  categoria: e.categoria,
  valor: e.valor,
  tipo: e.tipo
}));

const categoriesComplete = await SheetsService.getSheetCategoriesComplete();

renderCategoryBudgetChart('categoryBudgetChart', chartEntries, categoriesComplete);
```

### Personalização CSS

Principais classes CSS:
- `.budget-chart`: Container principal
- `.budget-chart__donut`: Container do gráfico SVG
- `.budget-chart__legend`: Container da legenda
- `.budget-chart__status--ok`: Indicador verde (OK)
- `.budget-chart__status--warning`: Indicador amarelo (Warning)
- `.budget-chart__status--over`: Indicador vermelho (Over)

## Integração no Dashboard

O gráfico é automaticamente renderizado no dashboard após carregar os lançamentos:

```typescript
// Em dashboard.ts
async function loadAndRenderData(): Promise<void> {
  // ... carrega entries ...
  
  // Renderiza cards e detalhes
  renderizarCards(allSummaries, budgetsInIntervalMap);
  inicializarDetalhes(entries, budgetsInIntervalList);

  // Renderiza gráfico de orçamento
  await renderBudgetChart(entries);
}
```

Localização no HTML: `src/dashboard/index.html`
```html
<!-- Gráfico de Orçamento por Categoria -->
<div id="categoryBudgetChart"></div>
```

## Retrocompatibilidade

### PWA (outro repositório)
O endpoint antigo `/get-sheet-categories` é mantido sem alterações para garantir compatibilidade com o PWA.

### Fallback
Se o endpoint `/get-sheet-categories-complete` não estiver disponível:
1. O service tenta usar `/get-sheet-categories`
2. Converte formato antigo para novo: `{categoria: "X", tipo: "", orcamento: 0}`
3. Continua funcionando normalmente

## Configuração na Planilha

Para usar o gráfico de orçamento, configure a aba CATEGORIAS assim:

| A (Categoria) | B (Tipo)   | C (Orçamento) |
|---------------|------------|---------------|
| Transporte    | DESPESA    | 500           |
| Alimentação   | DESPESA    | 800           |
| Lazer         | DESPESA    | 300           |
| Salário       | RECEITA    | 0             |

**Notas:**
- Coluna A: Nome da categoria (obrigatório)
- Coluna B: DESPESA ou RECEITA (case-insensitive)
- Coluna C: Valor do orçamento mensal (aceita vírgula ou ponto)
- Apenas DESPESAS com orçamento > 0 aparecem no gráfico

## Troubleshooting

### Gráfico não aparece
1. Verifique se há categorias com tipo DESPESA e orçamento > 0
2. Abra o console do navegador e procure por erros
3. Verifique se o cache está funcionando (F12 → Application → Local Storage)

### Categorias não carregam
1. Verifique permissões da planilha no Google Drive
2. Teste o endpoint diretamente: `GET /get-sheet-categories-complete`
3. Verifique se o token OAuth está válido

### Cache não invalida
1. Verifique se as mutações (append, edit, delete) completam com sucesso
2. Limpe manualmente: `localStorage.clear()` no console
3. Use `forceRefresh = true` nas chamadas do service

## Exemplos de Teste

### Testar endpoint via curl
```bash
curl -X GET http://localhost:8090/get-sheet-categories-complete \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Testar no console do navegador
```javascript
// Buscar categorias completas
const cats = await SheetsService.getSheetCategoriesComplete();
console.log('Categorias completas:', cats);

// Forçar refresh
const catsRefresh = await SheetsService.getSheetCategoriesComplete(true);
console.log('Categorias (refresh):', catsRefresh);

// Ver cache
console.log('Cache:', localStorage.getItem('ehtudoplanilha:sheet-categories-complete'));
```

## Melhorias Futuras

1. **Gráfico interativo**
   - Click para filtrar lançamentos por categoria
   - Zoom e pan no gráfico

2. **Mais tipos de gráfico**
   - Gráfico de barras comparativo
   - Evolução temporal do orçamento

3. **Alertas**
   - Notificação quando categoria ultrapassar 90% do orçamento
   - Sugestões de economia baseadas em padrões

4. **Exportação**
   - Exportar gráfico como imagem PNG
   - Exportar dados como CSV

## Referências

- Backend: `pb_hooks/get-sheet-categories-complete.pb.js`
- Frontend Service: `src/services/sheets.ts`
- Componente: `src/components/category-budget-chart.ts`
- Cache: `src/services/cache.ts`
- Dashboard: `src/dashboard/dashboard.ts`
