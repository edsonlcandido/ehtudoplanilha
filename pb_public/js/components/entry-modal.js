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
    const expenseSignValue = document.getElementById('expenseSignValue'); // input hidden que guarda '-' ou '+'
    const expenseValueInput = document.getElementById('expenseValue');
    const expenseCategoryInput = document.getElementById('expenseCategory');
    const expenseAccountInput = document.getElementById('expenseAccount'); // novo campo de conta
    const expenseDescriptionInput = document.getElementById('expenseDescription');
    const expenseDateInput = document.getElementById('expenseDate');
    const expenseBudgetSelect = document.getElementById('expenseBudget'); // agora é um select, não input
    const expenseBudgetCalendar = document.getElementById('expenseBudgetCalendar'); // botão de calendário

    // armazenará os entries injetados, contas e orçamentos únicos
    let injectedEntries = [];
    let fetchedAccounts = []; // lista de contas para autocomplete
    let fetchedBudgets = []; // lista de orçamentos (datas) para autocomplete

    // ----------------------------
    // Utilidades de data e Excel epoch
    // ----------------------------
    
    /**
     * Converte número de data Excel epoch para objeto Date
     * @param {number} excelDate - Data no formato Excel epoch
     * @return {Date|null} - Objeto Date ou null se inválido
     */
    const excelEpochToJsDate = (excelDate) => {
        if (!excelDate || isNaN(excelDate)) return null;
        
        // Excel tem um bug para datas anteriores a 1/3/1900 (Excel considera 1900 como ano bissexto)
        // mas como estamos lidando com datas recentes, isso não afeta nossa conversão
        
        // Excel epoch começa em 1/1/1900, mas conta como dia 1
        // JavaScript epoch começa em 1/1/1970
        // Offset em dias entre Excel e JS: (1900-1970)*365 + quantidade de anos bissextos
        // Simplificação: converter milissegundos e ajustar
        
        // Subtrair 1 porque Excel conta 1/1/1900 como dia 1, não dia 0
        const adjustedDate = excelDate - 25569; // 25569 é 01/01/1970 em Excel epoch
        
        // Converter para milissegundos
        const milliseconds = adjustedDate * 24 * 60 * 60 * 1000;
        
        return new Date(milliseconds);
    };

    /**
     * Formata data para DD/MM/YYYY
     * @param {Date|number} data - Data para formatar (Date ou Excel epoch)
     * @return {string} - Data formatada
     */
    const formatarData = (data) => {
        let date;
        
        if (typeof data === 'number') {
            // Se for número, assumimos Excel epoch
            date = excelEpochToJsDate(data);
        } else if (data instanceof Date) {
            date = data;
        } else {
            return '';
        }
        
        if (!date || isNaN(date.getTime())) return '';
        
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const ano = date.getFullYear();
        
        return `${dia}/${mes}/${ano}`;
    };
    
    /**
     * Converte de DD/MM/YYYY para Date
     * @param {string} texto - Data em formato texto
     * @return {Date|null} - Objeto Date ou null se inválido
     */
    const parseData = (texto) => {
        if (!texto) return null;
        
        const partes = texto.split('/');
        if (partes.length !== 3) return null;
        
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const ano = parseInt(partes[2], 10);
        
        const data = new Date(ano, mes, dia);
        return isNaN(data.getTime()) ? null : data;
    };
    
    // Encontra o próximo orçamento com base na data atual
    const encontrarProximoOrcamento = () => {
        if (!fetchedBudgets || !fetchedBudgets.length) return null;
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        // Ordenar orçamentos por data (crescente)
        const datasOrdenadas = [...fetchedBudgets].sort((a, b) => a - b);
        
        // Encontrar próximo orçamento após a data atual
        for (const serial of datasOrdenadas) {
            const data = excelSerialToDate(serial);
            if (data && data >= hoje) return serial;
        }
        
        // Se não encontrar, retorna o último orçamento
        return datasOrdenadas[datasOrdenadas.length - 1];
    };
    
    // Converte texto DD/MM/YYYY para serial Excel
    const textoParaExcelSerial = (texto) => {
        if (!texto) return null;
        
        const partes = texto.split('/');
        if (partes.length !== 3) return null;
        
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1; // JS usa mês 0-indexado
        const ano = parseInt(partes[2], 10);
        
        if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null;
        
        const data = new Date(ano, mes, dia);
        return toExcelSerial(data);
    };
    
    // ----------------------------
    // Gestão de orçamentos (datas)
    // ----------------------------
    
    /**
     * Inicializa ou atualiza o datalist de orçamentos
     */
    const atualizarSelectOrcamentos = () => {
        if (!expenseBudgetSelect || !fetchedBudgets.length) return;
        
        // Limpar select mantendo apenas a opção padrão
        expenseBudgetSelect.innerHTML = '<option value="">Selecione...</option>';
        
        // Ordenar orçamentos por data (crescente) - datas mais antigas primeiro
        const orcamentosOrdenados = [...fetchedBudgets].sort((a, b) => a - b);
        
        // Formatar como DD/MM/YYYY e adicionar ao select
        const orcamentosFormatados = [];
        const seen = new Set();
        
        for (const serial of orcamentosOrdenados) {
            const dataStr = excelSerialToMonthLabel(serial);
            if (dataStr && !seen.has(dataStr)) {
                seen.add(dataStr);
                const option = document.createElement('option');
                option.value = serial; // Mantém o valor original como Excel serial
                option.textContent = dataStr;
                expenseBudgetSelect.appendChild(option);
            }
        }
    };
    
    /**
     * Inicializa o seletor de data (calendário)
     */
    const inicializarCalendarioOrcamento = () => {
        if (!expenseBudgetCalendar) return;
        
        // Criar input de data oculto para usar o seletor nativo
        const hiddenDatePicker = document.createElement('input');
        hiddenDatePicker.type = 'date';
        hiddenDatePicker.style.position = 'absolute';
        hiddenDatePicker.style.top = '-1000px'; // Esconde fora da tela em vez de display:none
        hiddenDatePicker.style.left = '-1000px';
        hiddenDatePicker.id = 'hiddenBudgetDatePicker';
        document.body.appendChild(hiddenDatePicker);
        
        // Ao clicar no botão, abre o seletor nativo
        expenseBudgetCalendar.addEventListener('click', () => {
            hiddenDatePicker.focus(); // Foca primeiro
            hiddenDatePicker.click(); // Depois clica
        });
        
        // Quando uma data é selecionada
        hiddenDatePicker.addEventListener('change', (e) => {
            const data = new Date(e.target.value);
            // Converte para Excel serial
            const excelSerial = toExcelSerial(data);
            
            // Verifica se já existe a opção ou adiciona uma nova
            let optionExists = false;
            for (let i = 0; i < expenseBudgetSelect.options.length; i++) {
                const option = expenseBudgetSelect.options[i];
                if (Number(option.value) === excelSerial) {
                    optionExists = true;
                    expenseBudgetSelect.selectedIndex = i;
                    break;
                }
            }
            
            if (!optionExists && excelSerial) {
                // Criar nova opção
                const dataFormatada = excelSerialToMonthLabel(excelSerial);
                const option = document.createElement('option');
                option.value = excelSerial;
                option.textContent = dataFormatada;
                expenseBudgetSelect.appendChild(option);
                expenseBudgetSelect.value = excelSerial;
            }
        });
    };
    
    /**
     * Definir o próximo orçamento como valor inicial
     */
    const definirProximoOrcamento = () => {
        if (!expenseBudgetSelect) return;
        
        const proximoOrcamento = encontrarProximoOrcamento();
        if (proximoOrcamento) {
            // Define o valor do select diretamente
            expenseBudgetSelect.value = proximoOrcamento;
        }
    };

    // ---------------------------
    // Código existente mantido, apenas retirando duplicações...
    // ---------------------------

    // Escapa HTML para evitar injeção XSS
    const escapeHtml = (str) => String(str ?? '').replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // cria container de sugestões para descrição (apenas se não existir)
    const ensureDescriptionSuggestionsContainer = () => {
        let container = document.getElementById('descSuggestions');
        if (!container && expenseDescriptionInput) {
            container = document.createElement('div');
            container.id = 'descSuggestions';
            container.classList.add('entry-modal__suggestions');
            container.setAttribute('role', 'listbox');
            container.style.position = 'absolute';
            container.style.zIndex = '1200';
            container.style.background = '#fff';
            container.style.border = '1px solid #e6e6e6';
            container.style.borderRadius = '6px';
            container.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
            container.style.maxHeight = '200px';
            container.style.overflow = 'auto';
            container.style.width = expenseDescriptionInput.offsetWidth + 'px';
            container.style.marginTop = '6px';
            container.style.padding = '6px';
            container.style.display = 'none';
            // posiciona logo abaixo do input
            const parent = expenseDescriptionInput.parentElement;
            parent.style.position = parent.style.position || 'relative';
            parent.appendChild(container);
        }
        return document.getElementById('descSuggestions');
    };

    // gerar sugestões de descrição com base nos entries
    const mostrarSugestoesDescricao = (query) => {
        const container = ensureDescriptionSuggestionsContainer();
        if (!container) return;
        container.innerHTML = '';
        if (!query || query.trim().length < 2 || !Array.isArray(injectedEntries)) {
            container.style.display = 'none';
            return;
        }
        const q = query.trim().toLowerCase();
        // mapeia descrições únicas e, opcionalmente, associa categoria
        const freq = {};
        const descMap = {}; // mapeia descrições para categorias

        injectedEntries.forEach(e => {
            const d = String(e.descricao ?? '').trim();
            if (!d) return;
            const key = d;
            if (key.toLowerCase().includes(q)) {
                freq[key] = (freq[key] || 0) + 1;
                descMap[key] = String(e.categoria ?? '').trim();
            }
        });
        const suggestions = Object.keys(freq)
            .sort((a, b) => freq[b] - freq[a])
            .slice(0, 8);
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }
        suggestions.forEach(s => {
            const item = document.createElement('div');
            item.setAttribute('role', 'option');
            item.classList.add('entry-modal__suggestion');
            item.innerHTML = escapeHtml(s);
            item.addEventListener('click', () => {
                expenseDescriptionInput.value = s;
                container.style.display = 'none';
                expenseDescriptionInput.focus();
                // preenche categoria se houver correspondência
                const categoria = descMap[s];
                if (categoria) {
                    expenseCategoryInput.value = categoria;
                }
            });
            item.addEventListener('mouseenter', () => item.style.background = '#f5f7fa');
            item.addEventListener('mouseleave', () => item.style.background = 'transparent');
            container.appendChild(item);
        });
        container.style.display = 'block';
    };

    // fecha sugestões ao clicar fora
    document.addEventListener('click', (ev) => {
        const container = document.getElementById('descSuggestions');
        if (!container) return;
        if (expenseDescriptionInput && ev.target !== expenseDescriptionInput && !container.contains(ev.target)) {
            container.style.display = 'none';
        }
    });

    // listener do input de descrição
    if (expenseDescriptionInput) {
        expenseDescriptionInput.addEventListener('input', (ev) => {
            mostrarSugestoesDescricao(ev.target.value);
        });
        expenseDescriptionInput.addEventListener('focus', (ev) => {
            mostrarSugestoesDescricao(ev.target.value);
        });
    }

    // ----------------------------
    // lógica do botão de sinal (±)
    // ----------------------------
    // Aplica visual e valor ao botão e ao campo oculto
    const aplicarEstadoSinal = (isExpense) => {
        const simbolo = isExpense ? '−' : '+';
        if (expenseSignBtn) {
            expenseSignBtn.textContent = simbolo;
            expenseSignBtn.setAttribute('aria-pressed', String(isExpense));
            expenseSignBtn.setAttribute('title', isExpense ? 'Marca como despesa' : 'Marca como receita');
            expenseSignBtn.classList.toggle('entry-toggle--expense', isExpense);
            expenseSignBtn.classList.toggle('entry-toggle--income', !isExpense);
            if (isExpense) {
                expenseSignBtn.style.backgroundColor = '#e53935';
                expenseSignBtn.style.color = '#fff';
                expenseSignBtn.style.borderColor = '#e53935';
            } else {
                expenseSignBtn.style.backgroundColor = '';
                expenseSignBtn.style.color = '';
                expenseSignBtn.style.borderColor = '';
            }
        }

        if (expenseSignValue) {
            expenseSignValue.value = isExpense ? '-' : '+';
            const ev = new Event('change', { bubbles: true });
            expenseSignValue.dispatchEvent(ev);
        }

        if (expenseValueInput) {
            expenseValueInput.setAttribute('data-sign', isExpense ? '-' : '+');
        }
    };

    const alternarSinal = () => {
        let atualmenteDespesa = false;
        if (expenseSignValue && expenseSignValue.value) {
            atualmenteDespesa = expenseSignValue.value === '-';
        } else if (expenseSignBtn) {
            atualmenteDespesa = expenseSignBtn.textContent.trim() === '−';
        }
        aplicarEstadoSinal(!atualmenteDespesa);
    };

    const inicializarEstadoSinal = () => {
        // Força início como despesa (sinal negativo)
        const isExpense = true;
        
        // Aplica o estado de despesa sem verificar outros valores
        aplicarEstadoSinal(isExpense);
        
        // Certifica-se que o input hidden tem o valor correto
        if (expenseSignValue) {
            expenseSignValue.value = '-';
        }
    };

    if (expenseSignBtn) {
        expenseSignBtn.setAttribute('role', 'button');
        expenseSignBtn.setAttribute('tabindex', '0');
        if (!expenseSignBtn.hasAttribute('aria-pressed')) {
            expenseSignBtn.setAttribute('aria-pressed', 'false');
        }

        expenseSignBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            alternarSinal();
        });

        expenseSignBtn.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
                ev.preventDefault();
                alternarSinal();
            }
        });
    }

    // inicializa estado
    inicializarEstadoSinal();

    // ----------------------------
    // Autocomplete de contas
    // ----------------------------
    const ensureAccountSuggestionsContainer = () => {
        let container = document.getElementById('accountSuggestions');
        if (!container && expenseAccountInput) {
            container = document.createElement('div');
            container.id = 'accountSuggestions';
            container.classList.add('entry-modal__suggestions');
            container.setAttribute('role', 'listbox');
            const parent = expenseAccountInput.parentElement;
            parent.style.position = parent.style.position || 'relative';
            parent.appendChild(container);
        }
        return container;
    };

    // renderiza sugestões de conta usando classe de item
    const showAccountSuggestions = (query) => {
        const container = ensureAccountSuggestionsContainer();
        if (!container) return;
        container.innerHTML = '';
        if (!query || query.trim().length < 1 || fetchedAccounts.length === 0) {
            container.style.display = 'none';
            return;
        }
        const q = query.trim().toLowerCase();
        const suggestions = fetchedAccounts.filter(acc => acc.toLowerCase().includes(q));
        if (!suggestions.length) {
            container.style.display = 'none';
            return;
        }
        suggestions.forEach(acc => {
            const item = document.createElement('div');
            item.setAttribute('role', 'option');
            item.classList.add('entry-modal__suggestion');
            item.textContent = acc;
            item.addEventListener('click', () => {
                expenseAccountInput.value = acc;
                container.style.display = 'none';
                expenseAccountInput.focus();
            });
            item.addEventListener('mouseenter', () => item.style.background = '#f5f7fa');
            item.addEventListener('mouseleave', () => item.style.background = 'transparent');
            container.appendChild(item);
        });
        container.style.display = 'block';
    };

    document.addEventListener('click', (ev) => {
        const container = document.getElementById('accountSuggestions');
        if (!container) return;
        if (expenseAccountInput && ev.target !== expenseAccountInput && !container.contains(ev.target)) {
            container.style.display = 'none';
        }
    });

    if (expenseAccountInput) {
        expenseAccountInput.addEventListener('focus', (ev) => {
            showAccountSuggestions(ev.target.value);
        });
        expenseAccountInput.addEventListener('input', (ev) => {
            showAccountSuggestions(ev.target.value);
        });
    }

    // ----------------------------
    // Expor função para injetar entries e extrair dados necessários
    // ----------------------------
    const setModalEntries = (entries) => {
        if (!Array.isArray(entries)) return;
        injectedEntries = entries;
        
        // Extrair contas únicas
        const contas = entries
            .map(e => String(e.conta || '').trim())
            .filter(Boolean);
        fetchedAccounts = Array.from(new Set(contas));
        
        // Extrair orçamentos (valores Excel epoch)
        const orcamentos = entries
            .map(e => {
                const orcamento = e.orcamento;
                return typeof orcamento === 'number' && !isNaN(orcamento) ? orcamento : null;
            })
            .filter(Boolean);
        
        fetchedBudgets = Array.from(new Set(orcamentos));
        // Atualiza o select de orçamentos
        atualizarSelectOrcamentos();
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

    // Inicializar componentes de orçamento
    inicializarCalendarioOrcamento();
    
    // retornar objeto público
    return { 
        setModalEntries,
        inicializarEstadoSinal 
    };
}