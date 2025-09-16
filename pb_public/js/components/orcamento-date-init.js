/**
 * Script para inicializar o input de data do orçamento
 * Utiliza as funções já existentes em sheet-entries.js
 */

import { excelSerialToDate } from '../utils/sheet-entries.js';

document.addEventListener('DOMContentLoaded', function() {
    // Função para converter o valor de orçamento para o formato do input type="date"
    function formatarOrcamentoParaInputDate(orcamento) {
        let dateObj;
        
        // Se for número (serial Excel), converte para Date
        if (typeof orcamento === 'number' && !isNaN(orcamento)) {
            dateObj = excelSerialToDate(orcamento);
        } 
        // Se for string no formato dd/MM/yyyy
        else if (typeof orcamento === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(orcamento)) {
            const [dia, mes, ano] = orcamento.split('/').map(n => parseInt(n, 10));
            dateObj = new Date(ano, mes - 1, dia);
        }
        // Outros formatos
        else if (orcamento) {
            try {
                dateObj = new Date(orcamento);
            } catch (e) {
                dateObj = new Date(); // Data atual como fallback
            }
        } else {
            dateObj = new Date(); // Data atual como fallback
        }
        
        // Se a data não for válida, usa a data atual
        if (!dateObj || isNaN(dateObj.getTime())) {
            dateObj = new Date();
        }
        
        // Formata para YYYY-MM-DD
        const pad = n => String(n).padStart(2, '0');
        return `${dateObj.getFullYear()}-${pad(dateObj.getMonth()+1)}-${pad(dateObj.getDate())}`;
    }

    // Observa quando o modal de edição é aberto
    const editModal = document.getElementById('editModal');
    if (editModal) {
        // Função para inicializar o campo quando o modal é aberto
        function inicializarCampoOrcamento() {
            const orcamentoInput = document.getElementById('editOrcamento');
            if (!orcamentoInput) return;
            
            // Verifica se há uma entrada sendo editada
            if (window.lancamentosManager && window.lancamentosManager.currentEditingEntry) {
                const entry = window.lancamentosManager.currentEditingEntry;
                
                // Converte o valor de orçamento para o formato de input date
                if (entry.orcamento !== undefined && entry.orcamento !== null) {
                    orcamentoInput.value = formatarOrcamentoParaInputDate(entry.orcamento);
                } else {
                    // Se não houver valor, usa a data atual
                    const now = new Date();
                    const pad = n => String(n).padStart(2, '0');
                    orcamentoInput.value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
                }
            }
        }
        
        // Observa mudanças no estilo do modal para detectar quando é aberto
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style' && 
                    editModal.style.display === 'flex') {
                    // Modal foi aberto, inicializa o campo após um breve delay
                    setTimeout(inicializarCampoOrcamento, 50);
                }
            });
        });
        
        // Configura a observação
        observer.observe(editModal, { attributes: true });
    }
    
    console.log('Script de inicialização do campo de orçamento carregado');
});