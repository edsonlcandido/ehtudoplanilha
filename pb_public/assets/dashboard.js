var Y=Object.defineProperty;var W=(a,e,t)=>e in a?Y(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var $=(a,e,t)=>W(a,typeof e!="symbol"?e+"":e,t);import{b as J,c as D,v as K,p as P,A as Z}from"./auth.js";import{r as Q}from"./user-menu.js";import{t as N,e as V,g as ee,a as te,i as ae,b as ne,c as se,d as oe,l as re,o as ce,f as ie,h as de}from"./fab-menu.js";import{SheetsService as le}from"./sheets.js";const ue=new J(D.pocketbaseUrl);D.isDevelopment&&(console.log("[PocketBase] Inicializado em modo desenvolvimento"),console.log("[PocketBase] URL:",D.pocketbaseUrl));typeof window<"u"&&(window.pb=ue);function k(){if(document.getElementById("logoutModal"))return;document.body.insertAdjacentHTML("beforeend",`
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
  `)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",k):k();function S(a){return Number(a).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}let R=[],q={};function me(a,e){const t=document.getElementById("summaryCards");if(!t)return;R=a||[],q=e||{};const o=R.slice().sort((n,r)=>r.orcamento-n.orcamento);t.className="financial-cards",t.innerHTML="",o.forEach(n=>{q[n.label]===!0?t.appendChild(ge(n)):t.appendChild(pe(n))}),t.querySelectorAll(".financial-card--inactive").forEach(n=>{const r=n;r.style.cursor="pointer",r.addEventListener("click",A)}),t.querySelectorAll(".financial-card__close").forEach(n=>{n.addEventListener("click",G)})}function ge(a){const e=document.createElement("div"),t=a.sum>=0?"financial-card--incomes":"financial-card--expenses";return e.className=`financial-card ${t}`,e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a.label}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a.label}</h3>
    </div>
    <div class="financial-card__value">${S(a.sum)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${S(a.incomes)}</div>
      <div class="financial-card__detail">Despesas: ${S(a.expenses)}</div>
    </div>
  `,e}function pe(a){const e=document.createElement("div");return e.className="financial-card financial-card--inactive",e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <div class="financial-card__title">${a.label}</div>
    <div class="financial-card__value">...</div>
  `,e}function A(){const a=this.dataset.budget,e=parseFloat(this.dataset.sum),t=parseFloat(this.dataset.incomes),o=parseFloat(this.dataset.expenses),s=Number(this.dataset.orcamento);this.classList.remove("financial-card--inactive");const i=e>=0?"financial-card--incomes":"financial-card--expenses";this.classList.add(i),this.style.cursor="default",this.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a}</h3>
    </div>
    <div class="financial-card__value">${S(e)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${S(t)}</div>
      <div class="financial-card__detail">Despesas: ${S(o)}</div>
    </div>
  `,this.removeEventListener("click",A);const n=this.querySelector(".financial-card__toggle");n&&n.addEventListener("click",function(l){l.stopPropagation();const w=this.closest(".financial-card").querySelector(".financial-card__details").classList.toggle("financial-card__details--hidden");this.setAttribute("aria-expanded",String(!w)),this.textContent=w?"Mostrar detalhes":"Ocultar detalhes"});const r=this.querySelector(".financial-card__close");r&&r.addEventListener("click",G),document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:s}}))}function G(a){a.stopPropagation();const e=this.closest(".financial-card"),t=e.dataset.budget,o=e.dataset.sum,s=e.dataset.incomes,i=e.dataset.expenses,n=e.dataset.orcamento;e.className="financial-card financial-card--inactive",e.style.cursor="pointer",e.innerHTML=`
    <div class="financial-card__title">${t}</div>
    <div class="financial-card__value">...</div>
  `,e.dataset.budget=t,e.dataset.sum=o,e.dataset.incomes=s,e.dataset.expenses=i,e.dataset.orcamento=n;const r=e.cloneNode(!0);e.replaceWith(r);const l=document.querySelector(`.financial-card--inactive[data-budget="${t}"]`);l&&(l.style.cursor="pointer",l.addEventListener("click",A));const E=Number(n);document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:E}}))}function fe(){const a=document.getElementById("summaryCards");a==null||a.addEventListener("click",e=>{const o=e.target.closest(".financial-card__toggle");if(!o)return;const i=o.closest(".financial-card").querySelector(".financial-card__details"),n=i==null?void 0:i.classList.toggle("financial-card__details--hidden");o.setAttribute("aria-expanded",String(!n)),o.textContent=n?"Mostrar detalhes":"Ocultar detalhes"})}function j(a="Verifique sua conexão e tente novamente"){const e=document.getElementById("summaryCards");e&&(e.className="financial-cards",e.innerHTML=`
    <div class="financial-card financial-card--saldo">
      <div class="financial-card__header">
        <h3 class="financial-card__title">Erro ao carregar dados</h3>
      </div>
      <div class="financial-card__value">${a}</div>
    </div>
  `)}function he(a=[],e="orcamento",t=-5,o=35){const{startSerial:s,endSerial:i}=ee(t,o);return a.filter(n=>{const r=n&&n[e];return typeof r=="number"&&!Number.isNaN(r)&&r>=s&&r<=i})}function z(a=[],e="orcamento"){const t=new Map;return a.forEach(s=>{let i=s&&s[e],n=Number(i);if(!Number.isFinite(n)&&typeof i=="string"&&i.includes("/")){const E=i.split("/");if(E.length===3){const[L,w,C]=E.map(M=>Number(M));[L,w,C].every(Number.isFinite)&&(n=N(new Date(C,w-1,L)))}else if(E.length===2){const[L,w]=E.map(C=>Number(C));[L,w].every(Number.isFinite)&&(n=N(new Date(w,L-1,1)))}}if(!Number.isFinite(n))return;const r=Number(s.valor)||0,l=t.get(n)||{orcamento:n,sum:0,count:0,incomes:0,expenses:0};l.sum+=r,l.count+=1,r>=0?l.incomes+=r:l.expenses+=r,t.set(n,l)}),Array.from(t.values()).map(s=>({orcamento:s.orcamento,label:V(s.orcamento),count:s.count,sum:Number(s.sum.toFixed(2)),incomes:Number(s.incomes.toFixed(2)),expenses:Number(s.expenses.toFixed(2))})).sort((s,i)=>i.orcamento-s.orcamento)}function H(a=[],e="orcamento"){const t=s=>{let i=Number(s);if(Number.isFinite(i))return i;if(typeof s=="string"&&s.includes("/")){const n=s.split("/");if(n.length===3){const[r,l,E]=n.map(L=>Number(L));if([r,l,E].every(Number.isFinite))return N(new Date(E,l-1,r))}else if(n.length===2){const[r,l]=n.map(E=>Number(E));if([r,l].every(Number.isFinite))return N(new Date(l,r-1,1))}}return null},o=new Map;return a.forEach(s=>{const i=s&&s[e],n=t(i);n===null||!Number.isFinite(n)||o.has(n)||o.set(n,{orcamento:n,label:V(n)})}),Array.from(o.values()).sort((s,i)=>s.orcamento-i.orcamento)}function X(a=[]){const e=new Map;return a.forEach(o=>{const s=String(o.conta||"");if(!s||s.trim()==="")return;const i=Number(o.valor)||0,n=e.get(s)||{total:0,count:0};n.total+=i,n.count+=1,e.set(s,n)}),Array.from(e.entries()).map(([o,s])=>({conta:o,total:Number(s.total.toFixed(2)),count:s.count})).sort((o,s)=>o.conta.localeCompare(s.conta))}function B(a){return a.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2})}class ve{constructor(e){$(this,"container");$(this,"entries",[]);$(this,"chartData",[]);const t=document.getElementById(e);if(!t)throw new Error(`Container ${e} não encontrado`);this.container=t}render(e){if(this.entries=e,this.chartData=this.calculateExpenseData(),this.chartData.length===0){this.renderEmptyState();return}this.renderChart()}calculateExpenseData(){const e=["TRANSFERÊNCIA","TRANSFERENCIA","SALDO","RENDA","RECEITA"],t=this.entries.filter(n=>{const r=n.tipo.toUpperCase().trim();return!e.includes(r)&&n.valor<0});if(t.length===0)return[];const o=new Map;for(const n of t){const r=n.tipo||"Sem Tipo",l=Math.abs(n.valor);o.set(r,(o.get(r)||0)+l)}const s=Array.from(o.values()).reduce((n,r)=>n+r,0);return Array.from(o.entries()).map(([n,r])=>({categoria:n,valor:r,percentual:r/s*100})).sort((n,r)=>r.valor-n.valor)}renderEmptyState(){this.container.innerHTML=`
      <div class="budget-chart">
        <h3 class="budget-chart__title">Gastos por tipo</h3>
        <div class="budget-chart__empty">
          <p>Nenhuma despesa encontrada.</p>
          <p><small>Adicione lançamentos de despesas para visualizar o gráfico.</small></p>
        </div>
      </div>
    `}renderChart(){const e=this.chartData,t=e.map((s,i)=>`
        <div class="budget-chart__legend-item">
          <div class="budget-chart__legend-color" style="background-color: ${this.getColor(i)};"></div>
          <div class="budget-chart__legend-content">
            <div class="budget-chart__legend-label">${s.categoria}</div>
            <div class="budget-chart__legend-value">
              <span>${B(s.valor)}</span>
              <span class="budget-chart__legend-percent">${s.percentual.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      `).join(""),o=e.reduce((s,i)=>s+i.valor,0);this.container.innerHTML=`
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
            <span>${B(o)}</span>
          </div>
        </div>
      </div>
    `}renderDonutChart(e){const r=e.reduce((C,M)=>C+M.valor,0);if(r===0)return"<p>Sem dados de despesas</p>";let l=-90;return`
      <svg 
        viewBox="0 0 200 200" 
        class="budget-chart__svg"
        style="max-width: 200px; max-height: 200px;"
      >
        ${e.map((C,M)=>{const d=C.valor/r*100/100*360,u=l,g=l+d;l=g;const h=u*Math.PI/180,_=g*Math.PI/180,m=100+85*Math.cos(h),c=100+85*Math.sin(h),f=100+85*Math.cos(_),p=100+85*Math.sin(_),y=d>180?1:0,v=["M 100 100",`L ${m} ${c}`,`A 85 85 0 ${y} 1 ${f} ${p}`,"Z"].join(" "),b=this.getColor(M);return`
        <path 
          d="${v}" 
          fill="${b}" 
          stroke="white" 
          stroke-width="2"
          class="budget-chart__segment"
          data-category="${C.categoria}"
          data-value="${C.valor}"
        >
          <title>${C.categoria}: ${B(C.valor)} (${C.percentual.toFixed(1)}%)</title>
        </path>
      `}).join("")}
        
      <circle 
        cx="100" 
        cy="100" 
        r="55" 
        fill="white"
      />
    
      </svg>
    `}getColor(e){const t=["#FF6384","#36A2EB","#FFCE56","#4BC0C0","#9966FF","#FF9F40","#FF6384","#C9CBCF","#4BC0C0","#FF9F40"];return t[e%t.length]}clear(){this.container.innerHTML=""}}function ye(a,e){const t=new ve(a);return t.render(e),t}const _e=`
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
`;async function be(a,e){const t=document.querySelector(".details");if(!t)return;let o=e.map(d=>d.orcamento),s=a||[];const i="excludedAccounts",n=()=>{try{const d=localStorage.getItem(i);if(d)return new Set(JSON.parse(d))}catch(d){console.error("Erro ao carregar contas excluídas:",d)}return new Set},r=d=>{try{localStorage.setItem(i,JSON.stringify(Array.from(d)))}catch(u){console.error("Erro ao salvar contas excluídas:",u)}},l=n(),E=async(d,u=0)=>{try{if(console.log("[Details] Preparando gráfico de despesas por tipo..."),!document.getElementById("categoryBudgetChart"))if(u<3){console.warn(`[Details] Container categoryBudgetChart não encontrado (tentativa ${u+1}/3), aguardando...`),setTimeout(()=>E(d,u+1),200);return}else{console.warn("[Details] Container categoryBudgetChart não encontrado após múltiplas tentativas. Gráfico não será renderizado.");return}console.log("[Details] Container encontrado, carregando categorias completas...");const _=await le.getSheetCategoriesComplete();if(!_||_.length===0){console.log("[Details] Nenhuma categoria completa encontrada");return}console.log("[Details] Fazendo JOIN entre entries e categoriesComplete...");const m=new Map;for(const v of _)m.set(v.categoria.toLowerCase(),v.tipo);console.log("[Details] Categorias mapeadas:",Array.from(m.entries()));const c=s.filter(v=>d.includes(v.orcamento));console.log(`[Details] Filtrando ${s.length} entries por ${d.length} orçamentos -> ${c.length} entries`);const f=[...new Set(c.map(v=>v.categoria).filter(v=>v))];console.log("[Details] 📋 Categorias presentes nos entries filtrados:",f);const p=c.map(v=>{const b=(v.categoria||"").toLowerCase(),T=m.get(b)||"Sem Tipo";return{categoria:v.categoria||"",valor:v.valor||0,tipo:T}}),y=p.filter(v=>v.tipo==="Sem Tipo");if(y.length>0){console.warn(`[Details] ⚠️ Encontrados ${y.length} entries SEM TIPO:`),console.table(y.map(b=>({categoria:b.categoria,valor:b.valor,tipo:b.tipo})));const v=[...new Set(y.map(b=>b.categoria))];console.warn("[Details] 📋 Categorias SEM TIPO encontradas:",v),v.forEach(b=>{const T=m.has(b);console.warn(`[Details] Categoria "${b}" existe no mapa? ${T}`)})}console.log("[Details] Renderizando gráfico de despesas por tipo..."),ye("categoryBudgetChart",p),console.log("[Details] ✅ Gráfico de despesas por tipo renderizado com sucesso")}catch(h){console.error("[Details] Erro ao renderizar gráfico de despesas:",h)}},L=()=>{const d=document.querySelector("#detail-saldo"),u=document.querySelector("#detail-accounts-cards"),g=document.querySelector(".dashboard__balance-section .details__aggregates"),h=window.accountSummary||[];console.log("🎨 Renderizando todas as contas:",h),g&&g.classList.remove("loading");const _=h.reduce((m,c)=>l.has(c.conta)?m:m+c.total,0);if(d&&(d.textContent=S(_)),u){u.innerHTML="",h.forEach(({conta:c,total:f})=>{const p=document.createElement("div"),y=l.has(c);p.className=`details__card details__card--clickable${y?" details__card--excluded":""}`,p.dataset.conta=c;const v=document.createElement("div");v.className="details__card-content",v.innerHTML=`
          <div class="details__card-info">
            <span class="details__card-icon">${y?"💳":""}</span>
            <span class="details__card-title">${c}</span>
            <span class="details__card-value">${S(f)}</span>
          </div>
        `,p.appendChild(v),p.addEventListener("click",()=>{const b=v.querySelector(".details__card-icon");l.has(c)?(l.delete(c),p.classList.remove("details__card--excluded"),b&&(b.textContent="")):(l.add(c),p.classList.add("details__card--excluded"),b&&(b.textContent="💳")),r(l);const T=h.reduce((I,F)=>l.has(F.conta)?I:I+F.total,0);d&&(d.textContent=S(T))}),u.appendChild(p)});const m=document.querySelector("#toggle-accounts-btn");if(m&&u){const c=()=>{const y=u.classList.contains("details__cards--hidden");m.textContent=y?"👁️ Mostrar contas":"🙈 Ocultar contas"},f=m._toggleListener;f&&m.removeEventListener("click",f);const p=()=>{u.classList.toggle("details__cards--hidden"),c()};m._toggleListener=p,m.addEventListener("click",p),c()}}},w=d=>{const u={};return d.forEach(g=>{const h=g.categoria||"Sem categoria";u[h]=(u[h]||0)+(g.valor||0)}),Object.entries(u).map(([g,h])=>({categoria:g,total:h}))},C=d=>{const u=document.querySelector("#detail-budget-accounts-cards"),g=document.querySelector("#detail-budget-total");if(!u)return;const h=s.filter(c=>d.includes(c.orcamento)),_=h.reduce((c,f)=>c+f.valor,0);g&&(g.textContent=S(_));const m=X(h);if(u.innerHTML="",m.length===0){u.innerHTML='<p class="category-entries-empty">Nenhuma conta encontrada nos orçamentos selecionados.</p>';return}m.forEach(({conta:c,total:f})=>{const p=document.createElement("div");p.className="details__card",p.innerHTML=`
        <div class="details__card-info">
          <span class="details__card-title">${c}</span>
          <span class="details__card-value">${S(f)}</span>
        </div>
      `,u.appendChild(p)})},M=(d,u)=>{const g=t.querySelector("#detail-entries"),h=t.querySelector("#detail-entries-title"),_=t.querySelector("#entries-list");if(!g||!_||!h)return;h.innerHTML=`<span id="lancamentos">Lançamentos da Categoria: ${d}</span>`;const m=s.filter(c=>u.includes(c.orcamento)&&(c.categoria||"Sem categoria")===d&&c.valor<0);if(m.sort((c,f)=>{if(!c.data&&!f.data)return 0;if(!c.data)return 1;if(!f.data)return-1;const p=new Date(c.data).getTime(),y=new Date(f.data).getTime();return isNaN(p)&&isNaN(y)?0:isNaN(p)?1:isNaN(y)?-1:y-p}),g.classList.remove("details__category-entries--hidden"),_.innerHTML="",m.length===0){_.innerHTML='<p class="category-entries-empty">Nenhum lançamento encontrado nesta categoria.</p>';return}m.forEach(c=>{const f=document.createElement("div");f.className="category-entry-card";let p="--";if(c.data&&typeof c.data=="number"&&c.data>0){const y=te(c.data,!0);y&&(p=y.toLocaleDateString("pt-BR")+" "+y.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}))}f.innerHTML=`
        <div class="category-entry-card__date">${p}</div>
        <div class="category-entry-card__description">${c.descricao||"Sem descrição"}</div>
        <div class="category-entry-card__value">${S(c.valor||0)}</div>
      `,_.appendChild(f)}),setTimeout(()=>{const c=document.getElementById("lancamentos");c&&c.scrollIntoView({behavior:"smooth",block:"start"})},100)},x=async d=>{const u=Array.isArray(d)?d:[d];t.innerHTML=_e,t.style.display="";const g=t.querySelector("#detail-categories-cards"),h=s.filter(_=>u.includes(_.orcamento));g&&(g.innerHTML="",(h.length>0?w(h).filter(m=>m.total<0).sort((m,c)=>m.total-c.total).slice(0,10):[]).forEach((m,c)=>{const f=document.createElement("div");f.className="category-card",f.dataset.categoria=m.categoria,f.innerHTML=`
          <div class="category-card__rank">#${c+1}</div>
          <div class="category-card__content">
            <div class="category-card__name">${m.categoria}</div>
            <div class="category-card__value">${S(m.total)}</div>
          </div>
        `,f.addEventListener("click",()=>{g.querySelectorAll(".category-card").forEach(y=>{y.classList.remove("category-card--selected")});const p=document.querySelector("#detail-accounts-cards");p&&p.querySelectorAll(".details__card").forEach(y=>{y.classList.remove("details__card--selected")}),f.classList.add("category-card--selected"),M(m.categoria,u)}),g.appendChild(f)})),await E(u),C(u)};await x(o),L(),document.addEventListener("detail:show",async d=>{const g=d.detail.orcamento;o.includes(g)?o=o.filter(h=>h!==g):o.push(g),await x(o)}),document.addEventListener("cards:updated",async d=>{const u=d,{allEntries:g}=u.detail||{};g&&(s=g,L(),await x(o))})}async function O(){if(!await K()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}if(Q(),fe(),await ae(()=>{console.log("✅ Lançamento adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await ne(()=>{console.log("✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await se(()=>{console.log("✅ Transferência realizada! Recarregue a página para ver as mudanças."),window.location.reload()}),oe(()=>de(),()=>ie(),()=>ce()),!P.authStore.isValid){console.log("⚠️ Usuário não autenticado");return}if(!(await Ee()).isValid){Ce();return}const t=document.getElementById("refreshDashboardBtn");t&&t.addEventListener("click",async()=>{console.log("🔄 Atualizando dashboard (limpando cache)...");const o=t.innerHTML;t.disabled=!0,t.innerHTML="⏳ Atualizando...";try{await Se()}finally{t.disabled=!1,t.innerHTML=o}}),await U(),console.log("✅ Dashboard inicializado")}async function Ee(){try{const a=await P.send(`${Z.configStatus}`,{method:"GET"});return{isValid:a.hasRefreshToken&&a.hasSheetId}}catch(a){return console.error("Erro ao verificar configuração:",a),{isValid:!1}}}function Ce(){const a=document.getElementById("configBtn");a&&(a.style.display="");const e=document.getElementById("summaryCards");e&&(e.style.display="none");const t=document.querySelector(".dashboard__col--right.details");t&&(t.style.display="none");const o=document.getElementById("openEntryModal");o&&(o.style.display="none");const s=document.querySelector(".dashboard__header");if(s&&!document.getElementById("configMessage")){const i=document.createElement("p");i.id="configMessage",i.style.marginTop="1rem",i.textContent='Integração com Google não configurada. Clique em "Configurar Integração" para continuar.',s.appendChild(i);const n=document.createElement("a");n.href="/dashboard/configuracao.html",n.className="button primary",n.style.marginTop="1rem",n.style.display="inline-block",n.textContent="⚙️ Configurar Integração",s.appendChild(n)}}async function Se(){try{await U(!0),console.log("✅ Dashboard atualizado com sucesso")}catch(a){console.error("❌ Erro ao atualizar dashboard:",a),j("Erro ao atualizar dados. Tente novamente.")}}async function U(a=!1){try{const e=await re.fetchEntries(0,a),t=(e==null?void 0:e.entries)??[];if(!t||t.length===0){Le();return}window.allEntries=t;const o=z(t);window.allBudgets=H(t);const s=he(t),i=z(s),n=H(s);window.accountSummary=X(t),console.log("📊 Contas agregadas:",window.accountSummary),window.filteredEntries=s,window.summaryByBudget=i,window.budgetsInInterval=n;const r={};i.forEach(l=>{r[l.label]=!0}),me(o,r),await be(t,n)}catch(e){console.error("Erro ao carregar dados:",e),j("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.")}}function Le(){const a=document.getElementById("summaryCards");a&&(a.style.display="none");const e=document.querySelector(".dashboard__col--right.details");e&&(e.style.display="none");const t=document.getElementById("openEntryModal");t&&(t.style.display="");const o=document.querySelector(".dashboard__header");if(o&&!document.getElementById("firstEntryMessage")){const s=document.createElement("div");s.id="firstEntryMessage",s.style.marginTop="1rem",s.className="notice",s.textContent='Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.',o.appendChild(s)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",O):O();
