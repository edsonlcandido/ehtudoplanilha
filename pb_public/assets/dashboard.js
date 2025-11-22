var Y=Object.defineProperty;var W=(s,e,t)=>e in s?Y(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var x=(s,e,t)=>W(s,typeof e!="symbol"?e+"":e,t);import{C as J,c as A,v as K,p as P,A as Z}from"./auth.js";import{r as Q}from"./user-menu.js";import{t as N,e as V,g as ee,a as te,i as ae,b as ne,c as se,d as oe,l as re,o as ie,f as ce,h as de}from"./fab-menu.js";import{SheetsService as le}from"./sheets.js";const ue=new J(A.pocketbaseUrl);A.isDevelopment&&(console.log("[PocketBase] Inicializado em modo desenvolvimento"),console.log("[PocketBase] URL:",A.pocketbaseUrl));typeof window<"u"&&(window.pb=ue);function k(){if(document.getElementById("logoutModal"))return;document.body.insertAdjacentHTML("beforeend",`
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
  `)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",k):k();function L(s){return Number(s).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}let R=[],z={};function me(s,e){const t=document.getElementById("summaryCards");if(!t)return;R=s||[],z=e||{};const o=R.slice().sort((a,r)=>r.orcamento-a.orcamento);t.className="financial-cards",t.innerHTML="",o.forEach(a=>{z[a.label]===!0?t.appendChild(ge(a)):t.appendChild(pe(a))}),t.querySelectorAll(".financial-card--inactive").forEach(a=>{const r=a;r.style.cursor="pointer",r.addEventListener("click",D)}),t.querySelectorAll(".financial-card__close").forEach(a=>{a.addEventListener("click",G)})}function ge(s){const e=document.createElement("div"),t=s.sum>=0?"financial-card--incomes":"financial-card--expenses";return e.className=`financial-card ${t}`,e.dataset.budget=s.label,e.dataset.sum=String(s.sum),e.dataset.incomes=String(s.incomes),e.dataset.expenses=String(s.expenses),e.dataset.orcamento=String(s.orcamento),e.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${s.label}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${s.label}</h3>
    </div>
    <div class="financial-card__value">${L(s.sum)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${L(s.incomes)}</div>
      <div class="financial-card__detail">Despesas: ${L(s.expenses)}</div>
    </div>
  `,e}function pe(s){const e=document.createElement("div");return e.className="financial-card financial-card--inactive",e.dataset.budget=s.label,e.dataset.sum=String(s.sum),e.dataset.incomes=String(s.incomes),e.dataset.expenses=String(s.expenses),e.dataset.orcamento=String(s.orcamento),e.innerHTML=`
    <div class="financial-card__title">${s.label}</div>
    <div class="financial-card__value">...</div>
  `,e}function D(){const s=this.dataset.budget,e=parseFloat(this.dataset.sum),t=parseFloat(this.dataset.incomes),o=parseFloat(this.dataset.expenses),n=Number(this.dataset.orcamento);this.classList.remove("financial-card--inactive");const c=e>=0?"financial-card--incomes":"financial-card--expenses";this.classList.add(c),this.style.cursor="default",this.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${s}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${s}</h3>
    </div>
    <div class="financial-card__value">${L(e)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${L(t)}</div>
      <div class="financial-card__detail">Despesas: ${L(o)}</div>
    </div>
  `,this.removeEventListener("click",D);const a=this.querySelector(".financial-card__toggle");a&&a.addEventListener("click",function(l){l.stopPropagation();const w=this.closest(".financial-card").querySelector(".financial-card__details").classList.toggle("financial-card__details--hidden");this.setAttribute("aria-expanded",String(!w)),this.textContent=w?"Mostrar detalhes":"Ocultar detalhes"});const r=this.querySelector(".financial-card__close");r&&r.addEventListener("click",G),document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:n}}))}function G(s){s.stopPropagation();const e=this.closest(".financial-card"),t=e.dataset.budget,o=e.dataset.sum,n=e.dataset.incomes,c=e.dataset.expenses,a=e.dataset.orcamento;e.className="financial-card financial-card--inactive",e.style.cursor="pointer",e.innerHTML=`
    <div class="financial-card__title">${t}</div>
    <div class="financial-card__value">...</div>
  `,e.dataset.budget=t,e.dataset.sum=o,e.dataset.incomes=n,e.dataset.expenses=c,e.dataset.orcamento=a;const r=e.cloneNode(!0);e.replaceWith(r);const l=document.querySelector(`.financial-card--inactive[data-budget="${t}"]`);l&&(l.style.cursor="pointer",l.addEventListener("click",D));const E=Number(a);document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:E}}))}function fe(){const s=document.getElementById("summaryCards");s==null||s.addEventListener("click",e=>{const o=e.target.closest(".financial-card__toggle");if(!o)return;const c=o.closest(".financial-card").querySelector(".financial-card__details"),a=c==null?void 0:c.classList.toggle("financial-card__details--hidden");o.setAttribute("aria-expanded",String(!a)),o.textContent=a?"Mostrar detalhes":"Ocultar detalhes"})}function j(s="Verifique sua conexão e tente novamente"){const e=document.getElementById("summaryCards");e&&(e.className="financial-cards",e.innerHTML=`
    <div class="financial-card financial-card--saldo">
      <div class="financial-card__header">
        <h3 class="financial-card__title">Erro ao carregar dados</h3>
      </div>
      <div class="financial-card__value">${s}</div>
    </div>
  `)}function he(s=[],e="orcamento",t=-5,o=35){const{startSerial:n,endSerial:c}=ee(t,o);return s.filter(a=>{const r=a&&a[e];return typeof r=="number"&&!Number.isNaN(r)&&r>=n&&r<=c})}function q(s=[],e="orcamento"){const t=new Map;return s.forEach(n=>{let c=n&&n[e],a=Number(c);if(!Number.isFinite(a)&&typeof c=="string"&&c.includes("/")){const E=c.split("/");if(E.length===3){const[S,w,C]=E.map(M=>Number(M));[S,w,C].every(Number.isFinite)&&(a=N(new Date(C,w-1,S)))}else if(E.length===2){const[S,w]=E.map(C=>Number(C));[S,w].every(Number.isFinite)&&(a=N(new Date(w,S-1,1)))}}if(!Number.isFinite(a))return;const r=Number(n.valor)||0,l=t.get(a)||{orcamento:a,sum:0,count:0,incomes:0,expenses:0};l.sum+=r,l.count+=1,r>=0?l.incomes+=r:l.expenses+=r,t.set(a,l)}),Array.from(t.values()).map(n=>({orcamento:n.orcamento,label:V(n.orcamento),count:n.count,sum:Number(n.sum.toFixed(2)),incomes:Number(n.incomes.toFixed(2)),expenses:Number(n.expenses.toFixed(2))})).sort((n,c)=>c.orcamento-n.orcamento)}function H(s=[],e="orcamento"){const t=n=>{let c=Number(n);if(Number.isFinite(c))return c;if(typeof n=="string"&&n.includes("/")){const a=n.split("/");if(a.length===3){const[r,l,E]=a.map(S=>Number(S));if([r,l,E].every(Number.isFinite))return N(new Date(E,l-1,r))}else if(a.length===2){const[r,l]=a.map(E=>Number(E));if([r,l].every(Number.isFinite))return N(new Date(l,r-1,1))}}return null},o=new Map;return s.forEach(n=>{const c=n&&n[e],a=t(c);a===null||!Number.isFinite(a)||o.has(a)||o.set(a,{orcamento:a,label:V(a)})}),Array.from(o.values()).sort((n,c)=>n.orcamento-c.orcamento)}function X(s=[]){const e=new Map;return s.forEach(o=>{const n=String(o.conta||"");if(!n||n.trim()==="")return;const c=Number(o.valor)||0,a=e.get(n)||{total:0,count:0};a.total+=c,a.count+=1,e.set(n,a)}),Array.from(e.entries()).map(([o,n])=>({conta:o,total:Number(n.total.toFixed(2)),count:n.count})).sort((o,n)=>o.conta.localeCompare(n.conta))}function B(s){return s.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2})}class ve{constructor(e){x(this,"container");x(this,"entries",[]);x(this,"chartData",[]);const t=document.getElementById(e);if(!t)throw new Error(`Container ${e} não encontrado`);this.container=t}render(e){if(this.entries=e,this.chartData=this.calculateExpenseData(),this.chartData.length===0){this.renderEmptyState();return}this.renderChart()}calculateExpenseData(){const e=["TRANSFERÊNCIA","TRANSFERENCIA","SALDO","RENDA","RECEITA"],t=this.entries.filter(a=>{const r=a.tipo.toUpperCase().trim();return!e.includes(r)&&a.valor<0});if(t.length===0)return[];const o=new Map;for(const a of t){const r=a.tipo||"Sem Tipo",l=Math.abs(a.valor);o.set(r,(o.get(r)||0)+l)}const n=Array.from(o.values()).reduce((a,r)=>a+r,0);return Array.from(o.entries()).map(([a,r])=>({categoria:a,valor:r,percentual:r/n*100})).sort((a,r)=>r.valor-a.valor)}renderEmptyState(){this.container.innerHTML=`
      <div class="budget-chart">
        <h3 class="budget-chart__title">Gastos por tipo</h3>
        <div class="budget-chart__empty">
          <p>Nenhuma despesa encontrada.</p>
          <p><small>Adicione lançamentos de despesas para visualizar o gráfico.</small></p>
        </div>
      </div>
    `}renderChart(){const e=this.chartData,t=e.map((n,c)=>`
        <div class="budget-chart__legend-item">
          <div class="budget-chart__legend-color" style="background-color: ${this.getColor(c)};"></div>
          <div class="budget-chart__legend-content">
            <div class="budget-chart__legend-label">${n.categoria}</div>
            <div class="budget-chart__legend-value">
              <span>${B(n.valor)}</span>
              <span class="budget-chart__legend-percent">${n.percentual.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      `).join(""),o=e.reduce((n,c)=>n+c.valor,0);this.container.innerHTML=`
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
        ${e.map((C,M)=>{const d=C.valor/r*100/100*360,u=l,g=l+d;l=g;const p=u*Math.PI/180,_=g*Math.PI/180,m=100+85*Math.cos(p),i=100+85*Math.sin(p),v=100+85*Math.cos(_),f=100+85*Math.sin(_),y=d>180?1:0,h=["M 100 100",`L ${m} ${i}`,`A 85 85 0 ${y} 1 ${v} ${f}`,"Z"].join(" "),b=this.getColor(M);return`
        <path 
          d="${h}" 
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
    `}getColor(e){const t=["#FF6384","#36A2EB","#FFCE56","#4BC0C0","#9966FF","#FF9F40","#FF6384","#C9CBCF","#4BC0C0","#FF9F40"];return t[e%t.length]}clear(){this.container.innerHTML=""}}function ye(s,e){const t=new ve(s);return t.render(e),t}const _e=`
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
`;async function be(s,e){const t=document.querySelector(".details");if(!t)return;let o=e.map(d=>d.orcamento),n=s||[];const c="excludedAccounts",a=()=>{try{const d=localStorage.getItem(c);if(d)return new Set(JSON.parse(d))}catch(d){console.error("Erro ao carregar contas excluídas:",d)}return new Set},r=d=>{try{localStorage.setItem(c,JSON.stringify(Array.from(d)))}catch(u){console.error("Erro ao salvar contas excluídas:",u)}},l=a(),E=async(d,u=0)=>{try{if(console.log("[Details] Preparando gráfico de despesas por tipo..."),!document.getElementById("categoryBudgetChart"))if(u<3){console.warn(`[Details] Container categoryBudgetChart não encontrado (tentativa ${u+1}/3), aguardando...`),setTimeout(()=>E(d,u+1),200);return}else{console.warn("[Details] Container categoryBudgetChart não encontrado após múltiplas tentativas. Gráfico não será renderizado.");return}console.log("[Details] Container encontrado, carregando categorias completas...");const _=await le.getSheetCategoriesComplete();if(!_||_.length===0){console.log("[Details] Nenhuma categoria completa encontrada");return}console.log("[Details] Fazendo JOIN entre entries e categoriesComplete...");const m=new Map;for(const h of _)m.set(h.categoria.toLowerCase(),h.tipo);console.log("[Details] Categorias mapeadas:",Array.from(m.entries()));const i=n.filter(h=>d.includes(h.orcamento));console.log(`[Details] Filtrando ${n.length} entries por ${d.length} orçamentos -> ${i.length} entries`);const v=[...new Set(i.map(h=>h.categoria).filter(h=>h))];console.log("[Details] 📋 Categorias presentes nos entries filtrados:",v);const f=i.map(h=>{const b=(h.categoria||"").toLowerCase(),T=m.get(b)||"Sem Tipo";return{categoria:h.categoria||"",valor:h.valor||0,tipo:T}}),y=f.filter(h=>h.tipo==="Sem Tipo");if(y.length>0){console.warn(`[Details] ⚠️ Encontrados ${y.length} entries SEM TIPO:`),console.table(y.map(b=>({categoria:b.categoria,valor:b.valor,tipo:b.tipo})));const h=[...new Set(y.map(b=>b.categoria))];console.warn("[Details] 📋 Categorias SEM TIPO encontradas:",h),h.forEach(b=>{const T=m.has(b);console.warn(`[Details] Categoria "${b}" existe no mapa? ${T}`)})}console.log("[Details] Renderizando gráfico de despesas por tipo..."),ye("categoryBudgetChart",f),console.log("[Details] ✅ Gráfico de despesas por tipo renderizado com sucesso")}catch(p){console.error("[Details] Erro ao renderizar gráfico de despesas:",p)}},S=()=>{const d=document.querySelector("#detail-saldo"),u=document.querySelector("#detail-accounts-cards"),g=document.querySelector(".dashboard__balance-section .details__aggregates"),p=window.accountSummary||[];console.log("🎨 Renderizando todas as contas:",p),g&&g.classList.remove("loading");const _=p.reduce((m,i)=>l.has(i.conta)?m:m+i.total,0);if(d&&(d.textContent=L(_)),u){u.innerHTML="",p.forEach(({conta:i,total:v})=>{const f=document.createElement("div"),y=l.has(i);f.className=`details__card details__card--clickable${y?" details__card--excluded":""}`,f.dataset.conta=i;const h=document.createElement("div");h.className="details__card-content",h.innerHTML=`
          <div class="details__card-info">
            <span class="details__card-icon">${y?"💳":""}</span>
            <span class="details__card-title">${i}</span>
            <span class="details__card-value">${L(v)}</span>
          </div>
        `,f.appendChild(h),f.addEventListener("click",()=>{const b=h.querySelector(".details__card-icon");l.has(i)?(l.delete(i),f.classList.remove("details__card--excluded"),b&&(b.textContent="")):(l.add(i),f.classList.add("details__card--excluded"),b&&(b.textContent="💳")),r(l);const T=p.reduce((I,F)=>l.has(F.conta)?I:I+F.total,0);d&&(d.textContent=L(T))}),u.appendChild(f)});const m=document.querySelector("#toggle-accounts-btn");if(m&&u){const i=()=>{const y=u.classList.contains("details__cards--hidden");m.textContent=y?"👁️ Mostrar contas":"🙈 Ocultar contas"},v=m._toggleListener;v&&m.removeEventListener("click",v);const f=()=>{u.classList.toggle("details__cards--hidden"),i()};m._toggleListener=f,m.addEventListener("click",f),i()}}},w=d=>{const u={};return d.forEach(g=>{const p=g.categoria||"Sem categoria";u[p]=(u[p]||0)+(g.valor||0)}),Object.entries(u).map(([g,p])=>({categoria:g,total:p}))},C=d=>{const u=document.querySelector("#detail-budget-accounts-cards");if(!u)return;const g=n.filter(_=>d.includes(_.orcamento)),p=X(g);if(u.innerHTML="",p.length===0){u.innerHTML='<p class="category-entries-empty">Nenhuma conta encontrada nos orçamentos selecionados.</p>';return}p.forEach(({conta:_,total:m})=>{const i=document.createElement("div");i.className="details__card",i.innerHTML=`
        <div class="details__card-info">
          <span class="details__card-title">${_}</span>
          <span class="details__card-value">${L(m)}</span>
        </div>
      `,u.appendChild(i)})},M=(d,u)=>{const g=t.querySelector("#detail-entries"),p=t.querySelector("#detail-entries-title"),_=t.querySelector("#entries-list");if(!g||!_||!p)return;p.innerHTML=`<span id="lancamentos">Lançamentos da Categoria: ${d}</span>`;const m=n.filter(i=>u.includes(i.orcamento)&&(i.categoria||"Sem categoria")===d&&i.valor<0);if(m.sort((i,v)=>{if(!i.data&&!v.data)return 0;if(!i.data)return 1;if(!v.data)return-1;const f=new Date(i.data).getTime(),y=new Date(v.data).getTime();return isNaN(f)&&isNaN(y)?0:isNaN(f)?1:isNaN(y)?-1:y-f}),g.classList.remove("details__category-entries--hidden"),_.innerHTML="",m.length===0){_.innerHTML='<p class="category-entries-empty">Nenhum lançamento encontrado nesta categoria.</p>';return}m.forEach(i=>{const v=document.createElement("div");v.className="category-entry-card";let f="--";if(i.data&&typeof i.data=="number"&&i.data>0){const y=te(i.data,!0);y&&(f=y.toLocaleDateString("pt-BR")+" "+y.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}))}v.innerHTML=`
        <div class="category-entry-card__date">${f}</div>
        <div class="category-entry-card__description">${i.descricao||"Sem descrição"}</div>
        <div class="category-entry-card__value">${L(i.valor||0)}</div>
      `,_.appendChild(v)}),setTimeout(()=>{const i=document.getElementById("lancamentos");i&&i.scrollIntoView({behavior:"smooth",block:"start"})},100)},$=async d=>{const u=Array.isArray(d)?d:[d];t.innerHTML=_e,t.style.display="";const g=t.querySelector("#detail-categories-cards"),p=n.filter(_=>u.includes(_.orcamento));g&&(g.innerHTML="",(p.length>0?w(p).filter(m=>m.total<0).sort((m,i)=>m.total-i.total).slice(0,10):[]).forEach((m,i)=>{const v=document.createElement("div");v.className="category-card",v.dataset.categoria=m.categoria,v.innerHTML=`
          <div class="category-card__rank">#${i+1}</div>
          <div class="category-card__content">
            <div class="category-card__name">${m.categoria}</div>
            <div class="category-card__value">${L(m.total)}</div>
          </div>
        `,v.addEventListener("click",()=>{g.querySelectorAll(".category-card").forEach(y=>{y.classList.remove("category-card--selected")});const f=document.querySelector("#detail-accounts-cards");f&&f.querySelectorAll(".details__card").forEach(y=>{y.classList.remove("details__card--selected")}),v.classList.add("category-card--selected"),M(m.categoria,u)}),g.appendChild(v)})),await E(u),C(u)};await $(o),S(),document.addEventListener("detail:show",async d=>{const g=d.detail.orcamento;o.includes(g)?o=o.filter(p=>p!==g):o.push(g),await $(o)}),document.addEventListener("cards:updated",async d=>{const u=d,{allEntries:g}=u.detail||{};g&&(n=g,S(),await $(o))})}async function O(){if(!await K()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}if(Q(),fe(),await ae(()=>{console.log("✅ Lançamento adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await ne(()=>{console.log("✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await se(()=>{console.log("✅ Transferência realizada! Recarregue a página para ver as mudanças."),window.location.reload()}),oe(()=>de(),()=>ce(),()=>ie()),!P.authStore.isValid){console.log("⚠️ Usuário não autenticado");return}if(!(await Ee()).isValid){Ce();return}const t=document.getElementById("refreshDashboardBtn");t&&t.addEventListener("click",async()=>{console.log("🔄 Atualizando dashboard (limpando cache)...");const o=t.innerHTML;t.disabled=!0,t.innerHTML="⏳ Atualizando...";try{await Se()}finally{t.disabled=!1,t.innerHTML=o}}),await U(),console.log("✅ Dashboard inicializado")}async function Ee(){try{const e=await(await fetch(`${Z.configStatus}`,{method:"GET",headers:{Authorization:`Bearer ${P.authStore.token}`}})).json();return{isValid:e.hasRefreshToken&&e.hasSheetId}}catch(s){return console.error("Erro ao verificar configuração:",s),{isValid:!1}}}function Ce(){const s=document.getElementById("configBtn");s&&(s.style.display="");const e=document.getElementById("summaryCards");e&&(e.style.display="none");const t=document.querySelector(".dashboard__col--right.details");t&&(t.style.display="none");const o=document.getElementById("openEntryModal");o&&(o.style.display="none");const n=document.querySelector(".dashboard__header");if(n&&!document.getElementById("configMessage")){const c=document.createElement("p");c.id="configMessage",c.style.marginTop="1rem",c.textContent='Integração com Google não configurada. Clique em "Configurar Integração" para continuar.',n.appendChild(c);const a=document.createElement("a");a.href="/dashboard/configuracao.html",a.className="button primary",a.style.marginTop="1rem",a.style.display="inline-block",a.textContent="⚙️ Configurar Integração",n.appendChild(a)}}async function Se(){try{await U(!0),console.log("✅ Dashboard atualizado com sucesso")}catch(s){console.error("❌ Erro ao atualizar dashboard:",s),j("Erro ao atualizar dados. Tente novamente.")}}async function U(s=!1){try{const e=await re.fetchEntries(0,s),t=(e==null?void 0:e.entries)??[];if(!t||t.length===0){Le();return}window.allEntries=t;const o=q(t);window.allBudgets=H(t);const n=he(t),c=q(n),a=H(n);window.accountSummary=X(t),console.log("📊 Contas agregadas:",window.accountSummary),window.filteredEntries=n,window.summaryByBudget=c,window.budgetsInInterval=a;const r={};c.forEach(l=>{r[l.label]=!0}),me(o,r),await be(t,a)}catch(e){console.error("Erro ao carregar dados:",e),j("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.")}}function Le(){const s=document.getElementById("summaryCards");s&&(s.style.display="none");const e=document.querySelector(".dashboard__col--right.details");e&&(e.style.display="none");const t=document.getElementById("openEntryModal");t&&(t.style.display="");const o=document.querySelector(".dashboard__header");if(o&&!document.getElementById("firstEntryMessage")){const n=document.createElement("div");n.id="firstEntryMessage",n.style.marginTop="1rem",n.className="notice",n.textContent='Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.',o.appendChild(n)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",O):O();
