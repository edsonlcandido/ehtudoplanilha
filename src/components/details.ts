/**
 * Módulo para gerenciamento da seção de detalhes
 * Mostra top 10 categorias, gráfico por tipo e lançamentos da categoria
 *
 * Todos os agregados vêm do BACKEND (/get-dashboard-details): aqui é só
 * renderização e seleção de estado (qual orçamento está selecionado).
 */

import type { AccountSummary, CategoriaAggregate, DashboardDetails, SheetEntry } from '../types';
import { formatarMoeda } from './financial-cards';
import { renderCategoryBudgetChart } from './category-budget-chart';
import lancamentosService from '../services/lancamentos';

/**
 * Template HTML para a seção de detalhes
 * Nota: "Saldo e contas" agora fica fora desta seção, no dashboard__balance-section
 */
const detailsTemplate = `
  <!-- Gráfico de Despesas por Tipo -->
  <div id="categoryBudgetChart" style="margin-top:1rem;"></div>

  <div class="details__top-categories" style="margin-top:1rem;">
    <h3 class="details__title">Top 10 Gastos por Categoria</h3>
    <div class="category-cards" id="detail-categories-cards">
      <!-- Cards de categorias serão renderizados aqui -->
    </div>
  </div>

  <div class="details__category-entries details__category-entries--hidden" id="detail-entries">
    <h3 class="details__title" id="detail-entries-title">
      <span id="lancamentos">Lançamentos</span>
    </h3>
    <div class="category-entries-list" id="entries-list">
      <!-- Lançamentos serão renderizados aqui -->
    </div>
  </div>
`;

/**
 * Inicializa a seção de detalhes
 * @param budgetsInInterval - Seriais dos orçamentos em destaque (seleção inicial)
 * @param accounts - Saldo por conta (todas as contas)
 */
