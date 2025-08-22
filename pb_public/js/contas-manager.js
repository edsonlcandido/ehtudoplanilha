/**
 * Módulo para gerenciar a exibição de contas na visão geral
 * Responsável por agrupar lançamentos por conta e exibir saldos
 */

import googleSheetsService from './google/sheets-api.js';

class ContasManager {
    constructor() {
        this.entries = [];
        this.contas = [];
        this.orcamentoAtual = '';
        this.isLoading = false;
        this._initialLoadDone = false; // controla primeira carga para mensagens
        this.availableBudgets = []; // armazena orçamentos disponíveis
    }

    /**
     * Inicializa o gerenciador de contas
     * @param {string} orcamentoInicial - Orçamento inicial (formato 'AAAA-MM' ou 'mês/AA')
     */
    async init(orcamentoInicial) {
        // Garante inicialização do serviço Google Sheets com a instância global do PocketBase
        if (window.pb && !googleSheetsService.pb) {
            try {
                googleSheetsService.init(window.pb);
            } catch (e) {
                console.error('Falha ao inicializar serviço Google Sheets:', e);
            }
        }
        
        this.orcamentoAtual = orcamentoInicial || this.obterOrcamentoAtual();
        console.log(`ContasManager: Inicializando com orçamento ${this.orcamentoAtual}`);
        
        // Carregar orçamentos disponíveis
        await this.carregarOrcamentosDisponiveis();
        
        // Configurar listeners
        this.setupEventListeners();
        
        // Carregar dados
        await this.carregarContas(this.orcamentoAtual);
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Botão de atualizar (se existir)
        const refreshBtn = document.getElementById('refreshAccountsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.carregarContas(this.orcamentoAtual));
        }

        // Select de orçamento principal
        const orcamentoSelect = document.getElementById('orcamentoSelect');
        if (orcamentoSelect) {
            orcamentoSelect.addEventListener('change', (e) => {
                this.orcamentoAtual = e.target.value;
                this.carregarContas(this.orcamentoAtual);
                
                // Atualiza o período no resumo
                const periodEl = document.getElementById('summaryPeriod');
                if (periodEl) {
                    periodEl.textContent = this.orcamentoAtual.charAt(0).toUpperCase() + this.orcamentoAtual.slice(1);
                }
                
                // Atualiza todos os selects nos cards de conta
                document.querySelectorAll('.account-budget-select').forEach(select => {
                    select.value = this.orcamentoAtual;
                });
            });
        }
    }

