/**
 * Modal de edição de lançamento
 * Inspira-se no entry-modal.js
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
  const inputBudget = qs('#editEntryBudget'); // date
  const inputObs = qs('#editEntryObs');
  const cancelBtn = qs('#cancelEditEntryBtn');

  if (!modal || !closeBtn || !form) {
    console.error('Modal de edição não encontrado.');
    return null;
  }

  // --------- helpers ---------
  const setFeedback = (msg, type = 'info', duration = 3000) => {
    if (!feedback) return;
    feedback.className = 'modal-feedback';
    feedback.classList.add(`modal-feedback--${type}`);
    feedback.textContent = msg;
    feedback.style.display = 'block';
    if (duration > 0) {
      setTimeout(() => (feedback.style.display = 'none'), duration);
    }
  };

  const aplicarEstadoSinal = (isExpense) => {
    if (isExpense) {
      inputSignBtn.textContent = '−';
      inputSignBtn.classList.add('entry-toggle--expense');
      inputSignValue.value = '-';
    } else {
      inputSignBtn.textContent = '+';
      inputSignBtn.classList.remove('entry-toggle--expense');
      inputSignValue.value = '+';
    }
  };

  const toggleSign = () => {
    const isExpense = inputSignBtn.textContent.trim() === '−';
    aplicarEstadoSinal(!isExpense);
  };

  // sinal click
  if (inputSignBtn) inputSignBtn.addEventListener('click', toggleSign);

  // --------- open/close ---------
  const open = (entry) => {
    state.currentEntry = entry || null;

    // Prefill campos
    if (entry) {
      // data: aceitar ISO ou serial Excel (se vier convertido fora)
      if (inputDate) {
        try {
          const d = new Date(entry.data);
          const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          inputDate.value = isoLocal;
        } catch {}
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
        if (typeof orc === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(orc)) {
          inputBudget.value = orc;
        } else if (orc) {
          try {
            const d = new Date(orc);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            inputBudget.value = `${yyyy}-${mm}-${dd}`;
          } catch {}
        }
      }
    } else {
      // reset simples
      form.reset();
      aplicarEstadoSinal(true);
    }

    modal.style.display = 'flex';
    modal.removeAttribute('aria-hidden');
  };

  const close = () => {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  };

  closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (ev) => {
    if (ev.target === modal) close();
  });

  // --------- submit ---------
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const raw = {
      data: inputDate?.value || '',
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

    try {
      const payload = { ...state.currentEntry, ...raw };
      if (onSave) await onSave(payload);
      // também dispara evento global para quem preferir escutar
      document.dispatchEvent(new CustomEvent('entry:edited', { detail: payload }));
      setFeedback('Lançamento atualizado', 'success', 1500);
      setTimeout(close, 200);
    } catch (err) {
      console.error(err);
      setFeedback('Falha ao salvar', 'error');
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
