/**
 * Módulo para gerenciamento da seção de detalhes
 * Mostra agregados por conta e top 10 categorias ao clicar em cards
 * Versão TypeScript migrada de pb_public_/dashboard/js/components/details.js
 */

import type { Entry, BudgetInfo } from '../utils/sheet-entries';
import { aggregateByAccount } from '../utils/sheet-entries';
import { formatarMoeda } from './financial-cards';
import { excelSerialToDate } from '../utils/date-helpers';
import { renderCategoryBudgetChart } from './category-budget-chart';
import { SheetsService } from '../services/sheets';

/**
 * Template HTML para a seção de detalhes (gráfico e top 10)
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
export async function inicializarDetalhes(entries: Entry[], budgetsInInterval: BudgetInfo[]): Promise<void> {
  const container = document.querySelector('.details') as HTMLElement;
  if (!container) return;

  // Estado de orçamentos selecionados e entries
  let selectedBudgets = budgetsInInterval.map(b => b.orcamento);
  let currentEntries = entries || [];
  
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
   * @param orcamentos - Orçamentos a serem considerados para filtrar entries
   */
  const renderizarGraficoRosca = async (orcamentos: number[], retryCount: number = 0): Promise<void> => {
    const MAX_RETRIES = 3;

    try {
      console.log('[Details] Preparando gráfico de despesas por tipo...');

      // Verifica se o container existe no DOM
      const chartContainer = document.getElementById('categoryBudgetChart');
      if (!chartContainer) {
        if (retryCount < MAX_RETRIES) {
          console.warn(`[Details] Container categoryBudgetChart não encontrado (tentativa ${retryCount + 1}/${MAX_RETRIES}), aguardando...`);
          // Tenta novamente após um pequeno delay
          setTimeout(() => renderizarGraficoRosca(orcamentos, retryCount + 1), 200);
          return;
        } else {
          console.warn('[Details] Container categoryBudgetChart não encontrado após múltiplas tentativas. Gráfico não será renderizado.');
          return;
        }
      }

      console.log('[Details] Container encontrado, carregando categorias completas...');

      // Carrega categorias completas para fazer JOIN
      const categoriesComplete = await SheetsService.getSheetCategoriesComplete();

      if (!categoriesComplete || categoriesComplete.length === 0) {
        console.log('[Details] Nenhuma categoria completa encontrada');
        return;
      }

      console.log('[Details] Fazendo JOIN entre entries e categoriesComplete...');

      // Cria mapa de categoria -> tipo para JOIN eficiente
      // 🔑 Usa toLowerCase() para ignorar case-sensitive (Telefone Celular = Telefone celular)
      const categoriaTipoMap = new Map<string, string>();
      for (const cat of categoriesComplete) {
        categoriaTipoMap.set(cat.categoria.toLowerCase(), cat.tipo);
      }
      
      console.log('[Details] Categorias mapeadas:', Array.from(categoriaTipoMap.entries()));

      // 🎯 FILTRA entries pelos orçamentos selecionados (igual aos agregados e top 10)
      const entriesFiltrados = currentEntries.filter(e => orcamentos.includes(e.orcamento));
      
      console.log(`[Details] Filtrando ${currentEntries.length} entries por ${orcamentos.length} orçamentos -> ${entriesFiltrados.length} entries`);
      
      // 🔍 DEBUG: Mostra categorias únicas dos entries filtrados
      const categoriasDoEntries = [...new Set(entriesFiltrados.map(e => e.categoria).filter(c => c))];
      console.log('[Details] 📋 Categorias presentes nos entries filtrados:', categoriasDoEntries);

      // Faz JOIN: adiciona campo tipo de categoriesComplete aos entries FILTRADOS
      const chartEntries = entriesFiltrados.map(e => {
        // 🔑 Usa toLowerCase() para buscar no mapa, ignorando case-sensitive
        const categoriaLower = (e.categoria || '').toLowerCase();
        const tipo = categoriaTipoMap.get(categoriaLower) || 'Sem Tipo';
        return {
          categoria: e.categoria || '',
          valor: e.valor || 0,
          tipo: tipo
        };
      });

      // 🔍 DEBUG: Encontra entries sem tipo
      const entriesSemTipo = chartEntries.filter(e => e.tipo === 'Sem Tipo');
      if (entriesSemTipo.length > 0) {
        console.warn(`[Details] ⚠️ Encontrados ${entriesSemTipo.length} entries SEM TIPO:`);
        console.table(entriesSemTipo.map(e => ({
          categoria: e.categoria,
          valor: e.valor,
          tipo: e.tipo
        })));
        
        // Mostra categorias únicas sem tipo
        const categoriasSemTipo = [...new Set(entriesSemTipo.map(e => e.categoria))];
        console.warn('[Details] 📋 Categorias SEM TIPO encontradas:', categoriasSemTipo);
        
        // Verifica se essas categorias existem no mapa
        categoriasSemTipo.forEach(cat => {
          const existe = categoriaTipoMap.has(cat);
          console.warn(`[Details] Categoria "${cat}" existe no mapa? ${existe}`);
        });
      }

      console.log('[Details] Renderizando gráfico de despesas por tipo...');
      renderCategoryBudgetChart('categoryBudgetChart', chartEntries);
      console.log('[Details] ✅ Gráfico de despesas por tipo renderizado com sucesso');

    } catch (error) {
      console.error('[Details] Erro ao renderizar gráfico de despesas:', error);
      // Não quebra o dashboard se o gráfico falhar
    }
  };



  /**
   * ✨ PASSO 5: Renderiza TODAS as contas (sem filtro de budget)
   * Agora renderiza na seção dashboard__balance-section ao invés de dentro do container details
   */
  const renderizarTodasAsContas = (): void => {
    const elSaldo = document.querySelector('#detail-saldo') as HTMLElement;
    const elAccounts = document.querySelector('#detail-accounts-cards') as HTMLElement;
    const elAggregates = document.querySelector('.dashboard__balance-section .details__aggregates') as HTMLElement;

    // Pega as contas agregadas do estado global
    const accountSummary = window.accountSummary || [];
    
    console.log('🎨 Renderizando todas as contas:', accountSummary);

    // Remove classe de loading
    if (elAggregates) {
      elAggregates.classList.remove('loading');
    }

    // Calcula saldo total excluindo contas desmarcadas
    const saldoTotal = accountSummary.reduce((acc, item) => {
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
      
      accountSummary.forEach(({ conta, total }) => {
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
          const novoSaldo = accountSummary.reduce((acc, item) => {
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
   * Renderiza cards de contas filtradas pelos orçamentos selecionados
   */
  const renderizarContasDoOrcamento = (orcamentos: number[]): void => {
    // Busca o elemento no documento (não no container, pois está fora da seção details)
    const elBudgetAccountsCards = document.querySelector('#detail-budget-accounts-cards') as HTMLElement;
    const elBudgetTotal = document.querySelector('#detail-budget-total') as HTMLElement;
    
    if (!elBudgetAccountsCards) return;

    // Filtra lançamentos pelos orçamentos selecionados
    const lancamentosFiltrados = currentEntries.filter(e => orcamentos.includes(e.orcamento));
    
    // Calcula total geral somando TODOS os valores dos lançamentos (receitas + despesas)
    const totalGeral = lancamentosFiltrados.reduce((acc, entry) => acc + entry.valor, 0);
    
    // Atualiza o total
    if (elBudgetTotal) {
      elBudgetTotal.textContent = formatarMoeda(totalGeral);
    }
    
    // Agrupa por conta usando a função utilitária
    const contasAgregadas = aggregateByAccount(lancamentosFiltrados);
    
    // Limpa conteúdo anterior
    elBudgetAccountsCards.innerHTML = '';
    
    if (contasAgregadas.length === 0) {
      elBudgetAccountsCards.innerHTML = '<p class="category-entries-empty">Nenhuma conta encontrada nos orçamentos selecionados.</p>';
      return;
    }

    // Renderiza cards
    contasAgregadas.forEach(({ conta, total }) => {
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
  const renderizarLancamentosCategoria = (categoria: string, orcamentos: number[]): void => {
    const elEntries = container.querySelector('#detail-entries') as HTMLElement;
    const elEntriesTitle = container.querySelector('#detail-entries-title') as HTMLElement;
    const elEntriesList = container.querySelector('#entries-list') as HTMLElement;

    if (!elEntries || !elEntriesList || !elEntriesTitle) return;

    // Atualiza título
    elEntriesTitle.innerHTML = `<span id="lancamentos">Lançamentos da Categoria: ${categoria}</span>`;

    // Filtra lançamentos da categoria nos orçamentos selecionados
    const lancamentos = currentEntries.filter(e =>
      orcamentos.includes(e.orcamento) &&
      (e.categoria || 'Sem categoria') === categoria &&
      e.valor < 0 // Apenas despesas
    );

    // Ordena por data (mais recente primeiro)
    lancamentos.sort((a, b) => {
      // Entradas sem data vão para o final
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;

      const dateA = new Date(a.data).getTime();
      const dateB = new Date(b.data).getTime();

      // Se alguma data for inválida, coloca no final
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;

      return dateB - dateA;
    });

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

      // Formata a data para exibição
      let dataFormatada = '--';
      if (lancamento.data && typeof lancamento.data === 'number' && lancamento.data > 0) {
        // Converte Excel serial para Date
        const date = excelSerialToDate(lancamento.data, true);
        if (date) {
          dataFormatada = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }

      entryCard.innerHTML = `
        <div class="category-entry-card__date">${dataFormatada}</div>
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
   * Renderiza detalhes para orçamentos específicos
   */
  const renderizarDetalhes = async (orcamentos: number | number[]): Promise<void> => {
    // Aceita número ou array
    const orcNums = Array.isArray(orcamentos) ? orcamentos : [orcamentos];

    // Injeta template e mostra container
    container.innerHTML = detailsTemplate;
    container.style.display = '';

    // Seletores do DOM
    const elCategoriesCards = container.querySelector('#detail-categories-cards') as HTMLElement;

    // Filtra lançamentos dos orçamentos selecionados para top 10 categorias
    const detalhe = currentEntries.filter(e => orcNums.includes(e.orcamento));

    // Atualiza top 10 categorias como cards (apenas despesas) - filtradas por orçamento
    if (elCategoriesCards) {
      elCategoriesCards.innerHTML = '';

      const topCategorias = detalhe.length > 0 
        ? agruparPorCategoria(detalhe)
            .filter(item => item.total < 0)
            .sort((a, b) => a.total - b.total)
            .slice(0, 10)
        : [];

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

          // Remove seleção dos cards de contas (agora busca no documento, não no container)
          const elAccounts = document.querySelector('#detail-accounts-cards') as HTMLElement;
          if (elAccounts) {
            elAccounts.querySelectorAll('.details__card').forEach(c => {
              c.classList.remove('details__card--selected');
            });
          }

          // Adiciona seleção ao card clicado
          card.classList.add('category-card--selected');

          // Renderiza lançamentos da categoria e faz scroll
          renderizarLancamentosCategoria(item.categoria, orcNums);
        });

        elCategoriesCards.appendChild(card);
      });
    }

    // Renderiza gráfico de despesas por tipo (com os mesmos orçamentos filtrados)
    await renderizarGraficoRosca(orcNums);

    // Renderiza cards de contas filtradas pelos orçamentos selecionados
    renderizarContasDoOrcamento(orcNums);
  };

  // ✨ Renderização inicial
  // 1. Renderiza detalhes (gráfico e top 10) no container details para budgets selecionados
  await renderizarDetalhes(selectedBudgets);
  
  // 2. Renderiza TODAS as contas na seção dashboard__balance-section (depois que entries estão disponíveis)
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
      entry: Entry;
      allEntries: Entry[];
      budgetsInInterval: BudgetInfo[]
    }>;

    const { allEntries } = customEv.detail || {};

    if (allEntries) {
      currentEntries = allEntries;
      // Atualiza saldo e cards de contas para refletir novo saldo após adição de lançamento
      renderizarTodasAsContas();
      await renderizarDetalhes(selectedBudgets);
    }
  });
}
