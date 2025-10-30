/**
 * Monkey patch para o LancamentosManager
 * Este script sobrescreve funções para trabalhar com o input de data para orçamento
 */
 
import { toExcelSerialDia, excelSerialToDate } from '../utils/sheet-entries.js';

// Este script deve ser importado após lancamentos-manager.js

// Aguardar o carregamento do DOM e do objeto lancamentosManager
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se o LancamentosManager está disponível
    if (!window.lancamentosManager) {
        console.error('LancamentosManager não encontrado. O patch não foi aplicado.');
        return;
    }

    // Referência ao método original de saveEdit
    const originalSaveEdit = window.lancamentosManager.saveEdit;

    // Sobrescreve a função saveEdit
    window.lancamentosManager.saveEdit = async function() {
        if (!this.currentEditingEntry) return;
        
        // Coleta e converte dados conforme novo layout
        const dtRaw = document.getElementById('editData').value; // YYYY-MM-DDTHH:mm
        const dataFormatada = this.formatDateTimeForSheet(dtRaw);
        const sign = document.getElementById('editSignValue').value;
        const valorBase = parseFloat(document.getElementById('editValor').value) || 0;
        const valorFinal = sign === '-' ? -Math.abs(valorBase) : Math.abs(valorBase);

        // Processa o valor do orçamento do input date - converte para Excel serial inteiro
        const orcamentoInput = document.getElementById('editOrcamento');
        let orcamentoSerial = 0;
        
        if (orcamentoInput && orcamentoInput.value) {
            const dateBudgetStr = orcamentoInput.value; // formato YYYY-MM-DD
            if (dateBudgetStr) {
                const [ano, mes, dia] = dateBudgetStr.split('-').map(n => parseInt(n, 10));
                if (!isNaN(ano) && !isNaN(mes) && !isNaN(dia)) {
                    const dataSimples = new Date(ano, mes - 1, dia); // 00:00 local
                    orcamentoSerial = toExcelSerialDia(dataSimples); // sempre inteiro
                }
            }
        }

        // Monta payload com os dados coletados
        const entryData = {
            rowIndex: this.currentEditingEntry.rowIndex,
            data: dataFormatada,
            conta: document.getElementById('editConta').value.trim(),
            descricao: document.getElementById('editDescricao').value.trim(),
            valor: valorFinal,
            categoria: document.getElementById('editCategoria').value.trim(),
            orcamento: orcamentoSerial, // Usa o valor Excel serial
            obs: document.getElementById('editObs').value.trim()
        };

        // Validação básica
        if (!entryData.descricao) {
            this.showMessage('Preencha todos os campos obrigatórios (Data, Conta, Descrição)', 'error');
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
    };

    // Substitui o método openEditModal para resolver o problema com o campo de orçamento
    window.lancamentosManager.openEditModal = function(entry) {
        if (!entry) return;
        this.currentEditingEntry = entry;
        
        // Elementos do formulário
        const dataInput = document.getElementById('editData');
        const contaInput = document.getElementById('editConta');
        const descInput = document.getElementById('editDescricao');
        const valorInput = document.getElementById('editValor');
        const signBtn = document.getElementById('editSignBtn');
        const signValue = document.getElementById('editSignValue');
        const catInput = document.getElementById('editCategoria');
        const obsInput = document.getElementById('editObs');
        
        // Preenche com valores da entrada selecionada
        if (entry.data) {
            // Converte data formatada para datetime-local
            const date = this.convertSheetDateToDateInput ? 
                        this.convertSheetDateToDateInput(entry.data) : 
                        this.toDateTimeLocal(entry.data);
            dataInput.value = date;
        }
        
        contaInput.value = entry.conta || '';
        descInput.value = entry.descricao || '';
        
        // Valor e sinal
        const valorNumerico = parseFloat(entry.valor) || 0;
        if (valorNumerico < 0) {
            signValue.value = '-';
            signBtn.textContent = '-';
            signBtn.style.color = 'red';
            valorInput.value = Math.abs(valorNumerico).toFixed(2);
        } else {
            signValue.value = '+';
            signBtn.textContent = '+';
            valorInput.value = Math.abs(valorNumerico).toFixed(2);
            signBtn.style.color = 'green';
        }
        
        // Categoria / Observações
        catInput.value = entry.categoria || '';
        obsInput.value = entry.obs || '';
        
        // Não precisamos mais inicializar o campo de orçamento aqui,
        // isso será feito pelo script orcamento-date-init.js
        
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
        
        // Exibe modal
        document.getElementById('editModal').style.display = 'flex';
    };

    // Substitui o método editEntry 
    window.lancamentosManager.editEntry = function(rowIndex) {
        try {
            const entry = this.entries.find(e => e.rowIndex === rowIndex);
            if (!entry) {
                this.showMessage('Entrada não encontrada', 'error');
                return;
            }
            this.openEditModal(entry);
        } catch (error) {
            console.error('Erro ao tentar editar entrada:', error);
            this.showMessage('Erro ao abrir o modal de edição', 'error');
        }
    };

    console.log('Patch para LancamentosManager aplicado com sucesso');
});