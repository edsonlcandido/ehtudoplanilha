const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/sheets.js","assets/auth.js","assets/auth2.css","assets/sheets.css"])))=>i.map(i=>d[i]);
var V=Object.defineProperty;var O=(n,e,t)=>e in n?V(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var f=(n,e,t)=>O(n,typeof e!="symbol"?e+"":e,t);import{v as R}from"./auth.js";import"./sheets.js";import{h as I,j as L,k as q,m as P,l as y,n as k,e as N,i as j,a as z,b as U,c as H,o as W,d as G,f as S}from"./fab-menu.js";import{r as J}from"./user-menu.js";import{a as K,s as Q,b as X}from"./toast.js";const Y="modulepreload",Z=function(n){return"/"+n},C={},ee=function(e,t,a){let o=Promise.resolve();if(t&&t.length>0){let r=function(d){return Promise.all(d.map(i=>Promise.resolve(i).then(g=>({status:"fulfilled",value:g}),g=>({status:"rejected",reason:g}))))};document.getElementsByTagName("link");const s=document.querySelector("meta[property=csp-nonce]"),m=(s==null?void 0:s.nonce)||(s==null?void 0:s.getAttribute("nonce"));o=r(t.map(d=>{if(d=Z(d),d in C)return;C[d]=!0;const i=d.endsWith(".css"),g=i?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${g}`))return;const u=document.createElement("link");if(u.rel=i?"stylesheet":Y,i||(u.as="script"),u.crossOrigin="",u.href=d,m&&u.setAttribute("nonce",m),document.head.appendChild(u),i)return new Promise((h,b)=>{u.addEventListener("load",h),u.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${d}`)))})}))}function c(r){const s=new Event("vite:preloadError",{cancelable:!0});if(s.payload=r,window.dispatchEvent(s),!s.defaultPrevented)throw r}return o.then(r=>{for(const s of r||[])s.status==="rejected"&&c(s.reason);return e().catch(c)})};let E=null;class te{constructor(){f(this,"modal",null);f(this,"form",null);f(this,"callback");f(this,"currentEntry",null);f(this,"accounts",[]);f(this,"categories",[]);f(this,"categoriesComplete",[]);f(this,"descriptions",[]);f(this,"entries",[])}getTemplate(){return`
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
    `}async init(e){if(console.log("[EditEntryModal] Inicializando..."),this.callback=e,document.body.insertAdjacentHTML("beforeend",this.getTemplate()),this.modal=document.getElementById("editEntryModal"),this.form=document.getElementById("editEntryForm"),!this.modal||!this.form)throw new Error("[EditEntryModal] Elementos do modal não encontrados");this.setupEventListeners(),console.log("[EditEntryModal] ✅ Inicializado com sucesso")}setupEventListeners(){var o,c;const e=document.getElementById("closeEditEntryModal");e==null||e.addEventListener("click",()=>this.close());const t=document.getElementById("cancelEditEntryBtn");t==null||t.addEventListener("click",()=>this.close()),(o=this.modal)==null||o.addEventListener("click",r=>{r.target===this.modal&&this.close()}),document.addEventListener("keydown",r=>{var s;r.key==="Escape"&&((s=this.modal)==null?void 0:s.style.display)==="flex"&&this.close()});const a=document.getElementById("editEntrySignBtn");a==null||a.addEventListener("click",()=>this.toggleSign()),(c=this.form)==null||c.addEventListener("submit",r=>this.handleSubmit(r)),this.setupCategoryAutocomplete(),this.setupDescriptionAutocomplete(),this.setupAccountAutocomplete()}setupCategoryAutocomplete(){const e=document.getElementById("editEntryCategory");if(!e)return;let t=this.ensureSuggestionsContainer("editCatSuggestions",e);e.addEventListener("focus",()=>{this.categories.length>0&&this.showAllSuggestions(e,t,this.categories)}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.categories)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}setupDescriptionAutocomplete(){const e=document.getElementById("editEntryDescription");if(!e)return;let t=this.ensureSuggestionsContainer("editDescSuggestions",e);e.addEventListener("focus",()=>{this.descriptions.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.descriptions,o=>{this.autoFillCategoryFromDescription(o)}))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.descriptions,a=>{this.autoFillCategoryFromDescription(a)})}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}autoFillCategoryFromDescription(e){const t=this.entries.find(a=>a.descricao&&a.descricao.trim().toLowerCase()===e.toLowerCase());if(t&&t.categoria){const a=document.getElementById("editEntryCategory");a&&(a.value=t.categoria)}}setupAccountAutocomplete(){const e=document.getElementById("editEntryAccount");if(!e)return;let t=this.ensureSuggestionsContainer("editAccountSuggestions",e);e.addEventListener("focus",()=>{this.accounts.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.accounts))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.accounts)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}ensureSuggestionsContainer(e,t){let a=document.getElementById(e);if(!a){a=document.createElement("div"),a.id=e,a.classList.add("entry-modal__suggestions"),a.setAttribute("role","listbox");const o=t.parentElement;o&&(o.style.position=o.style.position||"relative",o.appendChild(a))}return a}showAllSuggestions(e,t,a,o){if(t.innerHTML="",a.length===0){t.style.display="none";return}a.slice(0,20).forEach(r=>{const s=document.createElement("div");s.setAttribute("role","option"),s.classList.add("entry-modal__suggestion"),s.textContent=r,s.addEventListener("click",()=>{e.value=r,t.style.display="none",e.focus(),o&&o(r)}),t.appendChild(s)}),t.style.display="block"}showSuggestions(e,t,a,o){t.innerHTML="";const c=e.value.trim().toLowerCase();if(!c||c.length<1){this.showAllSuggestions(e,t,a,o);return}if(a.length===0){t.style.display="none";return}const r=a.filter(s=>s.toLowerCase().includes(c));if(r.length===0){t.style.display="none";return}r.forEach(s=>{const m=document.createElement("div");m.setAttribute("role","option"),m.classList.add("entry-modal__suggestion"),m.textContent=s,m.addEventListener("click",()=>{e.value=s,t.style.display="none",e.focus(),o&&o(s)}),t.appendChild(m)}),t.style.display="block"}formatDateTimeLocal(e){const[t,a]=e.split("T"),[o,c,r]=t.split("-");return`${r}/${c}/${o} ${a}`}formatDate(e){const[t,a,o]=e.split("-");return`${o}/${a}/${t}`}toggleSign(){var a;const e=document.getElementById("editEntrySignBtn"),t=((a=e==null?void 0:e.textContent)==null?void 0:a.trim())==="−";this.setSignState(!t)}setSignState(e){const t=document.getElementById("editEntrySignBtn"),a=document.getElementById("editEntrySignValue");!t||!a||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),a.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),a.value="+"))}open(e){var o;if(!this.modal||!e)return;console.log("[EditEntryModal] Abrindo modal para edição:",e),this.currentEntry=e,this.populateForm(e),this.modal.style.display="flex",this.modal.setAttribute("aria-hidden","false");const t=document.getElementById("openEntryModal");t&&(t.style.visibility="hidden",console.log("[EditEntryModal] ✅ Botão FAB oculto"));const a=(o=this.form)==null?void 0:o.querySelector("input");a==null||a.focus()}applySignState(e){const t=document.getElementById("editEntrySignBtn"),a=document.getElementById("editEntrySignValue");!t||!a||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),a.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),a.value="+"))}populateForm(e){const t=document.getElementById("editEntryDate");if(t&&e.data){let d="";if(typeof e.data=="number"){const i=I(e.data,!0);i&&(d=L(i))}else if(typeof e.data=="string"){const i=q(e.data);i&&(d=L(i))}t.value=d}else t&&(t.value="");const a=document.getElementById("editEntryAccount");a&&(a.value=e.conta||"");const o=document.getElementById("editEntryValue");if(o&&e.valor!==void 0){const d=Math.abs(e.valor);o.value=d.toString(),this.applySignState(e.valor<0)}const c=document.getElementById("editEntryDescription");c&&(c.value=e.descricao||"");const r=document.getElementById("editEntryCategory");r&&(r.value=e.categoria||"");const s=document.getElementById("editEntryBudget");if(s&&e.orcamento){let d="";if(typeof e.orcamento=="number"){const i=I(e.orcamento,!1);i&&(d=i.toISOString().split("T")[0])}else if(typeof e.orcamento=="string"){const i=P(e.orcamento);i&&(d=i.toISOString().split("T")[0])}s.value=d}const m=document.getElementById("editEntryObs");m&&(m.value=e.obs||"")}close(){if(!this.modal)return;this.modal.style.display="none",this.modal.setAttribute("aria-hidden","true"),this.currentEntry=null;const e=document.getElementById("openEntryModal");e&&(e.style.visibility="visible",console.log("[EditEntryModal] ✅ Botão FAB visível")),this.form&&this.form.reset(),this.clearFeedback()}isOpen(){var e;return((e=this.modal)==null?void 0:e.style.display)==="flex"}async handleSubmit(e){if(e.preventDefault(),!this.form||!this.currentEntry||!this.currentEntry.rowIndex){console.error("[EditEntryModal] Dados insuficientes para edição");return}const t=new FormData(this.form),a=document.getElementById("saveEditEntryBtn");a&&(a.disabled=!0,a.textContent="Salvando...");try{const o=t.get("data"),c=t.get("orcamento"),r=parseFloat(t.get("valor")),s=t.get("sinal"),m=new Date(c);if(isNaN(m.getTime()))throw new Error("Data de orçamento inválida");let d="";if(o&&o.trim()!==""){if(!o.includes("T"))throw new Error("Formato de data/hora inválido");const h=new Date(o);if(isNaN(h.getTime()))throw new Error("Data inválida");d=this.formatDateTimeLocal(o)}const i=s==="−"||s==="-"?-Math.abs(r):Math.abs(r),g=this.formatDate(c),u={data:d,conta:t.get("conta"),valor:i,descricao:t.get("descricao"),categoria:t.get("categoria"),orcamento:g,obs:t.get("observacoes")||""};console.log("[EditEntryModal] 📤 Enviando edição:",u),await y.editEntry(this.currentEntry.rowIndex,u),this.showFeedback("✅ Lançamento editado com sucesso!","success"),setTimeout(()=>{var b;this.close();const h=new CustomEvent("entry:edited",{detail:{rowIndex:(b=this.currentEntry)==null?void 0:b.rowIndex,entry:u}});document.dispatchEvent(h),this.callback&&this.callback({success:!0,entry:u})},500)}catch(o){console.error("[EditEntryModal] ❌ Erro ao editar:",o),this.showFeedback(`❌ Erro: ${o instanceof Error?o.message:"Erro desconhecido"}`,"error")}finally{a&&(a.disabled=!1,a.textContent="Salvar")}}showFeedback(e,t){const a=document.getElementById("editEntryFeedback");a&&(a.textContent=e,a.className=`modal-feedback modal-feedback--${t}`,a.style.display="block",(t==="success"||t==="error")&&setTimeout(()=>{this.clearFeedback()},5e3))}clearFeedback(){const e=document.getElementById("editEntryFeedback");e&&(e.className="modal-feedback",e.textContent="",e.style.display="none")}async setEntries(e){this.entries=e,this.accounts=y.getUniqueAccounts(e),this.descriptions=y.getUniqueDescriptions(e);const t=y.getUniqueCategories(e);try{const{SheetsService:a}=await ee(async()=>{const{SheetsService:o}=await import("./sheets.js");return{SheetsService:o}},__vite__mapDeps([0,1,2,3]));this.categoriesComplete=await a.getSheetCategoriesComplete(),this.categoriesComplete.length>0?(this.categories=this.categoriesComplete.map(o=>o.categoria),console.log("[EditEntryModal] Categorias completas carregadas:",this.categoriesComplete.length)):(this.categories=t,console.log("[EditEntryModal] Usando categorias dos entries:",this.categories.length))}catch(a){console.warn("[EditEntryModal] Erro ao carregar categorias completas, usando entries:",a),this.categories=t}}}async function ne(n){if(E)return console.log("[EditEntryModal] Reutilizando instância existente"),E;try{return E=new te,await E.init(n),E}catch(e){return console.error("[EditEntryModal] Erro ao inicializar:",e),null}}function ae(n){E?E.open(n):console.error("[EditEntryModal] Modal não inicializado")}function oe(n){E&&E.setEntries(n)}function T(n){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n)}function M(n){return n?typeof n=="number"?k(n):String(n):"-"}function A(n){return n?typeof n=="number"?N(n):String(n):"-"}function $(n){return`
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
        <div class="lancamentos__table-cell">${M(t.data)}</div>
        <div class="lancamentos__table-cell">${t.conta||"-"}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--number ${a}">
          ${T(t.valor)}
        </div>
        <div class="lancamentos__table-cell">${t.descricao||"-"}</div>
        <div class="lancamentos__table-cell">${t.categoria||"-"}</div>
        <div class="lancamentos__table-cell">${A(t.orcamento)}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--actions">
          ${$(t)}
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
              <span class="lancamentos__item-value">${M(t.data)}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Conta:</span>
              <span class="lancamentos__item-value">${t.conta||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Valor:</span>
              <span class="lancamentos__item-value lancamentos__item-value--valor ${a}">
                ${T(t.valor)}
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
              <span class="lancamentos__item-value">${A(t.orcamento)}</span>
            </div>
          </div>
        </div>
        <div class="lancamentos__item-actions">
          ${$(t)}
        </div>
      </div>
    `}).join("")}
    </div>
  `}function le(n){return`
    ${se(n)}
    ${ie(n)}
  `}const l={entries:[],filteredEntries:[],originalEntries:[],searchTerm:"",sortBy:"original",hideBlankDates:!0,isLoading:!1};function re(){const n=document.getElementById("loadingIndicator");n&&(n.style.display="flex")}function ce(){const n=document.getElementById("loadingIndicator");n&&(n.style.display="none")}function _(n,e="info"){e==="success"?K(n):e==="error"?Q(n):X(n,"Info")}function de(){const n=document.getElementById("searchResults"),e=document.getElementById("searchCount"),t=document.getElementById("clearSearchBtn");!n||!e||!t||(l.searchTerm?(e.textContent=`${l.filteredEntries.length} resultado(s) encontrado(s)`,n.classList.add("lancamentos__search-results--visible"),t.style.display="flex"):(n.classList.remove("lancamentos__search-results--visible"),t.style.display="none"))}async function p(n=!1){if(!l.isLoading){l.isLoading=!0,l.entries=[],B(),re();try{const a=((await y.fetchEntries(0,n)).entries||[]).filter(c=>!y.isBlankEntry(c));l.originalEntries=a,l.entries=[...l.originalEntries],v(),_("Lançamentos carregados com sucesso"+(n?" (cache atualizado)":""),"success")}catch(e){console.error("Erro ao carregar lançamentos:",e),_("Erro ao carregar lançamentos: "+e.message,"error"),l.entries=[],l.filteredEntries=[],B()}finally{l.isLoading=!1,ce()}}}function v(){let n=[...l.originalEntries];l.hideBlankDates&&(n=n.filter(e=>!(e.data===null||e.data===void 0||typeof e.data=="string"&&e.data.trim()===""))),n=y.sortEntries(n,l.sortBy),l.searchTerm&&(n=y.filterEntries(n,l.searchTerm)),l.filteredEntries=n,l.entries=l.sortBy==="original"?[...l.originalEntries]:y.sortEntries([...l.originalEntries],l.sortBy),B(),de()}function B(){const n=document.getElementById("entriesContainer");if(!n)return;const t=(l.searchTerm||l.filteredEntries.length>0?l.filteredEntries:l.entries).slice(0,100);n.innerHTML=le(t)}function me(n){l.sortBy=n,v()}function ue(n){l.hideBlankDates=n,v()}function x(n){l.searchTerm=n.trim(),v()}function ge(){const n=document.getElementById("searchInput");n&&(n.value=""),l.searchTerm="",v()}function fe(n){const e=l.entries.find(t=>t.rowIndex===n);e?ae(e):console.error("Lançamento não encontrado:",n)}let w=null;function ye(n){const e=l.entries.find(s=>s.rowIndex===n);if(!e){console.error("Lançamento não encontrado:",n);return}w=n;const t=document.getElementById("deleteRowNumber"),a=document.getElementById("deleteDate"),o=document.getElementById("deleteValue"),c=document.getElementById("deleteDescription");if(t&&(t.textContent=String(e.rowIndex||"-")),a){let s="-";e.data&&(typeof e.data=="number"?s=k(e.data):typeof e.data=="string"&&(s=e.data)),a.textContent=s}o&&(o.textContent=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(e.valor)),c&&(c.textContent=e.descricao||"-");const r=document.getElementById("deleteModal");r&&(r.style.display="flex")}function F(){w=null;const n=document.getElementById("deleteModal");n&&(n.style.display="none")}async function Ee(){if(w===null){console.error("Nenhum lançamento pendente para exclusão");return}const n=w,e=document.getElementById("deleteConfirmBtn");e&&(e.disabled=!0,e.textContent="Excluindo...");try{await y.deleteEntry(n),_("Lançamento excluído com sucesso","success"),F(),await p()}catch(t){console.error("Erro ao deletar lançamento:",t),_("Erro ao deletar lançamento: "+t.message,"error")}finally{e&&(e.disabled=!1,e.textContent="Excluir")}}function pe(n){ye(n)}window.editEntry=fe;window.deleteEntry=pe;window.lancamentosManager={closeDeleteModal:F,confirmDelete:Ee,closeSplitModal:()=>{const n=document.getElementById("splitModal");n&&(n.style.display="none")},confirmSplit:()=>{console.warn("Funcionalidade de divisão de parcelas não implementada")}};async function D(){if(console.log("[Lançamentos] Inicializando página..."),!await R()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}J(),await j(i=>{console.log("✅ Lançamento adicionado:",i),p()}),await ne(i=>{console.log("✅ Lançamento editado:",i),p()}),await z(i=>{console.log("✅ Lançamento futuro adicionado:",i),p()}),await U(i=>{console.log("✅ Transferência realizada:",i),p()}),H(()=>S(),()=>G(),()=>W());const e=document.getElementById("openAddEntryModalBtn");e&&e.addEventListener("click",()=>{console.log("🔓 Abrindo modal de adicionar lançamento..."),S()});const t=document.getElementById("refreshEntriesBtn");t&&t.addEventListener("click",()=>{console.log("🔄 Atualizando lançamentos (forceRefresh=true)..."),p(!0)});const a=document.getElementById("searchInput");a&&a.addEventListener("input",i=>{x(i.target.value)});const o=document.getElementById("clearSearchBtn");o&&o.addEventListener("click",()=>{ge()});const c=document.getElementById("sortSelect");c&&(c.value=l.sortBy,c.addEventListener("change",i=>{me(i.target.value)}));const r=document.getElementById("hideBlankDatesCheck");r&&(r.checked=l.hideBlankDates,r.addEventListener("change",i=>{ue(i.target.checked)})),document.addEventListener("entry:edited",()=>{console.log("📝 Entrada editada, recarregando..."),setTimeout(()=>{p()},300)}),await p(),oe(l.entries);const s=new URLSearchParams(window.location.search),m=s.get("conta"),d=s.get("categoria");if(m||d){const i=document.getElementById("searchInput");if(i){const g=m||d||"";i.value=g,x(g),console.log(`🔍 Filtro aplicado automaticamente: ${m?"conta":"categoria"} = ${g}`)}}console.log("✅ Página de lançamentos inicializada")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",D):D();
