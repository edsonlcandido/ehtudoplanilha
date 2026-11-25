/**
 * Teste diferencial das regras de lançamentos: backend (novo) vs frontend (antigo).
 *
 *   node tests/lancamentos-domain.test.mjs
 *
 * O bloco "REGRAS LEGADAS" abaixo é uma cópia literal das regras que viviam
 * no frontend antes da migração (src/utils/date-helpers.ts,
 * src/utils/sheet-entries.ts, src/utils/grouping.ts e os métodos de
 * src/services/lancamentos.ts). Ele serve de referência: o backend novo
 * precisa produzir EXATAMENTE o mesmo resultado.
 *
 * Se uma regra mudar de propósito, atualize as duas pontas (a legada aqui e a
 * nova em pb_hooks/_lancamentos-domain.js) — o teste avisa.
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const domain = require(path.join(__dirname, '../pb_hooks/_lancamentos-domain.js'));

// ============================================================================
// REGRAS LEGADAS (cópia literal do frontend pré-migração)
// ============================================================================

function toExcelSerial(date, dataHora = false) {
  if (!date || !(date instanceof Date)) return NaN;
  const d = new Date(date);
  if (!dataHora) d.setHours(12, 0, 0, 0);
  const baseDate = new Date(Date.UTC(1899, 11, 31, 0, 0, 0));
  const msPerDay = 24 * 60 * 60 * 1000;
  let days = (d.getTime() - baseDate.getTime()) / msPerDay;
  const excelLeapBugDate = new Date(Date.UTC(1900, 1, 28, 0, 0, 0));
  if (d > excelLeapBugDate) days += 1;
  return Number(days.toFixed(10));
}

function excelSerialToDate(serial, dataHora = false) {
  const s = Number(serial);
  if (!Number.isFinite(s)) return null;
  const adj = s >= 60 ? s - 1 : s;
  const baseUtc = Date.UTC(1899, 11, 31);
  const utcDate = new Date(baseUtc + adj * 86400000);
  const yyyy = utcDate.getUTCFullYear();
  const mm = utcDate.getUTCMonth();
  const dd = utcDate.getUTCDate();
  if (!dataHora) return new Date(yyyy, mm, dd);
  const hh = utcDate.getUTCHours();
  const mins = utcDate.getUTCMinutes();
  const ss = utcDate.getUTCSeconds();
  const mss = utcDate.getUTCMilliseconds();
  return new Date(yyyy, mm, dd, hh, mins, ss, mss);
}

function excelSerialToMonthLabel(serial) {
  const d = excelSerialToDate(serial);
  if (!d) return String(serial);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function excelSerialToDateTimeLabel(serial) {
  const d = excelSerialToDate(serial, true);
  if (!d) return String(serial);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mins}`;
}

function getIntervalSerials(offsetStart = -5, offsetEnd = 35) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetStart, 0, 0, 0, 0);
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetEnd, 23, 59, 59, 999);
  return {
    startSerial: toExcelSerial(startDate),
    endSerial: toExcelSerial(endDate),
    startDate,
    endDate
  };
}

function legacyFilterEntriesByInterval(entries = [], field = 'orcamento', offsetStart = -5, offsetEnd = 35) {
  const { startSerial, endSerial } = getIntervalSerials(offsetStart, offsetEnd);
  return entries.filter((e) => {
    const v = e && e[field];
    return typeof v === 'number' && !Number.isNaN(v) && v >= startSerial && v <= endSerial;
  });
}

function legacyAggregateByBudget(entries = [], orcamentoField = 'orcamento') {
  const map = new Map();
  entries.forEach((e) => {
    let keyRaw = e && e[orcamentoField];
    let key = Number(keyRaw);
    if (!Number.isFinite(key)) {
      if (typeof keyRaw === 'string' && keyRaw.includes('/')) {
        const parts = keyRaw.split('/');
        if (parts.length === 3) {
          const [dd, mm, yyyy] = parts.map((p) => Number(p));
          if ([dd, mm, yyyy].every(Number.isFinite)) key = toExcelSerial(new Date(yyyy, mm - 1, dd));
        } else if (parts.length === 2) {
          const [mm, yyyy] = parts.map((p) => Number(p));
          if ([mm, yyyy].every(Number.isFinite)) key = toExcelSerial(new Date(yyyy, mm - 1, 1));
        }
      }
    }
    if (!Number.isFinite(key)) return;
    const valor = Number(e.valor) || 0;
    const existing = map.get(key) || { orcamento: key, sum: 0, count: 0, incomes: 0, expenses: 0 };
    existing.sum += valor;
    existing.count += 1;
    if (valor >= 0) existing.incomes += valor;
    else existing.expenses += valor;
    map.set(key, existing);
  });
  const result = Array.from(map.values()).map((item) => ({
    orcamento: item.orcamento,
    label: excelSerialToMonthLabel(item.orcamento),
    count: item.count,
    sum: Number(item.sum.toFixed(2)),
    incomes: Number(item.incomes.toFixed(2)),
    expenses: Number(item.expenses.toFixed(2))
  }));
  return result.sort((a, b) => b.orcamento - a.orcamento);
}

function legacyAggregateByAccount(entries = []) {
  const map = new Map();
  entries.forEach((e) => {
    const conta = String(e.conta || '');
    if (!conta || conta.trim() === '') return;
    const valor = Number(e.valor) || 0;
    const existing = map.get(conta) || { total: 0, count: 0 };
    existing.total += valor;
    existing.count += 1;
    map.set(conta, existing);
  });
  const result = Array.from(map.entries()).map(([conta, data]) => ({
    conta,
    total: Number(data.total.toFixed(2)),
    count: data.count
  }));
  return result.sort((a, b) => a.conta.localeCompare(b.conta));
}

const MESES_PT_LEGADO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function legacyNormalizeOrcamentoKey(entry) {
  const orc = entry.orcamento;
  if (orc === null || orc === undefined || orc === '') return null;
  let date = null;
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
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) date = new Date(year, month, day);
    }
  }
  if (!date || isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${month}/${date.getFullYear()}`;
}

function legacyOrcamentoKeyToLabel(key) {
  const [mm, yyyy] = key.split('/');
  const monthIdx = parseInt(mm, 10) - 1;
  if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return key;
  return `${MESES_PT_LEGADO[monthIdx]}/${yyyy}`;
}

function legacyGroupEntriesByBudgetAndAccount(entries) {
  const budgetMap = new Map();
  const totals = { receitas: 0, despesas: 0, saldo: 0, count: 0 };

  for (const entry of entries) {
    const hasDate =
      entry.data !== null && entry.data !== undefined && !(typeof entry.data === 'string' && entry.data.trim() === '');
    if (!hasDate) continue;

    const key = legacyNormalizeOrcamentoKey(entry);
    if (!key) continue;

    const conta = (entry.conta && entry.conta.trim()) || 'Sem conta';
    const isTransfer = (entry.categoria || '').trim().toLowerCase() === 'transferência';

    if (!budgetMap.has(key)) budgetMap.set(key, { orcamentoKey: key, accounts: new Map() });
    const budget = budgetMap.get(key);

    if (!budget.accounts.has(conta)) {
      budget.accounts.set(conta, { conta, receitas: 0, despesas: 0, saldo: 0, count: 0, entries: [] });
    }
    const account = budget.accounts.get(conta);

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

  const groups = Array.from(budgetMap.values()).map((b) => {
    const accounts = Array.from(b.accounts.values()).sort((a, b) => b.saldo - a.saldo);
    return {
      orcamento: b.orcamentoKey,
      orcamentoLabel: legacyOrcamentoKeyToLabel(b.orcamentoKey),
      receitas: accounts.reduce((s, a) => s + a.receitas, 0),
      despesas: accounts.reduce((s, a) => s + a.despesas, 0),
      saldo: accounts.reduce((s, a) => s + a.saldo, 0),
      count: accounts.reduce((s, a) => s + a.count, 0),
      accounts
    };
  });

  groups.sort((a, b) => {
    const [am, ay] = a.orcamento.split('/');
    const [bm, by] = b.orcamento.split('/');
    return Number(by) - Number(ay) || Number(bm) - Number(am);
  });

  totals.saldo = totals.receitas + totals.despesas;
  return { groups, totals };
}

function legacyIsBlankEntry(entry) {
  if (!entry) return true;
  const campos = ['data', 'conta', 'valor', 'descricao', 'categoria', 'orcamento', 'obs'];
  return campos.every((campo) => {
    const valor = entry[campo];
    if (valor === null || valor === undefined) return true;
    if (typeof valor === 'number') return false;
    return String(valor).trim() === '';
  });
}

function legacyGetDateValue(date) {
  if (!date) return Number.MAX_SAFE_INTEGER;
  if (typeof date === 'number') return date;
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
}

function legacySortEntries(entries, sortBy) {
  const sorted = [...entries];
  if (sortBy === 'original') return sorted.sort((a, b) => (b.rowIndex || 0) - (a.rowIndex || 0));
  if (sortBy === 'date') {
    return sorted.sort((a, b) => legacyGetDateValue(b.data) - legacyGetDateValue(a.data));
  }
  if (sortBy === 'budget_date') {
    return sorted.sort((a, b) => {
      const budgetA = legacyGetDateValue(a.orcamento);
      const budgetB = legacyGetDateValue(b.orcamento);
      if (budgetA !== budgetB) return budgetB - budgetA;
      return legacyGetDateValue(b.data) - legacyGetDateValue(a.data);
    });
  }
  return sorted;
}

function legacyFormatDateForSearch(date) {
  if (!date) return '';
  let dateObj = null;
  if (typeof date === 'number') dateObj = excelSerialToDate(date);
  else dateObj = new Date(date);
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${dateObj.getFullYear()}`;
}

function legacyFilterEntries(entries, searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') return entries;
  const term = searchTerm.toLowerCase().trim();
  return entries.filter((entry) => {
    const data = legacyFormatDateForSearch(entry.data);
    const valor = String(entry.valor || '');
    const descricao = String(entry.descricao || '').toLowerCase();
    const categoria = String(entry.categoria || '').toLowerCase();
    const conta = String(entry.conta || '').toLowerCase();
    const obs = String(entry.obs || '').toLowerCase();
    return (
      data.includes(term) ||
      valor.includes(term) ||
      descricao.includes(term) ||
      categoria.includes(term) ||
      conta.includes(term) ||
      obs.includes(term)
    );
  });
}

// ============================================================================
// FIXTURE
// ============================================================================

// Serials de referência
const SER_OUT_2024 = 45596; // 31/10/2024
const SER_OUT_2025 = 45961; // 31/10/2025
const SER_NOV_2025 = 45991; // 30/11/2025

const ROWS = [
  ['data', 'conta', 'valor', 'descricao', 'categoria', 'orcamento', 'obs'], // cabeçalho (ignorada)
  [SER_OUT_2025 + 0.6027777778, 'Carteira', -150.5, 'Mercado', 'Alimentação', SER_OUT_2025, 'compras'],
  [SER_NOV_2025 + 0.5, 'Banco', 2000, 'Salário', 'Renda', SER_NOV_2025, ''],
  ['', 'Carteira', -50, 'Assinatura', 'Lazer', SER_NOV_2025, ''], // futuro (sem data)
  [SER_OUT_2025 + 0.25, 'Carteira', -100, 'Transferência para Banco', 'Transferência', SER_OUT_2025, ''],
  [SER_OUT_2025 + 0.25, 'Banco', 100, 'Transferência para Carteira', 'Transferência', SER_OUT_2025, ''],
  ['31/10/2024 09:30', 'Conta Antiga', -75.25, 'Conta de luz', 'Casa', '31/10/2024', 'texto'],
  [SER_OUT_2024, 'Carteira', 0, '', '', '', ''], // valor 0 sem texto
  ['', '', '', '', '', '', ''], // linha em branco
  [SER_NOV_2025 + 0.75, 'Banco', -33.33, 'Café', 'Alimentação', SER_NOV_2025, 'x'],
];

// Entradas "crus" no formato do frontend pré-migração
const LEGACY_ENTRIES = [
  { rowIndex: 2, data: SER_OUT_2025 + 0.6027777778, conta: 'Carteira', valor: -150.5, descricao: 'Mercado', categoria: 'Alimentação', orcamento: SER_OUT_2025, obs: 'compras' },
  { rowIndex: 3, data: SER_NOV_2025 + 0.5, conta: 'Banco', valor: 2000, descricao: 'Salário', categoria: 'Renda', orcamento: SER_NOV_2025, obs: '' },
  { rowIndex: 4, data: '', conta: 'Carteira', valor: -50, descricao: 'Assinatura', categoria: 'Lazer', orcamento: SER_NOV_2025, obs: '' },
  { rowIndex: 5, data: SER_OUT_2025 + 0.25, conta: 'Carteira', valor: -100, descricao: 'Transferência para Banco', categoria: 'Transferência', orcamento: SER_OUT_2025, obs: '' },
  { rowIndex: 6, data: SER_OUT_2025 + 0.25, conta: 'Banco', valor: 100, descricao: 'Transferência para Carteira', categoria: 'Transferência', orcamento: SER_OUT_2025, obs: '' },
  { rowIndex: 7, data: '31/10/2024 09:30', conta: 'Conta Antiga', valor: -75.25, descricao: 'Conta de luz', categoria: 'Casa', orcamento: '31/10/2024', obs: 'texto' },
  { rowIndex: 8, data: SER_OUT_2024, conta: 'Carteira', valor: 0, descricao: '', categoria: '', orcamento: '', obs: '' },
  { rowIndex: 10, data: SER_NOV_2025 + 0.75, conta: 'Banco', valor: -33.33, descricao: 'Café', categoria: 'Alimentação', orcamento: SER_NOV_2025, obs: 'x' },
];

// ============================================================================
// TESTES
// ============================================================================

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}`);
    console.error('       ' + (err && err.message ? err.message : err));
    process.exitCode = 1;
  }
}

console.log('\n=== regras de lançamentos: backend vs frontend legado ===\n');

// --- normalização -----------------------------------------------------------
const normalized = domain.normalizeRows(ROWS.slice(1));

check('normalização mantém a mesma quantidade de linhas do legado', () => {
  const legacyKept = LEGACY_ENTRIES.filter((e) => !legacyIsBlankEntry(e)).length;
  assert.equal(normalized.length, legacyKept);
});

check('normalização mantém o rowIndex original da planilha', () => {
  assert.deepEqual(normalized.map((e) => e.rowIndex), LEGACY_ENTRIES.map((e) => e.rowIndex));
});

check('valor com vírgula decimal é convertido para número', () => {
  const rows = [['', 'C', '12,50', 'x', 'y', SER_OUT_2025, '']];
  const out = domain.normalizeRows(rows);
  assert.equal(out[0].valor, 12.5);
});

// --- datas ------------------------------------------------------------------
check('excelSerialToCivil bate com excelSerialToDate', () => {
  [SER_OUT_2025, SER_NOV_2025, SER_OUT_2024, 45592.5, 1, 60, 61].forEach((serial) => {
    const legacy = excelSerialToDate(serial, true);
    const novo = domain.excelSerialToCivil(serial);
    assert.equal(novo.y, legacy.getFullYear(), `ano ${serial}`);
    assert.equal(novo.m, legacy.getMonth() + 1, `mês ${serial}`);
    assert.equal(novo.d, legacy.getDate(), `dia ${serial}`);
    assert.equal(novo.hh, legacy.getHours(), `hora ${serial}`);
    assert.equal(novo.mi, legacy.getMinutes(), `minuto ${serial}`);
  });
});

check('label de data bate (DD/MM/YYYY)', () => {
  [SER_OUT_2025, SER_NOV_2025, SER_OUT_2024].forEach((serial) => {
    assert.equal(domain.formatDateLabel(domain.excelSerialToCivil(serial)), excelSerialToMonthLabel(serial));
  });
});

check('label de data+hora bate (DD/MM/YYYY HH:MM)', () => {
  [SER_OUT_2025 + 0.6027777778, SER_NOV_2025 + 0.5, SER_OUT_2025 + 0.25].forEach((serial) => {
    assert.equal(
      domain.formatDateTimeLabel(domain.excelSerialToCivil(serial)),
      excelSerialToDateTimeLabel(serial)
    );
  });
});

check('data em string (DD/MM/YYYY HH:mm) é interpretada', () => {
  const out = domain.normalizeRows([['31/10/2024 09:30', 'C', -1, 'x', 'y', SER_OUT_2025, '']]);
  assert.equal(out[0].dataLabel, '31/10/2024 09:30');
  assert.equal(out[0].dataInput, '2024-10-31T09:30');
  assert.equal(out[0].isFuturo, false);
});

check('string ISO (input datetime-local) é interpretada', () => {
  const out = domain.normalizeRows([['2025-10-31T14:41', 'C', -1, 'x', 'y', '2025-10-31', '']]);
  assert.equal(out[0].dataLabel, '31/10/2025 14:41');
  assert.equal(out[0].dataInput, '2025-10-31T14:41');
  assert.equal(out[0].orcamentoInput, '2025-10-31');
  // o orçamento é a DATA: a identidade é o serial do dia (não existe chave de mês)
  assert.equal(out[0].orcamentoSerial, SER_OUT_2025);
  assert.equal(out[0].orcamentoLabel, '31/10/2025');
  assert.equal(out[0].orcamentoKey, undefined);
  assert.equal(out[0].orcamentoLabelMes, undefined);
});

check('lançamento sem data é marcado como futuro', () => {
  const out = domain.normalizeRows([['', 'C', -1, 'x', 'y', SER_OUT_2025, '']]);
  assert.equal(out[0].isFuturo, true);
  assert.equal(out[0].dataLabel, null);
});

// --- agregações -------------------------------------------------------------
check('aggregateByBudget bate com o legado (agrupando pelo mesmo label)', () => {
  // Diferenças INTENCIONAIS do backend novo:
  //  1) o legado criava um grupo FALSO "31/12/1899" (serial 0) pra cada
  //     lançamento sem orçamento — o novo ignora lançamento sem orçamento;
  //  2) o legado gerava dois grupos quando a mesma data aparecia como serial
  //     e como texto ("31/10/2024") — o novo unifica pela DATA.
  // O agrupamento é sempre pela data-chave (o orçamento É a data): duas
  // datas no mesmo mês são dois orçamentos.
  const legacy = legacyAggregateByBudget(LEGACY_ENTRIES).filter((item) => item.orcamento !== 0);
  const legacyMerged = new Map();
  legacy.forEach((item) => {
    const current = legacyMerged.get(item.label) || { label: item.label, sum: 0, incomes: 0, expenses: 0, count: 0 };
    current.sum = Number((current.sum + item.sum).toFixed(2));
    current.incomes = Number((current.incomes + item.incomes).toFixed(2));
    current.expenses = Number((current.expenses + item.expenses).toFixed(2));
    current.count += item.count;
    legacyMerged.set(item.label, current);
  });

  const novo = domain.aggregateByBudget(normalized);
  assert.equal(novo.length, legacyMerged.size);
  novo.forEach((item) => {
    const esperado = legacyMerged.get(item.label);
    assert.ok(esperado, `label inesperado ${item.label}`);
    assert.equal(item.sum, esperado.sum, `sum ${item.label}`);
    assert.equal(item.incomes, esperado.incomes, `incomes ${item.label}`);
    assert.equal(item.expenses, esperado.expenses, `expenses ${item.label}`);
    assert.equal(item.count, esperado.count, `count ${item.label}`);
  });
});

check('aggregateByAccount bate com o legado', () => {
  const legacy = legacyAggregateByAccount(LEGACY_ENTRIES);
  const novo = domain.aggregateByAccount(normalized);
  assert.deepEqual(
    novo.map((a) => a.conta),
    legacy.map((a) => a.conta)
  );
  legacy.forEach((item, i) => {
    assert.equal(novo[i].total, item.total, `total ${i}`);
    assert.equal(novo[i].count, item.count, `count ${i}`);
  });
});

check('resumo (summarize) bate com os totais do agrupamento legado', () => {
  const legacy = legacyGroupEntriesByBudgetAndAccount(LEGACY_ENTRIES).totals;
  const novo = domain.summarize(normalized);
  assert.equal(novo.receitas, legacy.receitas);
  assert.equal(novo.despesas, legacy.despesas);
  assert.equal(novo.saldo, legacy.saldo);
  assert.equal(novo.count, legacy.count);
});

check('transferência entra só no saldo (não conta como receita/despesa)', () => {
  const resumo = domain.summarize(normalized);
  // receitas: 2000 (salário) — transferências (100) e futuro (-50) fora
  assert.equal(resumo.receitas, 2000);
  // despesas: -150.5 (mercado) - 33.33 (café) - 75.25 (conta antiga) — transferências e futuro fora
  assert.equal(resumo.despesas, -259.08);
  assert.equal(resumo.count, 4);
});

// --- filtros ----------------------------------------------------------------
check('filtro por intervalo seleciona os mesmos lançamentos do legado', () => {
  const legacy = legacyFilterEntriesByInterval(LEGACY_ENTRIES);
  const hoje = domain.formatDateInput(domain.civilToday());
  const intervalo = domain.intervalSerials(hoje);
  const novo = domain.filterByInterval(normalized, intervalo.startSerial, intervalo.endSerial);
  assert.deepEqual(
    novo.map((e) => e.rowIndex),
    legacy.map((e) => e.rowIndex)
  );
});

check('filtro por conta/categoria/orçamento funciona', () => {
  // O backend legado devolvia as entradas em ordem decrescente de rowIndex;
  // o novo normaliza em ordem de planilha e ordena DEPOIS do filtro. Comparamos
  // o resultado já ordenado (mesma ordenação "original" dos dois lados).
  const porConta = domain.sortEntries(domain.applyFilters(normalized, { conta: 'Carteira' }), 'original');
  assert.deepEqual(porConta.map((e) => e.rowIndex), [8, 5, 4, 2]);

  const porCategoria = domain.sortEntries(domain.applyFilters(normalized, { categoria: 'Alimentação' }), 'original');
  assert.deepEqual(porCategoria.map((e) => e.rowIndex), [10, 2]);

  const porOrcamento = domain.sortEntries(domain.applyFilters(normalized, { orcamento: String(SER_NOV_2025) }), 'original');
  assert.deepEqual(porOrcamento.map((e) => e.rowIndex), [10, 4, 3]);
});

check('filtro de orçamento aceita serial, data BR e data ISO', () => {
  const porSerial = domain.applyFilters(normalized, { orcamento: String(SER_NOV_2025) });
  const porBr = domain.applyFilters(normalized, { orcamento: '30/11/2025' });
  const porIso = domain.applyFilters(normalized, { orcamento: '2025-11-30' });
  assert.deepEqual(porSerial.map((e) => e.rowIndex), porBr.map((e) => e.rowIndex));
  assert.deepEqual(porSerial.map((e) => e.rowIndex), porIso.map((e) => e.rowIndex));
  assert.equal(porSerial.length, 3);
});

check('orçamento é identificado pela DATA: duas datas no mesmo mês são DOIS orçamentos', () => {
  const rows = [
    [SER_NOV_2025, 'Carteira', -10, 'A', 'Casa', SER_NOV_2025, ''],       // 30/11/2025
    [SER_NOV_2025, 'Carteira', -20, 'B', 'Casa', SER_NOV_2025 - 15, '']    // 15/11/2025
  ];
  const out = domain.normalizeRows(rows);

  // agregação: um card por data
  const budgets = domain.aggregateByBudget(out);
  assert.equal(budgets.length, 2);
  assert.deepEqual(budgets.map((b) => b.label), ['30/11/2025', '15/11/2025']);
  assert.deepEqual(budgets.map((b) => b.sum), [-10, -20]);

  // opções do filtro: uma opção por data
  const meta = domain.buildMeta(out);
  assert.equal(meta.orcamentos.length, 2);
  assert.deepEqual(meta.orcamentos.map((o) => o.label), ['30/11/2025', '15/11/2025']);

  // filtro: pega só a data exata
  const soDia30 = domain.applyFilters(out, { orcamento: String(SER_NOV_2025) });
  assert.equal(soDia30.length, 1);
  assert.equal(soDia30[0].descricao, 'A');
});

check('filtro por período respeita o intervalo', () => {
  const filtrado = domain.sortEntries(
    domain.applyFilters(normalized, { dataInicio: '2025-11-01', dataFim: '2025-11-30' }),
    'original'
  );
  assert.deepEqual(filtrado.map((e) => e.rowIndex), [10, 3]);
});

check('filtro por tipo (consolidado/futuro) funciona', () => {
  const consolidados = domain.applyFilters(normalized, { tipo: 'consolidado' });
  const futuros = domain.applyFilters(normalized, { tipo: 'futuro' });
  assert.equal(futuros.length, 1);
  assert.equal(futuros[0].rowIndex, 4);
  assert.ok(consolidados.every((e) => !e.isFuturo));
});

check('busca textual bate com o legado', () => {
  ['mercado', 'salário', 'CARTEIRA', 'cafe', 'compras', 'luz'].forEach((termo) => {
    const legacy = legacyFilterEntries(LEGACY_ENTRIES, termo).map((e) => e.rowIndex);
    const novo = domain.searchEntries(normalized, termo).map((e) => e.rowIndex);
    assert.deepEqual(novo, legacy, `termo "${termo}"`);
  });
});

// --- ordenação --------------------------------------------------------------
check('ordenação "original" bate com o legado', () => {
  const legacy = legacySortEntries(LEGACY_ENTRIES, 'original').map((e) => e.rowIndex);
  const novo = domain.sortEntries(normalized, 'original').map((e) => e.rowIndex);
  assert.deepEqual(novo, legacy);
});

check('ordenação "date" (numérico) bate com o legado', () => {
  const legacy = legacySortEntries(LEGACY_ENTRIES, 'date').map((e) => e.rowIndex);
  const novo = domain.sortEntries(normalized, 'date').map((e) => e.rowIndex);

  // O legado colocava data em texto no topo (NaN -> MAX_SAFE_INTEGER na ordenação
  // decrescente). O backend novo interpreta a data e ordena pela data real.
  const legacyNumericos = legacy.filter((rowIndex) =>
    LEGACY_ENTRIES.find((e) => e.rowIndex === rowIndex).data !== undefined &&
    typeof LEGACY_ENTRIES.find((e) => e.rowIndex === rowIndex).data === 'number'
  );
  const novoNumericos = novo.filter((rowIndex) =>
    normalized.find((e) => e.rowIndex === rowIndex).dataSerial !== null &&
    typeof normalized.find((e) => e.rowIndex === rowIndex).data === 'number'
  );
  assert.deepEqual(novoNumericos, legacyNumericos);

  // a entrada com data em texto entra no fim (2024 < 2025); dentro de 2024,
  // a data em midnight (serial) vem antes da data em texto (09:30)
  assert.equal(novo[novo.length - 1], 8);
  assert.equal(novo[novo.length - 2], 7);
});

check('ordenação "budget_date" mantém a ordem dos orçamentos válidos', () => {
  const legacy = legacySortEntries(LEGACY_ENTRIES, 'budget_date').map((e) => e.rowIndex);
  const novo = domain.sortEntries(normalized, 'budget_date').map((e) => e.rowIndex);

  // Diferença INTENCIONAL: o legado colocava orçamento inválido/ausente no
  // topo (NaN). O backend novo coloca no fim.
  const comOrcamento = novo.filter((rowIndex) => rowIndex !== 7 && rowIndex !== 8);
  const legadoComOrcamento = legacy.filter((rowIndex) => rowIndex !== 7 && rowIndex !== 8);
  assert.deepEqual(comOrcamento, legadoComOrcamento);
  assert.deepEqual(novo.slice(-2).sort(), [7, 8]);
});

// --- meta (opções de filtro) ------------------------------------------------
check('meta lista contas, categorias e orçamentos', () => {
  const meta = domain.buildMeta(normalized);
  assert.deepEqual(meta.contas, ['Banco', 'Carteira', 'Conta Antiga']);
  assert.deepEqual(meta.categorias, ['Alimentação', 'Casa', 'Lazer', 'Renda', 'Transferência']);
  // uma opção por DATA (mais recente primeiro)
  assert.deepEqual(
    meta.orcamentos.map((o) => o.serial),
    [SER_NOV_2025, SER_OUT_2025, SER_OUT_2024]
  );
  assert.deepEqual(
    meta.orcamentos.map((o) => o.label),
    ['30/11/2025', '31/10/2025', '31/10/2024']
  );
});

// --- detalhes ---------------------------------------------------------------
check('detalhes: top categorias, contas e gráfico por tipo', () => {
  const detalhes = domain.buildDetails(
    normalized,
    [SER_OUT_2025],
    [
      { categoria: 'Alimentação', tipo: 'PRECISO' },
      { categoria: 'Transferência', tipo: 'TRANSFERÊNCIA' },
      { categoria: 'Renda', tipo: 'RENDA' }
    ]
  );

  // top categorias (só despesas) do orçamento de outubro/2025
  assert.deepEqual(detalhes.topCategorias.map((c) => c.categoria), ['Alimentação']);

  // contas do orçamento (inclui as duas pernas da transferência)
  assert.deepEqual(detalhes.contas.map((c) => c.conta).sort(), ['Banco', 'Carteira']);

  // gráfico ignora TRANSFERÊNCIA
  assert.deepEqual(detalhes.grafico.map((g) => g.tipo), ['PRECISO']);
  assert.equal(detalhes.grafico[0].valor, 150.5);
  assert.equal(detalhes.grafico[0].percentual, 100);

  // lançamentos da categoria (só despesas)
  assert.deepEqual(detalhes.entradasPorCategoria['Alimentação'].map((e) => e.rowIndex), [2]);
});

check('detalhes: totalGeral soma todos os valores do orçamento', () => {
  const detalhes = domain.buildDetails(normalized, [SER_OUT_2025], []);
  // -150.5 (mercado) -100 (transferência saída) +100 (transferência entrada) = -150.5
  assert.equal(detalhes.totalGeral, -150.5);
});

// --- escrita (normalização de data no payload) -------------------------------
check('normalizeWriteDate converte input do form pra formato do Sheets', () => {
  assert.equal(domain.normalizeWriteDate('2025-10-31T14:41', true), '31/10/2025 14:41');
  assert.equal(domain.normalizeWriteDate('2025-10-31', false), '31/10/2025');
  assert.equal(domain.normalizeWriteDate('31/10/2025 14:41', true), '31/10/2025 14:41');
  assert.equal(domain.normalizeWriteDate('31/10/2025', true), '31/10/2025');
});

check('normalizeWriteDate preserva número (serial) e texto livre', () => {
  assert.equal(domain.normalizeWriteDate(45932, false), 45932);
  assert.equal(domain.normalizeWriteDate('quando eu quiser', true), 'quando eu quiser');
  assert.equal(domain.normalizeWriteDate('', true), '');
  assert.equal(domain.normalizeWriteDate(undefined, true), '');
});

// --- filtros ativos (pills de "Filtros aplicados") ---------------------------
check('buildActiveFilters devolve lista vazia sem filtros', () => {
  const ativos = domain.buildActiveFilters(
    { q: '', conta: '', categoria: '', orcamento: '', dataInicio: '', dataFim: '' },
    domain.buildMeta(normalized)
  );
  assert.deepEqual(ativos, []);
});

check('buildActiveFilters monta os pills com rótulo e valor prontos', () => {
  const meta = domain.buildMeta(normalized);
  const ativos = domain.buildActiveFilters(
    {
      q: 'mercado',
      conta: 'Carteira',
      categoria: 'Alimentação',
      orcamento: String(SER_OUT_2025),
      dataInicio: '2025-10-01',
      dataFim: '2025-10-31'
    },
    meta
  );

  assert.deepEqual(ativos, [
    { tipo: 'conta', rotulo: 'Conta', valor: 'Carteira' },
    { tipo: 'categoria', rotulo: 'Categoria', valor: 'Alimentação' },
    { tipo: 'orcamento', rotulo: 'Orçamento', valor: '31/10/2025' },
    { tipo: 'periodo', rotulo: 'Período', valor: '01/10/2025 — 31/10/2025' },
    { tipo: 'busca', rotulo: 'Busca', valor: '"mercado"' }
  ]);
});

check('filtro de orçamento mostra a DATA COMPLETA, nunca a chave do mês', () => {
  const meta = domain.buildMeta(normalized);
  const ativos = domain.buildActiveFilters({ orcamento: String(SER_NOV_2025) }, meta);
  assert.equal(ativos[0].valor, '30/11/2025');
  assert.notEqual(ativos[0].valor, '11/2025');
  // formato DD/MM/YYYY (nunca MM/YYYY)
  assert.match(ativos[0].valor, /^\d{2}\/\d{2}\/\d{4}$/);
});

check('meta: label do orçamento é a data completa', () => {
  const meta = domain.buildMeta(normalized);
  const nov2025 = meta.orcamentos.find((o) => o.serial === SER_NOV_2025);
  assert.equal(nov2025.label, '30/11/2025');
  assert.equal(nov2025.key, undefined);
  assert.equal(nov2025.labelMes, undefined);
});

// --- data-chave sugerida (formulários) --------------------------------------
check('resolveProximoOrcamento usa a primeira data-chave que ainda vem', () => {
  // 15/11/2025 -> a próxima é 30/11/2025
  const r = domain.resolveProximoOrcamento(normalized, { y: 2025, m: 11, d: 15 });
  assert.equal(r, '2025-11-30');
});

check('resolveProximoOrcamento cai na última data-chave se não houver futura', () => {
  // 01/12/2025 -> não há mais data-chave; usa a última (30/11/2025)
  const r = domain.resolveProximoOrcamento(normalized, { y: 2025, m: 12, d: 1 });
  assert.equal(r, '2025-11-30');
});

check('resolveProximoOrcamento usa o dia 1 do mês se não houver data-chave', () => {
  const r = domain.resolveProximoOrcamento([], { y: 2026, m: 3, d: 10 });
  assert.equal(r, '2026-03-01');
});

check('resolveOrcamentoMesAtual usa a data-chave já existente no mês', () => {
  const r = domain.resolveOrcamentoMesAtual(normalized, { y: 2025, m: 10, d: 15 });
  assert.equal(r, '2025-10-31');
});

check('resolveOrcamentoMesAtual usa o dia 1 do mês se não houver data-chave no mês', () => {
  const r = domain.resolveOrcamentoMesAtual(normalized, { y: 2026, m: 3, d: 10 });
  assert.equal(r, '2026-03-01');
});

check('meta traz as datas-chave sugeridas já prontas pro formulário', () => {
  const meta = domain.buildMeta(normalized, { y: 2025, m: 11, d: 15 });
  assert.equal(meta.proximoOrcamento, '2025-11-30');
  assert.equal(meta.orcamentoMesAtual, '2025-11-30');
});

console.log(`\n${passed} verificações passaram.\n`);
