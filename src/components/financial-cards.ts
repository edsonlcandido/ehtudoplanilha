/**
 * Módulo para gerenciamento dos cards financeiros
 * Responsável por renderizar, atualizar e controlar interatividade dos cards
 * Versão TypeScript migrada de pb_public_/dashboard/js/components/financial-cards.js
 */

import type { BudgetSummary } from '../utils/sheet-entries';

/**
 * Formata valores para moeda brasileira
 */
export function formatarMoeda(valor: number): string {
  return Number(valor).toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });
}

/**
 * Estado interno do módulo
 */
let _summaryData: BudgetSummary[] = [];
let _intervalBudgetsMap: Record<string, boolean> = {};

/**
 * Renderiza os cards de resumo dos orçamentos
 * @param summary - Array de resumos dos orçamentos
 * @param intervalBudgets - Objeto com orçamentos no intervalo atual como chaves
 */
export function renderizarCards(
  summary: BudgetSummary[], 
  intervalBudgets: Record<string, boolean>
): void {
  const container = document.getElementById('summaryCards');
  if (!container) return;

  // Armazena os dados para atualizações futuras
  _summaryData = summary || [];
  _intervalBudgetsMap = intervalBudgets || {};

  // Ordena por orcamento (data) decrescente (mais recente primeiro)
  const sorted = _summaryData.slice().sort((a, b) => b.orcamento - a.orcamento);

  container.innerHTML = '';

  sorted.forEach(item => {
    // Verifica se o orçamento está no intervalo atual
    const isInInterval = _intervalBudgetsMap[item.label] === true;

    if (isInInterval) {
      // Cartão ativo - mostra todos os detalhes
      container.appendChild(criarCardAtivo(item));
    } else {
      // Cartão inativo - clicável para mostrar detalhes
      container.appendChild(criarCardInativo(item));
    }
  });

  // Adicionar event listeners para os cartões inativos
  const inactiveCards = container.querySelectorAll('.financial-card.inactive');
  inactiveCards.forEach(card => {
    const htmlCard = card as HTMLElement;
    htmlCard.style.cursor = 'pointer';
    htmlCard.addEventListener('click', cardClickHandler);
  });

  // Adicionar event listeners para os botões de fechar dos cartões ativos
  const closeButtons = container.querySelectorAll('.card-close');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', handleCloseClick);
  });
}

/**
 * Cria um card ativo com todas as informações visíveis
 */
function criarCardAtivo(item: BudgetSummary): HTMLElement {
  const card = document.createElement('div');
  const cardClass = `financial-card ${item.sum >= 0 ? 'receitas' : 'despesas'} compacto`;
  card.className = cardClass;
  
  // Armazenar dados para uso posterior
  card.dataset.budget = item.label;
  card.dataset.sum = String(item.sum);
  card.dataset.incomes = String(item.incomes);
  card.dataset.expenses = String(item.expenses);
  card.dataset.orcamento = String(item.orcamento);
  
  card.innerHTML = `
    <button class="card-close" aria-label="Fechar cartão" data-budget="${item.label}">✕</button>
    <div class="card-header">
      <h3 class="card-title">${item.label}</h3>
    </div>
    <div class="card-value" data-card="${item.label}">${formatarMoeda(item.sum)}</div>

    <div class="card-actions">
      <button class="button pseudo card-toggle" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="card-details">
      <div class="card-muted">Receitas: ${formatarMoeda(item.incomes)}</div>
      <div class="card-muted">Despesas: ${formatarMoeda(item.expenses)}</div>
    </div>
  `;
  
  return card;
}

/**
 * Cria um card inativo (apenas placeholder)
 */
function criarCardInativo(item: BudgetSummary): HTMLElement {
  const card = document.createElement('div');
  card.className = 'financial-card inactive';
  
  // Armazenar dados para uso posterior
  card.dataset.budget = item.label;
  card.dataset.sum = String(item.sum);
  card.dataset.incomes = String(item.incomes);
  card.dataset.expenses = String(item.expenses);
  card.dataset.orcamento = String(item.orcamento);

  card.innerHTML = `
    <div class="card-title">${item.label}</div>
    <div class="card-value">...</div>
  `;
  
  return card;
}

/**
 * Manipula o clique em cartões inativos, expandindo-os
 */
