/**
 * Serviço centralizado para gerenciamento de contas
 * 
 * FONTE PRIMÁRIA: Contas extraídas da planilha Google Sheets do usuário
 * FALLBACK: Contas padrão (apenas quando planilha indisponível/vazia/erro)
 * 
 * Responsabilidades:
 * - Buscar contas utilizadas na planilha do usuário
 * - Fornecer fallbacks consistentes quando necessário
 * - Gerenciar cache para otimizar performance
 * - Padronizar comportamento entre formulários
 */

class AccountsService {
    constructor() {
        this.defaultAccounts = [
            'Conta Corrente', 'Poupança', 'Cartão de Crédito', 
            'Cartão de Débito', 'Dinheiro', 'PIX', 'Outras'
        ];
        this.cache = null;
        this.cacheTimestamp = null;
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
    }

    /**
     * Obtém contas da planilha do usuário
     * Usa contas padrão apenas como fallback em caso de erro ou planilha vazia
     * @param {boolean} forceRefresh - Força busca da planilha ignorando cache
     * @returns {Promise<Array<string>>} Lista de contas
     */
    async getAccounts(forceRefresh = false) {
        // Retorna cache se válido e não forçando refresh
        if (!forceRefresh && this.cache && this.cacheTimestamp && 
            (Date.now() - this.cacheTimestamp) < this.cacheExpiry) {
            console.log('[AccountsService] Retornando contas do cache');
            return this.cache;
        }

        try {
            // PRIORIDADE 1: Buscar contas da planilha via getFinancialSummary
            if (window.googleSheetsService && typeof window.googleSheetsService.getFinancialSummary === 'function') {
                console.log('[AccountsService] Buscando contas da planilha...');
                
                // Obtém dados financeiros que incluem contasSugeridas
                const summaryData = await window.googleSheetsService.getFinancialSummary();
                const contasFromSheet = summaryData.contasSugeridas || [];
                
                // Se a planilha retornou contas, usa elas
                if (Array.isArray(contasFromSheet)) {
                    let lista;
                    
                    if (contasFromSheet.length > 0) {
                        // Planilha tem contas - usa elas
                        lista = contasFromSheet;
                        console.log('[AccountsService] Usando contas da planilha:', lista);
                    } else {
                        // Planilha existe mas não tem contas - usa padrão como fallback
                        lista = this.defaultAccounts;
                        console.log('[AccountsService] Planilha sem contas, usando contas padrão como fallback:', lista);
                    }
                    
                    // Atualiza cache
                    this.cache = lista;
                    this.cacheTimestamp = Date.now();
                    
                    return lista;
                }
            }
            
            // PRIORIDADE 2: Google Sheets Service não disponível - usar contas padrão
            console.log('[AccountsService] Google Sheets Service não disponível, usando contas padrão');
            return this.defaultAccounts;
            
        } catch (error) {
            console.error('[AccountsService] Erro ao carregar contas da planilha:', error);
            // PRIORIDADE 3: Erro - usar contas padrão como fallback
            console.log('[AccountsService] Usando contas padrão devido ao erro');
            return this.defaultAccounts;
        }
    }

    /**
     * Popula um elemento datalist com as contas
     * @param {string} datalistId - ID do elemento datalist
     * @param {boolean} forceRefresh - Força busca da planilha
     * @returns {Promise<void>}
     */
    async populateDatalist(datalistId, forceRefresh = false) {
        const datalist = document.getElementById(datalistId);
        if (!datalist) {
            console.warn(`[AccountsService] Datalist com ID '${datalistId}' não encontrado`);
            return;
        }

        try {
            // Busca contas
            const contas = await this.getAccounts(forceRefresh);
            
            // Limpa opções existentes
            datalist.innerHTML = '';
            
            // Popula datalist
            contas.forEach(conta => {
                const opt = document.createElement('option');
                opt.value = conta;
                datalist.appendChild(opt);
            });
            
            console.log(`[AccountsService] Datalist '${datalistId}' populado com ${contas.length} contas`);
        } catch (error) {
            console.error(`[AccountsService] Erro ao popular datalist '${datalistId}':`, error);
            // Em caso de erro, popula com contas padrão
            datalist.innerHTML = '';
            this.defaultAccounts.forEach(conta => {
                const opt = document.createElement('option');
                opt.value = conta;
                datalist.appendChild(opt);
            });
        }
    }

