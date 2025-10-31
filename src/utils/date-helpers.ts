/**
 * Utilitários para manipular conversão de datas entre JavaScript e Excel Serial
 * Excel usa um sistema de numeração onde 1 = 01/01/1900
 * 
 * IMPORTANTE: Para evitar problemas de timezone:
 * - Datas com hora (campo 'data'): mantém hora exata
 * - Datas sem hora (campo 'orcamento'): usa meio-dia (12:00) para garantir que
 *   variações de timezone não mudem o dia
 */

/**
 * Converte Date JavaScript para Excel Serial (número de dias desde 31/12/1899)
 * 
 * @param date - Data a ser convertida
 * @param dataHora - Se true, mantém hora; se false, usa meio-dia (12:00) para evitar timezone issues
 * @returns Número serial do Excel
 * 
 * @example
 * // Com hora
 * toExcelSerial(new Date('2025-10-20T16:52'), true) // 45581.703472222
 * 
 * // Sem hora (meio-dia para estabilidade)
 * toExcelSerial(new Date('2025-10-31'), false) // 45592
 */
export function toExcelSerial(date: Date, dataHora: boolean = false): number {
  if (!date || !(date instanceof Date)) return NaN;

  // Clone da data para não modificar a original
  const d = new Date(date);
  
  // Se não precisa de hora, ajusta para meio-dia para evitar problemas de timezone
  // Isso garante que mesmo com variações de UTC, o dia não mude
  if (!dataHora) {
    d.setHours(12, 0, 0, 0);
  }
  
  // Data base do Excel (31/12/1899 00:00:00 GMT)
  const baseDate = new Date(Date.UTC(1899, 11, 31, 0, 0, 0));
  
  // Calcula diferença em dias
  const msPerDay = 24 * 60 * 60 * 1000;
  let days = (d.getTime() - baseDate.getTime()) / msPerDay;
  
  // Corrige o bug do Excel: considera 1900 como bissexto (incorreto)
  // Excel conta 29/02/1900 como válido, então ajustamos
  const excelLeapBugDate = new Date(Date.UTC(1900, 1, 28, 0, 0, 0)); // 28/02/1900
  if (d > excelLeapBugDate) {
    days += 1;
  }
  
  // Limita precisão para evitar erros de ponto flutuante
  return Number(days.toFixed(10));
}

/**
 * Converte Date JavaScript para Excel Serial INTEIRO (somente dia, sem hora)
 * Usa UTC 00:00 para garantir consistência (IGUAL ao código original pb_public_)
 * 
 * Esta função é ESSENCIAL para o campo 'orcamento' que deve ser sempre
 * um número inteiro representando apenas o dia.
 * 
 * @param date - Data a ser convertida
 * @returns Número inteiro serial do Excel
 * 
 * @example
 * toExcelSerialDia(new Date('2025-10-31')) // 45592
 * toExcelSerialDia(new Date(2025, 9, 31)) // 45592
 */
export function toExcelSerialDia(date: Date): number {
  if (!(date instanceof Date)) return NaN;
  
  // Usa UTC para garantir consistência independente do timezone local
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  
  // Cria data às 00:00 UTC (igual ao código original pb_public_)
  const target = Date.UTC(y, m, d);
  const base = Date.UTC(1899, 11, 31);
  
  let days = Math.round((target - base) / 86400000);
  
  // Corrige bug do leap year do Excel (29/02/1900)
  if (days >= 60) days += 1;
  
  return days;
}

/**
 * Converte Excel Serial para Date JavaScript
 * 
 * @param serial - Número serial do Excel
 * @param dataHora - Se true, retorna com hora; se false, retorna com hora zerada
 * @returns Date JavaScript ou null se inválido
 * 
 * @example
 * // Com hora
 * excelSerialToDate(45581.703472222, true) // Date com hora 16:52
 * 
 * // Sem hora
 * excelSerialToDate(45592, false) // Date com hora 00:00:00
 */
