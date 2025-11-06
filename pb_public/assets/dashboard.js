import{p as M,A as I}from"./auth.js";import"./sheets.js";import{t as y,e as N,g as B,i as T,a as $,b as q,c as F,l as k,o as A,d as H,f as D}from"./fab-menu.js";import{r as R}from"./user-menu.js";function f(a){return Number(a).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}let b=[],E={};function z(a,e){const s=document.getElementById("summaryCards");if(!s)return;b=a||[],E=e||{};const i=b.slice().sort((t,c)=>c.orcamento-t.orcamento);s.className="financial-cards",s.innerHTML="",i.forEach(t=>{E[t.label]===!0?s.appendChild(V(t)):s.appendChild(O(t))}),s.querySelectorAll(".financial-card--inactive").forEach(t=>{const c=t;c.style.cursor="pointer",c.addEventListener("click",_)}),s.querySelectorAll(".financial-card__close").forEach(t=>{t.addEventListener("click",x)})}function V(a){const e=document.createElement("div"),s=a.sum>=0?"financial-card--incomes":"financial-card--expenses";return e.className=`financial-card ${s}`,e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a.label}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a.label}</h3>
    </div>
    <div class="financial-card__value">${f(a.sum)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${f(a.incomes)}</div>
      <div class="financial-card__detail">Despesas: ${f(a.expenses)}</div>
    </div>
  `,e}function O(a){const e=document.createElement("div");return e.className="financial-card financial-card--inactive",e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <div class="financial-card__title">${a.label}</div>
    <div class="financial-card__value">...</div>
  `,e}function _(){const a=this.dataset.budget,e=parseFloat(this.dataset.sum),s=parseFloat(this.dataset.incomes),i=parseFloat(this.dataset.expenses),n=Number(this.dataset.orcamento);this.classList.remove("financial-card--inactive");const o=e>=0?"financial-card--incomes":"financial-card--expenses";this.classList.add(o),this.style.cursor="default",this.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a}</h3>
    </div>
    <div class="financial-card__value">${f(e)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${f(s)}</div>
      <div class="financial-card__detail">Despesas: ${f(i)}</div>
    </div>
  `,this.removeEventListener("click",_);const t=this.querySelector(".financial-card__toggle");t&&t.addEventListener("click",function(d){d.stopPropagation();const r=this.closest(".financial-card").classList.toggle("financial-card__details--hidden");this.setAttribute("aria-expanded",String(!r)),this.textContent=r?"Mostrar detalhes":"Ocultar detalhes"});const c=this.querySelector(".financial-card__close");c&&c.addEventListener("click",x),document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:n}}))}function x(a){a.stopPropagation();const e=this.closest(".financial-card"),s=e.dataset.budget,i=e.dataset.sum,n=e.dataset.incomes,o=e.dataset.expenses,t=e.dataset.orcamento;e.className="financial-card financial-card--inactive",e.style.cursor="pointer",e.innerHTML=`
    <div class="financial-card__title">${s}</div>
    <div class="financial-card__value">...</div>
  `,e.dataset.budget=s,e.dataset.sum=i,e.dataset.incomes=n,e.dataset.expenses=o,e.dataset.orcamento=t;const c=e.cloneNode(!0);e.replaceWith(c);const d=document.querySelector(`.financial-card--inactive[data-budget="${s}"]`);d&&(d.style.cursor="pointer",d.addEventListener("click",_));const l=Number(t);document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:l}}))}function P(){const a=document.getElementById("summaryCards");a==null||a.addEventListener("click",e=>{const i=e.target.closest(".financial-card__toggle");if(!i)return;const o=i.closest(".financial-card").querySelector(".financial-card__details"),t=o==null?void 0:o.classList.toggle("financial-card__details--hidden");i.setAttribute("aria-expanded",String(!t)),i.textContent=t?"Mostrar detalhes":"Ocultar detalhes"})}function j(a="Verifique sua conexão e tente novamente"){const e=document.getElementById("summaryCards");e&&(e.className="financial-cards",e.innerHTML=`
    <div class="financial-card financial-card--saldo">
      <div class="financial-card__header">
        <h3 class="financial-card__title">Erro ao carregar dados</h3>
      </div>
      <div class="financial-card__value">${a}</div>
    </div>
  `)}const G=`
  <div class="details__aggregates">
    <h3 class="details__title">Saldo e contas</h3>
    <h3><span class="details__saldo" id="detail-saldo">R$ 0,00</span></h3>
    <div class="details__cards" id="detail-accounts-cards">
      <!-- Cartões de contas serão renderizados aqui -->
    </div>
  </div>

  <div class="details__top-categories" style="margin-top:1rem;">
    <h3 class="details__title">Top 10 Gastos por Categoria</h3>
    <div class="tabela-rolavel">
      <table class="details__table primary">
        <thead>
          <tr>
            <th>#</th>
            <th>Categoria</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody id="detail-categories-list">
          <!-- Linhas de categorias serão renderizadas aqui -->
        </tbody>
      </table>
    </div>
  </div>
`;function U(a,e){const s=document.querySelector(".details");if(!s)return;let i=e.map(d=>d.orcamento),n=a||[];const o=d=>{const l={};return d.forEach(r=>{!r.conta||r.conta.trim()===""||(l[r.conta]=(l[r.conta]||0)+(r.valor||0))}),Object.entries(l).map(([r,u])=>({conta:r,total:u}))},t=d=>{const l={};return d.forEach(r=>{const u=r.categoria||"Sem categoria";l[u]=(l[u]||0)+(r.valor||0)}),Object.entries(l).map(([r,u])=>({categoria:r,total:u}))},c=d=>{const l=Array.isArray(d)?d:[d];s.innerHTML=G,s.style.display="";const r=s.querySelector("#detail-saldo"),u=s.querySelector("#detail-accounts-cards"),g=s.querySelector("#detail-categories-list"),v=n.filter(m=>l.includes(m.orcamento));if(!v.length){r&&(r.textContent=f(0));return}const L=v.reduce((m,p)=>m+(p.valor||0),0);r&&(r.textContent=f(L)),u&&(u.innerHTML="",o(v).forEach(({conta:m,total:p})=>{const h=document.createElement("div");h.className="details__card",h.innerHTML=`
          <div class="details__card-title">${m}</div>
          <div class="details__card-value">${f(p)}</div>
        `,u.appendChild(h)})),g&&(g.innerHTML="",t(v).filter(m=>m.total<0).sort((m,p)=>m.total-p.total).slice(0,10).forEach((m,p)=>{const h=document.createElement("tr");h.innerHTML=`
            <td>${p+1}</td>
            <td>${m.categoria}</td>
            <td>${f(m.total)}</td>
          `,g.appendChild(h)}))};i.length>0&&c(i),document.addEventListener("detail:show",d=>{const r=d.detail.orcamento;i.includes(r)?i=i.filter(u=>u!==r):i.push(r),c(i)}),document.addEventListener("cards:updated",d=>{const l=d,{allEntries:r}=l.detail||{};r&&(n=r,c(i))})}function W(a=[],e="orcamento",s=-5,i=35){const{startSerial:n,endSerial:o}=B(s,i);return a.filter(t=>{const c=t&&t[e];return typeof c=="number"&&!Number.isNaN(c)&&c>=n&&c<=o})}function C(a=[],e="orcamento"){const s=new Map;return a.forEach(n=>{let o=n&&n[e],t=Number(o);if(!Number.isFinite(t)&&typeof o=="string"&&o.includes("/")){const l=o.split("/");if(l.length===3){const[r,u,g]=l.map(v=>Number(v));[r,u,g].every(Number.isFinite)&&(t=y(new Date(g,u-1,r)))}else if(l.length===2){const[r,u]=l.map(g=>Number(g));[r,u].every(Number.isFinite)&&(t=y(new Date(u,r-1,1)))}}if(!Number.isFinite(t))return;const c=Number(n.valor)||0,d=s.get(t)||{orcamento:t,sum:0,count:0,incomes:0,expenses:0};d.sum+=c,d.count+=1,c>=0?d.incomes+=c:d.expenses+=c,s.set(t,d)}),Array.from(s.values()).map(n=>({orcamento:n.orcamento,label:N(n.orcamento),count:n.count,sum:Number(n.sum.toFixed(2)),incomes:Number(n.incomes.toFixed(2)),expenses:Number(n.expenses.toFixed(2))})).sort((n,o)=>o.orcamento-n.orcamento)}function S(a=[],e="orcamento"){const s=n=>{let o=Number(n);if(Number.isFinite(o))return o;if(typeof n=="string"&&n.includes("/")){const t=n.split("/");if(t.length===3){const[c,d,l]=t.map(r=>Number(r));if([c,d,l].every(Number.isFinite))return y(new Date(l,d-1,c))}else if(t.length===2){const[c,d]=t.map(l=>Number(l));if([c,d].every(Number.isFinite))return y(new Date(d,c-1,1))}}return null},i=new Map;return a.forEach(n=>{const o=n&&n[e],t=s(o);t===null||!Number.isFinite(t)||i.has(t)||i.set(t,{orcamento:t,label:N(t)})}),Array.from(i.values()).sort((n,o)=>n.orcamento-o.orcamento)}async function w(){if(R(),P(),await T(()=>{console.log("✅ Lançamento adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await $(()=>{console.log("✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await q(()=>{console.log("✅ Transferência realizada! Recarregue a página para ver as mudanças."),window.location.reload()}),F(()=>D(),()=>H(),()=>A()),!M.authStore.isValid){console.log("⚠️ Usuário não autenticado");return}if(!(await J()).isValid){K();return}await Q(),console.log("✅ Dashboard inicializado")}async function J(){try{const e=await(await fetch(`${I.configStatus}`,{method:"GET",headers:{Authorization:`Bearer ${M.authStore.token}`}})).json();return{isValid:e.hasRefreshToken&&e.hasSheetId}}catch(a){return console.error("Erro ao verificar configuração:",a),{isValid:!1}}}function K(){const a=document.getElementById("configBtn");a&&(a.style.display="");const e=document.getElementById("summaryCards");e&&(e.style.display="none");const s=document.querySelector(".dashboard__col--right.details");s&&(s.style.display="none");const i=document.getElementById("openEntryModal");i&&(i.style.display="none");const n=document.querySelector(".dashboard__header");if(n&&!document.getElementById("configMessage")){const o=document.createElement("p");o.id="configMessage",o.style.marginTop="1rem",o.textContent='Integração com Google não configurada. Clique em "Configurar Integração" para continuar.',n.appendChild(o)}}async function Q(){try{const a=await k.fetchEntries(0,!1),e=(a==null?void 0:a.entries)??[];if(!e||e.length===0){X();return}window.allEntries=e;const s=C(e);window.allBudgets=S(e);const i=W(e),n=C(i),o=S(i);window.filteredEntries=i,window.summaryByBudget=n,window.budgetsInInterval=o;const t={};n.forEach(c=>{t[c.label]=!0}),z(s,t),U(e,o)}catch(a){console.error("Erro ao carregar dados:",a),j("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.")}}function X(){const a=document.getElementById("summaryCards");a&&(a.style.display="none");const e=document.querySelector(".dashboard__col--right.details");e&&(e.style.display="none");const s=document.getElementById("openEntryModal");s&&(s.style.display="");const i=document.querySelector(".dashboard__header");if(i&&!document.getElementById("firstEntryMessage")){const n=document.createElement("div");n.id="firstEntryMessage",n.style.marginTop="1rem",n.className="notice",n.textContent='Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.',i.appendChild(n)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",w):w();
