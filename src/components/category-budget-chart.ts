/**
 * Componente de Gráfico de Orçamento por Categoria
 * Exibe gráfico de rosca (donut chart) comparando realizado vs planejado
 * Usa SVG puro para renderização
 */

import type { CategoryComplete } from '../types';

interface ChartEntry {
  categoria: string;
  valor: number;
  tipo: string;
}

interface CategoryBudgetData {
  categoria: string;
  tipo: string;
  orcamento: number;
  realizado: number;
  percentual: number;
  status: 'ok' | 'warning' | 'over';
}

/**
 * Classe para renderizar gráfico de orçamento por categoria
 */
export class CategoryBudgetChart {
  private container: HTMLElement;
  private entries: ChartEntry[] = [];
  private categoriesComplete: CategoryComplete[] = [];
  private chartData: CategoryBudgetData[] = [];

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container ${containerId} não encontrado`);
    }
    this.container = element;
  }

  /**
   * Atualiza os dados e renderiza o gráfico
   */
  render(entries: ChartEntry[], categoriesComplete: CategoryComplete[]): void {
    this.entries = entries;
    this.categoriesComplete = categoriesComplete;
    this.chartData = this.calculateBudgetData();
    
    if (this.chartData.length === 0) {
      this.renderEmptyState();
      return;
    }

    this.renderChart();
  }

  /**
   * Calcula dados de orçamento vs realizado
   */
  private calculateBudgetData(): CategoryBudgetData[] {
    const data: CategoryBudgetData[] = [];

    // Filtra apenas categorias do tipo DESPESA com orçamento > 0
    const categoriesWithBudget = this.categoriesComplete.filter(
      cat => cat.tipo.toUpperCase() === 'DESPESA' && cat.orcamento > 0
    );

    if (categoriesWithBudget.length === 0) {
      return [];
    }

    // Para cada categoria com orçamento, calcula o realizado
    for (const category of categoriesWithBudget) {
      // Soma todos os valores (negativos) dessa categoria
      const realizado = Math.abs(
        this.entries
          .filter(e => 
            e.categoria === category.categoria && 
            e.tipo.toUpperCase() === 'DESPESA'
          )
          .reduce((sum, e) => sum + Math.abs(e.valor), 0)
      );

      const percentual = category.orcamento > 0 
        ? (realizado / category.orcamento) * 100 
        : 0;

      let status: 'ok' | 'warning' | 'over' = 'ok';
      if (percentual >= 100) {
        status = 'over';
      } else if (percentual >= 80) {
        status = 'warning';
      }

      data.push({
        categoria: category.categoria,
        tipo: category.tipo,
        orcamento: category.orcamento,
        realizado,
        percentual,
        status
      });
    }

    // Ordena por percentual usado (maior primeiro)
    data.sort((a, b) => b.percentual - a.percentual);

    return data;
  }

  /**
   * Renderiza o estado vazio
   */
  private renderEmptyState(): void {
    this.container.innerHTML = `
      <div class="budget-chart">
        <h3 class="budget-chart__title">Orçamento por Categoria</h3>
        <div class="budget-chart__empty">
          <p>Nenhuma categoria com orçamento definido.</p>
          <p><small>Configure orçamentos na aba CATEGORIAS da planilha.</small></p>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza o gráfico completo
   */
  private renderChart(): void {
    // Limita a 10 categorias para não poluir o gráfico
    const displayData = this.chartData.slice(0, 10);
    
    const legendHTML = displayData.map((item, index) => {
      const color = this.getColor(index);
      const statusClass = `budget-chart__status--${item.status}`;
      
      return `
        <div class="budget-chart__legend-item">
          <div class="budget-chart__legend-color" style="background-color: ${color};"></div>
          <div class="budget-chart__legend-content">
            <div class="budget-chart__legend-label">${item.categoria}</div>
            <div class="budget-chart__legend-value">
              <span class="${statusClass}">
                R$ ${item.realizado.toFixed(2)} / R$ ${item.orcamento.toFixed(2)}
              </span>
              <span class="budget-chart__legend-percent ${statusClass}">
                ${item.percentual.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="budget-chart">
        <h3 class="budget-chart__title">Orçamento por Categoria</h3>
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
            <span>Total Orçado:</span>
            <span>R$ ${displayData.reduce((sum, d) => sum + d.orcamento, 0).toFixed(2)}</span>
          </div>
          <div class="budget-chart__summary-item">
            <span>Total Realizado:</span>
            <span>R$ ${displayData.reduce((sum, d) => sum + d.realizado, 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza o gráfico de rosca em SVG
   */
  private renderDonutChart(data: CategoryBudgetData[]): string {
    const size = 200;
    const strokeWidth = 30;
    const radius = (size - strokeWidth) / 2;
    const centerX = size / 2;
    const centerY = size / 2;

    // Calcula o total de orçamento
    const totalBudget = data.reduce((sum, d) => sum + d.orcamento, 0);
    
    if (totalBudget === 0) {
      return '<p>Sem dados de orçamento</p>';
    }

    let currentAngle = -90; // Começa no topo
    const segments = data.map((item, index) => {
      const percentage = (item.orcamento / totalBudget) * 100;
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
          data-category="${item.categoria}"
          data-value="${item.realizado.toFixed(2)}"
          data-budget="${item.orcamento.toFixed(2)}"
        >
          <title>${item.categoria}: R$ ${item.realizado.toFixed(2)} / R$ ${item.orcamento.toFixed(2)} (${item.percentual.toFixed(0)}%)</title>
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
 * Cria e renderiza um gráfico de orçamento
 */
export function renderCategoryBudgetChart(
  containerId: string,
  entries: ChartEntry[],
  categoriesComplete: CategoryComplete[]
): CategoryBudgetChart {
  const chart = new CategoryBudgetChart(containerId);
  chart.render(entries, categoriesComplete);
  return chart;
}
