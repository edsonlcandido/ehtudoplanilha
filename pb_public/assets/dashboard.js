var P=Object.defineProperty;var O=(t,e,n)=>e in t?P(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var w=(t,e,n)=>O(t,typeof e!="symbol"?e+"":e,n);import{v as V,p as A,A as X}from"./auth.js";import{SheetsService as j}from"./sheets.js";import{e as M,t as $,a as R,g as G,i as Y,b as U,c as W,d as J,l as Z,o as K,f as Q,h as ee}from"./fab-menu.js";import{r as te}from"./user-menu.js";function S(t){return Number(t).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}let x=[],D={};function ae(t,e){const n=document.getElementById("summaryCards");if(!n)return;x=t||[],D=e||{};const i=x.slice().sort((a,s)=>s.orcamento-a.orcamento);n.className="financial-cards",n.innerHTML="",i.forEach(a=>{D[a.label]===!0?n.appendChild(ne(a)):n.appendChild(re(a))}),n.querySelectorAll(".financial-card--inactive").forEach(a=>{const s=a;s.style.cursor="pointer",s.addEventListener("click",N)}),n.querySelectorAll(".financial-card__close").forEach(a=>{a.addEventListener("click",q)})}function ne(t){const e=document.createElement("div"),n=t.sum>=0?"financial-card--incomes":"financial-card--expenses";return e.className=`financial-card ${n}`,e.dataset.budget=t.label,e.dataset.sum=String(t.sum),e.dataset.incomes=String(t.incomes),e.dataset.expenses=String(t.expenses),e.dataset.orcamento=String(t.orcamento),e.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${t.label}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${t.label}</h3>
    </div>
    <div class="financial-card__value">${S(t.sum)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${S(t.incomes)}</div>
      <div class="financial-card__detail">Despesas: ${S(t.expenses)}</div>
    </div>
  `,e}function re(t){const e=document.createElement("div");return e.className="financial-card financial-card--inactive",e.dataset.budget=t.label,e.dataset.sum=String(t.sum),e.dataset.incomes=String(t.incomes),e.dataset.expenses=String(t.expenses),e.dataset.orcamento=String(t.orcamento),e.innerHTML=`
    <div class="financial-card__title">${t.label}</div>
    <div class="financial-card__value">...</div>
  `,e}function N(){const t=this.dataset.budget,e=parseFloat(this.dataset.sum),n=parseFloat(this.dataset.incomes),i=parseFloat(this.dataset.expenses),r=Number(this.dataset.orcamento);this.classList.remove("financial-card--inactive");const o=e>=0?"financial-card--incomes":"financial-card--expenses";this.classList.add(o),this.style.cursor="default",this.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${t}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${t}</h3>
    </div>
    <div class="financial-card__value">${S(e)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${S(n)}</div>
      <div class="financial-card__detail">Despesas: ${S(i)}</div>
    </div>
  `,this.removeEventListener("click",N);const a=this.querySelector(".financial-card__toggle");a&&a.addEventListener("click",function(h){h.stopPropagation();const b=this.closest(".financial-card").classList.toggle("financial-card__details--hidden");this.setAttribute("aria-expanded",String(!b)),this.textContent=b?"Mostrar detalhes":"Ocultar detalhes"});const s=this.querySelector(".financial-card__close");s&&s.addEventListener("click",q),document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:r}}))}function q(t){t.stopPropagation();const e=this.closest(".financial-card"),n=e.dataset.budget,i=e.dataset.sum,r=e.dataset.incomes,o=e.dataset.expenses,a=e.dataset.orcamento;e.className="financial-card financial-card--inactive",e.style.cursor="pointer",e.innerHTML=`
    <div class="financial-card__title">${n}</div>
    <div class="financial-card__value">...</div>
  `,e.dataset.budget=n,e.dataset.sum=i,e.dataset.incomes=r,e.dataset.expenses=o,e.dataset.orcamento=a;const s=e.cloneNode(!0);e.replaceWith(s);const h=document.querySelector(`.financial-card--inactive[data-budget="${n}"]`);h&&(h.style.cursor="pointer",h.addEventListener("click",N));const C=Number(a);document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:C}}))}function se(){const t=document.getElementById("summaryCards");t==null||t.addEventListener("click",e=>{const i=e.target.closest(".financial-card__toggle");if(!i)return;const o=i.closest(".financial-card").querySelector(".financial-card__details"),a=o==null?void 0:o.classList.toggle("financial-card__details--hidden");i.setAttribute("aria-expanded",String(!a)),i.textContent=a?"Mostrar detalhes":"Ocultar detalhes"})}function ie(t="Verifique sua conexão e tente novamente"){const e=document.getElementById("summaryCards");e&&(e.className="financial-cards",e.innerHTML=`
    <div class="financial-card financial-card--saldo">
      <div class="financial-card__header">
        <h3 class="financial-card__title">Erro ao carregar dados</h3>
      </div>
      <div class="financial-card__value">${t}</div>
    </div>
  `)}function T(t){return t.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2})}class oe{constructor(e){w(this,"container");w(this,"entries",[]);w(this,"chartData",[]);const n=document.getElementById(e);if(!n)throw new Error(`Container ${e} não encontrado`);this.container=n}render(e){if(this.entries=e,this.chartData=this.calculateExpenseData(),this.chartData.length===0){this.renderEmptyState();return}this.renderChart()}calculateExpenseData(){const e=["TRANSFERÊNCIA","TRANSFERENCIA","SALDO","RENDA","RECEITA"],n=this.entries.filter(a=>{const s=a.tipo.toUpperCase().trim();return!e.includes(s)&&a.valor<0});if(n.length===0)return[];const i=new Map;for(const a of n){const s=a.tipo||"Sem Tipo",h=Math.abs(a.valor);i.set(s,(i.get(s)||0)+h)}const r=Array.from(i.values()).reduce((a,s)=>a+s,0);return Array.from(i.entries()).map(([a,s])=>({categoria:a,valor:s,percentual:s/r*100})).sort((a,s)=>s.valor-a.valor)}renderEmptyState(){this.container.innerHTML=`
      <div class="budget-chart">
        <h3 class="budget-chart__title">Despesas por Tipo</h3>
        <div class="budget-chart__empty">
          <p>Nenhuma despesa encontrada.</p>
          <p><small>Adicione lançamentos de despesas para visualizar o gráfico.</small></p>
        </div>
      </div>
    `}renderChart(){const e=this.chartData,n=e.map((r,o)=>`
        <div class="budget-chart__legend-item">
          <div class="budget-chart__legend-color" style="background-color: ${this.getColor(o)};"></div>
          <div class="budget-chart__legend-content">
            <div class="budget-chart__legend-label">${r.categoria}</div>
            <div class="budget-chart__legend-value">
              <span>${T(r.valor)}</span>
              <span class="budget-chart__legend-percent">${r.percentual.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      `).join(""),i=e.reduce((r,o)=>r+o.valor,0);this.container.innerHTML=`
      <div class="budget-chart">
        <h3 class="budget-chart__title">Despesas por Tipo</h3>
        <div class="budget-chart__content">
          <div class="budget-chart__donut">
            ${this.renderDonutChart(e)}
          </div>
          <div class="budget-chart__legend">
            ${n}
          </div>
        </div>
        <div class="budget-chart__summary">
          <div class="budget-chart__summary-item">
            <span>Total de Despesas:</span>
            <span>${T(i)}</span>
          </div>
        </div>
      </div>
    `}renderDonutChart(e){const s=e.reduce((c,d)=>c+d.valor,0);if(s===0)return"<p>Sem dados de despesas</p>";let h=-90;return`
      <svg 
        viewBox="0 0 200 200" 
        class="budget-chart__svg"
        style="max-width: 200px; max-height: 200px;"
      >
        ${e.map((c,d)=>{const y=c.valor/s*100/100*360,E=h,l=h+y;h=l;const p=E*Math.PI/180,g=l*Math.PI/180,u=100+85*Math.cos(p),f=100+85*Math.sin(p),_=100+85*Math.cos(g),L=100+85*Math.sin(g),k=y>180?1:0,z=["M 100 100",`L ${u} ${f}`,`A 85 85 0 ${k} 1 ${_} ${L}`,"Z"].join(" "),H=this.getColor(d);return`
        <path 
          d="${z}" 
          fill="${H}" 
          stroke="white" 
          stroke-width="2"
          class="budget-chart__segment"
          data-category="${c.categoria}"
          data-value="${c.valor}"
        >
          <title>${c.categoria}: ${T(c.valor)} (${c.percentual.toFixed(1)}%)</title>
        </path>
      `}).join("")}
        
      <circle 
        cx="100" 
        cy="100" 
        r="55" 
        fill="white"
      />
    
      </svg>
    `}getColor(e){const n=["#FF6384","#36A2EB","#FFCE56","#4BC0C0","#9966FF","#FF9F40","#FF6384","#C9CBCF","#4BC0C0","#FF9F40"];return n[e%n.length]}clear(){this.container.innerHTML=""}}function ce(t,e){const n=new oe(t);return n.render(e),n}const de=`
  <div class="details__aggregates">
    <h3 class="details__title">Saldo e contas</h3>
    <h3><span class="details__saldo" id="detail-saldo">R$ 0,00</span></h3>
    <div class="details__cards" id="detail-accounts-cards">
      <!-- Cartões de contas serão renderizados aqui -->
    </div>
  </div>

  <!-- Gráfico de Despesas por Tipo -->
  <div id="categoryBudgetChart" style="margin-top:1rem;"></div>

  <div class="details__top-categories" style="margin-top:1rem;">
    <h3 class="details__title">Top 10 Gastos por Categoria</h3>
    <div class="category-cards" id="detail-categories-cards">
      <!-- Cards de categorias serão renderizados aqui -->
    </div>
  </div>

  <div class="details__category-entries details__category-entries--hidden" id="detail-entries">
    <h3 class="details__title" id="detail-entries-title">Lançamentos</h3>
    <div class="category-entries-list" id="entries-list">
      <!-- Lançamentos serão renderizados aqui -->
    </div>
  </div>
`;async function le(t,e){const n=document.querySelector(".details");if(!n)return;let i=e.map(m=>m.orcamento),r=t||[];const o=async(m,c=0)=>{try{if(console.log("[Details] Preparando gráfico de despesas por tipo..."),!document.getElementById("categoryBudgetChart"))if(c<3){console.warn(`[Details] Container categoryBudgetChart não encontrado (tentativa ${c+1}/3), aguardando...`),setTimeout(()=>o(m,c+1),200);return}else{console.warn("[Details] Container categoryBudgetChart não encontrado após múltiplas tentativas. Gráfico não será renderizado.");return}console.log("[Details] Container encontrado, carregando categorias completas...");const y=await j.getSheetCategoriesComplete();if(!y||y.length===0){console.log("[Details] Nenhuma categoria completa encontrada");return}console.log("[Details] Fazendo JOIN entre entries e categoriesComplete...");const E=new Map;for(const f of y)E.set(f.categoria.toLowerCase(),f.tipo);console.log("[Details] Categorias mapeadas:",Array.from(E.entries()));const l=r.filter(f=>m.includes(f.orcamento));console.log(`[Details] Filtrando ${r.length} entries por ${m.length} orçamentos -> ${l.length} entries`);const p=[...new Set(l.map(f=>f.categoria).filter(f=>f))];console.log("[Details] 📋 Categorias presentes nos entries filtrados:",p);const g=l.map(f=>{const _=(f.categoria||"").toLowerCase(),L=E.get(_)||"Sem Tipo";return{categoria:f.categoria||"",valor:f.valor||0,tipo:L}}),u=g.filter(f=>f.tipo==="Sem Tipo");if(u.length>0){console.warn(`[Details] ⚠️ Encontrados ${u.length} entries SEM TIPO:`),console.table(u.map(_=>({categoria:_.categoria,valor:_.valor,tipo:_.tipo})));const f=[...new Set(u.map(_=>_.categoria))];console.warn("[Details] 📋 Categorias SEM TIPO encontradas:",f),f.forEach(_=>{const L=E.has(_);console.warn(`[Details] Categoria "${_}" existe no mapa? ${L}`)})}console.log("[Details] Renderizando gráfico de despesas por tipo..."),ce("categoryBudgetChart",g),console.log("[Details] ✅ Gráfico de despesas por tipo renderizado com sucesso")}catch(v){console.error("[Details] Erro ao renderizar gráfico de despesas:",v)}},a=m=>{const c={};return m.forEach(d=>{!d.conta||d.conta.trim()===""||(c[d.conta]=(c[d.conta]||0)+(d.valor||0))}),Object.entries(c).map(([d,v])=>({conta:d,total:v}))},s=m=>{const c={};return m.forEach(d=>{const v=d.categoria||"Sem categoria";c[v]=(c[v]||0)+(d.valor||0)}),Object.entries(c).map(([d,v])=>({categoria:d,total:v}))},h=(m,c)=>{const d=n.querySelector("#detail-entries"),v=n.querySelector("#detail-entries-title"),y=n.querySelector("#entries-list");if(!d||!y||!v)return;v.textContent=`Lançamentos da Categoria: ${m}`;const E=r.filter(l=>c.includes(l.orcamento)&&(l.categoria||"Sem categoria")===m&&l.valor<0);if(E.sort((l,p)=>{if(!l.data&&!p.data)return 0;if(!l.data)return 1;if(!p.data)return-1;const g=new Date(l.data).getTime(),u=new Date(p.data).getTime();return isNaN(g)&&isNaN(u)?0:isNaN(g)?1:isNaN(u)?-1:u-g}),d.classList.remove("details__category-entries--hidden"),y.innerHTML="",E.length===0){y.innerHTML='<p class="category-entries-empty">Nenhum lançamento encontrado nesta categoria.</p>';return}E.forEach(l=>{const p=document.createElement("div");p.className="category-entry-card";let g="--";if(l.data&&typeof l.data=="number"&&l.data>0){const u=M(l.data,!0);u&&(g=u.toLocaleDateString("pt-BR")+" "+u.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}))}p.innerHTML=`
        <div class="category-entry-card__date">${g}</div>
        <div class="category-entry-card__description">${l.descricao||"Sem descrição"}</div>
        <div class="category-entry-card__value">${S(l.valor||0)}</div>
      `,y.appendChild(p)})},C=(m,c)=>{const d=n.querySelector("#detail-entries"),v=n.querySelector("#detail-entries-title"),y=n.querySelector("#entries-list");if(!d||!y||!v)return;v.textContent=`Lançamentos da Conta: ${m}`;const E=r.filter(l=>c.includes(l.orcamento)&&l.conta===m);if(E.sort((l,p)=>{if(!l.data&&!p.data)return 0;if(!l.data)return 1;if(!p.data)return-1;const g=new Date(l.data).getTime(),u=new Date(p.data).getTime();return isNaN(g)&&isNaN(u)?0:isNaN(g)?1:isNaN(u)?-1:u-g}),d.classList.remove("details__category-entries--hidden"),y.innerHTML="",E.length===0){y.innerHTML='<p class="category-entries-empty">Nenhum lançamento encontrado nesta conta.</p>';return}E.forEach(l=>{const p=document.createElement("div");p.className="category-entry-card";let g="--";if(l.data&&typeof l.data=="number"&&l.data>0){const u=M(l.data,!0);u&&(g=u.toLocaleDateString("pt-BR")+" "+u.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}))}p.innerHTML=`
        <div class="category-entry-card__date">${g}</div>
        <div class="category-entry-card__description">${l.descricao||"Sem descrição"}</div>
        <div class="category-entry-card__value">${S(l.valor||0)}</div>
      `,y.appendChild(p)})},b=async m=>{const c=Array.isArray(m)?m:[m];n.innerHTML=de,n.style.display="";const d=n.querySelector("#detail-saldo"),v=n.querySelector("#detail-accounts-cards"),y=n.querySelector("#detail-categories-cards"),E=r.filter(p=>c.includes(p.orcamento));if(!E.length){d&&(d.textContent=S(0)),await o(c);return}const l=E.reduce((p,g)=>p+(g.valor||0),0);d&&(d.textContent=S(l)),v&&(v.innerHTML="",a(E).forEach(({conta:p,total:g})=>{const u=document.createElement("div");u.className="details__card details__card--clickable",u.dataset.conta=p,u.innerHTML=`
          <div class="details__card-title">${p}</div>
          <div class="details__card-value">${S(g)}</div>
        `,u.addEventListener("click",()=>{v.querySelectorAll(".details__card").forEach(_=>{_.classList.remove("details__card--selected")});const f=n.querySelector("#detail-categories-cards");f&&f.querySelectorAll(".category-card").forEach(_=>{_.classList.remove("category-card--selected")}),u.classList.add("details__card--selected"),C(p,c)}),v.appendChild(u)})),y&&(y.innerHTML="",s(E).filter(g=>g.total<0).sort((g,u)=>g.total-u.total).slice(0,10).forEach((g,u)=>{const f=document.createElement("div");f.className="category-card",f.dataset.categoria=g.categoria,f.innerHTML=`
          <div class="category-card__rank">#${u+1}</div>
          <div class="category-card__content">
            <div class="category-card__name">${g.categoria}</div>
            <div class="category-card__value">${S(g.total)}</div>
          </div>
        `,f.addEventListener("click",()=>{y.querySelectorAll(".category-card").forEach(_=>{_.classList.remove("category-card--selected")}),v&&v.querySelectorAll(".details__card").forEach(_=>{_.classList.remove("details__card--selected")}),f.classList.add("category-card--selected"),h(g.categoria,c)}),y.appendChild(f)})),await o(c)};i.length>0?await b(i):await o([]),document.addEventListener("detail:show",async m=>{const d=m.detail.orcamento;i.includes(d)?i=i.filter(v=>v!==d):i.push(d),await b(i)}),document.addEventListener("cards:updated",async m=>{const c=m,{allEntries:d}=c.detail||{};d&&(r=d,await b(i))})}function ue(t=[],e="orcamento",n=-5,i=35){const{startSerial:r,endSerial:o}=G(n,i);return t.filter(a=>{const s=a&&a[e];return typeof s=="number"&&!Number.isNaN(s)&&s>=r&&s<=o})}function B(t=[],e="orcamento"){const n=new Map;return t.forEach(r=>{let o=r&&r[e],a=Number(o);if(!Number.isFinite(a)&&typeof o=="string"&&o.includes("/")){const C=o.split("/");if(C.length===3){const[b,m,c]=C.map(d=>Number(d));[b,m,c].every(Number.isFinite)&&(a=$(new Date(c,m-1,b)))}else if(C.length===2){const[b,m]=C.map(c=>Number(c));[b,m].every(Number.isFinite)&&(a=$(new Date(m,b-1,1)))}}if(!Number.isFinite(a))return;const s=Number(r.valor)||0,h=n.get(a)||{orcamento:a,sum:0,count:0,incomes:0,expenses:0};h.sum+=s,h.count+=1,s>=0?h.incomes+=s:h.expenses+=s,n.set(a,h)}),Array.from(n.values()).map(r=>({orcamento:r.orcamento,label:R(r.orcamento),count:r.count,sum:Number(r.sum.toFixed(2)),incomes:Number(r.incomes.toFixed(2)),expenses:Number(r.expenses.toFixed(2))})).sort((r,o)=>o.orcamento-r.orcamento)}function F(t=[],e="orcamento"){const n=r=>{let o=Number(r);if(Number.isFinite(o))return o;if(typeof r=="string"&&r.includes("/")){const a=r.split("/");if(a.length===3){const[s,h,C]=a.map(b=>Number(b));if([s,h,C].every(Number.isFinite))return $(new Date(C,h-1,s))}else if(a.length===2){const[s,h]=a.map(C=>Number(C));if([s,h].every(Number.isFinite))return $(new Date(h,s-1,1))}}return null},i=new Map;return t.forEach(r=>{const o=r&&r[e],a=n(o);a===null||!Number.isFinite(a)||i.has(a)||i.set(a,{orcamento:a,label:R(a)})}),Array.from(i.values()).sort((r,o)=>r.orcamento-o.orcamento)}async function I(){if(!await V()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}if(te(),se(),await Y(()=>{console.log("✅ Lançamento adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await U(()=>{console.log("✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await W(()=>{console.log("✅ Transferência realizada! Recarregue a página para ver as mudanças."),window.location.reload()}),J(()=>ee(),()=>Q(),()=>K()),!A.authStore.isValid){console.log("⚠️ Usuário não autenticado");return}if(!(await ge()).isValid){me();return}await pe(),console.log("✅ Dashboard inicializado")}async function ge(){try{const e=await(await fetch(`${X.configStatus}`,{method:"GET",headers:{Authorization:`Bearer ${A.authStore.token}`}})).json();return{isValid:e.hasRefreshToken&&e.hasSheetId}}catch(t){return console.error("Erro ao verificar configuração:",t),{isValid:!1}}}function me(){const t=document.getElementById("configBtn");t&&(t.style.display="");const e=document.getElementById("summaryCards");e&&(e.style.display="none");const n=document.querySelector(".dashboard__col--right.details");n&&(n.style.display="none");const i=document.getElementById("openEntryModal");i&&(i.style.display="none");const r=document.querySelector(".dashboard__header");if(r&&!document.getElementById("configMessage")){const o=document.createElement("p");o.id="configMessage",o.style.marginTop="1rem",o.textContent='Integração com Google não configurada. Clique em "Configurar Integração" para continuar.',r.appendChild(o);const a=document.createElement("a");a.href="/dashboard/configuracao.html",a.className="button primary",a.style.marginTop="1rem",a.style.display="inline-block",a.textContent="⚙️ Configurar Integração",r.appendChild(a)}}async function pe(){try{const t=await Z.fetchEntries(0,!1),e=(t==null?void 0:t.entries)??[];if(!e||e.length===0){fe();return}window.allEntries=e;const n=B(e);window.allBudgets=F(e);const i=ue(e),r=B(i),o=F(i);window.filteredEntries=i,window.summaryByBudget=r,window.budgetsInInterval=o;const a={};r.forEach(s=>{a[s.label]=!0}),ae(n,a),await le(e,o)}catch(t){console.error("Erro ao carregar dados:",t),ie("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.")}}function fe(){const t=document.getElementById("summaryCards");t&&(t.style.display="none");const e=document.querySelector(".dashboard__col--right.details");e&&(e.style.display="none");const n=document.getElementById("openEntryModal");n&&(n.style.display="");const i=document.querySelector(".dashboard__header");if(i&&!document.getElementById("firstEntryMessage")){const r=document.createElement("div");r.id="firstEntryMessage",r.style.marginTop="1rem",r.className="notice",r.textContent='Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.',i.appendChild(r)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",I):I();
