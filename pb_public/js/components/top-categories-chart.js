/**
 * Componente para exibir as 10 categorias com mais gastos
 * @author Eh!Tudo.app
 */
import googleSheetsService from '../google/sheets-api.js';

class TopCategoriesChart {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            limit: options.limit || 10,
            periodo: options.periodo || 'atual'
        };
        this.data = null;
        this.isLoading = false;
    }

    formatarMoeda(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).format(value);
    }

    renderLoading() {
        if (!this.container) return;
        // Exibe esqueleto de tabela enquanto carrega
        const limit = this.options.limit;
        let skeletonRows = '';
        for (let i = 0; i < limit; i++) {
            skeletonRows += `
                <tr>
                    <td><div style="width:1rem;height:1rem;background:#eee;border-radius:4px;animation:pulse 1.5s infinite;"></div></td>
                    <td><div style="width:6rem;height:1rem;background:#eee;border-radius:4px;animation:pulse 1.5s infinite;"></div></td>
                    <td><div style="width:3rem;height:1rem;background:#eee;border-radius:4px;animation:pulse 1.5s infinite;"></div></td>
                    <td><div style="width:4rem;height:1rem;background:#eee;border-radius:4px;animation:pulse 1.5s infinite;"></div></td>
                </tr>`;
        }
        this.container.innerHTML = `
            <div class="top-categories-container">
                <h4>Top ${limit} Categorias - Gastos</h4>
                <div class="tabela-rolavel" style="width: 100%; overflow-x: auto; white-space: nowrap; border: 1px solid #ddd; padding: 5px; border-radius: 4px; -webkit-overflow-scrolling: touch;">
                    <table class="primary" style="min-width: 600px; width: 100%;">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Categoria</th>
                                <th>Valor</th>
                                <th>% do Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${skeletonRows}
                        </tbody>
                    </table>
                </div>
            </div>
            <style>
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.4; }
                    100% { opacity: 1; }
                }
            </style>
        `;
    }

    renderError(message) {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="error-state text-center">
                <div class="error-icon" style="color: #e74c3c; font-size: 2rem;">❌</div>
                <p style="color: #e74c3c;">Erro: ${message}</p>
                <button class="button" onclick="document.dispatchEvent(new CustomEvent('reload-top-categories'))">
                    Tentar Novamente
                </button>
            </div>
        `;
    }

    renderTable() {
        if (!this.container || !this.data || !this.data.length) {
            this.container.innerHTML = `
                <div class="empty-state text-center">
                    <p>Nenhum dado de categoria disponível.</p>
                </div>
            `;
            return;
        }

        let tableHTML = `
            <div class="top-categories-container">
                <h4>Top ${this.options.limit} Categorias - Gastos</h4>
                <div class="tabela-rolavel" style="width: 100%; overflow-x: auto; white-space: nowrap; border: 1px solid #ddd; padding: 5px; border-radius: 4px; -webkit-overflow-scrolling: touch;">
                    <table class="primary" style="min-width: 600px; width: 100%;">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Categoria</th>
                                <th>Valor</th>
                                <th>% do Total</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        const total = this.data.reduce((sum, item) => sum + item.valor, 0);

        this.data.forEach((item, index) => {
            const percentual = (item.valor / total * 100).toFixed(1);
            tableHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.categoria}</td>
                    <td>${this.formatarMoeda(item.valor)}</td>
                    <td>
                        <div class="percent-bar" style="display: flex; align-items: center;">
                            <div style="background-color: #3498db; height: 10px; width: ${percentual}%; max-width: 100%; border-radius: 2px;"></div>
                            <span style="margin-left: 5px;">${percentual}%</span>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
                </div>
            </div>
        `;

        this.container.innerHTML = tableHTML;
        
        // Verificar se a tabela precisa de rolagem e mostrar indicador visual se necessário
        setTimeout(() => {
            const tableContainer = this.container.querySelector('.tabela-rolavel');
            if (tableContainer && tableContainer.scrollWidth > tableContainer.clientWidth) {
                // Adicionar indicador visual de rolagem se a tabela for maior que o contêiner
                const indicator = document.createElement('div');
                indicator.style.position = 'absolute';
                indicator.style.right = '10px';
                indicator.style.top = '50%';
                indicator.style.transform = 'translateY(-50%)';
                indicator.style.color = '#999';
                indicator.style.backgroundColor = 'rgba(255,255,255,0.7)';
                indicator.style.padding = '5px';
                indicator.style.borderRadius = '3px';
                indicator.style.pointerEvents = 'none';
                indicator.textContent = '→';
                indicator.style.animation = 'fadeInOut 1.5s infinite';
                tableContainer.style.position = 'relative';
                tableContainer.appendChild(indicator);
            }
        }, 300);
    }

    async fetchData() {
        try {
            this.isLoading = true;
            this.renderLoading();
            const financialData = await googleSheetsService.getFinancialSummary(this.options.mesBase);
            if (!financialData || !financialData.categorias) {
                throw new Error('Dados de categorias não disponíveis');
            }
            const sortedData = financialData.categorias
                .sort((a, b) => b.valor - a.valor)
                .slice(0, this.options.limit);
            this.data = sortedData;
            this.renderTable();
        } catch (error) {
            console.error('Erro ao carregar dados das categorias:', error);
            this.renderError(error.message || 'Falha ao carregar dados');
        } finally {
            this.isLoading = false;
        }
    }

    init() {
        if (!this.container) {
            console.error(`Container com ID "${this.containerId}" não encontrado.`);
            return;
        }
        this.fetchData();
        document.addEventListener('reload-top-categories', () => { this.fetchData(); });
        
        // Adiciona estilo para animação do indicador de rolagem
        if (!document.getElementById('tabela-rolavel-style')) {
            const style = document.createElement('style');
            style.id = 'tabela-rolavel-style';
            style.textContent = `
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                }
                .tabela-rolavel::-webkit-scrollbar {
                    height: 8px;
                    background-color: #f5f5f5;
                }
                .tabela-rolavel::-webkit-scrollbar-thumb {
                    background-color: #ccc;
                    border-radius: 4px;
                }
            `;
            document.head.appendChild(style);
        }
        
        return this;
    }
}

export default TopCategoriesChart;
