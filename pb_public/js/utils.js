/**
 * Módulo de utilidades para funções reutilizáveis
 */

/**
 * Escapa caracteres especiais HTML para evitar XSS
 * @param {string} text - Texto a ser escapado
 * @returns {string} Texto escapado
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Formata uma data ISO para o padrão brasileiro
 * @param {string} dateString - Data em formato ISO
 * @returns {string} Data formatada
 */
export function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}