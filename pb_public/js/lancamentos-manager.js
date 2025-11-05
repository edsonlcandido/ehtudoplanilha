/**
 * Módulo para gerenciar a página de lançamentos
 * Responsável por exibir, editar e deletar entradas da planilha
 */

import googleSheetsService from './google/sheets-api.js';
import { toExcelSerial, excelSerialToDate, toExcelSerialDia } from './utils/sheet-entries.js';

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
                    <button class="small" onclick="lancamentosManager.editEntry(${entry.rowIndex})" title="Editar">
                        ✏️
                    </button>
                    <button class="small" onclick="lancamentosManager.splitEntry(${entry.rowIndex})" title="Dividir em parcelas">
                        ➗
                    </button>
                    <button class="danger small" onclick="lancamentosManager.deleteEntry(${entry.rowIndex})" title="Excluir">
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
                    <button class="button small"  onclick="lancamentosManager.editEntry(${entry.rowIndex})" title="Editar">
                        ✏️
                    </button>
                    <button class="button small" onclick="lancamentosManager.splitEntry(${entry.rowIndex})" title="Dividir em parcelas">
                        ➗
                    </button>
                    <button class="button danger small"  onclick="lancamentosManager.deleteEntry(${entry.rowIndex})" title="Excluir">
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
     * Deleta uma entrada - abre modal de confirmação
     * @param {number} rowIndex - Índice da linha na planilha a ser excluída
     */
    async deleteEntry(rowIndex) {
        console.log(`deleteEntry: Solicitação de exclusão para linha ${rowIndex}`);
        
        // Procura nas entradas originais, não filtradas
        const entry = this.entries.find(e => e.rowIndex === rowIndex);
        if (!entry) {
            console.warn(`deleteEntry: Entrada não encontrada para rowIndex ${rowIndex}`);
            this.showMessage('Entrada não encontrada', 'error');
            return;
        }
        
        // Abre modal de confirmação com os dados da entrada
        this.openDeleteModal(entry);
    }

    /**
     * Abre modal de confirmação de exclusão
     * @param {Object} entry - Entrada a ser excluída
     */
    openDeleteModal(entry) {
        console.log(`openDeleteModal: Abrindo modal para linha ${entry.rowIndex}`);
        
        const modal = document.getElementById('deleteModal');
        if (!modal) {
            console.error('openDeleteModal: Modal de exclusão não encontrado no DOM');
            return;
        }
        
        // Armazena o rowIndex para uso posterior na confirmação
        this.pendingDeleteRowIndex = entry.rowIndex;
        
        // Preenche os dados da entrada no modal
        const rowSpan = document.getElementById('deleteRowNumber');
        const descSpan = document.getElementById('deleteDescription');
        const dateSpan = document.getElementById('deleteDate');
        const valueSpan = document.getElementById('deleteValue');
        
        if (rowSpan) {
            rowSpan.textContent = entry.rowIndex;
        } else {
            console.warn('openDeleteModal: Elemento deleteRowNumber não encontrado no DOM');
        }
        if (descSpan) {
            descSpan.textContent = entry.descricao || '(sem descrição)';
        } else {
            console.warn('openDeleteModal: Elemento deleteDescription não encontrado no DOM');
        }
        if (dateSpan) {
            dateSpan.textContent = this.formatDate(entry.data) || '-';
        } else {
            console.warn('openDeleteModal: Elemento deleteDate não encontrado no DOM');
        }
        if (valueSpan) {
            valueSpan.textContent = this.formatCurrency(entry.valor || 0);
        } else {
            console.warn('openDeleteModal: Elemento deleteValue não encontrado no DOM');
        }
        
        // Garante que o botão de confirmar está habilitado e com texto correto
        const confirmBtn = document.getElementById('deleteConfirmBtn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Excluir';
        }
        
        // Exibe o modal
        modal.style.display = 'flex';
    }

    /**
     * Fecha modal de exclusão e limpa o estado
     */
    closeDeleteModal() {
        console.log('closeDeleteModal: Fechando modal de exclusão');
        const modal = document.getElementById('deleteModal');
        if (modal) modal.style.display = 'none';
        this.pendingDeleteRowIndex = null;
    }

    /**
     * Confirma exclusão (acionado pelo botão no modal)
     */
    async confirmDelete() {
        if (!this.pendingDeleteRowIndex) {
            console.warn('confirmDelete: Nenhum lançamento pendente para exclusão');
            this.closeDeleteModal();
            return;
        }
        const rowIndex = this.pendingDeleteRowIndex;
        console.log(`confirmDelete: Iniciando exclusão do lançamento na linha ${rowIndex}`);
        
        const confirmBtn = document.getElementById('deleteConfirmBtn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Excluindo...';
        }

        // Remoção otimista - salva estado atual para possível rollback
        const originalEntries = [...this.entries];
        const originalFiltered = [...this.filteredEntries];
        const originalOriginal = [...this.originalEntries];
        
        // Remove a entrada das listas localmente (UI otimista)
        this.entries = this.entries.filter(e => e.rowIndex !== rowIndex);
        this.filteredEntries = this.filteredEntries.filter(e => e.rowIndex !== rowIndex);
        this.originalEntries = this.originalEntries.filter(e => e.rowIndex !== rowIndex);
        this.renderEntries();
        this.updateSearchUI();

        try {
            // Chama o serviço para deletar a entrada na planilha
            console.log(`confirmDelete: Chamando googleSheetsService.deleteSheetEntry(${rowIndex})`);
            await googleSheetsService.deleteSheetEntry(rowIndex);
            console.log(`confirmDelete: Lançamento linha ${rowIndex} excluído com sucesso`);
            
            this.showMessage('Lançamento excluído com sucesso', 'success');
            this.closeDeleteModal();
            
            // Recarrega as entradas para sincronizar com a planilha
            await this.loadEntries();
        } catch (error) {
            console.error(`confirmDelete: Erro ao excluir lançamento linha ${rowIndex}:`, error);
            
            // Rollback: restaura estado anterior
            this.entries = originalEntries;
            this.filteredEntries = originalFiltered;
            this.originalEntries = originalOriginal;
            this.renderEntries();
            this.updateSearchUI();
            
            // Exibe mensagem de erro ao usuário
            const errorMsg = error.message || 'Erro desconhecido ao excluir lançamento';
            this.showMessage(`Erro ao excluir lançamento: ${errorMsg}`, 'error');
            
            // Re-habilita o botão para tentar novamente
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
        // Garantir opções de orçamento (12 meses centrados no atual)
        this.populateEditBudgetSelect();

        // Preencher campos do modal
        const dataInput = document.getElementById('editData');
        const contaInput = document.getElementById('editConta');
        const descInput = document.getElementById('editDescricao');
        const valorInput = document.getElementById('editValor');
        const signBtn = document.getElementById('editSignBtn');
        const signValue = document.getElementById('editSignValue');
        const catInput = document.getElementById('editCategoria');
        const orcSelect = document.getElementById('editOrcamento');
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
        if (entry.orcamento) {
            // Tenta selecionar orçamento correspondente
            const opt = Array.from(orcSelect.options).find(o => o.value === entry.orcamento || o.textContent === entry.orcamento);
            if (opt) opt.selected = true;
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

        // Configurar autocomplete avançado
        this.setupEditAutocomplete();

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
     * Preenche select de orçamento no modal de edição (meses -6 a +6 do atual)
     */
    populateEditBudgetSelect() {
        const select = document.getElementById('editOrcamento');
        if (!select || select.dataset.populated) return;
        select.innerHTML = '';
        const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
        const now = new Date();
        const base = new Date(now.getFullYear(), now.getMonth(), 1);
        for (let i=-6;i<=6;i++) {
            const d = new Date(base.getFullYear(), base.getMonth()+i, 1);
            const mesNome = meses[d.getMonth()];
            const anoCurto = String(d.getFullYear()).slice(-2);
            const valor = `${mesNome}/${anoCurto}`;
            const opt = document.createElement('option');
            opt.value = valor;
            opt.textContent = valor.charAt(0).toUpperCase()+valor.slice(1);
            if (i===0) opt.selected = true;
            select.appendChild(opt);
        }
        select.dataset.populated = 'true';
    }

    /**
     * Escapa HTML para evitar injeção XSS
     */
    escapeHtml(str) {
        return String(str ?? '').replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Cria container de sugestões para autocomplete
     */
    ensureSuggestionsContainer(containerId, inputElement) {
        let container = document.getElementById(containerId);
        if (!container && inputElement) {
            container = document.createElement('div');
            container.id = containerId;
            container.classList.add('edit-modal__suggestions');
            container.setAttribute('role', 'listbox');
            container.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #ccc;
                border-top: none;
                border-radius: 0 0 4px 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                max-height: 150px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
            `;
            const parent = inputElement.parentElement;
            parent.style.position = parent.style.position || 'relative';
            parent.appendChild(container);
        }
        return container;
    }

    /**
     * Mostra sugestões para categorias
     */
    mostrarSugestoesCategoria(query) {
        const input = document.getElementById('editCategoria');
        const container = this.ensureSuggestionsContainer('editCatSuggestions', input);
        if (!container) return;

        container.innerHTML = '';
        if (!query || query.trim().length < 1) {
            container.style.display = 'none';
            return;
        }

        const q = query.trim().toLowerCase();
        const categorias = this.getUniqueCategories();
        const suggestions = categorias.filter(cat => cat.toLowerCase().includes(q));
        
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        suggestions.forEach(cat => {
            const item = document.createElement('div');
            item.setAttribute('role', 'option');
            item.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
            `;
            item.innerHTML = this.escapeHtml(cat);
            item.addEventListener('click', () => {
                input.value = cat;
                container.style.display = 'none';
                input.focus();
            });
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f0f0f0';
            });
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'white';
            });
            container.appendChild(item);
        });
        container.style.display = 'block';
    }

    /**
     * Mostra sugestões para contas
     */
    mostrarSugestoesConta(query) {
        const input = document.getElementById('editConta');
        const container = this.ensureSuggestionsContainer('editContaSuggestions', input);
        if (!container) return;

        container.innerHTML = '';
        if (!query || query.trim().length < 1) {
            container.style.display = 'none';
            return;
        }

        const q = query.trim().toLowerCase();
        const contas = this.getUniqueAccounts();
        const suggestions = contas.filter(conta => conta.toLowerCase().includes(q));
        
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        suggestions.forEach(conta => {
            const item = document.createElement('div');
            item.setAttribute('role', 'option');
            item.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
            `;
            item.innerHTML = this.escapeHtml(conta);
            item.addEventListener('click', () => {
                input.value = conta;
                container.style.display = 'none';
                input.focus();
            });
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f0f0f0';
            });
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'white';
            });
            container.appendChild(item);
        });
        container.style.display = 'block';
    }

    /**
     * Mostra sugestões para descrições
     */
    mostrarSugestoesDescricao(query) {
        const input = document.getElementById('editDescricao');
        const container = this.ensureSuggestionsContainer('editDescSuggestions', input);
        if (!container) return;

        container.innerHTML = '';
        if (!query || query.trim().length < 1) {
            container.style.display = 'none';
            return;
        }

        const q = query.trim().toLowerCase();
        const descricoes = this.getUniqueDescriptions();
        const suggestions = descricoes.filter(desc => desc.toLowerCase().includes(q));
        
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        suggestions.forEach(desc => {
            const item = document.createElement('div');
            item.setAttribute('role', 'option');
            item.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
            `;
            item.innerHTML = this.escapeHtml(desc);
            item.addEventListener('click', () => {
                // Preencher descrição
                input.value = desc;
                container.style.display = 'none';
                
                // Buscar categoria correspondente nos entries
                const catInput = document.getElementById('editCategoria');
                if (catInput && this.entries && this.entries.length > 0) {
                    // Encontra o primeiro entry que tem essa descrição
                    const matchEntry = this.entries.find(e => 
                        e.descricao && e.descricao.trim().toLowerCase() === desc.toLowerCase()
                    );
                    
                    // Se encontrou e tem categoria, preenche o campo
                    if (matchEntry && matchEntry.categoria) {
                        catInput.value = matchEntry.categoria;
                    }
                }
                
                input.focus();
            });
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f0f0f0';
            });
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'white';
            });
            container.appendChild(item);
        });
        container.style.display = 'block';
    }

    /**
     * Obtém categorias únicas dos entries carregados
     */
    getUniqueCategories() {
        if (!this.entries || !Array.isArray(this.entries)) return this.getDefaultCategories();
        
        const categorias = this.entries
            .map(e => String(e.categoria || '').trim())
            .filter(Boolean);
        
        const unique = Array.from(new Set(categorias)).sort();
        return unique.length > 0 ? unique : this.getDefaultCategories();
    }

    /**
     * Obtém contas únicas dos entries carregados
     */
    getUniqueAccounts() {
        if (!this.entries || !Array.isArray(this.entries)) return this.getDefaultAccounts();
        
        const contas = this.entries
            .map(e => String(e.conta || '').trim())
            .filter(Boolean);
        
        const unique = Array.from(new Set(contas)).sort();
        return unique.length > 0 ? unique : this.getDefaultAccounts();
    }

    /**
     * Obtém descrições únicas dos entries carregados
     */
    getUniqueDescriptions() {
        if (!this.entries || !Array.isArray(this.entries)) return [];
        
        const descricoes = this.entries
            .map(e => String(e.descricao || '').trim())
            .filter(Boolean);
        
        return Array.from(new Set(descricoes)).sort();
    }

    /**
     * Configura event listeners para autocomplete no modal de edição
     */
    setupEditAutocomplete() {
        const categoriaInput = document.getElementById('editCategoria');
        const contaInput = document.getElementById('editConta');
        const descricaoInput = document.getElementById('editDescricao');

        // Configurar autocomplete apenas se não foi configurado antes
        if (categoriaInput && !categoriaInput.dataset.autocompleteSetup) {
            categoriaInput.addEventListener('focus', () => {
                this.mostrarSugestoesCategoria(categoriaInput.value);
            });
            categoriaInput.addEventListener('input', (e) => {
                this.mostrarSugestoesCategoria(e.target.value);
            });
            categoriaInput.dataset.autocompleteSetup = 'true';
        }

        if (contaInput && !contaInput.dataset.autocompleteSetup) {
            contaInput.addEventListener('focus', () => {
                this.mostrarSugestoesConta(contaInput.value);
            });
            contaInput.addEventListener('input', (e) => {
                this.mostrarSugestoesConta(e.target.value);
            });
            contaInput.dataset.autocompleteSetup = 'true';
        }

        if (descricaoInput && !descricaoInput.dataset.autocompleteSetup) {
            descricaoInput.addEventListener('focus', () => {
                this.mostrarSugestoesDescricao(descricaoInput.value);
            });
            descricaoInput.addEventListener('input', (e) => {
                this.mostrarSugestoesDescricao(e.target.value);
            });
            descricaoInput.dataset.autocompleteSetup = 'true';
        }

        // Adicionar listener global apenas uma vez
        if (!document.body.dataset.editModalClickSetup) {
            document.addEventListener('click', (e) => {
                const containers = [
                    { container: document.getElementById('editCatSuggestions'), input: categoriaInput },
                    { container: document.getElementById('editContaSuggestions'), input: contaInput },
                    { container: document.getElementById('editDescSuggestions'), input: descricaoInput }
                ];
                
                containers.forEach(({ container, input }) => {
                    if (container && input && e.target !== input && !container.contains(e.target)) {
                        container.style.display = 'none';
                    }
                });
            });
            document.body.dataset.editModalClickSetup = 'true';
        }
    }

    /**
     * Popula datalist de categorias no modal de edição (legacy para compatibilidade)
     */
    async populateEditCategories() {
        // Não faz mais nada - o novo sistema de autocomplete substitui isso
        // Mantido apenas para compatibilidade
    }

    /**
     * Retorna categorias padrão
     */
    getDefaultCategories() {
        return ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Vestuário', 'Outras'];
    }

    /**
     * Popula datalist de contas no modal de edição (legacy para compatibilidade)
     */
    async populateEditAccounts() {
        // Não faz mais nada - o novo sistema de autocomplete substitui isso
        // Mantido apenas para compatibilidade
    }

    /**
     * Retorna contas padrão
     */
    getDefaultAccounts() {
        return ['Conta Corrente', 'Poupança', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'PIX', 'Outras'];
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
            orcamento: this.formatBudgetDate(document.getElementById('editOrcamento').value),
            obs: document.getElementById('editObs').value.trim()
        };

        // Validação básica - apenas valor, categoria e orçamento são obrigatórios
        if (!entryData.valor && entryData.valor !== 0) {
            this.showMessage('O campo Valor é obrigatório', 'error');
            return;
        }

        if (!entryData.categoria || entryData.categoria.trim() === '') {
            this.showMessage('O campo Categoria é obrigatório', 'error');
            return;
        }

        if (!entryData.orcamento || entryData.orcamento.trim() === '') {
            this.showMessage('O campo Orçamento (data-chave) é obrigatório', 'error');
            return;
        }

        // Validar formato da data apenas se ela for informada
        if (entryData.data && !this.isValidDate(entryData.data)) {
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
     * Converte valor de orçamento (ex: setembro/25) em 01/MM/20YY
     */
    formatBudgetDate(valor) {
        if (!valor) return '';
        const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
        const [nome, anoCurto] = valor.split('/');
        const idx = meses.indexOf(nome.toLowerCase());
        if (idx === -1) return '';
        const pad = n => String(n).padStart(2,'0');
        return `01/${pad(idx+1)}/20${anoCurto}`;
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
        const installmentValue = parseFloat((totalValue / installments).toFixed(2)); // CORREÇÃO: Arredonda para 2 casas decimais

        // Calcula as datas das parcelas usando serial Excel
        const baseDate = this.parseBudgetDate(entry.orcamento);
        const installmentsList = [];
        
        for (let i = 0; i < installments; i++) {
            let parcDate;
            let orcamentoSerial;
            let budgetDisplayFormatted;
            
            if (i === 0) {
                // CORREÇÃO: Primeira parcela mantém a data chave original
                parcDate = new Date(baseDate);
                orcamentoSerial = entry.orcamento; // Mantém o orçamento original
                
                // Para exibição, converte para formato DD/MM/AAAA
                budgetDisplayFormatted = this.formatDate(orcamentoSerial);
            } else {
                // CORREÇÃO: Parcelas subsequentes têm data chave alterada (baseDate + i meses)
                parcDate = new Date(baseDate);
                parcDate.setMonth(baseDate.getMonth() + i);
                
                // CORREÇÃO: Usa serial Excel preservando o dia original da data base
                orcamentoSerial = toExcelSerialDia(new Date(parcDate.getFullYear(), parcDate.getMonth(), baseDate.getDate()));
                
                // Para exibição, converte serial Excel para formato DD/MM/AAAA
                budgetDisplayFormatted = this.formatDate(orcamentoSerial);
            }
            
            installmentsList.push({
                numero: i + 1,
                valor: installmentValue,
                orcamento: orcamentoSerial,
                orcamentoDisplay: budgetDisplayFormatted
            });
        }

        // Atualiza UI
        document.getElementById('splitInstallmentValue').textContent = this.formatCurrency(installmentValue);
        
        const listEl = document.getElementById('splitInstallmentsList');
        listEl.innerHTML = installmentsList.map((parc, index) => 
            `<li>Parcela ${parc.numero}: ${this.formatCurrency(parc.valor)} - ${parc.orcamentoDisplay}${index === 0 ? ' (atual)' : ''}</li>`
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
        const installmentValue = parseFloat((totalValue / installments).toFixed(2)); // CORREÇÃO: Arredonda para 2 casas decimais
        const baseDate = this.parseBudgetDate(entry.orcamento);

        // Primeiro, atualiza o lançamento original com o valor da primeira parcela
        const originalSnapshot = { ...entry };
        entry.valor = installmentValue;
        
        try {
            // Atualiza lançamento original (MANTÉM a data chave original)
            const editData = {
                rowIndex: entry.rowIndex,
                data: entry.data,
                conta: entry.conta,
                descricao: entry.descricao,
                valor: installmentValue,
                categoria: entry.categoria,
                orcamento: entry.orcamento, // CORREÇÃO: Mantém orçamento original na primeira parcela
                obs: entry.obs
            };

            await googleSheetsService.editSheetEntry(editData);

            // Cria as parcelas subsequentes (a partir da segunda parcela)
            for (let i = 1; i < installments; i++) {
                // CORREÇÃO: Apenas as parcelas subsequentes têm data chave alterada
                const parcDate = new Date(baseDate);
                parcDate.setMonth(baseDate.getMonth() + i); // i=1 => próximo mês, i=2 => mês+2, etc.
                
                // CORREÇÃO: Usa serial Excel preservando o dia original da data base
                const orcamentoSerial = toExcelSerialDia(new Date(parcDate.getFullYear(), parcDate.getMonth(), baseDate.getDate()));

                const newEntryData = {
                    data: entry.data, // Mantém a data original do lançamento
                    conta: entry.conta,
                    descricao: entry.descricao,
                    valor: installmentValue,
                    categoria: entry.categoria,
                    orcamento: orcamentoSerial, // Usa serial Excel em vez de string formatada
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
     * Converte valor de orçamento para Date
     */
    parseBudgetDate(orcamento) {
        if (!orcamento) return new Date();
        
        // Se é número (serial Excel), converte para date
        if (typeof orcamento === 'number') {
            return this.excelSerialToDate(orcamento);
        }
        
        // Se é string no formato "setembro/25"
        if (typeof orcamento === 'string' && orcamento.includes('/')) {
            const [mesNome, anoCurto] = orcamento.split('/');
            const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
            const mesIndex = meses.indexOf(mesNome.toLowerCase());
            
            if (mesIndex !== -1) {
                const ano = parseInt('20' + anoCurto);
                return new Date(ano, mesIndex, 1);
            }
        }
        
        return new Date();
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