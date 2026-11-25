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
 *
 * Os pills e os totais vêm PRONTOS do backend:
 * - `ativos` = lista de filtros aplicada, cada um já com rotulo e valor
 *   formatados (ex.: Orçamento -> "30/11/2026")
 * - `resumo` = totais calculados no backend
 * Aqui não existe nenhuma conversão nem regra.
 */

import type { FiltroAtivo, ResumoTotais } from '../types';

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
 * Renderiza os pills dos filtros que estão aplicados.
 * A lista vem do backend (cada item já tem `rotulo` e `valor` prontos).
 */
function renderActiveFilters(ativos: FiltroAtivo[]): string {
  return (ativos || [])
    .map(
      (f) =>
        `<span class="grouped-summary__filter-pill">${escapeHtml(f.rotulo)}: <strong>${escapeHtml(f.valor)}</strong></span>`
    )
    .join('');
}

/**
 * Renderiza o resumo simplificado dos filtros.
 * Retorna string vazia se não houver dados.
 *
 * Mostra apenas o Total (saldo) e a quantidade de lançamentos,
 * em layout vertical (label, valor, contagem).
 *
 * Os totais (receitas/despesas/saldo/contagem) são calculados no BACKEND.
 */
export function renderGroupedSummary(resumo: ResumoTotais, ativos: FiltroAtivo[]): string {
  if (!resumo || resumo.count === 0) {
    return '';
  }

  const filtersHtml = renderActiveFilters(ativos);
  const countLabel = resumo.count === 1 ? 'lançamento' : 'lançamentos';

  return `
    <section class="grouped-summary" aria-label="Resumo dos filtros aplicados">
      <h2 class="grouped-summary__title">📊 Filtros aplicados</h2>
      <div class="grouped-summary__filters">
        ${filtersHtml}
      </div>
      <div class="grouped-summary__totals">
        <div class="grouped-summary__total">
          <span class="grouped-summary__total-label">Total</span>
          <span class="grouped-summary__total-value ${saldoClass(resumo.saldo)}">${formatCurrency(resumo.saldo)}</span>
          <span class="grouped-summary__total-count">${resumo.count} ${countLabel}</span>
        </div>
      </div>
    </section>
  `;
}
