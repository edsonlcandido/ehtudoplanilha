/// <reference path="../pb_data/types.d.ts" />

/**
 * Helper de DOMÍNIO de lançamentos — todas as regras de negócio do app.
 *
 * Este arquivo é a FONTE ÚNICA da verdade das transformações de lançamentos:
 * conversão Excel Serial <-> data, classificação (consolidado/futuro/transferência),
 * normalização de linhas da planilha, filtros, ordenação e agregações.
 *
 * O frontend (src/) NÃO deve reimplementar nada daqui: ele consome o DTO
 * pronto e só renderiza.
 *
 * ARQUIVO PURO (.js, NÃO .pb.js) de propósito:
 *  - o PocketBase rejeita `module.exports` em arquivos `.pb.js`
 *  - por ser CommonJS puro, dá pra rodar/testar fora do PocketBase (node)
 *
 * Carregado via require() DENTRO do handler:
 *   const domain = require(`${__hooks}/_lancamentos-domain.js`);
 *
 * SEM dependência de APIs do PocketBase (nada de $app/$http aqui) — assim o
 * mesmo arquivo serve pros hooks e pros testes.
 */

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const CATEGORIA_TRANSFERENCIA = 'transferência';

const TIPOS_IGNORADOS_NO_GRAFICO = [
  'TRANSFERÊNCIA', 'TRANSFERENCIA', 'SALDO', 'RENDA', 'RECEITA'
];

// Excel epoch: 31/12/1899 00:00 UTC
const EXCEL_BASE_UTC = Date.UTC(1899, 11, 31);
const MS_PER_DAY = 86400000;

// ============================================================================
// Datas
// ============================================================================

/**
 * Converte Excel Serial em data "civil" (sem timezone).
 * Mesma semântica de `excelSerialToDate` do frontend: os componentes vêm
 * do UTC do serial (o frontend construía uma Date local com esses mesmos
 * componentes, então o resultado é idêntico em qualquer timezone).
 *
 * @param {number} serial
 * @returns {{y:number,m:number,d:number,hh:number,mi:number,ss:number}|null}
 */
function excelSerialToCivil(serial) {
  const s = Number(serial);
  if (!isFinite(s)) return null;

  const adj = s >= 60 ? s - 1 : s;
  const utc = new Date(EXCEL_BASE_UTC + adj * MS_PER_DAY);

  return {
    y: utc.getUTCFullYear(),
    m: utc.getUTCMonth() + 1,
    d: utc.getUTCDate(),
    hh: utc.getUTCHours(),
    mi: utc.getUTCMinutes(),
    ss: utc.getUTCSeconds()
  };
}

/**
 * Converte data "civil" em Excel Serial.
 * @param {{y:number,m:number,d:number,hh?:number,mi?:number,ss?:number}} civil
 * @returns {number} NaN se inválido
 */
function civilToExcelSerial(civil) {
  if (!civil) return NaN;
  const ts = Date.UTC(
    civil.y,
    civil.m - 1,
    civil.d,
    civil.hh || 0,
    civil.mi || 0,
    civil.ss || 0
  );
  let days = (ts - EXCEL_BASE_UTC) / MS_PER_DAY;

  // Corrige o bug do Excel: ele considera 29/02/1900 como dia válido
  if (ts > Date.UTC(1900, 1, 28)) {
    days += 1;
  }
  return Number(days.toFixed(10));
}

/**
 * Serial Excel (dia inteiro, sem hora) a partir de uma data civil.
 * @param {{y:number,m:number,d:number}} civil
 */
function civilToExcelSerialDia(civil) {
  if (!civil) return NaN;
  let days = Math.round((Date.UTC(civil.y, civil.m - 1, civil.d) - EXCEL_BASE_UTC) / MS_PER_DAY);
  if (days >= 60) days += 1;
  return days;
}

/**
 * "DD/MM/YYYY"
 */
function formatDateLabel(civil) {
  if (!civil) return null;
  return pad2(civil.d) + '/' + pad2(civil.m) + '/' + civil.y;
}

/**
 * "DD/MM/YYYY HH:MM"
 */
function formatDateTimeLabel(civil) {
  if (!civil) return null;
  return formatDateLabel(civil) + ' ' + pad2(civil.hh) + ':' + pad2(civil.mi);
}

/**
 * "YYYY-MM-DD" (formato de <input type="date">)
 */
