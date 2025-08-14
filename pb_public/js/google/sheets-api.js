/**
 * Serviço para interação com Google Sheets API
 * Responsável por operações de planilhas e gerenciamento
 */

class GoogleSheetsService {
    constructor() {
        this.pb = null;
    // Cache em memória por mês (AAAA-MM ou serial) => { data, ts }
    this._summaryCache = {};
    // Promessas em andamento para evitar duplicação de fetch simultâneo
    this._summaryInflight = {};
    }

    /**
     * Inicializa o serviço com instância do PocketBase
     * @param {PocketBase} pocketbaseInstance 
     */
    init(pocketbaseInstance) {
        this.pb = pocketbaseInstance;
    }

    /**
     * Lista todas as planilhas do Google Sheets do usuário
     * @returns {Promise<Object>}
     */
    async listUserSheets() {
        if (!this.pb) {
            throw new Error('Serviço Sheets não inicializado');
        }

        try {
            const response = await fetch(`${this.pb.baseUrl}/list-google-sheets`, {
                method: 'GET',
                headers: {
                    'Authorization': this.pb.authStore.token,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar planilhas');
            }

            return data;
        } catch (error) {
            console.error('Erro ao listar planilhas:', error);
            throw error;
        }
    }

    /**
     * Salva o ID da planilha selecionada pelo usuário
     * @param {string} sheetId - ID da planilha
     * @param {string} sheetName - Nome da planilha
     * @returns {Promise<Object>}
     */
    async saveSelectedSheet(sheetId, sheetName = '') {
        if (!sheetId) {
            throw new Error('sheet_id é obrigatório');
        }

        try {
            const response = await fetch(`${this.pb.baseUrl}/save-sheet-id`, {
                method: 'POST',
                headers: {
                    'Authorization': this.pb.authStore.token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sheet_id: sheetId,
                    sheet_name: sheetName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao salvar planilha');
            }

            return data;
        } catch (error) {
            console.error('Erro ao salvar planilha selecionada:', error);
            throw error;
        }
    }

    /**
     * Provisiona (copia) uma planilha template para o usuário
     * @returns {Promise<Object>}
     */
    async provisionTemplateSheet() {
        if (!this.pb) {
            throw new Error('Serviço Sheets não inicializado');
        }

        try {
            const response = await fetch(`${this.pb.baseUrl}/provision-sheet`, {
                method: 'POST',
                headers: {
                    'Authorization': this.pb.authStore.token,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao copiar template');
            }

            return data;
        } catch (error) {
            console.error('Erro ao provisionar template:', error);
            throw error;
        }
    }

    /**
     * Adiciona uma nova entrada na planilha (para lançamentos financeiros)
     * @param {Object} entryData - Dados da entrada
     * @returns {Promise<Object>}
     */
    async addEntry(entryData) {
        if (!this.pb) {
            throw new Error('Serviço Sheets não inicializado');
        }

        try {
            const response = await fetch(`${this.pb.baseUrl}/append-entry`, {
                method: 'POST',
                headers: {
                    'Authorization': this.pb.authStore.token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entryData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao adicionar entrada');
            }

            // Limpa cache do mês afetado (entryData.orcamento vem como '01/MM/AAAA')
            if (entryData && typeof entryData.orcamento === 'string') {
                const m = entryData.orcamento.match(/^\d{2}\/(\d{2})\/(\d{4})$/); // captura MM e AAAA
                if (m) {
                    const mes = m[1];
                    const ano = m[2];
                    const mesKey = `${ano}-${mes}`; // AAAA-MM
                    if (this._summaryCache && this._summaryCache[mesKey]) {
                        console.log('[SheetsService] limpando cache de resumo financeiro para', mesKey, 'após novo lançamento');
                    }
                    this.clearFinancialSummaryCache(mesKey);
                }
            }

            return data;
        } catch (error) {
            console.error('Erro ao adicionar entrada na planilha:', error);
            throw error;
        }
    }

    /**
     * Obtém informações da planilha atual do usuário
     * @returns {Promise<Object>}
     */
    async getCurrentSheetInfo() {
        if (!this.pb) {
            throw new Error('Serviço Sheets não inicializado');
        }

        try {
            const response = await fetch(`${this.pb.baseUrl}/get-current-sheet`, {
                method: 'GET',
                headers: {
                    'Authorization': this.pb.authStore.token,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao obter informações da planilha');
            }

            return data;
        } catch (error) {
            console.error('Erro ao obter informações da planilha atual:', error);
            throw error;
        }
    }

    /**
     * Limpa o conteúdo da planilha atual
     * @returns {Promise<Object>}
     */
    async clearSheetContent() {
        if (!this.pb) {
            throw new Error('Serviço Sheets não inicializado');
        }

        try {
            const response = await fetch(`${this.pb.baseUrl}/clear-sheet-content`, {
                method: 'POST',
                headers: {
                    'Authorization': this.pb.authStore.token,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao limpar conteúdo da planilha');
            }

            return data;
        } catch (error) {
            console.error('Erro ao limpar conteúdo da planilha:', error);
            throw error;
        }
    }

    /**
     * Desvincula a planilha do usuário, limpando o sheet_id no PocketBase.
     * @returns {Promise<Object>}
     */
    async deleteSheetConfig() {
        if (!this.pb) {
            throw new Error('Serviço Sheets não inicializado');
        }

        try {
            // Este endpoint deve ser criado no backend (PocketBase hook)
            // para limpar os campos sheet_id e sheet_name do registro do usuário.
            const response = await fetch(`${this.pb.baseUrl}/delete-sheet-config`, {
                method: 'POST', // ou 'DELETE'
                headers: {
                    'Authorization': this.pb.authStore.token,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao desvincular a planilha');
            }

            return data;
        } catch (error) {
            console.error('Erro ao desvincular a planilha:', error);
            throw error;
        }
    }

    /**
     * Formata dados para exibição em listas
     * @param {Array} sheets - Array de planilhas
     * @returns {Array}
     */
    formatSheetsForDisplay(sheets) {
        if (!Array.isArray(sheets)) {
            return [];
        }

        return sheets.map(sheet => ({
            id: sheet.id,
            name: this.escapeHtml(sheet.name),
            createdTime: sheet.createdTime,
            modifiedTime: sheet.modifiedTime,
            formattedModifiedDate: this.formatDate(sheet.modifiedTime)
        }));
    }

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text 
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Formata data para exibição em português
     * @param {string} dateString 
     * @returns {string}
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }

    /**
     * Obtém a lista de categorias da planilha do usuário
     * @returns {Promise<Array<string>>} - Lista de categorias
     */
    async getCategories() {
        if (!this.pb) {
            throw new Error('Serviço Sheets não inicializado');
        }

        try {
            const response = await fetch(`${this.pb.baseUrl}/get-sheet-categories`, {
                method: 'GET',
                headers: {
                    'Authorization': this.pb.authStore.token,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao obter categorias');
            }

            return data.categories || [];
        } catch (error) {
            console.error('Erro ao obter categorias da planilha:', error);
            // Em caso de erro, retorna array vazio para não quebrar a aplicação
            return [];
        }
    }

    /**
     * Obtém resumo financeiro da planilha do usuário
     * @returns {Promise<Object>} - Dados de receitas, despesas, saldo e variações
     */
    async getFinancialSummary(mesBase, options = {}) {
        if (!this.pb) {
            throw new Error('Serviço Sheets não inicializado');
        }

        try {
            // Mês atual em UTC no formato AAAA-MM (compatível com backend)
            const now = new Date();
            const mesAtualPadrao = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
            const mesParam = mesBase || mesAtualPadrao;
            const force = options.force === true;

            // Retorna cache se disponível e não for force
            if (!force && this._summaryCache[mesParam]) {
                console.log('[SheetsService] cache hit resumo financeiro para', mesParam);
                return this._summaryCache[mesParam].data;
            }

            // Se já existe fetch em andamento para este mês, aguarda
            if (!force && this._summaryInflight[mesParam]) {
                console.log('[SheetsService] aguardando requisição em andamento para', mesParam);
                return await this._summaryInflight[mesParam];
            }

            const url = `${this.pb.baseUrl}/get-financial-summary?orcamento=${encodeURIComponent(mesParam)}`;
            console.log('[SheetsService] fetch resumo financeiro ->', url, 'force =', force);
            const fetchPromise = fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.pb.authStore.token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(async (response) => {
                console.log('[SheetsService] status resposta resumo', response.status);
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Erro ao obter resumo financeiro');
                }
                // Armazena em cache
                this._summaryCache[mesParam] = { data, ts: Date.now() };
                return data;
            })
            .finally(() => {
                delete this._summaryInflight[mesParam];
            });

            // Guarda promisse em andamento
            this._summaryInflight[mesParam] = fetchPromise;
            return await fetchPromise;
        } catch (error) {
            console.error('Erro ao obter resumo financeiro da planilha:', error);
            throw error;
        }
    }

    /**
     * Obtém meses únicos disponíveis na planilha do usuário
     * @returns {Promise<Object>} - Lista de meses disponíveis para seleção
     */
    async getAvailableMonths() {
        if (!this.pb) {
            throw new Error('Serviço Sheets não inicializado');
        }

        try {
            const response = await fetch(`${this.pb.baseUrl}/get-available-months`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.pb.authStore.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao obter meses disponíveis');
            }

            return data;
        } catch (error) {
            console.error('Erro ao obter meses disponíveis:', error);
            throw error;
        }
    }

    /**
     * Limpa o cache do resumo financeiro (todo ou mês específico)
     * @param {string} mesBase opcional (AAAA-MM) para limpar apenas um mês
     */
    clearFinancialSummaryCache(mesBase) {
        if (mesBase) {
            delete this._summaryCache[mesBase];
        } else {
            this._summaryCache = {};
        }
    }

    /**
     * Obtém as últimas entradas da planilha
     * @param {number} limit - Número máximo de entradas a retornar (padrão: 50)
     * @returns {Promise<Object>} - Lista de entradas da planilha
     */
    async getSheetEntries(limit = 50) {
        if (!this.pb) {
            throw new Error('Serviço Sheets não inicializado');
        }

        try {
            const url = `${this.pb.baseUrl}/get-sheet-entries?limit=${limit}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': this.pb.authStore.token,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar entradas da planilha');
            }

            return data;
        } catch (error) {
            console.error('Erro ao carregar entradas da planilha:', error);
            throw error;
        }
    }

    /**
     * Edita uma entrada específica na planilha
     * @param {Object} entryData - Dados da entrada para edição
     * @returns {Promise<Object>} - Resultado da operação
     */
    async editSheetEntry(entryData) {
        if (!this.pb) {
            throw new Error('Serviço Sheets não inicializado');
        }

        try {
            const response = await fetch(`${this.pb.baseUrl}/edit-sheet-entry`, {
                method: 'PUT',
                headers: {
                    'Authorization': this.pb.authStore.token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entryData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao editar entrada na planilha');
            }

            // Limpa cache para forçar atualização
            this.clearFinancialSummaryCache();

            return data;
        } catch (error) {
            console.error('Erro ao editar entrada na planilha:', error);
            throw error;
        }
    }

    /**
     * Remove uma entrada específica da planilha
     * @param {number} rowIndex - Índice da linha a ser removida
     * @returns {Promise<Object>} - Resultado da operação
     */
    async deleteSheetEntry(rowIndex) {
        if (!this.pb) {
            throw new Error('Serviço Sheets não inicializado');
        }

        try {
            const response = await fetch(`${this.pb.baseUrl}/delete-sheet-entry`, {
                method: 'DELETE',
                headers: {
                    'Authorization': this.pb.authStore.token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rowIndex })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao remover entrada da planilha');
            }

            // Limpa cache para forçar atualização
            this.clearFinancialSummaryCache();

            return data;
        } catch (error) {
            console.error('Erro ao remover entrada da planilha:', error);
            throw error;
        }
    }
}

// Exportar instância singleton
const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;