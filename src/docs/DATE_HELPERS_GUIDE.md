# Date Helpers - Guia de Uso

## Visão Geral

As funções de conversão de data resolvem o problema de timezone ao trabalhar com Excel Serial numbers, especialmente para o campo `orcamento` que deve ser sempre um dia inteiro.

## Problema de Timezone

Quando convertemos datas sem hora (ex.: `2025-10-31`), variações de timezone podem fazer o dia "voltar":

```typescript
// ❌ PROBLEMA: Pode resultar em dia anterior
const date = new Date('2025-10-31'); // 00:00 local
const serial = convertToSerial(date);
// Se timezone for GMT-3, pode resultar em 30/10/2025 21:00 UTC
```

## Solução: Meio-dia (12:00)

Usamos **meio-dia (12:00)** para garantir estabilidade, pois mesmo com +/-12h de variação de timezone, o dia permanece o mesmo:

```typescript
// ✅ SOLUÇÃO: Usa meio-dia
const date = new Date(2025, 9, 31, 12, 0, 0); // 31/10/2025 12:00
const serial = toExcelSerialDia(date); // Sempre 45592
```

## Funções Principais

### 1. `toExcelSerialDia()` - Para campo ORÇAMENTO

**Quando usar:** Sempre que precisar converter uma data SEM HORA (campo orçamento)

```typescript
import { toExcelSerialDia } from './types';

// Exemplo 1: Do input date do formulário
const budgetInput = document.getElementById('expenseBudget') as HTMLInputElement;
const dateString = budgetInput.value; // "2025-10-31"

const [year, month, day] = dateString.split('-').map(n => parseInt(n, 10));
const date = new Date(year, month - 1, day); // Cria às 00:00 local
const orcamentoSerial = toExcelSerialDia(date); // 45592 (INTEIRO)

// Exemplo 2: Payload para API
const payload = {
  data: dateTimeInput.value,        // "2025-10-20T16:52"
  conta: "Banco",
  valor: -150.50,
  descricao: "Supermercado",
  categoria: "Alimentação",
  orcamento: orcamentoSerial        // 45592 (número inteiro)
};
```

### 2. `toExcelSerial()` - Para campo DATA (com hora)

**Quando usar:** Para converter data COM HORA (campo data)

```typescript
import { toExcelSerial } from './types';

// Converte Date completo com hora
const dateTime = new Date('2025-10-20T16:52');
const dataSerial = toExcelSerial(dateTime, true); // 45581.703472222
```

### 3. `excelSerialToDate()` - Converter serial para Date

**Quando usar:** Ao ler dados da planilha via API

```typescript
import { excelSerialToDate } from './types';

// Serial COM hora (campo data)
const dataSerial = 45581.703472222;
const dataDate = excelSerialToDate(dataSerial, true); // Date com hora 16:52

// Serial SEM hora (campo orcamento)
const orcamentoSerial = 45592;
const orcamentoDate = excelSerialToDate(orcamentoSerial, false); // Date com 00:00
```

### 4. Funções de Formatação

```typescript
import { 
  excelSerialToMonthLabel,
  excelSerialToDateTimeLabel 
} from './types';

// Formatar data simples
excelSerialToMonthLabel(45592); // "31/10/2025"

// Formatar data com hora
excelSerialToDateTimeLabel(45581.703472222); // "20/10/2025 16:52"
```

### 5. Helpers de Input

```typescript
import { dateInputToDate, dateTimeLocalToDate } from './types';

// Converter input date (usa meio-dia automaticamente)
const budgetDate = dateInputToDate('2025-10-31'); // Date(2025, 9, 31, 12, 0, 0)

// Converter input datetime-local
const dateTime = dateTimeLocalToDate('2025-10-20T16:52'); // Date(2025, 9, 20, 16, 52, 0)
```

## Exemplo Completo: Formulário de Lançamento

