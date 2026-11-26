/**
 * Dashboard Principal
 *
 * Consome /get-dashboard-data (cards e saldos) e /get-dashboard-details
 * (bloco de detalhes). Nenhuma agregação é feita aqui.
 */

import { pb } from '../main';
import { verifyTokenValidity } from '../services/auth';
import { API_ENDPOINTS } from '../config/env';
import { renderUserMenu } from '../components/user-menu';
import { initEntryModal, openEntryModal } from '../components/entry-modal';
import { initFutureEntryModal, openFutureEntryModal } from '../components/future-entry-modal';
import { initTransferEntryModal, openTransferEntryModal } from '../components/transfer-entry-modal';
import { initBalanceAdjustModal, openBalanceAdjustModal } from '../components/balance-adjust-modal';
import { initFabMenu } from '../components/fab-menu';
import {
  renderizarCards,
  inicializarEventos,
  mostrarCardCarregamento,
  mostrarErro
} from '../components/financial-cards';
import { inicializarDetalhes } from '../components/details';
import lancamentosService, { hojeLocal } from '../services/lancamentos';

// ============================================================================
// Inicialização
// ============================================================================

async function init(): Promise<void> {
  // Verifica se o token é válido no início
  // Se receber 401, faz logout e redireciona para /
  const isTokenValid = await verifyTokenValidity();
  if (!isTokenValid) {
    console.warn('⚠️ Token inválido ou usuário não autenticado');
    return;
  }

  // Renderiza menu do usuário
  renderUserMenu();

  // Inicializa eventos dos cards
  inicializarEventos();

  // Inicializa modal de lançamento
  await initEntryModal(() => {
    console.log('✅ Lançamento adicionado! Recarregue a página para ver as mudanças.');
    window.location.reload();
  });

  // Inicializa modal de lançamento futuro
  await initFutureEntryModal(() => {
    console.log('✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças.');
    window.location.reload();
  });

  // Inicializa modal de transferência
  await initTransferEntryModal(() => {
    console.log('✅ Transferência realizada! Recarregue a página para ver as mudanças.');
    window.location.reload();
  });

  // Inicializa modal de ajuste de saldo
  await initBalanceAdjustModal(() => {
    console.log('✅ Saldo ajustado! Recarregue a página para ver as mudanças.');
    window.location.reload();
  });

  // Inicializa o menu FAB com as opções
  initFabMenu(
    () => openEntryModal(),         // Receita/despesa
    () => openFutureEntryModal(),   // Lançamento futuro
    () => openTransferEntryModal(), // Transferência
    () => openBalanceAdjustModal()  // Ajuste de saldo
  );

  // Atalho disparado pelos cards de conta (seção "Saldo e contas")
  document.addEventListener('balance:adjust', (e: Event) => {
    const conta = (e as CustomEvent).detail?.conta;
    openBalanceAdjustModal(conta);
  });

  // Verifica autenticação
  if (!pb.authStore.isValid) {
    console.log('⚠️ Usuário não autenticado');
    return;
  }

  // Verifica se a configuração do Google está completa
  const configStatus = await checkConfiguration();

  if (!configStatus.isValid) {
    showConfigurationRequired();
    return;
  }

  // Configura botão de atualizar
  const refreshBtn = document.getElementById('refreshDashboardBtn') as HTMLButtonElement;
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      console.log('🔄 Atualizando dashboard (limpando cache)...');

      // Desabilita botão e mostra loader
      const originalText = refreshBtn.innerHTML;
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '⏳ Atualizando...';

      try {
        await refreshDashboard();
      } finally {
        // Restaura botão
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = originalText;
      }
    });
  }

  // Carrega e renderiza dados
  await loadAndRenderData();

  console.log('✅ Dashboard inicializado');
}

/**
 * Verifica status da configuração
 */
