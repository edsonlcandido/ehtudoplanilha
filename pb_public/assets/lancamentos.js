const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/sheets.js","assets/auth.js"])))=>i.map(i=>d[i]);
var H=Object.defineProperty;var R=(n,e,t)=>e in n?H(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var g=(n,e,t)=>R(n,typeof e!="symbol"?e+"":e,t);import{v as j}from"./auth.js";/* empty css     */import{s as z,a as U,b as K}from"./toast.js";import{r as J}from"./user-menu.js";import{a as b,j as M,k as Y,m as W,l as E,n as A,e as G,p as Q,i as X,b as Z,c as ee,d as te,o as ne,f as ae,h as D}from"./fab-menu.js";import"./sheets.js";const oe="modulepreload",se=function(n){return"/"+n},x={},ie=function(e,t,a){let o=Promise.resolve();if(t&&t.length>0){let l=function(d){return Promise.all(d.map(c=>Promise.resolve(c).then(u=>({status:"fulfilled",value:u}),u=>({status:"rejected",reason:u}))))};document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),m=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));o=l(t.map(d=>{if(d=se(d),d in x)return;x[d]=!0;const c=d.endsWith(".css"),u=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${u}`))return;const p=document.createElement("link");if(p.rel=c?"stylesheet":oe,c||(p.as="script"),p.crossOrigin="",p.href=d,m&&p.setAttribute("nonce",m),document.head.appendChild(p),c)return new Promise((f,B)=>{p.addEventListener("load",f),p.addEventListener("error",()=>B(new Error(`Unable to preload CSS for ${d}`)))})}))}function i(l){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=l,window.dispatchEvent(r),!r.defaultPrevented)throw l}return o.then(l=>{for(const r of l||[])r.status==="rejected"&&i(r.reason);return e().catch(i)})};let y=null;class re{constructor(){g(this,"modal",null);g(this,"form",null);g(this,"callback");g(this,"currentEntry",null);g(this,"accounts",[]);g(this,"categories",[]);g(this,"categoriesComplete",[]);g(this,"descriptions",[]);g(this,"entries",[])}getTemplate(){return`
      <div id="editEntryModal" class="entry-modal" aria-hidden="true" style="display: none;">
        <div class="entry-modal__content">
          <button id="closeEditEntryModal" class="entry-modal__close" aria-label="Fechar modal">×</button>
          <h3 class="entry-modal__title">Editar Lançamento</h3>
          <form id="editEntryForm" class="entry-modal__form">
            <fieldset>
              <div class="form-group">
                <label for="editEntryDate">Data:</label>
                <input type="datetime-local" id="editEntryDate" name="data" class="form-control">
              </div>
              
              <div class="form-group">
                <label for="editEntryAccount">Conta:</label>
                <input type="text" id="editEntryAccount" name="conta" class="form-control" placeholder="Ex: Conta Corrente" autocomplete="off">
              </div>
              
              <div class="form-group valor-toggle-group">
                <label for="editEntryValue">Valor:</label>
                <div class="valor-toggle-container">
                  <button type="button" id="editEntrySignBtn" class="button outline entry-toggle entry-toggle--expense" aria-label="Alternar sinal">−</button>
                  <input type="number" id="editEntryValue" name="valor" class="form-control" step="0.01" min="0" placeholder="0,00" required>
                  <input type="hidden" id="editEntrySignValue" name="sinal" value="−">
                </div>
              </div>
              
              <div class="form-group">
                <label for="editEntryDescription">Descrição:</label>
                <input type="text" id="editEntryDescription" name="descricao" class="form-control" placeholder="Descrição da despesa" autocomplete="off" required>
              </div>
              
              <div class="form-group">
                <label for="editEntryCategory">Categoria:</label>
                <input type="text" id="editEntryCategory" name="categoria" class="form-control" placeholder="Digite uma categoria" autocomplete="off" required>
              </div>
              
              <div class="form-group">
                <label for="editEntryBudget">Orçamento (data-chave):</label>
                <input type="date" id="editEntryBudget" name="orcamento" class="form-control" required>
              </div>
              
              <div class="form-group">
                <label for="editEntryObs">Observações:</label>
                <textarea id="editEntryObs" name="observacoes" rows="3" class="form-control" placeholder="Notas adicionais..."></textarea>
              </div>
              
              <div id="editEntryFeedback" class="modal-feedback" style="display: none;"></div>
              
              <div class="form-actions">
                <button type="button" id="cancelEditEntryBtn" class="button warning">Cancelar</button>
                <button type="submit" id="saveEditEntryBtn" class="button success">Salvar</button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    `}async init(e){if(console.log("[EditEntryModal] Inicializando..."),this.callback=e,document.body.insertAdjacentHTML("beforeend",this.getTemplate()),this.modal=document.getElementById("editEntryModal"),this.form=document.getElementById("editEntryForm"),!this.modal||!this.form)throw new Error("[EditEntryModal] Elementos do modal não encontrados");this.setupEventListeners(),console.log("[EditEntryModal] ✅ Inicializado com sucesso")}setupEventListeners(){var o,i;const e=document.getElementById("closeEditEntryModal");e==null||e.addEventListener("click",()=>this.close());const t=document.getElementById("cancelEditEntryBtn");t==null||t.addEventListener("click",()=>this.close()),(o=this.modal)==null||o.addEventListener("click",l=>{l.target===this.modal&&this.close()}),document.addEventListener("keydown",l=>{var r;l.key==="Escape"&&((r=this.modal)==null?void 0:r.style.display)==="flex"&&this.close()});const a=document.getElementById("editEntrySignBtn");a==null||a.addEventListener("click",()=>this.toggleSign()),(i=this.form)==null||i.addEventListener("submit",l=>this.handleSubmit(l)),this.setupCategoryAutocomplete(),this.setupDescriptionAutocomplete(),this.setupAccountAutocomplete()}setupCategoryAutocomplete(){const e=document.getElementById("editEntryCategory");if(!e)return;let t=this.ensureSuggestionsContainer("editCatSuggestions",e);e.addEventListener("focus",()=>{this.categories.length>0&&this.showAllSuggestions(e,t,this.categories)}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.categories)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}setupDescriptionAutocomplete(){const e=document.getElementById("editEntryDescription");if(!e)return;let t=this.ensureSuggestionsContainer("editDescSuggestions",e);e.addEventListener("focus",()=>{this.descriptions.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.descriptions,o=>{this.autoFillCategoryFromDescription(o)}))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.descriptions,a=>{this.autoFillCategoryFromDescription(a)})}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}autoFillCategoryFromDescription(e){const t=this.entries.find(a=>a.descricao&&a.descricao.trim().toLowerCase()===e.toLowerCase());if(t&&t.categoria){const a=document.getElementById("editEntryCategory");a&&(a.value=t.categoria)}}setupAccountAutocomplete(){const e=document.getElementById("editEntryAccount");if(!e)return;let t=this.ensureSuggestionsContainer("editAccountSuggestions",e);e.addEventListener("focus",()=>{this.accounts.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.accounts))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.accounts)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}ensureSuggestionsContainer(e,t){let a=document.getElementById(e);if(!a){a=document.createElement("div"),a.id=e,a.classList.add("entry-modal__suggestions"),a.setAttribute("role","listbox");const o=t.parentElement;o&&(o.style.position=o.style.position||"relative",o.appendChild(a))}return a}showAllSuggestions(e,t,a,o){if(t.innerHTML="",a.length===0){t.style.display="none";return}a.slice(0,20).forEach(l=>{const r=document.createElement("div");r.setAttribute("role","option"),r.classList.add("entry-modal__suggestion"),r.textContent=l,r.addEventListener("click",()=>{e.value=l,t.style.display="none",e.focus(),o&&o(l)}),t.appendChild(r)}),t.style.display="block"}showSuggestions(e,t,a,o){t.innerHTML="";const i=e.value.trim().toLowerCase();if(!i||i.length<1){this.showAllSuggestions(e,t,a,o);return}if(a.length===0){t.style.display="none";return}const l=a.filter(r=>r.toLowerCase().includes(i));if(l.length===0){t.style.display="none";return}l.forEach(r=>{const m=document.createElement("div");m.setAttribute("role","option"),m.classList.add("entry-modal__suggestion"),m.textContent=r,m.addEventListener("click",()=>{e.value=r,t.style.display="none",e.focus(),o&&o(r)}),t.appendChild(m)}),t.style.display="block"}formatDateTimeLocal(e){const[t,a]=e.split("T"),[o,i,l]=t.split("-");return`${l}/${i}/${o} ${a}`}formatDate(e){const[t,a,o]=e.split("-");return`${o}/${a}/${t}`}toggleSign(){var a;const e=document.getElementById("editEntrySignBtn"),t=((a=e==null?void 0:e.textContent)==null?void 0:a.trim())==="−";this.setSignState(!t)}setSignState(e){const t=document.getElementById("editEntrySignBtn"),a=document.getElementById("editEntrySignValue");!t||!a||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),a.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),a.value="+"))}open(e){var o;if(!this.modal||!e)return;console.log("[EditEntryModal] Abrindo modal para edição:",e),this.currentEntry=e,this.populateForm(e),this.modal.style.display="flex",this.modal.setAttribute("aria-hidden","false");const t=document.getElementById("openEntryModal");t&&(t.style.visibility="hidden",console.log("[EditEntryModal] ✅ Botão FAB oculto"));const a=(o=this.form)==null?void 0:o.querySelector("input");a==null||a.focus()}applySignState(e){const t=document.getElementById("editEntrySignBtn"),a=document.getElementById("editEntrySignValue");!t||!a||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),a.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),a.value="+"))}populateForm(e){const t=document.getElementById("editEntryDate");if(t&&e.data){let d="";if(typeof e.data=="number"){const c=b(e.data,!0);c&&(d=M(c))}else if(typeof e.data=="string"){const c=Y(e.data);c&&(d=M(c))}t.value=d}else t&&(t.value="");const a=document.getElementById("editEntryAccount");a&&(a.value=e.conta||"");const o=document.getElementById("editEntryValue");if(o&&e.valor!==void 0){const d=Math.abs(e.valor);o.value=d.toString(),this.applySignState(e.valor<0)}const i=document.getElementById("editEntryDescription");i&&(i.value=e.descricao||"");const l=document.getElementById("editEntryCategory");l&&(l.value=e.categoria||"");const r=document.getElementById("editEntryBudget");if(r&&e.orcamento){let d="";if(typeof e.orcamento=="number"){const c=b(e.orcamento,!1);c&&(d=c.toISOString().split("T")[0])}else if(typeof e.orcamento=="string"){const c=W(e.orcamento);c&&(d=c.toISOString().split("T")[0])}r.value=d}const m=document.getElementById("editEntryObs");m&&(m.value=e.obs||"")}close(){if(!this.modal)return;this.modal.style.display="none",this.modal.setAttribute("aria-hidden","true"),this.currentEntry=null;const e=document.getElementById("openEntryModal");e&&(e.style.visibility="visible",console.log("[EditEntryModal] ✅ Botão FAB visível")),this.form&&this.form.reset(),this.clearFeedback()}isOpen(){var e;return((e=this.modal)==null?void 0:e.style.display)==="flex"}async handleSubmit(e){if(e.preventDefault(),!this.form||!this.currentEntry||!this.currentEntry.rowIndex){console.error("[EditEntryModal] Dados insuficientes para edição");return}const t=new FormData(this.form),a=document.getElementById("saveEditEntryBtn");a&&(a.disabled=!0,a.textContent="Salvando...");try{const o=t.get("data"),i=t.get("orcamento"),l=parseFloat(t.get("valor")),r=t.get("sinal"),m=new Date(i);if(isNaN(m.getTime()))throw new Error("Data de orçamento inválida");let d="";if(o&&o.trim()!==""){if(!o.includes("T"))throw new Error("Formato de data/hora inválido");const f=new Date(o);if(isNaN(f.getTime()))throw new Error("Data inválida");d=this.formatDateTimeLocal(o)}const c=r==="−"||r==="-"?-Math.abs(l):Math.abs(l),u=this.formatDate(i),p={data:d,conta:t.get("conta"),valor:c,descricao:t.get("descricao"),categoria:t.get("categoria"),orcamento:u,obs:t.get("observacoes")||""};console.log("[EditEntryModal] 📤 Enviando edição:",p),await E.editEntry(this.currentEntry.rowIndex,p),this.showFeedback("✅ Lançamento editado com sucesso!","success"),setTimeout(()=>{var B;this.close();const f=new CustomEvent("entry:edited",{detail:{rowIndex:(B=this.currentEntry)==null?void 0:B.rowIndex,entry:p}});document.dispatchEvent(f),this.callback&&this.callback({success:!0,entry:p})},500)}catch(o){console.error("[EditEntryModal] ❌ Erro ao editar:",o),this.showFeedback(`❌ Erro: ${o instanceof Error?o.message:"Erro desconhecido"}`,"error")}finally{a&&(a.disabled=!1,a.textContent="Salvar")}}showFeedback(e,t){const a=document.getElementById("editEntryFeedback");a&&(a.textContent=e,a.className=`modal-feedback modal-feedback--${t}`,a.style.display="block",(t==="success"||t==="error")&&setTimeout(()=>{this.clearFeedback()},5e3))}clearFeedback(){const e=document.getElementById("editEntryFeedback");e&&(e.className="modal-feedback",e.textContent="",e.style.display="none")}async setEntries(e){this.entries=e,this.accounts=E.getUniqueAccounts(e),this.descriptions=E.getUniqueDescriptions(e);const t=E.getUniqueCategories(e);try{const{SheetsService:a}=await ie(async()=>{const{SheetsService:o}=await import("./sheets.js");return{SheetsService:o}},__vite__mapDeps([0,1]));this.categoriesComplete=await a.getSheetCategoriesComplete(),this.categoriesComplete.length>0?(this.categories=this.categoriesComplete.map(o=>o.categoria),console.log("[EditEntryModal] Categorias completas carregadas:",this.categoriesComplete.length)):(this.categories=t,console.log("[EditEntryModal] Usando categorias dos entries:",this.categories.length))}catch(a){console.warn("[EditEntryModal] Erro ao carregar categorias completas, usando entries:",a),this.categories=t}}}async function le(n){if(y)return console.log("[EditEntryModal] Reutilizando instância existente"),y;try{return y=new re,await y.init(n),y}catch(e){return console.error("[EditEntryModal] Erro ao inicializar:",e),null}}function ce(n){y?y.open(n):console.error("[EditEntryModal] Modal não inicializado")}function de(n){y&&y.setEntries(n)}function O(n){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n)}function N(n){return n?typeof n=="number"?A(n):String(n):"-"}function P(n){return n?typeof n=="number"?G(n):String(n):"-"}function V(n){return`
    <button class="button small" onclick="window.editEntry(${n.rowIndex})" title="Editar">
      ✏️
    </button>
    <button class="button small" onclick="window.copyEntry(${n.rowIndex})" title="Copiar">
      📑
    </button>
    <button class="button small danger" onclick="window.deleteEntry(${n.rowIndex})" title="Excluir">
      🗑️
    </button>
  `}function ue(n){return n.length===0?`
      <div class="lancamentos__empty">
        <div class="lancamentos__empty-icon">📋</div>
        <p class="lancamentos__empty-text">Nenhum lançamento encontrado</p>
        <p>Adicione seu primeiro lançamento usando o botão "+" no canto inferior direito.</p>
      </div>
    `:`
    <div class="lancamentos__table">
      <div class="lancamentos__table-header">
        <div class="lancamentos__table-row">
          <div class="lancamentos__table-cell lancamentos__table-cell--header">#</div>
          <div class="lancamentos__table-cell lancamentos__table-cell--header">Data</div>
          <div class="lancamentos__table-cell lancamentos__table-cell--header">Conta</div>
          <div class="lancamentos__table-cell lancamentos__table-cell--header">Valor</div>
          <div class="lancamentos__table-cell lancamentos__table-cell--header">Descrição</div>
          <div class="lancamentos__table-cell lancamentos__table-cell--header">Categoria</div>
          <div class="lancamentos__table-cell lancamentos__table-cell--header">Orçamento</div>
          <div class="lancamentos__table-cell lancamentos__table-cell--header">Ações</div>
        </div>
      </div>
      ${n.map(t=>{const a=t.valor<0?"lancamentos__table-cell--expense":"lancamentos__table-cell--income";return`
      <div class="lancamentos__table-row">
        <div class="lancamentos__table-cell">${t.rowIndex||"-"}</div>
        <div class="lancamentos__table-cell">${N(t.data)}</div>
        <div class="lancamentos__table-cell">${t.conta||"-"}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--number ${a}">
          ${O(t.valor)}
        </div>
        <div class="lancamentos__table-cell">${t.descricao||"-"}</div>
        <div class="lancamentos__table-cell">${t.categoria||"-"}</div>
        <div class="lancamentos__table-cell">${P(t.orcamento)}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--actions">
          ${V(t)}
        </div>
      </div>
    `}).join("")}
    </div>
  `}function me(n){return n.length===0?`
      <div class="lancamentos__empty">
        <div class="lancamentos__empty-icon">📋</div>
        <p class="lancamentos__empty-text">Nenhum lançamento encontrado</p>
        <p>Adicione seu primeiro lançamento usando o botão "+" no canto inferior direito.</p>
      </div>
    `:`
    <div class="lancamentos__list">
      ${n.map(t=>{const a=t.valor<0?"lancamentos__item-value--expense":"lancamentos__item-value--income";return`
      <div class="lancamentos__item">
        <div class="lancamentos__item-header">
          <div class="lancamentos__item-info">
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">#:</span>
              <span class="lancamentos__item-value">${t.rowIndex||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Data:</span>
              <span class="lancamentos__item-value">${N(t.data)}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Conta:</span>
              <span class="lancamentos__item-value">${t.conta||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Valor:</span>
              <span class="lancamentos__item-value lancamentos__item-value--valor ${a}">
                ${O(t.valor)}
              </span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Descrição:</span>
              <span class="lancamentos__item-value">${t.descricao||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Categoria:</span>
              <span class="lancamentos__item-value">${t.categoria||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Orçamento:</span>
              <span class="lancamentos__item-value">${P(t.orcamento)}</span>
            </div>
          </div>
        </div>
        <div class="lancamentos__item-actions">
          ${V(t)}
        </div>
      </div>
    `}).join("")}
    </div>
  `}function fe(n){return`
    ${ue(n)}
    ${me(n)}
  `}const pe=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});function L(n){return pe.format(n)}function S(n){return n>0?"grouped-summary__saldo--positive":n<0?"grouped-summary__saldo--negative":"grouped-summary__saldo--neutral"}function _(n){return String(n||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function $(n){if(!n)return"";const e=n.split("-");if(e.length!==3)return n;const[t,a,o]=e;return`${o}/${a}/${t}`}function ge(n){const e=[];if(n.conta&&e.push(`<span class="grouped-summary__filter-pill">Conta: <strong>${_(n.conta)}</strong></span>`),n.categoria&&e.push(`<span class="grouped-summary__filter-pill">Categoria: <strong>${_(n.categoria)}</strong></span>`),n.orcamento&&e.push(`<span class="grouped-summary__filter-pill">Orçamento: <strong>${_(n.orcamento)}</strong></span>`),n.dataInicio||n.dataFim){const t=n.dataInicio?$(n.dataInicio):"...",a=n.dataFim?$(n.dataFim):"...";e.push(`<span class="grouped-summary__filter-pill">Período: <strong>${_(t)} — ${_(a)}</strong></span>`)}return n.searchTerm&&e.push(`<span class="grouped-summary__filter-pill">Busca: <strong>&quot;${_(n.searchTerm)}&quot;</strong></span>`),e.join("")}function ye(n,e){return!n||n.totals.count===0?"":`
    <section class="grouped-summary" aria-label="Resumo dos filtros aplicados">
      <h2 class="grouped-summary__title">📊 Filtros aplicados</h2>
      <div class="grouped-summary__filters">
        ${ge(e)}
      </div>
      <div class="grouped-summary__totals">
        <span class="grouped-summary__total-item">
          <span class="grouped-summary__total-label">Receitas</span>
          <span class="grouped-summary__total-value ${S(n.totals.receitas)}">${L(n.totals.receitas)}</span>
        </span>
        <span class="grouped-summary__total-item">
          <span class="grouped-summary__total-label">Despesas</span>
          <span class="grouped-summary__total-value ${S(n.totals.despesas)}">${L(n.totals.despesas)}</span>
        </span>
        <span class="grouped-summary__total-item grouped-summary__total-item--highlight">
          <span class="grouped-summary__total-label">Saldo</span>
          <span class="grouped-summary__total-value ${S(n.totals.saldo)}">${L(n.totals.saldo)}</span>
        </span>
        <span class="grouped-summary__total-item">
          <span class="grouped-summary__total-label">Lançamentos</span>
          <span class="grouped-summary__total-value grouped-summary__saldo--neutral">${n.totals.count}</span>
        </span>
      </div>
    </section>
  `}const Ee=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];function he(n){const e=n.orcamento;if(e==null||e==="")return null;let t=null;if(typeof e=="number")t=b(e);else if(typeof e=="string"){const i=e.trim();if(!i)return null;const l=i.split("/");if(l.length===3){const r=parseInt(l[0],10),m=parseInt(l[1],10)-1,d=parseInt(l[2],10);!isNaN(r)&&!isNaN(m)&&!isNaN(d)&&(t=new Date(d,m,r))}}if(!t||isNaN(t.getTime()))return null;const a=String(t.getMonth()+1).padStart(2,"0"),o=t.getFullYear();return`${a}/${o}`}function ve(n){const[e,t]=n.split("/"),a=parseInt(e,10)-1;return isNaN(a)||a<0||a>11?n:`${Ee[a]}/${t}`}function _e(n){if(n.searchTerm&&n.searchTerm.trim()!=="")return!0;const e=n.filters;return!!(e.conta||e.dataInicio||e.dataFim||e.orcamento||e.categoria)}function be(n){const e=new Map,t={receitas:0,despesas:0,saldo:0,count:0};for(const o of n){if(!(o.data!==null&&o.data!==void 0&&!(typeof o.data=="string"&&o.data.trim()==="")))continue;const l=he(o);if(!l)continue;const r=o.conta&&o.conta.trim()||"Sem conta",m=(o.categoria||"").trim().toLowerCase()==="transferência";e.has(l)||e.set(l,{orcamentoKey:l,accounts:new Map});const d=e.get(l);d.accounts.has(r)||d.accounts.set(r,{conta:r,receitas:0,despesas:0,saldo:0,count:0,entries:[]});const c=d.accounts.get(r),u=Number(o.valor)||0;m?c.saldo+=u:(u>=0?(c.receitas+=u,t.receitas+=u):(c.despesas+=u,t.despesas+=u),c.count+=1,t.count+=1),c.saldo+=u,c.entries.push(o)}const a=Array.from(e.values()).map(o=>{const i=Array.from(o.accounts.values()).sort((c,u)=>u.saldo-c.saldo),l=i.reduce((c,u)=>c+u.receitas,0),r=i.reduce((c,u)=>c+u.despesas,0),m=i.reduce((c,u)=>c+u.saldo,0),d=i.reduce((c,u)=>c+u.count,0);return{orcamento:o.orcamentoKey,orcamentoLabel:ve(o.orcamentoKey),receitas:l,despesas:r,saldo:m,count:d,accounts:i}});return a.sort((o,i)=>{const[l,r]=o.orcamento.split("/"),[m,d]=i.orcamento.split("/");return Number(d)-Number(r)||Number(m)-Number(l)}),t.saldo=t.receitas+t.despesas,{groups:a,totals:t}}const s={entries:[],filteredEntries:[],originalEntries:[],searchTerm:"",sortBy:"original",showConsolidated:!0,showFuture:!1,isLoading:!1,filters:{conta:"",dataInicio:"",dataFim:"",orcamento:"",categoria:""},filterPanelOpen:!1};function Ie(){const n=document.getElementById("loadingIndicator");n&&(n.style.display="flex")}function we(){const n=document.getElementById("loadingIndicator");n&&(n.style.display="none")}function I(n,e="info"){e==="success"?z(n):e==="error"?U(n):K(n,"Info")}function Be(){const n=document.getElementById("searchResults"),e=document.getElementById("searchCount"),t=document.getElementById("clearSearchBtn");!n||!e||!t||(s.searchTerm?(e.textContent=`${s.filteredEntries.length} resultado(s) encontrado(s)`,n.classList.add("lancamentos__search-results--visible"),t.style.display="flex"):(n.classList.remove("lancamentos__search-results--visible"),t.style.display="none"))}async function h(n=!1){if(!s.isLoading){s.isLoading=!0,s.entries=[],F(),n||Ie();try{const a=((await E.fetchEntries(0,n)).entries||[]).filter(i=>!E.isBlankEntry(i));s.originalEntries=a,s.entries=[...s.originalEntries],Me(),De(),xe(),v(),I("Lançamentos carregados com sucesso"+(n?" (cache atualizado)":""),"success")}catch(e){console.error("Erro ao carregar lançamentos:",e),I("Erro ao carregar lançamentos: "+e.message,"error"),s.entries=[],s.filteredEntries=[],F()}finally{s.isLoading=!1,n||we()}}}function v(){let n=[...s.originalEntries];n=$e(n),s.searchTerm&&(n=E.filterEntries(n,s.searchTerm)),n=n.filter(e=>e.data!==null&&e.data!==void 0&&!(typeof e.data=="string"&&e.data.trim()==="")?s.showConsolidated:s.showFuture),n=E.sortEntries(n,s.sortBy),s.filteredEntries=n,s.entries=n,F(),Be()}function F(){const n=document.getElementById("entriesContainer");if(!n)return;const e=s.filteredEntries,t=e.slice(0,100),a=document.getElementById("groupedSummaryContainer");if(a)if(_e(s)){const o=be(e);a.innerHTML=ye(o,{conta:s.filters.conta,dataInicio:s.filters.dataInicio,dataFim:s.filters.dataFim,orcamento:s.filters.orcamento,categoria:s.filters.categoria,searchTerm:s.searchTerm})}else a.innerHTML="";n.innerHTML=fe(t)}function Ce(n){s.sortBy=n,v()}function Le(n){s.showConsolidated=n,v()}function Se(n){s.showFuture=n,v()}function T(n){s.searchTerm=n.trim(),v()}function Fe(){const n=document.getElementById("searchInput");n&&(n.value=""),s.searchTerm="",v()}function Te(){const n=document.getElementById("filterPanel"),e=document.getElementById("openFilterPanel");n&&e&&(n.setAttribute("aria-hidden","false"),e.classList.add("active"),s.filterPanelOpen=!0,setTimeout(()=>{const t=n.querySelector("select, input");t&&t.focus()},300))}function w(){const n=document.getElementById("filterPanel"),e=document.getElementById("openFilterPanel");n&&e&&(n.setAttribute("aria-hidden","true"),e.classList.remove("active"),s.filterPanelOpen=!1)}function Me(){const n=document.getElementById("filterConta");if(!n)return;const e=new Set;s.originalEntries.forEach(o=>{o.conta&&o.conta.trim()&&e.add(o.conta.trim())});const t=Array.from(e).sort(),a=n.options[0];n.innerHTML="",n.appendChild(a),t.forEach(o=>{const i=document.createElement("option");i.value=o,i.textContent=o,s.filters.conta===o&&(i.selected=!0),n.appendChild(i)})}function De(){const n=document.getElementById("filterOrcamento");if(!n)return;const e=new Set;s.originalEntries.forEach(o=>{if(o.orcamento){let i="";if(typeof o.orcamento=="number"){const l=b(o.orcamento);l&&(i=`${String(l.getMonth()+1).padStart(2,"0")}/${l.getFullYear()}`)}else typeof o.orcamento=="string"&&(i=o.orcamento.trim());i&&e.add(i)}});const t=Array.from(e).sort().reverse(),a=n.options[0];n.innerHTML="",n.appendChild(a),t.forEach(o=>{const i=document.createElement("option");i.value=o,i.textContent=o,s.filters.orcamento===o&&(i.selected=!0),n.appendChild(i)})}function xe(){const n=document.getElementById("filterCategoria");if(!n)return;const e=new Set;s.originalEntries.forEach(o=>{o.categoria&&o.categoria.trim()&&e.add(o.categoria.trim())});const t=Array.from(e).sort(),a=n.options[0];n.innerHTML="",n.appendChild(a),t.forEach(o=>{const i=document.createElement("option");i.value=o,i.textContent=o,s.filters.categoria===o&&(i.selected=!0),n.appendChild(i)})}function $e(n){let e=[...n];return s.filters.conta&&(e=e.filter(t=>t.conta&&t.conta.trim()===s.filters.conta)),(s.filters.dataInicio||s.filters.dataFim)&&(e=e.filter(t=>{if(!t.data)return!1;let a=null;if(typeof t.data=="number")a=b(t.data),a&&a.setHours(0,0,0,0);else if(typeof t.data=="string"){const o=t.data.split(" ")[0].split("/");if(o.length===3){const[i,l,r]=o;a=new Date(parseInt(r),parseInt(l)-1,parseInt(i)),a.setHours(0,0,0,0)}}if(!a||isNaN(a.getTime()))return!1;if(s.filters.dataInicio){const[o,i,l]=s.filters.dataInicio.split("-").map(Number),r=new Date(o,i-1,l);if(r.setHours(0,0,0,0),a<r)return!1}if(s.filters.dataFim){const[o,i,l]=s.filters.dataFim.split("-").map(Number),r=new Date(o,i-1,l);if(r.setHours(23,59,59,999),a>r)return!1}return!0})),s.filters.categoria&&(e=e.filter(t=>t.categoria&&t.categoria.trim()===s.filters.categoria)),s.filters.orcamento&&(e=e.filter(t=>{if(!t.orcamento)return!1;let a="";if(typeof t.orcamento=="number"){const o=b(t.orcamento);o&&(a=`${String(o.getMonth()+1).padStart(2,"0")}/${o.getFullYear()}`)}else typeof t.orcamento=="string"&&(a=t.orcamento.trim());return a===s.filters.orcamento})),e}function ke(){const n=document.getElementById("filterConta"),e=document.getElementById("filterDataInicio"),t=document.getElementById("filterDataFim"),a=document.getElementById("filterCategoria"),o=document.getElementById("filterOrcamento");n&&(s.filters.conta=n.value),e&&(s.filters.dataInicio=e.value),t&&(s.filters.dataFim=t.value),a&&(s.filters.categoria=a.value),o&&(s.filters.orcamento=o.value),w(),v();const i=[s.filters.conta,s.filters.dataInicio,s.filters.dataFim,s.filters.categoria,s.filters.orcamento].filter(l=>l).length;i>0&&I(`${i} filtro(s) aplicado(s)`,"success")}function Ae(){s.filters={conta:"",dataInicio:"",dataFim:"",orcamento:"",categoria:""};const n=document.getElementById("filterConta"),e=document.getElementById("filterDataInicio"),t=document.getElementById("filterDataFim"),a=document.getElementById("filterOrcamento"),o=document.getElementById("filterCategoria");n&&(n.value=""),e&&(e.value=""),t&&(t.value=""),a&&(a.value=""),o&&(o.value=""),w(),v(),I("Filtros limpos","info")}function Oe(n){const e=s.originalEntries.find(t=>t.rowIndex===n);e?ce(e):console.error("Lançamento não encontrado:",n)}function Ne(n){const e=s.originalEntries.find(t=>t.rowIndex===n);if(e){const t={conta:e.conta,valor:e.valor,descricao:e.descricao,categoria:e.categoria,orcamento:e.orcamento,obs:e.obs};Q(t)}else console.error("Lançamento não encontrado para copiar:",n)}let C=null;function Pe(n){const e=s.originalEntries.find(r=>r.rowIndex===n);if(!e){console.error("Lançamento não encontrado:",n);return}C=n;const t=document.getElementById("deleteRowNumber"),a=document.getElementById("deleteDate"),o=document.getElementById("deleteValue"),i=document.getElementById("deleteDescription");if(t&&(t.textContent=String(e.rowIndex||"-")),a){let r="-";e.data&&(typeof e.data=="number"?r=A(e.data):typeof e.data=="string"&&(r=e.data)),a.textContent=r}o&&(o.textContent=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(e.valor)),i&&(i.textContent=e.descricao||"-");const l=document.getElementById("deleteModal");l&&(l.style.display="flex")}function q(){C=null;const n=document.getElementById("deleteModal");n&&(n.style.display="none")}async function Ve(){if(C===null){console.error("Nenhum lançamento pendente para exclusão");return}const n=C,e=document.getElementById("deleteConfirmBtn");e&&(e.disabled=!0,e.textContent="Excluindo...");try{await E.deleteEntry(n),I("Lançamento excluído com sucesso","success"),q(),await h()}catch(t){console.error("Erro ao deletar lançamento:",t),I("Erro ao deletar lançamento: "+t.message,"error")}finally{e&&(e.disabled=!1,e.textContent="Excluir")}}function qe(n){Pe(n)}window.editEntry=Oe;window.copyEntry=Ne;window.deleteEntry=qe;window.lancamentosManager={closeDeleteModal:q,confirmDelete:Ve,closeSplitModal:()=>{const n=document.getElementById("splitModal");n&&(n.style.display="none")},confirmSplit:()=>{console.warn("Funcionalidade de divisão de parcelas não implementada")}};async function k(){if(console.log("[Lançamentos] Inicializando página..."),!await j()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}J(),await X(f=>{console.log("✅ Lançamento adicionado:",f),h()}),await le(f=>{console.log("✅ Lançamento editado:",f),h()}),await Z(f=>{console.log("✅ Lançamento futuro adicionado:",f),h()}),await ee(f=>{console.log("✅ Transferência realizada:",f),h()}),te(()=>D(),()=>ae(),()=>ne());const e=document.getElementById("openAddEntryModalBtn");e&&e.addEventListener("click",()=>{console.log("🔓 Abrindo modal de adicionar lançamento..."),D()});const t=document.getElementById("refreshEntriesBtn");t&&t.addEventListener("click",async()=>{console.log("🔄 Atualizando lançamentos (forceRefresh=true)...");const f=t.innerHTML;t.disabled=!0,t.innerHTML="⏳ Atualizando...";try{await h(!0)}finally{t.disabled=!1,t.innerHTML=f}});const a=document.getElementById("searchInput");a&&a.addEventListener("input",f=>{T(f.target.value)});const o=document.getElementById("clearSearchBtn");o&&o.addEventListener("click",()=>{Fe()});const i=document.getElementById("sortSelect");i&&(i.value=s.sortBy,i.addEventListener("change",f=>{Ce(f.target.value)}));const l=document.getElementById("showConsolidatedCheck");l&&(l.checked=s.showConsolidated,l.addEventListener("change",f=>{Le(f.target.checked)}));const r=document.getElementById("showFutureCheck");r&&(r.checked=s.showFuture,r.addEventListener("change",f=>{Se(f.target.checked)}));const m=document.getElementById("openFilterPanel");m&&m.addEventListener("click",()=>{console.log("🔍 Abrindo painel de filtros..."),Te()});const d=document.getElementById("closeFilterPanel");d&&d.addEventListener("click",()=>{console.log("❌ Fechando painel de filtros..."),w()});const c=document.getElementById("filterPanelOverlay");c&&c.addEventListener("click",()=>{console.log("🖱️ Clique no overlay - fechando painel de filtros..."),w()});const u=document.getElementById("applyFiltersBtn");u&&u.addEventListener("click",()=>{console.log("✅ Aplicando filtros..."),ke()});const p=document.getElementById("clearFiltersBtn");p&&p.addEventListener("click",()=>{console.log("🧹 Limpando filtros..."),Ae()}),document.addEventListener("keydown",f=>{f.key==="Escape"&&s.filterPanelOpen&&w()}),document.addEventListener("entry:edited",()=>{console.log("📝 Entrada editada, recarregando..."),setTimeout(()=>{h()},300)}),await h(),de(s.originalEntries),He(),console.log("✅ Página de lançamentos inicializada")}function He(){const n=new URLSearchParams(window.location.search),e=n.get("conta"),t=n.get("categoria");e?(console.log("[Lançamentos] Filtrando por conta:",e),T(e)):t&&(console.log("[Lançamentos] Filtrando por categoria:",t),T(t));const a=document.getElementById("searchInput");a&&(e||t)&&(a.value=e||t||"")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",k):k();