export async function inicializarDetalhes(
  budgetsInInterval: number[],
  accounts: AccountSummary[]
): Promise<void> {
  const container = document.querySelector('.details') as HTMLElement;
  if (!container) return;

  // Estado de orçamentos selecionados
  let selectedBudgets: number[] = [...(budgetsInInterval || [])];

  // Últimos detalhes recebidos do backend (pra desenhar os lançamentos da categoria)
  let currentDetails: DashboardDetails | null = null;

  // Estado das contas excluídas do saldo total (útil para cartões de crédito)
  // Carrega do localStorage
  const STORAGE_KEY = 'excludedAccounts';
  const loadExcludedAccounts = (): Set<string> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar contas excluídas:', error);
    }
    return new Set<string>();
  };

  const saveExcludedAccounts = (accounts: Set<string>): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(accounts)));
    } catch (error) {
      console.error('Erro ao salvar contas excluídas:', error);
    }
  };

  const excludedAccounts = loadExcludedAccounts();

  /**
   * Renderiza o gráfico de despesas por tipo
   * @param grafico - fatias já calculadas pelo backend
   */
  const renderizarGraficoRosca = async (
    grafico: DashboardDetails['grafico'],
    retryCount: number = 0
  ): Promise<void> => {
    const MAX_RETRIES = 3;

    const chartContainer = document.getElementById('categoryBudgetChart');
    if (!chartContainer) {
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => renderizarGraficoRosca(grafico, retryCount + 1), 200);
        return;
      }
      console.warn('[Details] Container categoryBudgetChart não encontrado. Gráfico não será renderizado.');
      return;
    }

    renderCategoryBudgetChart('categoryBudgetChart', grafico || []);
  };

  /**
   * ✨ Renderiza TODAS as contas (sem filtro de budget)
   * Agora renderiza na seção dashboard__balance-section ao invés de dentro do container details
   */
  const renderizarTodasAsContas = (): void => {
    const elSaldo = document.querySelector('#detail-saldo') as HTMLElement;
    const elAccounts = document.querySelector('#detail-accounts-cards') as HTMLElement;
    const elAggregates = document.querySelector('.dashboard__balance-section .details__aggregates') as HTMLElement;

    // Remove classe de loading
    if (elAggregates) {
      elAggregates.classList.remove('loading');
    }

    // Calcula saldo total excluindo contas desmarcadas
    const saldoTotal = accounts.reduce((acc, item) => {
      if (excludedAccounts.has(item.conta)) {
        return acc; // Não adiciona se a conta está excluída
      }
      return acc + item.total;
    }, 0);

    if (elSaldo) {
      elSaldo.textContent = formatarMoeda(saldoTotal);
    }

    // Renderiza cards de contas
    if (elAccounts) {
      elAccounts.innerHTML = '';

      accounts.forEach(({ conta, total }) => {
        const card = document.createElement('div');
        const isExcluded = excludedAccounts.has(conta);
        card.className = `details__card details__card--clickable${isExcluded ? ' details__card--excluded' : ''}`;
        card.dataset.conta = conta;

        // Cria estrutura do card com checkbox
        const cardContent = document.createElement('div');
        cardContent.className = 'details__card-content';

        cardContent.innerHTML = `
          <div class="details__card-info">
            <span class="details__card-icon">${isExcluded ? '💳' : ''}</span>
            <span class="details__card-title">${conta}</span>
            <span class="details__card-value">${formatarMoeda(total)}</span>
          </div>
        `;

        card.appendChild(cardContent);

        // Botão de ajuste de saldo da conta (dispara o modal de ajuste)
        const adjustBtn = document.createElement('button');
        adjustBtn.type = 'button';
        adjustBtn.className = 'details__card-adjust';
        adjustBtn.title = `Ajustar saldo de ${conta}`;
        adjustBtn.setAttribute('aria-label', `Ajustar saldo de ${conta}`);
        adjustBtn.textContent = '⚖️';
        adjustBtn.addEventListener('click', (e) => {
          // Evita acionar o toggle de incluir/excluir a conta do saldo
          e.stopPropagation();
          document.dispatchEvent(new CustomEvent('balance:adjust', {
            detail: { conta }
          }));
        });
        card.appendChild(adjustBtn);

        // Clique no card para toggle incluir/excluir do saldo
        card.addEventListener('click', () => {
          const iconEl = cardContent.querySelector('.details__card-icon') as HTMLElement;

          if (excludedAccounts.has(conta)) {
            // Incluir no saldo
            excludedAccounts.delete(conta);
            card.classList.remove('details__card--excluded');
            if (iconEl) iconEl.textContent = '';
          } else {
            // Excluir do saldo
            excludedAccounts.add(conta);
            card.classList.add('details__card--excluded');
            if (iconEl) iconEl.textContent = '💳';
          }

          // Salva no localStorage
          saveExcludedAccounts(excludedAccounts);

          // Recalcula e atualiza saldo total
          const novoSaldo = accounts.reduce((acc, item) => {
            if (excludedAccounts.has(item.conta)) return acc;
            return acc + item.total;
          }, 0);

          if (elSaldo) elSaldo.textContent = formatarMoeda(novoSaldo);
        });

        elAccounts.appendChild(card);
      });

      // Configura o botão de toggle
      const toggleBtn = document.querySelector('#toggle-accounts-btn') as HTMLButtonElement;
      if (toggleBtn && elAccounts) {
        const updateToggleButton = () => {
          const isHidden = elAccounts.classList.contains('details__cards--hidden');
          toggleBtn.textContent = isHidden ? '👁️ Mostrar contas' : '🙈 Ocultar contas';
        };

        // Remove listener anterior se existir
        const oldListener = (toggleBtn as any)._toggleListener;
        if (oldListener) {
          toggleBtn.removeEventListener('click', oldListener);
        }

        // Adiciona novo listener
        const toggleListener = () => {
          elAccounts.classList.toggle('details__cards--hidden');
          updateToggleButton();
        };
        (toggleBtn as any)._toggleListener = toggleListener;
        toggleBtn.addEventListener('click', toggleListener);

        // Atualiza texto inicial
        updateToggleButton();
      }
    }
  };

  /**
   * Renderiza cards de contas filtradas pelos orçamentos selecionados
   */
  const renderizarContasDoOrcamento = (
    contas: AccountSummary[],
    totalGeral: number
  ): void => {
    // Busca o elemento no documento (não no container, pois está fora da seção details)
    const elBudgetAccountsCards = document.querySelector('#detail-budget-accounts-cards') as HTMLElement;
    const elBudgetTotal = document.querySelector('#detail-budget-total') as HTMLElement;

    if (!elBudgetAccountsCards) return;

    // Atualiza o total
    if (elBudgetTotal) {
      elBudgetTotal.textContent = formatarMoeda(totalGeral);
    }

    // Limpa conteúdo anterior
    elBudgetAccountsCards.innerHTML = '';

    if (contas.length === 0) {
      elBudgetAccountsCards.innerHTML = '<p class="category-entries-empty">Nenhuma conta encontrada nos orçamentos selecionados.</p>';
      return;
    }

    // Renderiza cards
    contas.forEach(({ conta, total }) => {
      const card = document.createElement('div');
      card.className = 'details__card';

      card.innerHTML = `
        <div class="details__card-info">
          <span class="details__card-title">${conta}</span>
          <span class="details__card-value">${formatarMoeda(total)}</span>
        </div>
      `;

      elBudgetAccountsCards.appendChild(card);
    });
  };

  /**
   * Renderiza lançamentos de uma categoria específica
   */
  const renderizarLancamentosCategoria = (categoria: string): void => {
    const elEntries = container.querySelector('#detail-entries') as HTMLElement;
    const elEntriesTitle = container.querySelector('#detail-entries-title') as HTMLElement;
    const elEntriesList = container.querySelector('#entries-list') as HTMLElement;

    if (!elEntries || !elEntriesList || !elEntriesTitle) return;

    // Atualiza título
    elEntriesTitle.innerHTML = `<span id="lancamentos">Lançamentos da Categoria: ${categoria}</span>`;

    // Lançamentos da categoria (já filtrados pelo backend)
    const lancamentos: SheetEntry[] = (currentDetails?.entradasPorCategoria || {})[categoria] || [];

    // Mostra seção e renderiza lançamentos
    elEntries.classList.remove('details__category-entries--hidden');
    elEntriesList.innerHTML = '';

    if (lancamentos.length === 0) {
      elEntriesList.innerHTML = '<p class="category-entries-empty">Nenhum lançamento encontrado nesta categoria.</p>';
      return;
    }

    lancamentos.forEach(lancamento => {
      const entryCard = document.createElement('div');
      entryCard.className = 'category-entry-card';

      entryCard.innerHTML = `
        <div class="category-entry-card__date">${lancamento.dataLabel || '--'}</div>
        <div class="category-entry-card__description">${lancamento.descricao || 'Sem descrição'}</div>
        <div class="category-entry-card__value">${formatarMoeda(lancamento.valor || 0)}</div>
      `;

      elEntriesList.appendChild(entryCard);
    });

    // Faz scroll suave até a seção de lançamentos
    setTimeout(() => {
      const lancamentosAnchor = document.getElementById('lancamentos');
      if (lancamentosAnchor) {
        lancamentosAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  /**
   * Renderiza os cards das top categorias
   */
  const renderizarTopCategorias = (topCategorias: CategoriaAggregate[]): void => {
    const elCategoriesCards = container.querySelector('#detail-categories-cards') as HTMLElement;
    if (!elCategoriesCards) return;

    elCategoriesCards.innerHTML = '';

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

      // Adiciona evento de clique para mostrar lançamentos e fazer scroll
      card.addEventListener('click', () => {
        // Remove seleção anterior dos cards de categorias
        elCategoriesCards.querySelectorAll('.category-card').forEach(c => {
          c.classList.remove('category-card--selected');
        });

        // Remove seleção dos cards de contas
        const elAccounts = document.querySelector('#detail-accounts-cards') as HTMLElement;
        if (elAccounts) {
          elAccounts.querySelectorAll('.details__card').forEach(c => {
            c.classList.remove('details__card--selected');
          });
        }

        // Adiciona seleção ao card clicado
        card.classList.add('category-card--selected');

        // Renderiza lançamentos da categoria e faz scroll
        renderizarLancamentosCategoria(item.categoria);
      });

      elCategoriesCards.appendChild(card);
    });
  };

  /**
   * Busca no backend os detalhes dos orçamentos selecionados e renderiza
   */
  const renderizarDetalhes = async (orcamentos: number[]): Promise<void> => {
    // Injeta template e mostra container
    container.innerHTML = detailsTemplate;
    container.style.display = '';

    // Seletores do DOM
    const elCategoriesCards = container.querySelector('#detail-categories-cards') as HTMLElement;

    let details: DashboardDetails;
    try {
      details = await lancamentosService.fetchDashboardDetails(orcamentos);
    } catch (error) {
      console.error('[Details] Erro ao buscar detalhes:', error);
      return;
    }

    currentDetails = details;

    // Atualiza top 10 categorias como cards (já vem filtrado/ordenado do backend)
    if (elCategoriesCards) {
      renderizarTopCategorias(details.topCategorias || []);
    }

    // Renderiza gráfico de despesas por tipo (mesmos orçamentos filtrados)
    await renderizarGraficoRosca(details.grafico || []);

    // Renderiza cards de contas filtradas pelos orçamentos selecionados
    renderizarContasDoOrcamento(details.contas || [], details.totalGeral || 0);
  };

  // ✨ Renderização inicial
  // 1. Renderiza detalhes (gráfico e top 10) no container details para budgets selecionados
  await renderizarDetalhes(selectedBudgets);

  // 2. Renderiza TODAS as contas na seção dashboard__balance-section
  renderizarTodasAsContas();

  // Toggle de seleção ao clicar no card
  document.addEventListener('detail:show', async (ev) => {
    const customEv = ev as CustomEvent<{ orcamento: number }>;
    const orc = customEv.detail.orcamento;

    if (selectedBudgets.includes(orc)) {
      selectedBudgets = selectedBudgets.filter(x => x !== orc);
    } else {
      selectedBudgets.push(orc);
    }

    await renderizarDetalhes(selectedBudgets);
  });

  // Ouvir evento de atualização dos cards (quando novo lançamento é adicionado)
  document.addEventListener('cards:updated', async (ev) => {
    const customEv = ev as CustomEvent<{
      accounts?: AccountSummary[];
      budgetsInInterval?: number[];
    }>;

    if (customEv.detail?.accounts) {
      accounts = customEv.detail.accounts;
      renderizarTodasAsContas();
      await renderizarDetalhes(selectedBudgets);
    }
  });
}
