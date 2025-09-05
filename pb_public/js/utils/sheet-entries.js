/**
 * Utilitários para manipular sheet entries (serial Excel, filtros e agregações)
 * Uso: import { toExcelSerial, excelSerialToDate, getIntervalSerials, filterEntriesByInterval, aggregateByBudget } from './utils/sheet-entries.js'
 */

import apiConfig from '../config/api-config.js';


// Converte Date -> serial Excel (corrige bug 1900 leap year)
// dataHora = false -> usa apenas ano/mês/dia (meia-noite local)
// dataHora = true  -> inclui horas/minutos/segundos/milisegundos (hora local)
export function toExcelSerial(date, dataHora = false) {
  if (!date || !(date instanceof Date)) return NaN;
  // Cria ms em UTC a partir dos componentes locais para evitar shift de timezone.
  // Se dataHora=false usamos apenas componente de data (midnight local).
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const hh = dataHora ? date.getHours() : 0;
  const mm = dataHora ? date.getMinutes() : 0;
  const ss = dataHora ? date.getSeconds() : 0;
  const ms = dataHora ? date.getMilliseconds() : 0;

  const utc = Date.UTC(y, m, d, hh, mm, ss, ms);
  const baseUtc = Date.UTC(1899, 11, 31);
  let serial = (utc - baseUtc) / 86400000; // dias (pode ser fracionário)
  if (serial >= 60) serial += 1; // corrige bug do Excel (29/02/1900 inexistente)
  return serial;
}

// Converte serial Excel -> Date (ou null se inválido)
// dataHora = false -> retorna Date local com ano/mês/dia esperados (hora = 00:00:00)
// dataHora = true  -> retorna Date local com componentes de data e hora (preserva fração de dia)
export function excelSerialToDate(serial, dataHora = false) {
  const s = Number(serial);
  if (!Number.isFinite(s)) return null;
  const adj = s >= 60 ? s - 1 : s;
  const baseUtc = Date.UTC(1899, 11, 31);
  const ms = baseUtc + adj * 86400000;
  const utcDate = new Date(ms);
  // Extrai componentes UTC e cria um Date local com os mesmos componentes,
  // garantindo que o objeto Date final tenha os mesmos ano/mês/dia(/hora) "visíveis" no horário local.
  const yyyy = utcDate.getUTCFullYear();
  const mm = utcDate.getUTCMonth();
  const dd = utcDate.getUTCDate();
  if (!dataHora) {
    return new Date(yyyy, mm, dd);
  }
  const hh = utcDate.getUTCHours();
  const mins = utcDate.getUTCMinutes();
  const ss = utcDate.getUTCSeconds();
  const mss = utcDate.getUTCMilliseconds();
  return new Date(yyyy, mm, dd, hh, mins, ss, mss);
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
export function filterEntriesByInterval(entries = [], field = 'orcamento') {
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


//Função para mostrar os orcamentos disponiveis num intevalo de entradas filtrado
//Retorna um array com {orcamento, label}
export function budgetsInInterval(entries = [], orcamentoField = 'orcamento') {

  // Função auxiliar para normalizar o valor do orçamento em um serial Excel (number) ou null
  const normalizeToSerial = (raw) => {
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
        // MM/YYYY -> usar dia 1
        const [mm, yyyy] = parts.map(p => Number(p));
        if ([mm, yyyy].every(Number.isFinite)) {
          return toExcelSerial(new Date(yyyy, mm - 1, 1));
        }
      }
    }

    return null;
  };

  const map = new Map();
  (entries || []).forEach(e => {
    const raw = e && e[orcamentoField];
    const serial = normalizeToSerial(raw);
    if (!Number.isFinite(serial)) return;
    if (!map.has(serial)) {
      map.set(serial, { orcamento: serial, label: excelSerialToMonthLabel(serial) });
    }
  });

  // Retorna array ordenado por orcamento asc
  return Array.from(map.values()).sort((a, b) => a.orcamento - b.orcamento);

}