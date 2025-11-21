var V=Object.defineProperty;var P=(a,e,t)=>e in a?V(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var L=(a,e,t)=>P(a,typeof e!="symbol"?e+"":e,t);import{v as G,p as k,A as X}from"./auth.js";import{SheetsService as j}from"./sheets.js";import{e as Y,t as M,a as z,g as U,i as W,b as J,c as K,d as Z,l as Q,o as ee,f as te,h as ae}from"./fab-menu.js";import{r as ne}from"./user-menu.js";function w(a){return Number(a).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}let D=[],A={};function re(a,e){const t=document.getElementById("summaryCards");if(!t)return;D=a||[],A=e||{};const s=D.slice().sort((n,o)=>o.orcamento-n.orcamento);t.className="financial-cards",t.innerHTML="",s.forEach(n=>{A[n.label]===!0?t.appendChild(se(n)):t.appendChild(oe(n))}),t.querySelectorAll(".financial-card--inactive").forEach(n=>{const o=n;o.style.cursor="pointer",o.addEventListener("click",B)}),t.querySelectorAll(".financial-card__close").forEach(n=>{n.addEventListener("click",q)})}function se(a){const e=document.createElement("div"),t=a.sum>=0?"financial-card--incomes":"financial-card--expenses";return e.className=`financial-card ${t}`,e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a.label}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a.label}</h3>
    </div>
    <div class="financial-card__value">${w(a.sum)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${w(a.incomes)}</div>
      <div class="financial-card__detail">Despesas: ${w(a.expenses)}</div>
    </div>
  `,e}function oe(a){const e=document.createElement("div");return e.className="financial-card financial-card--inactive",e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <div class="financial-card__title">${a.label}</div>
    <div class="financial-card__value">...</div>
  `,e}function B(){const a=this.dataset.budget,e=parseFloat(this.dataset.sum),t=parseFloat(this.dataset.incomes),s=parseFloat(this.dataset.expenses),r=Number(this.dataset.orcamento);this.classList.remove("financial-card--inactive");const i=e>=0?"financial-card--incomes":"financial-card--expenses";this.classList.add(i),this.style.cursor="default",this.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a}</h3>
    </div>
    <div class="financial-card__value">${w(e)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${w(t)}</div>
      <div class="financial-card__detail">Despesas: ${w(s)}</div>
    </div>
  `,this.removeEventListener("click",B);const n=this.querySelector(".financial-card__toggle");n&&n.addEventListener("click",function(d){d.stopPropagation();const S=this.closest(".financial-card").classList.toggle("financial-card__details--hidden");this.setAttribute("aria-expanded",String(!S)),this.textContent=S?"Mostrar detalhes":"Ocultar detalhes"});const o=this.querySelector(".financial-card__close");o&&o.addEventListener("click",q),document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:r}}))}function q(a){a.stopPropagation();const e=this.closest(".financial-card"),t=e.dataset.budget,s=e.dataset.sum,r=e.dataset.incomes,i=e.dataset.expenses,n=e.dataset.orcamento;e.className="financial-card financial-card--inactive",e.style.cursor="pointer",e.innerHTML=`
    <div class="financial-card__title">${t}</div>
    <div class="financial-card__value">...</div>
  `,e.dataset.budget=t,e.dataset.sum=s,e.dataset.incomes=r,e.dataset.expenses=i,e.dataset.orcamento=n;const o=e.cloneNode(!0);e.replaceWith(o);const d=document.querySelector(`.financial-card--inactive[data-budget="${t}"]`);d&&(d.style.cursor="pointer",d.addEventListener("click",B));const E=Number(n);document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:E}}))}function ie(){const a=document.getElementById("summaryCards");a==null||a.addEventListener("click",e=>{const s=e.target.closest(".financial-card__toggle");if(!s)return;const i=s.closest(".financial-card").querySelector(".financial-card__details"),n=i==null?void 0:i.classList.toggle("financial-card__details--hidden");s.setAttribute("aria-expanded",String(!n)),s.textContent=n?"Mostrar detalhes":"Ocultar detalhes"})}function H(a="Verifique sua conexão e tente novamente"){const e=document.getElementById("summaryCards");e&&(e.className="financial-cards",e.innerHTML=`
    <div class="financial-card financial-card--saldo">
      <div class="financial-card__header">
        <h3 class="financial-card__title">Erro ao carregar dados</h3>
      </div>
      <div class="financial-card__value">${a}</div>
    </div>
  `)}function N(a){return a.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2})}class ce{constructor(e){L(this,"container");L(this,"entries",[]);L(this,"chartData",[]);const t=document.getElementById(e);if(!t)throw new Error(`Container ${e} não encontrado`);this.container=t}render(e){if(this.entries=e,this.chartData=this.calculateExpenseData(),this.chartData.length===0){this.renderEmptyState();return}this.renderChart()}calculateExpenseData(){const e=["TRANSFERÊNCIA","TRANSFERENCIA","SALDO","RENDA","RECEITA"],t=this.entries.filter(n=>{const o=n.tipo.toUpperCase().trim();return!e.includes(o)&&n.valor<0});if(t.length===0)return[];const s=new Map;for(const n of t){const o=n.tipo||"Sem Tipo",d=Math.abs(n.valor);s.set(o,(s.get(o)||0)+d)}const r=Array.from(s.values()).reduce((n,o)=>n+o,0);return Array.from(s.entries()).map(([n,o])=>({categoria:n,valor:o,percentual:o/r*100})).sort((n,o)=>o.valor-n.valor)}renderEmptyState(){this.container.innerHTML=`
      <div class="budget-chart">
        <h3 class="budget-chart__title">Despesas por Tipo</h3>
        <div class="budget-chart__empty">
          <p>Nenhuma despesa encontrada.</p>
          <p><small>Adicione lançamentos de despesas para visualizar o gráfico.</small></p>
        </div>
      </div>
    `}renderChart(){const e=this.chartData,t=e.map((r,i)=>`
        <div class="budget-chart__legend-item">
          <div class="budget-chart__legend-color" style="background-color: ${this.getColor(i)};"></div>
          <div class="budget-chart__legend-content">
            <div class="budget-chart__legend-label">${r.categoria}</div>
            <div class="budget-chart__legend-value">
              <span>${N(r.valor)}</span>
              <span class="budget-chart__legend-percent">${r.percentual.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      `).join(""),s=e.reduce((r,i)=>r+i.valor,0);this.container.innerHTML=`
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
            <span>${N(s)}</span>
          </div>
        </div>
      </div>
    `}renderDonutChart(e){const o=e.reduce((b,T)=>b+T.valor,0);if(o===0)return"<p>Sem dados de despesas</p>";let d=-90;return`
      <svg 
        viewBox="0 0 200 200" 
        class="budget-chart__svg"
        style="max-width: 200px; max-height: 200px;"
      >
        ${e.map((b,T)=>{const g=b.valor/o*100/100*360,u=d,y=d+g;d=y;const p=u*Math.PI/180,m=y*Math.PI/180,c=100+85*Math.cos(p),h=100+85*Math.sin(p),_=100+85*Math.cos(m),f=100+85*Math.sin(m),v=g>180?1:0,C=["M 100 100",`L ${c} ${h}`,`A 85 85 0 ${v} 1 ${_} ${f}`,"Z"].join(" "),$=this.getColor(T);return`
        <path 
          d="${C}" 
          fill="${$}" 
          stroke="white" 
          stroke-width="2"
          class="budget-chart__segment"
          data-category="${b.categoria}"
          data-value="${b.valor}"
        >
          <title>${b.categoria}: ${N(b.valor)} (${b.percentual.toFixed(1)}%)</title>
        </path>
      `}).join("")}
        
      <circle 
        cx="100" 
        cy="100" 
        r="55" 
        fill="white"
      />
    
      </svg>
    `}getColor(e){const t=["#FF6384","#36A2EB","#FFCE56","#4BC0C0","#9966FF","#FF9F40","#FF6384","#C9CBCF","#4BC0C0","#FF9F40"];return t[e%t.length]}clear(){this.container.innerHTML=""}}function de(a,e){const t=new ce(a);return t.render(e),t}const le=`
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
`;async function ue(a,e){const t=document.querySelector(".details");if(!t)return;let s=e.map(l=>l.orcamento),r=a||[];const i="excludedAccounts",n=()=>{try{const l=localStorage.getItem(i);if(l)return new Set(JSON.parse(l))}catch(l){console.error("Erro ao carregar contas excluídas:",l)}return new Set},o=l=>{try{localStorage.setItem(i,JSON.stringify(Array.from(l)))}catch(g){console.error("Erro ao salvar contas excluídas:",g)}},d=n(),E=async(l,g=0)=>{try{if(console.log("[Details] Preparando gráfico de despesas por tipo..."),!document.getElementById("categoryBudgetChart"))if(g<3){console.warn(`[Details] Container categoryBudgetChart não encontrado (tentativa ${g+1}/3), aguardando...`),setTimeout(()=>E(l,g+1),200);return}else{console.warn("[Details] Container categoryBudgetChart não encontrado após múltiplas tentativas. Gráfico não será renderizado.");return}console.log("[Details] Container encontrado, carregando categorias completas...");const p=await j.getSheetCategoriesComplete();if(!p||p.length===0){console.log("[Details] Nenhuma categoria completa encontrada");return}console.log("[Details] Fazendo JOIN entre entries e categoriesComplete...");const m=new Map;for(const v of p)m.set(v.categoria.toLowerCase(),v.tipo);console.log("[Details] Categorias mapeadas:",Array.from(m.entries()));const c=r.filter(v=>l.includes(v.orcamento));console.log(`[Details] Filtrando ${r.length} entries por ${l.length} orçamentos -> ${c.length} entries`);const h=[...new Set(c.map(v=>v.categoria).filter(v=>v))];console.log("[Details] 📋 Categorias presentes nos entries filtrados:",h);const _=c.map(v=>{const C=(v.categoria||"").toLowerCase(),$=m.get(C)||"Sem Tipo";return{categoria:v.categoria||"",valor:v.valor||0,tipo:$}}),f=_.filter(v=>v.tipo==="Sem Tipo");if(f.length>0){console.warn(`[Details] ⚠️ Encontrados ${f.length} entries SEM TIPO:`),console.table(f.map(C=>({categoria:C.categoria,valor:C.valor,tipo:C.tipo})));const v=[...new Set(f.map(C=>C.categoria))];console.warn("[Details] 📋 Categorias SEM TIPO encontradas:",v),v.forEach(C=>{const $=m.has(C);console.warn(`[Details] Categoria "${C}" existe no mapa? ${$}`)})}console.log("[Details] Renderizando gráfico de despesas por tipo..."),de("categoryBudgetChart",_),console.log("[Details] ✅ Gráfico de despesas por tipo renderizado com sucesso")}catch(y){console.error("[Details] Erro ao renderizar gráfico de despesas:",y)}},S=()=>{const l=document.querySelector("#detail-saldo"),g=document.querySelector("#detail-accounts-cards"),u=window.accountSummary||[];console.log("🎨 Renderizando todas as contas:",u);const y=u.reduce((p,m)=>d.has(m.conta)?p:p+m.total,0);l&&(l.textContent=w(y)),g&&(g.innerHTML="",u.forEach(({conta:p,total:m})=>{const c=document.createElement("div"),h=d.has(p);c.className=`details__card details__card--clickable${h?" details__card--excluded":""}`,c.dataset.conta=p;const _=document.createElement("div");_.className="details__card-content",_.innerHTML=`
          <div class="details__card-info">
            <span class="details__card-icon">${h?"💳":""}</span>
            <span class="details__card-title">${p}</span>
            <span class="details__card-value">${w(m)}</span>
          </div>
        `,c.appendChild(_),c.addEventListener("click",()=>{const f=_.querySelector(".details__card-icon");d.has(p)?(d.delete(p),c.classList.remove("details__card--excluded"),f&&(f.textContent="")):(d.add(p),c.classList.add("details__card--excluded"),f&&(f.textContent="💳")),o(d);const v=u.reduce((C,$)=>d.has($.conta)?C:C+$.total,0);l&&(l.textContent=w(v))}),g.appendChild(c)}))},x=l=>{const g={};return l.forEach(u=>{const y=u.categoria||"Sem categoria";g[y]=(g[y]||0)+(u.valor||0)}),Object.entries(g).map(([u,y])=>({categoria:u,total:y}))},b=(l,g)=>{const u=t.querySelector("#detail-entries"),y=t.querySelector("#detail-entries-title"),p=t.querySelector("#entries-list");if(!u||!p||!y)return;y.innerHTML=`<span id="lancamentos">Lançamentos da Categoria: ${l}</span>`;const m=r.filter(c=>g.includes(c.orcamento)&&(c.categoria||"Sem categoria")===l&&c.valor<0);if(m.sort((c,h)=>{if(!c.data&&!h.data)return 0;if(!c.data)return 1;if(!h.data)return-1;const _=new Date(c.data).getTime(),f=new Date(h.data).getTime();return isNaN(_)&&isNaN(f)?0:isNaN(_)?1:isNaN(f)?-1:f-_}),u.classList.remove("details__category-entries--hidden"),p.innerHTML="",m.length===0){p.innerHTML='<p class="category-entries-empty">Nenhum lançamento encontrado nesta categoria.</p>';return}m.forEach(c=>{const h=document.createElement("div");h.className="category-entry-card";let _="--";if(c.data&&typeof c.data=="number"&&c.data>0){const f=Y(c.data,!0);f&&(_=f.toLocaleDateString("pt-BR")+" "+f.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}))}h.innerHTML=`
        <div class="category-entry-card__date">${_}</div>
        <div class="category-entry-card__description">${c.descricao||"Sem descrição"}</div>
        <div class="category-entry-card__value">${w(c.valor||0)}</div>
      `,p.appendChild(h)}),setTimeout(()=>{const c=document.getElementById("lancamentos");c&&c.scrollIntoView({behavior:"smooth",block:"start"})},100)},T=async l=>{const g=Array.isArray(l)?l:[l];t.innerHTML=le,t.style.display="";const u=t.querySelector("#detail-categories-cards"),y=r.filter(p=>g.includes(p.orcamento));u&&(u.innerHTML="",(y.length>0?x(y).filter(m=>m.total<0).sort((m,c)=>m.total-c.total).slice(0,10):[]).forEach((m,c)=>{const h=document.createElement("div");h.className="category-card",h.dataset.categoria=m.categoria,h.innerHTML=`
          <div class="category-card__rank">#${c+1}</div>
          <div class="category-card__content">
            <div class="category-card__name">${m.categoria}</div>
            <div class="category-card__value">${w(m.total)}</div>
          </div>
        `,h.addEventListener("click",()=>{u.querySelectorAll(".category-card").forEach(f=>{f.classList.remove("category-card--selected")});const _=document.querySelector("#detail-accounts-cards");_&&_.querySelectorAll(".details__card").forEach(f=>{f.classList.remove("details__card--selected")}),h.classList.add("category-card--selected"),b(m.categoria,g)}),u.appendChild(h)})),await E(g)};S(),await T(s),document.addEventListener("detail:show",async l=>{const u=l.detail.orcamento;s.includes(u)?s=s.filter(y=>y!==u):s.push(u),await T(s)}),document.addEventListener("cards:updated",async l=>{const g=l,{allEntries:u}=g.detail||{};u&&(r=u,S(),await T(s))})}function ge(a=[],e="orcamento",t=-5,s=35){const{startSerial:r,endSerial:i}=U(t,s);return a.filter(n=>{const o=n&&n[e];return typeof o=="number"&&!Number.isNaN(o)&&o>=r&&o<=i})}function I(a=[],e="orcamento"){const t=new Map;return a.forEach(r=>{let i=r&&r[e],n=Number(i);if(!Number.isFinite(n)&&typeof i=="string"&&i.includes("/")){const E=i.split("/");if(E.length===3){const[S,x,b]=E.map(T=>Number(T));[S,x,b].every(Number.isFinite)&&(n=M(new Date(b,x-1,S)))}else if(E.length===2){const[S,x]=E.map(b=>Number(b));[S,x].every(Number.isFinite)&&(n=M(new Date(x,S-1,1)))}}if(!Number.isFinite(n))return;const o=Number(r.valor)||0,d=t.get(n)||{orcamento:n,sum:0,count:0,incomes:0,expenses:0};d.sum+=o,d.count+=1,o>=0?d.incomes+=o:d.expenses+=o,t.set(n,d)}),Array.from(t.values()).map(r=>({orcamento:r.orcamento,label:z(r.orcamento),count:r.count,sum:Number(r.sum.toFixed(2)),incomes:Number(r.incomes.toFixed(2)),expenses:Number(r.expenses.toFixed(2))})).sort((r,i)=>i.orcamento-r.orcamento)}function F(a=[],e="orcamento"){const t=r=>{let i=Number(r);if(Number.isFinite(i))return i;if(typeof r=="string"&&r.includes("/")){const n=r.split("/");if(n.length===3){const[o,d,E]=n.map(S=>Number(S));if([o,d,E].every(Number.isFinite))return M(new Date(E,d-1,o))}else if(n.length===2){const[o,d]=n.map(E=>Number(E));if([o,d].every(Number.isFinite))return M(new Date(d,o-1,1))}}return null},s=new Map;return a.forEach(r=>{const i=r&&r[e],n=t(i);n===null||!Number.isFinite(n)||s.has(n)||s.set(n,{orcamento:n,label:z(n)})}),Array.from(s.values()).sort((r,i)=>r.orcamento-i.orcamento)}function me(a=[]){const e=new Map;return a.forEach(s=>{if(!s.conta||s.conta.trim()==="")return;const r=Number(s.valor)||0,i=e.get(s.conta)||{total:0,count:0};i.total+=r,i.count+=1,e.set(s.conta,i)}),Array.from(e.entries()).map(([s,r])=>({conta:s,total:Number(r.total.toFixed(2)),count:r.count})).sort((s,r)=>s.conta.localeCompare(r.conta))}async function R(){if(!await G()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}if(ne(),ie(),await W(()=>{console.log("✅ Lançamento adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await J(()=>{console.log("✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await K(()=>{console.log("✅ Transferência realizada! Recarregue a página para ver as mudanças."),window.location.reload()}),Z(()=>ae(),()=>te(),()=>ee()),!k.authStore.isValid){console.log("⚠️ Usuário não autenticado");return}if(!(await pe()).isValid){fe();return}const t=document.getElementById("refreshDashboardBtn");t&&t.addEventListener("click",async()=>{console.log("🔄 Atualizando dashboard (limpando cache)...");const s=t.innerHTML;t.disabled=!0,t.innerHTML="⏳ Atualizando...";try{await he()}finally{t.disabled=!1,t.innerHTML=s}}),await O(),console.log("✅ Dashboard inicializado")}async function pe(){try{const e=await(await fetch(`${X.configStatus}`,{method:"GET",headers:{Authorization:`Bearer ${k.authStore.token}`}})).json();return{isValid:e.hasRefreshToken&&e.hasSheetId}}catch(a){return console.error("Erro ao verificar configuração:",a),{isValid:!1}}}function fe(){const a=document.getElementById("configBtn");a&&(a.style.display="");const e=document.getElementById("summaryCards");e&&(e.style.display="none");const t=document.querySelector(".dashboard__col--right.details");t&&(t.style.display="none");const s=document.getElementById("openEntryModal");s&&(s.style.display="none");const r=document.querySelector(".dashboard__header");if(r&&!document.getElementById("configMessage")){const i=document.createElement("p");i.id="configMessage",i.style.marginTop="1rem",i.textContent='Integração com Google não configurada. Clique em "Configurar Integração" para continuar.',r.appendChild(i);const n=document.createElement("a");n.href="/dashboard/configuracao.html",n.className="button primary",n.style.marginTop="1rem",n.style.display="inline-block",n.textContent="⚙️ Configurar Integração",r.appendChild(n)}}async function he(){try{await O(!0),console.log("✅ Dashboard atualizado com sucesso")}catch(a){console.error("❌ Erro ao atualizar dashboard:",a),H("Erro ao atualizar dados. Tente novamente.")}}async function O(a=!1){try{const e=await Q.fetchEntries(0,a),t=(e==null?void 0:e.entries)??[];if(!t||t.length===0){ve();return}window.allEntries=t;const s=I(t);window.allBudgets=F(t);const r=ge(t),i=I(r),n=F(r);window.accountSummary=me(t),console.log("📊 Contas agregadas:",window.accountSummary),window.filteredEntries=r,window.summaryByBudget=i,window.budgetsInInterval=n;const o={};i.forEach(d=>{o[d.label]=!0}),re(s,o),await ue(t,n)}catch(e){console.error("Erro ao carregar dados:",e),H("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.")}}function ve(){const a=document.getElementById("summaryCards");a&&(a.style.display="none");const e=document.querySelector(".dashboard__col--right.details");e&&(e.style.display="none");const t=document.getElementById("openEntryModal");t&&(t.style.display="");const s=document.querySelector(".dashboard__header");if(s&&!document.getElementById("firstEntryMessage")){const r=document.createElement("div");r.id="firstEntryMessage",r.style.marginTop="1rem",r.className="notice",r.textContent='Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.',s.appendChild(r)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",R):R();
