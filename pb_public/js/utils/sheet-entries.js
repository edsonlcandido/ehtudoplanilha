/**
 * Utilitários para manipular sheet entries (serial Excel, filtros e agregações)
 * Uso: import { toExcelSerial, excelSerialToDate, getIntervalSerials, filterEntriesByInterval, aggregateByBudget } from './utils/sheet-entries.js'
 */

import apiConfig from '../config/api-config.js';


// Converte Date -> serial Excel (corrige bugs de timezone e leap year)
export function toExcelSerial(date, dataHora = false) {
  if (!date || !(date instanceof Date)) return NaN;

  // Função auxiliar para verificar se um ano é bissexto
  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };
  
  // Clone da data para não modificar a original
  const d = new Date(date);
  
  // Ajusta para meio-dia para evitar problemas de timezone
  if (!dataHora) {
    d.setHours(12, 0, 0, 0);
  }
  
  // Método alternativo para calcular o Excel Serial
  // Cria uma data base (31/12/1899 00:00:00 GMT)
  const baseDate = new Date(Date.UTC(1899, 11, 31, 0, 0, 0));
  
  // Calcula diferença em dias entre as datas
  const msPerDay = 24 * 60 * 60 * 1000;
  let days = (d.getTime() - baseDate.getTime()) / msPerDay;
  
  // Corrige para o bug de leap year do Excel (considerar 29/02/1900 como válido)
  const excelDate1900LeapBug = new Date(Date.UTC(1900, 1, 28, 0, 0, 0)); // 28/02/1900
  if (d > excelDate1900LeapBug) {
    days += 1; // Adiciona 1 dia para compensar o bug do ano bissexto
  }
  
  // Força o valor para número com 10 casas decimais no máximo (evita imprecisões)
  return Number(days.toFixed(10));
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
export function budgetsInEntries(entries = [], orcamentoField = 'orcamento') {

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

// Converte somente a parte de data (dia) para serial Excel inteiro (sem horário)
// Evita depender de timezone local usando Date.UTC
export function toExcelSerialDia(date) {
  if (!(date instanceof Date)) return NaN;
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const base = Date.UTC(1899, 11, 31); // 31/12/1899
  const target = Date.UTC(y, m, d);
  let days = Math.round((target - base) / 86400000);
  if (days >= 60) days += 1; // bug do 29/02/1900
  return days;
}