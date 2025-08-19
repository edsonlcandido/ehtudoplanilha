/**
 * Serviço centralizado para gerenciamento de categorias
 * Responsável por buscar categorias da planilha e fornecer fallbacks consistentes
 */

class CategoriesService {
    constructor() {
        this.defaultCategories = [
            'Alimentação', 'Transporte', 'Moradia', 'Saúde',
            'Educação', 'Lazer', 'Vestuário', 'Outras'
        ];
        this.cache = null;
        this.cacheTimestamp = null;
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
    }

    /**
     * Obtém categorias da planilha ou retorna categorias padrão
     * @param {boolean} forceRefresh - Força busca da planilha ignorando cache
     * @returns {Promise<Array<string>>} Lista de categorias
     */
    async getCategories(forceRefresh = false) {
        // Retorna cache se válido e não forçando refresh
        if (!forceRefresh && this.cache && this.cacheTimestamp && 
            (Date.now() - this.cacheTimestamp) < this.cacheExpiry) {
            console.log('[CategoriesService] Retornando categorias do cache');
            return this.cache;
        }

        try {
            // Tenta buscar categorias da planilha
            if (window.googleSheetsService && typeof window.googleSheetsService.getCategories === 'function') {
                console.log('[CategoriesService] Buscando categorias da planilha...');
                const categorias = await window.googleSheetsService.getCategories();
                
                // Usa categorias da planilha se disponíveis, senão usa padrão
                const lista = (categorias && categorias.length > 0) ? categorias : this.defaultCategories;
                
                // Atualiza cache
                this.cache = lista;
                this.cacheTimestamp = Date.now();
                
                console.log('[CategoriesService] Categorias carregadas:', lista);
                return lista;
            } else {
                console.log('[CategoriesService] Google Sheets Service não disponível, usando categorias padrão');
                return this.defaultCategories;
            }
        } catch (error) {
            console.error('[CategoriesService] Erro ao carregar categorias da planilha:', error);
            // Em caso de erro, retorna categorias padrão
            return this.defaultCategories;
        }
    }

    /**
     * Popula um elemento datalist com as categorias
     * @param {string} datalistId - ID do elemento datalist
     * @param {boolean} forceRefresh - Força busca da planilha
     * @returns {Promise<void>}
     */
    async populateDatalist(datalistId, forceRefresh = false) {
        const datalist = document.getElementById(datalistId);
        if (!datalist) {
            console.warn(`[CategoriesService] Datalist com ID '${datalistId}' não encontrado`);
            return;
        }

        try {
            // Busca categorias
            const categorias = await this.getCategories(forceRefresh);
            
            // Limpa opções existentes
            datalist.innerHTML = '';
            
            // Popula datalist
            categorias.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                datalist.appendChild(opt);
            });
            
            console.log(`[CategoriesService] Datalist '${datalistId}' populado com ${categorias.length} categorias`);
        } catch (error) {
            console.error(`[CategoriesService] Erro ao popular datalist '${datalistId}':`, error);
            // Em caso de erro, popula com categorias padrão
            datalist.innerHTML = '';
            this.defaultCategories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                datalist.appendChild(opt);
            });
        }
    }

    /**
     * Limpa o cache de categorias
     */
    clearCache() {
        this.cache = null;
        this.cacheTimestamp = null;
        console.log('[CategoriesService] Cache de categorias limpo');
    }

    /**
     * Retorna as categorias padrão
     * @returns {Array<string>}
     */
    getDefaultCategories() {
        return [...this.defaultCategories];
    }
}

// Exportar instância singleton
const categoriesService = new CategoriesService();

// Disponibilizar globalmente para compatibilidade
if (typeof window !== 'undefined') {
    window.categoriesService = categoriesService;
}

export default categoriesService;