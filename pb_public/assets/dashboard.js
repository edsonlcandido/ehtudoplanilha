import{p as _,A as M}from"./auth.js";/* empty css          */import{r as B}from"./user-menu.js";import{t as y,e as I,g as $,i as T,c as q,o as k}from"./date-helpers.js";function f(t){return Number(t).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}let E=[],C={};function F(t,e){const a=document.getElementById("summaryCards");if(!a)return;E=t||[],C=e||{};const i=E.slice().sort((s,c)=>c.orcamento-s.orcamento);a.className="financial-cards",a.innerHTML="",i.forEach(s=>{C[s.label]===!0?a.appendChild(A(s)):a.appendChild(H(s))}),a.querySelectorAll(".financial-card--inactive").forEach(s=>{const c=s;c.style.cursor="pointer",c.addEventListener("click",b)}),a.querySelectorAll(".financial-card__close").forEach(s=>{s.addEventListener("click",L)})}function A(t){const e=document.createElement("div"),a=t.sum>=0?"financial-card--incomes":"financial-card--expenses";return e.className=`financial-card ${a}`,e.dataset.budget=t.label,e.dataset.sum=String(t.sum),e.dataset.incomes=String(t.incomes),e.dataset.expenses=String(t.expenses),e.dataset.orcamento=String(t.orcamento),e.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${t.label}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${t.label}</h3>
    </div>
    <div class="financial-card__value">${f(t.sum)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${f(t.incomes)}</div>
      <div class="financial-card__detail">Despesas: ${f(t.expenses)}</div>
    </div>
  `,e}function H(t){const e=document.createElement("div");return e.className="financial-card financial-card--inactive",e.dataset.budget=t.label,e.dataset.sum=String(t.sum),e.dataset.incomes=String(t.incomes),e.dataset.expenses=String(t.expenses),e.dataset.orcamento=String(t.orcamento),e.innerHTML=`
    <div class="financial-card__title">${t.label}</div>
    <div class="financial-card__value">...</div>
  `,e}function b(){const t=this.dataset.budget,e=parseFloat(this.dataset.sum),a=parseFloat(this.dataset.incomes),i=parseFloat(this.dataset.expenses),n=Number(this.dataset.orcamento);this.classList.remove("financial-card--inactive");const o=e>=0?"financial-card--incomes":"financial-card--expenses";this.classList.add(o),this.style.cursor="default",this.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${t}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${t}</h3>
    </div>
    <div class="financial-card__value">${f(e)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${f(a)}</div>
      <div class="financial-card__detail">Despesas: ${f(i)}</div>
    </div>
  `,this.removeEventListener("click",b);const s=this.querySelector(".financial-card__toggle");s&&s.addEventListener("click",function(d){d.stopPropagation();const r=this.closest(".financial-card").classList.toggle("financial-card__details--hidden");this.setAttribute("aria-expanded",String(!r)),this.textContent=r?"Mostrar detalhes":"Ocultar detalhes"});const c=this.querySelector(".financial-card__close");c&&c.addEventListener("click",L),document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:n}}))}function L(t){t.stopPropagation();const e=this.closest(".financial-card"),a=e.dataset.budget,i=e.dataset.sum,n=e.dataset.incomes,o=e.dataset.expenses,s=e.dataset.orcamento;e.className="financial-card financial-card--inactive",e.style.cursor="pointer",e.innerHTML=`
    <div class="financial-card__title">${a}</div>
    <div class="financial-card__value">...</div>
  `,e.dataset.budget=a,e.dataset.sum=i,e.dataset.incomes=n,e.dataset.expenses=o,e.dataset.orcamento=s;const c=e.cloneNode(!0);e.replaceWith(c);const d=document.querySelector(`.financial-card--inactive[data-budget="${a}"]`);d&&(d.style.cursor="pointer",d.addEventListener("click",b));const l=Number(s);document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:l}}))}function D(){const t=document.getElementById("summaryCards");t==null||t.addEventListener("click",e=>{const i=e.target.closest(".financial-card__toggle");if(!i)return;const o=i.closest(".financial-card").querySelector(".financial-card__details"),s=o==null?void 0:o.classList.toggle("financial-card__details--hidden");i.setAttribute("aria-expanded",String(!s)),i.textContent=s?"Mostrar detalhes":"Ocultar detalhes"})}function z(t="Verifique sua conexão e tente novamente"){const e=document.getElementById("summaryCards");e&&(e.className="financial-cards",e.innerHTML=`
    <div class="financial-card financial-card--saldo">
      <div class="financial-card__header">
        <h3 class="financial-card__title">Erro ao carregar dados</h3>
      </div>
      <div class="financial-card__value">${t}</div>
    </div>
  `)}const R=`
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
`;function O(t,e){const a=document.querySelector(".details");if(!a)return;let i=e.map(d=>d.orcamento),n=t||[];const o=d=>{const l={};return d.forEach(r=>{!r.conta||r.conta.trim()===""||(l[r.conta]=(l[r.conta]||0)+(r.valor||0))}),Object.entries(l).map(([r,u])=>({conta:r,total:u}))},s=d=>{const l={};return d.forEach(r=>{const u=r.categoria||"Sem categoria";l[u]=(l[u]||0)+(r.valor||0)}),Object.entries(l).map(([r,u])=>({categoria:r,total:u}))},c=d=>{const l=Array.isArray(d)?d:[d];a.innerHTML=R,a.style.display="";const r=a.querySelector("#detail-saldo"),u=a.querySelector("#detail-accounts-cards"),g=a.querySelector("#detail-categories-list"),h=n.filter(m=>l.includes(m.orcamento));if(!h.length){r&&(r.textContent=f(0));return}const w=h.reduce((m,p)=>m+(p.valor||0),0);r&&(r.textContent=f(w)),u&&(u.innerHTML="",o(h).forEach(({conta:m,total:p})=>{const v=document.createElement("div");v.className="details__card",v.innerHTML=`
          <div class="details__card-title">${m}</div>
          <div class="details__card-value">${f(p)}</div>
        `,u.appendChild(v)})),g&&(g.innerHTML="",s(h).filter(m=>m.total<0).sort((m,p)=>m.total-p.total).slice(0,10).forEach((m,p)=>{const v=document.createElement("tr");v.innerHTML=`
            <td>${p+1}</td>
            <td>${m.categoria}</td>
            <td>${f(m.total)}</td>
          `,g.appendChild(v)}))};i.length>0&&c(i),document.addEventListener("detail:show",d=>{const r=d.detail.orcamento;i.includes(r)?i=i.filter(u=>u!==r):i.push(r),c(i)}),document.addEventListener("cards:updated",d=>{const l=d,{allEntries:r}=l.detail||{};r&&(n=r,c(i))})}function V(t=[],e="orcamento",a=-5,i=35){const{startSerial:n,endSerial:o}=$(a,i);return t.filter(s=>{const c=s&&s[e];return typeof c=="number"&&!Number.isNaN(c)&&c>=n&&c<=o})}function S(t=[],e="orcamento"){const a=new Map;return t.forEach(n=>{let o=n&&n[e],s=Number(o);if(!Number.isFinite(s)&&typeof o=="string"&&o.includes("/")){const l=o.split("/");if(l.length===3){const[r,u,g]=l.map(h=>Number(h));[r,u,g].every(Number.isFinite)&&(s=y(new Date(g,u-1,r)))}else if(l.length===2){const[r,u]=l.map(g=>Number(g));[r,u].every(Number.isFinite)&&(s=y(new Date(u,r-1,1)))}}if(!Number.isFinite(s))return;const c=Number(n.valor)||0,d=a.get(s)||{orcamento:s,sum:0,count:0,incomes:0,expenses:0};d.sum+=c,d.count+=1,c>=0?d.incomes+=c:d.expenses+=c,a.set(s,d)}),Array.from(a.values()).map(n=>({orcamento:n.orcamento,label:I(n.orcamento),count:n.count,sum:Number(n.sum.toFixed(2)),incomes:Number(n.incomes.toFixed(2)),expenses:Number(n.expenses.toFixed(2))})).sort((n,o)=>o.orcamento-n.orcamento)}function x(t=[],e="orcamento"){const a=n=>{let o=Number(n);if(Number.isFinite(o))return o;if(typeof n=="string"&&n.includes("/")){const s=n.split("/");if(s.length===3){const[c,d,l]=s.map(r=>Number(r));if([c,d,l].every(Number.isFinite))return y(new Date(l,d-1,c))}else if(s.length===2){const[c,d]=s.map(l=>Number(l));if([c,d].every(Number.isFinite))return y(new Date(d,c-1,1))}}return null},i=new Map;return t.forEach(n=>{const o=n&&n[e],s=a(o);s===null||!Number.isFinite(s)||i.has(s)||i.set(s,{orcamento:s,label:I(s)})}),Array.from(i.values()).sort((n,o)=>n.orcamento-o.orcamento)}async function N(){B(),D(),await T(()=>{console.log("✅ Lançamento adicionado! Recarregue a página para ver as mudanças."),window.location.reload()});const t=document.getElementById("openEntryModal");if(t==null||t.addEventListener("click",()=>{const a=document.getElementById("entryModal");(a==null?void 0:a.style.display)==="flex"?q():k()}),!_.authStore.isValid){console.log("⚠️ Usuário não autenticado");return}if(!(await j()).isValid){P();return}await G(),console.log("✅ Dashboard inicializado")}async function j(){try{const e=await(await fetch(`${M.configStatus}`,{method:"GET",headers:{Authorization:`Bearer ${_.authStore.token}`}})).json();return{isValid:e.hasRefreshToken&&e.hasSheetId}}catch(t){return console.error("Erro ao verificar configuração:",t),{isValid:!1}}}function P(){const t=document.getElementById("configBtn");t&&(t.style.display="");const e=document.getElementById("summaryCards");e&&(e.style.display="none");const a=document.querySelector(".dashboard__col--right.details");a&&(a.style.display="none");const i=document.getElementById("openEntryModal");i&&(i.style.display="none");const n=document.querySelector(".dashboard__header");if(n&&!document.getElementById("configMessage")){const o=document.createElement("p");o.id="configMessage",o.style.marginTop="1rem",o.textContent='Integração com Google não configurada. Clique em "Configurar Integração" para continuar.',n.appendChild(o)}}async function G(){try{const e=await(await fetch(`${M.getSheetEntries}?limit=0`,{method:"GET",headers:{"Content-Type":"application/json",Authorization:`Bearer ${_.authStore.token}`}})).json(),a=(e==null?void 0:e.entries)??[];if(!a||a.length===0){U();return}window.allEntries=a;const i=S(a);window.allBudgets=x(a);const n=V(a),o=S(n),s=x(n);window.filteredEntries=n,window.summaryByBudget=o,window.budgetsInInterval=s;const c={};o.forEach(d=>{c[d.label]=!0}),F(i,c),O(a,s)}catch(t){console.error("Erro ao carregar dados:",t),z("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.")}}function U(){const t=document.getElementById("summaryCards");t&&(t.style.display="none");const e=document.querySelector(".dashboard__col--right.details");e&&(e.style.display="none");const a=document.getElementById("openEntryModal");a&&(a.style.display="");const i=document.querySelector(".dashboard__header");if(i&&!document.getElementById("firstEntryMessage")){const n=document.createElement("div");n.id="firstEntryMessage",n.style.marginTop="1rem",n.className="notice",n.textContent='Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.',i.appendChild(n)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",N):N();
