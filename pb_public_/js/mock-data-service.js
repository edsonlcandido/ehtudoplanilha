/**
 * Serviço de dados mockados para desenvolvimento
 * 
 * Fornece dados locais baseados nos arquivos de resposta JSON quando:
 * - Estiver em modo de desenvolvimento
 * - Backend estiver indisponível
 * - Usuário estiver testando localmente
 * 
 * IMPORTANTE: Este serviço carrega dados dos arquivos:
 * - sheetEntriesResponse.json (lançamentos)
 * - getSheetCategoriesResponse.json (categorias)
 * 
 * Benefícios:
 * - Desenvolvimento offline
 * - Testes sem precisar de dados reais
 * - Autocomplete funcional desde o início
 * - Dados consistentes para desenvolvimento
 */

class MockDataService {
    constructor() {
        this.mockEntries = null;
        this.mockCategories = null;
        this.isDevMode = false;
        this.dataLoaded = false;
        
        // Detecta modo de desenvolvimento
        this.detectDevMode();
    }

    /**
     * Detecta se está em modo de desenvolvimento
     */
    detectDevMode() {
        // Verifica se está usando testLogin
        const testLogin = sessionStorage.getItem('testLogin') === 'true';
        
        // Verifica se está em localhost
        const isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
        
        this.isDevMode = testLogin || isLocalhost;
        
        if (this.isDevMode) {
            console.log('[MockDataService] 🔧 Modo de desenvolvimento ativado');
        }
    }

    /**
     * Carrega os dados mockados dos arquivos JSON
     */
    async loadMockData() {
        if (this.dataLoaded) {
            return;
        }

        try {
            console.log('[MockDataService] 📦 Carregando dados mockados...');

            // Carrega lançamentos
            const entriesResponse = await fetch('../dashboard/sheetEntriesResponse.json');
            const entriesData = await entriesResponse.json();
            this.mockEntries = entriesData.entries || [];
            
            // Carrega categorias
            const categoriesResponse = await fetch('../dashboard/getSheetCategoriesResponse.json');
            const categoriesData = await categoriesResponse.json();
            this.mockCategories = categoriesData.categories || [];

            this.dataLoaded = true;
            
            console.log(`[MockDataService] ✅ Dados carregados: ${this.mockEntries.length} lançamentos, ${this.mockCategories.length} categorias`);
        } catch (error) {
            console.error('[MockDataService] ❌ Erro ao carregar dados mockados:', error);
            // Fallback para arrays vazios
            this.mockEntries = [];
            this.mockCategories = [];
            this.dataLoaded = true;
        }
    }

    /**
     * Extrai contas únicas dos lançamentos mockados
     * @returns {Promise<Array<string>>} Lista de contas únicas
     */
    async getUniqueAccounts() {
        await this.loadMockData();

        if (!this.mockEntries || this.mockEntries.length === 0) {
            console.log('[MockDataService] ⚠️ Nenhum lançamento mockado disponível');
            return [];
        }

        // Extrai contas únicas (remove vazias e duplicadas)
        const accountsSet = new Set();
        
        this.mockEntries.forEach(entry => {
            if (entry.conta && entry.conta.trim() !== '') {
                accountsSet.add(entry.conta.trim());
            }
        });

        const uniqueAccounts = Array.from(accountsSet).sort();
        
        console.log(`[MockDataService] 💳 ${uniqueAccounts.length} contas únicas extraídas:`, uniqueAccounts);
        
        return uniqueAccounts;
    }

    /**
     * Retorna as categorias mockadas
     * @returns {Promise<Array<string>>} Lista de categorias
     */
    async getCategories() {
        await this.loadMockData();

        if (!this.mockCategories || this.mockCategories.length === 0) {
            console.log('[MockDataService] ⚠️ Nenhuma categoria mockada disponível');
            return [];
        }

        console.log(`[MockDataService] 🏷️ ${this.mockCategories.length} categorias disponíveis`);
        
        return [...this.mockCategories];
    }

    /**
     * Retorna todos os lançamentos mockados
     * @returns {Promise<Array<Object>>} Lista de lançamentos
     */
    async getEntries() {
        await this.loadMockData();
        
        console.log(`[MockDataService] 📋 ${this.mockEntries.length} lançamentos disponíveis`);
        
        return [...this.mockEntries];
    }

    /**
     * Verifica se deve usar dados mockados
     * @returns {boolean}
     */
    shouldUseMockData() {
        return this.isDevMode;
    }

    /**
     * Extrai descrições únicas dos lançamentos (útil para autocomplete)
     * @returns {Promise<Array<string>>} Lista de descrições únicas
     */
    async getUniqueDescriptions() {
        await this.loadMockData();

        const descriptionsSet = new Set();
        
        this.mockEntries.forEach(entry => {
            if (entry.descricao && entry.descricao.trim() !== '') {
                descriptionsSet.add(entry.descricao.trim());
            }
        });

        const uniqueDescriptions = Array.from(descriptionsSet).sort();
        
        console.log(`[MockDataService] 📝 ${uniqueDescriptions.length} descrições únicas extraídas`);
        
        return uniqueDescriptions;
    }

    /**
     * Extrai valores únicos de observações (útil para sugestões)
     * @returns {Promise<Array<string>>} Lista de observações únicas
     */
    async getUniqueObservations() {
        await this.loadMockData();

        const observationsSet = new Set();
        
        this.mockEntries.forEach(entry => {
            if (entry.obs && entry.obs.trim() !== '') {
                observationsSet.add(entry.obs.trim());
            }
        });

        const uniqueObservations = Array.from(observationsSet).sort();
        
        console.log(`[MockDataService] 💬 ${uniqueObservations.length} observações únicas extraídas`);
        
        return uniqueObservations;
    }

    /**
     * Retorna estatísticas sobre os dados mockados
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        await this.loadMockData();

        const accounts = await this.getUniqueAccounts();
        const categories = await this.getCategories();
        const descriptions = await this.getUniqueDescriptions();

        return {
            totalEntries: this.mockEntries.length,
            totalAccounts: accounts.length,
            totalCategories: categories.length,
            totalDescriptions: descriptions.length,
            isDevMode: this.isDevMode,
            dataLoaded: this.dataLoaded
        };
    }

    /**
     * Limpa o cache de dados (força recarregamento)
     */
    clearCache() {
        this.mockEntries = null;
        this.mockCategories = null;
        this.dataLoaded = false;
        console.log('[MockDataService] 🗑️ Cache limpo');
    }
}

// Exporta instância singleton
const mockDataService = new MockDataService();
export default mockDataService;
