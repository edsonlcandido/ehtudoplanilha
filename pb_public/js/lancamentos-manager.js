/**
 * Módulo para gerenciar a página de lançamentos
 * Responsável por exibir, editar e deletar entradas da planilha
 */

import googleSheetsService from './google/sheets-api.js';
import { parseBudgetStr, formatBudgetDateForBackend, isoFromDate, backendBudgetFromISO } from './utils/budget-date.js';

class LancamentosManager {
    constructor() {
        this.entries = [];
        this.filteredEntries = [];
    this.originalEntries = []; // preserva ordem original da planilha (rowIndex)
        this.searchTerm = '';
        this.isLoading = false;
        this.currentEditingEntry = null;
        this.currentSplittingEntry = null;
        this.isMobile = window.innerWidth <= 768;
        this.pendingDeleteRowIndex = null;
        this._initialLoadDone = false; // controla primeira carga para mensagens
        
    // Configurações de ordenação
    this.sortBy = 'original'; // default agora é a ordem natural da planilha
    this.hideBlankDates = true; // padrão: ocultar linhas sem data
        
        // Detectar mudanças de tamanho da tela
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
            this.renderEntries();
        });
    }

    /**
     * Verifica se a linha está totalmente em branco (todas as colunas vazias)
     */
    isBlankEntry(entry) {
        if (!entry) return true;
        const campos = ['data','conta','valor','descricao','categoria','orcamento','obs'];
        return campos.every(c => {
            const v = entry[c];
            if (v === null || v === undefined) return true;
            if (typeof v === 'number') {
                // Se tem número (valor ou serial de data) não é em branco
                return false;
            }
            return String(v).trim() === '';
        });
    }

    /**
     * Inicializa o gerenciador de lançamentos
     */
    async init() {
        // Garante inicialização do serviço Google Sheets com a instância global do PocketBase
        if (window.pb && !googleSheetsService.pb) {
            try {
                googleSheetsService.init(window.pb);
            } catch (e) {
                console.error('Falha ao inicializar serviço Google Sheets:', e);
            }
        }
        // Ajusta select visual para refletir default 'original'
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.value = this.sortBy;
        }
        const hideBlankDatesCheck = document.getElementById('hideBlankDatesCheck');
        if (hideBlankDatesCheck) {
            hideBlankDatesCheck.checked = this.hideBlankDates;
        }
        this.setupEventListeners();
        await this.loadEntries();
    }

    /**
     * Configura os event listeners
     */
    setupEventListeners() {
        // Botão de atualizar
        const refreshBtn = document.getElementById('refreshEntriesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadEntries());
        }

        // Botão de adicionar novo lançamento
        const addBtn = document.getElementById('addEntryBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddModal());
        }

        // Campo de pesquisa
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Botão de limpar pesquisa
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => this.clearSearch());
        }

        // Controles de ordenação
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            console.log('LancamentosManager: sortSelect encontrado, adicionando listener');
            sortSelect.addEventListener('change', (e) => this.handleSortChange(e.target.value));
        } else {
            console.warn('LancamentosManager: sortSelect NÃO encontrado!');
        }

        const hideBlankDatesCheck = document.getElementById('hideBlankDatesCheck');
        if (hideBlankDatesCheck) {
            console.log('LancamentosManager: hideBlankDatesCheck encontrado, adicionando listener');
            hideBlankDatesCheck.addEventListener('change', (e) => this.handleHideBlankDatesChange(e.target.checked));
        } else {
            console.warn('LancamentosManager: hideBlankDatesCheck NÃO encontrado!');
        }
    }

    /**
     * Carrega as entradas da planilha
     */
    async loadEntries() {
        if (this.isLoading) return;

    this.isLoading = true;
    // Limpa entradas atuais imediatamente para que o usuário veja o estado de recarregamento (skeleton)
    this.entries = [];
    this.renderEntries();
    this.showLoading();

        try {
            // Usar endpoint dedicado para lançamentos
            const response = await this.fetchSheetEntries(100);

            const rawEntries = response.entries || [];
            // Filtra fora linhas totalmente em branco (todas as colunas vazias)
            const cleaned = rawEntries.filter(e => !this.isBlankEntry(e));
            // Normaliza as entradas locais (não persiste mudanças na planilha)
            this.originalEntries = cleaned.map(e => this.normalizeEntry({ ...e }));
            this.entries = [...this.originalEntries];

            this.applySortingAndFilters(); // Aplica ordenação e filtros
            if (this._initialLoadDone) {
                this.showMessage('Lançamentos carregados com sucesso', 'success');
            }
        } catch (error) {
            console.error('Erro ao carregar lançamentos:', error);
            this.showMessage('Erro ao carregar lançamentos: ' + error.message, 'error');
            this.entries = [];
            this.filteredEntries = [];
            this.renderEntries();
        } finally {
            this.isLoading = false;
            this.hideLoading();
            if (!this._initialLoadDone) this._initialLoadDone = true;
        }
    }

    /**
     * Busca entradas diretamente do endpoint dedicado
     */
    async fetchSheetEntries(limit = 100) {
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
     * Manipula a mudança de tipo de ordenação
     */
    handleSortChange(sortType) {
        console.log('LancamentosManager: Mudando ordenação para:', sortType);
        this.sortBy = sortType;
        this.applySortingAndFilters();

    }

    /**
     * Manipula a mudança do checkbox de ocultar datas em branco
     */
    handleHideBlankDatesChange(hideBlank) {
        console.log('LancamentosManager: Ocultar datas em branco:', hideBlank);
        this.hideBlankDates = hideBlank;
        this.applySortingAndFilters();
    }

    /**
     * Aplica ordenação e filtros aos lançamentos
     */

    applySortingAndFilters() {
        console.log('LancamentosManager: Aplicando ordenação e filtros - sortBy:', this.sortBy, 'hideBlankDates:', this.hideBlankDates);

        // Garantir que temos cópias normalizadas para ordenar sem alterar o payload original
        if (Array.isArray(this.originalEntries) && this.originalEntries.length) {
            this.originalEntries = this.originalEntries.map(e => this.normalizeEntry(e));
        }

        // Base depende do modo: se 'original', usa cópia preservada
        const baseEntries = this.sortBy === 'original' ? [...this.originalEntries] : [...this.entries].map(e => this.normalizeEntry(e));

        // Conjunto que será exibido (pode aplicar filtro de datas em branco)
        let viewEntries = [...baseEntries];

        if (this.hideBlankDates) {
            viewEntries = viewEntries.filter(entry => {
                // Considera "data em branco" quando null, undefined, string vazia ou só espaços
                if (entry.data === null || entry.data === undefined) return false;
                if (typeof entry.data === 'string') {
                    const trimmed = entry.data.trim();
                    if (trimmed === '') return false;
                }
                // Se número (serial Excel) mantém
                return true;
            });
        }

    // Ordena conjunto de exibição conforme modo; se original, mantém ordem natural de rowIndex
    viewEntries = this.sortEntries(viewEntries.map(e => this.normalizeEntry(e)));

        // Mantém this.entries sincronizado (ordenado exceto no modo original)
        if (this.sortBy === 'original') {
            this.entries = [...this.originalEntries];
        } else {
            this.entries = this.sortEntries([...this.originalEntries].map(e => this.normalizeEntry(e)));
        }

        // Aplica filtro de pesquisa sobre o conjunto de exibição já ordenado
        if (this.searchTerm) {
            this.filteredEntries = viewEntries.filter(entry => {
                const searchFields = [
                    this.formatDate(entry.data),
                    this.formatCurrency(entry.valor),
                    entry.descricao || '',
                    entry.categoria || '',
                    entry.conta || '',
                    entry.obs || ''
                ];
                return searchFields.some(field => field.toString().toLowerCase().includes(this.searchTerm));
            });
        } else {
            this.filteredEntries = viewEntries;
        }

        // Render sempre baseado em filteredEntries (já contém o estado final de exibição)
        this.renderEntries();
        this.updateSearchUI();
    }

    /**
     * Ordena as entradas baseado no tipo de ordenação selecionado
     */
    sortEntries(entries) {
        return entries.sort((a, b) => {
            if (this.sortBy === 'original') {
                // Inverte: mostra linhas mais recentes (maior rowIndex) primeiro
                return (b.rowIndex || 0) - (a.rowIndex || 0);
            }
            // Coloca sem data no topo quando ordenando por critérios derivados
            const hasDateA = !!(a._dateObj || a.data);
            const hasDateB = !!(b._dateObj || b.data);
            if (hasDateA !== hasDateB) {
                return hasDateA ? 1 : -1; // sem data (false) vem antes
            }
            if (this.sortBy === 'budget_date') {
                // Primeiro ordena por orçamento, depois por data (mais recente primeiro)
                const budgetA = (typeof a._orcamentoKey !== 'undefined') ? a._orcamentoKey : this.getBudgetSortValue(a.orcamento);
                const budgetB = (typeof b._orcamentoKey !== 'undefined') ? b._orcamentoKey : this.getBudgetSortValue(b.orcamento);

                if (budgetA !== budgetB) {
                    return budgetB - budgetA; // Orçamento mais recente primeiro
                }

                // Se orçamentos são iguais, ordena por data (mais recente primeiro)
                const dateA = a._dateObj ? a._dateObj.getTime() : this.getDateSortValue(a.data);
                const dateB = b._dateObj ? b._dateObj.getTime() : this.getDateSortValue(b.data);
                return dateB - dateA;
            } else if (this.sortBy === 'date') {
                // Apenas ordena por data (mais recente primeiro)
                const dateA = a._dateObj ? a._dateObj.getTime() : this.getDateSortValue(a.data);
                const dateB = b._dateObj ? b._dateObj.getTime() : this.getDateSortValue(b.data);
                return dateB - dateA;
            }
            
            return 0;
        });
    }

    /**
     * Converte orçamento para valor numérico para ordenação
     */
    getBudgetSortValue(orcamento) {
        if (!orcamento) return 0;
        
        try {
            // Converte "setembro/25" para número (ano*12 + mês)
            const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
            const [mesNome, anoCurto] = orcamento.split('/');
            const mesIndex = meses.indexOf(mesNome.toLowerCase());
            
            if (mesIndex === -1) return 0;
            
            const ano = parseInt('20' + anoCurto);
            return ano * 12 + mesIndex;
        } catch (e) {
            return 0;
        }
    }

    /**
     * Converte data para valor numérico para ordenação
     */
    getDateSortValue(data) {
        if (!data) return 0;
        
        try {
            // Tenta converter a data para timestamp
            let date;
            if (typeof data === 'number') {
                // Serial Excel
                const excelEpoch = new Date(1899, 11, 30);
                date = new Date(excelEpoch.getTime() + data * 24 * 60 * 60 * 1000);
            } else if (typeof data === 'string') {
                // Formato dd/MM/yyyy HH:mm ou similar
                if (/\d{2}\/\d{2}\/\d{4}/.test(data)) {
                    const [parteData, parteHora='00:00'] = data.split(' ');
                    const [dia, mes, ano] = parteData.split('/').map(Number);
                    const [hora, minuto='00'] = (parteHora || '00:00').split(':').map(Number);
                    date = new Date(ano, mes - 1, dia, hora, minuto);
                } else {
                    date = new Date(data);
                }
            } else {
                date = new Date(data);
            }
            
            return isNaN(date.getTime()) ? 0 : date.getTime();
        } catch (e) {
            return 0;
        }
    }

    /**
     * Manipula a pesquisa/filtro de lançamentos
     */
    handleSearch(searchTerm) {
        this.searchTerm = searchTerm.trim().toLowerCase();
        this.applySortingAndFilters();
        this.updateSearchUI();
    }

    /**
     * Atualiza a interface da pesquisa
     */
    updateSearchUI() {
        const searchContainer = document.querySelector('.search-container');
        const clearBtn = document.getElementById('clearSearchBtn');
        const searchResults = document.getElementById('searchResults');
        const searchCount = document.getElementById('searchCount');

        // Mostra/esconde botão de limpar
        if (clearBtn) {
            clearBtn.style.display = this.searchTerm ? 'flex' : 'none';
        }

        // Atualiza classe do container de pesquisa
        if (searchContainer) {
            if (this.searchTerm) {
                searchContainer.classList.add('searching');
            } else {
                searchContainer.classList.remove('searching');
            }
        }

        // Atualiza contagem de resultados
        if (searchResults && searchCount) {
            if (this.searchTerm) {
                const count = this.filteredEntries.length;
                const total = this.entries.length;
                
                if (count === 0) {
                    searchCount.textContent = 'Nenhum lançamento encontrado';
                    searchResults.className = 'search-results no-results';
                } else if (count === total) {
                    searchCount.textContent = `Exibindo todos os ${total} lançamentos`;
                    searchResults.className = 'search-results has-results';
                } else {
                    searchCount.textContent = `${count} de ${total} lançamentos encontrados`;
                    searchResults.className = 'search-results has-results';
                }
                
                searchResults.style.display = 'block';
            } else {
                searchResults.style.display = 'none';
            }
        }
    }

    /**
     * Limpa a pesquisa
     */
    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        this.searchTerm = '';
        this.applySortingAndFilters();
        this.updateSearchUI();
        
        // Foca novamente no campo de pesquisa
        if (searchInput) {
            searchInput.focus();
        }
    }

    /**
     * Renderiza as entradas na interface
     */
    renderEntries() {
        const container = document.getElementById('entriesContainer');
        if (!container) return;
    // Sempre usa filteredEntries (já inclui ordenação e filtros de datas em branco)
    const entriesToRender = this.filteredEntries;

        if (entriesToRender.length === 0 && !this.isLoading) {
            const message = this.searchTerm 
                ? `Nenhum lançamento encontrado para "${this.searchTerm}"`
                : 'Nenhum lançamento encontrado na planilha.';
            
            const actionButton = this.searchTerm 
                ? `<button class="button" onclick="lancamentosManager.clearSearch()">Limpar pesquisa</button>`
                : `<button class="button primary" onclick="window.location.href='index.html'">Ir para Dashboard</button>`;

            container.innerHTML = `
                <div class="text-center" style="padding: 2rem;">
                    <p style="color: #666;">${message}</p>
                    ${actionButton}
                </div>
            `;
            return;
        }

        // Sempre mostrar a estrutura da tabela/cards mesmo durante loading
        if (this.isMobile) {
            this.renderMobileCards(container, entriesToRender);
        } else {
            this.renderDesktopTable(container, entriesToRender);
        }
    }

    /**
     * Renderiza cards para mobile
     */
    renderMobileCards(container, entries = null) {
        const entriesToRender = entries || this.entries;
        
        // Se está carregando e não tem entradas, mostra skeleton
        if (this.isLoading && entriesToRender.length === 0) {
            const skeletonHtml = Array(3).fill(0).map(() => `
                <div class="entry-card skeleton">
                    <div class="entry-card-header">
                        <div class="skeleton-text skeleton-date"></div>
                        <div class="skeleton-text skeleton-value"></div>
                    </div>
                    <div class="entry-card-body">
                        <div class="skeleton-text skeleton-description"></div>
                        <div class="skeleton-text skeleton-details"></div>
                    </div>
                    <div class="entry-card-actions">
                        <div class="skeleton-button"></div>
                        <div class="skeleton-button"></div>
                    </div>
                </div>
            `).join('');

            container.innerHTML = `
                <div class="entries-mobile">
                    ${skeletonHtml}
                </div>
            `;
            return;
        }

        const cardsHtml = entriesToRender.map(entry => `
            <div class="entry-card" data-row="${entry.rowIndex}">
                <div class="entry-card-header">
                    <span class="entry-date">${this.formatDate(entry.data)}</span>
                    <span class="entry-value ${entry.valor >= 0 ? 'positive' : 'negative'}">
                        ${this.formatCurrency(entry.valor)}
                    </span>
                </div>
                <div class="entry-card-body">
                    <div class="entry-description">${this.escapeHtml(entry.descricao)}</div>
                    <div class="entry-details">
                        <span class="entry-account">${this.escapeHtml(entry.conta)}</span>
                        ${entry.categoria ? `<span class="entry-category">${this.escapeHtml(entry.categoria)}</span>` : ''}
                    </div>
                    ${entry.obs ? `<div class="entry-obs">${this.escapeHtml(entry.obs)}</div>` : ''}
                </div>
                <div class="entry-card-actions">
                    <button class="button small" onclick="lancamentosManager.editEntry(${entry.rowIndex})" title="Editar">
                        ✏️
                    </button>
                    <button class="button small" onclick="lancamentosManager.splitEntry(${entry.rowIndex})" title="Dividir em parcelas">
                        📊
                    </button>
                    <button class="button danger small" onclick="lancamentosManager.deleteEntry(${entry.rowIndex})" title="Excluir">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="entries-mobile">
                ${cardsHtml}
            </div>
        `;
    }

    /**
     * Renderiza tabela para desktop
     */
    renderDesktopTable(container, entries = null) {
        const entriesToRender = entries || this.entries;
        
        // Se está carregando e não tem entradas, mostra skeleton
        if (this.isLoading && entriesToRender.length === 0) {
            const skeletonRows = Array(5).fill(0).map(() => `
                <tr class="skeleton-row">
                    <td><div class="skeleton-text"></div></td>
                    <td><div class="skeleton-text"></div></td>
                    <td><div class="skeleton-text"></div></td>
                    <td><div class="skeleton-text"></div></td>
                    <td><div class="skeleton-text"></div></td>
                    <td><div class="skeleton-text"></div></td>
                    <td class="actions">
                        <div class="skeleton-button"></div>
                        <div class="skeleton-button"></div>
                    </td>
                </tr>
            `).join('');

            container.innerHTML = `
                <div class="table-responsive">
                    <table class="entries-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Conta</th>
                                <th>Descrição</th>
                                <th>Valor</th>
                                <th>Categoria</th>
                                <th>Observações</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${skeletonRows}
                        </tbody>
                    </table>
                </div>
            `;
            return;
        }

        const rowsHtml = entriesToRender.map(entry => `
            <tr data-row="${entry.rowIndex}">
                <td>${this.formatDate(entry.data)}</td>
                <td>${this.escapeHtml(entry.conta)}</td>
                <td>${this.escapeHtml(entry.descricao)}</td>
                <td class="${entry.valor >= 0 ? 'positive' : 'negative'}">
                    ${this.formatCurrency(entry.valor)}
                </td>
                <td>${this.escapeHtml(entry.categoria)}</td>
                <td title="${this.escapeHtml(entry.obs)}">
                    ${entry.obs ? this.escapeHtml(entry.obs.substring(0, 30)) + (entry.obs.length > 30 ? '...' : '') : ''}
                </td>
                <td class="actions">
                    <button class="button small" onclick="lancamentosManager.editEntry(${entry.rowIndex})" title="Editar">
                        ✏️
                    </button>
                    <button class="button small" onclick="lancamentosManager.splitEntry(${entry.rowIndex})" title="Dividir em parcelas">
                        📊
                    </button>
                    <button class="button danger small" onclick="lancamentosManager.deleteEntry(${entry.rowIndex})" title="Excluir">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="table-responsive">
                <table class="entries-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Conta</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                            <th>Categoria</th>
                            <th>Observações</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Abre modal para editar entrada
     */
    async editEntry(rowIndex) {
        // Procura nas entradas originais, não filtradas
        const entry = this.entries.find(e => e.rowIndex === rowIndex);
        if (!entry) {
            this.showMessage('Entrada não encontrada', 'error');
            return;
        }

        this.currentEditingEntry = entry;
        this.openEditModal(entry);
    }

    /**
     * Deleta uma entrada
     */
    async deleteEntry(rowIndex) {
        // Procura nas entradas originais, não filtradas
        const entry = this.entries.find(e => e.rowIndex === rowIndex);
        if (!entry) {
            this.showMessage('Entrada não encontrada', 'error');
            return;
        }
        this.openDeleteModal(entry);
    }

    /**
     * Abre modal de confirmação de exclusão
     */
    openDeleteModal(entry) {
        const modal = document.getElementById('deleteModal');
        if (!modal) return;
        this.pendingDeleteRowIndex = entry.rowIndex;
        const rowSpan = document.getElementById('deleteRowNumber');
        const descSpan = document.getElementById('deleteDescription');
    const dateSpan = document.getElementById('deleteDate');
    const valueSpan = document.getElementById('deleteValue');
        if (rowSpan) rowSpan.textContent = entry.rowIndex;
        if (descSpan) descSpan.textContent = entry.descricao || '(sem descrição)';
    if (dateSpan) dateSpan.textContent = this.formatDate(entry.data) || '-';
    if (valueSpan) valueSpan.textContent = this.formatCurrency(entry.valor || 0);
        const confirmBtn = document.getElementById('deleteConfirmBtn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Excluir';
        }
        modal.style.display = 'flex';
    }

    /**
     * Fecha modal de exclusão
     */
    closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        if (modal) modal.style.display = 'none';
        this.pendingDeleteRowIndex = null;
    }

    /**
     * Confirma exclusão (acionado pelo botão no modal)
     */
    async confirmDelete() {
        if (!this.pendingDeleteRowIndex) {
            this.closeDeleteModal();
            return;
        }
        const rowIndex = this.pendingDeleteRowIndex;
        const confirmBtn = document.getElementById('deleteConfirmBtn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Excluindo...';
        }

        // Remoção otimista
    const originalEntries = [...this.entries];
    const originalFiltered = [...this.filteredEntries];
    const originalOriginal = [...this.originalEntries];
    this.entries = this.entries.filter(e => e.rowIndex !== rowIndex);
    this.filteredEntries = this.filteredEntries.filter(e => e.rowIndex !== rowIndex);
    this.originalEntries = this.originalEntries.filter(e => e.rowIndex !== rowIndex);
        this.renderEntries();
        this.updateSearchUI();

        try {
            await googleSheetsService.deleteSheetEntry(rowIndex);
            this.showMessage('Lançamento excluído com sucesso', 'success');
            this.closeDeleteModal();
            await this.loadEntries();
        } catch (error) {
            console.error('Erro ao excluir lançamento:', error);
            this.entries = originalEntries;
            this.filteredEntries = originalFiltered;
            this.originalEntries = originalOriginal;
            this.renderEntries();
            this.updateSearchUI();
            this.showMessage('Erro ao excluir lançamento: ' + error.message, 'error');
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Excluir';
            }
        }
    }

    /**
     * Abre modal de edição
     */
    openEditModal(entry) {
        // Implementar modal de edição (será criado no HTML)
        const modal = document.getElementById('editModal');
        if (!modal) return;

        // Preencher campos do modal
        const dataInput = document.getElementById('editData');
        const contaInput = document.getElementById('editConta');
        const descInput = document.getElementById('editDescricao');
        const valorInput = document.getElementById('editValor');
        const signBtn = document.getElementById('editSignBtn');
        const signValue = document.getElementById('editSignValue');
        const catInput = document.getElementById('editCategoria');
        const orcDateInput = document.getElementById('editOrcamentoDate');
        const obsInput = document.getElementById('editObs');

        // Converter data existente para datetime-local se possível
        dataInput.value = this.toDateTimeLocal(entry.data);
        contaInput.value = entry.conta || '';
        descInput.value = entry.descricao || '';

        // Definir sinal e valor absoluto
        const valorNumerico = parseFloat(entry.valor) || 0;
        if (valorNumerico < 0) {
            signBtn.textContent = '-';
            signValue.value = '-';
            valorInput.value = Math.abs(valorNumerico).toFixed(2);
            signBtn.style.color = 'red';
        } else {
            signBtn.textContent = '+';
            signValue.value = '+';
            valorInput.value = Math.abs(valorNumerico).toFixed(2);
            signBtn.style.color = 'green';
        }

        // Categoria / Orçamento / Observações
        catInput.value = entry.categoria || '';
        
        // Converter orçamento para formato ISO date
        if (entry.orcamento) {
            try {
                // Se orçamento está em formato dd/MM/YYYY, converter para ISO
                if (typeof entry.orcamento === 'string' && entry.orcamento.includes('/')) {
                    const parts = entry.orcamento.split('/');
                    if (parts.length === 3) {
                        const [dia, mes, ano] = parts;
                        const isoDate = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                        orcDateInput.value = isoDate;
                    }
                } else {
                    // Tentar converter outros formatos
                    const budgetDate = parseBudgetStr(entry.orcamento);
                    orcDateInput.value = isoFromDate(budgetDate);
                }
            } catch (error) {
                console.warn('Erro ao converter orçamento para date input:', error);
                orcDateInput.value = '';
            }
        }
        
        obsInput.value = entry.obs || '';

        // Listener de toggle de sinal (somente adiciona uma vez)
        if (!signBtn.dataset.bound) {
            signBtn.addEventListener('click', () => {
                if (signValue.value === '-') {
                    signValue.value = '+';
                    signBtn.textContent = '+';
                    signBtn.style.color = 'green';
                } else {
                    signValue.value = '-';
                    signBtn.textContent = '-';
                    signBtn.style.color = 'red';
                }
            });
            signBtn.dataset.bound = 'true';
        }

        // Carregar categorias no datalist se houver serviço global (reaproveita se window.googleSheetsService existir)
        this.populateEditCategories();

        // Carregar contas no datalist usando o accounts-service
        this.populateEditAccounts();

        modal.style.display = 'flex';
    }

    /**
     * Formata data para input HTML (YYYY-MM-DD)
     */
    formatDateForInput(dateValue) {
        try {
            let date;
            if (typeof dateValue === 'number') {
                // Serial Excel - converte para data
                const excelEpoch = new Date(1899, 11, 30);
                date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
            } else {
                date = new Date(dateValue);
            }
            
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
            return '';
        } catch (e) {
            return '';
        }
    }

    /**
     * Converte para valor aceitável em input datetime-local
     */
    toDateTimeLocal(dateValue) {
        try {
            let date;
            if (typeof dateValue === 'number') {
                const excelEpoch = new Date(1899, 11, 30);
                date = new Date(excelEpoch.getTime() + dateValue * 86400000);
            } else if (typeof dateValue === 'string') {
                // Pode estar no formato dd/MM/yyyy HH:mm ou ISO
                if (/\d{2}\/\d{2}\/\d{4}/.test(dateValue)) {
                    const [parteData, parteHora='00:00'] = dateValue.split(' ');
                    const [dia, mes, ano] = parteData.split('/').map(Number);
                    const [hora, minuto='00'] = parteHora.split(':');
                    date = new Date(ano, mes - 1, dia, Number(hora), Number(minuto));
                } else {
                    date = new Date(dateValue);
                }
            } else {
                date = new Date();
            }
            if (isNaN(date.getTime())) return '';
            const pad = n => String(n).padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        } catch (e) {
            return '';
        }
    }

    /**
     * Popula datalist de categorias no modal de edição
     */
    async populateEditCategories() {
        const datalist = document.getElementById('editCategoriaList');
        if (!datalist) return;
        
        try {
            // Usa serviço centralizado de categorias se disponível
            if (window.categoriesService && typeof window.categoriesService.populateDatalist === 'function') {
                await window.categoriesService.populateDatalist('editCategoriaList');
            } else {
                // Fallback para implementação direta se serviço não estiver disponível
                console.warn('[LancamentosManager] Serviço de categorias não disponível, usando implementação direta');
                const categorias = await this.getCategoriesFallback();
                
                // Limpa opções existentes
                datalist.innerHTML = '';
                
                // Popula datalist
                categorias.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat;
                    datalist.appendChild(opt);
                });
            }
        } catch (error) {
            console.error('[LancamentosManager] Erro ao popular categorias de edição:', error);
            // Em caso de erro, usa categorias padrão
            this.populateDefaultCategories(datalist);
        }
    }

    /**
     * Busca categorias com fallback (método auxiliar)
     */
    async getCategoriesFallback() {
        try {
            if (window.googleSheetsService && typeof window.googleSheetsService.getCategories === 'function') {
                const categorias = await window.googleSheetsService.getCategories();
                return (categorias && categorias.length > 0) ? categorias : this.getDefaultCategories();
            }
        } catch (error) {
            console.error('[LancamentosManager] Erro ao buscar categorias:', error);
        }
        return this.getDefaultCategories();
    }

    /**
     * Retorna categorias padrão
     */
    getDefaultCategories() {
        return ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Vestuário', 'Outras'];
    }

    /**
     * Popula datalist de contas no modal de edição
     */
    async populateEditAccounts() {
        const datalist = document.getElementById('editContaList');
        if (!datalist) return;
        
        try {
            // Usa serviço centralizado de contas se disponível
            if (window.accountsService && typeof window.accountsService.populateDatalist === 'function') {
                await window.accountsService.populateDatalist('editContaList');
            } else {
                // Fallback para implementação direta se serviço não estiver disponível
                console.warn('[LancamentosManager] Serviço de contas não disponível, usando implementação direta');
                const contas = await this.getAccountsFallback();
                
                // Limpa opções existentes
                datalist.innerHTML = '';
                
                // Popula datalist
                contas.forEach(conta => {
                    const opt = document.createElement('option');
                    opt.value = conta;
                    datalist.appendChild(opt);
                });
            }
        } catch (error) {
            console.error('[LancamentosManager] Erro ao popular contas de edição:', error);
            // Em caso de erro, usa contas padrão
            this.populateDefaultAccounts(datalist);
        }
    }

    /**
     * Busca contas com fallback (método auxiliar)
     */
    async getAccountsFallback() {
        try {
            if (window.googleSheetsService && typeof window.googleSheetsService.getFinancialSummary === 'function') {
                const summary = await window.googleSheetsService.getFinancialSummary();
                const contas = summary.contasSugeridas || [];
                return (contas && contas.length > 0) ? contas : this.getDefaultAccounts();
            }
        } catch (error) {
            console.error('[LancamentosManager] Erro ao buscar contas:', error);
        }
        return this.getDefaultAccounts();
    }

    /**
     * Retorna contas padrão
     */
    getDefaultAccounts() {
        return ['Conta Corrente', 'Poupança', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'PIX', 'Outras'];
    }

    /**
     * Popula datalist com contas padrão
     */
    populateDefaultAccounts(datalist) {
        datalist.innerHTML = '';
        this.getDefaultAccounts().forEach(conta => {
            const opt = document.createElement('option');
            opt.value = conta;
            datalist.appendChild(opt);
        });
    }

    /**
     * Fecha modal de edição
     */
    closeEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentEditingEntry = null;
    }

    /**
     * Salva edição da entrada
     */
    async saveEdit() {
        if (!this.currentEditingEntry) return;
        // Coleta e converte dados conforme novo layout
        const dtRaw = document.getElementById('editData').value; // YYYY-MM-DDTHH:mm
        const dataFormatada = this.formatDateTimeForSheet(dtRaw);
        const sign = document.getElementById('editSignValue').value;
        const valorBase = parseFloat(document.getElementById('editValor').value) || 0;
        const valorFinal = sign === '-' ? -Math.abs(valorBase) : Math.abs(valorBase);

        const entryData = {
            rowIndex: this.currentEditingEntry.rowIndex,
            data: dataFormatada,
            conta: document.getElementById('editConta').value.trim(),
            descricao: document.getElementById('editDescricao').value.trim(),
            valor: valorFinal,
            categoria: document.getElementById('editCategoria').value.trim(),
            orcamento: backendBudgetFromISO(document.getElementById('editOrcamentoDate').value),
            obs: document.getElementById('editObs').value.trim()
        };

        // Validação básica
        if (!entryData.data || !entryData.conta || !entryData.descricao) {
            this.showMessage('Preencha todos os campos obrigatórios (Data, Conta, Descrição)', 'error');
            return;
        }

        // Validar formato da data
    if (!this.isValidDate(entryData.data)) {
            this.showMessage('Data deve estar no formato válido', 'error');
            return;
        }

        this.showLoading();

        // Atualização otimista: guarda original e aplica mudanças localmente
        const originalSnapshot = { ...this.currentEditingEntry };
        Object.assign(this.currentEditingEntry, entryData);
        this.renderEntries();

        try {
            const resp = await googleSheetsService.editSheetEntry(entryData);
            // Caso backend retorne payload atualizado, sincroniza
            if (resp && resp.updated) {
                Object.assign(this.currentEditingEntry, resp.updated);
            }
            this.showMessage('Lançamento editado com sucesso', 'success');
            this.closeEditModal();
            this.renderEntries();
        } catch (error) {
            console.error('Erro ao editar lançamento:', error);
            // Reverte otimista
            Object.assign(this.currentEditingEntry, originalSnapshot);
            this.renderEntries();
            this.showMessage('Erro ao editar lançamento: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Converte datetime-local (YYYY-MM-DDTHH:mm) para formato dd/MM/yyyy HH:mm aceito pela planilha
     */
    formatDateTimeForSheet(dt) {
        if (!dt) return '';
        try {
            const date = new Date(dt);
            if (isNaN(date.getTime())) return '';
            const pad = n => String(n).padStart(2, '0');
            return `${pad(date.getDate())}/${pad(date.getMonth()+1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
        } catch (e) { return ''; }
    }

    /**
     * Valida se uma data está no formato correto
     */
    isValidDate(dateString) {
    // Aceita formatos: dd/MM/yyyy ou dd/MM/yyyy HH:mm
    if (!dateString || typeof dateString !== 'string') return false;
    const trimmed = dateString.trim();
    const re = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/;
    const m = re.exec(trimmed);
    if (!m) return false;
    const dia = parseInt(m[1], 10);
    const mes = parseInt(m[2], 10);
    const ano = parseInt(m[3], 10);
    const hora = m[4] !== undefined ? parseInt(m[4], 10) : 0;
    const minuto = m[5] !== undefined ? parseInt(m[5], 10) : 0;
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || hora < 0 || hora > 23 || minuto < 0 || minuto > 59) return false;
    const dt = new Date(ano, mes - 1, dia, hora, minuto);
    // Verifica se bate (ex: 31/02 deve falhar)
    if (dt.getFullYear() !== ano || dt.getMonth() !== mes - 1 || dt.getDate() !== dia) return false;
    return true;
    }

    /**
     * Mostra loading
     */
    showLoading() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = 'block';
        }
    }

    /**
     * Esconde loading
     */
    hideLoading() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    /**
     * Exibe mensagem para o usuário
     */
    showMessage(message, type = 'info') {
        // Replica estilo e posição usados no index.html (feedback-message fixo topo direito)
        let msgEl = document.getElementById('feedback-message');
        if (!msgEl) {
            msgEl = document.createElement('div');
            msgEl.id = 'feedback-message';
            Object.assign(msgEl.style, {
                position: 'fixed',
                top: '70px',
                right: '20px',
                padding: '15px 20px',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                zIndex: '10000',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'opacity .3s'
            });
            document.body.appendChild(msgEl);
        }

        // Define cores conforme tipo
        const palette = {
            success: { bg: '#4CAF50', color: '#fff' },
            error: { bg: '#F44336', color: '#fff' },
            info: { bg: '#2196F3', color: '#fff' },
            warning: { bg: '#FF9800', color: '#fff' }
        };
        const cfg = palette[type] || palette.info;
        msgEl.style.backgroundColor = cfg.bg;
        msgEl.style.color = cfg.color;
        msgEl.textContent = message;
        msgEl.style.opacity = '1';
        msgEl.style.display = 'block';

        clearTimeout(this._msgTimeout);
        this._msgTimeout = setTimeout(() => {
            msgEl.style.opacity = '0';
            setTimeout(() => { if (msgEl) msgEl.style.display = 'none'; }, 300);
        }, 5000);
    }

    /**
     * Formata data para exibição
     */
    formatDate(dateValue) {
        try {
            if (typeof dateValue === 'number') {
                // Serial Excel - converte para data
                const excelEpoch = new Date(1899, 11, 30);
                const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
                return date.toLocaleDateString('pt-BR');
            } else if (typeof dateValue === 'string') {
                // Verifica se é uma string de data válida
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString('pt-BR');
                }
                // Se não for uma data válida, retorna o valor original
                return dateValue;
            } else {
                return dateValue;
            }
        } catch (e) {
            return dateValue;
        }
    }

    /**
     * Formata valor monetário
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    /**
     * Formata valor de orçamento para exibição
     */
    formatBudget(orcamento) {
        if (!orcamento) return '';
        
        // Se já está no formato "setembro/25", converte para "Set/25"
        if (typeof orcamento === 'string' && orcamento.includes('/')) {
            const [mesNome, anoCurto] = orcamento.split('/');
            const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
            const mesesAbrev = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
            const mesIndex = meses.indexOf(mesNome.toLowerCase());
            
            if (mesIndex !== -1) {
                return `${mesesAbrev[mesIndex]}/${anoCurto}`;
            }
        }
        
        return orcamento;
    }

    /**
     * Abre modal de divisão de parcelas
     */
    async splitEntry(rowIndex) {
        const entry = this.entries.find(e => e.rowIndex === rowIndex);
        if (!entry) {
            this.showMessage('Entrada não encontrada', 'error');
            return;
        }

        this.currentSplittingEntry = entry;
        this.openSplitModal(entry);
    }

    /**
     * Abre modal de divisão de parcelas
     */
    openSplitModal(entry) {
        const modal = document.getElementById('splitModal');
        if (!modal) return;

        // Preenche informações do lançamento atual
        document.getElementById('splitDescription').textContent = entry.descricao || '(sem descrição)';
        document.getElementById('splitValue').textContent = this.formatCurrency(entry.valor || 0);
        document.getElementById('splitDate').textContent = this.formatDate(entry.data) || '-';

        // Reset form
        document.getElementById('splitInstallments').value = '2';
        document.getElementById('splitPreview').style.display = 'none';

        // Listener para atualizar preview
        const installmentsInput = document.getElementById('splitInstallments');
        installmentsInput.oninput = () => this.updateSplitPreview();

        modal.style.display = 'flex';
    }

    /**
     * Fecha modal de divisão
     */
    closeSplitModal() {
        const modal = document.getElementById('splitModal');
        if (modal) modal.style.display = 'none';
        this.currentSplittingEntry = null;
    }

    /**
     * Atualiza preview da divisão
     */
    updateSplitPreview() {
        const installments = parseInt(document.getElementById('splitInstallments').value) || 2;
        const entry = this.currentSplittingEntry;
        
        if (!entry || installments < 2) {
            document.getElementById('splitPreview').style.display = 'none';
            return;
        }

        const totalValue = parseFloat(entry.valor) || 0;
        const installmentValue = totalValue / installments;

        // Calcula as datas das parcelas
        const baseDate = parseBudgetStr(entry.orcamento);
        const installmentsList = [];
        
        for (let i = 0; i < installments; i++) {
            const parcDate = new Date(baseDate);
            parcDate.setMonth(baseDate.getMonth() + i);
            
            const mesNome = this.getMonthName(parcDate.getMonth());
            const anoCurto = String(parcDate.getFullYear()).slice(-2);
            const budgetFormatted = `${mesNome}/${anoCurto}`;
            
            installmentsList.push({
                numero: i + 1,
                valor: installmentValue,
                orcamento: budgetFormatted
            });
        }

        // Atualiza UI
        document.getElementById('splitInstallmentValue').textContent = this.formatCurrency(installmentValue);
        
        const listEl = document.getElementById('splitInstallmentsList');
        listEl.innerHTML = installmentsList.map((parc, index) => 
            `<li>Parcela ${parc.numero}: ${this.formatCurrency(parc.valor)} - ${parc.orcamento}${index === 0 ? ' (atual)' : ''}</li>`
        ).join('');

        document.getElementById('splitPreview').style.display = 'block';
    }

    /**
     * Confirma a divisão em parcelas
     */
    async confirmSplit() {
        if (!this.currentSplittingEntry) return;

        const installments = parseInt(document.getElementById('splitInstallments').value) || 2;
        if (installments < 2) {
            this.showMessage('Número de parcelas deve ser maior que 1', 'error');
            return;
        }

        const confirmBtn = document.getElementById('splitConfirmBtn');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processando...';

        try {
            await this.processSplit(this.currentSplittingEntry, installments);
            this.showMessage(`Lançamento dividido em ${installments} parcelas com sucesso!`, 'success');
            this.closeSplitModal();
            await this.loadEntries(); // Recarrega lista para mostrar novos lançamentos
        } catch (error) {
            console.error('Erro ao dividir lançamento:', error);
            this.showMessage('Erro ao dividir lançamento: ' + error.message, 'error');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Dividir Lançamento';
        }
    }

    /**
     * Processa a divisão criando novos lançamentos
     */
    async processSplit(entry, installments) {
        const totalValue = parseFloat(entry.valor) || 0;
        const installmentValue = totalValue / installments;
        const baseDate = parseBudgetStr(entry.orcamento);

        // Primeiro, atualiza o lançamento original com o valor da primeira parcela
        const originalSnapshot = { ...entry };
        entry.valor = installmentValue;
        
        try {
            // Atualiza lançamento original
            const editData = {
                rowIndex: entry.rowIndex,
                data: entry.data,
                conta: entry.conta,
                descricao: entry.descricao,
                valor: installmentValue,
                categoria: entry.categoria,
                orcamento: entry.orcamento,
                obs: entry.obs
            };

            await googleSheetsService.editSheetEntry(editData);

            // Cria as parcelas subsequentes
            for (let i = 1; i < installments; i++) {
                const parcDate = new Date(baseDate);
                parcDate.setMonth(baseDate.getMonth() + i);
                
                // Converter data para formato backend dd/MM/YYYY
                const budgetDateFormatted = formatBudgetDateForBackend(parcDate);

                const newEntryData = {
                    data: entry.data, // Mantém a data original do lançamento
                    conta: entry.conta,
                    descricao: entry.descricao,
                    valor: installmentValue,
                    categoria: entry.categoria,
                    orcamento: budgetDateFormatted,
                    obs: entry.obs
                };

                await googleSheetsService.addEntry(newEntryData);
            }

        } catch (error) {
            // Em caso de erro, tenta reverter o lançamento original
            try {
                Object.assign(entry, originalSnapshot);
                await googleSheetsService.editSheetEntry({
                    rowIndex: entry.rowIndex,
                    data: entry.data,
                    conta: entry.conta,
                    descricao: entry.descricao,
                    valor: originalSnapshot.valor,
                    categoria: entry.categoria,
                    orcamento: entry.orcamento,
                    obs: entry.obs
                });
            } catch (revertError) {
                console.error('Erro ao reverter lançamento original:', revertError);
            }
            throw error;
        }
    }

    /**
     * Converte serial Excel/Sheets para Date
     * Aceita números e strings numéricas
     */
    excelSerialToDate(serial) {
        const n = Number(serial);
        if (isNaN(n)) return null;
        // Excel epoch 1899-12-30
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + n * 24 * 60 * 60 * 1000);
    }

    /**
     * Normaliza um lançamento para uso interno
     * - Converte data (serial Excel ou string) para _dateObj
     * - Cria _dateDisplay e _orcamentoDisplay
     * - Cria _orcamentoKey (numérico para ordenação)
     * Não altera o objeto original da API (opera em cópia passada)
     */
    normalizeEntry(entry) {
        if (!entry) return entry;
        if (entry._normalized) return entry;

        const e = { ...entry };

        // Normalizar data
        try {
            let dateObj = null;
            if (typeof e.data === 'number' || /^\d+(?:\.\d+)?$/.test(String(e.data))) {
                dateObj = this.excelSerialToDate(e.data);
            } else if (typeof e.data === 'string') {
                // dd/MM/yyyy ou ISO
                if (/\d{2}\/\d{2}\/\d{4}/.test(e.data)) {
                    const [parteData, parteHora='00:00'] = e.data.split(' ');
                    const [dia, mes, ano] = parteData.split('/').map(Number);
                    const [hora, minuto='00'] = (parteHora || '00:00').split(':').map(Number);
                    dateObj = new Date(ano, mes - 1, dia, hora, minuto);
                } else {
                    const parsed = new Date(e.data);
                    if (!isNaN(parsed.getTime())) dateObj = parsed;
                }
            }
            e._dateObj = (dateObj && !isNaN(dateObj.getTime())) ? dateObj : null;
            e._dateDisplay = e._dateObj ? this.formatDate(e._dateObj) : (e.data || '');
        } catch (err) {
            e._dateObj = null;
            e._dateDisplay = e.data || '';
        }

        // Normalizar orcamento
        try {
            if (typeof e.orcamento === 'number' || /^\d+(?:\.\d+)?$/.test(String(e.orcamento))) {
                const d = this.excelSerialToDate(e.orcamento);
                if (d && !isNaN(d.getTime())) {
                    const mesNome = this.getMonthName(d.getMonth());
                    const anoCurto = String(d.getFullYear()).slice(-2);
                    e._orcamentoDisplay = `${mesNome}/${anoCurto}`;
                } else {
                    e._orcamentoDisplay = String(e.orcamento || '');
                }
            } else if (typeof e.orcamento === 'string') {
                // Se for data no formato dd/MM/yyyy ou dd/MM/yy, converte para mesNome/yy
                if (/^\d{2}\/\d{2}\/\d{2,4}/.test(e.orcamento)) {
                    const [d, m, y] = e.orcamento.split('/').map(s => s.trim());
                    const ano = y.length === 2 ? ('20' + y) : y;
                    const mesIndex = parseInt(m, 10) - 1;
                    if (!isNaN(mesIndex) && mesIndex >= 0 && mesIndex <= 11) {
                        const mesNome = this.getMonthName(mesIndex);
                        const anoCurto = String(ano).slice(-2);
                        e._orcamentoDisplay = `${mesNome}/${anoCurto}`;
                    } else {
                        e._orcamentoDisplay = e.orcamento;
                    }
                } else {
                    e._orcamentoDisplay = e.orcamento;
                }
            } else {
                e._orcamentoDisplay = '';
            }

            e._orcamentoKey = this.getBudgetSortValue(e._orcamentoDisplay || e.orcamento);
        } catch (err) {
            e._orcamentoDisplay = e.orcamento || '';
            e._orcamentoKey = 0;
        }

        e._normalized = true;
        return e;
    }

    /**
     * Retorna nome do mês em português
     */
    getMonthName(monthIndex) {
        const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
        return meses[monthIndex] || 'janeiro';
    }

    /**
     * Escapa HTML para prevenir XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Exportar instância global
const lancamentosManager = new LancamentosManager();
window.lancamentosManager = lancamentosManager;

export default lancamentosManager;