function cardClickHandler(this: HTMLElement): void {
  const budget = this.dataset.budget!;
  const sum = parseFloat(this.dataset.sum!);
  const incomes = parseFloat(this.dataset.incomes!);
  const expenses = parseFloat(this.dataset.expenses!);
  const orc = Number(this.dataset.orcamento!);

  // Adiciona classe clicked para remover hover após ser clicado
  this.classList.add('clicked');
  
  // Remove o cursor pointer
  this.style.cursor = 'default';

  // Substitui o cartão inativo por um cartão detalhado
  const cardClass = `financial-card ${sum >= 0 ? 'receitas' : 'despesas'} compacto`;
  this.className = cardClass + ' clicked';
  this.innerHTML = `
    <button class="card-close" aria-label="Fechar cartão" data-budget="${budget}">✕</button>
    <div class="card-header">
      <h3 class="card-title">${budget}</h3>
    </div>
    <div class="card-value" data-card="${budget}">${formatarMoeda(sum)}</div>

    <div class="card-actions">
      <button class="button pseudo card-toggle" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="card-details">
      <div class="card-muted">Receitas: ${formatarMoeda(incomes)}</div>
      <div class="card-muted">Despesas: ${formatarMoeda(expenses)}</div>
    </div>
  `;

  // Remove o evento de clique do próprio cartão para evitar ações indesejadas
  this.removeEventListener('click', cardClickHandler);

  // Adiciona event listener para o botão de toggle
  const toggleBtn = this.querySelector('.card-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function(this: HTMLElement, e: Event) {
      e.stopPropagation();
      const card = this.closest('.financial-card') as HTMLElement;
      const isCompact = card.classList.toggle('compacto');
      this.setAttribute('aria-expanded', String(!isCompact));
      this.textContent = isCompact ? 'Mostrar detalhes' : 'Ocultar detalhes';
    });
  }

  // Adiciona event listener para o botão de fechar
  const closeBtn = this.querySelector('.card-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', handleCloseClick);
  }

  // Dispara evento para mostrar detalhes
  document.dispatchEvent(new CustomEvent('detail:show', { 
    detail: { orcamento: orc } 
  }));
}

/**
 * Manipula o clique no botão de fechar, voltando ao estado inativo
 */
function handleCloseClick(this: HTMLElement, e: Event): void {
  e.stopPropagation();
  
  const card = this.closest('.financial-card') as HTMLElement;
  const budget = card.dataset.budget!;
  const sum = card.dataset.sum!;
  const incomes = card.dataset.incomes!;
  const expenses = card.dataset.expenses!;
  const orcamento = card.dataset.orcamento!;
  
  // Volta para o estado inativo
  card.className = 'financial-card inactive';
  card.style.cursor = 'pointer';
  card.innerHTML = `
    <div class="card-title">${budget}</div>
    <div class="card-value">...</div>
  `;

  // Certifica-se de que os atributos de dados estão preservados
  card.dataset.budget = budget;
  card.dataset.sum = sum;
  card.dataset.incomes = incomes;
  card.dataset.expenses = expenses;
  card.dataset.orcamento = orcamento;
  
  // Remove todos os event listeners antigos antes de adicionar o novo
  const newCard = card.cloneNode(true) as HTMLElement;
  card.replaceWith(newCard);
  
  // Recupera a referência após o cloneNode e reativa listener
  const reactivatedCard = document.querySelector(
    `.financial-card.inactive[data-budget="${budget}"]`
  ) as HTMLElement;
  
  if (reactivatedCard) {
    reactivatedCard.style.cursor = 'pointer';
    reactivatedCard.addEventListener('click', cardClickHandler);
  }
  
  // Notifica remoção do orçamento para atualizar detalhes
  const orc = Number(orcamento);
  document.dispatchEvent(new CustomEvent('detail:show', { 
    detail: { orcamento: orc } 
  }));
}

/**
 * Inicializa listeners de eventos globais para os cards
 */
export function inicializarEventos(): void {
  // Toggle por delegação (funciona para cards estáticos e dinâmicos)
  const summaryCards = document.getElementById('summaryCards');
  
  summaryCards?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('.card-toggle');
    if (!btn) return;

    const card = btn.closest('.financial-card') as HTMLElement;
    const isCompact = card.classList.toggle('compacto');

    // Atualiza estado acessível e rótulo
    btn.setAttribute('aria-expanded', String(!isCompact));
    btn.textContent = isCompact ? 'Mostrar detalhes' : 'Ocultar detalhes';
  });
}

/**
 * Mostra um card de carregamento enquanto os dados são buscados
 */
export function mostrarCardCarregamento(): void {
  const container = document.getElementById('summaryCards');
  if (!container) return;
  
  container.innerHTML = `
    <div class="financial-card loading saldo">
      <div class="card-header">
        <h3 class="card-title">dd/mm/yyyy</h3>
      </div>

      <div class="card-value" data-card="orcamento1">R$&nbsp;100,00</div>
      <div class="card-actions">
        <button class="button pseudo card-toggle" aria-expanded="false">Mostrar detalhes</button>
      </div>
      <div class="card-details">
        <div class="card-muted" data-card="orcamento1">Receitas: R$&nbsp;100,00</div>
        <div class="card-muted" data-card="orcamento1">Despesas: R$&nbsp;100,00</div>
      </div>
    </div>
  `;
}

/**
 * Mostra uma mensagem de erro quando os dados não podem ser carregados
 */
export function mostrarErro(mensagem: string = 'Verifique sua conexão e tente novamente'): void {
  const container = document.getElementById('summaryCards');
  if (!container) return;
  
  container.innerHTML = `
    <div class="financial-card">
      <div class="card-header">
        <h3 class="card-title">Erro ao carregar dados</h3>
      </div>
      <div class="card-value">${mensagem}</div>
    </div>
  `;
}
