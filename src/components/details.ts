/**
 * Módulo para gerenciamento da seção de detalhes
 * Mostra agregados por conta e top 10 categorias ao clicar em cards
 * Versão TypeScript migrada de pb_public_/dashboard/js/components/details.js
 */

import type { Entry, BudgetInfo } from '../utils/sheet-entries';
import { formatarMoeda } from './financial-cards';

/**
 * Template HTML para a seção de detalhes
 */
const detailsTemplate = `
  <div class="details__aggregates">
    <h3 class="details__title">Saldo e contas</h3>
    <h3><span class="details__saldo" id="detail-saldo">R$ 0,00</span></h3>
    <div class="details__cards" id="detail-accounts-cards">
      <!-- Cartões de contas serão renderizados aqui -->
    </div>
  </div>

  <div class="details__top-categories" style="margin-top:1rem;">
    <h3 class="details__title">Top 10 Gastos por Categoria</h3>
    <div class="category-cards" id="detail-categories-cards">
      <!-- Cards de categorias serão renderizados aqui -->
    </div>
  </div>

  <div class="details__category-entries" id="detail-category-entries" style="display:none; margin-top:1rem;">
    <h3 class="details__title">Lançamentos da Categoria</h3>
    <div class="category-entries-list" id="category-entries-list">
      <!-- Lançamentos da categoria selecionada serão renderizados aqui -->
    </div>
  </div>
`;

/**
 * Interface para agregação por conta
 */
interface ContaAggregate {
  conta: string;
  total: number;
}

/**
 * Interface para agregação por categoria
 */
interface CategoriaAggregate {
  categoria: string;
  total: number;
}

/**
 * Inicializa a seção de detalhes
 * @param entries - Todos os lançamentos
 * @param budgetsInInterval - Orçamentos no intervalo atual
 */
