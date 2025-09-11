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
    const categoriaDatalist = document.getElementById('categoriaList');
    const expenseDescriptionInput = document.getElementById('expenseDescription');
    const expenseDateInput = document.getElementById('expenseDate'); // <input type="date" id="expenseDate">

    // armazenará os entries injetados
    let injectedEntries = [];

    // ----------------------------
    // Funções de autocomplete / sugestões
    // ----------------------------
    const escapeHtml = (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    // popula <datalist> de categorias a partir dos entries
    const popularCategoriasFromEntries = (entries) => {
        if (!categoriaDatalist || !Array.isArray(entries)) return;
        const seen = new Set();
        entries.forEach(e => {
            const c = String(e.categoria ?? '').trim();
            if (c) seen.add(c);
        });
        const list = Array.from(seen).sort((a, b) => a.localeCompare(b, 'pt-BR'));
        categoriaDatalist.innerHTML = list.map(c => `<option value="${escapeHtml(c)}">`).join('');
    };

    // cria container de sugestões para descrição (apenas se não existir)
    const ensureDescriptionSuggestionsContainer = () => {
        let container = document.getElementById('descSuggestions');
        if (!container && expenseDescriptionInput) {
            container = document.createElement('div');
            container.id = 'descSuggestions';
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
        // mapear descrições únicas e contar ocorrências para ordenar por frequência
        const freq = {};
        const descMap = {}; // mapeia descrições para categorias


        injectedEntries.forEach(e => {
            const d = String(e.descricao ?? '').trim();
            if (!d) return;
            const key = d;
            if (key.toLowerCase().includes(q)) freq[key] = (freq[key] || 0) + 1;
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
            item.style.padding = '6px 8px';
            item.style.cursor = 'pointer';
            item.style.borderRadius = '4px';
            item.style.fontSize = '0.95rem';
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
        let isExpense = false;
        if (expenseSignValue && expenseSignValue.value) {
            isExpense = expenseSignValue.value === '-';
        } else if (expenseSignBtn) {
            isExpense = expenseSignBtn.textContent.trim() === '−';
        }
        aplicarEstadoSinal(isExpense);
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
    // Expor função para injetar entries programaticamente
    // ----------------------------
    const setModalEntries = (entries) => {
        if (!Array.isArray(entries)) return;
        injectedEntries = entries;
        popularCategoriasFromEntries(entries);
    };

    // ouvir evento global disparado por index.html após fetch dos entries
    document.addEventListener('sheet:loaded', (ev) => {
        try {
            const entries = ev?.detail ?? [];
            setModalEntries(entries);
        } catch (err) {
            // erro não impede funcionamento do modal
            console.error('Erro ao injetar entries no modal:', err);
        }
    });

    // ----------------------------
    // controle de abertura/fechamento do modal
    // ----------------------------
    const openModal = () => {
        // preenche data/hora atual no campo apropriado (suporta date, time e datetime-local)
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

    // retornar um objeto público opcional (útil para testes / chamadas diretas)
    return { setModalEntries };
}