function formatDateInput(civil) {
  if (!civil) return null;
  return civil.y + '-' + pad2(civil.m) + '-' + pad2(civil.d);
}

/**
 * "YYYY-MM-DDTHH:MM" (formato de <input type="datetime-local">)
 */
function formatDateTimeInput(civil) {
  if (!civil) return null;
  return formatDateInput(civil) + 'T' + pad2(civil.hh) + ':' + pad2(civil.mi);
}

/**
 * Chave de orçamento "MM/YYYY" (usada nos filtros e nos agrupamentos)
 */
function civilToMonthKey(civil) {
  if (!civil) return null;
  return pad2(civil.m) + '/' + civil.y;
}

/**
 * Label amigável de um mês "Outubro/2025"
 */
function monthKeyToLabel(key) {
  if (!key) return null;
  const parts = String(key).split('/');
  if (parts.length !== 2) return String(key);
  const mm = parseInt(parts[0], 10);
  const yyyy = parts[1];
  const idx = mm - 1;
  if (isNaN(idx) || idx < 0 || idx > 11) return String(key);
  return MESES_PT[idx] + '/' + yyyy;
}

/**
 * Converte um valor cru da planilha (serial numérico ou string) em data civil.
 * Aceita:
 *   - number  -> Excel Serial
 *   - "DD/MM/YYYY" / "DD/MM/YYYY HH:mm"  (formato brasileiro)
 *   - "YYYY-MM-DD" / "YYYY-MM-DDTHH:mm"  (formato ISO / input HTML5)
 *
 * @returns {{y,m,d,hh,mi,ss}|null}
 */
function parseDateValue(raw) {
  if (raw === null || raw === undefined || raw === '') return null;

  if (typeof raw === 'number') {
    return excelSerialToCivil(raw);
  }

  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  // ISO: "YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm(:ss)"
  const isoMatch = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (isoMatch) {
    return {
      y: parseInt(isoMatch[1], 10),
      m: parseInt(isoMatch[2], 10),
      d: parseInt(isoMatch[3], 10),
      hh: isoMatch[4] ? parseInt(isoMatch[4], 10) : 0,
      mi: isoMatch[5] ? parseInt(isoMatch[5], 10) : 0,
      ss: isoMatch[6] ? parseInt(isoMatch[6], 10) : 0,
      hasTime: !!isoMatch[4]
    };
  }

  // Brasileiro: "DD/MM/YYYY" ou "DD/MM/YYYY HH:mm"
  const brMatch = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ](\d{1,2}):(\d{2}))?$/
  );
  if (brMatch) {
    return {
      y: parseInt(brMatch[3], 10),
      m: parseInt(brMatch[2], 10),
      d: parseInt(brMatch[1], 10),
      hh: brMatch[4] ? parseInt(brMatch[4], 10) : 0,
      mi: brMatch[5] ? parseInt(brMatch[5], 10) : 0,
      ss: 0,
      hasTime: !!brMatch[4]
    };
  }

  return null;
}

/**
 * Normaliza um valor de data vindo do formulário (ou do PWA) para o texto
 * que o Sheets entende no write (valueInputOption=USER_ENTERED).
 *
 * Regras:
 *  - string que é data  -> "DD/MM/YYYY" (data) ou "DD/MM/YYYY HH:mm" (com hora)
 *  - string que não é data -> preserva (texto livre)
 *  - número (serial Excel) -> preserva (compatibilidade com o PWA)
 *
 * @param {string|number} raw
 * @param {boolean} comHora
 */
function normalizeWriteDate(raw, comHora) {
  if (raw === undefined || raw === null || raw === '') return '';
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string') return raw;

  const civil = parseDateValue(raw);
  if (!civil) return raw;

  if (comHora && civil.hasTime) {
    return formatDateTimeLabel(civil);
  }
  return formatDateLabel(civil);
}

/**
 * Converte a data civil para o texto que o Sheets entende (USER_ENTERED).
 * Aceita "YYYY-MM-DDTHH:MM", "YYYY-MM-DD", "DD/MM/YYYY HH:mm", "DD/MM/YYYY"
 * e Excel Serial.
 *
 * @param {string|number} raw
 * @param {boolean} comHora - true: "DD/MM/YYYY HH:mm"; false: "DD/MM/YYYY"
 * @returns {string} string vazio se não houver data
 */