export function inicializarDetalhes(entries: Entry[], budgetsInInterval: BudgetInfo[]): void {
  const container = document.querySelector('.details') as HTMLElement;
  if (!container) return;

  // Estado de orçamentos selecionados e entries
  let selectedBudgets = budgetsInInterval.map(b => b.orcamento);
  let currentEntries = entries || [];

  /**
   * Agrupa lançamentos por conta
   */
  const agruparPorConta = (list: Entry[]): ContaAggregate[] => {
    const mapa: Record<string, number> = {};
    
    list.forEach(e => {
      // Ignora lançamentos sem conta definida ou com conta vazia
      if (!e.conta || e.conta.trim() === '') return;
      mapa[e.conta] = (mapa[e.conta] || 0) + (e.valor || 0);
    });
    
    return Object.entries(mapa).map(([conta, total]) => ({ conta, total }));
  };

  /**
   * Agrupa lançamentos por categoria
   */
  const agruparPorCategoria = (list: Entry[]): CategoriaAggregate[] => {
    const mapa: Record<string, number> = {};
    
    list.forEach(e => {
      const key = e.categoria || 'Sem categoria';
      mapa[key] = (mapa[key] || 0) + (e.valor || 0);
    });
    
    return Object.entries(mapa).map(([categoria, total]) => ({ categoria, total }));
  };

  /**
   * Renderiza lançamentos de uma categoria específica
   */
  const renderizarLancamentosCategoria = (categoria: string, orcamentos: number[]): void => {
    const elCategoryEntries = container.querySelector('#detail-category-entries') as HTMLElement;
    const elCategoryEntriesList = container.querySelector('#category-entries-list') as HTMLElement;
    
    if (!elCategoryEntries || !elCategoryEntriesList) return;
    
    // Filtra lançamentos da categoria nos orçamentos selecionados
    const lancamentos = currentEntries.filter(e => 
      orcamentos.includes(e.orcamento) && 
      (e.categoria || 'Sem categoria') === categoria &&
      e.valor < 0 // Apenas despesas
    );
    
    // Ordena por data (mais recente primeiro)
    lancamentos.sort((a, b) => {
      const dateA = a.data ? new Date(a.data).getTime() : 0;
      const dateB = b.data ? new Date(b.data).getTime() : 0;
      return dateB - dateA;
    });
    
    // Mostra seção e renderiza lançamentos
    elCategoryEntries.style.display = '';
    elCategoryEntriesList.innerHTML = '';
    
    if (lancamentos.length === 0) {
      elCategoryEntriesList.innerHTML = '<p class="category-entries-empty">Nenhum lançamento encontrado nesta categoria.</p>';
      return;
    }
    
    lancamentos.forEach(lancamento => {
      const entryCard = document.createElement('div');
      entryCard.className = 'category-entry-card';
      
      // Formata a data para exibição
      const dataFormatada = lancamento.data 
        ? new Date(lancamento.data).toLocaleDateString('pt-BR')
        : 'Data não informada';
      
      entryCard.innerHTML = `
        <div class="category-entry-card__date">${dataFormatada}</div>
        <div class="category-entry-card__description">${lancamento.descricao || 'Sem descrição'}</div>
        <div class="category-entry-card__value">${formatarMoeda(lancamento.valor || 0)}</div>
      `;
      
      elCategoryEntriesList.appendChild(entryCard);
    });
  };

  /**
   * Renderiza detalhes para orçamentos específicos
   */
  const renderizarDetalhes = (orcamentos: number | number[]): void => {
    // Aceita número ou array
    const orcNums = Array.isArray(orcamentos) ? orcamentos : [orcamentos];
    
    // Injeta template e mostra container
    container.innerHTML = detailsTemplate;
    container.style.display = '';
    
    // Seletores do DOM
    const elSaldo = container.querySelector('#detail-saldo') as HTMLElement;
    const elAccounts = container.querySelector('#detail-accounts-cards') as HTMLElement;
    const elCategoriesCards = container.querySelector('#detail-categories-cards') as HTMLElement;
    
    // Filtra lançamentos dos orçamentos selecionados
    const detalhe = currentEntries.filter(e => orcNums.includes(e.orcamento));
    
    if (!detalhe.length) {
      if (elSaldo) elSaldo.textContent = formatarMoeda(0);
      return;
    }
    
    const saldoTotal = detalhe.reduce((acc, e) => acc + (e.valor || 0), 0);
   
    if (elSaldo) elSaldo.textContent = formatarMoeda(saldoTotal);

    // Atualiza cartões de contas
    if (elAccounts) {
      elAccounts.innerHTML = '';
      agruparPorConta(detalhe).forEach(({ conta, total }) => {
        const card = document.createElement('div');
        card.className = 'details__card';
        card.innerHTML = `
          <div class="details__card-title">${conta}</div>
          <div class="details__card-value">${formatarMoeda(total)}</div>
        `;
        elAccounts.appendChild(card);
      });
    }

    // Atualiza top 10 categorias como cards (apenas despesas)
    if (elCategoriesCards) {
      elCategoriesCards.innerHTML = '';
      
      const topCategorias = agruparPorCategoria(detalhe)
        .filter(item => item.total < 0)
        .sort((a, b) => a.total - b.total)
        .slice(0, 10);
      
      topCategorias.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.dataset.categoria = item.categoria;
        
        card.innerHTML = `
          <div class="category-card__rank">#${idx + 1}</div>
          <div class="category-card__content">
            <div class="category-card__name">${item.categoria}</div>
            <div class="category-card__value">${formatarMoeda(item.total)}</div>
          </div>
        `;
        
        // Adiciona evento de clique para mostrar lançamentos
        card.addEventListener('click', () => {
          // Remove seleção anterior
          elCategoriesCards.querySelectorAll('.category-card').forEach(c => {
            c.classList.remove('category-card--selected');
          });
          
          // Adiciona seleção ao card clicado
          card.classList.add('category-card--selected');
          
          // Renderiza lançamentos da categoria
          renderizarLancamentosCategoria(item.categoria, orcNums);
        });
        
        elCategoriesCards.appendChild(card);
      });
    }
  };

  // Renderização inicial para todos selecionados
  if (selectedBudgets.length > 0) {
    renderizarDetalhes(selectedBudgets);
  }

  // Toggle de seleção ao clicar no card
  document.addEventListener('detail:show', (ev) => {
    const customEv = ev as CustomEvent<{ orcamento: number }>;
    const orc = customEv.detail.orcamento;
    
    if (selectedBudgets.includes(orc)) {
      selectedBudgets = selectedBudgets.filter(x => x !== orc);
    } else {
      selectedBudgets.push(orc);
    }
    
    renderizarDetalhes(selectedBudgets);
  });

  // Ouvir evento de atualização dos cards (quando novo lançamento é adicionado)
  document.addEventListener('cards:updated', (ev) => {
    const customEv = ev as CustomEvent<{ 
      entry: Entry; 
      allEntries: Entry[]; 
      budgetsInInterval: BudgetInfo[] 
    }>;
    
    const { allEntries } = customEv.detail || {};
    
    if (allEntries) {
      currentEntries = allEntries;
      renderizarDetalhes(selectedBudgets);
    }
  });
}
