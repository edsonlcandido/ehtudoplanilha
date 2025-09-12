/**
 * Módulo para gerenciamento dos cards financeiros
 * Responsável por renderizar, atualizar e controlar interatividade dos cards
 */

// Formata valores para moeda brasileira
const formatarMoeda = (valor) => {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

/**
 * Renderiza os cards de resumo dos orçamentos
 * @param {Array} summary - Array de resumos dos orçamentos
 * @param {Object} intervalBudgets - Objeto com orçamentos no intervalo atual como chaves
 * @returns {void}
 */
function renderizarCards(summary, intervalBudgets) {
    const container = document.getElementById('summaryCards');
    if (!container) return;

    // Ordena por orcamento (data) decrescente (mais recente primeiro)
    const sorted = (summary || []).slice().sort((a, b) => b.orcamento - a.orcamento);

    container.innerHTML = '';

    sorted.forEach(item => {
        // Verifica se o orçamento está no intervalo atual
        const isInInterval = intervalBudgets[item.label] === true;

        if (isInInterval) {
            // Cartão ativo - mostra todos os detalhes
            container.appendChild(criarCardAtivo(item));
        } else {
            // Cartão inativo - clicável para mostrar detalhes
            container.appendChild(criarCardInativo(item));
        }
    });

    // Adicionar event listeners para os cartões inativos
    const inactiveCards = container.querySelectorAll('.financial-card.inactive');
    inactiveCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', cardClickHandler);
    });

    // Adicionar event listeners para os botões de fechar dos cartões ativos
    const closeButtons = container.querySelectorAll('.card-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', handleCloseClick);
    });
}

/**
 * Cria um card ativo com todas as informações visíveis
 * @param {Object} item - Dados do orçamento
 * @returns {HTMLElement} Elemento do card
 */
function criarCardAtivo(item) {
    const card = document.createElement('div');
    const cardClass = `financial-card ${item.sum >= 0 ? 'receitas' : 'despesas'} compacto`;
    card.className = cardClass;
    
    // Armazenar dados para uso posterior
    card.dataset.budget = item.label;
    card.dataset.sum = item.sum;
    card.dataset.incomes = item.incomes;
    card.dataset.expenses = item.expenses;
    card.dataset.orcamento = item.orcamento;  // armazena identificador do orçamento
    
    card.innerHTML = `
        <button class="card-close" aria-label="Fechar cartão" data-budget="${item.label}">✕</button>
        <div class="card-header">
            <h3 class="card-title">${item.label}</h3>
        </div>
        <div class="card-value" data-card="${item.label}">${formatarMoeda(item.sum)}</div>

        <div class="card-actions">
            <button class="button pseudo card-toggle" aria-expanded="false">Mostrar detalhes</button>
        </div>

        <div class="card-details">
            <div class="card-muted">Receitas: ${formatarMoeda(item.incomes)}</div>
            <div class="card-muted">Despesas: ${formatarMoeda(item.expenses)}</div>
        </div>
    `;
    
    return card;
}

/**
 * Cria um card inativo (apenas placeholder)
 * @param {Object} item - Dados do orçamento
 * @returns {HTMLElement} Elemento do card
 */
function criarCardInativo(item) {
    const card = document.createElement('div');
    card.className = 'financial-card inactive';
    
    // Armazenar dados para uso posterior
    card.dataset.budget = item.label;
    card.dataset.sum = item.sum;
    card.dataset.incomes = item.incomes;
    card.dataset.expenses = item.expenses;
    card.dataset.orcamento = item.orcamento;  // armazena identificador do orçamento

    card.innerHTML = `
    <div class="card-title">${item.label}</div>
    <div class="card-value">...</div>
    `;
    
    return card;
}

/**
 * Manipula o clique em cartões inativos, expandindo-os
 */
