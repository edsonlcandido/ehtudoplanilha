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

    const openModal = () => {
        entryModal.style.display = 'flex';
        openModalBtn.classList.add('active');
        openModalBtn.setAttribute('aria-label', 'Fechar modal');
    };

    const closeModal = () => {
        entryModal.style.display = 'none';
        openModalBtn.classList.remove('active');
        openModalBtn.setAttribute('aria-label', 'Adicionar lançamento');
    };

    // Alterna a exibição do modal ao clicar no botão '+'
    openModalBtn.addEventListener('click', () => {
        const isModalVisible = entryModal.style.display === 'flex';
        if (isModalVisible) {
            closeModal();
        } else {
            openModal();
        }
    });

    // Fecha o modal ao clicar no botão 'x'
    closeModalBtn.addEventListener('click', closeModal);

    // Fecha o modal ao clicar fora da área de conteúdo (no fundo escuro)
    entryModal.addEventListener('click', (event) => {
        if (event.target === entryModal) {
            closeModal();
        }
    });
}