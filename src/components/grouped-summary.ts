/**
 * Componente de Resumo Agrupado (versão simples)
 * Renderiza pills inline agrupadas por Orçamento → Conta
 * Exibido na página de Lançamentos quando há filtros aplicados
 */

import type { GroupedSummary, AccountGroup } from '../types';

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
 * Pill de uma conta: nome + saldo, nada mais
 */
function renderAccountPill(account: AccountGroup): string {
  return `
    <span class="grouped-summary__account" title="${escapeHtml(account.conta)} — ${account.count} lanç.">
      <span class="grouped-summary__account-name">${escapeHtml(account.conta)}</span>
      <span class="grouped-summary__account-saldo ${saldoClass(account.saldo)}">${formatCurrency(account.saldo)}</span>
    </span>`;
}

/**
 * Linha de um orçamento: label + pills de contas + total à direita
 */
function renderBudgetGroup(group: { orcamentoLabel: string; saldo: number; accounts: AccountGroup[] }): string {
  return `
    <div class="grouped-summary__budget">
      <span class="grouped-summary__budget-label">📅 ${escapeHtml(group.orcamentoLabel)}</span>
      <div class="grouped-summary__accounts">
        ${group.accounts.map(renderAccountPill).join('')}
      </div>
      <span class="grouped-summary__budget-total ${saldoClass(group.saldo)}">${formatCurrency(group.saldo)}</span>
    </div>`;
}

/**
 * Renderiza o resumo agrupado completo.
 * Retorna string vazia se não houver dados.
 */
export function renderGroupedSummary(summary: GroupedSummary): string {
  if (!summary || summary.groups.length === 0 || summary.totals.count === 0) {
    return '';
  }

  return `
    <section class="grouped-summary" aria-label="Resumo por orçamento e conta">
      <h2 class="grouped-summary__title">📊 Resumo por orçamento &amp; conta</h2>
      <div class="grouped-summary__budgets">
        ${summary.groups.map(renderBudgetGroup).join('')}
      </div>
    </section>
  `;
}
