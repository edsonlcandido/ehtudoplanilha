/**
 * Serviço para interação com Google Sheets API
 * Responsável por operações de planilhas e gerenciamento
 */

class GoogleSheetsService {
    constructor() {
        this.pb = null;
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
    async getFinancialSummary() {
        if (!this.pb) {
            throw new Error('Serviço Sheets não inicializado');
        }

        try {
            console.log('Fazendo requisição para get-financial-summary...');
            const response = await fetch(`${this.pb.baseUrl}/get-financial-summary`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.pb.authStore.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Status da resposta:', response.status);
            const data = await response.json();
            console.log('Dados retornados da API:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao obter resumo financeiro');
            }

            return data;
        } catch (error) {
            console.error('Erro ao obter resumo financeiro da planilha:', error);
            throw error;
        }
    }
}

// Exportar instância singleton
const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;