```typescript
import { 
  toExcelSerialDia,
  dateInputToDate 
} from './types';
import { SheetsService } from './services/sheets';

async function handleFormSubmit(event: Event) {
  event.preventDefault();
  
  // Elementos do formulário
  const dateTimeInput = document.getElementById('expenseDate') as HTMLInputElement;
  const budgetInput = document.getElementById('expenseBudget') as HTMLInputElement;
  const valueInput = document.getElementById('expenseValue') as HTMLInputElement;
  const accountInput = document.getElementById('expenseAccount') as HTMLInputElement;
  const descInput = document.getElementById('expenseDescription') as HTMLInputElement;
  const categoryInput = document.getElementById('expenseCategory') as HTMLInputElement;
  
  // Converter orçamento (SEMPRE usa toExcelSerialDia para inteiro)
  const budgetDate = dateInputToDate(budgetInput.value);
  const orcamentoSerial = budgetDate ? toExcelSerialDia(budgetDate) : 0;
  
  // Preparar payload
  const payload = {
    data: dateTimeInput.value,          // String datetime-local: "2025-10-20T16:52"
    conta: accountInput.value,          // String
    valor: parseFloat(valueInput.value), // Number
    descricao: descInput.value,          // String
    categoria: categoryInput.value,      // String
    orcamento: orcamentoSerial           // Number inteiro: 45592
  };
  
  // Enviar para API
  try {
    await SheetsService.appendEntry(payload);
    console.log('✅ Lançamento salvo com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao salvar:', error);
  }
}
```

## Exemplo: Exibir Lançamentos

```typescript
import { 
  excelSerialToDate,
  excelSerialToMonthLabel,
  excelSerialToDateTimeLabel 
} from './types';
import { SheetsService } from './services/sheets';

interface SheetEntry {
  rowIndex: number;
  data: number;      // Excel serial
  conta: string;
  valor: number;
  descricao: string;
  categoria: string;
  orcamento: number; // Excel serial inteiro
  tipo: string;
}

async function displayEntries() {
  // Buscar entries da API
  const entries: SheetEntry[] = await SheetsService.getSheetEntries('10', '2025');
  
  // Renderizar
  entries.forEach(entry => {
    // Converter data (com hora)
    const dataDate = excelSerialToDate(entry.data, true);
    const dataFormatada = dataDate 
      ? excelSerialToDateTimeLabel(entry.data) 
      : 'Data inválida';
    
    // Converter orçamento (sem hora)
    const orcamentoDate = excelSerialToDate(entry.orcamento, false);
    const orcamentoFormatado = orcamentoDate
      ? excelSerialToMonthLabel(entry.orcamento)
      : 'Data inválida';
    
    console.log(`
      Data: ${dataFormatada}           // "20/10/2025 16:52"
      Orçamento: ${orcamentoFormatado} // "31/10/2025"
      Valor: R$ ${entry.valor.toFixed(2)}
      Descrição: ${entry.descricao}
    `);
  });
}
```

## Checklist de Implementação

- [ ] ✅ Importar funções de `./types`
- [ ] ✅ Usar `toExcelSerialDia()` para campo orçamento
- [ ] ✅ Usar `dateInputToDate()` para converter input date
- [ ] ✅ Enviar orçamento como número inteiro no payload
- [ ] ✅ Usar `excelSerialToDate()` ao ler da API
- [ ] ✅ Usar funções de formatação para exibição

## Vantagens da Solução

1. **Consistência**: Sempre usa meio-dia para datas sem hora
2. **Timezone-safe**: Funciona em qualquer timezone
3. **Type-safe**: TypeScript valida tipos
4. **Reutilizável**: Funções centralizadas
5. **Documentado**: Comentários JSDoc completos
6. **Testável**: Funções puras, fáceis de testar

## Resumo

| Campo | Tipo Input | Função de Conversão | Tipo Enviado | Observação |
|-------|------------|---------------------|--------------|------------|
| **data** | `datetime-local` | - | String | Backend converte automaticamente |
| **orcamento** | `date` | `toExcelSerialDia()` | Number (inteiro) | Usa meio-dia para estabilidade |

**Regra de ouro:** Campo orçamento SEMPRE usa `toExcelSerialDia()` para garantir número inteiro!