function toSheetDate(raw, comHora) {
  const civil = parseDateValue(raw);
  if (!civil) return '';
  return comHora ? formatDateTimeLabel(civil) : formatDateLabel(civil);
}

// ============================================================================
// Linhas da planilha -> DTO
// ============================================================================

/**
 * Verifica se uma linha da planilha está totalmente vazia.
 * Regra herdada do endpoint /get-sheet-entries (mantém uma linha se tiver
 * valor numérico != 0 OU qualquer campo textual preenchido).
 */
function isBlankRow(row) {
  if (!row || !row.length) return true;

  const valor = parseValor(row[2]);
  if (valor !== 0) return false;

  const campos = [row[0], row[1], row[3], row[4], row[5], row[6]];
  return !campos.some(function (v) {
    if (v === null || v === undefined) return false;
    if (typeof v === 'number') return v !== 0;
    return String(v).trim() !== '';
  });
}

/**
 * Converte as linhas cruas da aba "Lançamentos" no DTO normalizado.
 *
 * O DTO carrega o valor cru (compatibilidade com o PWA e com o payload de
 * escrita) E os campos derivados/prontos pra tela:
 *   dataLabel / dataInput / dataSerial
 *   orcamentoLabel / orcamentoKey / orcamentoLabelMes / orcamentoInput
 *   isFuturo / isTransferencia / isReceita / isDespesa
 *
 * @param {Array<Array<any>>} rows linhas sem o cabeçalho
 * @returns {Array<object>}
 */
function normalizeRows(rows) {
  const out = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (isBlankRow(row)) continue;

    const dataCivil = parseDateValue(row[0]);
    const orcamentoCivil = parseDateValue(row[5]);

    const rawData = row[0] === undefined || row[0] === null ? '' : row[0];
    const rawOrcamento = row[5] === undefined || row[5] === null ? '' : row[5];

    const valor = parseValor(row[2]);

    const dataLabel = dataCivil
      ? formatDateTimeLabel(dataCivil)
      : (typeof rawData === 'string' && rawData.trim() ? rawData : null);

    const orcamentoKey = orcamentoCivil ? civilToMonthKey(orcamentoCivil) : null;

    const categoria = String(row[4] || '');

    out.push({
      // --- campos crus (mantidos por compatibilidade) ---
      rowIndex: i + 2,
      data: rawData,
      conta: String(row[1] || ''),
      valor: isFinite(valor) ? valor : 0,
      descricao: String(row[3] || ''),
      categoria: categoria,
      orcamento: rawOrcamento,
      obs: String(row[6] || ''),

      // --- data derivada ---
      dataSerial: dataCivil ? civilToExcelSerial(dataCivil) : null,
      dataLabel: dataLabel,
      dataInput: dataCivil ? formatDateTimeInput(dataCivil) : null,
      dataCivil: dataCivil,

      // --- orçamento derivado ---
      orcamentoSerial: orcamentoCivil ? civilToExcelSerialDia(orcamentoCivil) : null,
      orcamentoLabel: orcamentoCivil ? formatDateLabel(orcamentoCivil) : null,
      orcamentoKey: orcamentoKey,
      orcamentoLabelMes: orcamentoKey ? monthKeyToLabel(orcamentoKey) : null,
      orcamentoInput: orcamentoCivil ? formatDateInput(orcamentoCivil) : null,

      // --- classificação ---
      isFuturo: !dataCivil,
      isTransferencia: categoria.trim().toLowerCase() === CATEGORIA_TRANSFERENCIA,
      isReceita: valor > 0,
      isDespesa: valor < 0
    });
  }

  return out;
}

/**
 * Serializa o DTO pro JSON (remove campos internos como `dataCivil`).
 */
function serializeEntry(entry) {
  const copy = {};
  for (const key in entry) {
    if (key === 'dataCivil') continue;
    copy[key] = entry[key];
  }
  return copy;
}

// ============================================================================
// Filtros
// ============================================================================

/**
 * Filtra por período (dataInicio/dataFim em "YYYY-MM-DD").
 * Entradas sem data são excluídas quando há filtro de período.
 */