export function excelSerialToDate(serial: number, dataHora: boolean = false): Date | null {
  const s = Number(serial);
  if (!Number.isFinite(s)) return null;
  
  // Ajusta pelo bug do leap year do Excel
  const adj = s >= 60 ? s - 1 : s;
  const baseUtc = Date.UTC(1899, 11, 31);
  const ms = baseUtc + adj * 86400000;
  const utcDate = new Date(ms);
  
  // Extrai componentes UTC e cria Date local com mesmos valores
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

/**
 * Formata Excel Serial para string no formato brasileiro DD/MM/YYYY
 * 
 * @param serial - Número serial do Excel
 * @returns String formatada ou o serial como string se inválido
 * 
 * @example
 * excelSerialToMonthLabel(45592) // "31/10/2025"
 */
export function excelSerialToMonthLabel(serial: number): string {
  const d = excelSerialToDate(serial);
  if (!d) return String(serial);
  
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Formata Excel Serial para string com data e hora no formato brasileiro
 * 
 * @param serial - Número serial do Excel
 * @returns String formatada DD/MM/YYYY HH:MM
 * 
 * @example
 * excelSerialToDateTimeLabel(45581.703472222) // "20/10/2025 16:52"
 */
export function excelSerialToDateTimeLabel(serial: number): string {
  const d = excelSerialToDate(serial, true);
  if (!d) return String(serial);
  
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  
  return `${dd}/${mm}/${yyyy} ${hh}:${mins}`;
}

/**
 * Converte string datetime-local (YYYY-MM-DDTHH:MM) para Date
 * 
 * @param dateTimeString - String no formato datetime-local
 * @returns Date JavaScript
 * 
 * @example
 * dateTimeLocalToDate('2025-10-20T16:52') // Date(2025, 9, 20, 16, 52)
 */
export function dateTimeLocalToDate(dateTimeString: string): Date | null {
  if (!dateTimeString) return null;
  
  // Formato: YYYY-MM-DDTHH:MM ou YYYY-MM-DDTHH:MM:SS
  const [datePart, timePart] = dateTimeString.split('T');
  if (!datePart || !timePart) return null;
  
  const [year, month, day] = datePart.split('-').map(n => parseInt(n, 10));
  const timeComponents = timePart.split(':').map(n => parseInt(n, 10));
  const [hour, minute, second = 0] = timeComponents;
  
  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Converte string date (YYYY-MM-DD) para Date às 12:00 (evita timezone issues)
 * 
 * @param dateString - String no formato date
 * @returns Date JavaScript às 12:00
 * 
 * @example
 * dateInputToDate('2025-10-31') // Date(2025, 9, 31, 12, 0, 0)
 */
export function dateInputToDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  const [year, month, day] = dateString.split('-').map(n => parseInt(n, 10));
  if (!year || !month || !day) return null;
  
  // Usa meio-dia para evitar problemas de timezone
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Calcula intervalo padrão para filtros
 * Retorna serials para hoje -5 dias até hoje +35 dias
 * 
 * @param offsetStart - Dias antes de hoje (default: -5)
 * @param offsetEnd - Dias depois de hoje (default: 35)
 * @returns Objeto com startSerial, endSerial, startDate, endDate
 */
export function getIntervalSerials(offsetStart: number = -5, offsetEnd: number = 35) {
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

/**
 * Filtra entries por intervalo de datas
 * 
 * @param entries - Array de entries
 * @param field - Nome do campo a filtrar ('data' ou 'orcamento')
 * @param offsetStart - Dias antes de hoje
 * @param offsetEnd - Dias depois de hoje
 * @returns Array filtrado
 */
export function filterEntriesByInterval<T extends Record<string, any>>(
  entries: T[] = [],
  field: string = 'orcamento',
  offsetStart: number = -5,
  offsetEnd: number = 35
): T[] {
  const { startSerial, endSerial } = getIntervalSerials(offsetStart, offsetEnd);
  
  return entries.filter(e => {
    const v = e && e[field];
    return typeof v === 'number' && !Number.isNaN(v) && v >= startSerial && v <= endSerial;
  });
}
