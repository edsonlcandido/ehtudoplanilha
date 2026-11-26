const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/sheets.js","assets/auth.js","assets/auth.css"])))=>i.map(i=>d[i]);
var P=Object.defineProperty;var V=(n,e,t)=>e in n?P(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var y=(n,e,t)=>V(n,typeof e!="symbol"?e+"":e,t);import{v as q}from"./auth.js";/* empty css          */import{l as B,n as R,a as H,b as N,c as z,d as j,e as U,o as W,g as G,j as Q,k as C}from"./fab-menu.js";import{r as J}from"./user-menu.js";import{s as K,a as X,b as Y}from"./toast.js";import"./sheets.js";const Z="modulepreload",ee=function(n){return"/"+n},L={},te=function(e,t,o){let s=Promise.resolve();if(t&&t.length>0){let l=function(d){return Promise.all(d.map(f=>Promise.resolve(f).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),m=(i==null?void 0:i.nonce)||(i==null?void 0:i.getAttribute("nonce"));s=l(t.map(d=>{if(d=ee(d),d in L)return;L[d]=!0;const f=d.endsWith(".css"),p=f?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${p}`))return;const g=document.createElement("link");if(g.rel=f?"stylesheet":Z,f||(g.as="script"),g.crossOrigin="",g.href=d,m&&g.setAttribute("nonce",m),document.head.appendChild(g),f)return new Promise((c,O)=>{g.addEventListener("load",c),g.addEventListener("error",()=>O(new Error(`Unable to preload CSS for ${d}`)))})}))}function r(l){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=l,window.dispatchEvent(i),!i.defaultPrevented)throw l}return s.then(l=>{for(const i of l||[])i.status==="rejected"&&r(i.reason);return e().catch(r)})};let E=null;class ne{constructor(){y(this,"modal",null);y(this,"form",null);y(this,"callback");y(this,"currentEntry",null);y(this,"accounts",[]);y(this,"categories",[]);y(this,"categoriesComplete",[]);y(this,"descriptions",[]);y(this,"entries",[])}getTemplate(){return`
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
    `}async init(e){if(console.log("[EditEntryModal] Inicializando..."),this.callback=e,document.body.insertAdjacentHTML("beforeend",this.getTemplate()),this.modal=document.getElementById("editEntryModal"),this.form=document.getElementById("editEntryForm"),!this.modal||!this.form)throw new Error("[EditEntryModal] Elementos do modal não encontrados");this.setupEventListeners(),console.log("[EditEntryModal] ✅ Inicializado com sucesso")}setupEventListeners(){var s,r;const e=document.getElementById("closeEditEntryModal");e==null||e.addEventListener("click",()=>this.close());const t=document.getElementById("cancelEditEntryBtn");t==null||t.addEventListener("click",()=>this.close()),(s=this.modal)==null||s.addEventListener("click",l=>{l.target===this.modal&&this.close()}),document.addEventListener("keydown",l=>{var i;l.key==="Escape"&&((i=this.modal)==null?void 0:i.style.display)==="flex"&&this.close()});const o=document.getElementById("editEntrySignBtn");o==null||o.addEventListener("click",()=>this.toggleSign()),(r=this.form)==null||r.addEventListener("submit",l=>this.handleSubmit(l)),this.setupCategoryAutocomplete(),this.setupDescriptionAutocomplete(),this.setupAccountAutocomplete()}setupCategoryAutocomplete(){const e=document.getElementById("editEntryCategory");if(!e)return;let t=this.ensureSuggestionsContainer("editCatSuggestions",e);e.addEventListener("focus",()=>{this.categories.length>0&&this.showAllSuggestions(e,t,this.categories)}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.categories)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}setupDescriptionAutocomplete(){const e=document.getElementById("editEntryDescription");if(!e)return;let t=this.ensureSuggestionsContainer("editDescSuggestions",e);e.addEventListener("focus",()=>{this.descriptions.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.descriptions,s=>{this.autoFillCategoryFromDescription(s)}))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.descriptions,o=>{this.autoFillCategoryFromDescription(o)})}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}autoFillCategoryFromDescription(e){const t=this.entries.find(o=>o.descricao&&o.descricao.trim().toLowerCase()===e.toLowerCase());if(t&&t.categoria){const o=document.getElementById("editEntryCategory");o&&(o.value=t.categoria)}}setupAccountAutocomplete(){const e=document.getElementById("editEntryAccount");if(!e)return;let t=this.ensureSuggestionsContainer("editAccountSuggestions",e);e.addEventListener("focus",()=>{this.accounts.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.accounts))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.accounts)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}ensureSuggestionsContainer(e,t){let o=document.getElementById(e);if(!o){o=document.createElement("div"),o.id=e,o.classList.add("entry-modal__suggestions"),o.setAttribute("role","listbox");const s=t.parentElement;s&&(s.style.position=s.style.position||"relative",s.appendChild(o))}return o}showAllSuggestions(e,t,o,s){if(t.innerHTML="",o.length===0){t.style.display="none";return}o.slice(0,20).forEach(l=>{const i=document.createElement("div");i.setAttribute("role","option"),i.classList.add("entry-modal__suggestion"),i.textContent=l,i.addEventListener("click",()=>{e.value=l,t.style.display="none",e.focus(),s&&s(l)}),t.appendChild(i)}),t.style.display="block"}showSuggestions(e,t,o,s){t.innerHTML="";const r=e.value.trim().toLowerCase();if(!r||r.length<1){this.showAllSuggestions(e,t,o,s);return}if(o.length===0){t.style.display="none";return}const l=o.filter(i=>i.toLowerCase().includes(r));if(l.length===0){t.style.display="none";return}l.forEach(i=>{const m=document.createElement("div");m.setAttribute("role","option"),m.classList.add("entry-modal__suggestion"),m.textContent=i,m.addEventListener("click",()=>{e.value=i,t.style.display="none",e.focus(),s&&s(i)}),t.appendChild(m)}),t.style.display="block"}toggleSign(){var o;const e=document.getElementById("editEntrySignBtn"),t=((o=e==null?void 0:e.textContent)==null?void 0:o.trim())==="−";this.setSignState(!t)}setSignState(e){const t=document.getElementById("editEntrySignBtn"),o=document.getElementById("editEntrySignValue");!t||!o||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),o.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),o.value="+"))}open(e){var s;if(!this.modal||!e)return;console.log("[EditEntryModal] Abrindo modal para edição:",e),this.currentEntry=e,this.populateForm(e),this.modal.style.display="flex",this.modal.setAttribute("aria-hidden","false");const t=document.getElementById("openEntryModal");t&&(t.style.visibility="hidden",console.log("[EditEntryModal] ✅ Botão FAB oculto"));const o=(s=this.form)==null?void 0:s.querySelector("input");o==null||o.focus()}applySignState(e){const t=document.getElementById("editEntrySignBtn"),o=document.getElementById("editEntrySignValue");!t||!o||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),o.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),o.value="+"))}populateForm(e){const t=document.getElementById("editEntryDate");t&&(t.value=e.dataInput||"");const o=document.getElementById("editEntryAccount");o&&(o.value=e.conta||"");const s=document.getElementById("editEntryValue");if(s&&e.valor!==void 0){const d=Math.abs(e.valor);s.value=d.toString(),this.applySignState(e.valor<0)}const r=document.getElementById("editEntryDescription");r&&(r.value=e.descricao||"");const l=document.getElementById("editEntryCategory");l&&(l.value=e.categoria||"");const i=document.getElementById("editEntryBudget");i&&(i.value=e.orcamentoInput||"");const m=document.getElementById("editEntryObs");m&&(m.value=e.obs||"")}close(){if(!this.modal)return;this.modal.style.display="none",this.modal.setAttribute("aria-hidden","true"),this.currentEntry=null;const e=document.getElementById("openEntryModal");e&&(e.style.visibility="visible",console.log("[EditEntryModal] ✅ Botão FAB visível")),this.form&&this.form.reset(),this.clearFeedback()}isOpen(){var e;return((e=this.modal)==null?void 0:e.style.display)==="flex"}async handleSubmit(e){if(e.preventDefault(),!this.form||!this.currentEntry||!this.currentEntry.rowIndex){console.error("[EditEntryModal] Dados insuficientes para edição");return}const t=new FormData(this.form),o=document.getElementById("saveEditEntryBtn");o&&(o.disabled=!0,o.textContent="Salvando...");try{const s=t.get("data"),r=t.get("orcamento"),l=parseFloat(t.get("valor")),i=t.get("sinal");if(!r||isNaN(new Date(r).getTime()))throw new Error("Data de orçamento inválida");if(s&&s.trim()!==""){if(!s.includes("T"))throw new Error("Formato de data/hora inválido");if(isNaN(new Date(s).getTime()))throw new Error("Data inválida")}const m=i==="−"||i==="-"?-Math.abs(l):Math.abs(l),d={data:s,conta:t.get("conta"),valor:m,descricao:t.get("descricao"),categoria:t.get("categoria"),orcamento:r,obs:t.get("observacoes")||""};console.log("[EditEntryModal] 📤 Enviando edição:",d),await B.editEntry(this.currentEntry.rowIndex,d),this.showFeedback("✅ Lançamento editado com sucesso!","success"),setTimeout(()=>{var p;this.close();const f=new CustomEvent("entry:edited",{detail:{rowIndex:(p=this.currentEntry)==null?void 0:p.rowIndex,entry:d}});document.dispatchEvent(f),this.callback&&this.callback({success:!0,entry:d})},500)}catch(s){console.error("[EditEntryModal] ❌ Erro ao editar:",s),this.showFeedback(`❌ Erro: ${s instanceof Error?s.message:"Erro desconhecido"}`,"error")}finally{o&&(o.disabled=!1,o.textContent="Salvar")}}showFeedback(e,t){const o=document.getElementById("editEntryFeedback");o&&(o.textContent=e,o.className=`modal-feedback modal-feedback--${t}`,o.style.display="block",(t==="success"||t==="error")&&setTimeout(()=>{this.clearFeedback()},5e3))}clearFeedback(){const e=document.getElementById("editEntryFeedback");e&&(e.className="modal-feedback",e.textContent="",e.style.display="none")}async setEntries(e){this.entries=e,this.accounts=[...new Set(e.map(o=>o.conta).filter(o=>o&&o.trim()))].sort(),this.descriptions=[...new Set(e.map(o=>o.descricao).filter(o=>o&&o.trim()))].sort();const t=[...new Set(e.map(o=>o.categoria).filter(o=>o&&o.trim()))].sort();try{const{SheetsService:o}=await te(async()=>{const{SheetsService:s}=await import("./sheets.js");return{SheetsService:s}},__vite__mapDeps([0,1,2]));this.categoriesComplete=await o.getSheetCategoriesComplete(),this.categoriesComplete.length>0?(this.categories=this.categoriesComplete.map(s=>s.categoria),console.log("[EditEntryModal] Categorias completas carregadas:",this.categoriesComplete.length)):(this.categories=t,console.log("[EditEntryModal] Usando categorias dos entries:",this.categories.length))}catch(o){console.warn("[EditEntryModal] Erro ao carregar categorias completas, usando entries:",o),this.categories=t}}}async function oe(n){if(E)return console.log("[EditEntryModal] Reutilizando instância existente"),E;try{return E=new ne,await E.init(n),E}catch(e){return console.error("[EditEntryModal] Erro ao inicializar:",e),null}}function ae(n){E?E.open(n):console.error("[EditEntryModal] Modal não inicializado")}function se(n){E&&E.setEntries(n)}function k(n){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n)}function T(n){return n.dataLabel||"-"}function A(n){return n.orcamentoLabel||"-"}function D(n){return`
    <button class="button small" onclick="window.editEntry(${n.rowIndex})" title="Editar">
      ✏️
    </button>
    <button class="button small" onclick="window.copyEntry(${n.rowIndex})" title="Copiar">
      📑
    </button>
    <button class="button small danger" onclick="window.deleteEntry(${n.rowIndex})" title="Excluir">
      🗑️
    </button>
  `}function ie(n){return n.length===0?`
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
      ${n.map(t=>{const o=t.valor<0?"lancamentos__table-cell--expense":"lancamentos__table-cell--income";return`
      <div class="lancamentos__table-row">
        <div class="lancamentos__table-cell">${t.rowIndex||"-"}</div>
        <div class="lancamentos__table-cell">${T(t)}</div>
        <div class="lancamentos__table-cell">${t.conta||"-"}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--number ${o}">
          ${k(t.valor)}
        </div>
        <div class="lancamentos__table-cell">${t.descricao||"-"}</div>
        <div class="lancamentos__table-cell">${t.categoria||"-"}</div>
        <div class="lancamentos__table-cell">${A(t)}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--actions">
          ${D(t)}
        </div>
      </div>
    `}).join("")}
    </div>
  `}function le(n){return n.length===0?`
      <div class="lancamentos__empty">
        <div class="lancamentos__empty-icon">📋</div>
        <p class="lancamentos__empty-text">Nenhum lançamento encontrado</p>
        <p>Adicione seu primeiro lançamento usando o botão "+" no canto inferior direito.</p>
      </div>
    `:`
    <div class="lancamentos__list">
      ${n.map(t=>{const o=t.valor<0?"lancamentos__item-value--expense":"lancamentos__item-value--income";return`
      <div class="lancamentos__item">
        <div class="lancamentos__item-header">
          <div class="lancamentos__item-info">
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">#:</span>
              <span class="lancamentos__item-value">${t.rowIndex||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Data:</span>
              <span class="lancamentos__item-value">${T(t)}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Conta:</span>
              <span class="lancamentos__item-value">${t.conta||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Valor:</span>
              <span class="lancamentos__item-value lancamentos__item-value--valor ${o}">
                ${k(t.valor)}
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
              <span class="lancamentos__item-value">${A(t)}</span>
            </div>
          </div>
        </div>
        <div class="lancamentos__item-actions">
          ${D(t)}
        </div>
      </div>
    `}).join("")}
    </div>
  `}function re(n){return`
    ${ie(n)}
    ${le(n)}
  `}const ce=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});function de(n){return ce.format(n)}function ue(n){return n>0?"grouped-summary__saldo--positive":n<0?"grouped-summary__saldo--negative":"grouped-summary__saldo--neutral"}function S(n){return String(n||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function me(n){return(n||[]).map(e=>`<span class="grouped-summary__filter-pill">${S(e.rotulo)}: <strong>${S(e.valor)}</strong></span>`).join("")}function fe(n,e){if(!n||n.count===0)return"";const t=me(e),o=n.count===1?"lançamento":"lançamentos";return`
    <section class="grouped-summary" aria-label="Resumo dos filtros aplicados">
      <h2 class="grouped-summary__title">📊 Filtros aplicados</h2>
      <div class="grouped-summary__filters">
        ${t}
      </div>
      <div class="grouped-summary__totals">
        <div class="grouped-summary__total">
          <span class="grouped-summary__total-label">Total</span>
          <span class="grouped-summary__total-value ${ue(n.saldo)}">${de(n.saldo)}</span>
          <span class="grouped-summary__total-count">${n.count} ${o}</span>
        </div>
      </div>
    </section>
  `}const a={entries:[],total:0,meta:{contas:[],categorias:[],descricoes:[],orcamentos:[],proximoOrcamento:"",orcamentoMesAtual:""},resumo:{receitas:0,despesas:0,saldo:0,count:0},filtrosAtivos:[],searchTerm:"",sortBy:"original",showConsolidated:!0,showFuture:!1,isLoading:!1,filters:{conta:"",dataInicio:"",dataFim:"",orcamento:"",categoria:""},filterPanelOpen:!1};let b=null,w=!1,F=!0;function pe(){const n=document.getElementById("loadingIndicator");n&&(n.style.display="flex")}function ge(){const n=document.getElementById("loadingIndicator");n&&(n.style.display="none")}function v(n,e="info"){e==="success"?K(n):e==="error"?X(n):Y(n,"Info")}function ye(){const n=document.getElementById("searchResults"),e=document.getElementById("searchCount"),t=document.getElementById("clearSearchBtn");!n||!e||!t||(a.searchTerm?(e.textContent=`${a.total} resultado(s) encontrado(s)`,n.classList.add("lancamentos__search-results--visible"),t.style.display="flex"):(n.classList.remove("lancamentos__search-results--visible"),t.style.display="none"))}function Ee(n){return{limit:100,q:a.searchTerm,conta:a.filters.conta,categoria:a.filters.categoria,orcamento:a.filters.orcamento,dataInicio:a.filters.dataInicio,dataFim:a.filters.dataFim,tipo:ve(),sort:a.sortBy,fresh:n}}function ve(){return a.showConsolidated&&a.showFuture?"todos":a.showConsolidated?"consolidado":a.showFuture?"futuro":"nenhum"}async function u(n=!1){var e;if(a.isLoading){w=!0;return}a.isLoading=!0,n||pe();try{const t=await B.fetchEntries(Ee(n));a.entries=t.entries||[],a.total=t.total??a.entries.length,a.meta=t.meta||a.meta,a.resumo=t.resumo||a.resumo,a.filtrosAtivos=((e=t.filtros)==null?void 0:e.ativos)||[],Be(),Ce(),Le(),M(),(F||n)&&v("Lançamentos carregados com sucesso"+(n?" (cache atualizado)":""),"success"),F=!1}catch(t){console.error("Erro ao carregar lançamentos:",t),v("Erro ao carregar lançamentos: "+t.message,"error"),a.entries=[],a.resumo={receitas:0,despesas:0,saldo:0,count:0},M()}finally{a.isLoading=!1,n||ge(),w&&(w=!1,u())}}function M(){const n=document.getElementById("entriesContainer");if(!n)return;const e=document.getElementById("groupedSummaryContainer");e&&(a.filtrosAtivos.length>0?e.innerHTML=fe(a.resumo,a.filtrosAtivos):e.innerHTML=""),n.innerHTML=re(a.entries),ye()}function he(n){a.sortBy=n,u()}function _e(n){a.showConsolidated=n,u()}function be(n){a.showFuture=n,u()}function I(n){a.searchTerm=n.trim(),b!==null&&window.clearTimeout(b),b=window.setTimeout(()=>{u()},400)}function we(){const n=document.getElementById("searchInput");n&&(n.value=""),a.searchTerm="",u()}function Ie(){const n=document.getElementById("filterPanel"),e=document.getElementById("openFilterPanel");n&&e&&(n.setAttribute("aria-hidden","false"),e.classList.add("active"),a.filterPanelOpen=!0,setTimeout(()=>{const t=n.querySelector("select, input");t&&t.focus()},300))}function h(){const n=document.getElementById("filterPanel"),e=document.getElementById("openFilterPanel");n&&e&&(n.setAttribute("aria-hidden","true"),e.classList.remove("active"),a.filterPanelOpen=!1)}function Be(){const n=document.getElementById("filterConta");if(!n)return;const e=n.options[0];n.innerHTML="",n.appendChild(e),a.meta.contas.forEach(t=>{const o=document.createElement("option");o.value=t,o.textContent=t,a.filters.conta===t&&(o.selected=!0),n.appendChild(o)})}function Ce(){const n=document.getElementById("filterOrcamento");if(!n)return;const e=n.options[0];n.innerHTML="",n.appendChild(e),a.meta.orcamentos.forEach(t=>{const o=document.createElement("option");o.value=String(t.serial),o.textContent=t.label,a.filters.orcamento===String(t.serial)&&(o.selected=!0),n.appendChild(o)})}function Le(){const n=document.getElementById("filterCategoria");if(!n)return;const e=n.options[0];n.innerHTML="",n.appendChild(e),a.meta.categorias.forEach(t=>{const o=document.createElement("option");o.value=t,o.textContent=t,a.filters.categoria===t&&(o.selected=!0),n.appendChild(o)})}function Se(){const n=document.getElementById("filterConta"),e=document.getElementById("filterDataInicio"),t=document.getElementById("filterDataFim"),o=document.getElementById("filterCategoria"),s=document.getElementById("filterOrcamento");n&&(a.filters.conta=n.value),e&&(a.filters.dataInicio=e.value),t&&(a.filters.dataFim=t.value),o&&(a.filters.categoria=o.value),s&&(a.filters.orcamento=s.value),h();const r=[a.filters.conta,a.filters.dataInicio,a.filters.dataFim,a.filters.categoria,a.filters.orcamento].filter(l=>l).length;u(),r>0&&v(`${r} filtro(s) aplicado(s)`,"success")}function Fe(){a.filters={conta:"",dataInicio:"",dataFim:"",orcamento:"",categoria:""};const n=document.getElementById("filterConta"),e=document.getElementById("filterDataInicio"),t=document.getElementById("filterDataFim"),o=document.getElementById("filterCategoria"),s=document.getElementById("filterOrcamento");n&&(n.value=""),e&&(e.value=""),t&&(t.value=""),o&&(o.value=""),s&&(s.value=""),h(),u(),v("Filtros limpos","info")}function Me(n){const e=a.entries.find(t=>t.rowIndex===n);e?ae(e):console.error("Lançamento não encontrado:",n)}function xe(n){const e=a.entries.find(t=>t.rowIndex===n);if(e){const t={conta:e.conta,valor:e.valor,descricao:e.descricao,categoria:e.categoria,orcamentoInput:e.orcamentoInput,obs:e.obs};R(t)}else console.error("Lançamento não encontrado para copiar:",n)}let _=null;function ke(n){const e=a.entries.find(i=>i.rowIndex===n);if(!e){console.error("Lançamento não encontrado:",n);return}_=n;const t=document.getElementById("deleteRowNumber"),o=document.getElementById("deleteDate"),s=document.getElementById("deleteValue"),r=document.getElementById("deleteDescription");t&&(t.textContent=String(e.rowIndex||"-")),o&&(o.textContent=e.dataLabel||"-"),s&&(s.textContent=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(e.valor)),r&&(r.textContent=e.descricao||"-");const l=document.getElementById("deleteModal");l&&(l.style.display="flex")}function $(){_=null;const n=document.getElementById("deleteModal");n&&(n.style.display="none")}async function Te(){if(_===null){console.error("Nenhum lançamento pendente para exclusão");return}const n=_,e=document.getElementById("deleteConfirmBtn");e&&(e.disabled=!0,e.textContent="Excluindo...");try{await B.deleteEntry(n),v("Lançamento excluído com sucesso","success"),$(),await u(!0)}catch(t){console.error("Erro ao deletar lançamento:",t),v("Erro ao deletar lançamento: "+t.message,"error")}finally{e&&(e.disabled=!1,e.textContent="Excluir")}}function Ae(n){ke(n)}window.editEntry=Me;window.copyEntry=xe;window.deleteEntry=Ae;window.lancamentosManager={closeDeleteModal:$,confirmDelete:Te,closeSplitModal:()=>{const n=document.getElementById("splitModal");n&&(n.style.display="none")},confirmSplit:()=>{console.warn("Funcionalidade de divisão de parcelas não implementada")}};async function x(){if(console.log("[Lançamentos] Inicializando página..."),!await q()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}J(),await H(c=>{console.log("✅ Lançamento adicionado:",c),u(!0)}),await oe(c=>{console.log("✅ Lançamento editado:",c),u(!0)}),await N(c=>{console.log("✅ Lançamento futuro adicionado:",c),u(!0)}),await z(c=>{console.log("✅ Transferência realizada:",c),u(!0)}),await j(c=>{console.log("✅ Saldo ajustado:",c),u(!0)}),U(()=>C(),()=>Q(),()=>G(),()=>W());const e=document.getElementById("openAddEntryModalBtn");e&&e.addEventListener("click",()=>{console.log("🔓 Abrindo modal de adicionar lançamento..."),C()});const t=document.getElementById("refreshEntriesBtn");t&&t.addEventListener("click",async()=>{console.log("🔄 Atualizando lançamentos (forceRefresh=true)...");const c=t.innerHTML;t.disabled=!0,t.innerHTML="⏳ Atualizando...";try{await u(!0)}finally{t.disabled=!1,t.innerHTML=c}});const o=document.getElementById("searchInput");o&&o.addEventListener("input",c=>{I(c.target.value)});const s=document.getElementById("clearSearchBtn");s&&s.addEventListener("click",()=>{we()});const r=document.getElementById("sortSelect");r&&(r.value=a.sortBy,r.addEventListener("change",c=>{he(c.target.value)}));const l=document.getElementById("showConsolidatedCheck");l&&(l.checked=a.showConsolidated,l.addEventListener("change",c=>{_e(c.target.checked)}));const i=document.getElementById("showFutureCheck");i&&(i.checked=a.showFuture,i.addEventListener("change",c=>{be(c.target.checked)}));const m=document.getElementById("openFilterPanel");m&&m.addEventListener("click",()=>{console.log("🔍 Abrindo painel de filtros..."),Ie()});const d=document.getElementById("closeFilterPanel");d&&d.addEventListener("click",()=>{console.log("❌ Fechando painel de filtros..."),h()});const f=document.getElementById("filterPanelOverlay");f&&f.addEventListener("click",()=>{console.log("🖱️ Clique no overlay - fechando painel de filtros..."),h()});const p=document.getElementById("applyFiltersBtn");p&&p.addEventListener("click",()=>{console.log("✅ Aplicando filtros..."),Se()});const g=document.getElementById("clearFiltersBtn");g&&g.addEventListener("click",()=>{console.log("🧹 Limpando filtros..."),Fe()}),document.addEventListener("keydown",c=>{c.key==="Escape"&&a.filterPanelOpen&&h()}),document.addEventListener("entry:edited",()=>{console.log("📝 Entrada editada, recarregando..."),setTimeout(()=>{u(!0)},300)}),await u(),se(a.entries),De(),console.log("✅ Página de lançamentos inicializada")}function De(){const n=new URLSearchParams(window.location.search),e=n.get("conta"),t=n.get("categoria");e?(console.log("[Lançamentos] Filtrando por conta:",e),I(e)):t&&(console.log("[Lançamentos] Filtrando por categoria:",t),I(t));const o=document.getElementById("searchInput");o&&(e||t)&&(o.value=e||t||"")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",x):x();