async function checkConfiguration(): Promise<{ isValid: boolean }> {
  try {
    // Usa `pb.send()` (NÃO fetch puro) porque o PB SDK adiciona
    // automaticamente o header `Authorization: <authStore.token>`
    // (lido do localStorage). PocketBase autentica via esse header
    // — não usa cookie (cookie.hasPbAuth do /debug-auth = false).
    //
    // IMPORTANTE: `pb.send()` JÁ retorna o JSON parseado. Se der
    // 401/4xx/5xx, o SDK joga `ClientResponseError`.
    const data = await pb.send(`${API_ENDPOINTS.configStatus}`, {
      method: 'GET'
    });
    return {
      isValid: data.hasRefreshToken && data.hasSheetId
    };
  } catch (error) {
    console.error('Erro ao verificar configuração:', error);
    return { isValid: false };
  }
}

/**
 * Mostra mensagem de configuração necessária
 */
function showConfigurationRequired(): void {
  const configBtn = document.getElementById('configBtn');
  if (configBtn) configBtn.style.display = '';

  const summaryCards = document.getElementById('summaryCards');
  if (summaryCards) summaryCards.style.display = 'none';

  const rightCol = document.querySelector('.dashboard__col--right.details') as HTMLElement;
  if (rightCol) rightCol.style.display = 'none';

  const addBtn = document.getElementById('openEntryModal');
  if (addBtn) addBtn.style.display = 'none';

  const header = document.querySelector('.dashboard__header');
  if (header && !document.getElementById('configMessage')) {
    const p = document.createElement('p');
    p.id = 'configMessage';
    p.style.marginTop = '1rem';
    p.textContent = 'Integração com Google não configurada. Clique em "Configurar Integração" para continuar.';
    header.appendChild(p);

    // Adiciona botão de configuração
    const button = document.createElement('a');
    button.href = '/dashboard/configuracao.html';
    button.className = 'button primary';
    button.style.marginTop = '1rem';
    button.style.display = 'inline-block';
    button.textContent = '⚙️ Configurar Integração';
    header.appendChild(button);
  }
}

/**
 * Atualiza o dashboard forçando limpeza de cache
 */
async function refreshDashboard(): Promise<void> {
  mostrarCardCarregamento();

  try {
    // Força atualização do cache buscando com forceRefresh=true
    await loadAndRenderData(true);
    console.log('✅ Dashboard atualizado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao atualizar dashboard:', error);
    mostrarErro('Erro ao atualizar dados. Tente novamente.');
  }
}

/**
 * Carrega e renderiza os dados financeiros
 */
async function loadAndRenderData(forceRefresh: boolean = false): Promise<void> {
  // Mostra card de carregamento
  mostrarCardCarregamento();

  try {
    // Tudo vem agregado do backend
    const data = await lancamentosService.fetchDashboardData(hojeLocal(), forceRefresh);

    // Se não houver lançamentos, mostra mensagem
    if (!data || data.totalLancamentos === 0) {
      showNoEntriesMessage();
      return;
    }

    // Renderiza cards de orçamento
    renderizarCards(data.budgets || []);

    // Inicializa detalhes (top 10 categorias, gráfico e contas)
    await inicializarDetalhes(data.budgetsInInterval || [], data.accounts || []);

  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    mostrarErro('Não foi possível carregar os dados. Verifique sua conexão e tente novamente.');
  }
}

/**
 * Mostra mensagem quando não há lançamentos
 */
function showNoEntriesMessage(): void {
  const summaryCards = document.getElementById('summaryCards');
  if (summaryCards) summaryCards.style.display = 'none';

  const rightCol = document.querySelector('.dashboard__col--right.details') as HTMLElement;
  if (rightCol) rightCol.style.display = 'none';

  const addBtn = document.getElementById('openEntryModal');
  if (addBtn) addBtn.style.display = '';

  const header = document.querySelector('.dashboard__header');
  if (header && !document.getElementById('firstEntryMessage')) {
    const div = document.createElement('div');
    div.id = 'firstEntryMessage';
    div.style.marginTop = '1rem';
    div.className = 'notice';
    div.textContent = 'Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.';
    header.appendChild(div);
  }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
