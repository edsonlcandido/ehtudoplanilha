import { excelSerialToDate, toExcelSerial, excelSerialToMonthLabel } from '../utils/sheet-entries.js';

/**
 * @module entry-modal
 * @description Gerencia a exibição e o fechamento do modal de lançamento.
 */

/**
 * Inicializa os eventos para abrir e fechar o modal de lançamento de despesas/receitas.
 */
export function inicializarModalDeLancamento() {
    const openModalBtn = document.getElementById('openEntryModal');
    const closeModalBtn = document.getElementById('closeEntryModal');
    const entryModal = document.getElementById('entryModal');

    if (!openModalBtn || !closeModalBtn || !entryModal) {
        console.error('Elementos do modal não encontrados. A funcionalidade pode estar comprometida.');
        return;
    }

    // elementos do formulário
    const expenseSignBtn = document.getElementById('expenseSignBtn');
    const expenseSignValue = document.getElementById('expenseSignValue');
    const expenseValueInput = document.getElementById('expenseValue');
    const expenseCategoryInput = document.getElementById('expenseCategory');
    const expenseAccountInput = document.getElementById('expenseAccount');
    const expenseDescriptionInput = document.getElementById('expenseDescription');
    const expenseDateInput = document.getElementById('expenseDate');
    const expenseBudgetInput = document.getElementById('expenseBudget'); // input type="date"

    // armazenará os entries injetados, contas e orçamentos únicos
    let injectedEntries = [];
    let fetchedAccounts = []; 
    let fetchedBudgets = []; // lista de orçamentos (datas) para autocomplete
    let fetchedCategories = []; // lista de categorias para autocomplete

    // ----------------------------
    // Funções de toggle para sinal (+/-)
    // ----------------------------
    
    const aplicarEstadoSinal = (isExpense) => {
        if (!expenseSignBtn || !expenseSignValue) return;
        
        // Atualiza a aparência do botão
        if (isExpense) {
            expenseSignBtn.textContent = '−';
            expenseSignBtn.classList.add('entry-toggle--expense');
            expenseSignValue.value = '-';
        } else {
            expenseSignBtn.textContent = '+';
            expenseSignBtn.classList.remove('entry-toggle--expense');
            expenseSignValue.value = '+';
        }
    };

    const inicializarEstadoSinal = () => {
        // Força início como despesa (sinal negativo)
        const isExpense = true;
        aplicarEstadoSinal(isExpense);
    };

    // Toggle do sinal quando o botão é clicado
    if (expenseSignBtn) {
        expenseSignBtn.addEventListener('click', () => {
            const isCurrentlyExpense = expenseSignBtn.textContent.trim() === '−';
            aplicarEstadoSinal(!isCurrentlyExpense);
        });
    }

    // ----------------------------
    // Simplificação da gestão de orçamentos
    // ----------------------------
    
    /**
     * Encontra o próximo orçamento com base na data atual
     * @return {Date|null} - Data do próximo orçamento ou null se não houver
     */
    const encontrarProximoOrcamento = () => {
        if (!fetchedBudgets || !fetchedBudgets.length) return null;
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        // Converter valores Excel epoch para Date e ordenar
        const datasOrdenadas = fetchedBudgets
            .map(serial => excelSerialToDate(serial))
            .filter(date => date !== null)
            .sort((a, b) => a - b);
        
        // Encontrar próximo orçamento após a data atual
        for (const data of datasOrdenadas) {
            if (data >= hoje) return data;
        }
        
        // Se não encontrar, retorna o último orçamento
        return datasOrdenadas[datasOrdenadas.length - 1] || null;
    };
    
    /**
     * Define o próximo orçamento como valor inicial
     */
    const definirProximoOrcamento = () => {
        if (!expenseBudgetInput) return;
        
        const proximaData = encontrarProximoOrcamento();
        if (proximaData) {
            // Formatar data para o formato aceito pelo input type="date": YYYY-MM-DD
            const yyyy = proximaData.getFullYear();
            const mm = String(proximaData.getMonth() + 1).padStart(2, '0');
            const dd = String(proximaData.getDate()).padStart(2, '0');
            expenseBudgetInput.value = `${yyyy}-${mm}-${dd}`;
        }
    };

    // ----------------------------
    // Expor função para injetar entries e extrair dados necessários
    // ----------------------------
    const setModalEntries = (entries) => {
        if (!Array.isArray(entries)) return;
        injectedEntries = entries;
        
        // Extrai contas únicas
        const contas = entries
            .map(e => String(e.conta || '').trim())
            .filter(Boolean);
        fetchedAccounts = Array.from(new Set(contas));
        
        // Extrai orçamentos (valores Excel epoch)
        const orcamentos = entries
            .map(e => {
                const orcamento = e.orcamento;
                return typeof orcamento === 'number' && !isNaN(orcamento) ? orcamento : null;
            })
            .filter(Boolean);
        
        fetchedBudgets = Array.from(new Set(orcamentos));
    };

    // ouvir evento global disparado por index.html após fetch dos entries
    document.addEventListener('sheet:loaded', (ev) => {
        try {
            const detail = ev?.detail;
            if (detail) {
                if (Array.isArray(detail.entries)) {
                    setModalEntries(detail.entries);
                }
                if (Array.isArray(detail.categories)) {
                    fetchedCategories = detail.categories;
                }
            }
            
            // Garante que o sinal é inicializado mesmo após o carregamento dos dados
            inicializarEstadoSinal();
        } catch (err) {
            console.error('Erro ao injetar entries e categorias no modal:', err);
        }
    });

    // ----------------------------
    // controle de abertura/fechamento do modal
    // ----------------------------
    const openModal = () => {
        // preenche data/hora atual no campo apropriado
        if (expenseDateInput) {
            const now = new Date();
            const pad = (v) => String(v).padStart(2, '0');
            const yyyy = now.getFullYear();
            const mm = pad(now.getMonth() + 1);
            const dd = pad(now.getDate());
            const hh = pad(now.getHours());
            const min = pad(now.getMinutes());

            const typestr = (expenseDateInput.getAttribute('type') || '').toLowerCase();
            if (typestr === 'datetime-local') {
                // formato: YYYY-MM-DDTHH:MM
                expenseDateInput.value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
            } else if (typestr === 'time') {
                // formato: HH:MM
                expenseDateInput.value = `${hh}:${min}`;
            } else {
                // padrão date -> YYYY-MM-DD
                expenseDateInput.value = `${yyyy}-${mm}-${dd}`;
            }
        }

        // Reinicializa o sinal como despesa ao abrir o modal
        inicializarEstadoSinal();
        
        // Define o próximo orçamento disponível
        definirProximoOrcamento();

        entryModal.style.display = 'flex';
        openModalBtn.classList.add('active');
        openModalBtn.setAttribute('aria-label', 'Fechar modal');
    };

    const closeModal = () => {
        entryModal.style.display = 'none';
        openModalBtn.classList.remove('active');
        openModalBtn.setAttribute('aria-label', 'Adicionar lançamento');
        const container = document.getElementById('descSuggestions');
        if (container) container.style.display = 'none';
    };

    openModalBtn.addEventListener('click', () => {
        const isModalVisible = entryModal.style.display === 'flex';
        if (isModalVisible) {
            closeModal();
        } else {
            openModal();
        }
    });

    closeModalBtn.addEventListener('click', closeModal);

    entryModal.addEventListener('click', (event) => {
        if (event.target === entryModal) {
            closeModal();
        }
    });

    // Removida a chamada para inicializarCalendarioOrcamento que não existe mais
    // inicializarCalendarioOrcamento();
    
    // Inicializar o estado do sinal ao carregar
    inicializarEstadoSinal();
    
    // retornar objeto público
    return { 
        setModalEntries,
        inicializarEstadoSinal 
    };
}