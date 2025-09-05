/**
 * Utilitários para manipular sheet entries (serial Excel, filtros e agregações)
 * Uso: import { toExcelSerial, excelSerialToDate, getIntervalSerials, filterEntriesByInterval, aggregateByBudget } from './utils/sheet-entries.js'
 */

import apiConfig from '../config/api-config.js';


// Converte Date -> serial Excel (corrige bug 1900 leap year)
export function toExcelSerial(date) {
  if (!date || !(date instanceof Date)) return NaN;
  const baseUtc = Date.UTC(1899, 11, 31, 0, 0, 0);
  const utcMillis = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
  let serial = (utcMillis - baseUtc) / 86400000; // dias com fração
  if (serial >= 60) serial += 1; // corrige bug do Excel
  return serial;
}

// Converte serial Excel -> Date (ou null se inválido)
export function excelSerialToDate(serial) {
  const s = Number(serial);
  if (!Number.isFinite(s)) return null;
  const adj = s >= 60 ? s - 1 : s;
  const baseUtc = Date.UTC(1899, 11, 31, 0, 0, 0);
  const ms = baseUtc + adj * 86400000;
  return new Date(ms);
}

// Calcula intervalo padrão: hoje -5 dias (início do dia) até hoje +35 dias (fim do dia)
// Retorna { startSerial, endSerial, startDate, endDate }
export function getIntervalSerials(offsetStart = -5, offsetEnd = 35) {
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

// Filtra entries por intervalo. field pode ser 'data' ou 'orcamento' ou outro campo numérico.
export function filterEntriesByInterval(entries = [], field = 'data') {
  const { startSerial, endSerial, startDate, endDate } = getIntervalSerials();
  // Filtra somente valores numéricos válidos dentro do intervalo
  return (entries || []).filter(e => {
    const v = e && e[field];
    return typeof v === 'number' && !Number.isNaN(v) && v >= startSerial && v <= endSerial;
  });
}

// Formata serial Excel para label 'DD/MM/YYYY'
export function excelSerialToMonthLabel(serial) {
  const d = excelSerialToDate(serial);
  if (!d) return String(serial);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Agrega entries por orcamento (campo 'orcamento' por padrão).
// Retorna array com { orcamento, label, count, sum, incomes, expenses }
export function aggregateByBudget(entries = [], orcamentoField = 'orcamento') {
  const map = new Map();

  (entries || []).forEach(e => {
    let keyRaw = e && e[orcamentoField];
    // tenta normalizar: se for string numérica converte, se for date-string tenta converter para serial,
    // caso contrário ignora
    let key = Number(keyRaw);
    if (!Number.isFinite(key)) {
      // se for possível interpretar como 'DD/MM/YYYY' ou 'MM/YYYY', tentar parse simples
      if (typeof keyRaw === 'string' && keyRaw.includes('/')) {
        const parts = keyRaw.split('/');
        if (parts.length === 3) {
          // DD/MM/YYYY
          const [dd, mm, yyyy] = parts.map(p => Number(p));
          if ([dd, mm, yyyy].every(Number.isFinite)) {
            key = toExcelSerial(new Date(yyyy, mm - 1, dd));
          }
        } else if (parts.length === 2) {
          // MM/YYYY -> usar dia 1
          const [mm, yyyy] = parts.map(p => Number(p));
          if ([mm, yyyy].every(Number.isFinite)) {
            key = toExcelSerial(new Date(yyyy, mm - 1, 1));
          }
        }
      }
    }
    if (!Number.isFinite(key)) return; // não conseguiu normalizar

    const valor = Number(e.valor) || 0;
    const existing = map.get(key) || { orcamento: key, sum: 0, count: 0, incomes: 0, expenses: 0 };
    existing.sum += valor;
    existing.count += 1;
    if (valor >= 0) existing.incomes += valor; else existing.expenses += valor;
    map.set(key, existing);
  });

  const result = Array.from(map.values()).map(item => ({
    orcamento: item.orcamento,
    label: excelSerialToMonthLabel(item.orcamento),
    count: item.count,
    sum: Number(item.sum.toFixed(2)),
    incomes: Number(item.incomes.toFixed(2)),
    expenses: Number(item.expenses.toFixed(2))
  })).sort((a, b) => b.orcamento - a.orcamento);

  return result;
}

/**
 * Carrega entradas da sheet via endpoint /get-sheet-entries
 * - limit > 0: retorna até `limit` entradas (padrão comportamental)
 * - limit === 0: tenta retornar todas as linhas;. primeiro tenta chamar com limit=0,
 *   se o servidor responder com limitação parcial, faz uma segunda chamada com limit=total
 * Retorna o objeto JSON completo retornado pelo endpoint.
 */
export async function loadSheetEntries(limit = 100) {
  const token = (window.pb && window.pb.authStore && window.pb.authStore.token) || '';

  async function callWithLimit(l) {
    const url = `${apiConfig.getBaseURL()}/get-sheet-entries?limit=${encodeURIComponent(l)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const text = await res.text().catch(() => null);
    // tenta parsear JSON quando possível
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      // corpo não é JSON
      data = null;
    }

    if (!res.ok) {
      const msg = data && data.error ? data.error : text || `HTTP ${res.status}`;
      const err = new Error(`Erro ao carregar sheet entries: ${msg}`);
      err.status = res.status;
      err.body = data || text;
      throw err;
    }

    return data;
  }

  // Primeira chamada
  const first = await callWithLimit(limit);

  // Se o usuário pediu todas as linhas (limit === 0) e o servidor devolveu apenas parte,
  // fazer uma segunda chamada com limit = total (quando disponível) para garantir todas as linhas.
  if (limit === 0 && first && Array.isArray(first.entries) && typeof first.total === 'number') {
    if (first.limit !== 0 && first.entries.length < first.total) {
      // tenta buscar todas as linhas pedindo explicitamente limit=total
      const second = await callWithLimit(first.total);
      return second || first;
    }
  }

  return first;
}