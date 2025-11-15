/**
 * Módulo para gerenciamento da seção de detalhes
 * Mostra agregados por conta e top 10 categorias ao clicar em cards
 * Versão TypeScript migrada de pb_public_/dashboard/js/components/details.js
 */

import type { Entry, BudgetInfo } from '../utils/sheet-entries';
import { formatarMoeda } from './financial-cards';
import { renderCategoryBudgetChart } from './category-budget-chart';
import { SheetsService } from '../services/sheets';

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

  <!-- Gráfico de Despesas por Tipo -->
  <div id="categoryBudgetChart" style="margin-top:1rem;"></div>

  <div class="details__top-categories" style="margin-top:1rem;">
    <h3 class="details__title">Top 10 Gastos por Categoria</h3>
    <div class="category-cards" id="detail-categories-cards">
      <!-- Cards de categorias serão renderizados aqui -->
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
export async function inicializarDetalhes(entries: Entry[], budgetsInInterval: BudgetInfo[]): Promise<void> {
  const container = document.querySelector('.details') as HTMLElement;
  if (!container) return;

  // Estado de orçamentos selecionados e entries
  let selectedBudgets = budgetsInInterval.map(b => b.orcamento);
  let currentEntries = entries || [];

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
   * Renderiza detalhes para orçamentos específicos
   */
  const renderizarDetalhes = async (orcamentos: number | number[]): Promise<void> => {
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
      // Renderiza gráfico mesmo sem detalhes (usando orçamentos selecionados)
      await renderizarGraficoRosca(orcNums);
      return;
    }

    const saldoTotal = detalhe.reduce((acc, e) => acc + (e.valor || 0), 0);

    if (elSaldo) elSaldo.textContent = formatarMoeda(saldoTotal);

    // Atualiza cartões de contas
    if (elAccounts) {
      elAccounts.innerHTML = '';
      agruparPorConta(detalhe).forEach(({ conta, total }) => {
        const card = document.createElement('div');
        card.className = 'details__card details__card--clickable';
        card.dataset.conta = conta;
        card.innerHTML = `
          <div class="details__card-title">${conta}</div>
          <div class="details__card-value">${formatarMoeda(total)}</div>
        `;

        // Adiciona evento de clique para navegar para página de lançamentos
        card.addEventListener('click', () => {
          // Navega para a página de lançamentos com filtro de conta
          window.location.href = `/dashboard/lancamentos.html?conta=${encodeURIComponent(conta)}`;
        });

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

        // Adiciona evento de clique para navegar para página de lançamentos
        card.addEventListener('click', () => {
          // Navega para a página de lançamentos com filtro de categoria
          window.location.href = `/dashboard/lancamentos.html?categoria=${encodeURIComponent(item.categoria)}`;
        });

        elCategoriesCards.appendChild(card);
      });
    }

    // Renderiza gráfico de despesas por tipo (com os mesmos orçamentos filtrados)
    await renderizarGraficoRosca(orcNums);
  };

  // Renderização inicial para todos selecionados
  if (selectedBudgets.length > 0) {
    await renderizarDetalhes(selectedBudgets);
  } else {
    // Se não houver orçamentos selecionados, renderiza o gráfico com array vazio (sem dados)
    await renderizarGraficoRosca([]);
  }

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
      await renderizarDetalhes(selectedBudgets);
    }
  });
}
