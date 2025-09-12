/**
 * @module details
 * Gerencia agregados e top categorias ao clicar num card summary
 */
import { detailsTemplate } from './details-template.js';
import { formatarMoeda } from './financial-cards.js';



export function inicializarDetalhes(entries, budgetsInInterval) {
    const container = document.querySelector('.details');
    if (!container) return;

    // Agrupa lançamentos por conta
    const agruparPorConta = list => {
        const mapa = {};
        list.forEach(e => {
            const key = e.conta || 'Sem conta';
            mapa[key] = (mapa[key] || 0) + (e.valor || 0);
        });
        return Object.entries(mapa).map(([conta, total]) => ({ conta, total }));
    };

    // Agrupa lançamentos por categoria
    const agruparPorCategoria = list => {
        const mapa = {};
        list.forEach(e => {
            const key = e.categoria || 'Sem categoria';
            mapa[key] = (mapa[key] || 0) + (e.valor || 0);
        });
        return Object.entries(mapa).map(([categoria, total]) => ({ categoria, total }));
    };

    // Renderiza detalhes para um orçamento específico (pelo número 'orcamento')
    const renderizarDetalhes = orcamentoNum => {
        // injeta template e mostra container
        container.innerHTML = detailsTemplate;
        container.style.display = '';
        // Seletores do DOM
        const elSaldo       = container.querySelector('#detail-saldo');
        const elAccounts    = container.querySelector('#detail-accounts-cards');
        const elCategories  = container.querySelector('#detail-categories-list');
        // filtra lançamentos do orçamento selecionado
        const detalhe = entries.filter(e => e.orcamento === orcamentoNum);
        if (!detalhe.length) return;
        const saldoTotal = detalhe.reduce((acc, e) => acc + (e.valor || 0), 0);

        elSaldo.textContent       = formatarMoeda(saldoTotal);

        // Atualiza cartões de contas
        elAccounts.innerHTML = '';
        agruparPorConta(detalhe).forEach(({ conta, total }) => {
            const card = document.createElement('div');
            card.className = 'details__card';
            card.innerHTML = `
                <div class="details__card-title">${conta}</div>
                <div class="details__card-value">${formatarMoeda(total)}</div>
            `;
            elAccounts.appendChild(card);
        });

        // Atualiza top 10 categorias (apenas despesas)
        elCategories.innerHTML = '';
        agruparPorCategoria(detalhe)
            .filter(item => item.total < 0)
            .sort((a, b) => a.total - b.total)
            .slice(0, 10)
            .forEach((item, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${idx + 1}</td>
                    <td>${item.categoria}</td>
                    <td>${formatarMoeda(item.total)}</td>
                `;
                elCategories.appendChild(tr);
            });
    };

    // Renderização inicial no primeiro orçamento disponível
    if (budgetsInInterval.length > 0) {
        renderizarDetalhes(budgetsInInterval[0].orcamento);
    }

    // Quando o card dispara o evento, passa o 'orcamento' como detail.orcamento
    document.addEventListener('detail:show', ev => {
        renderizarDetalhes(ev.detail.orcamento);
    });

    // exporta toggle global (opcional)
    window.toggleDetalhes = renderizarDetalhes;
}