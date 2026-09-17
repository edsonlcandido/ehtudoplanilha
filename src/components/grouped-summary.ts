/**
 * Componente de Resumo dos Filtros (versão simples)
 * Exibido na página de Lançamentos quando há filtros aplicados.
 *
 * Mostra:
 * - Pills com os filtros ativos (conta, período, categoria, orçamento, busca)
 * - Totais simples (receitas, despesas, saldo e quantidade)
 *
 * NÃO agrupa por orçamento/conta — apenas exibe o consolidado
 * dos lançamentos que passaram pelos filtros.
 */

import type { GroupedSummary } from '../types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function saldoClass(saldo: number): string {
  if (saldo > 0) return 'grouped-summary__saldo--positive';
  if (saldo < 0) return 'grouped-summary__saldo--negative';
  return 'grouped-summary__saldo--neutral';
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Converte data no formato YYYY-MM-DD (input HTML5) para DD/MM/YYYY.
 * Retorna string vazia se inválida.
 */
function formatIsoDateToBr(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Renderiza os pills dos filtros que estão aplicados.
 * Retorna string vazia se nenhum filtro estiver ativo.
 */
function renderActiveFilters(filters: ActiveFilters): string {
  const pills: string[] = [];

  if (filters.conta) {
    pills.push(`<span class="grouped-summary__filter-pill">Conta: <strong>${escapeHtml(filters.conta)}</strong></span>`);
  }
  if (filters.categoria) {
    pills.push(`<span class="grouped-summary__filter-pill">Categoria: <strong>${escapeHtml(filters.categoria)}</strong></span>`);
  }
  if (filters.orcamento) {
    pills.push(`<span class="grouped-summary__filter-pill">Orçamento: <strong>${escapeHtml(filters.orcamento)}</strong></span>`);
  }
  if (filters.dataInicio || filters.dataFim) {
    const inicio = filters.dataInicio ? formatIsoDateToBr(filters.dataInicio) : '...';
    const fim = filters.dataFim ? formatIsoDateToBr(filters.dataFim) : '...';
    pills.push(`<span class="grouped-summary__filter-pill">Período: <strong>${escapeHtml(inicio)} — ${escapeHtml(fim)}</strong></span>`);
  }
  if (filters.searchTerm) {
    pills.push(`<span class="grouped-summary__filter-pill">Busca: <strong>&quot;${escapeHtml(filters.searchTerm)}&quot;</strong></span>`);
  }

  return pills.join('');
}

export interface ActiveFilters {
  conta: string;
  dataInicio: string;
  dataFim: string;
  orcamento: string;
  categoria: string;
  searchTerm: string;
}

/**
 * Renderiza o resumo simplificado dos filtros.
 * Retorna string vazia se não houver dados ou nenhum filtro ativo.
 *
 * Mostra apenas o Total (saldo) e a quantidade de lançamentos,
 * em layout vertical (label, valor, contagem).
 */
export function renderGroupedSummary(summary: GroupedSummary, filters: ActiveFilters): string {
  if (!summary || summary.totals.count === 0) {
    return '';
  }

  const filtersHtml = renderActiveFilters(filters);
  const countLabel = summary.totals.count === 1 ? 'lançamento' : 'lançamentos';

  return `
    <section class="grouped-summary" aria-label="Resumo dos filtros aplicados">
      <h2 class="grouped-summary__title">📊 Filtros aplicados</h2>
      <div class="grouped-summary__filters">
        ${filtersHtml}
      </div>
      <div class="grouped-summary__totals">
        <div class="grouped-summary__total">
          <span class="grouped-summary__total-label">Total</span>
          <span class="grouped-summary__total-value ${saldoClass(summary.totals.saldo)}">${formatCurrency(summary.totals.saldo)}</span>
          <span class="grouped-summary__total-count">${summary.totals.count} ${countLabel}</span>
        </div>
      </div>
    </section>
  `;
}