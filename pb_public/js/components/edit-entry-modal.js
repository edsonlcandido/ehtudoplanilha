/**
 * Modal de edição de lançamento - Componente autônomo
 * Inspirado no entry-modal.js mas completamente independente
 */
export function inicializarModalDeEdicao({ onSave } = {}) {
  const state = {
    currentEntry: null,
    entries: [],
    accounts: [],
    categories: [],
    descriptions: [],
    budgets: [],
  };

  // Utilidades
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  const modal = qs('#editEntryModal');
  const closeBtn = qs('#closeEditEntryModal');
  const form = qs('#editEntryForm');
  const feedback = qs('#editEntryFeedback');

  const inputDate = qs('#editEntryDate');
  const inputAccount = qs('#editEntryAccount');
  const inputDescription = qs('#editEntryDescription');
  const inputValue = qs('#editEntryValue');
  const inputSignBtn = qs('#editEntrySignBtn');
  const inputSignValue = qs('#editEntrySignValue');
  const inputCategory = qs('#editEntryCategory');
  const inputBudget = qs('#editEntryBudget');
  const inputObs = qs('#editEntryObs');
  const cancelBtn = qs('#cancelEditEntryBtn');

  if (!modal || !closeBtn || !form) {
    console.error('Modal de edição não encontrado.');
    return null;
  }

  // --------- Helpers e Utilitários ---------
  const setFeedback = (msg, type = 'info', duration = 3000) => {
    if (!feedback) return;
    feedback.className = 'edit-modal-feedback';
    
    switch(type) {
      case 'success':
        feedback.className += ' edit-modal-feedback--success';
        break;
      case 'error':
        feedback.className += ' edit-modal-feedback--error';
        break;
      case 'info':
      default:
        feedback.className += ' edit-modal-feedback--info';
        break;
    }
    
    feedback.style.display = 'block';
    feedback.textContent = msg;
    
    if (duration > 0) {
      setTimeout(() => {
        feedback.style.display = 'none';
      }, duration);
    }
  };

  const aplicarEstadoSinal = (isExpense) => {
    if (isExpense) {
      inputSignBtn.textContent = '−';
      inputSignBtn.className = 'entry-toggle edit-toggle--expense';
      inputSignValue.value = '-';
    } else {
      inputSignBtn.textContent = '+';
      inputSignBtn.className = 'entry-toggle edit-toggle--income';
      inputSignValue.value = '+';
    }
  };

  const toggleSign = () => {
    const isExpense = inputSignBtn.textContent.trim() === '−';
    aplicarEstadoSinal(!isExpense);
  };

  // Listener para toggle de sinal
  if (inputSignBtn) inputSignBtn.addEventListener('click', toggleSign);

  // --------- Autocomplete e Sugestões ---------
  const createSuggestionsContainer = (containerId, parentElement) => {
    let container = qs(`#${containerId}`);
    if (!container && parentElement) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = 'edit-modal__suggestions';
      container.setAttribute('role', 'listbox');
      parentElement.style.position = 'relative';
      parentElement.appendChild(container);
    }
    return container;
  };

  const showSuggestions = (input, suggestions, onSelect) => {
    const container = createSuggestionsContainer(
      `${input.id}Suggestions`, 
      input.parentElement
    );
    if (!container) return;

    container.innerHTML = '';
    if (!suggestions || suggestions.length === 0) {
      container.style.display = 'none';
      return;
    }

    suggestions.forEach(suggestion => {
      const item = document.createElement('div');
      item.className = 'edit-modal__suggestion';
      item.textContent = suggestion;
      item.addEventListener('click', () => {
        onSelect(suggestion);
        container.style.display = 'none';
        input.focus();
      });
      item.addEventListener('mouseenter', () => {
        item.classList.add('edit-modal__suggestion--highlighted');
      });
      item.addEventListener('mouseleave', () => {
        item.classList.remove('edit-modal__suggestion--highlighted');
      });
      container.appendChild(item);
    });
    
    container.style.display = 'block';
  };

  const setupAutocomplete = (input, getSuggestions, onSelect) => {
    if (!input || input.dataset.autocompleteSetup) return;

    const showFilteredSuggestions = (query) => {
      const suggestions = getSuggestions();
      const filtered = suggestions.filter(item => 
        item.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8); // Limita a 8 sugestões
      showSuggestions(input, filtered, onSelect);
    };

    input.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (query.length >= 1) {
        showFilteredSuggestions(query);
      } else {
        const container = qs(`#${input.id}Suggestions`);
        if (container) container.style.display = 'none';
      }
    });

    input.addEventListener('focus', () => {
      if (input.value.trim()) {
        showFilteredSuggestions(input.value.trim());
      }
    });

    // Esconder sugestões ao clicar fora
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !input.parentElement.contains(e.target)) {
        const container = qs(`#${input.id}Suggestions`);
        if (container) container.style.display = 'none';
      }
    });

    input.dataset.autocompleteSetup = 'true';
  };

  // --------- Geração de Dados para Autocomplete --------- 
  const getUniqueValues = (field) => {
    if (!state.entries || !Array.isArray(state.entries)) return [];
    
    const values = state.entries
      .map(e => String(e[field] || '').trim())
      .filter(Boolean);
    
    return [...new Set(values)].sort();
  };

  const getDefaultAccounts = () => [
    'Conta Corrente', 'Poupança', 'Cartão de Crédito', 
    'Cartão de Débito', 'Dinheiro', 'PIX'
  ];

  const getDefaultCategories = () => [
    'Alimentação', 'Transporte', 'Moradia', 'Saúde', 
    'Educação', 'Lazer', 'Vestuário', 'Outros'
  ];

  // --------- Configuração de Autocomplete ---------
  const setupAllAutocomplete = () => {
    // Autocomplete para conta
    setupAutocomplete(
      inputAccount,
      () => {
        const unique = getUniqueValues('conta');
        return unique.length > 0 ? unique : getDefaultAccounts();
      },
      (value) => {
        inputAccount.value = value;
      }
    );

    // Autocomplete para categoria
    setupAutocomplete(
      inputCategory,
      () => {
        const unique = getUniqueValues('categoria');
        return unique.length > 0 ? unique : getDefaultCategories();
      },
      (value) => {
        inputCategory.value = value;
      }
    );

    // Autocomplete para descrição (com auto-preenchimento de categoria)
    setupAutocomplete(
      inputDescription,
      () => getUniqueValues('descricao'),
      (value) => {
        inputDescription.value = value;
        
        // Auto-preenche categoria baseada na descrição
        if (inputCategory && state.entries) {
          const matchEntry = state.entries.find(e => 
            e.descricao && e.descricao.trim().toLowerCase() === value.toLowerCase()
          );
          
          if (matchEntry && matchEntry.categoria && !inputCategory.value.trim()) {
            inputCategory.value = matchEntry.categoria;
          }
        }
      }
    );
  };

  // --------- Função para atualizar via API ---------
  const updateEntryViaAPI = async (payload) => {
    try {
      const response = await fetch(`${window.pb.baseUrl}/edit-sheet-entry`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${window.pb.authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rowIndex: payload.rowIndex,
          data: payload.data,
          conta: payload.conta,
          valor: payload.valor,
          descricao: payload.descricao,
          categoria: payload.categoria,
          orcamento: payload.orcamento,
          obs: payload.observacoes || payload.obs
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar lançamento');
      }

      return data;
    } catch (error) {
      console.error('Erro na API de edição:', error);
      throw error;
    }
  };

  // --------- open/close ---------
  const open = (entry) => {
    state.currentEntry = entry || null;

    // Configurar autocomplete apenas uma vez
    if (!modal.dataset.autocompleteSetup) {
      setupAllAutocomplete();
      modal.dataset.autocompleteSetup = 'true';
    }

    // Prefill campos
    if (entry) {
      // data: aceitar ISO ou serial Excel (se vier convertido fora)
      if (inputDate) {
        try {
          let dateValue = entry.data;
          
          // Se for número (serial Excel), converter
          if (typeof dateValue === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            dateValue = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
          } else if (typeof dateValue === 'string') {
            // Se for string, tentar converter
            dateValue = new Date(dateValue);
          }
          
          const isoLocal = new Date(dateValue.getTime() - dateValue.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          inputDate.value = isoLocal;
        } catch {
          inputDate.value = '';
        }
      }
      if (inputAccount) inputAccount.value = entry.conta || '';
      if (inputDescription) inputDescription.value = entry.descricao || '';
      if (inputCategory) inputCategory.value = entry.categoria || '';
      if (inputObs) inputObs.value = entry.observacoes || entry.obs || '';

      const valorAbs = Math.abs(Number(entry.valor || 0));
      if (!isFinite(valorAbs)) {
        inputValue.value = '';
        aplicarEstadoSinal(true);
      } else {
        inputValue.value = valorAbs;
        aplicarEstadoSinal(Number(entry.valor) < 0);
      }

      // orçamento (date input) aceita YYYY-MM-DD
      if (inputBudget) {
        const orc = entry.orcamento;
        console.log('Valor do orçamento original:', orc, 'Tipo:', typeof orc);
        
        if (typeof orc === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(orc)) {
          // Já está no formato correto
          inputBudget.value = orc;
        } else if (typeof orc === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(orc)) {
          // Formato dd/MM/yyyy - converter para yyyy-MM-dd
          try {
            const [dia, mes, ano] = orc.split('/');
            inputBudget.value = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
          } catch {
            inputBudget.value = '';
          }
        } else if (typeof orc === 'string' && orc.includes('/')) {
          // Formato "setembro/25" - converter para data do primeiro dia do mês
          try {
            const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
            const [mesNome, anoCurto] = orc.split('/');
            const mesIndex = meses.indexOf(mesNome.toLowerCase());
            if (mesIndex !== -1) {
              const ano = parseInt('20' + anoCurto);
              const mes = String(mesIndex + 1).padStart(2, '0');
              inputBudget.value = `${ano}-${mes}-01`;
            } else {
              inputBudget.value = '';
            }
          } catch {
            inputBudget.value = '';
          }
        } else if (typeof orc === 'number') {
          // Serial Excel para data
          try {
            const excelEpoch = new Date(1899, 11, 30);
            const d = new Date(excelEpoch.getTime() + orc * 24 * 60 * 60 * 1000);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            inputBudget.value = `${yyyy}-${mm}-${dd}`;
          } catch {
            inputBudget.value = '';
          }
        } else {
          inputBudget.value = '';
        }
        
        console.log('Valor final do input orçamento:', inputBudget.value);
      }
    } else {
      // reset simples
      form.reset();
      aplicarEstadoSinal(true);
    }

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  };

  const close = () => {
    // Remove o foco antes de fechar para evitar problemas de acessibilidade
    if (document.activeElement && modal.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  };

  closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (ev) => {
    if (ev.target === modal) close();
  });

  // Gerenciamento de foco para melhor acessibilidade
  modal.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      close();
    }
  });

  // --------- submit ---------
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    
    // Converter datetime-local para formato dd/MM/yyyy HH:mm
    const formatDateTimeForSheet = (datetimeLocal) => {
      if (!datetimeLocal) return '';
      try {
        const dt = new Date(datetimeLocal);
        const pad = (v) => String(v).padStart(2, '0');
        const dd = pad(dt.getDate());
        const mm = pad(dt.getMonth() + 1);
        const yyyy = dt.getFullYear();
        const hh = pad(dt.getHours());
        const min = pad(dt.getMinutes());
        return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
      } catch {
        return '';
      }
    };

    const raw = {
      rowIndex: state.currentEntry?.rowIndex,
      data: formatDateTimeForSheet(inputDate?.value),
      conta: inputAccount?.value?.trim() || '',
      descricao: inputDescription?.value?.trim() || '',
      categoria: inputCategory?.value?.trim() || '',
      orcamento: inputBudget?.value || '',
      observacoes: inputObs?.value?.trim() || '',
      valor: (() => {
        const v = Number(inputValue?.value || 0);
        const sign = inputSignValue?.value === '-' ? -1 : 1;
        return isFinite(v) ? v * sign : 0;
      })(),
    };

    // validações mínimas
    if (!raw.descricao || !raw.categoria) {
      setFeedback('Descrição e Categoria são obrigatórias', 'error');
      return;
    }

    if (!raw.rowIndex) {
      setFeedback('Erro: entrada não identificada', 'error');
      return;
    }

    try {
      // Desabilitar botões e mostrar loading
      const saveBtn = form.querySelector('#saveEditEntryBtn');
      const cancelBtn = form.querySelector('#cancelEditEntryBtn');
      
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Salvando...';
      }
      if (cancelBtn) {
        cancelBtn.disabled = true;
      }
      
      setFeedback('Salvando...', 'info', 0);
      
      // Tentar usar callback fornecido primeiro
      if (onSave) {
        await onSave(raw);
      } else {
        // Fallback: usar API diretamente
        await updateEntryViaAPI(raw);
      }
      
      // Disparar evento global para notificar outros componentes
      document.dispatchEvent(new CustomEvent('entry:edited', { detail: raw }));
      
      setFeedback('Lançamento atualizado com sucesso!', 'success', 2000);
      setTimeout(close, 300);
      
      // Recarregar a lista se o gerenciador estiver disponível
      if (window.lancamentosManager && typeof window.lancamentosManager.loadEntries === 'function') {
        setTimeout(() => {
          window.lancamentosManager.loadEntries();
        }, 500);
      }
      
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setFeedback(`Falha ao salvar: ${err.message}`, 'error');
    } finally {
      // Reabilitar botões
      const saveBtn = form.querySelector('#saveEditEntryBtn');
      const cancelBtn = form.querySelector('#cancelEditEntryBtn');
      
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar';
      }
      if (cancelBtn) {
        cancelBtn.disabled = false;
      }
    }
  };

  form.addEventListener('submit', handleSubmit);

  // ---------- API pública ----------
  return {
    open,
    close,
    setEntries(entries = []) {
      state.entries = Array.isArray(entries) ? entries : [];
      // popula caches simples
      state.accounts = [...new Set(state.entries.map(e => (e.conta || '').trim()).filter(Boolean))].sort();
      state.categories = [...new Set(state.entries.map(e => (e.categoria || '').trim()).filter(Boolean))].sort();
      state.descriptions = [...new Set(state.entries.map(e => (e.descricao || '').trim()).filter(Boolean))].sort();
      state.budgets = [...new Set(state.entries.map(e => e.orcamento).filter(Boolean))].sort();
    },
  };
}
