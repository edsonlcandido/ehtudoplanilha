/**
 * Módulo para gerenciar a página de lançamentos
 * Responsável por exibir, editar e deletar entradas da planilha
 */

import googleSheetsService from './google/sheets-api.js';

class LancamentosManager {
    constructor() {
        this.entries = [];
        this.isLoading = false;
        this.currentEditingEntry = null;
        this.isMobile = window.innerWidth <= 768;
        
        // Detectar mudanças de tamanho da tela
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
            this.renderEntries();
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
            const response = await this.fetchSheetEntries(50);
            this.entries = response.entries || [];
            this.renderEntries();
            this.showMessage('Lançamentos carregados com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao carregar lançamentos:', error);
            this.showMessage('Erro ao carregar lançamentos: ' + error.message, 'error');
            this.entries = [];
            this.renderEntries();
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    /**
     * Busca entradas diretamente do endpoint dedicado
     */
    async fetchSheetEntries(limit = 50) {
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
     * Renderiza as entradas na interface
     */
    renderEntries() {
        const container = document.getElementById('entriesContainer');
        if (!container) return;

        if (this.entries.length === 0 && !this.isLoading) {
            container.innerHTML = `
                <div class="text-center" style="padding: 2rem;">
                    <p style="color: #666;">Nenhum lançamento encontrado na planilha.</p>
                    <button class="button primary" onclick="window.location.href='index.html'">
                        Ir para Dashboard
                    </button>
                </div>
            `;
            return;
        }

        // Sempre mostrar a estrutura da tabela/cards mesmo durante loading
        if (this.isMobile) {
            this.renderMobileCards(container);
        } else {
            this.renderDesktopTable(container);
        }
    }

    /**
     * Renderiza cards para mobile
     */
    renderMobileCards(container) {
        // Se está carregando e não tem entradas, mostra skeleton
        if (this.isLoading && this.entries.length === 0) {
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

        const cardsHtml = this.entries.map(entry => `
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
    renderDesktopTable(container) {
        // Se está carregando e não tem entradas, mostra skeleton
        if (this.isLoading && this.entries.length === 0) {
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

        const rowsHtml = this.entries.map(entry => `
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
        const entry = this.entries.find(e => e.rowIndex === rowIndex);
        if (!entry) {
            this.showMessage('Entrada não encontrada', 'error');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir o lançamento "${entry.descricao}"?`)) {
            return;
        }

        // Remoção otimista: atualiza UI antes da chamada remota
        const originalEntries = [...this.entries];
        this.entries = this.entries.filter(e => e.rowIndex !== rowIndex);
        this.renderEntries();
        this.showLoading();

        try {
            await googleSheetsService.deleteSheetEntry(rowIndex);
            this.showMessage('Lançamento excluído com sucesso', 'success');
            // Opcional: recarrega para garantir consistência (ex: reindexações futuras)
            await this.loadEntries();
        } catch (error) {
            console.error('Erro ao excluir lançamento:', error);
            // Reverte estado local
            this.entries = originalEntries;
            this.renderEntries();
            this.showMessage('Erro ao excluir lançamento: ' + error.message, 'error');
        } finally {
            this.hideLoading();
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
     * Popula datalist de categorias no modal de edição se ainda vazio
     */
    async populateEditCategories() {
        const datalist = document.getElementById('editCategoriaList');
        if (!datalist || datalist.dataset.populated) return;
        try {
            if (window.googleSheetsService && typeof window.googleSheetsService.getCategories === 'function') {
                const categorias = await window.googleSheetsService.getCategories();
                (categorias || []).forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat;
                    datalist.appendChild(opt);
                });
            } else {
                ['Alimentação','Transporte','Moradia','Saúde','Educação','Lazer','Vestuário','Outras'].forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat;
                    datalist.appendChild(opt);
                });
            }
            datalist.dataset.populated = 'true';
        } catch (e) {
            ['Alimentação','Transporte','Moradia','Saúde','Educação','Lazer','Vestuário','Outras'].forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                datalist.appendChild(opt);
            });
            datalist.dataset.populated = 'true';
        }
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

        try {
            await googleSheetsService.editSheetEntry(entryData);
            this.showMessage('Lançamento editado com sucesso', 'success');
            this.closeEditModal();
            await this.loadEntries(); // Recarregar lista
        } catch (error) {
            console.error('Erro ao editar lançamento:', error);
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
        try {
            const date = new Date(dateString);
            return date instanceof Date && !isNaN(date.getTime());
        } catch (e) {
            return false;
        }
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