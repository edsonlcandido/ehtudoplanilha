import{p as x,A as $}from"./auth.js";import"./sheets.js";import{t as b,e as B,g as q,i as F,a as k,b as A,c as D,l as H,o as R,d as z,f as V}from"./fab-menu.js";import{r as O}from"./user-menu.js";function y(a){return Number(a).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}let S=[],N={};function P(a,e){const s=document.getElementById("summaryCards");if(!s)return;S=a||[],N=e||{};const r=S.slice().sort((n,o)=>o.orcamento-n.orcamento);s.className="financial-cards",s.innerHTML="",r.forEach(n=>{N[n.label]===!0?s.appendChild(j(n)):s.appendChild(G(n))}),s.querySelectorAll(".financial-card--inactive").forEach(n=>{const o=n;o.style.cursor="pointer",o.addEventListener("click",C)}),s.querySelectorAll(".financial-card__close").forEach(n=>{n.addEventListener("click",I)})}function j(a){const e=document.createElement("div"),s=a.sum>=0?"financial-card--incomes":"financial-card--expenses";return e.className=`financial-card ${s}`,e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a.label}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a.label}</h3>
    </div>
    <div class="financial-card__value">${y(a.sum)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${y(a.incomes)}</div>
      <div class="financial-card__detail">Despesas: ${y(a.expenses)}</div>
    </div>
  `,e}function G(a){const e=document.createElement("div");return e.className="financial-card financial-card--inactive",e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <div class="financial-card__title">${a.label}</div>
    <div class="financial-card__value">...</div>
  `,e}function C(){const a=this.dataset.budget,e=parseFloat(this.dataset.sum),s=parseFloat(this.dataset.incomes),r=parseFloat(this.dataset.expenses),t=Number(this.dataset.orcamento);this.classList.remove("financial-card--inactive");const i=e>=0?"financial-card--incomes":"financial-card--expenses";this.classList.add(i),this.style.cursor="default",this.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a}</h3>
    </div>
    <div class="financial-card__value">${y(e)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${y(s)}</div>
      <div class="financial-card__detail">Despesas: ${y(r)}</div>
    </div>
  `,this.removeEventListener("click",C);const n=this.querySelector(".financial-card__toggle");n&&n.addEventListener("click",function(m){m.stopPropagation();const l=this.closest(".financial-card").classList.toggle("financial-card__details--hidden");this.setAttribute("aria-expanded",String(!l)),this.textContent=l?"Mostrar detalhes":"Ocultar detalhes"});const o=this.querySelector(".financial-card__close");o&&o.addEventListener("click",I),document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:t}}))}function I(a){a.stopPropagation();const e=this.closest(".financial-card"),s=e.dataset.budget,r=e.dataset.sum,t=e.dataset.incomes,i=e.dataset.expenses,n=e.dataset.orcamento;e.className="financial-card financial-card--inactive",e.style.cursor="pointer",e.innerHTML=`
    <div class="financial-card__title">${s}</div>
    <div class="financial-card__value">...</div>
  `,e.dataset.budget=s,e.dataset.sum=r,e.dataset.incomes=t,e.dataset.expenses=i,e.dataset.orcamento=n;const o=e.cloneNode(!0);e.replaceWith(o);const m=document.querySelector(`.financial-card--inactive[data-budget="${s}"]`);m&&(m.style.cursor="pointer",m.addEventListener("click",C));const d=Number(n);document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:d}}))}function U(){const a=document.getElementById("summaryCards");a==null||a.addEventListener("click",e=>{const r=e.target.closest(".financial-card__toggle");if(!r)return;const i=r.closest(".financial-card").querySelector(".financial-card__details"),n=i==null?void 0:i.classList.toggle("financial-card__details--hidden");r.setAttribute("aria-expanded",String(!n)),r.textContent=n?"Mostrar detalhes":"Ocultar detalhes"})}function W(a="Verifique sua conexão e tente novamente"){const e=document.getElementById("summaryCards");e&&(e.className="financial-cards",e.innerHTML=`
    <div class="financial-card financial-card--saldo">
      <div class="financial-card__header">
        <h3 class="financial-card__title">Erro ao carregar dados</h3>
      </div>
      <div class="financial-card__value">${a}</div>
    </div>
  `)}const J=`
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

  <div class="details__category-entries details__category-entries--hidden" id="detail-category-entries">
    <h3 class="details__title">Lançamentos da Categoria</h3>
    <div class="category-entries-list" id="category-entries-list">
      <!-- Lançamentos da categoria selecionada serão renderizados aqui -->
    </div>
  </div>
`;function K(a,e){const s=document.querySelector(".details");if(!s)return;let r=e.map(d=>d.orcamento),t=a||[];const i=d=>{const l={};return d.forEach(c=>{!c.conta||c.conta.trim()===""||(l[c.conta]=(l[c.conta]||0)+(c.valor||0))}),Object.entries(l).map(([c,u])=>({conta:c,total:u}))},n=d=>{const l={};return d.forEach(c=>{const u=c.categoria||"Sem categoria";l[u]=(l[u]||0)+(c.valor||0)}),Object.entries(l).map(([c,u])=>({categoria:c,total:u}))},o=(d,l)=>{const c=s.querySelector("#detail-category-entries"),u=s.querySelector("#category-entries-list");if(!c||!u)return;const p=t.filter(g=>l.includes(g.orcamento)&&(g.categoria||"Sem categoria")===d&&g.valor<0);if(p.sort((g,h)=>{if(!g.data&&!h.data)return 0;if(!g.data)return 1;if(!h.data)return-1;const v=new Date(g.data).getTime(),f=new Date(h.data).getTime();return isNaN(v)&&isNaN(f)?0:isNaN(v)?1:isNaN(f)?-1:f-v}),c.classList.remove("details__category-entries--hidden"),u.innerHTML="",p.length===0){u.innerHTML='<p class="category-entries-empty">Nenhum lançamento encontrado nesta categoria.</p>';return}p.forEach(g=>{const h=document.createElement("div");h.className="category-entry-card";let v="Data não informada";if(g.data){const f=new Date(g.data);isNaN(f.getTime())||(v=f.toLocaleDateString("pt-BR"))}h.innerHTML=`
        <div class="category-entry-card__date">${v}</div>
        <div class="category-entry-card__description">${g.descricao||"Sem descrição"}</div>
        <div class="category-entry-card__value">${y(g.valor||0)}</div>
      `,u.appendChild(h)})},m=d=>{const l=Array.isArray(d)?d:[d];s.innerHTML=J,s.style.display="";const c=s.querySelector("#detail-saldo"),u=s.querySelector("#detail-accounts-cards"),p=s.querySelector("#detail-categories-cards"),g=t.filter(v=>l.includes(v.orcamento));if(!g.length){c&&(c.textContent=y(0));return}const h=g.reduce((v,f)=>v+(f.valor||0),0);c&&(c.textContent=y(h)),u&&(u.innerHTML="",i(g).forEach(({conta:v,total:f})=>{const _=document.createElement("div");_.className="details__card",_.innerHTML=`
          <div class="details__card-title">${v}</div>
          <div class="details__card-value">${y(f)}</div>
        `,u.appendChild(_)})),p&&(p.innerHTML="",n(g).filter(f=>f.total<0).sort((f,_)=>f.total-_.total).slice(0,10).forEach((f,_)=>{const E=document.createElement("div");E.className="category-card",E.dataset.categoria=f.categoria,E.innerHTML=`
          <div class="category-card__rank">#${_+1}</div>
          <div class="category-card__content">
            <div class="category-card__name">${f.categoria}</div>
            <div class="category-card__value">${y(f.total)}</div>
          </div>
        `,E.addEventListener("click",()=>{p.querySelectorAll(".category-card").forEach(T=>{T.classList.remove("category-card--selected")}),E.classList.add("category-card--selected"),o(f.categoria,l)}),p.appendChild(E)}))};r.length>0&&m(r),document.addEventListener("detail:show",d=>{const c=d.detail.orcamento;r.includes(c)?r=r.filter(u=>u!==c):r.push(c),m(r)}),document.addEventListener("cards:updated",d=>{const l=d,{allEntries:c}=l.detail||{};c&&(t=c,m(r))})}function Q(a=[],e="orcamento",s=-5,r=35){const{startSerial:t,endSerial:i}=q(s,r);return a.filter(n=>{const o=n&&n[e];return typeof o=="number"&&!Number.isNaN(o)&&o>=t&&o<=i})}function L(a=[],e="orcamento"){const s=new Map;return a.forEach(t=>{let i=t&&t[e],n=Number(i);if(!Number.isFinite(n)&&typeof i=="string"&&i.includes("/")){const d=i.split("/");if(d.length===3){const[l,c,u]=d.map(p=>Number(p));[l,c,u].every(Number.isFinite)&&(n=b(new Date(u,c-1,l)))}else if(d.length===2){const[l,c]=d.map(u=>Number(u));[l,c].every(Number.isFinite)&&(n=b(new Date(c,l-1,1)))}}if(!Number.isFinite(n))return;const o=Number(t.valor)||0,m=s.get(n)||{orcamento:n,sum:0,count:0,incomes:0,expenses:0};m.sum+=o,m.count+=1,o>=0?m.incomes+=o:m.expenses+=o,s.set(n,m)}),Array.from(s.values()).map(t=>({orcamento:t.orcamento,label:B(t.orcamento),count:t.count,sum:Number(t.sum.toFixed(2)),incomes:Number(t.incomes.toFixed(2)),expenses:Number(t.expenses.toFixed(2))})).sort((t,i)=>i.orcamento-t.orcamento)}function w(a=[],e="orcamento"){const s=t=>{let i=Number(t);if(Number.isFinite(i))return i;if(typeof t=="string"&&t.includes("/")){const n=t.split("/");if(n.length===3){const[o,m,d]=n.map(l=>Number(l));if([o,m,d].every(Number.isFinite))return b(new Date(d,m-1,o))}else if(n.length===2){const[o,m]=n.map(d=>Number(d));if([o,m].every(Number.isFinite))return b(new Date(m,o-1,1))}}return null},r=new Map;return a.forEach(t=>{const i=t&&t[e],n=s(i);n===null||!Number.isFinite(n)||r.has(n)||r.set(n,{orcamento:n,label:B(n)})}),Array.from(r.values()).sort((t,i)=>t.orcamento-i.orcamento)}async function M(){if(O(),U(),await F(()=>{console.log("✅ Lançamento adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await k(()=>{console.log("✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await A(()=>{console.log("✅ Transferência realizada! Recarregue a página para ver as mudanças."),window.location.reload()}),D(()=>V(),()=>z(),()=>R()),!x.authStore.isValid){console.log("⚠️ Usuário não autenticado");return}if(!(await X()).isValid){Y();return}await Z(),console.log("✅ Dashboard inicializado")}async function X(){try{const e=await(await fetch(`${$.configStatus}`,{method:"GET",headers:{Authorization:`Bearer ${x.authStore.token}`}})).json();return{isValid:e.hasRefreshToken&&e.hasSheetId}}catch(a){return console.error("Erro ao verificar configuração:",a),{isValid:!1}}}function Y(){const a=document.getElementById("configBtn");a&&(a.style.display="");const e=document.getElementById("summaryCards");e&&(e.style.display="none");const s=document.querySelector(".dashboard__col--right.details");s&&(s.style.display="none");const r=document.getElementById("openEntryModal");r&&(r.style.display="none");const t=document.querySelector(".dashboard__header");if(t&&!document.getElementById("configMessage")){const i=document.createElement("p");i.id="configMessage",i.style.marginTop="1rem",i.textContent='Integração com Google não configurada. Clique em "Configurar Integração" para continuar.',t.appendChild(i)}}async function Z(){try{const a=await H.fetchEntries(0,!1),e=(a==null?void 0:a.entries)??[];if(!e||e.length===0){ee();return}window.allEntries=e;const s=L(e);window.allBudgets=w(e);const r=Q(e),t=L(r),i=w(r);window.filteredEntries=r,window.summaryByBudget=t,window.budgetsInInterval=i;const n={};t.forEach(o=>{n[o.label]=!0}),P(s,n),K(e,i)}catch(a){console.error("Erro ao carregar dados:",a),W("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.")}}function ee(){const a=document.getElementById("summaryCards");a&&(a.style.display="none");const e=document.querySelector(".dashboard__col--right.details");e&&(e.style.display="none");const s=document.getElementById("openEntryModal");s&&(s.style.display="");const r=document.querySelector(".dashboard__header");if(r&&!document.getElementById("firstEntryMessage")){const t=document.createElement("div");t.id="firstEntryMessage",t.style.marginTop="1rem",t.className="notice",t.textContent='Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.',r.appendChild(t)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",M):M();