function filterByPeriod(entries, dataInicio, dataFim) {
  if (!dataInicio && !dataFim) return entries;

  let inicio = null;
  let fim = null;

  if (dataInicio) {
    const c = parseDateValue(dataInicio);
    if (c) inicio = Date.UTC(c.y, c.m - 1, c.d, 0, 0, 0, 0);
  }
  if (dataFim) {
    const c = parseDateValue(dataFim);
    if (c) fim = Date.UTC(c.y, c.m - 1, c.d, 23, 59, 59, 999);
  }

  return entries.filter(function (e) {
    if (!e.dataCivil) return false;
    const ts = Date.UTC(
      e.dataCivil.y,
      e.dataCivil.m - 1,
      e.dataCivil.d,
      e.dataCivil.hh,
      e.dataCivil.mi,
      e.dataCivil.ss
    );
    if (inicio !== null && ts < inicio) return false;
    if (fim !== null && ts > fim) return false;
    return true;
  });
}

/**
 * Busca textual: data (DD/MM/YYYY), valor, descrição, categoria, conta e obs.
 */
function searchEntries(entries, term) {
  if (!term || !String(term).trim()) return entries;

  const needle = String(term).toLowerCase().trim();

  return entries.filter(function (e) {
    const data = e.dataCivil ? formatDateLabel(e.dataCivil) : '';
    const valor = e.valor ? String(e.valor) : '';
    const descricao = String(e.descricao || '').toLowerCase();
    const categoria = String(e.categoria || '').toLowerCase();
    const conta = String(e.conta || '').toLowerCase();
    const obs = String(e.obs || '').toLowerCase();

    return (
      data.indexOf(needle) !== -1 ||
      valor.indexOf(needle) !== -1 ||
      descricao.indexOf(needle) !== -1 ||
      categoria.indexOf(needle) !== -1 ||
      conta.indexOf(needle) !== -1 ||
      obs.indexOf(needle) !== -1
    );
  });
}

/**
 * Filtra por tipo: 'consolidado' (tem data), 'futuro' (sem data) ou 'todos'.
 */
function filterByType(entries, tipo) {
  if (!tipo || tipo === 'todos') return entries;
  if (tipo === 'consolidado') {
    return entries.filter(function (e) { return !e.isFuturo; });
  }
  if (tipo === 'futuro') {
    return entries.filter(function (e) { return e.isFuturo; });
  }
  return entries;
}

/**
 * Aplica todos os filtros da página de Lançamentos.
 *
 * @param {Array<object>} entries
 * @param {{q?:string,conta?:string,categoria?:string,orcamento?:string,
 *          dataInicio?:string,dataFim?:string,tipo?:string}} filters
 */
function applyFilters(entries, filters) {
  const f = filters || {};
  let out = entries;

  if (f.conta) {
    out = out.filter(function (e) {
      return e.conta && e.conta.trim() === f.conta;
    });
  }

  if (f.categoria) {
    out = out.filter(function (e) {
      return e.categoria && e.categoria.trim() === f.categoria;
    });
  }

  if (f.orcamento) {
    out = out.filter(function (e) {
      return e.orcamentoKey === f.orcamento;
    });
  }

  out = filterByPeriod(out, f.dataInicio, f.dataFim);
  out = filterByType(out, f.tipo);
  out = searchEntries(out, f.q);

  return out;
}

/**
 * Filtra por intervalo de orçamento (serial). Usado no dashboard pra
 * destacar os orçamentos "atuais" (hoje-5 .. hoje+35).
 */
function filterByInterval(entries, startSerial, endSerial) {
  return entries.filter(function (e) {
    // Comportamento original: só considera orçamento numérico cru.
    const v = typeof e.orcamento === 'number' ? e.orcamento : null;
    return v !== null && isFinite(v) && v >= startSerial && v <= endSerial;
  });
}

/**
 * Seriais do intervalo padrão (hoje-5 .. hoje+35).
 *
 * Mesma semântica do `getIntervalSerials` do frontend: os limites são
 * calculados ao meio-dia, o que faz o orçamento do dia inicial ficar
 * FORA do intervalo (exatamente como antes da migração).
 *
 * @param {string} hojeISO "YYYY-MM-DD" (dia local do cliente)
 */
