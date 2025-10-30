/**
 * @module details
 * Gerencia agregados e top categorias ao clicar num card summary
 */
import { detailsTemplate } from './details-template.js';
import { formatarMoeda } from './financial-cards.js';



export function inicializarDetalhes(entries, budgetsInInterval) {
    const container = document.querySelector('.details');
    if (!container) return;

    // estado de orçamentos selecionados e entries
    let selectedBudgets = budgetsInInterval.map(b => b.orcamento);
    let currentEntries = entries || [];

    // Função para atualizar dados com novo lançamento
    const atualizarDadosComNovoLancamento = (entry, allEntries, newBudgetsInInterval) => {
        if (!allEntries || !newBudgetsInInterval) return;
        
        currentEntries = allEntries;
        // Atualiza a lista de orçamentos se disponível, mas mantém a seleção
        if (Array.isArray(newBudgetsInInterval)) {
            // Apenas atualiza se houver novos orçamentos
            renderizarDetalhes(selectedBudgets);
        }
    };

    // Ouvir evento de atualização dos cards
    document.addEventListener('cards:updated', (ev) => {
        const { entry, allEntries, budgetsInInterval } = ev.detail || {};
        atualizarDadosComNovoLancamento(entry, allEntries, budgetsInInterval);
    });

    // Agrupa lançamentos por conta
    const agruparPorConta = list => {
        const mapa = {};
        list.forEach(e => {
            // ignora lançamentos sem conta definida
            if (!e.conta) return;
            mapa[e.conta] = (mapa[e.conta] || 0) + (e.valor || 0);
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
    const renderizarDetalhes = orcamentos => {
        // aceita número ou array
        const orcNums = Array.isArray(orcamentos) ? orcamentos : [orcamentos];
         // injeta template e mostra container
         container.innerHTML = detailsTemplate;
         container.style.display = '';
         // Seletores do DOM
         const elSaldo       = container.querySelector('#detail-saldo');
         const elAccounts    = container.querySelector('#detail-accounts-cards');
         const elCategories  = container.querySelector('#detail-categories-list');
         // filtra lançamentos dos orçamentos selecionados
         const detalhe = currentEntries.filter(e => orcNums.includes(e.orcamento));
         if (!detalhe.length) return;
         const saldoTotal = detalhe.reduce((acc, e) => acc + (e.valor || 0), 0);

         // atualiza label com todos orçamentos
         const labels = budgetsInInterval
             .filter(b => orcNums.includes(b.orcamento))
             .map(b => b.label)
             .join(', ');
         const elLabel = container.querySelector('#detail-budget-label');
         if (elLabel) elLabel.textContent = labels;

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

    // renderização inicial para todos selecionados
    if (selectedBudgets.length > 0) {
        renderizarDetalhes(selectedBudgets);
    }

    // toggle de seleção ao clicar no card
    document.addEventListener('detail:show', ev => {
        const orc = ev.detail.orcamento;
        if (selectedBudgets.includes(orc)) {
            selectedBudgets = selectedBudgets.filter(x => x !== orc);
        } else {
            selectedBudgets.push(orc);
        }
        renderizarDetalhes(selectedBudgets);
    });

    // exporta toggle global (opcional)
    window.toggleDetalhes = renderizarDetalhes;
}