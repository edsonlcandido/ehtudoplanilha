/**
 * Utilitários para manipular sheet entries (agregações e filtros por orçamento)
 * Versão TypeScript migrada de pb_public_/js/utils/sheet-entries.js
 */

import {
  toExcelSerial,
  excelSerialToMonthLabel,
  getIntervalSerials
} from './date-helpers';

/**
 * Interface para representar um entry de planilha
 */
export interface Entry {
  data: number;
  conta: string;
  valor: number;
  descricao: string;
  categoria: string;
  orcamento: number;
  obs?: string;
  rowIndex?: number;
}

/**
 * Interface para resumo agregado por orçamento
 */
export interface BudgetSummary {
  orcamento: number;
  label: string;
  count: number;
  sum: number;
  incomes: number;
  expenses: number;
}

/**
 * Interface para orçamento disponível
 */
export interface BudgetInfo {
  orcamento: number;
  label: string;
}

export interface AccountSummary {
  conta: string;
  total: number;
  count: number;
}

/**
 * Filtra entries por intervalo de orçamento
 * Padrão: hoje -5 dias até hoje +35 dias
 * 
 * @param entries - Array de entries
 * @param field - Campo a filtrar (default: 'orcamento')
 * @param offsetStart - Dias antes de hoje (default: -5)
 * @param offsetEnd - Dias depois de hoje (default: 35)
 * @returns Array filtrado
 */
export function filterEntriesByInterval(
  entries: Entry[] = [],
  field: keyof Entry = 'orcamento',
  offsetStart: number = -5,
  offsetEnd: number = 35
): Entry[] {
  const { startSerial, endSerial } = getIntervalSerials(offsetStart, offsetEnd);
  
  return entries.filter(e => {
    const v = e && e[field];
    return typeof v === 'number' && !Number.isNaN(v) && v >= startSerial && v <= endSerial;
  });
}

/**
 * Agrega entries por orcamento
 * Retorna array com resumo de cada orçamento (saldo, receitas, despesas)
 * 
 * @param entries - Array de entries
 * @param orcamentoField - Campo de orçamento (default: 'orcamento')
 * @returns Array de resumos ordenados por orcamento decrescente
 */
export function aggregateByBudget(
  entries: Entry[] = [],
  orcamentoField: keyof Entry = 'orcamento'
): BudgetSummary[] {
  const map = new Map<number, Omit<BudgetSummary, 'label'>>();

  entries.forEach(e => {
    let keyRaw = e && e[orcamentoField];
    let key = Number(keyRaw);
    
    // Tenta normalizar se não for número válido
    if (!Number.isFinite(key)) {
      // Se for string tipo 'DD/MM/YYYY' ou 'MM/YYYY'
      if (typeof keyRaw === 'string' && keyRaw.includes('/')) {
        const parts = keyRaw.split('/');
        if (parts.length === 3) {
          // DD/MM/YYYY
          const [dd, mm, yyyy] = parts.map(p => Number(p));
          if ([dd, mm, yyyy].every(Number.isFinite)) {
            key = toExcelSerial(new Date(yyyy, mm - 1, dd));
          }
        } else if (parts.length === 2) {
          // MM/YYYY -> usa dia 1
          const [mm, yyyy] = parts.map(p => Number(p));
          if ([mm, yyyy].every(Number.isFinite)) {
            key = toExcelSerial(new Date(yyyy, mm - 1, 1));
          }
        }
      }
    }
    
    // Ignora se não conseguiu normalizar
    if (!Number.isFinite(key)) return;

    const valor = Number(e.valor) || 0;
    const existing = map.get(key) || { orcamento: key, sum: 0, count: 0, incomes: 0, expenses: 0 };
    
    existing.sum += valor;
    existing.count += 1;
    if (valor >= 0) {
      existing.incomes += valor;
    } else {
      existing.expenses += valor;
    }
    
    map.set(key, existing);
  });

  // Converte para array e adiciona labels
  const result: BudgetSummary[] = Array.from(map.values()).map(item => ({
    orcamento: item.orcamento,
    label: excelSerialToMonthLabel(item.orcamento),
    count: item.count,
    sum: Number(item.sum.toFixed(2)),
    incomes: Number(item.incomes.toFixed(2)),
    expenses: Number(item.expenses.toFixed(2))
  }));

  // Ordena por orcamento decrescente (mais recente primeiro)
  return result.sort((a, b) => b.orcamento - a.orcamento);
}

/**
 * Retorna lista de orçamentos únicos presentes nos entries
 * 
 * @param entries - Array de entries
 * @param orcamentoField - Campo de orçamento (default: 'orcamento')
 * @returns Array de orçamentos ordenados ascendente
 */
export function budgetsInEntries(
  entries: Entry[] = [],
  orcamentoField: keyof Entry = 'orcamento'
): BudgetInfo[] {
  
  // Função auxiliar para normalizar o valor do orçamento em serial Excel ou null
  const normalizeToSerial = (raw: any): number | null => {
    let key = Number(raw);
    if (Number.isFinite(key)) return key;

    if (typeof raw === 'string' && raw.includes('/')) {
      const parts = raw.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY
        const [dd, mm, yyyy] = parts.map(p => Number(p));
        if ([dd, mm, yyyy].every(Number.isFinite)) {
          return toExcelSerial(new Date(yyyy, mm - 1, dd));
        }
      } else if (parts.length === 2) {
        // MM/YYYY -> usa dia 1
        const [mm, yyyy] = parts.map(p => Number(p));
        if ([mm, yyyy].every(Number.isFinite)) {
          return toExcelSerial(new Date(yyyy, mm - 1, 1));
        }
      }
    }

    return null;
  };

  const map = new Map<number, BudgetInfo>();
  
  entries.forEach(e => {
    const raw = e && e[orcamentoField];
    const serial = normalizeToSerial(raw);
    
    if (serial === null || !Number.isFinite(serial)) return;
    
    if (!map.has(serial)) {
      map.set(serial, {
        orcamento: serial,
        label: excelSerialToMonthLabel(serial)
      });
    }
  });

  // Retorna array ordenado por orcamento ascendente
  return Array.from(map.values()).sort((a, b) => a.orcamento - b.orcamento);
}

/**
 * ✨ PASSO 1: Agrega entries por conta
 * Retorna array com resumo de cada conta (saldo total e quantidade de lançamentos)
 * 
 * @param entries - Array de entries
 * @returns Array de resumos ordenados por saldo decrescente
 */
export function aggregateByAccount(entries: Entry[] = []): AccountSummary[] {
  const map = new Map<string, { total: number; count: number }>();

  entries.forEach(e => {
    // Ignora lançamentos sem conta definida ou com conta vazia
    if (!e.conta || e.conta.trim() === '') return;

    const valor = Number(e.valor) || 0;
    const existing = map.get(e.conta) || { total: 0, count: 0 };
    
    existing.total += valor;
    existing.count += 1;
    
    map.set(e.conta, existing);
  });

  // Converte para array
  const result: AccountSummary[] = Array.from(map.entries()).map(([conta, data]) => ({
    conta,
    total: Number(data.total.toFixed(2)),
    count: data.count
  }));

  // Ordena por saldo decrescente (maior saldo primeiro)
  return result.sort((a, b) => b.total - a.total);
}
