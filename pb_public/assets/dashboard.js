var H=Object.defineProperty;var P=(a,e,n)=>e in a?H(a,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):a[e]=n;var w=(a,e,n)=>P(a,typeof e!="symbol"?e+"":e,n);import{v as O,p as N,A as V}from"./auth.js";import{SheetsService as X}from"./sheets.js";import{t as S,e as B,g as j,i as G,a as U,b as Y,c as W,l as J,o as Z,d as K,f as Q}from"./fab-menu.js";import{r as ee}from"./user-menu.js";function C(a){return Number(a).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}let x=[],T={};function ae(a,e){const n=document.getElementById("summaryCards");if(!n)return;x=a||[],T=e||{};const o=x.slice().sort((t,r)=>r.orcamento-t.orcamento);n.className="financial-cards",n.innerHTML="",o.forEach(t=>{T[t.label]===!0?n.appendChild(te(t)):n.appendChild(ne(t))}),n.querySelectorAll(".financial-card--inactive").forEach(t=>{const r=t;r.style.cursor="pointer",r.addEventListener("click",M)}),n.querySelectorAll(".financial-card__close").forEach(t=>{t.addEventListener("click",F)})}function te(a){const e=document.createElement("div"),n=a.sum>=0?"financial-card--incomes":"financial-card--expenses";return e.className=`financial-card ${n}`,e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a.label}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a.label}</h3>
    </div>
    <div class="financial-card__value">${C(a.sum)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${C(a.incomes)}</div>
      <div class="financial-card__detail">Despesas: ${C(a.expenses)}</div>
    </div>
  `,e}function ne(a){const e=document.createElement("div");return e.className="financial-card financial-card--inactive",e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <div class="financial-card__title">${a.label}</div>
    <div class="financial-card__value">...</div>
  `,e}function M(){const a=this.dataset.budget,e=parseFloat(this.dataset.sum),n=parseFloat(this.dataset.incomes),o=parseFloat(this.dataset.expenses),s=Number(this.dataset.orcamento);this.classList.remove("financial-card--inactive");const i=e>=0?"financial-card--incomes":"financial-card--expenses";this.classList.add(i),this.style.cursor="default",this.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a}</h3>
    </div>
    <div class="financial-card__value">${C(e)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${C(n)}</div>
      <div class="financial-card__detail">Despesas: ${C(o)}</div>
    </div>
  `,this.removeEventListener("click",M);const t=this.querySelector(".financial-card__toggle");t&&t.addEventListener("click",function(m){m.stopPropagation();const l=this.closest(".financial-card").classList.toggle("financial-card__details--hidden");this.setAttribute("aria-expanded",String(!l)),this.textContent=l?"Mostrar detalhes":"Ocultar detalhes"});const r=this.querySelector(".financial-card__close");r&&r.addEventListener("click",F),document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:s}}))}function F(a){a.stopPropagation();const e=this.closest(".financial-card"),n=e.dataset.budget,o=e.dataset.sum,s=e.dataset.incomes,i=e.dataset.expenses,t=e.dataset.orcamento;e.className="financial-card financial-card--inactive",e.style.cursor="pointer",e.innerHTML=`
    <div class="financial-card__title">${n}</div>
    <div class="financial-card__value">...</div>
  `,e.dataset.budget=n,e.dataset.sum=o,e.dataset.incomes=s,e.dataset.expenses=i,e.dataset.orcamento=t;const r=e.cloneNode(!0);e.replaceWith(r);const m=document.querySelector(`.financial-card--inactive[data-budget="${n}"]`);m&&(m.style.cursor="pointer",m.addEventListener("click",M));const d=Number(t);document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:d}}))}function se(){const a=document.getElementById("summaryCards");a==null||a.addEventListener("click",e=>{const o=e.target.closest(".financial-card__toggle");if(!o)return;const i=o.closest(".financial-card").querySelector(".financial-card__details"),t=i==null?void 0:i.classList.toggle("financial-card__details--hidden");o.setAttribute("aria-expanded",String(!t)),o.textContent=t?"Mostrar detalhes":"Ocultar detalhes"})}function re(a="Verifique sua conexão e tente novamente"){const e=document.getElementById("summaryCards");e&&(e.className="financial-cards",e.innerHTML=`
    <div class="financial-card financial-card--saldo">
      <div class="financial-card__header">
        <h3 class="financial-card__title">Erro ao carregar dados</h3>
      </div>
      <div class="financial-card__value">${a}</div>
    </div>
  `)}function $(a){return a.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2})}class oe{constructor(e){w(this,"container");w(this,"entries",[]);w(this,"chartData",[]);const n=document.getElementById(e);if(!n)throw new Error(`Container ${e} não encontrado`);this.container=n}render(e){if(this.entries=e,this.chartData=this.calculateExpenseData(),this.chartData.length===0){this.renderEmptyState();return}this.renderChart()}calculateExpenseData(){const e=["TRANSFERÊNCIA","TRANSFERENCIA","SALDO","RENDA","RECEITA"],n=this.entries.filter(t=>{const r=t.tipo.toUpperCase().trim();return!e.includes(r)&&t.valor<0});if(n.length===0)return[];const o=new Map;for(const t of n){const r=t.tipo||"Sem Tipo",m=Math.abs(t.valor);o.set(r,(o.get(r)||0)+m)}const s=Array.from(o.values()).reduce((t,r)=>t+r,0);return Array.from(o.entries()).map(([t,r])=>({categoria:t,valor:r,percentual:r/s*100})).sort((t,r)=>r.valor-t.valor)}renderEmptyState(){this.container.innerHTML=`
      <div class="budget-chart">
        <h3 class="budget-chart__title">Despesas por Tipo</h3>
        <div class="budget-chart__empty">
          <p>Nenhuma despesa encontrada.</p>
          <p><small>Adicione lançamentos de despesas para visualizar o gráfico.</small></p>
        </div>
      </div>
    `}renderChart(){const e=this.chartData,n=e.map((s,i)=>`
        <div class="budget-chart__legend-item">
          <div class="budget-chart__legend-color" style="background-color: ${this.getColor(i)};"></div>
          <div class="budget-chart__legend-content">
            <div class="budget-chart__legend-label">${s.categoria}</div>
            <div class="budget-chart__legend-value">
              <span>${$(s.valor)}</span>
              <span class="budget-chart__legend-percent">${s.percentual.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      `).join(""),o=e.reduce((s,i)=>s+i.valor,0);this.container.innerHTML=`
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
            <span>${$(o)}</span>
          </div>
        </div>
      </div>
    `}renderDonutChart(e){const r=e.reduce((u,v)=>u+v.valor,0);if(r===0)return"<p>Sem dados de despesas</p>";let m=-90;return`
      <svg 
        viewBox="0 0 200 200" 
        class="budget-chart__svg"
        style="max-width: 200px; max-height: 200px;"
      >
        ${e.map((u,v)=>{const b=u.valor/r*100/100*360,y=m,p=m+b;m=p;const f=y*Math.PI/180,g=p*Math.PI/180,h=100+85*Math.cos(f),E=100+85*Math.sin(f),A=100+85*Math.cos(g),R=100+85*Math.sin(g),k=b>180?1:0,z=["M 100 100",`L ${h} ${E}`,`A 85 85 0 ${k} 1 ${A} ${R}`,"Z"].join(" "),q=this.getColor(v);return`
        <path 
          d="${z}" 
          fill="${q}" 
          stroke="white" 
          stroke-width="2"
          class="budget-chart__segment"
          data-category="${u.categoria}"
          data-value="${u.valor}"
        >
          <title>${u.categoria}: ${$(u.valor)} (${u.percentual.toFixed(1)}%)</title>
        </path>
      `}).join("")}
        
      <circle 
        cx="100" 
        cy="100" 
        r="55" 
        fill="white"
      />
    
      </svg>
    `}getColor(e){const n=["#FF6384","#36A2EB","#FFCE56","#4BC0C0","#9966FF","#FF9F40","#FF6384","#C9CBCF","#4BC0C0","#FF9F40"];return n[e%n.length]}clear(){this.container.innerHTML=""}}function ie(a,e){const n=new oe(a);return n.render(e),n}const ce=`
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
`;async function de(a,e){const n=document.querySelector(".details");if(!n)return;let o=e.map(d=>d.orcamento),s=a||[];const i=async(d,l=0)=>{try{if(console.log("[Details] Preparando gráfico de despesas por tipo..."),!document.getElementById("categoryBudgetChart"))if(l<3){console.warn(`[Details] Container categoryBudgetChart não encontrado (tentativa ${l+1}/3), aguardando...`),setTimeout(()=>i(d,l+1),200);return}else{console.warn("[Details] Container categoryBudgetChart não encontrado após múltiplas tentativas. Gráfico não será renderizado.");return}console.log("[Details] Container encontrado, carregando categorias completas...");const v=await X.getSheetCategoriesComplete();if(!v||v.length===0){console.log("[Details] Nenhuma categoria completa encontrada");return}console.log("[Details] Fazendo JOIN entre entries e categoriesComplete...");const _=new Map;for(const g of v)_.set(g.categoria.toLowerCase(),g.tipo);console.log("[Details] Categorias mapeadas:",Array.from(_.entries()));const b=s.filter(g=>d.includes(g.orcamento));console.log(`[Details] Filtrando ${s.length} entries por ${d.length} orçamentos -> ${b.length} entries`);const y=[...new Set(b.map(g=>g.categoria).filter(g=>g))];console.log("[Details] 📋 Categorias presentes nos entries filtrados:",y);const p=b.map(g=>{const h=(g.categoria||"").toLowerCase(),E=_.get(h)||"Sem Tipo";return{categoria:g.categoria||"",valor:g.valor||0,tipo:E}}),f=p.filter(g=>g.tipo==="Sem Tipo");if(f.length>0){console.warn(`[Details] ⚠️ Encontrados ${f.length} entries SEM TIPO:`),console.table(f.map(h=>({categoria:h.categoria,valor:h.valor,tipo:h.tipo})));const g=[...new Set(f.map(h=>h.categoria))];console.warn("[Details] 📋 Categorias SEM TIPO encontradas:",g),g.forEach(h=>{const E=_.has(h);console.warn(`[Details] Categoria "${h}" existe no mapa? ${E}`)})}console.log("[Details] Renderizando gráfico de despesas por tipo..."),ie("categoryBudgetChart",p),console.log("[Details] ✅ Gráfico de despesas por tipo renderizado com sucesso")}catch(u){console.error("[Details] Erro ao renderizar gráfico de despesas:",u)}},t=d=>{const l={};return d.forEach(c=>{!c.conta||c.conta.trim()===""||(l[c.conta]=(l[c.conta]||0)+(c.valor||0))}),Object.entries(l).map(([c,u])=>({conta:c,total:u}))},r=d=>{const l={};return d.forEach(c=>{const u=c.categoria||"Sem categoria";l[u]=(l[u]||0)+(c.valor||0)}),Object.entries(l).map(([c,u])=>({categoria:c,total:u}))},m=async d=>{const l=Array.isArray(d)?d:[d];n.innerHTML=ce,n.style.display="";const c=n.querySelector("#detail-saldo"),u=n.querySelector("#detail-accounts-cards"),v=n.querySelector("#detail-categories-cards"),_=s.filter(y=>l.includes(y.orcamento));if(!_.length){c&&(c.textContent=C(0)),await i(l);return}const b=_.reduce((y,p)=>y+(p.valor||0),0);c&&(c.textContent=C(b)),u&&(u.innerHTML="",t(_).forEach(({conta:y,total:p})=>{const f=document.createElement("div");f.className="details__card details__card--clickable",f.dataset.conta=y,f.innerHTML=`
          <div class="details__card-title">${y}</div>
          <div class="details__card-value">${C(p)}</div>
        `,f.addEventListener("click",()=>{const g=encodeURIComponent(y);window.location.href=`lancamentos.html?conta=${g}`}),u.appendChild(f)})),v&&(v.innerHTML="",r(_).filter(p=>p.total<0).sort((p,f)=>p.total-f.total).slice(0,10).forEach((p,f)=>{const g=document.createElement("div");g.className="category-card",g.dataset.categoria=p.categoria,g.innerHTML=`
          <div class="category-card__rank">#${f+1}</div>
          <div class="category-card__content">
            <div class="category-card__name">${p.categoria}</div>
            <div class="category-card__value">${C(p.total)}</div>
          </div>
        `,g.addEventListener("click",()=>{const h=encodeURIComponent(p.categoria);window.location.href=`lancamentos.html?categoria=${h}`}),v.appendChild(g)})),await i(l)};o.length>0?await m(o):await i([]),document.addEventListener("detail:show",async d=>{const c=d.detail.orcamento;o.includes(c)?o=o.filter(u=>u!==c):o.push(c),await m(o)}),document.addEventListener("cards:updated",async d=>{const l=d,{allEntries:c}=l.detail||{};c&&(s=c,await m(o))})}function le(a=[],e="orcamento",n=-5,o=35){const{startSerial:s,endSerial:i}=j(n,o);return a.filter(t=>{const r=t&&t[e];return typeof r=="number"&&!Number.isNaN(r)&&r>=s&&r<=i})}function I(a=[],e="orcamento"){const n=new Map;return a.forEach(s=>{let i=s&&s[e],t=Number(i);if(!Number.isFinite(t)&&typeof i=="string"&&i.includes("/")){const d=i.split("/");if(d.length===3){const[l,c,u]=d.map(v=>Number(v));[l,c,u].every(Number.isFinite)&&(t=S(new Date(u,c-1,l)))}else if(d.length===2){const[l,c]=d.map(u=>Number(u));[l,c].every(Number.isFinite)&&(t=S(new Date(c,l-1,1)))}}if(!Number.isFinite(t))return;const r=Number(s.valor)||0,m=n.get(t)||{orcamento:t,sum:0,count:0,incomes:0,expenses:0};m.sum+=r,m.count+=1,r>=0?m.incomes+=r:m.expenses+=r,n.set(t,m)}),Array.from(n.values()).map(s=>({orcamento:s.orcamento,label:B(s.orcamento),count:s.count,sum:Number(s.sum.toFixed(2)),incomes:Number(s.incomes.toFixed(2)),expenses:Number(s.expenses.toFixed(2))})).sort((s,i)=>i.orcamento-s.orcamento)}function L(a=[],e="orcamento"){const n=s=>{let i=Number(s);if(Number.isFinite(i))return i;if(typeof s=="string"&&s.includes("/")){const t=s.split("/");if(t.length===3){const[r,m,d]=t.map(l=>Number(l));if([r,m,d].every(Number.isFinite))return S(new Date(d,m-1,r))}else if(t.length===2){const[r,m]=t.map(d=>Number(d));if([r,m].every(Number.isFinite))return S(new Date(m,r-1,1))}}return null},o=new Map;return a.forEach(s=>{const i=s&&s[e],t=n(i);t===null||!Number.isFinite(t)||o.has(t)||o.set(t,{orcamento:t,label:B(t)})}),Array.from(o.values()).sort((s,i)=>s.orcamento-i.orcamento)}async function D(){if(!await O()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}if(ee(),se(),await G(()=>{console.log("✅ Lançamento adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await U(()=>{console.log("✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await Y(()=>{console.log("✅ Transferência realizada! Recarregue a página para ver as mudanças."),window.location.reload()}),W(()=>Q(),()=>K(),()=>Z()),!N.authStore.isValid){console.log("⚠️ Usuário não autenticado");return}if(!(await ue()).isValid){ge();return}await me(),console.log("✅ Dashboard inicializado")}async function ue(){try{const e=await(await fetch(`${V.configStatus}`,{method:"GET",headers:{Authorization:`Bearer ${N.authStore.token}`}})).json();return{isValid:e.hasRefreshToken&&e.hasSheetId}}catch(a){return console.error("Erro ao verificar configuração:",a),{isValid:!1}}}function ge(){const a=document.getElementById("configBtn");a&&(a.style.display="");const e=document.getElementById("summaryCards");e&&(e.style.display="none");const n=document.querySelector(".dashboard__col--right.details");n&&(n.style.display="none");const o=document.getElementById("openEntryModal");o&&(o.style.display="none");const s=document.querySelector(".dashboard__header");if(s&&!document.getElementById("configMessage")){const i=document.createElement("p");i.id="configMessage",i.style.marginTop="1rem",i.textContent='Integração com Google não configurada. Clique em "Configurar Integração" para continuar.',s.appendChild(i);const t=document.createElement("a");t.href="/dashboard/configuracao.html",t.className="button primary",t.style.marginTop="1rem",t.style.display="inline-block",t.textContent="⚙️ Configurar Integração",s.appendChild(t)}}async function me(){try{const a=await J.fetchEntries(0,!1),e=(a==null?void 0:a.entries)??[];if(!e||e.length===0){pe();return}window.allEntries=e;const n=I(e);window.allBudgets=L(e);const o=le(e),s=I(o),i=L(o);window.filteredEntries=o,window.summaryByBudget=s,window.budgetsInInterval=i;const t={};s.forEach(r=>{t[r.label]=!0}),ae(n,t),await de(e,i)}catch(a){console.error("Erro ao carregar dados:",a),re("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.")}}function pe(){const a=document.getElementById("summaryCards");a&&(a.style.display="none");const e=document.querySelector(".dashboard__col--right.details");e&&(e.style.display="none");const n=document.getElementById("openEntryModal");n&&(n.style.display="");const o=document.querySelector(".dashboard__header");if(o&&!document.getElementById("firstEntryMessage")){const s=document.createElement("div");s.id="firstEntryMessage",s.style.marginTop="1rem",s.className="notice",s.textContent='Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.',o.appendChild(s)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",D):D();
