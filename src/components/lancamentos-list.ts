/**
 * Componente de Lista de Lançamentos
 * Renderiza a visualização de lançamentos em formato tabela (desktop) e lista (mobile)
 * Design System: BEM + Tailwind-inspired
 */

import type { SheetEntry } from '../types';
import {
  excelSerialToDateTimeLabel,
  excelSerialToMonthLabel
} from '../utils/date-helpers';

/**
 * Formata valor monetário
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Wrapper para exibição de data com hora
 */
function formatDateTime(date: string | number | undefined): string {
  if (!date) return '-';
  
  if (typeof date === 'number') {
    return excelSerialToDateTimeLabel(date);
  }
  
  // Se for string em português, retorna como está (já formatado pelo backend)
  return String(date);
}

/**
 * Wrapper para exibição de apenas data (orçamento)
 */
function formatDateSimple(date: string | number | undefined): string {
  if (!date) return '-';
  
  if (typeof date === 'number') {
    return excelSerialToMonthLabel(date);
  }
  
  // Se for string em português, retorna como está (já formatado pelo backend)
  return String(date);
}

/**
 * Renderiza botões de ação para um lançamento
 * Classes: btn btn--sm (design system)
 */
function renderActions(entry: SheetEntry): string {
  return `
    <button class="btn btn--sm" onclick="window.editEntry(${entry.rowIndex})" title="Editar">
      ✏️
    </button>
    <button class="btn btn--sm" onclick="window.copyEntry(${entry.rowIndex})" title="Copiar">
      📑
    </button>
    <button class="btn btn--sm btn--danger" onclick="window.deleteEntry(${entry.rowIndex})" title="Excluir">
      🗑️
    </button>
  `;
}

/**
 * Renderiza tabela de lançamentos (Desktop)
 * Design System: usa classes do lancamentos__* com estilo unificado
 */
export function renderTable(entries: SheetEntry[]): string {
  if (entries.length === 0) {
    return `
      <div class="card">
        <div class="lancamentos__empty">
          <div class="lancamentos__empty-icon">📋</div>
          <p class="lancamentos__empty-text">Nenhum lançamento encontrado</p>
          <p>Adicione seu primeiro lançamento usando o botão "+" no canto inferior direito.</p>
        </div>
      </div>
    `;
  }

  const rows = entries.map(entry => {
    const valorClass = entry.valor < 0 
      ? 'text--danger' 
      : 'text--success';

    return `
      <div class="lancamentos__table-row">
        <div class="lancamentos__table-cell">${entry.rowIndex || '-'}</div>
        <div class="lancamentos__table-cell">${formatDateTime(entry.data)}</div>
        <div class="lancamentos__table-cell">${entry.conta || '-'}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--number ${valorClass}">
          ${formatCurrency(entry.valor)}
        </div>
        <div class="lancamentos__table-cell">${entry.descricao || '-'}</div>
        <div class="lancamentos__table-cell"><span class="badge badge--gray">${entry.categoria || '-'}</span></div>
        <div class="lancamentos__table-cell">${formatDateSimple(entry.orcamento)}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--actions">
          ${renderActions(entry)}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="card">
      <div class="lancamentos__table">
        <div class="lancamentos__table-header">
          <div class="lancamentos__table-row">
            <div class="lancamentos__table-cell lancamentos__table-cell--header">#</div>
            <div class="lancamentos__table-cell lancamentos__table-cell--header">Data</div>
            <div class="lancamentos__table-cell lancamentos__table-cell--header">Conta</div>
            <div class="lancamentos__table-cell lancamentos__table-cell--header">Valor</div>
            <div class="lancamentos__table-cell lancamentos__table-cell--header">Descrição</div>
            <div class="lancamentos__table-cell lancamentos__table-cell--header">Categoria</div>
            <div class="lancamentos__table-cell lancamentos__table-cell--header">Orçamento</div>
            <div class="lancamentos__table-cell lancamentos__table-cell--header">Ações</div>
          </div>
        </div>
        ${rows}
      </div>
    </div>
  `;
}

/**
 * Renderiza lista de lançamentos (Mobile)
 */
export function renderList(entries: SheetEntry[]): string {
  if (entries.length === 0) {
    return `
      <div class="lancamentos__empty">
        <div class="lancamentos__empty-icon">📋</div>
        <p class="lancamentos__empty-text">Nenhum lançamento encontrado</p>
        <p>Adicione seu primeiro lançamento usando o botão "+" no canto inferior direito.</p>
      </div>
    `;
  }

  const items = entries.map(entry => {
    const valorClass = entry.valor < 0 
      ? 'lancamentos__item-value--expense' 
      : 'lancamentos__item-value--income';

    return `
      <div class="lancamentos__item">
        <div class="lancamentos__item-header">
          <div class="lancamentos__item-info">
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">#:</span>
              <span class="lancamentos__item-value">${entry.rowIndex || '-'}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Data:</span>
              <span class="lancamentos__item-value">${formatDateTime(entry.data)}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Conta:</span>
              <span class="lancamentos__item-value">${entry.conta || '-'}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Valor:</span>
              <span class="lancamentos__item-value lancamentos__item-value--valor ${valorClass}">
                ${formatCurrency(entry.valor)}
              </span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Descrição:</span>
              <span class="lancamentos__item-value">${entry.descricao || '-'}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Categoria:</span>
              <span class="lancamentos__item-value">${entry.categoria || '-'}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Orçamento:</span>
              <span class="lancamentos__item-value">${formatDateSimple(entry.orcamento)}</span>
            </div>
          </div>
        </div>
        <div class="lancamentos__item-actions">
          ${renderActions(entry)}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="lancamentos__list">
      ${items}
    </div>
  `;
}

/**
 * Renderiza visualização completa (tabela + lista)
 */
export function renderEntries(entries: SheetEntry[]): string {
  return `
    ${renderTable(entries)}
    ${renderList(entries)}
  `;
}
