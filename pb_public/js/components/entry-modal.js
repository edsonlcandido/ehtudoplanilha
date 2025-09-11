import { excelSerialToDate, toExcelSerial, excelSerialToMonthLabel, toExcelSerialDia } from '../utils/sheet-entries.js';
import apiConfig from '../config/api-config.js';

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
    const expenseForm = document.getElementById('expenseForm');

    if (!openModalBtn || !closeModalBtn || !entryModal || !expenseForm) {
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

    // Elemento para feedback de mensagens
    let feedbackElement = document.getElementById('modalFeedback');
    if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.id = 'modalFeedback';
        feedbackElement.className = 'modal-feedback';
        feedbackElement.style.display = 'none';
        
        // Inserir antes dos botões de ação
        const formActions = document.querySelector('.form-actions');
        if (formActions && formActions.parentNode) {
            formActions.parentNode.insertBefore(feedbackElement, formActions);
        }
    }

    // armazenará os entries injetados, contas e orçamentos únicos
    let injectedEntries = [];
    let fetchedAccounts = []; 
    let fetchedBudgets = []; 
    let fetchedCategories = [];
    let fetchedDescriptions = []; // lista de descrições para autocomplete

    // ----------------------------
    // Escapa HTML para evitar injeção XSS
    // ----------------------------
    const escapeHtml = (str) => String(str ?? '').replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

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
    // Autocomplete para categoria
    // ----------------------------
    const ensureCategorySuggestionsContainer = () => {
        let container = document.getElementById('catSuggestions');
        if (!container && expenseCategoryInput) {
            container = document.createElement('div');
            container.id = 'catSuggestions';
            container.classList.add('entry-modal__suggestions');
            container.setAttribute('role', 'listbox');
            const parent = expenseCategoryInput.parentElement;
            parent.style.position = parent.style.position || 'relative';
            parent.appendChild(container);
        }
        return container;
    };

    const mostrarSugestoesCategoria = (query) => {
        const container = ensureCategorySuggestionsContainer();
        if (!container) return;
        container.innerHTML = '';
        if (!query || query.trim().length < 1 || fetchedCategories.length === 0) {
            container.style.display = 'none';
            return;
        }
        const q = query.trim().toLowerCase();
        const suggestions = fetchedCategories.filter(cat => cat.toLowerCase().includes(q));
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
                expenseCategoryInput.value = s;
                container.style.display = 'none';
                expenseCategoryInput.focus();
            });
            container.appendChild(item);
        });
        container.style.display = 'block';
    };

    // ----------------------------
    // Autocomplete para descrição
    // ----------------------------
    const ensureDescriptionSuggestionsContainer = () => {
        let container = document.getElementById('descSuggestions');
        if (!container && expenseDescriptionInput) {
            container = document.createElement('div');
            container.id = 'descSuggestions';
            container.classList.add('entry-modal__suggestions');
            container.setAttribute('role', 'listbox');
            const parent = expenseDescriptionInput.parentElement;
            parent.style.position = parent.style.position || 'relative';
            parent.appendChild(container);
        }
        return container;
    };

    // Correção da função mostrarSugestoesDescricao para preencher a categoria automaticamente
    const mostrarSugestoesDescricao = (query) => {
        const container = ensureDescriptionSuggestionsContainer();
        if (!container) return;
        container.innerHTML = '';
        if (!query || query.trim().length < 1 || fetchedDescriptions.length === 0) {
            container.style.display = 'none';
            return;
        }
        const q = query.trim().toLowerCase();
        const suggestions = fetchedDescriptions.filter(desc => desc.toLowerCase().includes(q));
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
                // Preencher descrição
                expenseDescriptionInput.value = s;
                container.style.display = 'none';
                
                // Buscar categoria correspondente nos entries
                if (injectedEntries && injectedEntries.length > 0 && expenseCategoryInput) {
                    // Encontra o primeiro entry que tem essa descrição
                    const matchEntry = injectedEntries.find(e => 
                        e.descricao && e.descricao.trim().toLowerCase() === s.toLowerCase()
                    );
                    
                    // Se encontrou e tem categoria, preenche o campo
                    if (matchEntry && matchEntry.categoria) {
                        expenseCategoryInput.value = matchEntry.categoria;
                    }
                }
                
                // Manter o foco no campo de descrição
                expenseDescriptionInput.focus();
            });
            container.appendChild(item);
        });
        container.style.display = 'block';
    };

    // ----------------------------
    // Autocomplete para conta
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

    const mostrarSugestoesConta = (query) => {
        const container = ensureAccountSuggestionsContainer();
        if (!container) return;
        container.innerHTML = '';
        if (!query || query.trim().length < 1 || fetchedAccounts.length === 0) {
            container.style.display = 'none';
            return;
        }
        const q = query.trim().toLowerCase();
        const suggestions = fetchedAccounts.filter(acc => acc.toLowerCase().includes(q));
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
                expenseAccountInput.value = s;
                container.style.display = 'none';
                expenseAccountInput.focus();
            });
            container.appendChild(item);
        });
        container.style.display = 'block';
    };

    // Fecha as sugestões ao clicar fora
    document.addEventListener('click', (ev) => {
        const containers = [
            { container: document.getElementById('catSuggestions'), input: expenseCategoryInput },
            { container: document.getElementById('accountSuggestions'), input: expenseAccountInput },
            { container: document.getElementById('descSuggestions'), input: expenseDescriptionInput }
        ];
        
        containers.forEach(({ container, input }) => {
            if (container && input && ev.target !== input && !container.contains(ev.target)) {
                container.style.display = 'none';
            }
        });
    });

    // Adiciona os listeners para os inputs
    if (expenseCategoryInput) {
        expenseCategoryInput.addEventListener('focus', () => {
            mostrarSugestoesCategoria(expenseCategoryInput.value);
        });
        expenseCategoryInput.addEventListener('input', (ev) => {
            mostrarSugestoesCategoria(ev.target.value);
        });
    }

    if (expenseDescriptionInput) {
        expenseDescriptionInput.addEventListener('focus', () => {
            mostrarSugestoesDescricao(expenseDescriptionInput.value);
        });
        expenseDescriptionInput.addEventListener('input', (ev) => {
            mostrarSugestoesDescricao(ev.target.value);
        });
    }

    if (expenseAccountInput) {
        expenseAccountInput.addEventListener('focus', () => {
            mostrarSugestoesConta(expenseAccountInput.value);
        });
        expenseAccountInput.addEventListener('input', (ev) => {
            mostrarSugestoesConta(ev.target.value);
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
        fetchedAccounts = Array.from(new Set(contas)).sort();

        // Extrai descrições únicas
        const descricoes = entries
            .map(e => String(e.descricao || '').trim())
            .filter(Boolean);
        fetchedDescriptions = Array.from(new Set(descricoes)).sort();

        // Extrai orçamentos (normaliza para inteiro)
        const orcamentos = entries
            .map(e => {
                const o = e.orcamento;
                return (typeof o === 'number' && !isNaN(o)) ? Math.trunc(o) : null;
            })
            .filter(Boolean);

        fetchedBudgets = Array.from(new Set(orcamentos)).sort((a,b) => a-b);
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
                    fetchedCategories = detail.categories.filter(Boolean).sort();
                }
            }
            
            // Garante que o sinal é inicializado mesmo após o carregamento dos dados
            inicializarEstadoSinal();
        } catch (err) {
            console.error('Erro ao injetar entries e categorias no modal:', err);
        }
    });

    // ----------------------------
    // Envio do formulário
    // ----------------------------
    
    /**
     * Mostra mensagem de feedback no modal
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo de mensagem ('success', 'error', 'info')
     * @param {number} duration - Duração em ms (0 para não esconder)
     */
    const showFeedback = (message, type = 'info', duration = 3000) => {
        if (!feedbackElement) return;
        
        // Limpar classes anteriores e adicionar a atual
        feedbackElement.className = 'modal-feedback';
        feedbackElement.classList.add(`modal-feedback--${type}`);
        
        feedbackElement.textContent = message;
        feedbackElement.style.display = 'block';
        
        if (duration > 0) {
            setTimeout(() => {
                feedbackElement.style.display = 'none';
            }, duration);
        }
    };
    
    /**
     * Desabilita ou habilita todos os campos e botões do formulário
     */
    const toggleFormFields = (disabled) => {
        const elements = expenseForm.querySelectorAll('input, select, button');
        elements.forEach(el => {
            el.disabled = disabled;
        });
    };
    
    /**
     * Limpa o formulário e reseta para valores iniciais
     */
    const resetForm = () => {
        expenseForm.reset();
        
        // Reinicia o estado do sinal para negativo (despesa)
        inicializarEstadoSinal();
        
        // Preenche a data atual
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
                expenseDateInput.value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
            } else if (typestr === 'time') {
                expenseDateInput.value = `${hh}:${min}`;
            } else {
                expenseDateInput.value = `${yyyy}-${mm}-${dd}`;
            }
        }
        
        // Define o próximo orçamento disponível
        definirProximoOrcamento();
    };
    
    /**
     * Handler para envio do formulário
     */
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        
        try {
            // Desabilitar formulário durante o envio
            toggleFormFields(true);
            
            // Validação básica
            if (!expenseDateInput.value || !expenseAccountInput.value || 
                !expenseValueInput.value || !expenseDescriptionInput.value ||
                !expenseCategoryInput.value || !expenseBudgetInput.value) {
                showFeedback('Por favor, preencha todos os campos obrigatórios.', 'error');
                toggleFormFields(false);
                return;
            }
            
            // Formatar valor com sinal correto
            const valorBase = parseFloat(expenseValueInput.value) || 0;
            const sinal = expenseSignValue.value === '-' ? -1 : 1;
            const valorFinal = sinal * Math.abs(valorBase);
            
            // CORREÇÃO DEFINITIVA PARA ORÇAMENTO (somente dia, inteiro, sem hora)
            const dataBudgetStr = expenseBudgetInput.value; // YYYY-MM-DD
            const [ano, mes, dia] = dataBudgetStr.split('-').map(n => parseInt(n, 10));
            const dataSimples = new Date(ano, mes - 1, dia); // 00:00 local
            const orcamentoSerial = toExcelSerialDia(dataSimples); // sempre inteiro
            
            // String formatada apenas para debug
            const dataFormatada = `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${ano}`;
            
            // Preparar payload para o endpoint
            const payload = {
                data: expenseDateInput.value,
                conta: expenseAccountInput.value,
                valor: valorFinal,
                descricao: expenseDescriptionInput.value,
                categoria: expenseCategoryInput.value,
                orcamento: orcamentoSerial
            };
            
            // Enviar para o endpoint
            const response = await fetch(`${apiConfig.getBaseURL()}/append-entry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.pb.authStore.token}`
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Sucesso
                showFeedback('Lançamento adicionado com sucesso!', 'success');
                
                // Emitir evento para atualizar a lista de entries
                document.dispatchEvent(new CustomEvent('entry:created', { 
                    detail: { entry: payload }
                }));
                
                // Reset do formulário
                resetForm();
                
                // Não fechar o modal após sucesso, para permitir mais lançamentos
                toggleFormFields(false);
            } else {
                // Erro retornado pelo servidor
                const errorMsg = data.error || 'Ocorreu um erro ao salvar o lançamento.';
                showFeedback(errorMsg, 'error');
                toggleFormFields(false);
            }
        } catch (error) {
            console.error('Erro ao enviar lançamento:', error);
            showFeedback('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
            toggleFormFields(false);
        }
    };
    
    // Adicionar listener para o formulário
    expenseForm.addEventListener('submit', handleFormSubmit);

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
        
        // Esconder mensagens anteriores
        if (feedbackElement) {
            feedbackElement.style.display = 'none';
        }

        // Exibe o modal e REMOVE o aria-hidden para corrigir erro de acessibilidade
        entryModal.style.display = 'flex';
        entryModal.removeAttribute('aria-hidden');
        openModalBtn.classList.add('active');
        openModalBtn.setAttribute('aria-label', 'Fechar modal');
    };

    const closeModal = () => {
        // Oculta o modal e configura aria-hidden="true" apenas quando fechado
        entryModal.style.display = 'none';
        entryModal.setAttribute('aria-hidden', 'true');
        openModalBtn.classList.remove('active');
        openModalBtn.setAttribute('aria-label', 'Adicionar lançamento');
        
        // Esconde as sugestões
        const containers = [
            document.getElementById('catSuggestions'),
            document.getElementById('accountSuggestions'),
            document.getElementById('descSuggestions')
        ];
        
        containers.forEach(container => {
            if (container) container.style.display = 'none';
        });
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
    
    // Inicializar o estado do sinal ao carregar
    inicializarEstadoSinal();
    
    // Garantir que o modal comece com aria-hidden="true"
    entryModal.setAttribute('aria-hidden', 'true');
    
    // retornar objeto público
    return { 
        setModalEntries,
        inicializarEstadoSinal,
        showFeedback,
        resetForm
    };
}