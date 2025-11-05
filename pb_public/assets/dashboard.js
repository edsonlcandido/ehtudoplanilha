import{p as _,A as N}from"./auth.js";/* empty css          */import{t as y,e as x,g as B,i as T,a as $,b as q,c as F,o as k,d as A,f as H}from"./date-helpers.js";import{r as D}from"./user-menu.js";function f(a){return Number(a).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}let E=[],C={};function R(a,e){const s=document.getElementById("summaryCards");if(!s)return;E=a||[],C=e||{};const r=E.slice().sort((n,c)=>c.orcamento-n.orcamento);s.className="financial-cards",s.innerHTML="",r.forEach(n=>{C[n.label]===!0?s.appendChild(z(n)):s.appendChild(V(n))}),s.querySelectorAll(".financial-card--inactive").forEach(n=>{const c=n;c.style.cursor="pointer",c.addEventListener("click",b)}),s.querySelectorAll(".financial-card__close").forEach(n=>{n.addEventListener("click",L)})}function z(a){const e=document.createElement("div"),s=a.sum>=0?"financial-card--incomes":"financial-card--expenses";return e.className=`financial-card ${s}`,e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
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
  `,e}function V(a){const e=document.createElement("div");return e.className="financial-card financial-card--inactive",e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <div class="financial-card__title">${a.label}</div>
    <div class="financial-card__value">...</div>
  `,e}function b(){const a=this.dataset.budget,e=parseFloat(this.dataset.sum),s=parseFloat(this.dataset.incomes),r=parseFloat(this.dataset.expenses),t=Number(this.dataset.orcamento);this.classList.remove("financial-card--inactive");const o=e>=0?"financial-card--incomes":"financial-card--expenses";this.classList.add(o),this.style.cursor="default",this.innerHTML=`
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
      <div class="financial-card__detail">Despesas: ${f(r)}</div>
    </div>
  `,this.removeEventListener("click",b);const n=this.querySelector(".financial-card__toggle");n&&n.addEventListener("click",function(d){d.stopPropagation();const i=this.closest(".financial-card").classList.toggle("financial-card__details--hidden");this.setAttribute("aria-expanded",String(!i)),this.textContent=i?"Mostrar detalhes":"Ocultar detalhes"});const c=this.querySelector(".financial-card__close");c&&c.addEventListener("click",L),document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:t}}))}function L(a){a.stopPropagation();const e=this.closest(".financial-card"),s=e.dataset.budget,r=e.dataset.sum,t=e.dataset.incomes,o=e.dataset.expenses,n=e.dataset.orcamento;e.className="financial-card financial-card--inactive",e.style.cursor="pointer",e.innerHTML=`
    <div class="financial-card__title">${s}</div>
    <div class="financial-card__value">...</div>
  `,e.dataset.budget=s,e.dataset.sum=r,e.dataset.incomes=t,e.dataset.expenses=o,e.dataset.orcamento=n;const c=e.cloneNode(!0);e.replaceWith(c);const d=document.querySelector(`.financial-card--inactive[data-budget="${s}"]`);d&&(d.style.cursor="pointer",d.addEventListener("click",b));const l=Number(n);document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:l}}))}function j(){const a=document.getElementById("summaryCards");a==null||a.addEventListener("click",e=>{const r=e.target.closest(".financial-card__toggle");if(!r)return;const o=r.closest(".financial-card").querySelector(".financial-card__details"),n=o==null?void 0:o.classList.toggle("financial-card__details--hidden");r.setAttribute("aria-expanded",String(!n)),r.textContent=n?"Mostrar detalhes":"Ocultar detalhes"})}function O(a="Verifique sua conexão e tente novamente"){const e=document.getElementById("summaryCards");e&&(e.className="financial-cards",e.innerHTML=`
    <div class="financial-card financial-card--saldo">
      <div class="financial-card__header">
        <h3 class="financial-card__title">Erro ao carregar dados</h3>
      </div>
      <div class="financial-card__value">${a}</div>
    </div>
  `)}const P=`
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
`;function G(a,e){const s=document.querySelector(".details");if(!s)return;let r=e.map(d=>d.orcamento),t=a||[];const o=d=>{const l={};return d.forEach(i=>{!i.conta||i.conta.trim()===""||(l[i.conta]=(l[i.conta]||0)+(i.valor||0))}),Object.entries(l).map(([i,u])=>({conta:i,total:u}))},n=d=>{const l={};return d.forEach(i=>{const u=i.categoria||"Sem categoria";l[u]=(l[u]||0)+(i.valor||0)}),Object.entries(l).map(([i,u])=>({categoria:i,total:u}))},c=d=>{const l=Array.isArray(d)?d:[d];s.innerHTML=P,s.style.display="";const i=s.querySelector("#detail-saldo"),u=s.querySelector("#detail-accounts-cards"),g=s.querySelector("#detail-categories-list"),h=t.filter(m=>l.includes(m.orcamento));if(!h.length){i&&(i.textContent=f(0));return}const I=h.reduce((m,p)=>m+(p.valor||0),0);i&&(i.textContent=f(I)),u&&(u.innerHTML="",o(h).forEach(({conta:m,total:p})=>{const v=document.createElement("div");v.className="details__card",v.innerHTML=`
          <div class="details__card-title">${m}</div>
          <div class="details__card-value">${f(p)}</div>
        `,u.appendChild(v)})),g&&(g.innerHTML="",n(h).filter(m=>m.total<0).sort((m,p)=>m.total-p.total).slice(0,10).forEach((m,p)=>{const v=document.createElement("tr");v.innerHTML=`
            <td>${p+1}</td>
            <td>${m.categoria}</td>
            <td>${f(m.total)}</td>
          `,g.appendChild(v)}))};r.length>0&&c(r),document.addEventListener("detail:show",d=>{const i=d.detail.orcamento;r.includes(i)?r=r.filter(u=>u!==i):r.push(i),c(r)}),document.addEventListener("cards:updated",d=>{const l=d,{allEntries:i}=l.detail||{};i&&(t=i,c(r))})}function U(a=[],e="orcamento",s=-5,r=35){const{startSerial:t,endSerial:o}=B(s,r);return a.filter(n=>{const c=n&&n[e];return typeof c=="number"&&!Number.isNaN(c)&&c>=t&&c<=o})}function S(a=[],e="orcamento"){const s=new Map;return a.forEach(t=>{let o=t&&t[e],n=Number(o);if(!Number.isFinite(n)&&typeof o=="string"&&o.includes("/")){const l=o.split("/");if(l.length===3){const[i,u,g]=l.map(h=>Number(h));[i,u,g].every(Number.isFinite)&&(n=y(new Date(g,u-1,i)))}else if(l.length===2){const[i,u]=l.map(g=>Number(g));[i,u].every(Number.isFinite)&&(n=y(new Date(u,i-1,1)))}}if(!Number.isFinite(n))return;const c=Number(t.valor)||0,d=s.get(n)||{orcamento:n,sum:0,count:0,incomes:0,expenses:0};d.sum+=c,d.count+=1,c>=0?d.incomes+=c:d.expenses+=c,s.set(n,d)}),Array.from(s.values()).map(t=>({orcamento:t.orcamento,label:x(t.orcamento),count:t.count,sum:Number(t.sum.toFixed(2)),incomes:Number(t.incomes.toFixed(2)),expenses:Number(t.expenses.toFixed(2))})).sort((t,o)=>o.orcamento-t.orcamento)}function w(a=[],e="orcamento"){const s=t=>{let o=Number(t);if(Number.isFinite(o))return o;if(typeof t=="string"&&t.includes("/")){const n=t.split("/");if(n.length===3){const[c,d,l]=n.map(i=>Number(i));if([c,d,l].every(Number.isFinite))return y(new Date(l,d-1,c))}else if(n.length===2){const[c,d]=n.map(l=>Number(l));if([c,d].every(Number.isFinite))return y(new Date(d,c-1,1))}}return null},r=new Map;return a.forEach(t=>{const o=t&&t[e],n=s(o);n===null||!Number.isFinite(n)||r.has(n)||r.set(n,{orcamento:n,label:x(n)})}),Array.from(r.values()).sort((t,o)=>t.orcamento-o.orcamento)}async function M(){if(D(),j(),await T(()=>{console.log("✅ Lançamento adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await $(()=>{console.log("✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await q(()=>{console.log("✅ Transferência realizada! Recarregue a página para ver as mudanças."),window.location.reload()}),F(()=>H(),()=>A(),()=>k()),!_.authStore.isValid){console.log("⚠️ Usuário não autenticado");return}if(!(await W()).isValid){J();return}await K(),console.log("✅ Dashboard inicializado")}async function W(){try{const e=await(await fetch(`${N.configStatus}`,{method:"GET",headers:{Authorization:`Bearer ${_.authStore.token}`}})).json();return{isValid:e.hasRefreshToken&&e.hasSheetId}}catch(a){return console.error("Erro ao verificar configuração:",a),{isValid:!1}}}function J(){const a=document.getElementById("configBtn");a&&(a.style.display="");const e=document.getElementById("summaryCards");e&&(e.style.display="none");const s=document.querySelector(".dashboard__col--right.details");s&&(s.style.display="none");const r=document.getElementById("openEntryModal");r&&(r.style.display="none");const t=document.querySelector(".dashboard__header");if(t&&!document.getElementById("configMessage")){const o=document.createElement("p");o.id="configMessage",o.style.marginTop="1rem",o.textContent='Integração com Google não configurada. Clique em "Configurar Integração" para continuar.',t.appendChild(o)}}async function K(){try{const e=await(await fetch(`${N.getSheetEntries}?limit=0`,{method:"GET",headers:{"Content-Type":"application/json",Authorization:`Bearer ${_.authStore.token}`}})).json(),s=(e==null?void 0:e.entries)??[];if(!s||s.length===0){Q();return}window.allEntries=s;const r=S(s);window.allBudgets=w(s);const t=U(s),o=S(t),n=w(t);window.filteredEntries=t,window.summaryByBudget=o,window.budgetsInInterval=n;const c={};o.forEach(d=>{c[d.label]=!0}),R(r,c),G(s,n)}catch(a){console.error("Erro ao carregar dados:",a),O("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.")}}function Q(){const a=document.getElementById("summaryCards");a&&(a.style.display="none");const e=document.querySelector(".dashboard__col--right.details");e&&(e.style.display="none");const s=document.getElementById("openEntryModal");s&&(s.style.display="");const r=document.querySelector(".dashboard__header");if(r&&!document.getElementById("firstEntryMessage")){const t=document.createElement("div");t.id="firstEntryMessage",t.style.marginTop="1rem",t.className="notice",t.textContent='Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.',r.appendChild(t)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",M):M();
