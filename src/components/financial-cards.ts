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

  container.className = 'financial-cards';
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
  const inactiveCards = container.querySelectorAll('.financial-card--inactive');
  inactiveCards.forEach(card => {
    const htmlCard = card as HTMLElement;
    htmlCard.style.cursor = 'pointer';
    htmlCard.addEventListener('click', cardClickHandler);
  });

  // Adicionar event listeners para os botões de fechar dos cartões ativos
  const closeButtons = container.querySelectorAll('.financial-card__close');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', handleCloseClick);
  });
}

/**
 * Cria um card ativo com todas as informações visíveis
 */
function criarCardAtivo(item: BudgetSummary): HTMLElement {
  const card = document.createElement('div');
  const typeClass = item.sum >= 0 ? 'financial-card--incomes' : 'financial-card--expenses';
  card.className = `financial-card ${typeClass}`;
  
  // Armazenar dados para uso posterior
  card.dataset.budget = item.label;
  card.dataset.sum = String(item.sum);
  card.dataset.incomes = String(item.incomes);
  card.dataset.expenses = String(item.expenses);
  card.dataset.orcamento = String(item.orcamento);
  
  card.innerHTML = `
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${item.label}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${item.label}</h3>
    </div>
    <div class="financial-card__value">${formatarMoeda(item.sum)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${formatarMoeda(item.incomes)}</div>
      <div class="financial-card__detail">Despesas: ${formatarMoeda(item.expenses)}</div>
    </div>
  `;
  
  return card;
}

/**
 * Cria um card inativo (apenas placeholder)
 */
function criarCardInativo(item: BudgetSummary): HTMLElement {
  const card = document.createElement('div');
  card.className = 'financial-card financial-card--inactive';
  
  // Armazenar dados para uso posterior
  card.dataset.budget = item.label;
  card.dataset.sum = String(item.sum);
  card.dataset.incomes = String(item.incomes);
  card.dataset.expenses = String(item.expenses);
  card.dataset.orcamento = String(item.orcamento);

  card.innerHTML = `
    <div class="financial-card__title">${item.label}</div>
    <div class="financial-card__value">...</div>
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

  // Remove classe inativa
  this.classList.remove('financial-card--inactive');
  
  // Adiciona classe de tipo apropriada
  const typeClass = sum >= 0 ? 'financial-card--incomes' : 'financial-card--expenses';
  this.classList.add(typeClass);
  
  // Remove o cursor pointer
  this.style.cursor = 'default';

  // Substitui o cartão inativo por um cartão detalhado
  this.innerHTML = `
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${budget}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${budget}</h3>
    </div>
    <div class="financial-card__value">${formatarMoeda(sum)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${formatarMoeda(incomes)}</div>
      <div class="financial-card__detail">Despesas: ${formatarMoeda(expenses)}</div>
    </div>
  `;

  // Remove o evento de clique do próprio cartão para evitar ações indesejadas
  this.removeEventListener('click', cardClickHandler);

  // Adiciona event listener para o botão de toggle
  const toggleBtn = this.querySelector('.financial-card__toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function(this: HTMLElement, e: Event) {
      e.stopPropagation();
      const card = this.closest('.financial-card') as HTMLElement;
      const details = card.querySelector('.financial-card__details') as HTMLElement;
      const isCompact = details.classList.toggle('financial-card__details--hidden');
      this.setAttribute('aria-expanded', String(!isCompact));
      this.textContent = isCompact ? 'Mostrar detalhes' : 'Ocultar detalhes';
    });
  }

  // Adiciona event listener para o botão de fechar
  const closeBtn = this.querySelector('.financial-card__close');
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
  card.className = 'financial-card financial-card--inactive';
  card.style.cursor = 'pointer';
  card.innerHTML = `
    <div class="financial-card__title">${budget}</div>
    <div class="financial-card__value">...</div>
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
    `.financial-card--inactive[data-budget="${budget}"]`
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
    const btn = target.closest('.financial-card__toggle');
    if (!btn) return;

    const card = btn.closest('.financial-card') as HTMLElement;
    const details = card.querySelector('.financial-card__details') as HTMLElement;
    const isHidden = details?.classList.toggle('financial-card__details--hidden');

    // Atualiza estado acessível e rótulo
    btn.setAttribute('aria-expanded', String(!isHidden));
    btn.textContent = isHidden ? 'Mostrar detalhes' : 'Ocultar detalhes';
  });
}

/**
 * Mostra animação de carregamento
 * Não renderiza nada - apenas garante que o HTML inicial com classe 'loading' está visível
 */
export function mostrarCardCarregamento(): void {
  // Não faz nada - deixa o HTML inicial da página com o efeito de loading
  // O card já tem class="loading" no HTML
}

/**
 * Mostra uma mensagem de erro quando os dados não podem ser carregados
 */
export function mostrarErro(mensagem: string = 'Verifique sua conexão e tente novamente'): void {
  const container = document.getElementById('summaryCards');
  if (!container) return;
  
  container.className = 'financial-cards';
  container.innerHTML = `
    <div class="financial-card financial-card--saldo">
      <div class="financial-card__header">
        <h3 class="financial-card__title">Erro ao carregar dados</h3>
      </div>
      <div class="financial-card__value">${mensagem}</div>
    </div>
  `;
}
