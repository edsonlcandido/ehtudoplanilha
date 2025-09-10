# Utilitários JavaScript

Esta pasta contém utilitários reutilizáveis para o sistema.

## budget-date.js

Utilitário para manipulação inteligente de datas de orçamento, implementando lógica similar a datas de fechamento de fatura de cartão de crédito.

### Principais Funcionalidades

- **Sugestão inteligente de datas**: Analisa lançamentos anteriores e sugere a próxima data mais apropriada
- **Compatibilidade com sistema antigo**: Converte automaticamente formatos antigos ("setembro/25") para o novo formato ("dd/MM/YYYY")
- **Flexibilidade**: Suporta qualquer dia do mês, não apenas dia 01
- **Consistência**: Mantém padrões estabelecidos pelo usuário

### Funções Disponíveis

#### `collectBudgetDates(entries)`
Coleta e normaliza todas as datas de orçamento dos lançamentos.
- **Entrada**: Array de objetos de lançamento
- **Saída**: Array de strings no formato "dd/MM/YYYY", ordenadas cronologicamente

#### `nextFaturaBudgetDate(budgetStrDates)`
Sugere a próxima data de orçamento baseada no histórico.
- **Entrada**: Array de strings de datas no formato "dd/MM/YYYY"
- **Saída**: Objeto Date com a próxima data sugerida

**Lógica de sugestão:**
1. Se não há lançamentos → sugere hoje
2. Se já existe lançamento no mês atual → sugere mesmo dia do próximo mês
3. Se não há lançamento no mês atual → sugere o último dia usado no próximo mês

#### `parseBudgetStr(str)`
Converte string "dd/MM/YYYY" para objeto Date.

#### `formatBudgetDateForBackend(date)`
Converte objeto Date para formato "dd/MM/YYYY" (backend).

#### `isoFromDate(date)`
Converte objeto Date para formato ISO "YYYY-MM-DD" (input type="date").

#### `backendBudgetFromISO(isoStr)`
Converte string ISO "YYYY-MM-DD" para formato "dd/MM/YYYY" (backend).

### Exemplos de Uso

```javascript
import { collectBudgetDates, nextFaturaBudgetDate, isoFromDate } from './utils/budget-date.js';

// Coletar datas existentes
const entries = [
    { orcamento: '15/08/2025' },
    { orcamento: '15/09/2025' }
];
const budgetDates = collectBudgetDates(entries);

// Sugerir próxima data
const nextDate = nextFaturaBudgetDate(budgetDates);

// Definir no campo de data
document.getElementById('budgetDateInput').value = isoFromDate(nextDate);
```

### Cenários de Teste Cobertos

1. **Migração do sistema antigo**: Converte "setembro/25" → "01/09/2025"
2. **Novo padrão de usuário**: Segue datas de fechamento personalizadas
3. **Primeiro uso**: Sugere data atual como fallback
4. **Lançamentos irregulares**: Prioriza último padrão usado
5. **Entradas inválidas**: Tratamento robusto de erros