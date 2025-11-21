var G=Object.defineProperty;var X=(a,e,t)=>e in a?G(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var x=(a,e,t)=>X(a,typeof e!="symbol"?e+"":e,t);import{C as U,c as B,v as Y,p as H,A as W}from"./auth.js";import{r as J}from"./user-menu.js";import{e as K,t as $,a as O,g as Z,i as Q,b as ee,c as te,d as ae,l as ne,o as oe,f as re,h as se}from"./fab-menu.js";import{SheetsService as ie}from"./sheets.js";const ce=new U(B.pocketbaseUrl);B.isDevelopment&&(console.log("[PocketBase] Inicializado em modo desenvolvimento"),console.log("[PocketBase] URL:",B.pocketbaseUrl));typeof window<"u"&&(window.pb=ce);function I(){if(document.getElementById("logoutModal"))return;document.body.insertAdjacentHTML("beforeend",`
    <div id="logoutModal" class="confirm-modal" style="display:none;">
      <div class="confirm-modal__content">
        <button class="confirm-modal__close" id="closeLogoutModal">×</button>
        <h3 class="confirm-modal__title">Confirmar Saída</h3>
        
        <div class="confirm-modal__body">
          <p class="confirm-modal__message">
            Deseja realmente sair? Você será desconectado.
          </p>
          
          <p class="confirm-modal__warning">
            Seus dados estão salvos e você pode fazer login novamente a qualquer momento.
          </p>
        </div>
        
        <div class="confirm-modal__actions">
          <button type="button" class="button" id="cancelLogoutBtn">Cancelar</button>
          <button type="button" class="button error" id="confirmLogoutBtn">🚪 Sair</button>
        </div>
      </div>
    </div>
  `)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",I):I();function L(a){return Number(a).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}let F=[],k={};function de(a,e){const t=document.getElementById("summaryCards");if(!t)return;F=a||[],k=e||{};const r=F.slice().sort((n,s)=>s.orcamento-n.orcamento);t.className="financial-cards",t.innerHTML="",r.forEach(n=>{k[n.label]===!0?t.appendChild(le(n)):t.appendChild(ue(n))}),t.querySelectorAll(".financial-card--inactive").forEach(n=>{const s=n;s.style.cursor="pointer",s.addEventListener("click",D)}),t.querySelectorAll(".financial-card__close").forEach(n=>{n.addEventListener("click",P)})}function le(a){const e=document.createElement("div"),t=a.sum>=0?"financial-card--incomes":"financial-card--expenses";return e.className=`financial-card ${t}`,e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a.label}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a.label}</h3>
    </div>
    <div class="financial-card__value">${L(a.sum)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${L(a.incomes)}</div>
      <div class="financial-card__detail">Despesas: ${L(a.expenses)}</div>
    </div>
  `,e}function ue(a){const e=document.createElement("div");return e.className="financial-card financial-card--inactive",e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <div class="financial-card__title">${a.label}</div>
    <div class="financial-card__value">...</div>
  `,e}function D(){const a=this.dataset.budget,e=parseFloat(this.dataset.sum),t=parseFloat(this.dataset.incomes),r=parseFloat(this.dataset.expenses),o=Number(this.dataset.orcamento);this.classList.remove("financial-card--inactive");const i=e>=0?"financial-card--incomes":"financial-card--expenses";this.classList.add(i),this.style.cursor="default",this.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a}</h3>
    </div>
    <div class="financial-card__value">${L(e)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${L(t)}</div>
      <div class="financial-card__detail">Despesas: ${L(r)}</div>
    </div>
  `,this.removeEventListener("click",D);const n=this.querySelector(".financial-card__toggle");n&&n.addEventListener("click",function(c){c.stopPropagation();const w=this.closest(".financial-card").querySelector(".financial-card__details").classList.toggle("financial-card__details--hidden");this.setAttribute("aria-expanded",String(!w)),this.textContent=w?"Mostrar detalhes":"Ocultar detalhes"});const s=this.querySelector(".financial-card__close");s&&s.addEventListener("click",P),document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:o}}))}function P(a){a.stopPropagation();const e=this.closest(".financial-card"),t=e.dataset.budget,r=e.dataset.sum,o=e.dataset.incomes,i=e.dataset.expenses,n=e.dataset.orcamento;e.className="financial-card financial-card--inactive",e.style.cursor="pointer",e.innerHTML=`
    <div class="financial-card__title">${t}</div>
    <div class="financial-card__value">...</div>
  `,e.dataset.budget=t,e.dataset.sum=r,e.dataset.incomes=o,e.dataset.expenses=i,e.dataset.orcamento=n;const s=e.cloneNode(!0);e.replaceWith(s);const c=document.querySelector(`.financial-card--inactive[data-budget="${t}"]`);c&&(c.style.cursor="pointer",c.addEventListener("click",D));const _=Number(n);document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:_}}))}function me(){const a=document.getElementById("summaryCards");a==null||a.addEventListener("click",e=>{const r=e.target.closest(".financial-card__toggle");if(!r)return;const i=r.closest(".financial-card").querySelector(".financial-card__details"),n=i==null?void 0:i.classList.toggle("financial-card__details--hidden");r.setAttribute("aria-expanded",String(!n)),r.textContent=n?"Mostrar detalhes":"Ocultar detalhes"})}function V(a="Verifique sua conexão e tente novamente"){const e=document.getElementById("summaryCards");e&&(e.className="financial-cards",e.innerHTML=`
    <div class="financial-card financial-card--saldo">
      <div class="financial-card__header">
        <h3 class="financial-card__title">Erro ao carregar dados</h3>
      </div>
      <div class="financial-card__value">${a}</div>
    </div>
  `)}function N(a){return a.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2})}class ge{constructor(e){x(this,"container");x(this,"entries",[]);x(this,"chartData",[]);const t=document.getElementById(e);if(!t)throw new Error(`Container ${e} não encontrado`);this.container=t}render(e){if(this.entries=e,this.chartData=this.calculateExpenseData(),this.chartData.length===0){this.renderEmptyState();return}this.renderChart()}calculateExpenseData(){const e=["TRANSFERÊNCIA","TRANSFERENCIA","SALDO","RENDA","RECEITA"],t=this.entries.filter(n=>{const s=n.tipo.toUpperCase().trim();return!e.includes(s)&&n.valor<0});if(t.length===0)return[];const r=new Map;for(const n of t){const s=n.tipo||"Sem Tipo",c=Math.abs(n.valor);r.set(s,(r.get(s)||0)+c)}const o=Array.from(r.values()).reduce((n,s)=>n+s,0);return Array.from(r.entries()).map(([n,s])=>({categoria:n,valor:s,percentual:s/o*100})).sort((n,s)=>s.valor-n.valor)}renderEmptyState(){this.container.innerHTML=`
      <div class="budget-chart">
        <h3 class="budget-chart__title">Despesas por Tipo</h3>
        <div class="budget-chart__empty">
          <p>Nenhuma despesa encontrada.</p>
          <p><small>Adicione lançamentos de despesas para visualizar o gráfico.</small></p>
        </div>
      </div>
    `}renderChart(){const e=this.chartData,t=e.map((o,i)=>`
        <div class="budget-chart__legend-item">
          <div class="budget-chart__legend-color" style="background-color: ${this.getColor(i)};"></div>
          <div class="budget-chart__legend-content">
            <div class="budget-chart__legend-label">${o.categoria}</div>
            <div class="budget-chart__legend-value">
              <span>${N(o.valor)}</span>
              <span class="budget-chart__legend-percent">${o.percentual.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      `).join(""),r=e.reduce((o,i)=>o+i.valor,0);this.container.innerHTML=`
      <div class="budget-chart">
        <h3 class="budget-chart__title">Despesas por Tipo</h3>
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
            <span>${N(r)}</span>
          </div>
        </div>
      </div>
    `}renderDonutChart(e){const s=e.reduce((E,M)=>E+M.valor,0);if(s===0)return"<p>Sem dados de despesas</p>";let c=-90;return`
      <svg 
        viewBox="0 0 200 200" 
        class="budget-chart__svg"
        style="max-width: 200px; max-height: 200px;"
      >
        ${e.map((E,M)=>{const g=E.valor/s*100/100*360,p=c,h=c+g;c=h;const b=p*Math.PI/180,u=h*Math.PI/180,d=100+85*Math.cos(b),m=100+85*Math.sin(b),y=100+85*Math.cos(u),v=100+85*Math.sin(u),f=g>180?1:0,C=["M 100 100",`L ${d} ${m}`,`A 85 85 0 ${f} 1 ${y} ${v}`,"Z"].join(" "),T=this.getColor(M);return`
        <path 
          d="${C}" 
          fill="${T}" 
          stroke="white" 
          stroke-width="2"
          class="budget-chart__segment"
          data-category="${E.categoria}"
          data-value="${E.valor}"
        >
          <title>${E.categoria}: ${N(E.valor)} (${E.percentual.toFixed(1)}%)</title>
        </path>
      `}).join("")}
        
      <circle 
        cx="100" 
        cy="100" 
        r="55" 
        fill="white"
      />
    
      </svg>
    `}getColor(e){const t=["#FF6384","#36A2EB","#FFCE56","#4BC0C0","#9966FF","#FF9F40","#FF6384","#C9CBCF","#4BC0C0","#FF9F40"];return t[e%t.length]}clear(){this.container.innerHTML=""}}function pe(a,e){const t=new ge(a);return t.render(e),t}const fe=`
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
`;async function he(a,e){const t=document.querySelector(".details");if(!t)return;let r=e.map(l=>l.orcamento),o=a||[];const i="excludedAccounts",n=()=>{try{const l=localStorage.getItem(i);if(l)return new Set(JSON.parse(l))}catch(l){console.error("Erro ao carregar contas excluídas:",l)}return new Set},s=l=>{try{localStorage.setItem(i,JSON.stringify(Array.from(l)))}catch(g){console.error("Erro ao salvar contas excluídas:",g)}},c=n(),_=async(l,g=0)=>{try{if(console.log("[Details] Preparando gráfico de despesas por tipo..."),!document.getElementById("categoryBudgetChart"))if(g<3){console.warn(`[Details] Container categoryBudgetChart não encontrado (tentativa ${g+1}/3), aguardando...`),setTimeout(()=>_(l,g+1),200);return}else{console.warn("[Details] Container categoryBudgetChart não encontrado após múltiplas tentativas. Gráfico não será renderizado.");return}console.log("[Details] Container encontrado, carregando categorias completas...");const b=await ie.getSheetCategoriesComplete();if(!b||b.length===0){console.log("[Details] Nenhuma categoria completa encontrada");return}console.log("[Details] Fazendo JOIN entre entries e categoriesComplete...");const u=new Map;for(const f of b)u.set(f.categoria.toLowerCase(),f.tipo);console.log("[Details] Categorias mapeadas:",Array.from(u.entries()));const d=o.filter(f=>l.includes(f.orcamento));console.log(`[Details] Filtrando ${o.length} entries por ${l.length} orçamentos -> ${d.length} entries`);const m=[...new Set(d.map(f=>f.categoria).filter(f=>f))];console.log("[Details] 📋 Categorias presentes nos entries filtrados:",m);const y=d.map(f=>{const C=(f.categoria||"").toLowerCase(),T=u.get(C)||"Sem Tipo";return{categoria:f.categoria||"",valor:f.valor||0,tipo:T}}),v=y.filter(f=>f.tipo==="Sem Tipo");if(v.length>0){console.warn(`[Details] ⚠️ Encontrados ${v.length} entries SEM TIPO:`),console.table(v.map(C=>({categoria:C.categoria,valor:C.valor,tipo:C.tipo})));const f=[...new Set(v.map(C=>C.categoria))];console.warn("[Details] 📋 Categorias SEM TIPO encontradas:",f),f.forEach(C=>{const T=u.has(C);console.warn(`[Details] Categoria "${C}" existe no mapa? ${T}`)})}console.log("[Details] Renderizando gráfico de despesas por tipo..."),pe("categoryBudgetChart",y),console.log("[Details] ✅ Gráfico de despesas por tipo renderizado com sucesso")}catch(h){console.error("[Details] Erro ao renderizar gráfico de despesas:",h)}},S=()=>{const l=document.querySelector("#detail-saldo"),g=document.querySelector("#detail-accounts-cards"),p=document.querySelector(".dashboard__balance-section .details__aggregates"),h=window.accountSummary||[];console.log("🎨 Renderizando todas as contas:",h),p&&p.classList.remove("loading");const b=h.reduce((u,d)=>c.has(d.conta)?u:u+d.total,0);l&&(l.textContent=L(b)),g&&(g.innerHTML="",h.forEach(({conta:u,total:d})=>{const m=document.createElement("div"),y=c.has(u);m.className=`details__card details__card--clickable${y?" details__card--excluded":""}`,m.dataset.conta=u;const v=document.createElement("div");v.className="details__card-content",v.innerHTML=`
          <div class="details__card-info">
            <span class="details__card-icon">${y?"💳":""}</span>
            <span class="details__card-title">${u}</span>
            <span class="details__card-value">${L(d)}</span>
          </div>
        `,m.appendChild(v),m.addEventListener("click",()=>{const f=v.querySelector(".details__card-icon");c.has(u)?(c.delete(u),m.classList.remove("details__card--excluded"),f&&(f.textContent="")):(c.add(u),m.classList.add("details__card--excluded"),f&&(f.textContent="💳")),s(c);const C=h.reduce((T,A)=>c.has(A.conta)?T:T+A.total,0);l&&(l.textContent=L(C))}),g.appendChild(m)}))},w=l=>{const g={};return l.forEach(p=>{const h=p.categoria||"Sem categoria";g[h]=(g[h]||0)+(p.valor||0)}),Object.entries(g).map(([p,h])=>({categoria:p,total:h}))},E=(l,g)=>{const p=t.querySelector("#detail-entries"),h=t.querySelector("#detail-entries-title"),b=t.querySelector("#entries-list");if(!p||!b||!h)return;h.innerHTML=`<span id="lancamentos">Lançamentos da Categoria: ${l}</span>`;const u=o.filter(d=>g.includes(d.orcamento)&&(d.categoria||"Sem categoria")===l&&d.valor<0);if(u.sort((d,m)=>{if(!d.data&&!m.data)return 0;if(!d.data)return 1;if(!m.data)return-1;const y=new Date(d.data).getTime(),v=new Date(m.data).getTime();return isNaN(y)&&isNaN(v)?0:isNaN(y)?1:isNaN(v)?-1:v-y}),p.classList.remove("details__category-entries--hidden"),b.innerHTML="",u.length===0){b.innerHTML='<p class="category-entries-empty">Nenhum lançamento encontrado nesta categoria.</p>';return}u.forEach(d=>{const m=document.createElement("div");m.className="category-entry-card";let y="--";if(d.data&&typeof d.data=="number"&&d.data>0){const v=K(d.data,!0);v&&(y=v.toLocaleDateString("pt-BR")+" "+v.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}))}m.innerHTML=`
        <div class="category-entry-card__date">${y}</div>
        <div class="category-entry-card__description">${d.descricao||"Sem descrição"}</div>
        <div class="category-entry-card__value">${L(d.valor||0)}</div>
      `,b.appendChild(m)}),setTimeout(()=>{const d=document.getElementById("lancamentos");d&&d.scrollIntoView({behavior:"smooth",block:"start"})},100)},M=async l=>{const g=Array.isArray(l)?l:[l];t.innerHTML=fe,t.style.display="";const p=t.querySelector("#detail-categories-cards"),h=o.filter(b=>g.includes(b.orcamento));p&&(p.innerHTML="",(h.length>0?w(h).filter(u=>u.total<0).sort((u,d)=>u.total-d.total).slice(0,10):[]).forEach((u,d)=>{const m=document.createElement("div");m.className="category-card",m.dataset.categoria=u.categoria,m.innerHTML=`
          <div class="category-card__rank">#${d+1}</div>
          <div class="category-card__content">
            <div class="category-card__name">${u.categoria}</div>
            <div class="category-card__value">${L(u.total)}</div>
          </div>
        `,m.addEventListener("click",()=>{p.querySelectorAll(".category-card").forEach(v=>{v.classList.remove("category-card--selected")});const y=document.querySelector("#detail-accounts-cards");y&&y.querySelectorAll(".details__card").forEach(v=>{v.classList.remove("details__card--selected")}),m.classList.add("category-card--selected"),E(u.categoria,g)}),p.appendChild(m)})),await _(g)};await M(r),S(),document.addEventListener("detail:show",async l=>{const p=l.detail.orcamento;r.includes(p)?r=r.filter(h=>h!==p):r.push(p),await M(r)}),document.addEventListener("cards:updated",async l=>{const g=l,{allEntries:p}=g.detail||{};p&&(o=p,S(),await M(r))})}function ve(a=[],e="orcamento",t=-5,r=35){const{startSerial:o,endSerial:i}=Z(t,r);return a.filter(n=>{const s=n&&n[e];return typeof s=="number"&&!Number.isNaN(s)&&s>=o&&s<=i})}function R(a=[],e="orcamento"){const t=new Map;return a.forEach(o=>{let i=o&&o[e],n=Number(i);if(!Number.isFinite(n)&&typeof i=="string"&&i.includes("/")){const _=i.split("/");if(_.length===3){const[S,w,E]=_.map(M=>Number(M));[S,w,E].every(Number.isFinite)&&(n=$(new Date(E,w-1,S)))}else if(_.length===2){const[S,w]=_.map(E=>Number(E));[S,w].every(Number.isFinite)&&(n=$(new Date(w,S-1,1)))}}if(!Number.isFinite(n))return;const s=Number(o.valor)||0,c=t.get(n)||{orcamento:n,sum:0,count:0,incomes:0,expenses:0};c.sum+=s,c.count+=1,s>=0?c.incomes+=s:c.expenses+=s,t.set(n,c)}),Array.from(t.values()).map(o=>({orcamento:o.orcamento,label:O(o.orcamento),count:o.count,sum:Number(o.sum.toFixed(2)),incomes:Number(o.incomes.toFixed(2)),expenses:Number(o.expenses.toFixed(2))})).sort((o,i)=>i.orcamento-o.orcamento)}function z(a=[],e="orcamento"){const t=o=>{let i=Number(o);if(Number.isFinite(i))return i;if(typeof o=="string"&&o.includes("/")){const n=o.split("/");if(n.length===3){const[s,c,_]=n.map(S=>Number(S));if([s,c,_].every(Number.isFinite))return $(new Date(_,c-1,s))}else if(n.length===2){const[s,c]=n.map(_=>Number(_));if([s,c].every(Number.isFinite))return $(new Date(c,s-1,1))}}return null},r=new Map;return a.forEach(o=>{const i=o&&o[e],n=t(i);n===null||!Number.isFinite(n)||r.has(n)||r.set(n,{orcamento:n,label:O(n)})}),Array.from(r.values()).sort((o,i)=>o.orcamento-i.orcamento)}function ye(a=[]){const e=new Map;return a.forEach(r=>{if(!r.conta||r.conta.trim()==="")return;const o=Number(r.valor)||0,i=e.get(r.conta)||{total:0,count:0};i.total+=o,i.count+=1,e.set(r.conta,i)}),Array.from(e.entries()).map(([r,o])=>({conta:r,total:Number(o.total.toFixed(2)),count:o.count})).sort((r,o)=>r.conta.localeCompare(o.conta))}async function q(){if(!await Y()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}if(J(),me(),await Q(()=>{console.log("✅ Lançamento adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await ee(()=>{console.log("✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await te(()=>{console.log("✅ Transferência realizada! Recarregue a página para ver as mudanças."),window.location.reload()}),ae(()=>se(),()=>re(),()=>oe()),!H.authStore.isValid){console.log("⚠️ Usuário não autenticado");return}if(!(await _e()).isValid){be();return}const t=document.getElementById("refreshDashboardBtn");t&&t.addEventListener("click",async()=>{console.log("🔄 Atualizando dashboard (limpando cache)...");const r=t.innerHTML;t.disabled=!0,t.innerHTML="⏳ Atualizando...";try{await Ee()}finally{t.disabled=!1,t.innerHTML=r}}),await j(),console.log("✅ Dashboard inicializado")}async function _e(){try{const e=await(await fetch(`${W.configStatus}`,{method:"GET",headers:{Authorization:`Bearer ${H.authStore.token}`}})).json();return{isValid:e.hasRefreshToken&&e.hasSheetId}}catch(a){return console.error("Erro ao verificar configuração:",a),{isValid:!1}}}function be(){const a=document.getElementById("configBtn");a&&(a.style.display="");const e=document.getElementById("summaryCards");e&&(e.style.display="none");const t=document.querySelector(".dashboard__col--right.details");t&&(t.style.display="none");const r=document.getElementById("openEntryModal");r&&(r.style.display="none");const o=document.querySelector(".dashboard__header");if(o&&!document.getElementById("configMessage")){const i=document.createElement("p");i.id="configMessage",i.style.marginTop="1rem",i.textContent='Integração com Google não configurada. Clique em "Configurar Integração" para continuar.',o.appendChild(i);const n=document.createElement("a");n.href="/dashboard/configuracao.html",n.className="button primary",n.style.marginTop="1rem",n.style.display="inline-block",n.textContent="⚙️ Configurar Integração",o.appendChild(n)}}async function Ee(){try{await j(!0),console.log("✅ Dashboard atualizado com sucesso")}catch(a){console.error("❌ Erro ao atualizar dashboard:",a),V("Erro ao atualizar dados. Tente novamente.")}}async function j(a=!1){try{const e=await ne.fetchEntries(0,a),t=(e==null?void 0:e.entries)??[];if(!t||t.length===0){Ce();return}window.allEntries=t;const r=R(t);window.allBudgets=z(t);const o=ve(t),i=R(o),n=z(o);window.accountSummary=ye(t),console.log("📊 Contas agregadas:",window.accountSummary),window.filteredEntries=o,window.summaryByBudget=i,window.budgetsInInterval=n;const s={};i.forEach(c=>{s[c.label]=!0}),de(r,s),await he(t,n)}catch(e){console.error("Erro ao carregar dados:",e),V("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.")}}function Ce(){const a=document.getElementById("summaryCards");a&&(a.style.display="none");const e=document.querySelector(".dashboard__col--right.details");e&&(e.style.display="none");const t=document.getElementById("openEntryModal");t&&(t.style.display="");const r=document.querySelector(".dashboard__header");if(r&&!document.getElementById("firstEntryMessage")){const o=document.createElement("div");o.id="firstEntryMessage",o.style.marginTop="1rem",o.className="notice",o.textContent='Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.',r.appendChild(o)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",q):q();
