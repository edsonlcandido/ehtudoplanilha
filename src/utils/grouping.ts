/**
 * Utilitários de agrupamento de lançamentos
 * Usado para gerar o resumo agrupado por Orçamento → Conta
 * exibido na página de Lançamentos quando há filtros aplicados.
 */

import type { SheetEntry, BudgetGroup, AccountGroup, GroupedSummary } from '../types';
import { excelSerialToDate } from './date-helpers';

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Normaliza o campo orçamento de uma entrada para a chave "MM/YYYY"
 * Retorna null se vazio/inválido.
 */
function normalizeOrcamentoKey(entry: SheetEntry): string | null {
  const orc = entry.orcamento;
  if (orc === null || orc === undefined || orc === '') return null;

  let date: Date | null = null;

  if (typeof orc === 'number') {
    date = excelSerialToDate(orc);
  } else if (typeof orc === 'string') {
    const trimmed = orc.trim();
    if (!trimmed) return null;
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        date = new Date(year, month, day);
      }
    }
  }

  if (!date || isNaN(date.getTime())) return null;

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
}

/**
 * Gera label amigável "Outubro/2025" a partir da chave "10/2025"
 */
function orcamentoKeyToLabel(key: string): string {
  const [mm, yyyy] = key.split('/');
  const monthIdx = parseInt(mm, 10) - 1;
  if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return key;
  return `${MESES_PT[monthIdx]}/${yyyy}`;
}

/**
 * Verifica se há pelo menos um filtro relevante aplicado.
 * Usado para decidir se o agrupamento deve ser renderizado.
 */
export function hasActiveFilters(state: {
  searchTerm: string;
  filters: { conta: string; dataInicio: string; dataFim: string; orcamento: string; categoria: string };
}): boolean {
  if (state.searchTerm && state.searchTerm.trim() !== '') return true;
  const f = state.filters;
  return Boolean(
    f.conta || f.dataInicio || f.dataFim || f.orcamento || f.categoria
  );
}

/**
 * Agrupa entradas em BudgetGroup → AccountGroup.
 * - Lançamentos futuros (sem data) são EXCLUÍDOS do agrupamento.
 * - Lançamentos sem conta vão para o grupo "Sem conta" dentro do orçamento.
 * - Transferências (categoria "Transferência") são SOMADAS no saldo
 *   mas NÃO contam como receita/despesa.
 */
export function groupEntriesByBudgetAndAccount(entries: SheetEntry[]): GroupedSummary {
  const budgetMap = new Map<string, {
    orcamentoKey: string;
    accounts: Map<string, AccountGroup>;
  }>();

  const totals = { receitas: 0, despesas: 0, saldo: 0, count: 0 };

  for (const entry of entries) {
    // Ignora lançamentos futuros (sem data)
    const hasDate = entry.data !== null
      && entry.data !== undefined
      && !(typeof entry.data === 'string' && entry.data.trim() === '');
    if (!hasDate) continue;

    const key = normalizeOrcamentoKey(entry);
    if (!key) continue;

    const conta = (entry.conta && entry.conta.trim()) || 'Sem conta';
    const isTransfer = (entry.categoria || '').trim().toLowerCase() === 'transferência';

    if (!budgetMap.has(key)) {
      budgetMap.set(key, { orcamentoKey: key, accounts: new Map() });
    }
    const budget = budgetMap.get(key)!;

    if (!budget.accounts.has(conta)) {
      budget.accounts.set(conta, {
        conta,
        receitas: 0,
        despesas: 0,
        saldo: 0,
        count: 0,
        entries: []
      });
    }
    const account = budget.accounts.get(conta)!;

    const valor = Number(entry.valor) || 0;

    if (isTransfer) {
      account.saldo += valor;
    } else {
      if (valor >= 0) {
        account.receitas += valor;
        totals.receitas += valor;
      } else {
        account.despesas += valor;
        totals.despesas += valor;
      }
      account.count += 1;
      totals.count += 1;
    }
    account.saldo += valor;
    account.entries.push(entry);
  }

  const groups: BudgetGroup[] = Array.from(budgetMap.values()).map(b => {
    const accounts = Array.from(b.accounts.values())
      .sort((a, b) => b.saldo - a.saldo);

    const receitas = accounts.reduce((s, a) => s + a.receitas, 0);
    const despesas = accounts.reduce((s, a) => s + a.despesas, 0);
    const saldo = accounts.reduce((s, a) => s + a.saldo, 0);
    const count = accounts.reduce((s, a) => s + a.count, 0);

    return {
      orcamento: b.orcamentoKey,
      orcamentoLabel: orcamentoKeyToLabel(b.orcamentoKey),
      receitas,
      despesas,
      saldo,
      count,
      accounts
    };
  });

  // Ordena: mais recente primeiro
  groups.sort((a, b) => {
    const [am, ay] = a.orcamento.split('/');
    const [bm, by] = b.orcamento.split('/');
    return (Number(by) - Number(ay)) || (Number(bm) - Number(am));
  });

  totals.saldo = totals.receitas + totals.despesas;
  return { groups, totals };
}
