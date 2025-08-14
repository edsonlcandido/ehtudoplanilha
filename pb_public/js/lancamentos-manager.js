/**
 * Módulo para gerenciar a página de lançamentos
 * Responsável por exibir, editar e deletar entradas da planilha
 */

import googleSheetsService from '../google/sheets-api.js';

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
        this.showLoading();

        try {
            const response = await googleSheetsService.getSheetEntries(50);
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
     * Renderiza as entradas na interface
     */
    renderEntries() {
        const container = document.getElementById('entriesContainer');
        if (!container) return;

        if (this.entries.length === 0) {
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
                    <button class="button small" onclick="lancamentosManager.editEntry(${entry.rowIndex})">
                        Editar
                    </button>
                    <button class="button danger small" onclick="lancamentosManager.deleteEntry(${entry.rowIndex})">
                        Excluir
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
                    <button class="button small" onclick="lancamentosManager.editEntry(${entry.rowIndex})">
                        Editar
                    </button>
                    <button class="button danger small" onclick="lancamentosManager.deleteEntry(${entry.rowIndex})">
                        Excluir
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

        this.showLoading();

        try {
            await googleSheetsService.deleteSheetEntry(rowIndex);
            this.showMessage('Lançamento excluído com sucesso', 'success');
            await this.loadEntries(); // Recarregar lista
        } catch (error) {
            console.error('Erro ao excluir lançamento:', error);
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

        // Preencher campos do modal
        document.getElementById('editData').value = this.formatDateForInput(entry.data);
        document.getElementById('editConta').value = entry.conta;
        document.getElementById('editDescricao').value = entry.descricao;
        document.getElementById('editValor').value = entry.valor;
        document.getElementById('editCategoria').value = entry.categoria;
        document.getElementById('editOrcamento').value = entry.orcamento;
        document.getElementById('editObs').value = entry.obs;

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

        const entryData = {
            rowIndex: this.currentEditingEntry.rowIndex,
            data: document.getElementById('editData').value,
            conta: document.getElementById('editConta').value,
            descricao: document.getElementById('editDescricao').value,
            valor: parseFloat(document.getElementById('editValor').value) || 0,
            categoria: document.getElementById('editCategoria').value,
            orcamento: document.getElementById('editOrcamento').value,
            obs: document.getElementById('editObs').value
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
        const messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) {
            console.log(`[${type}] ${message}`);
            return;
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;
        
        messageContainer.appendChild(messageElement);

        // Remover após 5 segundos
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
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