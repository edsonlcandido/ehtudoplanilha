/**
 * Componente para exibir cards financeiros (Saldo, Despesas, Receitas)
 * @author Eh!Tudo.app
 */

class FinancialCards {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            showToggleButtons: options.showToggleButtons !== false, // Por padrão, mostra botões de toggle
            ...options
        };
        
        // Estado interno dos cards
        this.data = {
            saldo: 0,
            despesas: 0,
            receitas: 0,
            variacaoDespesas: 0
        };
        
        // Controle de visibilidade dos valores
        this.despesasVisivel = this.loadVisibilityPreference('despesasVisivel', true);
        this.receitasVisivel = this.loadVisibilityPreference('receitasVisivel', true);
        
        // Valores atuais para controle de toggle
        this.valorDespesasAtual = 'R$ 0,00';
        this.valorReceitasAtual = 'R$ 0,00';
        
        this.isLoading = false;
    }

    /**
     * Carrega preferência de visibilidade do localStorage
     */
    loadVisibilityPreference(key, defaultValue) {
        const stored = localStorage.getItem(key);
        return stored !== null ? JSON.parse(stored) : defaultValue;
    }

    /**
     * Salva preferência de visibilidade no localStorage
     */
    saveVisibilityPreference(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    /**
     * Formata valor monetário para padrão brasileiro
     */
    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).format(valor);
    }

    /**
     * Formata variação percentual para despesas
     */
    formatarVariacaoDespesas(variacao) {
        const sinal = variacao >= 0 ? '+' : '';
        // Para despesas: variação negativa é boa (menos gastos = 📉 verde), positiva é ruim (mais gastos = 📈 vermelho)
        const icone = variacao > 0 ? '📈' : variacao < 0 ? '📉' : '📊';
        const classe = variacao > 0 ? 'variation-negative' : 
                     variacao < 0 ? 'variation-positive' : 'variation-neutral';
        
        return {
            texto: `${sinal}${variacao.toFixed(1)}% em relação ao mês anterior`,
            classe: classe,
            icone: icone
        };
    }

    /**
     * Renderiza o estado de loading dos cards
     */
    renderLoading() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="dashboard-cards">
                <div class="financial-card saldo loading">
                    <div class="card-header">
                        <div class="card-icon">💵</div>
                        <h3 class="card-title">Saldo</h3>
                    </div>
                    <div class="card-value">R$ 0,00</div>
                </div>
                
                <div class="financial-card despesas loading">
                    <div class="card-header">
                        <div class="card-icon">💸</div>
                        <h3 class="card-title">Despesas</h3>
                    </div>
                    <div class="card-value">
                        <span>R$ 0,00</span>
                        ${this.options.showToggleButtons ? `
                            <button type="button" class="toggle-eye" aria-label="Ocultar/Mostrar Despesas" style="background:none;border:none;cursor:pointer;font-size:1.2rem;">
                                <span>👁️</span>
                            </button>
                        ` : ''}
                    </div>
                    <div class="card-variation">
                        <span class="variation-icon">📉</span>
                        <span>+0,0% em relação ao mês anterior</span>
                    </div>
                </div>
                
                <div class="financial-card receitas loading">
                    <div class="card-header">
                        <div class="card-icon">💰</div>
                        <h3 class="card-title">Receitas</h3>
                    </div>
                    <div class="card-value">
                        <span>R$ 0,00</span>
                        ${this.options.showToggleButtons ? `
                            <button type="button" class="toggle-eye" aria-label="Ocultar/Mostrar Receitas" style="background:none;border:none;cursor:pointer;font-size:1.2rem;">
                                <span>👁️</span>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza estado de erro
     */
    renderError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="error-state text-center">
                <div class="error-icon" style="color: #e74c3c; font-size: 2rem;">❌</div>
                <p style="color: #e74c3c;">Erro: ${message}</p>
                <button class="button" onclick="document.dispatchEvent(new CustomEvent('reload-financial-cards'))">
                    Tentar Novamente
                </button>
            </div>
        `;
    }

    /**
     * Renderiza os cards com os dados
     */
    renderCards() {
        if (!this.container) return;
        
        // Formatar valores
        const saldoFormatado = this.formatarMoeda(this.data.saldo || 0);
        const despesasFormatado = this.formatarMoeda(this.data.despesas || 0);
        const receitasFormatado = this.formatarMoeda(this.data.receitas || 0);
        
        // Atualizar valores atuais
        this.valorDespesasAtual = despesasFormatado;
        this.valorReceitasAtual = receitasFormatado;
        
        // Preparar valores de exibição conforme visibilidade
        const despesasDisplay = this.despesasVisivel ? despesasFormatado : '••••••';
        const receitasDisplay = this.receitasVisivel ? receitasFormatado : '••••••';
        const iconDespesas = this.despesasVisivel ? '👁️' : '🙈';
        const iconReceitas = this.receitasVisivel ? '👁️' : '🙈';
        
        // Preparar variação de despesas
        let variationHTML = '';
        if (typeof this.data.variacaoDespesas === 'number') {
            const despesasVar = this.formatarVariacaoDespesas(this.data.variacaoDespesas);
            variationHTML = `
                <div class="card-variation ${despesasVar.classe}">
                    <span class="variation-icon">${despesasVar.icone}</span>
                    <span>${despesasVar.texto}</span>
                </div>
            `;
        } else {
            variationHTML = `
                <div class="card-variation">
                    <span class="variation-icon">📉</span>
                    <span>+0,0% em relação ao mês anterior</span>
                </div>
            `;
        }
        
        this.container.innerHTML = `
            <div class="dashboard-cards">
                <div class="financial-card saldo">
                    <div class="card-header">
                        <div class="card-icon">💵</div>
                        <h3 class="card-title">Saldo</h3>
                    </div>
                    <div class="card-value" data-card="saldo">${saldoFormatado}</div>
                </div>
                
                <div class="financial-card despesas">
                    <div class="card-header">
                        <div class="card-icon">💸</div>
                        <h3 class="card-title">Despesas</h3>
                    </div>
                    <div class="card-value" style="display:flex; align-items:center; justify-content:space-between;">
                        <span data-card="despesas">${despesasDisplay}</span>
                        ${this.options.showToggleButtons ? `
                            <button type="button" class="toggle-despesas toggle-eye" aria-label="Ocultar/Mostrar Despesas" style="background:none;border:none;cursor:pointer;font-size:1.2rem;">
                                <span>${iconDespesas}</span>
                            </button>
                        ` : ''}
                    </div>
                    ${variationHTML}
                </div>
                
                <div class="financial-card receitas">
                    <div class="card-header">
                        <div class="card-icon">💰</div>
                        <h3 class="card-title">Receitas</h3>
                    </div>
                    <div class="card-value" style="display:flex; align-items:center; justify-content:space-between;">
                        <span data-card="receitas">${receitasDisplay}</span>
                        ${this.options.showToggleButtons ? `
                            <button type="button" class="toggle-receitas toggle-eye" aria-label="Ocultar/Mostrar Receitas" style="background:none;border:none;cursor:pointer;font-size:1.2rem;">
                                <span>${iconReceitas}</span>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Configurar event listeners para toggle buttons
        this.setupToggleButtons();
    }

    /**
     * Configura os event listeners para os botões de toggle
     */
    setupToggleButtons() {
        if (!this.options.showToggleButtons) return;
        
        const toggleDespesas = this.container.querySelector('.toggle-despesas');
        const toggleReceitas = this.container.querySelector('.toggle-receitas');
        
        if (toggleDespesas) {
            toggleDespesas.addEventListener('click', () => {
                this.toggleDespesasVisibility();
            });
        }
        
        if (toggleReceitas) {
            toggleReceitas.addEventListener('click', () => {
                this.toggleReceitasVisibility();
            });
        }
    }

    /**
     * Alterna visibilidade das despesas
     */
    toggleDespesasVisibility() {
        this.despesasVisivel = !this.despesasVisivel;
        this.saveVisibilityPreference('despesasVisivel', this.despesasVisivel);
        
        const despesasValueElement = this.container.querySelector('[data-card="despesas"]');
        const iconElement = this.container.querySelector('.toggle-despesas span');
        
        if (despesasValueElement && iconElement) {
            if (this.despesasVisivel) {
                despesasValueElement.textContent = this.valorDespesasAtual;
                iconElement.textContent = '👁️';
            } else {
                despesasValueElement.textContent = '••••••';
                iconElement.textContent = '🙈';
            }
        }
    }

    /**
     * Alterna visibilidade das receitas
     */
    toggleReceitasVisibility() {
        this.receitasVisivel = !this.receitasVisivel;
        this.saveVisibilityPreference('receitasVisivel', this.receitasVisivel);
        
        const receitasValueElement = this.container.querySelector('[data-card="receitas"]');
        const iconElement = this.container.querySelector('.toggle-receitas span');
        
        if (receitasValueElement && iconElement) {
            if (this.receitasVisivel) {
                receitasValueElement.textContent = this.valorReceitasAtual;
                iconElement.textContent = '👁️';
            } else {
                receitasValueElement.textContent = '••••••';
                iconElement.textContent = '🙈';
            }
        }
    }

    /**
     * Remove estado de loading dos cards
     */
    removeLoadingState() {
        if (!this.container) return;
        
        this.container.querySelectorAll('.financial-card.loading').forEach(card => {
            card.classList.remove('loading');
        });
    }

    /**
     * Atualiza os dados dos cards
     */
    updateData(data) {
        console.log('Dados recebidos para atualizar cards:', data);
        
        // Atualizar dados internos
        this.data = {
            saldo: data.saldo || 0,
            despesas: data.despesas || 0,
            receitas: data.receitas || 0,
            variacaoDespesas: data.variacaoDespesas || 0
        };
        
        // Re-renderizar os cards
        this.renderCards();
        
        console.log('Cards financeiros atualizados com sucesso');
    }

    /**
     * Mostra os cards (remove display: none)
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    /**
     * Esconde os cards
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * Inicializa o componente
     */
    init() {
        if (!this.container) {
            console.error(`Container com ID "${this.containerId}" não encontrado.`);
            return;
        }
        
        // Renderizar estado inicial (loading)
        this.renderLoading();
        
        // Configurar event listener para recarregar
        document.addEventListener('reload-financial-cards', () => {
            this.renderLoading();
        });
        
        return this;
    }
}

export default FinancialCards;