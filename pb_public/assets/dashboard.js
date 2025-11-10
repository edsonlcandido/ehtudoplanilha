import{v as k,p as I,A as F}from"./auth.js";import"./sheets.js";import{e as N,t as S,a as q,g as A,i as D,b as H,c as R,d as z,l as V,o as O,f as P,h as j}from"./fab-menu.js";import{r as G}from"./user-menu.js";function E(a){return Number(a).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}let T=[],w={};function U(a,e){const r=document.getElementById("summaryCards");if(!r)return;T=a||[],w=e||{};const s=T.slice().sort((t,o)=>o.orcamento-t.orcamento);r.className="financial-cards",r.innerHTML="",s.forEach(t=>{w[t.label]===!0?r.appendChild(W(t)):r.appendChild(J(t))}),r.querySelectorAll(".financial-card--inactive").forEach(t=>{const o=t;o.style.cursor="pointer",o.addEventListener("click",L)}),r.querySelectorAll(".financial-card__close").forEach(t=>{t.addEventListener("click",$)})}function W(a){const e=document.createElement("div"),r=a.sum>=0?"financial-card--incomes":"financial-card--expenses";return e.className=`financial-card ${r}`,e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
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
  `,e}function J(a){const e=document.createElement("div");return e.className="financial-card financial-card--inactive",e.dataset.budget=a.label,e.dataset.sum=String(a.sum),e.dataset.incomes=String(a.incomes),e.dataset.expenses=String(a.expenses),e.dataset.orcamento=String(a.orcamento),e.innerHTML=`
    <div class="financial-card__title">${a.label}</div>
    <div class="financial-card__value">...</div>
  `,e}function L(){const a=this.dataset.budget,e=parseFloat(this.dataset.sum),r=parseFloat(this.dataset.incomes),s=parseFloat(this.dataset.expenses),n=Number(this.dataset.orcamento);this.classList.remove("financial-card--inactive");const c=e>=0?"financial-card--incomes":"financial-card--expenses";this.classList.add(c),this.style.cursor="default",this.innerHTML=`
    <button class="financial-card__close" aria-label="Fechar cartão" data-budget="${a}">✕</button>
    <div class="financial-card__header">
      <h3 class="financial-card__title">${a}</h3>
    </div>
    <div class="financial-card__value">${E(e)}</div>

    <div class="financial-card__actions">
      <button class="financial-card__toggle button pseudo" aria-expanded="false">Mostrar detalhes</button>
    </div>

    <div class="financial-card__details financial-card__details--hidden">
      <div class="financial-card__detail">Receitas: ${E(r)}</div>
      <div class="financial-card__detail">Despesas: ${E(s)}</div>
    </div>
  `,this.removeEventListener("click",L);const t=this.querySelector(".financial-card__toggle");t&&t.addEventListener("click",function(v){v.stopPropagation();const d=this.closest(".financial-card").classList.toggle("financial-card__details--hidden");this.setAttribute("aria-expanded",String(!d)),this.textContent=d?"Mostrar detalhes":"Ocultar detalhes"});const o=this.querySelector(".financial-card__close");o&&o.addEventListener("click",$),document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:n}}))}function $(a){a.stopPropagation();const e=this.closest(".financial-card"),r=e.dataset.budget,s=e.dataset.sum,n=e.dataset.incomes,c=e.dataset.expenses,t=e.dataset.orcamento;e.className="financial-card financial-card--inactive",e.style.cursor="pointer",e.innerHTML=`
    <div class="financial-card__title">${r}</div>
    <div class="financial-card__value">...</div>
  `,e.dataset.budget=r,e.dataset.sum=s,e.dataset.incomes=n,e.dataset.expenses=c,e.dataset.orcamento=t;const o=e.cloneNode(!0);e.replaceWith(o);const v=document.querySelector(`.financial-card--inactive[data-budget="${r}"]`);v&&(v.style.cursor="pointer",v.addEventListener("click",L));const p=Number(t);document.dispatchEvent(new CustomEvent("detail:show",{detail:{orcamento:p}}))}function K(){const a=document.getElementById("summaryCards");a==null||a.addEventListener("click",e=>{const s=e.target.closest(".financial-card__toggle");if(!s)return;const c=s.closest(".financial-card").querySelector(".financial-card__details"),t=c==null?void 0:c.classList.toggle("financial-card__details--hidden");s.setAttribute("aria-expanded",String(!t)),s.textContent=t?"Mostrar detalhes":"Ocultar detalhes"})}function Q(a="Verifique sua conexão e tente novamente"){const e=document.getElementById("summaryCards");e&&(e.className="financial-cards",e.innerHTML=`
    <div class="financial-card financial-card--saldo">
      <div class="financial-card__header">
        <h3 class="financial-card__title">Erro ao carregar dados</h3>
      </div>
      <div class="financial-card__value">${a}</div>
    </div>
  `)}const X=`
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
`;function Y(a,e){const r=document.querySelector(".details");if(!r)return;let s=e.map(d=>d.orcamento),n=a||[];const c=d=>{const f={};return d.forEach(i=>{!i.conta||i.conta.trim()===""||(f[i.conta]=(f[i.conta]||0)+(i.valor||0))}),Object.entries(f).map(([i,y])=>({conta:i,total:y}))},t=d=>{const f={};return d.forEach(i=>{const y=i.categoria||"Sem categoria";f[y]=(f[y]||0)+(i.valor||0)}),Object.entries(f).map(([i,y])=>({categoria:i,total:y}))},o=(d,f)=>{const i=r.querySelector("#detail-entries"),y=r.querySelector("#detail-entries-title"),_=r.querySelector("#entries-list");if(!i||!_||!y)return;y.textContent=`Lançamentos da Categoria: ${d}`;const h=n.filter(l=>f.includes(l.orcamento)&&(l.categoria||"Sem categoria")===d&&l.valor<0);if(h.sort((l,g)=>{if(!l.data&&!g.data)return 0;if(!l.data)return 1;if(!g.data)return-1;const u=new Date(l.data).getTime(),m=new Date(g.data).getTime();return isNaN(u)&&isNaN(m)?0:isNaN(u)?1:isNaN(m)?-1:m-u}),i.classList.remove("details__category-entries--hidden"),_.innerHTML="",h.length===0){_.innerHTML='<p class="category-entries-empty">Nenhum lançamento encontrado nesta categoria.</p>';return}h.forEach(l=>{const g=document.createElement("div");g.className="category-entry-card";let u="--";if(l.data&&typeof l.data=="number"&&l.data>0){const m=N(l.data,!0);m&&(u=m.toLocaleDateString("pt-BR")+" "+m.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}))}g.innerHTML=`
        <div class="category-entry-card__date">${u}</div>
        <div class="category-entry-card__description">${l.descricao||"Sem descrição"}</div>
        <div class="category-entry-card__value">${E(l.valor||0)}</div>
      `,_.appendChild(g)})},v=(d,f)=>{const i=r.querySelector("#detail-entries"),y=r.querySelector("#detail-entries-title"),_=r.querySelector("#entries-list");if(!i||!_||!y)return;y.textContent=`Lançamentos da Conta: ${d}`;const h=n.filter(l=>f.includes(l.orcamento)&&l.conta===d);if(h.sort((l,g)=>{if(!l.data&&!g.data)return 0;if(!l.data)return 1;if(!g.data)return-1;const u=new Date(l.data).getTime(),m=new Date(g.data).getTime();return isNaN(u)&&isNaN(m)?0:isNaN(u)?1:isNaN(m)?-1:m-u}),i.classList.remove("details__category-entries--hidden"),_.innerHTML="",h.length===0){_.innerHTML='<p class="category-entries-empty">Nenhum lançamento encontrado nesta conta.</p>';return}h.forEach(l=>{const g=document.createElement("div");g.className="category-entry-card";let u="--";if(l.data&&typeof l.data=="number"&&l.data>0){const m=N(l.data,!0);m&&(u=m.toLocaleDateString("pt-BR")+" "+m.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}))}g.innerHTML=`
        <div class="category-entry-card__date">${u}</div>
        <div class="category-entry-card__description">${l.descricao||"Sem descrição"}</div>
        <div class="category-entry-card__value">${E(l.valor||0)}</div>
      `,_.appendChild(g)})},p=d=>{const f=Array.isArray(d)?d:[d];r.innerHTML=X,r.style.display="";const i=r.querySelector("#detail-saldo"),y=r.querySelector("#detail-accounts-cards"),_=r.querySelector("#detail-categories-cards"),h=n.filter(g=>f.includes(g.orcamento));if(!h.length){i&&(i.textContent=E(0));return}const l=h.reduce((g,u)=>g+(u.valor||0),0);i&&(i.textContent=E(l)),y&&(y.innerHTML="",c(h).forEach(({conta:g,total:u})=>{const m=document.createElement("div");m.className="details__card details__card--clickable",m.dataset.conta=g,m.innerHTML=`
          <div class="details__card-title">${g}</div>
          <div class="details__card-value">${E(u)}</div>
        `,m.addEventListener("click",()=>{y.querySelectorAll(".details__card").forEach(C=>{C.classList.remove("details__card--selected")});const b=r.querySelector("#detail-categories-cards");b&&b.querySelectorAll(".category-card").forEach(C=>{C.classList.remove("category-card--selected")}),m.classList.add("details__card--selected"),v(g,f)}),y.appendChild(m)})),_&&(_.innerHTML="",t(h).filter(u=>u.total<0).sort((u,m)=>u.total-m.total).slice(0,10).forEach((u,m)=>{const b=document.createElement("div");b.className="category-card",b.dataset.categoria=u.categoria,b.innerHTML=`
          <div class="category-card__rank">#${m+1}</div>
          <div class="category-card__content">
            <div class="category-card__name">${u.categoria}</div>
            <div class="category-card__value">${E(u.total)}</div>
          </div>
        `,b.addEventListener("click",()=>{_.querySelectorAll(".category-card").forEach(C=>{C.classList.remove("category-card--selected")}),y&&y.querySelectorAll(".details__card").forEach(C=>{C.classList.remove("details__card--selected")}),b.classList.add("category-card--selected"),o(u.categoria,f)}),_.appendChild(b)}))};s.length>0&&p(s),document.addEventListener("detail:show",d=>{const i=d.detail.orcamento;s.includes(i)?s=s.filter(y=>y!==i):s.push(i),p(s)}),document.addEventListener("cards:updated",d=>{const f=d,{allEntries:i}=f.detail||{};i&&(n=i,p(s))})}function Z(a=[],e="orcamento",r=-5,s=35){const{startSerial:n,endSerial:c}=A(r,s);return a.filter(t=>{const o=t&&t[e];return typeof o=="number"&&!Number.isNaN(o)&&o>=n&&o<=c})}function M(a=[],e="orcamento"){const r=new Map;return a.forEach(n=>{let c=n&&n[e],t=Number(c);if(!Number.isFinite(t)&&typeof c=="string"&&c.includes("/")){const p=c.split("/");if(p.length===3){const[d,f,i]=p.map(y=>Number(y));[d,f,i].every(Number.isFinite)&&(t=S(new Date(i,f-1,d)))}else if(p.length===2){const[d,f]=p.map(i=>Number(i));[d,f].every(Number.isFinite)&&(t=S(new Date(f,d-1,1)))}}if(!Number.isFinite(t))return;const o=Number(n.valor)||0,v=r.get(t)||{orcamento:t,sum:0,count:0,incomes:0,expenses:0};v.sum+=o,v.count+=1,o>=0?v.incomes+=o:v.expenses+=o,r.set(t,v)}),Array.from(r.values()).map(n=>({orcamento:n.orcamento,label:q(n.orcamento),count:n.count,sum:Number(n.sum.toFixed(2)),incomes:Number(n.incomes.toFixed(2)),expenses:Number(n.expenses.toFixed(2))})).sort((n,c)=>c.orcamento-n.orcamento)}function x(a=[],e="orcamento"){const r=n=>{let c=Number(n);if(Number.isFinite(c))return c;if(typeof n=="string"&&n.includes("/")){const t=n.split("/");if(t.length===3){const[o,v,p]=t.map(d=>Number(d));if([o,v,p].every(Number.isFinite))return S(new Date(p,v-1,o))}else if(t.length===2){const[o,v]=t.map(p=>Number(p));if([o,v].every(Number.isFinite))return S(new Date(v,o-1,1))}}return null},s=new Map;return a.forEach(n=>{const c=n&&n[e],t=r(c);t===null||!Number.isFinite(t)||s.has(t)||s.set(t,{orcamento:t,label:q(t)})}),Array.from(s.values()).sort((n,c)=>n.orcamento-c.orcamento)}async function B(){if(!await k()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}if(G(),K(),await D(()=>{console.log("✅ Lançamento adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await H(()=>{console.log("✅ Lançamento futuro adicionado! Recarregue a página para ver as mudanças."),window.location.reload()}),await R(()=>{console.log("✅ Transferência realizada! Recarregue a página para ver as mudanças."),window.location.reload()}),z(()=>j(),()=>P(),()=>O()),!I.authStore.isValid){console.log("⚠️ Usuário não autenticado");return}if(!(await ee()).isValid){ae();return}await te(),console.log("✅ Dashboard inicializado")}async function ee(){try{const e=await(await fetch(`${F.configStatus}`,{method:"GET",headers:{Authorization:`Bearer ${I.authStore.token}`}})).json();return{isValid:e.hasRefreshToken&&e.hasSheetId}}catch(a){return console.error("Erro ao verificar configuração:",a),{isValid:!1}}}function ae(){const a=document.getElementById("configBtn");a&&(a.style.display="");const e=document.getElementById("summaryCards");e&&(e.style.display="none");const r=document.querySelector(".dashboard__col--right.details");r&&(r.style.display="none");const s=document.getElementById("openEntryModal");s&&(s.style.display="none");const n=document.querySelector(".dashboard__header");if(n&&!document.getElementById("configMessage")){const c=document.createElement("p");c.id="configMessage",c.style.marginTop="1rem",c.textContent='Integração com Google não configurada. Clique em "Configurar Integração" para continuar.',n.appendChild(c);const t=document.createElement("a");t.href="/dashboard/configuracao.html",t.className="button primary",t.style.marginTop="1rem",t.style.display="inline-block",t.textContent="⚙️ Configurar Integração",n.appendChild(t)}}async function te(){try{const a=await V.fetchEntries(0,!1),e=(a==null?void 0:a.entries)??[];if(!e||e.length===0){ne();return}window.allEntries=e;const r=M(e);window.allBudgets=x(e);const s=Z(e),n=M(s),c=x(s);window.filteredEntries=s,window.summaryByBudget=n,window.budgetsInInterval=c;const t={};n.forEach(o=>{t[o.label]=!0}),U(r,t),Y(e,c)}catch(a){console.error("Erro ao carregar dados:",a),Q("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.")}}function ne(){const a=document.getElementById("summaryCards");a&&(a.style.display="none");const e=document.querySelector(".dashboard__col--right.details");e&&(e.style.display="none");const r=document.getElementById("openEntryModal");r&&(r.style.display="");const s=document.querySelector(".dashboard__header");if(s&&!document.getElementById("firstEntryMessage")){const n=document.createElement("div");n.id="firstEntryMessage",n.style.marginTop="1rem",n.className="notice",n.textContent='Você ainda não tem lançamentos. Insira o primeiro lançamento — ex. "Saldo inicial Banco Laranjinha" ou "Fatura cartão roxinho atual". Após inserir recarregue a página.',s.appendChild(n)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",B):B();
