/**
 * Componente de Gráfico de Despesas por Tipo
 * Exibe gráfico de rosca (donut chart) mostrando distribuição de despesas por TIPO de categoria
 *
 * Os dados (agregação por tipo, filtro dos tipos ignorados e percentual) são
 * calculados no BACKEND — aqui é só a renderização do SVG.
 */

interface CategoryExpenseData {
  /** rótulo exibido (nome do tipo da categoria) */
  tipo: string;
  valor: number;
  percentual: number;
}

/**
 * Formata valor para moeda brasileira (R$ 1.234,56)
 */
function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Classe para renderizar gráfico de despesas por tipo
 */
export class CategoryBudgetChart {
  private container: HTMLElement;
  private chartData: CategoryExpenseData[] = [];

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container ${containerId} não encontrado`);
    }
    this.container = element;
  }

  /**
   * Atualiza os dados e renderiza o gráfico
   * @param data - Fatias já calculadas pelo backend
   */
  render(data: CategoryExpenseData[]): void {
    this.chartData = data || [];

    if (this.chartData.length === 0) {
      this.renderEmptyState();
      return;
    }

    this.renderChart();
  }

  /**
   * Renderiza o estado vazio
   */
  private renderEmptyState(): void {
    this.container.innerHTML = `
      <div class="budget-chart">
        <h3 class="budget-chart__title">Gastos por tipo</h3>
        <div class="budget-chart__empty">
          <p>Nenhuma despesa encontrada.</p>
          <p><small>Adicione lançamentos de despesas para visualizar o gráfico.</small></p>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza o gráfico completo
   */
  private renderChart(): void {
    const displayData = this.chartData;
    
    const legendHTML = displayData.map((item, index) => {
      const color = this.getColor(index);
      
      return `
        <div class="budget-chart__legend-item">
          <div class="budget-chart__legend-color" style="background-color: ${color};"></div>
          <div class="budget-chart__legend-content">
            <div class="budget-chart__legend-label">${item.tipo}</div>
            <div class="budget-chart__legend-value">
              <span>${formatarMoeda(item.valor)}</span>
              <span class="budget-chart__legend-percent">${item.percentual.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const totalDespesas = displayData.reduce((sum, d) => sum + d.valor, 0);

    this.container.innerHTML = `
      <div class="budget-chart">
        <h3 class="budget-chart__title">Gastos por tipo</h3>
        <div class="budget-chart__content">
          <div class="budget-chart__donut">
            ${this.renderDonutChart(displayData)}
          </div>
          <div class="budget-chart__legend">
            ${legendHTML}
          </div>
        </div>
        <div class="budget-chart__summary">
          <div class="budget-chart__summary-item">
            <span>Total de Despesas:</span>
            <span>${formatarMoeda(totalDespesas)}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza o gráfico de rosca em SVG
   */
  private renderDonutChart(data: CategoryExpenseData[]): string {
    const size = 200;
    const strokeWidth = 30;
    const radius = (size - strokeWidth) / 2;
    const centerX = size / 2;
    const centerY = size / 2;

    // Calcula o total de despesas
    const totalExpense = data.reduce((sum, d) => sum + d.valor, 0);
    
    if (totalExpense === 0) {
      return '<p>Sem dados de despesas</p>';
    }

    let currentAngle = -90; // Começa no topo
    const segments = data.map((item, index) => {
      const percentage = (item.valor / totalExpense) * 100;
      const angle = (percentage / 100) * 360;
      
      // Calcula o arco SVG
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      const color = this.getColor(index);

      return `
        <path 
          d="${pathData}" 
          fill="${color}" 
          stroke="white" 
          stroke-width="2"
          class="budget-chart__segment"
          data-category="${item.tipo}"
          data-value="${item.valor}"
        >
          <title>${item.tipo}: ${formatarMoeda(item.valor)} (${item.percentual.toFixed(1)}%)</title>
        </path>
      `;
    }).join('');

    // Círculo central para criar efeito de rosca
    const innerRadius = radius - strokeWidth;
    const centerCircle = `
      <circle 
        cx="${centerX}" 
        cy="${centerY}" 
        r="${innerRadius}" 
        fill="white"
      />
    `;

    return `
      <svg 
        viewBox="0 0 ${size} ${size}" 
        class="budget-chart__svg"
        style="max-width: 200px; max-height: 200px;"
      >
        ${segments}
        ${centerCircle}
      </svg>
    `;
  }

  /**
   * Retorna cor baseada no índice
   */
  private getColor(index: number): string {
    const colors = [
      '#FF6384', // Rosa
      '#36A2EB', // Azul
      '#FFCE56', // Amarelo
      '#4BC0C0', // Turquesa
      '#9966FF', // Roxo
      '#FF9F40', // Laranja
      '#FF6384', // Rosa (repete)
      '#C9CBCF', // Cinza
      '#4BC0C0', // Turquesa (repete)
      '#FF9F40', // Laranja (repete)
    ];
    return colors[index % colors.length];
  }

  /**
   * Limpa o container
   */
  clear(): void {
    this.container.innerHTML = '';
  }
}

/**
 * Cria e renderiza um gráfico de despesas por tipo
 * @param containerId - id do container no DOM
 * @param data - fatias já calculadas pelo backend ({tipo, valor, percentual})
 */
export function renderCategoryBudgetChart(
  containerId: string,
  data: CategoryExpenseData[]
): CategoryBudgetChart {
  const chart = new CategoryBudgetChart(containerId);
  chart.render(data);
  return chart;
}