function intervalSerials(hojeISO, offsetStart, offsetEnd) {
  const start = offsetStart === undefined ? -5 : offsetStart;
  const end = offsetEnd === undefined ? 35 : offsetEnd;

  const base = parseDateValue(hojeISO) || civilToday();
  const inicio = civilToExcelSerial({
    y: base.y, m: base.m, d: base.d + start, hh: 12
  });
  const fim = civilToExcelSerial({
    y: base.y, m: base.m, d: base.d + end, hh: 12
  });

  return { startSerial: inicio, endSerial: fim };
}

/**
 * "hoje" do servidor em horário local do servidor (fallback quando o
 * cliente não manda o parâmetro `hoje`).
 */
function civilToday() {
  const now = new Date();
  return {
    y: now.getFullYear(),
    m: now.getMonth() + 1,
    d: now.getDate(),
    hh: now.getHours(),
    mi: now.getMinutes(),
    ss: now.getSeconds()
  };
}

// ============================================================================
// Ordenação
// ============================================================================

/**
 * sortBy: 'original' (rowIndex desc) | 'date' | 'budget_date'
 */
function sortEntries(entries, sortBy) {
  const sorted = entries.slice();

  if (sortBy === 'date') {
    return sorted.sort(function (a, b) {
      return dateSortValue(b) - dateSortValue(a);
    });
  }

  if (sortBy === 'budget_date') {
    return sorted.sort(function (a, b) {
      const ba = a.orcamentoSerial === null ? -Infinity : a.orcamentoSerial;
      const bb = b.orcamentoSerial === null ? -Infinity : b.orcamentoSerial;
      if (ba !== bb) return bb - ba;
      return dateSortValue(b) - dateSortValue(a);
    });
  }

  return sorted.sort(function (a, b) {
    return (b.rowIndex || 0) - (a.rowIndex || 0);
  });
}

function dateSortValue(entry) {
  if (!entry.dataCivil) return Number.MAX_SAFE_INTEGER;
  return Date.UTC(
    entry.dataCivil.y,
    entry.dataCivil.m - 1,
    entry.dataCivil.d,
    entry.dataCivil.hh,
    entry.dataCivil.mi,
    entry.dataCivil.ss
  );
}

// ============================================================================
// Agregações
// ============================================================================

/**
 * Agrega por orçamento (data-chave).
 * incomes/expenses seguem o sinal do valor (expenses acumula negativo).
 */
function aggregateByBudget(entries) {
  const map = new Map();

  (entries || []).forEach(function (e) {
    const key = e.orcamentoSerial;
    if (key === null || key === undefined || !isFinite(key)) return;

    const valor = Number(e.valor) || 0;
    const current = map.get(key) || { serial: key, sum: 0, count: 0, incomes: 0, expenses: 0 };

    current.sum += valor;
    current.count += 1;
    if (valor >= 0) {
      current.incomes += valor;
    } else {
      current.expenses += valor;
    }

    map.set(key, current);
  });

  const result = [];
  map.forEach(function (item) {
    const civil = excelSerialToCivil(item.serial);
    const key = civilToMonthKey(civil);
    result.push({
      serial: item.serial,
      key: key,
      label: formatDateLabel(civil),
      labelMes: monthKeyToLabel(key),
      sum: round2(item.sum),
      incomes: round2(item.incomes),
      expenses: round2(item.expenses),
      count: item.count
    });
  });

  // Mais recente primeiro
  result.sort(function (a, b) { return b.serial - a.serial; });

  return result;
}

/**
 * Agrega por conta (saldo total + quantidade). Ignora contas vazias.
 */
function aggregateByAccount(entries) {
  const map = new Map();

  (entries || []).forEach(function (e) {
    const conta = String(e.conta || '');
    if (!conta || conta.trim() === '') return;

    const valor = Number(e.valor) || 0;
    const current = map.get(conta) || { total: 0, count: 0 };

    current.total += valor;
    current.count += 1;

    map.set(conta, current);
  });

  const result = [];
  map.forEach(function (data, conta) {
    result.push({ conta: conta, total: round2(data.total), count: data.count });
  });

  return result.sort(compareConta);
}

/**
 * Agrega por categoria (soma dos valores, inclusive receitas).
 */
function aggregateByCategory(entries) {
  const map = new Map();

  (entries || []).forEach(function (e) {
    const key = e.categoria || 'Sem categoria';
    const current = map.get(key) || { categoria: key, total: 0, count: 0 };
    current.total += Number(e.valor) || 0;
    current.count += 1;
    map.set(key, current);
  });

  const result = [];
  map.forEach(function (item) {
    result.push({
      categoria: item.categoria,
      total: round2(item.total),
      count: item.count
    });
  });

  return result;
}

