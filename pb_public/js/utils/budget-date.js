/**
 * Utilitário para manipulação de datas de orçamento
 * Suporta lógica de data-chave (como fatura de cartão de crédito)
 * em vez de sempre usar dia 01 do mês
 */

/**
 * Extrai todas as datas de orçamento já utilizadas dos lançamentos
 * @param {Array} entries - Array de lançamentos
 * @returns {Array} Array de strings no formato "dd/MM/YYYY"
 */
export function collectBudgetDates(entries) {
    if (!Array.isArray(entries)) return [];
    
    const budgetDates = [];
    
    for (const entry of entries) {
        if (entry.orcamento) {
            let budgetStr = '';
            
            // Normalizar diferentes formatos de orçamento
            if (typeof entry.orcamento === 'string') {
                if (entry.orcamento.includes('/')) {
                    // Já pode estar no formato dd/MM/YYYY ou MM/YYYY
                    const parts = entry.orcamento.split('/');
                    if (parts.length === 3) {
                        // dd/MM/YYYY
                        budgetStr = entry.orcamento;
                    } else if (parts.length === 2) {
                        // setembro/25 ou MM/YY - converter para 01/MM/YYYY
                        const [mesNome, anoCurto] = parts;
                        const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
                        const mesIndex = meses.indexOf(mesNome.toLowerCase());
                        if (mesIndex !== -1) {
                            const ano = anoCurto.length === 2 ? 2000 + parseInt(anoCurto) : parseInt(anoCurto);
                            budgetStr = `01/${String(mesIndex + 1).padStart(2, '0')}/${ano}`;
                        }
                    }
                }
            } else if (typeof entry.orcamento === 'number') {
                // Serial do Excel - converter para data
                const date = excelSerialToDate(entry.orcamento);
                budgetStr = formatBudgetDateForBackend(date);
            }
            
            if (budgetStr && !budgetDates.includes(budgetStr)) {
                budgetDates.push(budgetStr);
            }
        }
    }
    
    return budgetDates.sort((a, b) => {
        const dateA = parseBudgetStr(a);
        const dateB = parseBudgetStr(b);
        return dateA.getTime() - dateB.getTime();
    });
}

/**
 * Converte string "dd/MM/YYYY" em objeto Date
 * @param {string} str - Data no formato "dd/MM/YYYY"
 * @returns {Date} Objeto Date
 */
export function parseBudgetStr(str) {
    if (!str || typeof str !== 'string') return new Date();
    
    const parts = str.split('/');
    if (parts.length !== 3) return new Date();
    
    const [dia, mes, ano] = parts.map(p => parseInt(p.trim()));
    return new Date(ano, mes - 1, dia); // mes - 1 porque Date usa 0-11 para meses
}

/**
 * Encontra a próxima data de orçamento baseada nos lançamentos existentes
 * Simula comportamento de data de fatura de cartão de crédito
 * @param {Array} budgetStrDates - Array de strings de datas no formato "dd/MM/YYYY"
 * @returns {Date} Próxima data sugerida
 */
export function nextFaturaBudgetDate(budgetStrDates) {
    if (!Array.isArray(budgetStrDates) || budgetStrDates.length === 0) {
        // Se não há lançamentos, sugere hoje
        return new Date();
    }
    
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    // Converter strings para objetos Date
    const dates = budgetStrDates.map(parseBudgetStr).sort((a, b) => a.getTime() - b.getTime());
    
    // Verificar se já existe lançamento no mês atual
    const lancamentoMesAtual = dates.find(date => 
        date.getMonth() === mesAtual && date.getFullYear() === anoAtual
    );
    
    if (lancamentoMesAtual) {
        // Se já existe lançamento neste mês, sugere o mesmo dia no próximo mês
        const proximoMes = new Date(anoAtual, mesAtual + 1, lancamentoMesAtual.getDate());
        return proximoMes;
    }
    
    // Se não há lançamento no mês atual, analisa o padrão dos lançamentos anteriores
    const diasUtilizados = [...new Set(dates.map(date => date.getDate()))].sort((a, b) => a - b);
    
    if (diasUtilizados.length > 0) {
        // Pega o dia mais comum ou o último usado
        const diaFavorito = diasUtilizados[diasUtilizados.length - 1]; // último dia usado
        
        // Verifica se o dia favorito já passou neste mês
        const dataFavorita = new Date(anoAtual, mesAtual, diaFavorito);
        
        if (dataFavorita >= hoje) {
            // Se o dia favorito ainda não passou neste mês, usa ele
            return dataFavorita;
        } else {
            // Se já passou, sugere o mesmo dia do próximo mês
            return new Date(anoAtual, mesAtual + 1, diaFavorito);
        }
    }
    
    // Fallback: sugere hoje
    return hoje;
}

/**
 * Converte objeto Date para formato "dd/MM/YYYY" (backend)
 * @param {Date} date - Objeto Date
 * @returns {string} Data no formato "dd/MM/YYYY"
 */
export function formatBudgetDateForBackend(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }
    
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
}

/**
 * Converte objeto Date para formato ISO "YYYY-MM-DD" (input type="date")
 * @param {Date} date - Objeto Date
 * @returns {string} Data no formato ISO "YYYY-MM-DD"
 */
export function isoFromDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }
    
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}`;
}

/**
 * Converte string ISO "YYYY-MM-DD" para formato "dd/MM/YYYY" (backend)
 * @param {string} isoStr - Data no formato ISO "YYYY-MM-DD"
 * @returns {string} Data no formato "dd/MM/YYYY"
 */
export function backendBudgetFromISO(isoStr) {
    if (!isoStr || typeof isoStr !== 'string') return '';
    
    const parts = isoStr.split('-');
    if (parts.length !== 3) return '';
    
    const [ano, mes, dia] = parts;
    return `${dia}/${mes}/${ano}`;
}

/**
 * Função auxiliar para converter serial do Excel em Date
 * @param {number} serial - Número serial do Excel
 * @returns {Date} Objeto Date
 */
function excelSerialToDate(serial) {
    if (typeof serial !== 'number') return new Date();
    
    // Excel conta dias desde 1/1/1900, mas tem um bug: considera 1900 bissexto
    const excelEpoch = new Date(1900, 0, 1);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    
    // Ajustar pelo bug do Excel (29/02/1900 que não existe)
    const adjustedSerial = serial > 59 ? serial - 1 : serial;
    
    return new Date(excelEpoch.getTime() + (adjustedSerial - 1) * millisecondsPerDay);
}