    /**
     * Configura autocomplete para um input de conta (similar ao dashboard/index.html)
     * @param {string} inputId - ID do input de conta
     * @param {string} suggestionsId - ID do container de sugestões
     * @param {boolean} forceRefresh - Força busca da planilha
     * @returns {Promise<void>}
     */
    async setupAutocomplete(inputId, suggestionsId, forceRefresh = false) {
        const input = document.getElementById(inputId);
        const suggestionsContainer = document.getElementById(suggestionsId);
        
        if (!input) {
            console.warn(`[AccountsService] Input com ID '${inputId}' não encontrado`);
            return;
        }

        // Cria container de sugestões se não existir
        let suggestions = suggestionsContainer;
        if (!suggestions) {
            suggestions = document.createElement('div');
            suggestions.id = suggestionsId;
            suggestions.style.cssText = `
                position: absolute;
                background: white;
                border: 1px solid #ccc;
                border-top: none;
                max-height: 150px;
                overflow-y: auto;
                width: 100%;
                z-index: 1000;
                display: none;
            `;
            input.parentNode.style.position = 'relative';
            input.parentNode.appendChild(suggestions);
        }

        try {
            // Busca contas
            const contas = await this.getAccounts(forceRefresh);
            
            // Configura listener de input
            input.addEventListener('input', () => {
                const val = input.value.trim().toLowerCase();
                suggestions.innerHTML = '';
                
                if (!val) {
                    // Mostra primeiras 5 contas quando campo vazio
                    contas.slice(0, 5).forEach(conta => {
                        const div = document.createElement('div');
                        div.textContent = conta;
                        div.style.cssText = 'padding: 0.5rem; cursor: pointer; border-bottom: 1px solid #eee;';
                        div.addEventListener('click', () => {
                            input.value = conta;
                            suggestions.innerHTML = '';
                            suggestions.style.display = 'none';
                        });
                        suggestions.appendChild(div);
                    });
                    suggestions.style.display = 'block';
                    return;
                }
                
                // Filtra contas baseado no que foi digitado
                const matches = contas.filter(conta => conta.toLowerCase().includes(val));
                if (matches.length) {
                    matches.slice(0, 5).forEach(conta => {
                        const div = document.createElement('div');
                        div.textContent = conta;
                        div.style.cssText = 'padding: 0.5rem; cursor: pointer; border-bottom: 1px solid #eee;';
                        div.addEventListener('click', () => {
                            input.value = conta;
                            suggestions.innerHTML = '';
                            suggestions.style.display = 'none';
                        });
                        suggestions.appendChild(div);
                    });
                    suggestions.style.display = 'block';
                } else {
                    suggestions.style.display = 'none';
                }
            });

            // Fecha sugestões quando clica fora
            document.addEventListener('click', (e) => {
                if (e.target !== input && !suggestions.contains(e.target)) {
                    suggestions.style.display = 'none';
                }
            });
            
            console.log(`[AccountsService] Autocomplete configurado para '${inputId}' com ${contas.length} contas`);
        } catch (error) {
            console.error(`[AccountsService] Erro ao configurar autocomplete para '${inputId}':`, error);
        }
    }

    /**
     * Limpa o cache de contas
     */
    clearCache() {
        this.cache = null;
        this.cacheTimestamp = null;
        console.log('[AccountsService] Cache de contas limpo');
    }

    /**
     * Retorna as contas padrão
     * @returns {Array<string>}
     */
    getDefaultAccounts() {
        return [...this.defaultAccounts];
    }
}

// Exportar instância singleton
const accountsService = new AccountsService();

// Disponibilizar globalmente para compatibilidade
if (typeof window !== 'undefined') {
    window.accountsService = accountsService;
}

export default accountsService;