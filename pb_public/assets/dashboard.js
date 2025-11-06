import{p as B,A as $}from"./auth.js";import"./sheets.js";import{t as N,e as q,g as D,i as F,a as A,b as k,c as H,l as R,o as z,d as V,f as O}from"./fab-menu.js";import{r as P}from"./user-menu.js";function E(a){return Number(a).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}let L=[],w={};function j(a,e){const n=document.getElementById("summaryCards");if(!n)return;L=a||[],w=e||{};const s=L.slice().sort((r,o)=>o.orcamento-r.orcamento);n.className="financial-cards",n.innerHTML="",s.forEach(r=>{w[r.label]===!0?n.appendChild(G(r)):n.appendChild(U(r))}),n.querySelectorAll(".financial-card--inactive").forEach(r=>{const o=r;o.style.cursor="pointer",o.addEventListener("click",S)}),n.querySelectorAll(".financial-card__close").forEach(r=>{r.addEventListener("click",I)})}function G(a){const e=document.createElement("div"),n=a.sum>=0?"financial-card--incomes":"financial-card--expenses";return e.className=`financial-card ${n}`,e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a.label}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a.label}</h3>
    </div>
    <div class="financial-card__value">${E(a.sum)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${E(a.incomes)}</div>
      <div class="financial-card__detail">Despesas: ${E(a.expenses)}</div>
    </div>
  `,e}function U(a){const e=document.createElement("div");return e.className="financial-card financial-card--inactive",e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <div class="financial-card__title">${a.label}</div>
    <div class="financial-card__value">...</div>
  `,e}function S(){const a=this.dataset.budget,e=parseFloat(this.dataset.sum),n=parseFloat(this.dataset.incomes),s=parseFloat(this.dataset.expenses),t=Number(this.dataset.orcamento);this.classList.remove("financial-card--inactive");const c=e>=0?"financial-card--incomes":"financial-card--expenses";this.classList.add(c),this.style.cursor="default",this.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a}</h3>
    </div>
    <div class="financial-card__value">${E(e)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${E(n)}</div>
      <div class="financial-card__detail">Despesas: ${E(s)}</div>
    </div>
  `,this.removeEventListener("click",S);const r=this.querySelector(".financial-card__toggle");r&&r.addEventListener("click",function(y){y.stopPropagation();const d=this.closest(".financial-card").classList.toggle("financial-card__details--hidden");this.setAttribute("aria-expanded",String(!d)),this.textContent=d?"Mostrar detalhes":"Ocultar detalhes"});const o=this.querySelector(".financial-card__close");o&&o.addEventListener("click",I),document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:t}}))}function I(a){a.stopPropagation();const e=this.closest(".financial-card"),n=e.dataset.budget,s=e.dataset.sum,t=e.dataset.incomes,c=e.dataset.expenses,r=e.dataset.orcamento;e.className="financial-card financial-card--inactive",e.style.cursor="pointer",e.innerHTML=`
    <div class="financial-card__title">${n}</div>
    <div class="financial-card__value">...</div>
  `,e.dataset.budget=n,e.dataset.sum=s,e.dataset.incomes=t,e.dataset.expenses=c,e.dataset.orcamento=r;const o=e.cloneNode(!0);e.replaceWith(o);const y=document.querySelector(`.financial-card--inactive[data-budget="${n}"]`);y&&(y.style.cursor="pointer",y.addEventListener("click",S));const p=Number(r);document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:p}}))}function W(){const a=document.getElementById("summaryCards");a==null||a.addEventListener("click",e=>{const s=e.target.closest(".financial-card__toggle");if(!s)return;const c=s.closest(".financial-card").querySelector(".financial-card__details"),r=c==null?void 0:c.classList.toggle("financial-card__details--hidden");s.setAttribute("aria-expanded",String(!r)),s.textContent=r?"Mostrar detalhes":"Ocultar detalhes"})}function J(a="Verifique sua conexão e tente novamente"){const e=document.getElementById("summaryCards");e&&(e.className="financial-cards",e.innerHTML=`
    <div class="financial-card financial-card--saldo">
      <div class="financial-card__header">
        <h3 class="financial-card__title">Erro ao carregar dados</h3>
      </div>
      <div class="financial-card__value">${a}</div>
    </div>
  `)}const K=`
  <div class="details__aggregates">
    <h3 class="details__title">Saldo e contas</h3>
    <h3><span class="details__saldo" id="detail-saldo">R$ 0,00</span></h3>
    <div class="details__cards" id="detail-accounts-cards">
      <!-- Cartões de contas serão renderizados aqui -->
    </div>
  </div>

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
`;function Q(a,e){const n=document.querySelector(".details");if(!n)return;let s=e.map(d=>d.orcamento),t=a||[];const c=d=>{const m={};return d.forEach(i=>{!i.conta||i.conta.trim()===""||(m[i.conta]=(m[i.conta]||0)+(i.valor||0))}),Object.entries(m).map(([i,v])=>({conta:i,total:v}))},r=d=>{const m={};return d.forEach(i=>{const v=i.categoria||"Sem categoria";m[v]=(m[v]||0)+(i.valor||0)}),Object.entries(m).map(([i,v])=>({categoria:i,total:v}))},o=(d,m)=>{const i=n.querySelector("#detail-entries"),v=n.querySelector("#detail-entries-title"),_=n.querySelector("#entries-list");if(!i||!_||!v)return;v.textContent=`Lançamentos da Categoria: ${d}`;const h=t.filter(l=>m.includes(l.orcamento)&&(l.categoria||"Sem categoria")===d&&l.valor<0);if(h.sort((l,f)=>{if(!l.data&&!f.data)return 0;if(!l.data)return 1;if(!f.data)return-1;const u=new Date(l.data).getTime(),g=new Date(f.data).getTime();return isNaN(u)&&isNaN(g)?0:isNaN(u)?1:isNaN(g)?-1:g-u}),i.classList.remove("details__category-entries--hidden"),_.innerHTML="",h.length===0){_.innerHTML='<p class="category-entries-empty">Nenhum lançamento encontrado nesta categoria.</p>';return}h.forEach(l=>{const f=document.createElement("div");f.className="category-entry-card";let u="Data não informada";if(l.data){const g=new Date(l.data);isNaN(g.getTime())||(u=g.toLocaleDateString("pt-BR"))}f.innerHTML=`
        <div class="category-entry-card__date">${u}</div>
        <div class="category-entry-card__description">${l.descricao||"Sem descrição"}</div>
        <div class="category-entry-card__value">${E(l.valor||0)}</div>
      `,_.appendChild(f)})},y=(d,m)=>{const i=n.querySelector("#detail-entries"),v=n.querySelector("#detail-entries-title"),_=n.querySelector("#entries-list");if(!i||!_||!v)return;v.textContent=`Lançamentos da Conta: ${d}`;const h=t.filter(l=>m.includes(l.orcamento)&&l.conta===d);if(h.sort((l,f)=>{if(!l.data&&!f.data)return 0;if(!l.data)return 1;if(!f.data)return-1;const u=new Date(l.data).getTime(),g=new Date(f.data).getTime();return isNaN(u)&&isNaN(g)?0:isNaN(u)?1:isNaN(g)?-1:g-u}),i.classList.remove("details__category-entries--hidden"),_.innerHTML="",h.length===0){_.innerHTML='<p class="category-entries-empty">Nenhum lançamento encontrado nesta conta.</p>';return}h.forEach(l=>{const f=document.createElement("div");f.className="category-entry-card";let u="Data não informada";if(l.data){const g=new Date(l.data);isNaN(g.getTime())||(u=g.toLocaleDateString("pt-BR"))}f.innerHTML=`
        <div class="category-entry-card__date">${u}</div>
        <div class="category-entry-card__description">${l.descricao||"Sem descrição"}</div>
        <div class="category-entry-card__value">${E(l.valor||0)}</div>
      `,_.appendChild(f)})},p=d=>{const m=Array.isArray(d)?d:[d];n.innerHTML=K,n.style.display="";const i=n.querySelector("#detail-saldo"),v=n.querySelector("#detail-accounts-cards"),_=n.querySelector("#detail-categories-cards"),h=t.filter(f=>m.includes(f.orcamento));if(!h.length){i&&(i.textContent=E(0));return}const l=h.reduce((f,u)=>f+(u.valor||0),0);i&&(i.textContent=E(l)),v&&(v.innerHTML="",c(h).forEach(({conta:f,total:u})=>{const g=document.createElement("div");g.className="details__card details__card--clickable",g.dataset.conta=f,g.innerHTML=`
          <div class="details__card-title">${f}</div>
          <div class="details__card-value">${E(u)}</div>
        `,g.addEventListener("click",()=>{v.querySelectorAll(".details__card").forEach(C=>{C.classList.remove("details__card--selected")});const b=n.querySelector("#detail-categories-cards");b&&b.querySelectorAll(".category-card").forEach(C=>{C.classList.remove("category-card--selected")}),g.classList.add("details__card--selected"),y(f,m)}),v.appendChild(g)})),_&&(_.innerHTML="",r(h).filter(u=>u.total<0).sort((u,g)=>u.total-g.total).slice(0,10).forEach((u,g)=>{const b=document.createElement("div");b.className="category-card",b.dataset.categoria=u.categoria,b.innerHTML=`
          <div class="category-card__rank">#${g+1}</div>
          <div class="category-card__content">
            <div class="category-card__name">${u.categoria}</div>
            <div class="category-card__value">${E(u.total)}</div>
          </div>
        `,b.addEventListener("click",()=>{_.querySelectorAll(".category-card").forEach(C=>{C.classList.remove("category-card--selected")}),v&&v.querySelectorAll(".details__card").forEach(C=>{C.classList.remove("details__card--selected")}),b.classList.add("category-card--selected"),o(u.categoria,m)}),_.appendChild(b)}))};s.length>0&&p(s),document.addEventListener("detail:show",d=>{const i=d.detail.orcamento;s.includes(i)?s=s.filter(v=>v!==i):s.push(i),p(s)}),document.addEventListener("cards:updated",d=>{const m=d,{allEntries:i}=m.detail||{};i&&(t=i,p(s))})}function X(a=[],e="orcamento",n=-5,s=35){const{startSerial:t,endSerial:c}=D(n,s);return a.filter(r=>{const o=r&&r[e];return typeof o=="number"&&!Number.isNaN(o)&&o>=t&&o<=c})}function M(a=[],e="orcamento"){const n=new Map;return a.forEach(t=>{let c=t&&t[e],r=Number(c);if(!Number.isFinite(r)&&typeof c=="string"&&c.includes("/")){const p=c.split("/");if(p.length===3){const[d,m,i]=p.map(v=>Number(v));[d,m,i].every(Number.isFinite)&&(r=N(new Date(i,m-1,d)))}else if(p.length===2){const[d,m]=p.map(i=>Number(i));[d,m].every(Number.isFinite)&&(r=N(new Date(m,d-1,1)))}}if(!Number.isFinite(r))return;const o=Number(t.valor)||0,y=n.get(r)||{orcamento:r,sum:0,count:0,incomes:0,expenses:0};y.sum+=o,y.count+=1,o>=0?y.incomes+=o:y.expenses+=o,n.set(r,y)}),Array.from(n.values()).map(t=>({orcamento:t.orcamento,label:q(t.orcamento),count:t.count,sum:Number(t.sum.toFixed(2)),incomes:Number(t.incomes.toFixed(2)),expenses:Number(t.expenses.toFixed(2))})).sort((t,c)=>c.orcamento-t.orcamento)}function x(a=[],e="orcamento"){const n=t=>{let c=Number(t);if(Number.isFinite(c))return c;if(typeof t=="string"&&t.includes("/")){const r=t.split("/");if(r.length===3){const[o,y,p]=r.map(d=>Number(d));if([o,y,p].every(Number.isFinite))return N(new Date(p,y-1,o))}else if(r.length===2){const[o,y]=r.map(p=>Number(p));if([o,y].every(Number.isFinite))return N(new Date(y,o-1,1))}}return null},s=new Map;return a.forEach(t=>{const c=t&&t[e],r=n(c);r===null||!Number.isFinite(r)||s.has(r)||s.set(r,{orcamento:r,label:q(r)})}),Array.from(s.values()).sort((t,c)=>t.orcamento-c.orcamento)}async function T(){if(P(),W(),await F(()=>{console.log("✅ Lançamento adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await A(()=>{console.log("✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await k(()=>{console.log("✅ Transferência realizada! Recarregue a página para ver as mudanças."),window.location.reload()}),H(()=>O(),()=>V(),()=>z()),!B.authStore.isValid){console.log("⚠️ Usuário não autenticado");return}if(!(await Y()).isValid){Z();return}await ee(),console.log("✅ Dashboard inicializado")}async function Y(){try{const e=await(await fetch(`${$.configStatus}`,{method:"GET",headers:{Authorization:`Bearer ${B.authStore.token}`}})).json();return{isValid:e.hasRefreshToken&&e.hasSheetId}}catch(a){return console.error("Erro ao verificar configuração:",a),{isValid:!1}}}function Z(){const a=document.getElementById("configBtn");a&&(a.style.display="");const e=document.getElementById("summaryCards");e&&(e.style.display="none");const n=document.querySelector(".dashboard__col--right.details");n&&(n.style.display="none");const s=document.getElementById("openEntryModal");s&&(s.style.display="none");const t=document.querySelector(".dashboard__header");if(t&&!document.getElementById("configMessage")){const c=document.createElement("p");c.id="configMessage",c.style.marginTop="1rem",c.textContent='Integração com Google não configurada. Clique em "Configurar Integração" para continuar.',t.appendChild(c)}}async function ee(){try{const a=await R.fetchEntries(0,!1),e=(a==null?void 0:a.entries)??[];if(!e||e.length===0){ae();return}window.allEntries=e;const n=M(e);window.allBudgets=x(e);const s=X(e),t=M(s),c=x(s);window.filteredEntries=s,window.summaryByBudget=t,window.budgetsInInterval=c;const r={};t.forEach(o=>{r[o.label]=!0}),j(n,r),Q(e,c)}catch(a){console.error("Erro ao carregar dados:",a),J("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.")}}function ae(){const a=document.getElementById("summaryCards");a&&(a.style.display="none");const e=document.querySelector(".dashboard__col--right.details");e&&(e.style.display="none");const n=document.getElementById("openEntryModal");n&&(n.style.display="");const s=document.querySelector(".dashboard__header");if(s&&!document.getElementById("firstEntryMessage")){const t=document.createElement("div");t.id="firstEntryMessage",t.style.marginTop="1rem",t.className="notice",t.textContent='Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.',s.appendChild(t)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",T):T();