/**
 * Resumo (receitas/despesas/saldo/contagem) com a regra de transferência:
 *  - lançamentos futuros (sem data) NÃO entram
 *  - lançamentos sem orçamento (data-chave) NÃO entram
 *  - transferências entram só no saldo (não contam como receita/despesa)
 *
 * As três regras reproduzem o agrupamento orçamento→conta do frontend antigo.
 */
function summarize(entries) {
  let receitas = 0;
  let despesas = 0;
  let count = 0;

  (entries || []).forEach(function (e) {
    if (e.isFuturo) return;
    if (!e.orcamentoKey) return;

    const valor = Number(e.valor) || 0;

    if (e.isTransferencia) {
      // só afeta o saldo
      return;
    }

    if (valor >= 0) {
      receitas += valor;
    } else {
      despesas += valor;
    }
    count += 1;
  });

  return {
    receitas: round2(receitas),
    despesas: round2(despesas),
    saldo: round2(receitas + despesas),
    count: count
  };
}

// ============================================================================
// Opções de filtro (populam os selects da UI)
// ============================================================================

/**
 * Monta as opções de filtro a partir de TODOS os lançamentos (não só dos
 * filtrados), pra lista de opções não mudar conforme o filtro.
 */
function buildMeta(entries) {
  const contas = new Set();
  const categorias = new Set();
  const descricoes = new Set();
  const orcamentos = new Map();

  (entries || []).forEach(function (e) {
    if (e.conta && e.conta.trim()) contas.add(e.conta.trim());
    if (e.categoria && e.categoria.trim()) categorias.add(e.categoria.trim());
    if (e.descricao && e.descricao.trim()) descricoes.add(e.descricao.trim());

    if (e.orcamentoKey && e.orcamentoSerial !== null) {
      if (!orcamentos.has(e.orcamentoKey)) {
        orcamentos.set(e.orcamentoKey, {
          key: e.orcamentoKey,
          label: e.orcamentoLabel,
          labelMes: e.orcamentoLabelMes,
          serial: e.orcamentoSerial
        });
      }
    }
  });

  const orcamentosList = Array.from(orcamentos.values());
  orcamentosList.sort(function (a, b) { return b.serial - a.serial; });

  return {
    contas: Array.from(contas).sort(compareText),
    categorias: Array.from(categorias).sort(compareText),
    descricoes: Array.from(descricoes).sort(compareText),
    orcamentos: orcamentosList
  };
}

// ============================================================================
// Detalhes do dashboard (seleção de orçamentos)
// ============================================================================

/**
 * Monta o bloco "Detalhes" (top categorias, contas do orçamento, gráfico por
 * tipo e lançamentos por categoria) para os orçamentos selecionados.
 *
 * @param {Array<object>} entries todos os lançamentos
 * @param {Array<number>} serialsOrcamentos orçamentos selecionados (serial)
 * @param {Array<{categoria:string,tipo:string}>} categoriasCompletas
 */
