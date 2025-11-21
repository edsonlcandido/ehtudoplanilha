var P=Object.defineProperty;var G=(t,e,a)=>e in t?P(t,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):t[e]=a;var L=(t,e,a)=>G(t,typeof e!="symbol"?e+"":e,a);import{v as X,p as z,A as j}from"./auth.js";import{SheetsService as Y}from"./sheets.js";import{e as U,t as M,a as q,g as W,i as J,b as K,c as Z,d as Q,l as ee,o as ae,f as te,h as ne}from"./fab-menu.js";import{r as re}from"./user-menu.js";function w(t){return Number(t).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}let D=[],A={};function se(t,e){const a=document.getElementById("summaryCards");if(!a)return;D=t||[],A=e||{};const s=D.slice().sort((n,o)=>o.orcamento-n.orcamento);a.className="financial-cards",a.innerHTML="",s.forEach(n=>{A[n.label]===!0?a.appendChild(oe(n)):a.appendChild(ie(n))}),a.querySelectorAll(".financial-card--inactive").forEach(n=>{const o=n;o.style.cursor="pointer",o.addEventListener("click",B)}),a.querySelectorAll(".financial-card__close").forEach(n=>{n.addEventListener("click",H)})}function oe(t){const e=document.createElement("div"),a=t.sum>=0?"financial-card--incomes":"financial-card--expenses";return e.className=`financial-card ${a}`,e.dataset.budget=t.label,e.dataset.sum=String(t.sum),e.dataset.incomes=String(t.incomes),e.dataset.expenses=String(t.expenses),e.dataset.orcamento=String(t.orcamento),e.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${t.label}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${t.label}</h3>
    </div>
    <div class="financial-card__value">${w(t.sum)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${w(t.incomes)}</div>
      <div class="financial-card__detail">Despesas: ${w(t.expenses)}</div>
    </div>
  `,e}function ie(t){const e=document.createElement("div");return e.className="financial-card financial-card--inactive",e.dataset.budget=t.label,e.dataset.sum=String(t.sum),e.dataset.incomes=String(t.incomes),e.dataset.expenses=String(t.expenses),e.dataset.orcamento=String(t.orcamento),e.innerHTML=`
    <div class="financial-card__title">${t.label}</div>
    <div class="financial-card__value">...</div>
  `,e}function B(){const t=this.dataset.budget,e=parseFloat(this.dataset.sum),a=parseFloat(this.dataset.incomes),s=parseFloat(this.dataset.expenses),r=Number(this.dataset.orcamento);this.classList.remove("financial-card--inactive");const i=e>=0?"financial-card--incomes":"financial-card--expenses";this.classList.add(i),this.style.cursor="default",this.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${t}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${t}</h3>
    </div>
    <div class="financial-card__value">${w(e)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${w(a)}</div>
      <div class="financial-card__detail">Despesas: ${w(s)}</div>
    </div>
  `,this.removeEventListener("click",B);const n=this.querySelector(".financial-card__toggle");n&&n.addEventListener("click",function(d){d.stopPropagation();const S=this.closest(".financial-card").classList.toggle("financial-card__details--hidden");this.setAttribute("aria-expanded",String(!S)),this.textContent=S?"Mostrar detalhes":"Ocultar detalhes"});const o=this.querySelector(".financial-card__close");o&&o.addEventListener("click",H),document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:r}}))}function H(t){t.stopPropagation();const e=this.closest(".financial-card"),a=e.dataset.budget,s=e.dataset.sum,r=e.dataset.incomes,i=e.dataset.expenses,n=e.dataset.orcamento;e.className="financial-card financial-card--inactive",e.style.cursor="pointer",e.innerHTML=`
    <div class="financial-card__title">${a}</div>
    <div class="financial-card__value">...</div>
  `,e.dataset.budget=a,e.dataset.sum=s,e.dataset.incomes=r,e.dataset.expenses=i,e.dataset.orcamento=n;const o=e.cloneNode(!0);e.replaceWith(o);const d=document.querySelector(`.financial-card--inactive[data-budget="${a}"]`);d&&(d.style.cursor="pointer",d.addEventListener("click",B));const E=Number(n);document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:E}}))}function ce(){const t=document.getElementById("summaryCards");t==null||t.addEventListener("click",e=>{const s=e.target.closest(".financial-card__toggle");if(!s)return;const i=s.closest(".financial-card").querySelector(".financial-card__details"),n=i==null?void 0:i.classList.toggle("financial-card__details--hidden");s.setAttribute("aria-expanded",String(!n)),s.textContent=n?"Mostrar detalhes":"Ocultar detalhes"})}function O(t="Verifique sua conexão e tente novamente"){const e=document.getElementById("summaryCards");e&&(e.className="financial-cards",e.innerHTML=`
    <div class="financial-card financial-card--saldo">
      <div class="financial-card__header">
        <h3 class="financial-card__title">Erro ao carregar dados</h3>
      </div>
      <div class="financial-card__value">${t}</div>
    </div>
  `)}function N(t){return t.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2})}class de{constructor(e){L(this,"container");L(this,"entries",[]);L(this,"chartData",[]);const a=document.getElementById(e);if(!a)throw new Error(`Container ${e} não encontrado`);this.container=a}render(e){if(this.entries=e,this.chartData=this.calculateExpenseData(),this.chartData.length===0){this.renderEmptyState();return}this.renderChart()}calculateExpenseData(){const e=["TRANSFERÊNCIA","TRANSFERENCIA","SALDO","RENDA","RECEITA"],a=this.entries.filter(n=>{const o=n.tipo.toUpperCase().trim();return!e.includes(o)&&n.valor<0});if(a.length===0)return[];const s=new Map;for(const n of a){const o=n.tipo||"Sem Tipo",d=Math.abs(n.valor);s.set(o,(s.get(o)||0)+d)}const r=Array.from(s.values()).reduce((n,o)=>n+o,0);return Array.from(s.entries()).map(([n,o])=>({categoria:n,valor:o,percentual:o/r*100})).sort((n,o)=>o.valor-n.valor)}renderEmptyState(){this.container.innerHTML=`
      <div class="budget-chart">
        <h3 class="budget-chart__title">Despesas por Tipo</h3>
        <div class="budget-chart__empty">
          <p>Nenhuma despesa encontrada.</p>
          <p><small>Adicione lançamentos de despesas para visualizar o gráfico.</small></p>
        </div>
      </div>
    `}renderChart(){const e=this.chartData,a=e.map((r,i)=>`
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
            ${a}
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
        ${e.map((b,T)=>{const u=b.valor/o*100/100*360,g=d,h=d+u;d=h;const m=g*Math.PI/180,y=h*Math.PI/180,c=100+85*Math.cos(m),_=100+85*Math.sin(m),p=100+85*Math.cos(y),f=100+85*Math.sin(y),v=u>180?1:0,C=["M 100 100",`L ${c} ${_}`,`A 85 85 0 ${v} 1 ${p} ${f}`,"Z"].join(" "),$=this.getColor(T);return`
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
    `}getColor(e){const a=["#FF6384","#36A2EB","#FFCE56","#4BC0C0","#9966FF","#FF9F40","#FF6384","#C9CBCF","#4BC0C0","#FF9F40"];return a[e%a.length]}clear(){this.container.innerHTML=""}}function le(t,e){const a=new de(t);return a.render(e),a}const I=`
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
    <h3 class="details__title" id="detail-entries-title">
      <span id="lancamentos">Lançamentos</span>
    </h3>
    <div class="category-entries-list" id="entries-list">
      <!-- Lançamentos serão renderizados aqui -->
    </div>
  </div>
`;async function ue(t,e){const a=document.querySelector(".details");if(!a)return;let s=e.map(l=>l.orcamento),r=t||[];const i="excludedAccounts",n=()=>{try{const l=localStorage.getItem(i);if(l)return new Set(JSON.parse(l))}catch(l){console.error("Erro ao carregar contas excluídas:",l)}return new Set},o=l=>{try{localStorage.setItem(i,JSON.stringify(Array.from(l)))}catch(u){console.error("Erro ao salvar contas excluídas:",u)}},d=n(),E=async(l,u=0)=>{try{if(console.log("[Details] Preparando gráfico de despesas por tipo..."),!document.getElementById("categoryBudgetChart"))if(u<3){console.warn(`[Details] Container categoryBudgetChart não encontrado (tentativa ${u+1}/3), aguardando...`),setTimeout(()=>E(l,u+1),200);return}else{console.warn("[Details] Container categoryBudgetChart não encontrado após múltiplas tentativas. Gráfico não será renderizado.");return}console.log("[Details] Container encontrado, carregando categorias completas...");const m=await Y.getSheetCategoriesComplete();if(!m||m.length===0){console.log("[Details] Nenhuma categoria completa encontrada");return}console.log("[Details] Fazendo JOIN entre entries e categoriesComplete...");const y=new Map;for(const v of m)y.set(v.categoria.toLowerCase(),v.tipo);console.log("[Details] Categorias mapeadas:",Array.from(y.entries()));const c=r.filter(v=>l.includes(v.orcamento));console.log(`[Details] Filtrando ${r.length} entries por ${l.length} orçamentos -> ${c.length} entries`);const _=[...new Set(c.map(v=>v.categoria).filter(v=>v))];console.log("[Details] 📋 Categorias presentes nos entries filtrados:",_);const p=c.map(v=>{const C=(v.categoria||"").toLowerCase(),$=y.get(C)||"Sem Tipo";return{categoria:v.categoria||"",valor:v.valor||0,tipo:$}}),f=p.filter(v=>v.tipo==="Sem Tipo");if(f.length>0){console.warn(`[Details] ⚠️ Encontrados ${f.length} entries SEM TIPO:`),console.table(f.map(C=>({categoria:C.categoria,valor:C.valor,tipo:C.tipo})));const v=[...new Set(f.map(C=>C.categoria))];console.warn("[Details] 📋 Categorias SEM TIPO encontradas:",v),v.forEach(C=>{const $=y.has(C);console.warn(`[Details] Categoria "${C}" existe no mapa? ${$}`)})}console.log("[Details] Renderizando gráfico de despesas por tipo..."),le("categoryBudgetChart",p),console.log("[Details] ✅ Gráfico de despesas por tipo renderizado com sucesso")}catch(h){console.error("[Details] Erro ao renderizar gráfico de despesas:",h)}},S=()=>{const l=a.querySelector("#detail-saldo"),u=a.querySelector("#detail-accounts-cards"),g=window.accountSummary||[];console.log("🎨 Renderizando todas as contas:",g);const h=g.reduce((m,y)=>d.has(y.conta)?m:m+y.total,0);l&&(l.textContent=w(h)),u&&(u.innerHTML="",g.forEach(({conta:m,total:y})=>{const c=document.createElement("div"),_=d.has(m);c.className=`details__card details__card--clickable${_?" details__card--excluded":""}`,c.dataset.conta=m;const p=document.createElement("div");p.className="details__card-content",p.innerHTML=`
          <div class="details__card-info">
            <span class="details__card-icon">${_?"💳":""}</span>
            <span class="details__card-title">${m}</span>
            <span class="details__card-value">${w(y)}</span>
          </div>
        `,c.appendChild(p),c.addEventListener("click",()=>{const f=p.querySelector(".details__card-icon");d.has(m)?(d.delete(m),c.classList.remove("details__card--excluded"),f&&(f.textContent="")):(d.add(m),c.classList.add("details__card--excluded"),f&&(f.textContent="💳")),o(d);const v=g.reduce((C,$)=>d.has($.conta)?C:C+$.total,0);l&&(l.textContent=w(v))}),u.appendChild(c)}))},x=l=>{const u={};return l.forEach(g=>{const h=g.categoria||"Sem categoria";u[h]=(u[h]||0)+(g.valor||0)}),Object.entries(u).map(([g,h])=>({categoria:g,total:h}))},b=(l,u)=>{const g=a.querySelector("#detail-entries"),h=a.querySelector("#detail-entries-title"),m=a.querySelector("#entries-list");if(!g||!m||!h)return;h.innerHTML=`<span id="lancamentos">Lançamentos da Categoria: ${l}</span>`;const y=r.filter(c=>u.includes(c.orcamento)&&(c.categoria||"Sem categoria")===l&&c.valor<0);if(y.sort((c,_)=>{if(!c.data&&!_.data)return 0;if(!c.data)return 1;if(!_.data)return-1;const p=new Date(c.data).getTime(),f=new Date(_.data).getTime();return isNaN(p)&&isNaN(f)?0:isNaN(p)?1:isNaN(f)?-1:f-p}),g.classList.remove("details__category-entries--hidden"),m.innerHTML="",y.length===0){m.innerHTML='<p class="category-entries-empty">Nenhum lançamento encontrado nesta categoria.</p>';return}y.forEach(c=>{const _=document.createElement("div");_.className="category-entry-card";let p="--";if(c.data&&typeof c.data=="number"&&c.data>0){const f=U(c.data,!0);f&&(p=f.toLocaleDateString("pt-BR")+" "+f.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}))}_.innerHTML=`
        <div class="category-entry-card__date">${p}</div>
        <div class="category-entry-card__description">${c.descricao||"Sem descrição"}</div>
        <div class="category-entry-card__value">${w(c.valor||0)}</div>
      `,m.appendChild(_)}),setTimeout(()=>{const c=document.getElementById("lancamentos");c&&c.scrollIntoView({behavior:"smooth",block:"start"})},100)},T=async l=>{const u=Array.isArray(l)?l:[l];a.innerHTML=I,a.style.display="";const g=a.querySelector("#detail-accounts-cards"),h=a.querySelector("#detail-categories-cards"),m=r.filter(y=>u.includes(y.orcamento));S(),h&&(h.innerHTML="",(m.length>0?x(m).filter(c=>c.total<0).sort((c,_)=>c.total-_.total).slice(0,10):[]).forEach((c,_)=>{const p=document.createElement("div");p.className="category-card",p.dataset.categoria=c.categoria,p.innerHTML=`
          <div class="category-card__rank">#${_+1}</div>
          <div class="category-card__content">
            <div class="category-card__name">${c.categoria}</div>
            <div class="category-card__value">${w(c.total)}</div>
          </div>
        `,p.addEventListener("click",()=>{h.querySelectorAll(".category-card").forEach(f=>{f.classList.remove("category-card--selected")}),g&&g.querySelectorAll(".details__card").forEach(f=>{f.classList.remove("details__card--selected")}),p.classList.add("category-card--selected"),b(c.categoria,u)}),h.appendChild(p)})),await E(u)};a.innerHTML=I,a.style.display="",S(),await T(s),document.addEventListener("detail:show",async l=>{const g=l.detail.orcamento;s.includes(g)?s=s.filter(h=>h!==g):s.push(g),await T(s)}),document.addEventListener("cards:updated",async l=>{const u=l,{allEntries:g}=u.detail||{};g&&(r=g,await T(s))})}function ge(t=[],e="orcamento",a=-5,s=35){const{startSerial:r,endSerial:i}=W(a,s);return t.filter(n=>{const o=n&&n[e];return typeof o=="number"&&!Number.isNaN(o)&&o>=r&&o<=i})}function F(t=[],e="orcamento"){const a=new Map;return t.forEach(r=>{let i=r&&r[e],n=Number(i);if(!Number.isFinite(n)&&typeof i=="string"&&i.includes("/")){const E=i.split("/");if(E.length===3){const[S,x,b]=E.map(T=>Number(T));[S,x,b].every(Number.isFinite)&&(n=M(new Date(b,x-1,S)))}else if(E.length===2){const[S,x]=E.map(b=>Number(b));[S,x].every(Number.isFinite)&&(n=M(new Date(x,S-1,1)))}}if(!Number.isFinite(n))return;const o=Number(r.valor)||0,d=a.get(n)||{orcamento:n,sum:0,count:0,incomes:0,expenses:0};d.sum+=o,d.count+=1,o>=0?d.incomes+=o:d.expenses+=o,a.set(n,d)}),Array.from(a.values()).map(r=>({orcamento:r.orcamento,label:q(r.orcamento),count:r.count,sum:Number(r.sum.toFixed(2)),incomes:Number(r.incomes.toFixed(2)),expenses:Number(r.expenses.toFixed(2))})).sort((r,i)=>i.orcamento-r.orcamento)}function R(t=[],e="orcamento"){const a=r=>{let i=Number(r);if(Number.isFinite(i))return i;if(typeof r=="string"&&r.includes("/")){const n=r.split("/");if(n.length===3){const[o,d,E]=n.map(S=>Number(S));if([o,d,E].every(Number.isFinite))return M(new Date(E,d-1,o))}else if(n.length===2){const[o,d]=n.map(E=>Number(E));if([o,d].every(Number.isFinite))return M(new Date(d,o-1,1))}}return null},s=new Map;return t.forEach(r=>{const i=r&&r[e],n=a(i);n===null||!Number.isFinite(n)||s.has(n)||s.set(n,{orcamento:n,label:q(n)})}),Array.from(s.values()).sort((r,i)=>r.orcamento-i.orcamento)}function me(t=[]){const e=new Map;return t.forEach(s=>{if(!s.conta||s.conta.trim()==="")return;const r=Number(s.valor)||0,i=e.get(s.conta)||{total:0,count:0};i.total+=r,i.count+=1,e.set(s.conta,i)}),Array.from(e.entries()).map(([s,r])=>({conta:s,total:Number(r.total.toFixed(2)),count:r.count})).sort((s,r)=>s.conta.localeCompare(r.conta))}async function k(){if(!await X()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}if(re(),ce(),await J(()=>{console.log("✅ Lançamento adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await K(()=>{console.log("✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await Z(()=>{console.log("✅ Transferência realizada! Recarregue a página para ver as mudanças."),window.location.reload()}),Q(()=>ne(),()=>te(),()=>ae()),!z.authStore.isValid){console.log("⚠️ Usuário não autenticado");return}if(!(await pe()).isValid){fe();return}const a=document.getElementById("refreshDashboardBtn");a&&a.addEventListener("click",async()=>{console.log("🔄 Atualizando dashboard (limpando cache)...");const s=a.innerHTML;a.disabled=!0,a.innerHTML="⏳ Atualizando...";try{await he()}finally{a.disabled=!1,a.innerHTML=s}}),await V(),console.log("✅ Dashboard inicializado")}async function pe(){try{const e=await(await fetch(`${j.configStatus}`,{method:"GET",headers:{Authorization:`Bearer ${z.authStore.token}`}})).json();return{isValid:e.hasRefreshToken&&e.hasSheetId}}catch(t){return console.error("Erro ao verificar configuração:",t),{isValid:!1}}}function fe(){const t=document.getElementById("configBtn");t&&(t.style.display="");const e=document.getElementById("summaryCards");e&&(e.style.display="none");const a=document.querySelector(".dashboard__col--right.details");a&&(a.style.display="none");const s=document.getElementById("openEntryModal");s&&(s.style.display="none");const r=document.querySelector(".dashboard__header");if(r&&!document.getElementById("configMessage")){const i=document.createElement("p");i.id="configMessage",i.style.marginTop="1rem",i.textContent='Integração com Google não configurada. Clique em "Configurar Integração" para continuar.',r.appendChild(i);const n=document.createElement("a");n.href="/dashboard/configuracao.html",n.className="button primary",n.style.marginTop="1rem",n.style.display="inline-block",n.textContent="⚙️ Configurar Integração",r.appendChild(n)}}async function he(){try{await V(!0),console.log("✅ Dashboard atualizado com sucesso")}catch(t){console.error("❌ Erro ao atualizar dashboard:",t),O("Erro ao atualizar dados. Tente novamente.")}}async function V(t=!1){try{const e=await ee.fetchEntries(0,t),a=(e==null?void 0:e.entries)??[];if(!a||a.length===0){ve();return}window.allEntries=a;const s=F(a);window.allBudgets=R(a);const r=ge(a),i=F(r),n=R(r);window.accountSummary=me(a),console.log("📊 Contas agregadas:",window.accountSummary),window.filteredEntries=r,window.summaryByBudget=i,window.budgetsInInterval=n;const o={};i.forEach(d=>{o[d.label]=!0}),se(s,o),await ue(a,n)}catch(e){console.error("Erro ao carregar dados:",e),O("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.")}}function ve(){const t=document.getElementById("summaryCards");t&&(t.style.display="none");const e=document.querySelector(".dashboard__col--right.details");e&&(e.style.display="none");const a=document.getElementById("openEntryModal");a&&(a.style.display="");const s=document.querySelector(".dashboard__header");if(s&&!document.getElementById("firstEntryMessage")){const r=document.createElement("div");r.id="firstEntryMessage",r.style.marginTop="1rem",r.className="notice",r.textContent='Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.',s.appendChild(r)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",k):k();