    /**
     * Obtém o orçamento atual (mês/ano atual)
     * @returns {string} Orçamento no formato 'AAAA-MM'
     */
    obterOrcamentoAtual() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
        return `${ano}-${mes}`;
    }

    /**
     * Carrega a lista de orçamentos disponíveis
     */
    async carregarOrcamentosDisponiveis() {
        try {
            console.log('ContasManager: Carregando orçamentos disponíveis...');
            let budgets = [];
            
            // Tentar obter do serviço GoogleSheets
            if (googleSheetsService && googleSheetsService.getAvailableBudgets) {
                budgets = await googleSheetsService.getAvailableBudgets();
                console.log(`ContasManager: ${budgets.length} orçamentos carregados do serviço Google Sheets`);
            } else {
                // Fallback local com meses relativos
                const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
                const now = new Date();
                for (let i = -6; i <= 3; i++) {
                    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
                    budgets.push(`${meses[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`);
                }
                console.log(`ContasManager: ${budgets.length} orçamentos gerados localmente (fallback)`);
            }
            
            // Armazenar internamente
            this.availableBudgets = budgets || [];
            
            return this.availableBudgets;
        } catch (error) {
            console.error('ContasManager: Erro ao carregar orçamentos disponíveis:', error);
            // Fallback mínimo em caso de erro
            this.availableBudgets = [];
            return [];
        }
    }
    
    /**
     * Retorna a lista de orçamentos disponíveis
     * @returns {Array} - Lista de orçamentos disponíveis
     */
    getAvailableBudgets() {
        // Se a lista estiver vazia, tenta um fallback simples
        if (!this.availableBudgets || this.availableBudgets.length === 0) {
            const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
            const now = new Date();
            const fallbackBudgets = [];
            for (let i = -3; i <= 2; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
                fallbackBudgets.push(`${meses[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`);
            }
            return fallbackBudgets;
        }
        
        return this.availableBudgets;
    }

    /**
     * Carrega os lançamentos da planilha e agrupa por conta
     * @param {string} orcamento - Orçamento no formato 'AAAA-MM' ou 'mês/AA'
     */
    async carregarContas(orcamento) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.mostrarCarregando();

        try {
            console.log(`ContasManager: Carregando contas para orçamento ${orcamento}`);
            
            // Carregar todos os lançamentos (sem limite)
            const response = await this.fetchSheetEntries(1000);
            
            if (!response.success) {
                throw new Error(response.error || 'Falha ao carregar lançamentos');
            }

            this.entries = response.entries || [];
            console.log(`ContasManager: ${this.entries.length} lançamentos carregados`);
            
            // Converter orçamento para o formato esperado para filtrar entradas
            const orcamentoFormatado = this.converterParaOrcamentoNumerico(orcamento);
            console.log(`ContasManager: Convertido orçamento ${orcamento} para formato numérico: ${orcamentoFormatado}`);
            
            // Processar e agrupar por conta
            this.contas = this.agruparPorConta(this.entries, orcamentoFormatado);
            console.log(`ContasManager: ${this.contas.length} contas agrupadas:`, this.contas);
            
            // Renderizar os cards de contas
            this.renderizarCardsContas();
            
            if (this._initialLoadDone) {
                this.mostrarMensagem('Contas carregadas com sucesso', 'success');
            }
        } catch (error) {
            console.error('Erro ao carregar contas:', error);
            this.mostrarMensagem(`Erro ao carregar contas: ${error.message}`, 'error');
            this.contas = [];
            this.renderizarCardsContas();
        } finally {
            this.isLoading = false;
            this.esconderCarregando();
            if (!this._initialLoadDone) this._initialLoadDone = true;
        }
    }

    /**
     * Busca entradas diretamente do endpoint dedicado
     * @param {number} limit - Limite de entradas a retornar 
     */
    async fetchSheetEntries(limit = 1000) {
        if (!window.pb) {
            throw new Error('PocketBase não inicializado');
        }

        try {
            const response = await fetch(`${window.pb.baseUrl}/get-sheet-entries?limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${window.pb.authStore.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar entradas da planilha');
            }

            return data;
        } catch (error) {
            console.error('Erro ao buscar entradas da planilha:', error);
            throw error;
        }
    }

    /**
     * Converte orçamento de qualquer formato para o formato numérico (serial Excel)
     * @param {string} orcamento - Orçamento no formato 'AAAA-MM' ou 'mês/AA'
     * @returns {number|null} - Valor numérico do orçamento ou null se inválido
     */
    converterParaOrcamentoNumerico(orcamento) {
        // Se já for numérico, retorna como está
        if (typeof orcamento === 'number') {
            return orcamento;
        }
        
        // Se for string no formato AAAA-MM
        if (typeof orcamento === 'string' && /^\d{4}-\d{2}$/.test(orcamento)) {
            const [ano, mes] = orcamento.split('-').map(Number);
            // Calcular o primeiro dia do mês como serial Excel
            // Excel: 1 = 1/1/1900, ajustado para bug de Excel (considerar 1900 como ano bissexto)
            const data = new Date(ano, mes - 1, 1);
            const diasDesde1900 = Math.floor((data - new Date(1900, 0, 1)) / (24 * 60 * 60 * 1000)) + 2;
            return diasDesde1900;
        }
        
        // Se for string no formato mês/AA (ex: 'setembro/25')
        if (typeof orcamento === 'string' && orcamento.includes('/')) {
            const [mes, anoAbreviado] = orcamento.split('/');
            const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
            const mesIndex = meses.findIndex(m => m.toLowerCase() === mes.toLowerCase());
            
            if (mesIndex === -1) {
                console.error(`Mês inválido: ${mes}`);
                return null;
            }
            
            const ano = 2000 + parseInt(anoAbreviado, 10);
            const data = new Date(ano, mesIndex, 1);
            const diasDesde1900 = Math.floor((data - new Date(1900, 0, 1)) / (24 * 60 * 60 * 1000)) + 2;
            return diasDesde1900;
        }
        
        // Se não conseguiu converter
        console.error(`Formato de orçamento não reconhecido: ${orcamento}`);
        return null;
    }

    /**
     * Agrupa os lançamentos por conta e calcula saldos
     * @param {Array} entries - Array de lançamentos da planilha
     * @param {number} orcamentoSerial - Orçamento no formato numérico (serial Excel)
     * @returns {Array} - Array de objetos de conta com saldos
     */
    agruparPorConta(entries, orcamentoSerial) {
        // Map para acumular saldos por conta
        const contasMap = new Map();
        
        // Filtrar entradas pelo orçamento e agrupar por conta
        entries.forEach(entry => {
            // Se não tiver orçamento definido ou não for o mesmo que estamos filtrando, pular
            if (entry.orcamento !== orcamentoSerial) {
                return;
            }
            
            const nomeConta = entry.conta ? entry.conta.trim() : 'Sem Conta';
            const valor = typeof entry.valor === 'number' ? entry.valor : parseFloat(String(entry.valor).replace(',', '.')) || 0;
            
            if (!contasMap.has(nomeConta)) {
                contasMap.set(nomeConta, {
                    nome: nomeConta,
                    saldo: valor,
                    lancamentos: [entry]
                });
            } else {
                const contaExistente = contasMap.get(nomeConta);
                contaExistente.saldo += valor;
                contaExistente.lancamentos.push(entry);
            }
        });
        
        // Se não encontrou nenhuma conta para este orçamento, vamos criar contas vazias
        // a partir da lista de todas as contas usadas em todos os lançamentos
        if (contasMap.size === 0) {
            console.log('Nenhuma conta encontrada para este orçamento, criando lista a partir de todas as contas');
            
            // Obter lista única de todas as contas usadas
            const todasContas = new Set();
            entries.forEach(entry => {
                if (entry.conta) {
                    todasContas.add(entry.conta.trim());
                }
            });
            
            // Criar contas com saldo zero
            todasContas.forEach(nomeConta => {
                if (nomeConta && nomeConta.trim() !== '') {
                    contasMap.set(nomeConta, {
                        nome: nomeConta,
                        saldo: 0,
                        lancamentos: []
                    });
                }
            });
        }
        
        // Converter Map para array e ordenar por nome
        return Array.from(contasMap.values())
            .filter(conta => conta.nome && conta.nome.trim() !== '')
            .sort((a, b) => a.nome.localeCompare(b.nome));
    }

    /**
     * Renderiza os cards de contas na página
     */
    renderizarCardsContas() {
        const container = document.getElementById('accountsContainer');
        const totalElem = document.getElementById('totalBalanceValue');
        
        if (!container) {
            console.error('Container de contas não encontrado');
            return;
        }
        
        container.innerHTML = '';
        
        // Se não tiver contas, mostrar mensagem
        if (!this.contas || this.contas.length === 0) {
            container.innerHTML = `
                <div class="loading-card">
                    <div>
                        <p>Não há dados de contas para o orçamento selecionado.</p>
                    </div>
                </div>`;
                
            if (totalElem) {
                totalElem.textContent = this.formatarMoeda(0);
                totalElem.className = 'summary-value balance-zero';
            }
            return;
        }
        
        // Calcular saldo total
        let saldoTotal = 0;
        
        // Renderizar cards para cada conta
        this.contas.forEach(conta => {
            saldoTotal += Number(conta.saldo || 0);
            
            // Determinar classe de estilo com base no saldo
            let classeEstilo = 'balance-zero';
            if (conta.saldo > 0) classeEstilo = 'balance-positive';
            if (conta.saldo < 0) classeEstilo = 'balance-negative';
            
            // Criar card
            const card = document.createElement('div');
            card.className = 'financial-card';
            card.style.borderLeft = '4px solid #4568dc'; // Borda azul à esquerda
            
            // Header com ícone, título e select de orçamento alinhado à direita
            const header = document.createElement('div'); 
            header.className = 'card-header';
            const icon = document.createElement('div'); 
            icon.className = 'card-icon'; 
            icon.textContent = '🏦';
            const title = document.createElement('h3'); 
            title.className = 'card-title'; 
            title.textContent = conta.nome;
            const rightWrap = document.createElement('div'); 
            rightWrap.style.marginLeft = 'auto';

            // Select de orçamento por conta (altera orçamento atual e recarrega)
            const select = document.createElement('select'); 
            select.className = 'form-control account-budget-select';
            
            // Obter orçamentos disponíveis para o select
            const availableBudgets = this.getAvailableBudgets();
            if (availableBudgets && availableBudgets.length) {
                availableBudgets.forEach(b => {
                    const opt = document.createElement('option');
                    opt.value = b;
                    opt.textContent = b.charAt(0).toUpperCase() + b.slice(1);
                    select.appendChild(opt);
                });
                select.value = this.orcamentoAtual || availableBudgets[0];
            } else {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = '—';
                select.appendChild(opt);
            }

            select.addEventListener('change', (e) => {
                const novoOrcamento = e.target.value;
                if (!novoOrcamento) return;
                
                // Atualiza orçamento global e recarrega dados
                this.orcamentoAtual = novoOrcamento;
                
                // Atualiza todos selects para refletir mudança
                document.querySelectorAll('.account-budget-select').forEach(s => {
                    s.value = novoOrcamento;
                });
                
                // Recarrega dados com novo orçamento
                this.carregarContas(novoOrcamento);
                
                // Atualiza o seletor principal também
                const orcamentoSelect = document.getElementById('orcamentoSelect');
                if (orcamentoSelect) {
                    orcamentoSelect.value = novoOrcamento;
                }
                
                // Atualiza o período no resumo
                const periodEl = document.getElementById('summaryPeriod');
                if (periodEl) {
                    periodEl.textContent = novoOrcamento.charAt(0).toUpperCase() + novoOrcamento.slice(1);
                }
            });

            rightWrap.appendChild(select);
            header.appendChild(icon);
            header.appendChild(title);
            header.appendChild(rightWrap);
            
            // Exibir saldo
            const valueWrap = document.createElement('div');
            valueWrap.className = 'card-value';
            valueWrap.innerHTML = `<span class="account-balance ${classeEstilo}">${this.formatarMoeda(conta.saldo)}</span>`;
            
            // Montar card completo
            card.appendChild(header);
            card.appendChild(valueWrap);
            
            // Adicionar ao container
            container.appendChild(card);
        });
        
        // Atualizar saldo total se o elemento existir
        if (totalElem) {
            totalElem.textContent = this.formatarMoeda(saldoTotal);
            
            // Atualizar classe com base no saldo total
            if (saldoTotal > 0) {
                totalElem.className = 'summary-value balance-positive';
            } else if (saldoTotal < 0) {
                totalElem.className = 'summary-value balance-negative';
            } else {
                totalElem.className = 'summary-value balance-zero';
            }
        }
    }

    /**
     * Formata um valor para moeda brasileira
     * @param {number} valor - Valor a ser formatado
     * @returns {string} - Valor formatado como moeda
     */
    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    /**
     * Mostra indicador de carregamento
     */
    mostrarCarregando() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
        }
        
        const container = document.getElementById('accountsContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-card">
                    <div class="loading-spinner"></div>
                    <p>Carregando contas...</p>
                </div>`;
        }
    }

    /**
     * Esconde indicador de carregamento
     */
    esconderCarregando() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }

    /**
     * Mostra mensagem ao usuário
     * @param {string} texto - Texto da mensagem
     * @param {string} tipo - Tipo da mensagem (success, error, info)
     */
    mostrarMensagem(texto, tipo = 'info') {
        const messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) return;
        
        const message = document.createElement('div');
        message.className = `message ${tipo}`;
        message.textContent = texto;
        
        messageContainer.innerHTML = '';
        messageContainer.appendChild(message);
        
        // Auto-remover após alguns segundos
        setTimeout(() => {
            message.classList.add('fade-out');
            setTimeout(() => {
                if (messageContainer.contains(message)) {
                    messageContainer.removeChild(message);
                }
            }, 500);
        }, 5000);
    }
}

// Exportar instância única
const contasManager = new ContasManager();
export default contasManager;
