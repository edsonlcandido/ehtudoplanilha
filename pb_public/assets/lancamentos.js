const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/sheets.js","assets/auth.js","assets/auth.css","assets/sheets.css"])))=>i.map(i=>d[i]);
var V=Object.defineProperty;var O=(n,e,t)=>e in n?V(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var g=(n,e,t)=>O(n,typeof e!="symbol"?e+"":e,t);import{v as q}from"./auth.js";import"./sheets.js";import{e as L,j as B,k as R,m as N,l as y,n as M,a as P,i as j,b as z,c as U,d as H,o as W,f as G,h as S}from"./fab-menu.js";import{r as J}from"./user-menu.js";import{a as K,s as Q,b as X}from"./toast.js";const Y="modulepreload",Z=function(n){return"/"+n},x={},ee=function(e,t,a){let o=Promise.resolve();if(t&&t.length>0){let i=function(d){return Promise.all(d.map(m=>Promise.resolve(m).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};document.getElementsByTagName("link");const s=document.querySelector("meta[property=csp-nonce]"),l=(s==null?void 0:s.nonce)||(s==null?void 0:s.getAttribute("nonce"));o=i(t.map(d=>{if(d=Z(d),d in x)return;x[d]=!0;const m=d.endsWith(".css"),p=m?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${p}`))return;const u=document.createElement("link");if(u.rel=m?"stylesheet":Y,m||(u.as="script"),u.crossOrigin="",u.href=d,l&&u.setAttribute("nonce",l),document.head.appendChild(u),m)return new Promise((v,b)=>{u.addEventListener("load",v),u.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${d}`)))})}))}function c(i){const s=new Event("vite:preloadError",{cancelable:!0});if(s.payload=i,window.dispatchEvent(s),!s.defaultPrevented)throw i}return o.then(i=>{for(const s of i||[])s.status==="rejected"&&c(s.reason);return e().catch(c)})};let f=null;class te{constructor(){g(this,"modal",null);g(this,"form",null);g(this,"callback");g(this,"currentEntry",null);g(this,"accounts",[]);g(this,"categories",[]);g(this,"categoriesComplete",[]);g(this,"descriptions",[]);g(this,"entries",[])}getTemplate(){return`
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
    `}async init(e){if(console.log("[EditEntryModal] Inicializando..."),this.callback=e,document.body.insertAdjacentHTML("beforeend",this.getTemplate()),this.modal=document.getElementById("editEntryModal"),this.form=document.getElementById("editEntryForm"),!this.modal||!this.form)throw new Error("[EditEntryModal] Elementos do modal não encontrados");this.setupEventListeners(),console.log("[EditEntryModal] ✅ Inicializado com sucesso")}setupEventListeners(){var o,c;const e=document.getElementById("closeEditEntryModal");e==null||e.addEventListener("click",()=>this.close());const t=document.getElementById("cancelEditEntryBtn");t==null||t.addEventListener("click",()=>this.close()),(o=this.modal)==null||o.addEventListener("click",i=>{i.target===this.modal&&this.close()}),document.addEventListener("keydown",i=>{var s;i.key==="Escape"&&((s=this.modal)==null?void 0:s.style.display)==="flex"&&this.close()});const a=document.getElementById("editEntrySignBtn");a==null||a.addEventListener("click",()=>this.toggleSign()),(c=this.form)==null||c.addEventListener("submit",i=>this.handleSubmit(i)),this.setupCategoryAutocomplete(),this.setupDescriptionAutocomplete(),this.setupAccountAutocomplete()}setupCategoryAutocomplete(){const e=document.getElementById("editEntryCategory");if(!e)return;let t=this.ensureSuggestionsContainer("editCatSuggestions",e);e.addEventListener("focus",()=>{this.categories.length>0&&this.showAllSuggestions(e,t,this.categories)}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.categories)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}setupDescriptionAutocomplete(){const e=document.getElementById("editEntryDescription");if(!e)return;let t=this.ensureSuggestionsContainer("editDescSuggestions",e);e.addEventListener("focus",()=>{this.descriptions.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.descriptions,o=>{this.autoFillCategoryFromDescription(o)}))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.descriptions,a=>{this.autoFillCategoryFromDescription(a)})}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}autoFillCategoryFromDescription(e){const t=this.entries.find(a=>a.descricao&&a.descricao.trim().toLowerCase()===e.toLowerCase());if(t&&t.categoria){const a=document.getElementById("editEntryCategory");a&&(a.value=t.categoria)}}setupAccountAutocomplete(){const e=document.getElementById("editEntryAccount");if(!e)return;let t=this.ensureSuggestionsContainer("editAccountSuggestions",e);e.addEventListener("focus",()=>{this.accounts.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.accounts))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.accounts)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}ensureSuggestionsContainer(e,t){let a=document.getElementById(e);if(!a){a=document.createElement("div"),a.id=e,a.classList.add("entry-modal__suggestions"),a.setAttribute("role","listbox");const o=t.parentElement;o&&(o.style.position=o.style.position||"relative",o.appendChild(a))}return a}showAllSuggestions(e,t,a,o){if(t.innerHTML="",a.length===0){t.style.display="none";return}a.slice(0,20).forEach(i=>{const s=document.createElement("div");s.setAttribute("role","option"),s.classList.add("entry-modal__suggestion"),s.textContent=i,s.addEventListener("click",()=>{e.value=i,t.style.display="none",e.focus(),o&&o(i)}),t.appendChild(s)}),t.style.display="block"}showSuggestions(e,t,a,o){t.innerHTML="";const c=e.value.trim().toLowerCase();if(!c||c.length<1){this.showAllSuggestions(e,t,a,o);return}if(a.length===0){t.style.display="none";return}const i=a.filter(s=>s.toLowerCase().includes(c));if(i.length===0){t.style.display="none";return}i.forEach(s=>{const l=document.createElement("div");l.setAttribute("role","option"),l.classList.add("entry-modal__suggestion"),l.textContent=s,l.addEventListener("click",()=>{e.value=s,t.style.display="none",e.focus(),o&&o(s)}),t.appendChild(l)}),t.style.display="block"}formatDateTimeLocal(e){const[t,a]=e.split("T"),[o,c,i]=t.split("-");return`${i}/${c}/${o} ${a}`}formatDate(e){const[t,a,o]=e.split("-");return`${o}/${a}/${t}`}toggleSign(){var a;const e=document.getElementById("editEntrySignBtn"),t=((a=e==null?void 0:e.textContent)==null?void 0:a.trim())==="−";this.setSignState(!t)}setSignState(e){const t=document.getElementById("editEntrySignBtn"),a=document.getElementById("editEntrySignValue");!t||!a||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),a.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),a.value="+"))}open(e){var o;if(!this.modal||!e)return;console.log("[EditEntryModal] Abrindo modal para edição:",e),this.currentEntry=e,this.populateForm(e),this.modal.style.display="flex",this.modal.setAttribute("aria-hidden","false");const t=document.getElementById("openEntryModal");t&&(t.style.visibility="hidden",console.log("[EditEntryModal] ✅ Botão FAB oculto"));const a=(o=this.form)==null?void 0:o.querySelector("input");a==null||a.focus()}applySignState(e){const t=document.getElementById("editEntrySignBtn"),a=document.getElementById("editEntrySignValue");!t||!a||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),a.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),a.value="+"))}populateForm(e){const t=document.getElementById("editEntryDate");if(t&&e.data){let d="";if(typeof e.data=="number"){const m=L(e.data,!0);m&&(d=B(m))}else if(typeof e.data=="string"){const m=R(e.data);m&&(d=B(m))}t.value=d}else t&&(t.value="");const a=document.getElementById("editEntryAccount");a&&(a.value=e.conta||"");const o=document.getElementById("editEntryValue");if(o&&e.valor!==void 0){const d=Math.abs(e.valor);o.value=d.toString(),this.applySignState(e.valor<0)}const c=document.getElementById("editEntryDescription");c&&(c.value=e.descricao||"");const i=document.getElementById("editEntryCategory");i&&(i.value=e.categoria||"");const s=document.getElementById("editEntryBudget");if(s&&e.orcamento){let d="";if(typeof e.orcamento=="number"){const m=L(e.orcamento,!1);m&&(d=m.toISOString().split("T")[0])}else if(typeof e.orcamento=="string"){const m=N(e.orcamento);m&&(d=m.toISOString().split("T")[0])}s.value=d}const l=document.getElementById("editEntryObs");l&&(l.value=e.obs||"")}close(){if(!this.modal)return;this.modal.style.display="none",this.modal.setAttribute("aria-hidden","true"),this.currentEntry=null;const e=document.getElementById("openEntryModal");e&&(e.style.visibility="visible",console.log("[EditEntryModal] ✅ Botão FAB visível")),this.form&&this.form.reset(),this.clearFeedback()}isOpen(){var e;return((e=this.modal)==null?void 0:e.style.display)==="flex"}async handleSubmit(e){if(e.preventDefault(),!this.form||!this.currentEntry||!this.currentEntry.rowIndex){console.error("[EditEntryModal] Dados insuficientes para edição");return}const t=new FormData(this.form),a=document.getElementById("saveEditEntryBtn");a&&(a.disabled=!0,a.textContent="Salvando...");try{const o=t.get("data"),c=t.get("orcamento"),i=parseFloat(t.get("valor")),s=t.get("sinal"),l=new Date(c);if(isNaN(l.getTime()))throw new Error("Data de orçamento inválida");let d="";if(o&&o.trim()!==""){if(!o.includes("T"))throw new Error("Formato de data/hora inválido");const v=new Date(o);if(isNaN(v.getTime()))throw new Error("Data inválida");d=this.formatDateTimeLocal(o)}const m=s==="−"||s==="-"?-Math.abs(i):Math.abs(i),p=this.formatDate(c),u={data:d,conta:t.get("conta"),valor:m,descricao:t.get("descricao"),categoria:t.get("categoria"),orcamento:p,obs:t.get("observacoes")||""};console.log("[EditEntryModal] 📤 Enviando edição:",u),await y.editEntry(this.currentEntry.rowIndex,u),this.showFeedback("✅ Lançamento editado com sucesso!","success"),setTimeout(()=>{var b;this.close();const v=new CustomEvent("entry:edited",{detail:{rowIndex:(b=this.currentEntry)==null?void 0:b.rowIndex,entry:u}});document.dispatchEvent(v),this.callback&&this.callback({success:!0,entry:u})},500)}catch(o){console.error("[EditEntryModal] ❌ Erro ao editar:",o),this.showFeedback(`❌ Erro: ${o instanceof Error?o.message:"Erro desconhecido"}`,"error")}finally{a&&(a.disabled=!1,a.textContent="Salvar")}}showFeedback(e,t){const a=document.getElementById("editEntryFeedback");a&&(a.textContent=e,a.className=`modal-feedback modal-feedback--${t}`,a.style.display="block",(t==="success"||t==="error")&&setTimeout(()=>{this.clearFeedback()},5e3))}clearFeedback(){const e=document.getElementById("editEntryFeedback");e&&(e.className="modal-feedback",e.textContent="",e.style.display="none")}async setEntries(e){this.entries=e,this.accounts=y.getUniqueAccounts(e),this.descriptions=y.getUniqueDescriptions(e);const t=y.getUniqueCategories(e);try{const{SheetsService:a}=await ee(async()=>{const{SheetsService:o}=await import("./sheets.js");return{SheetsService:o}},__vite__mapDeps([0,1,2,3]));this.categoriesComplete=await a.getSheetCategoriesComplete(),this.categoriesComplete.length>0?(this.categories=this.categoriesComplete.map(o=>o.categoria),console.log("[EditEntryModal] Categorias completas carregadas:",this.categoriesComplete.length)):(this.categories=t,console.log("[EditEntryModal] Usando categorias dos entries:",this.categories.length))}catch(a){console.warn("[EditEntryModal] Erro ao carregar categorias completas, usando entries:",a),this.categories=t}}}async function ne(n){if(f)return console.log("[EditEntryModal] Reutilizando instância existente"),f;try{return f=new te,await f.init(n),f}catch(e){return console.error("[EditEntryModal] Erro ao inicializar:",e),null}}function ae(n){f?f.open(n):console.error("[EditEntryModal] Modal não inicializado")}function oe(n){f&&f.setEntries(n)}function D(n){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n)}function k(n){return n?typeof n=="number"?M(n):String(n):"-"}function F(n){return n?typeof n=="number"?P(n):String(n):"-"}function A(n){return`
    <button class="button small" onclick="window.editEntry(${n.rowIndex})" title="Editar">
      ✏️ Editar
    </button>
    <button class="button small danger" onclick="window.deleteEntry(${n.rowIndex})" title="Excluir">
      🗑️ Excluir
    </button>
  `}function se(n){return n.length===0?`
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
        <div class="lancamentos__table-cell">${k(t.data)}</div>
        <div class="lancamentos__table-cell">${t.conta||"-"}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--number ${a}">
          ${D(t.valor)}
        </div>
        <div class="lancamentos__table-cell">${t.descricao||"-"}</div>
        <div class="lancamentos__table-cell">${t.categoria||"-"}</div>
        <div class="lancamentos__table-cell">${F(t.orcamento)}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--actions">
          ${A(t)}
        </div>
      </div>
    `}).join("")}
    </div>
  `}function ie(n){return n.length===0?`
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
              <span class="lancamentos__item-value">${k(t.data)}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Conta:</span>
              <span class="lancamentos__item-value">${t.conta||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Valor:</span>
              <span class="lancamentos__item-value lancamentos__item-value--valor ${a}">
                ${D(t.valor)}
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
              <span class="lancamentos__item-value">${F(t.orcamento)}</span>
            </div>
          </div>
        </div>
        <div class="lancamentos__item-actions">
          ${A(t)}
        </div>
      </div>
    `}).join("")}
    </div>
  `}function le(n){return`
    ${se(n)}
    ${ie(n)}
  `}const r={entries:[],filteredEntries:[],originalEntries:[],searchTerm:"",sortBy:"original",showConsolidated:!0,showFuture:!1,isLoading:!1};function re(){const n=document.getElementById("loadingIndicator");n&&(n.style.display="flex")}function ce(){const n=document.getElementById("loadingIndicator");n&&(n.style.display="none")}function _(n,e="info"){e==="success"?K(n):e==="error"?Q(n):X(n,"Info")}function de(){const n=document.getElementById("searchResults"),e=document.getElementById("searchCount"),t=document.getElementById("clearSearchBtn");!n||!e||!t||(r.searchTerm?(e.textContent=`${r.filteredEntries.length} resultado(s) encontrado(s)`,n.classList.add("lancamentos__search-results--visible"),t.style.display="flex"):(n.classList.remove("lancamentos__search-results--visible"),t.style.display="none"))}async function E(n=!1){if(!r.isLoading){r.isLoading=!0,r.entries=[],I(),n||re();try{const a=((await y.fetchEntries(0,n)).entries||[]).filter(c=>!y.isBlankEntry(c));r.originalEntries=a,r.entries=[...r.originalEntries],h(),_("Lançamentos carregados com sucesso"+(n?" (cache atualizado)":""),"success")}catch(e){console.error("Erro ao carregar lançamentos:",e),_("Erro ao carregar lançamentos: "+e.message,"error"),r.entries=[],r.filteredEntries=[],I()}finally{r.isLoading=!1,n||ce()}}}function h(){let n=[...r.originalEntries];n=n.filter(e=>e.data!==null&&e.data!==void 0&&!(typeof e.data=="string"&&e.data.trim()==="")?r.showConsolidated:r.showFuture),n=y.sortEntries(n,r.sortBy),r.searchTerm&&(n=y.filterEntries(n,r.searchTerm)),r.filteredEntries=n,r.entries=n,I(),de()}function I(){const n=document.getElementById("entriesContainer");if(!n)return;const t=r.filteredEntries.slice(0,100);n.innerHTML=le(t)}function me(n){r.sortBy=n,h()}function ue(n){r.showConsolidated=n,h()}function ge(n){r.showFuture=n,h()}function C(n){r.searchTerm=n.trim(),h()}function fe(){const n=document.getElementById("searchInput");n&&(n.value=""),r.searchTerm="",h()}function ye(n){const e=r.originalEntries.find(t=>t.rowIndex===n);e?ae(e):console.error("Lançamento não encontrado:",n)}let w=null;function Ee(n){const e=r.originalEntries.find(s=>s.rowIndex===n);if(!e){console.error("Lançamento não encontrado:",n);return}w=n;const t=document.getElementById("deleteRowNumber"),a=document.getElementById("deleteDate"),o=document.getElementById("deleteValue"),c=document.getElementById("deleteDescription");if(t&&(t.textContent=String(e.rowIndex||"-")),a){let s="-";e.data&&(typeof e.data=="number"?s=M(e.data):typeof e.data=="string"&&(s=e.data)),a.textContent=s}o&&(o.textContent=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(e.valor)),c&&(c.textContent=e.descricao||"-");const i=document.getElementById("deleteModal");i&&(i.style.display="flex")}function $(){w=null;const n=document.getElementById("deleteModal");n&&(n.style.display="none")}async function pe(){if(w===null){console.error("Nenhum lançamento pendente para exclusão");return}const n=w,e=document.getElementById("deleteConfirmBtn");e&&(e.disabled=!0,e.textContent="Excluindo...");try{await y.deleteEntry(n),_("Lançamento excluído com sucesso","success"),$(),await E()}catch(t){console.error("Erro ao deletar lançamento:",t),_("Erro ao deletar lançamento: "+t.message,"error")}finally{e&&(e.disabled=!1,e.textContent="Excluir")}}function he(n){Ee(n)}window.editEntry=ye;window.deleteEntry=he;window.lancamentosManager={closeDeleteModal:$,confirmDelete:pe,closeSplitModal:()=>{const n=document.getElementById("splitModal");n&&(n.style.display="none")},confirmSplit:()=>{console.warn("Funcionalidade de divisão de parcelas não implementada")}};async function T(){if(console.log("[Lançamentos] Inicializando página..."),!await q()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}J(),await j(l=>{console.log("✅ Lançamento adicionado:",l),E()}),await ne(l=>{console.log("✅ Lançamento editado:",l),E()}),await z(l=>{console.log("✅ Lançamento futuro adicionado:",l),E()}),await U(l=>{console.log("✅ Transferência realizada:",l),E()}),H(()=>S(),()=>G(),()=>W());const e=document.getElementById("openAddEntryModalBtn");e&&e.addEventListener("click",()=>{console.log("🔓 Abrindo modal de adicionar lançamento..."),S()});const t=document.getElementById("refreshEntriesBtn");t&&t.addEventListener("click",async()=>{console.log("🔄 Atualizando lançamentos (forceRefresh=true)...");const l=t.innerHTML;t.disabled=!0,t.innerHTML="⏳ Atualizando...";try{await E(!0)}finally{t.disabled=!1,t.innerHTML=l}});const a=document.getElementById("searchInput");a&&a.addEventListener("input",l=>{C(l.target.value)});const o=document.getElementById("clearSearchBtn");o&&o.addEventListener("click",()=>{fe()});const c=document.getElementById("sortSelect");c&&(c.value=r.sortBy,c.addEventListener("change",l=>{me(l.target.value)}));const i=document.getElementById("showConsolidatedCheck");i&&(i.checked=r.showConsolidated,i.addEventListener("change",l=>{ue(l.target.checked)}));const s=document.getElementById("showFutureCheck");s&&(s.checked=r.showFuture,s.addEventListener("change",l=>{ge(l.target.checked)})),document.addEventListener("entry:edited",()=>{console.log("📝 Entrada editada, recarregando..."),setTimeout(()=>{E()},300)}),await E(),oe(r.originalEntries),ve(),console.log("✅ Página de lançamentos inicializada")}function ve(){const n=new URLSearchParams(window.location.search),e=n.get("conta"),t=n.get("categoria");e?(console.log("[Lançamentos] Filtrando por conta:",e),C(e)):t&&(console.log("[Lançamentos] Filtrando por categoria:",t),C(t));const a=document.getElementById("searchInput");a&&(e||t)&&(a.value=e||t||"")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",T):T();