function buildDetails(entries, serialsOrcamentos, categoriasCompletas) {
  const selected = (serialsOrcamentos || []).map(Number);

  const doOrcamento = (entries || []).filter(function (e) {
    return e.orcamentoSerial !== null && selected.indexOf(e.orcamentoSerial) !== -1;
  });

  // --- top 10 categorias (só despesas) ---
  const porCategoria = aggregateByCategory(doOrcamento);
  const topCategorias = porCategoria
    .filter(function (item) { return item.total < 0; })
    .sort(function (a, b) { return a.total - b.total; })
    .slice(0, 10);

  // --- contas + total geral do orçamento selecionado ---
  const contas = aggregateByAccount(doOrcamento);
  let totalGeral = 0;
  doOrcamento.forEach(function (e) { totalGeral += Number(e.valor) || 0; });

  // --- gráfico de rosca: despesas por TIPO de categoria ---
  const tipoPorCategoria = new Map();
  (categoriasCompletas || []).forEach(function (c) {
    if (c && c.categoria) {
      tipoPorCategoria.set(String(c.categoria).toLowerCase(), c.tipo || '');
    }
  });

  const porTipo = new Map();
  doOrcamento.forEach(function (e) {
    const valor = Number(e.valor) || 0;
    if (valor >= 0) return;

    const tipo = tipoPorCategoria.get(String(e.categoria || '').toLowerCase()) || 'Sem Tipo';
    if (TIPOS_IGNORADOS_NO_GRAFICO.indexOf(String(tipo).toUpperCase().trim()) !== -1) return;

    porTipo.set(tipo, (porTipo.get(tipo) || 0) + Math.abs(valor));
  });

  let graficoTotal = 0;
  porTipo.forEach(function (v) { graficoTotal += v; });

  const grafico = [];
  porTipo.forEach(function (valor, tipo) {
    grafico.push({
      tipo: tipo,
      valor: round2(valor),
      percentual: graficoTotal > 0 ? round2((valor / graficoTotal) * 100) : 0
    });
  });
  grafico.sort(function (a, b) { return b.valor - a.valor; });

  // --- lançamentos por categoria (só despesas, mais recentes primeiro) ---
  const entradasPorCategoria = {};
  doOrcamento.forEach(function (e) {
    const valor = Number(e.valor) || 0;
    if (valor >= 0) return;

    const key = e.categoria || 'Sem categoria';
    if (!entradasPorCategoria[key]) entradasPorCategoria[key] = [];
    entradasPorCategoria[key].push(e);
  });
  Object.keys(entradasPorCategoria).forEach(function (key) {
    entradasPorCategoria[key].sort(function (a, b) {
      return dateSortValue(b) - dateSortValue(a);
    });
  });

  return {
    orcamentos: selected,
    topCategorias: topCategorias,
    contas: contas,
    totalGeral: round2(totalGeral),
    grafico: grafico,
    graficoTotal: round2(graficoTotal),
    entradasPorCategoria: entradasPorCategoria
  };
}

// ============================================================================
// Helpers internos
// ============================================================================

function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Converte o valor da coluna C em número.
 * Aceita número, "12.5" e "12,50" (vírgula decimal). Vazio/inválido => 0.
 */
function parseValor(raw) {
  if (raw === undefined || raw === null || raw === '') return 0;
  if (typeof raw === 'number') return isFinite(raw) ? raw : 0;
  if (typeof raw !== 'string') return 0;

  let text = raw.trim();
  if (!text) return 0;
  if (text.indexOf(',') !== -1 && text.indexOf('.') === -1) {
    text = text.replace(',', '.');
  }
  const num = Number(text);
  return isFinite(num) ? num : 0;
}

function round2(n) {
  return Number((Number(n) || 0).toFixed(2));
}

/**
 * Comparação de texto que aproxima o `localeCompare` do frontend
 * (ordena ignorando caixa; empate desempata pelo texto original).
 */
function compareText(a, b) {
  const la = String(a).toLowerCase();
  const lb = String(b).toLowerCase();
  if (la < lb) return -1;
  if (la > lb) return 1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function compareConta(a, b) {
  return compareText(a.conta, b.conta);
}

module.exports = {
  // datas
  excelSerialToCivil: excelSerialToCivil,
  civilToExcelSerial: civilToExcelSerial,
  civilToExcelSerialDia: civilToExcelSerialDia,
  formatDateLabel: formatDateLabel,
  formatDateTimeLabel: formatDateTimeLabel,
  formatDateInput: formatDateInput,
  formatDateTimeInput: formatDateTimeInput,
  civilToMonthKey: civilToMonthKey,
  monthKeyToLabel: monthKeyToLabel,
  parseDateValue: parseDateValue,
  normalizeWriteDate: normalizeWriteDate,
  toSheetDate: toSheetDate,
  civilToday: civilToday,

  // entradas
  isBlankRow: isBlankRow,
  normalizeRows: normalizeRows,
  serializeEntry: serializeEntry,

  // filtros
  filterByPeriod: filterByPeriod,
  searchEntries: searchEntries,
  filterByType: filterByType,
  applyFilters: applyFilters,
  filterByInterval: filterByInterval,
  intervalSerials: intervalSerials,

  // ordenação
  sortEntries: sortEntries,

  // agregações
  aggregateByBudget: aggregateByBudget,
  aggregateByAccount: aggregateByAccount,
  aggregateByCategory: aggregateByCategory,
  summarize: summarize,

  // opções e detalhes
  buildMeta: buildMeta,
  buildDetails: buildDetails
};