function cardClickHandler() {
    const budget = this.dataset.budget;
    const sum = parseFloat(this.dataset.sum);
    const incomes = parseFloat(this.dataset.incomes);
    const expenses = parseFloat(this.dataset.expenses);
    const orc = Number(this.dataset.orcamento);

    // Adiciona classe clicked para remover hover após ser clicado
    this.classList.add('clicked');
    
    // Remove o cursor pointer
    this.style.cursor = 'default';

    // Substitui o cartão inativo por um cartão detalhado
    const cardClass = `financial-card ${sum >= 0 ? 'receitas' : 'despesas'} compacto`;
    this.className = cardClass + ' clicked';
    this.innerHTML = `
        <button class="card-close" aria-label="Fechar cartão" data-budget="${budget}">✕</button>
        <div class="card-header">
            <h3 class="card-title">${budget}</h3>
        </div>
        <div class="card-value" data-card="${budget}">${formatarMoeda(sum)}</div>

        <div class="card-actions">
            <button class="button pseudo card-toggle" aria-expanded="false">Mostrar detalhes</button>
        </div>

        <div class="card-details">
            <div class="card-muted">Receitas: ${formatarMoeda(incomes)}</div>
            <div class="card-muted">Despesas: ${formatarMoeda(expenses)}</div>
        </div>
    `;

    // Adiciona event listener para o botão de toggle
    const toggleBtn = this.querySelector('.card-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Evita que o clique no botão propague para o cartão
            const card = this.closest('.financial-card');
            const isCompact = card.classList.toggle('compacto');
            this.setAttribute('aria-expanded', String(!isCompact));
            this.textContent = isCompact ? 'Mostrar detalhes' : 'Ocultar detalhes';
        });
    }

    // Adiciona event listener para o botão de fechar
    const closeBtn = this.querySelector('.card-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', handleCloseClick);
    }

    document.dispatchEvent(new CustomEvent('detail:show', { detail: { orcamento: orc } }));
}

/**
 * Manipula o clique no botão de fechar, voltando ao estado inativo
 * @param {Event} e - Evento de clique
 */
function handleCloseClick(e) {
    e.stopPropagation(); // Evita que o clique no botão propague para o cartão
    const card = this.closest('.financial-card');
    const budget = card.dataset.budget;
    const sum = card.dataset.sum || this.dataset.sum;
    const incomes = card.dataset.incomes || this.dataset.incomes;
    const expenses = card.dataset.expenses || this.dataset.expenses;
    
    // Guarda os atributos de dados para quando o cartão inativo for clicado novamente
    card.className = 'financial-card inactive';
    card.style.cursor = 'pointer';
    card.innerHTML = `<div class="card-value">...</div>`;

    // Certifica-se de que os atributos de dados estão preservados
    card.dataset.budget = budget;
    card.dataset.sum = sum;
    card.dataset.incomes = incomes;
    card.dataset.expenses = expenses;
    
    // Remove todos os event listeners antigos antes de adicionar o novo
    card.replaceWith(card.cloneNode(true));
    
    // Recupera a referência após o cloneNode
    const newCard = document.querySelector(`.financial-card.inactive[data-budget="${budget}"]`);
    if (newCard) {
        newCard.style.cursor = 'pointer';
        newCard.addEventListener('click', cardClickHandler);
    }
}

/**
 * Inicializa listeners de eventos globais para os cards
 */
function inicializarEventos() {
    // Toggle por delegação (funciona para cards estáticos e dinâmicos)
    document.getElementById('summaryCards')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.card-toggle');
        if (!btn) return;

        const card = btn.closest('.financial-card');
        const isCompact = card.classList.toggle('compacto');

        // Atualiza estado acessível e rótulo
        btn.setAttribute('aria-expanded', String(!isCompact));
        btn.textContent = isCompact ? 'Mostrar detalhes' : 'Ocultar detalhes';
    });
}

/**
 * Mostra um card de carregamento enquanto os dados são buscados
 */
function mostrarCardCarregamento() {
    const container = document.getElementById('summaryCards');
    if (!container) return;
    
    container.innerHTML = `
                <div class="financial-card loading saldo">
                    <div class="card-header">
                        <h3 class="card-title">dd/mm/yyyy</h3>
                    </div>

                    <div class="card-value" data-card="orcamento1">R$&nbsp;100,00</div>
                    <div class="card-actions">
                        <button class="button pseudo card-toggle" aria-expanded="false">Mostrar
                            detalhes</button>
                    </div>
                    <div class="card-details">
                        <div class="card-muted" data-card="orcamento1">Receitas: R$&nbsp;100,00</div>
                        <div class="card-muted" data-card="orcamento1">Despesas: R$&nbsp;100,00</div>
                    </div>
                </div>
    `;
}

/**
 * Mostra uma mensagem de erro quando os dados não podem ser carregados
 * @param {string} mensagem - Mensagem de erro a ser exibida
 */
function mostrarErro(mensagem = 'Verifique sua conexão e tente novamente') {
    const container = document.getElementById('summaryCards');
    if (!container) return;
    
    container.innerHTML = `
        <div class="financial-card">
            <div class="card-header">
                <h3 class="card-title">Erro ao carregar dados</h3>
            </div>
            <div class="card-value">${mensagem}</div>
        </div>
    `;
}

export {
    renderizarCards,
    mostrarCardCarregamento,
    mostrarErro,
    inicializarEventos,
    formatarMoeda
};