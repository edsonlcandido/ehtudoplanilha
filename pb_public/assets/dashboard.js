var R=Object.defineProperty;var N=(o,e,t)=>e in o?R(o,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[e]=t;var S=(o,e,t)=>N(o,typeof e!="symbol"?e+"":e,t);import{v as j,p as I,A as G}from"./auth.js";/* empty css          */import{l as q,f,i as V,a as O,b as X,c as P,d as Y,e as W,o as D,m as F,h as J,r as U,g as K,j as Z,k as Q}from"./fab-menu.js";import{r as ee}from"./user-menu.js";import"./sheets.js";function w(o){return o.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2})}class te{constructor(e){S(this,"container");S(this,"chartData",[]);const t=document.getElementById(e);if(!t)throw new Error(`Container ${e} não encontrado`);this.container=t}render(e){if(this.chartData=e||[],this.chartData.length===0){this.renderEmptyState();return}this.renderChart()}renderEmptyState(){this.container.innerHTML=`
      <div class="budget-chart">
        <h3 class="budget-chart__title">Gastos por tipo</h3>
        <div class="budget-chart__empty">
          <p>Nenhuma despesa encontrada.</p>
          <p><small>Adicione lançamentos de despesas para visualizar o gráfico.</small></p>
        </div>
      </div>
    `}renderChart(){const e=this.chartData,t=e.map((i,g)=>`
        <div class="budget-chart__legend-item">
          <div class="budget-chart__legend-color" style="background-color: ${this.getColor(g)};"></div>
          <div class="budget-chart__legend-content">
            <div class="budget-chart__legend-label">${i.tipo}</div>
            <div class="budget-chart__legend-value">
              <span>${w(i.valor)}</span>
              <span class="budget-chart__legend-percent">${i.percentual.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      `).join(""),d=e.reduce((i,g)=>i+g.valor,0);this.container.innerHTML=`
      <div class="budget-chart">
        <h3 class="budget-chart__title">Gastos por tipo</h3>
        <div class="budget-chart__content">
          <div class="budget-chart__donut">
            ${this.renderDonutChart(e)}
          </div>
          <div class="budget-chart__legend">
            ${t}
          </div>
        </div>
        <div class="budget-chart__summary">
          <div class="budget-chart__summary-item">
            <span>Total de Despesas:</span>
            <span>${w(d)}</span>
          </div>
        </div>
      </div>
    `}renderDonutChart(e){const L=e.reduce((y,b)=>y+b.valor,0);if(L===0)return"<p>Sem dados de despesas</p>";let h=-90;return`
      <svg 
        viewBox="0 0 200 200" 
        class="budget-chart__svg"
        style="max-width: 200px; max-height: 200px;"
      >
        ${e.map((y,b)=>{const n=y.valor/L*100/100*360,r=h,a=h+n;h=a;const l=r*Math.PI/180,c=a*Math.PI/180,s=100+85*Math.cos(l),u=100+85*Math.sin(l),m=100+85*Math.cos(c),E=100+85*Math.sin(c),C=n>180?1:0,v=["M 100 100",`L ${s} ${u}`,`A 85 85 0 ${C} 1 ${m} ${E}`,"Z"].join(" "),_=this.getColor(b);return`
        <path 
          d="${v}" 
          fill="${_}" 
          stroke="white" 
          stroke-width="2"
          class="budget-chart__segment"
          data-category="${y.tipo}"
          data-value="${y.valor}"
        >
          <title>${y.tipo}: ${w(y.valor)} (${y.percentual.toFixed(1)}%)</title>
        </path>
      `}).join("")}
        
      <circle 
        cx="100" 
        cy="100" 
        r="55" 
        fill="white"
      />
    
      </svg>
    `}getColor(e){const t=["#FF6384","#36A2EB","#FFCE56","#4BC0C0","#9966FF","#FF9F40","#FF6384","#C9CBCF","#4BC0C0","#FF9F40"];return t[e%t.length]}clear(){this.container.innerHTML=""}}function ae(o,e){const t=new te(o);return t.render(e),t}const ne=`
  <!-- Gráfico de Despesas por Tipo -->
  <div id="categoryBudgetChart" style="margin-top:1rem;"></div>

  <div class="details__top-categories" style="margin-top:1rem;">
    <h3 class="details__title">Top 10 Gastos por Categoria</h3>
    <div class="category-cards" id="detail-categories-cards">
      <!-- Cards de categorias serão renderizados aqui -->
    </div>
  </div>

  <div class="details__category-entries details__category-entries--hidden" id="detail-entries">
    <h3 class="details__title" id="detail-entries-title">
      <span id="lancamentos">Lançamentos</span>
    </h3>
    <div class="category-entries-list" id="entries-list">
      <!-- Lançamentos serão renderizados aqui -->
    </div>
  </div>
`;async function re(o,e){const t=document.querySelector(".details");if(!t)return;let d=[...o||[]],i=null;const g="excludedAccounts",p=()=>{try{const n=localStorage.getItem(g);if(n)return new Set(JSON.parse(n))}catch(n){console.error("Erro ao carregar contas excluídas:",n)}return new Set},L=n=>{try{localStorage.setItem(g,JSON.stringify(Array.from(n)))}catch(r){console.error("Erro ao salvar contas excluídas:",r)}},h=p(),T=async(n,r=0)=>{if(!document.getElementById("categoryBudgetChart")){if(r<3){setTimeout(()=>T(n,r+1),200);return}console.warn("[Details] Container categoryBudgetChart não encontrado. Gráfico não será renderizado.");return}ae("categoryBudgetChart",n||[])},$=()=>{const n=document.querySelector("#detail-saldo"),r=document.querySelector("#detail-accounts-cards"),a=document.querySelector(".dashboard__balance-section .details__aggregates");a&&a.classList.remove("loading");const l=e.reduce((c,s)=>h.has(s.conta)?c:c+s.total,0);if(n&&(n.textContent=f(l)),r){r.innerHTML="",e.forEach(({conta:s,total:u})=>{const m=document.createElement("div"),E=h.has(s);m.className=`details__card details__card--clickable${E?" details__card--excluded":""}`,m.dataset.conta=s;const C=document.createElement("div");C.className="details__card-content",C.innerHTML=`
          <div class="details__card-info">
            <span class="details__card-icon">${E?"💳":""}</span>
            <span class="details__card-title">${s}</span>
            <span class="details__card-value">${f(u)}</span>
          </div>
        `,m.appendChild(C);const v=document.createElement("button");v.type="button",v.className="details__card-adjust",v.title=`Ajustar saldo de ${s}`,v.setAttribute("aria-label",`Ajustar saldo de ${s}`),v.textContent="⚖️",v.addEventListener("click",_=>{_.stopPropagation(),document.dispatchEvent(new CustomEvent("balance:adjust",{detail:{conta:s}}))}),m.appendChild(v),m.addEventListener("click",()=>{const _=C.querySelector(".details__card-icon");h.has(s)?(h.delete(s),m.classList.remove("details__card--excluded"),_&&(_.textContent="")):(h.add(s),m.classList.add("details__card--excluded"),_&&(_.textContent="💳")),L(h);const H=e.reduce((x,A)=>h.has(A.conta)?x:x+A.total,0);n&&(n.textContent=f(H))}),r.appendChild(m)});const c=document.querySelector("#toggle-accounts-btn");if(c&&r){const s=()=>{const E=r.classList.contains("details__cards--hidden");c.textContent=E?"👁️ Mostrar contas":"🙈 Ocultar contas"},u=c._toggleListener;u&&c.removeEventListener("click",u);const m=()=>{r.classList.toggle("details__cards--hidden"),s()};c._toggleListener=m,c.addEventListener("click",m),s()}}},B=(n,r)=>{const a=document.querySelector("#detail-budget-accounts-cards"),l=document.querySelector("#detail-budget-total");if(a){if(l&&(l.textContent=f(r)),a.innerHTML="",n.length===0){a.innerHTML='<p class="category-entries-empty">Nenhuma conta encontrada nos orçamentos selecionados.</p>';return}n.forEach(({conta:c,total:s})=>{const u=document.createElement("div");u.className="details__card",u.innerHTML=`
        <div class="details__card-info">
          <span class="details__card-title">${c}</span>
          <span class="details__card-value">${f(s)}</span>
        </div>
      `,a.appendChild(u)})}},y=n=>{const r=t.querySelector("#detail-entries"),a=t.querySelector("#detail-entries-title"),l=t.querySelector("#entries-list");if(!r||!l||!a)return;a.innerHTML=`<span id="lancamentos">Lançamentos da Categoria: ${n}</span>`;const c=((i==null?void 0:i.entradasPorCategoria)||{})[n]||[];if(r.classList.remove("details__category-entries--hidden"),l.innerHTML="",c.length===0){l.innerHTML='<p class="category-entries-empty">Nenhum lançamento encontrado nesta categoria.</p>';return}c.forEach(s=>{const u=document.createElement("div");u.className="category-entry-card",u.innerHTML=`
        <div class="category-entry-card__date">${s.dataLabel||"--"}</div>
        <div class="category-entry-card__description">${s.descricao||"Sem descrição"}</div>
        <div class="category-entry-card__value">${f(s.valor||0)}</div>
      `,l.appendChild(u)}),setTimeout(()=>{const s=document.getElementById("lancamentos");s&&s.scrollIntoView({behavior:"smooth",block:"start"})},100)},b=n=>{const r=t.querySelector("#detail-categories-cards");r&&(r.innerHTML="",n.forEach((a,l)=>{const c=document.createElement("div");c.className="category-card",c.dataset.categoria=a.categoria,c.innerHTML=`
        <div class="category-card__rank">#${l+1}</div>
        <div class="category-card__content">
          <div class="category-card__name">${a.categoria}</div>
          <div class="category-card__value">${f(a.total)}</div>
        </div>
      `,c.addEventListener("click",()=>{r.querySelectorAll(".category-card").forEach(u=>{u.classList.remove("category-card--selected")});const s=document.querySelector("#detail-accounts-cards");s&&s.querySelectorAll(".details__card").forEach(u=>{u.classList.remove("details__card--selected")}),c.classList.add("category-card--selected"),y(a.categoria)}),r.appendChild(c)}))},M=async n=>{t.innerHTML=ne,t.style.display="";const r=t.querySelector("#detail-categories-cards");let a;try{a=await q.fetchDashboardDetails(n)}catch(l){console.error("[Details] Erro ao buscar detalhes:",l);return}i=a,r&&b(a.topCategorias||[]),await T(a.grafico||[]),B(a.contas||[],a.totalGeral||0)};await M(d),$(),document.addEventListener("detail:show",async n=>{const a=n.detail.orcamento;d.includes(a)?d=d.filter(l=>l!==a):d.push(a),await M(d)}),document.addEventListener("cards:updated",async n=>{var a;const r=n;(a=r.detail)!=null&&a.accounts&&(e=r.detail.accounts,$(),await M(d))})}async function z(){if(!await j()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}if(ee(),V(),await O(()=>{console.log("✅ Lançamento adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await X(()=>{console.log("✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await P(()=>{console.log("✅ Transferência realizada! Recarregue a página para ver as mudanças."),window.location.reload()}),await Y(()=>{console.log("✅ Saldo ajustado! Recarregue a página para ver as mudanças."),window.location.reload()}),W(()=>Q(),()=>Z(),()=>K(),()=>D()),document.addEventListener("balance:adjust",d=>{var g;const i=(g=d.detail)==null?void 0:g.conta;D(i)}),!I.authStore.isValid){console.log("⚠️ Usuário não autenticado");return}if(!(await se()).isValid){oe();return}const t=document.getElementById("refreshDashboardBtn");t&&t.addEventListener("click",async()=>{console.log("🔄 Atualizando dashboard (limpando cache)...");const d=t.innerHTML;t.disabled=!0,t.innerHTML="⏳ Atualizando...";try{await ce()}finally{t.disabled=!1,t.innerHTML=d}}),await k(),console.log("✅ Dashboard inicializado")}async function se(){try{const o=await I.send(`${G.configStatus}`,{method:"GET"});return{isValid:o.hasRefreshToken&&o.hasSheetId}}catch(o){return console.error("Erro ao verificar configuração:",o),{isValid:!1}}}function oe(){const o=document.getElementById("configBtn");o&&(o.style.display="");const e=document.getElementById("summaryCards");e&&(e.style.display="none");const t=document.querySelector(".dashboard__col--right.details");t&&(t.style.display="none");const d=document.getElementById("openEntryModal");d&&(d.style.display="none");const i=document.querySelector(".dashboard__header");if(i&&!document.getElementById("configMessage")){const g=document.createElement("p");g.id="configMessage",g.style.marginTop="1rem",g.textContent='Integração com Google não configurada. Clique em "Configurar Integração" para continuar.',i.appendChild(g);const p=document.createElement("a");p.href="/dashboard/configuracao.html",p.className="button primary",p.style.marginTop="1rem",p.style.display="inline-block",p.textContent="⚙️ Configurar Integração",i.appendChild(p)}}async function ce(){try{await k(!0),console.log("✅ Dashboard atualizado com sucesso")}catch(o){console.error("❌ Erro ao atualizar dashboard:",o),F("Erro ao atualizar dados. Tente novamente.")}}async function k(o=!1){try{const e=await q.fetchDashboardData(J(),o);if(!e||e.totalLancamentos===0){ie();return}U(e.budgets||[]),await re(e.budgetsInInterval||[],e.accounts||[])}catch(e){console.error("Erro ao carregar dados:",e),F("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.")}}function ie(){const o=document.getElementById("summaryCards");o&&(o.style.display="none");const e=document.querySelector(".dashboard__col--right.details");e&&(e.style.display="none");const t=document.getElementById("openEntryModal");t&&(t.style.display="");const d=document.querySelector(".dashboard__header");if(d&&!document.getElementById("firstEntryMessage")){const i=document.createElement("div");i.id="firstEntryMessage",i.style.marginTop="1rem",i.className="notice",i.textContent='Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.',d.appendChild(i)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",z):z();
