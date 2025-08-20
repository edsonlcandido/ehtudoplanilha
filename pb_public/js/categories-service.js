/**
 * Serviço centralizado para gerenciamento de categorias
 * 
 * FONTE PRIMÁRIA: Aba "Categorias" da planilha Google Sheets do usuário
 * FALLBACK: Categorias padrão (apenas quando planilha indisponível/vazia/erro)
 * 
 * Responsabilidades:
 * - Buscar categorias da aba "Categorias" da planilha
 * - Fornecer fallbacks consistentes quando necessário
 * - Gerenciar cache para otimizar performance
 * - Padronizar comportamento entre formulários
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
     * Obtém categorias da aba "Categorias" da planilha do usuário
     * Usa categorias padrão apenas como fallback em caso de erro ou planilha vazia
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
            // PRIORIDADE 1: Buscar categorias da aba "Categorias" da planilha
            if (window.googleSheetsService && typeof window.googleSheetsService.getCategories === 'function') {
                console.log('[CategoriesService] Buscando categorias da aba "Categorias" da planilha...');
                const categoriasFromSheet = await window.googleSheetsService.getCategories();
                
                // Se a planilha retornou categorias, usa elas (mesmo que seja um array vazio)
                if (Array.isArray(categoriasFromSheet)) {
                    let lista;
                    
                    if (categoriasFromSheet.length > 0) {
                        // Planilha tem categorias - usa elas
                        lista = categoriasFromSheet;
                        console.log('[CategoriesService] Usando categorias da planilha:', lista);
                    } else {
                        // Planilha existe mas não tem categorias - usa padrão como fallback
                        lista = this.defaultCategories;
                        console.log('[CategoriesService] Planilha sem categorias, usando categorias padrão como fallback:', lista);
                    }
                    
                    // Atualiza cache
                    this.cache = lista;
                    this.cacheTimestamp = Date.now();
                    
                    return lista;
                }
            }
            
            // PRIORIDADE 2: Google Sheets Service não disponível - usar categorias padrão
            console.log('[CategoriesService] Google Sheets Service não disponível, usando categorias padrão');
            return this.defaultCategories;
            
        } catch (error) {
            console.error('[CategoriesService] Erro ao carregar categorias da planilha:', error);
            // PRIORIDADE 3: Erro - usar categorias padrão como fallback
            console.log('[CategoriesService] Usando categorias padrão devido ao erro');
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