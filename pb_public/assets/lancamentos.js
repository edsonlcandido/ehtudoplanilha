const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/sheets.js","assets/auth.js","assets/auth2.css","assets/sheets.css"])))=>i.map(i=>d[i]);
var V=Object.defineProperty;var O=(n,e,t)=>e in n?V(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var g=(n,e,t)=>O(n,typeof e!="symbol"?e+"":e,t);import{v as R}from"./auth.js";import"./sheets.js";import{e as L,j as S,k as q,m as N,l as f,n as k,a as P,i as j,b as z,c as U,d as H,o as W,f as G,h as C}from"./fab-menu.js";import{r as J}from"./user-menu.js";import{a as K,s as Q,b as X}from"./toast.js";const Y="modulepreload",Z=function(n){return"/"+n},x={},ee=function(e,t,a){let s=Promise.resolve();if(t&&t.length>0){let l=function(c){return Promise.all(c.map(d=>Promise.resolve(d).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),m=(o==null?void 0:o.nonce)||(o==null?void 0:o.getAttribute("nonce"));s=l(t.map(c=>{if(c=Z(c),c in x)return;x[c]=!0;const d=c.endsWith(".css"),p=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${p}`))return;const u=document.createElement("link");if(u.rel=d?"stylesheet":Y,d||(u.as="script"),u.crossOrigin="",u.href=c,m&&u.setAttribute("nonce",m),document.head.appendChild(u),d)return new Promise((h,b)=>{u.addEventListener("load",h),u.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${c}`)))})}))}function r(l){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=l,window.dispatchEvent(o),!o.defaultPrevented)throw l}return s.then(l=>{for(const o of l||[])o.status==="rejected"&&r(o.reason);return e().catch(r)})};let y=null;class te{constructor(){g(this,"modal",null);g(this,"form",null);g(this,"callback");g(this,"currentEntry",null);g(this,"accounts",[]);g(this,"categories",[]);g(this,"categoriesComplete",[]);g(this,"descriptions",[]);g(this,"entries",[])}getTemplate(){return`
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
    `}async init(e){if(console.log("[EditEntryModal] Inicializando..."),this.callback=e,document.body.insertAdjacentHTML("beforeend",this.getTemplate()),this.modal=document.getElementById("editEntryModal"),this.form=document.getElementById("editEntryForm"),!this.modal||!this.form)throw new Error("[EditEntryModal] Elementos do modal não encontrados");this.setupEventListeners(),console.log("[EditEntryModal] ✅ Inicializado com sucesso")}setupEventListeners(){var s,r;const e=document.getElementById("closeEditEntryModal");e==null||e.addEventListener("click",()=>this.close());const t=document.getElementById("cancelEditEntryBtn");t==null||t.addEventListener("click",()=>this.close()),(s=this.modal)==null||s.addEventListener("click",l=>{l.target===this.modal&&this.close()}),document.addEventListener("keydown",l=>{var o;l.key==="Escape"&&((o=this.modal)==null?void 0:o.style.display)==="flex"&&this.close()});const a=document.getElementById("editEntrySignBtn");a==null||a.addEventListener("click",()=>this.toggleSign()),(r=this.form)==null||r.addEventListener("submit",l=>this.handleSubmit(l)),this.setupCategoryAutocomplete(),this.setupDescriptionAutocomplete(),this.setupAccountAutocomplete()}setupCategoryAutocomplete(){const e=document.getElementById("editEntryCategory");if(!e)return;let t=this.ensureSuggestionsContainer("editCatSuggestions",e);e.addEventListener("focus",()=>{this.categories.length>0&&this.showAllSuggestions(e,t,this.categories)}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.categories)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}setupDescriptionAutocomplete(){const e=document.getElementById("editEntryDescription");if(!e)return;let t=this.ensureSuggestionsContainer("editDescSuggestions",e);e.addEventListener("focus",()=>{this.descriptions.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.descriptions,s=>{this.autoFillCategoryFromDescription(s)}))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.descriptions,a=>{this.autoFillCategoryFromDescription(a)})}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}autoFillCategoryFromDescription(e){const t=this.entries.find(a=>a.descricao&&a.descricao.trim().toLowerCase()===e.toLowerCase());if(t&&t.categoria){const a=document.getElementById("editEntryCategory");a&&(a.value=t.categoria)}}setupAccountAutocomplete(){const e=document.getElementById("editEntryAccount");if(!e)return;let t=this.ensureSuggestionsContainer("editAccountSuggestions",e);e.addEventListener("focus",()=>{this.accounts.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.accounts))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.accounts)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}ensureSuggestionsContainer(e,t){let a=document.getElementById(e);if(!a){a=document.createElement("div"),a.id=e,a.classList.add("entry-modal__suggestions"),a.setAttribute("role","listbox");const s=t.parentElement;s&&(s.style.position=s.style.position||"relative",s.appendChild(a))}return a}showAllSuggestions(e,t,a,s){if(t.innerHTML="",a.length===0){t.style.display="none";return}a.slice(0,20).forEach(l=>{const o=document.createElement("div");o.setAttribute("role","option"),o.classList.add("entry-modal__suggestion"),o.textContent=l,o.addEventListener("click",()=>{e.value=l,t.style.display="none",e.focus(),s&&s(l)}),t.appendChild(o)}),t.style.display="block"}showSuggestions(e,t,a,s){t.innerHTML="";const r=e.value.trim().toLowerCase();if(!r||r.length<1){this.showAllSuggestions(e,t,a,s);return}if(a.length===0){t.style.display="none";return}const l=a.filter(o=>o.toLowerCase().includes(r));if(l.length===0){t.style.display="none";return}l.forEach(o=>{const m=document.createElement("div");m.setAttribute("role","option"),m.classList.add("entry-modal__suggestion"),m.textContent=o,m.addEventListener("click",()=>{e.value=o,t.style.display="none",e.focus(),s&&s(o)}),t.appendChild(m)}),t.style.display="block"}formatDateTimeLocal(e){const[t,a]=e.split("T"),[s,r,l]=t.split("-");return`${l}/${r}/${s} ${a}`}formatDate(e){const[t,a,s]=e.split("-");return`${s}/${a}/${t}`}toggleSign(){var a;const e=document.getElementById("editEntrySignBtn"),t=((a=e==null?void 0:e.textContent)==null?void 0:a.trim())==="−";this.setSignState(!t)}setSignState(e){const t=document.getElementById("editEntrySignBtn"),a=document.getElementById("editEntrySignValue");!t||!a||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),a.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),a.value="+"))}open(e){var s;if(!this.modal||!e)return;console.log("[EditEntryModal] Abrindo modal para edição:",e),this.currentEntry=e,this.populateForm(e),this.modal.style.display="flex",this.modal.setAttribute("aria-hidden","false");const t=document.getElementById("openEntryModal");t&&(t.style.visibility="hidden",console.log("[EditEntryModal] ✅ Botão FAB oculto"));const a=(s=this.form)==null?void 0:s.querySelector("input");a==null||a.focus()}applySignState(e){const t=document.getElementById("editEntrySignBtn"),a=document.getElementById("editEntrySignValue");!t||!a||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),a.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),a.value="+"))}populateForm(e){const t=document.getElementById("editEntryDate");if(t&&e.data){let c="";if(typeof e.data=="number"){const d=L(e.data,!0);d&&(c=S(d))}else if(typeof e.data=="string"){const d=q(e.data);d&&(c=S(d))}t.value=c}else t&&(t.value="");const a=document.getElementById("editEntryAccount");a&&(a.value=e.conta||"");const s=document.getElementById("editEntryValue");if(s&&e.valor!==void 0){const c=Math.abs(e.valor);s.value=c.toString(),this.applySignState(e.valor<0)}const r=document.getElementById("editEntryDescription");r&&(r.value=e.descricao||"");const l=document.getElementById("editEntryCategory");l&&(l.value=e.categoria||"");const o=document.getElementById("editEntryBudget");if(o&&e.orcamento){let c="";if(typeof e.orcamento=="number"){const d=L(e.orcamento,!1);d&&(c=d.toISOString().split("T")[0])}else if(typeof e.orcamento=="string"){const d=N(e.orcamento);d&&(c=d.toISOString().split("T")[0])}o.value=c}const m=document.getElementById("editEntryObs");m&&(m.value=e.obs||"")}close(){if(!this.modal)return;this.modal.style.display="none",this.modal.setAttribute("aria-hidden","true"),this.currentEntry=null;const e=document.getElementById("openEntryModal");e&&(e.style.visibility="visible",console.log("[EditEntryModal] ✅ Botão FAB visível")),this.form&&this.form.reset(),this.clearFeedback()}isOpen(){var e;return((e=this.modal)==null?void 0:e.style.display)==="flex"}async handleSubmit(e){if(e.preventDefault(),!this.form||!this.currentEntry||!this.currentEntry.rowIndex){console.error("[EditEntryModal] Dados insuficientes para edição");return}const t=new FormData(this.form),a=document.getElementById("saveEditEntryBtn");a&&(a.disabled=!0,a.textContent="Salvando...");try{const s=t.get("data"),r=t.get("orcamento"),l=parseFloat(t.get("valor")),o=t.get("sinal"),m=new Date(r);if(isNaN(m.getTime()))throw new Error("Data de orçamento inválida");let c="";if(s&&s.trim()!==""){if(!s.includes("T"))throw new Error("Formato de data/hora inválido");const h=new Date(s);if(isNaN(h.getTime()))throw new Error("Data inválida");c=this.formatDateTimeLocal(s)}const d=o==="−"||o==="-"?-Math.abs(l):Math.abs(l),p=this.formatDate(r),u={data:c,conta:t.get("conta"),valor:d,descricao:t.get("descricao"),categoria:t.get("categoria"),orcamento:p,obs:t.get("observacoes")||""};console.log("[EditEntryModal] 📤 Enviando edição:",u),await f.editEntry(this.currentEntry.rowIndex,u),this.showFeedback("✅ Lançamento editado com sucesso!","success"),setTimeout(()=>{var b;this.close();const h=new CustomEvent("entry:edited",{detail:{rowIndex:(b=this.currentEntry)==null?void 0:b.rowIndex,entry:u}});document.dispatchEvent(h),this.callback&&this.callback({success:!0,entry:u})},500)}catch(s){console.error("[EditEntryModal] ❌ Erro ao editar:",s),this.showFeedback(`❌ Erro: ${s instanceof Error?s.message:"Erro desconhecido"}`,"error")}finally{a&&(a.disabled=!1,a.textContent="Salvar")}}showFeedback(e,t){const a=document.getElementById("editEntryFeedback");a&&(a.textContent=e,a.className=`modal-feedback modal-feedback--${t}`,a.style.display="block",(t==="success"||t==="error")&&setTimeout(()=>{this.clearFeedback()},5e3))}clearFeedback(){const e=document.getElementById("editEntryFeedback");e&&(e.className="modal-feedback",e.textContent="",e.style.display="none")}async setEntries(e){this.entries=e,this.accounts=f.getUniqueAccounts(e),this.descriptions=f.getUniqueDescriptions(e);const t=f.getUniqueCategories(e);try{const{SheetsService:a}=await ee(async()=>{const{SheetsService:s}=await import("./sheets.js");return{SheetsService:s}},__vite__mapDeps([0,1,2,3]));this.categoriesComplete=await a.getSheetCategoriesComplete(),this.categoriesComplete.length>0?(this.categories=this.categoriesComplete.map(s=>s.categoria),console.log("[EditEntryModal] Categorias completas carregadas:",this.categoriesComplete.length)):(this.categories=t,console.log("[EditEntryModal] Usando categorias dos entries:",this.categories.length))}catch(a){console.warn("[EditEntryModal] Erro ao carregar categorias completas, usando entries:",a),this.categories=t}}}async function ne(n){if(y)return console.log("[EditEntryModal] Reutilizando instância existente"),y;try{return y=new te,await y.init(n),y}catch(e){return console.error("[EditEntryModal] Erro ao inicializar:",e),null}}function ae(n){y?y.open(n):console.error("[EditEntryModal] Modal não inicializado")}function oe(n){y&&y.setEntries(n)}function T(n){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n)}function M(n){return n?typeof n=="number"?k(n):String(n):"-"}function A(n){return n?typeof n=="number"?P(n):String(n):"-"}function F(n){return`
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
          ${F(t)}
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
          ${F(t)}
        </div>
      </div>
    `}).join("")}
    </div>
  `}function le(n){return`
    ${se(n)}
    ${ie(n)}
  `}const i={entries:[],filteredEntries:[],originalEntries:[],searchTerm:"",sortBy:"original",hideBlankDates:!0,isLoading:!1};function re(){const n=document.getElementById("loadingIndicator");n&&(n.style.display="flex")}function ce(){const n=document.getElementById("loadingIndicator");n&&(n.style.display="none")}function _(n,e="info"){e==="success"?K(n):e==="error"?Q(n):X(n,"Info")}function de(){const n=document.getElementById("searchResults"),e=document.getElementById("searchCount"),t=document.getElementById("clearSearchBtn");!n||!e||!t||(i.searchTerm?(e.textContent=`${i.filteredEntries.length} resultado(s) encontrado(s)`,n.classList.add("lancamentos__search-results--visible"),t.style.display="flex"):(n.classList.remove("lancamentos__search-results--visible"),t.style.display="none"))}async function E(n=!1){if(!i.isLoading){i.isLoading=!0,i.entries=[],B(),re();try{const a=((await f.fetchEntries(0,n)).entries||[]).filter(r=>!f.isBlankEntry(r));i.originalEntries=a,i.entries=[...i.originalEntries],v(),_("Lançamentos carregados com sucesso"+(n?" (cache atualizado)":""),"success")}catch(e){console.error("Erro ao carregar lançamentos:",e),_("Erro ao carregar lançamentos: "+e.message,"error"),i.entries=[],i.filteredEntries=[],B()}finally{i.isLoading=!1,ce()}}}function v(){let n=[...i.originalEntries];i.hideBlankDates&&(n=n.filter(e=>!(e.data===null||e.data===void 0||typeof e.data=="string"&&e.data.trim()===""))),n=f.sortEntries(n,i.sortBy),i.searchTerm&&(n=f.filterEntries(n,i.searchTerm)),i.filteredEntries=n,i.entries=i.sortBy==="original"?[...i.originalEntries]:f.sortEntries([...i.originalEntries],i.sortBy),B(),de()}function B(){const n=document.getElementById("entriesContainer");if(!n)return;const t=(i.searchTerm||i.filteredEntries.length>0?i.filteredEntries:i.entries).slice(0,100);n.innerHTML=le(t)}function me(n){i.sortBy=n,v()}function ue(n){i.hideBlankDates=n,v()}function I(n){i.searchTerm=n.trim(),v()}function ge(){const n=document.getElementById("searchInput");n&&(n.value=""),i.searchTerm="",v()}function fe(n){const e=i.entries.find(t=>t.rowIndex===n);e?ae(e):console.error("Lançamento não encontrado:",n)}let w=null;function ye(n){const e=i.entries.find(o=>o.rowIndex===n);if(!e){console.error("Lançamento não encontrado:",n);return}w=n;const t=document.getElementById("deleteRowNumber"),a=document.getElementById("deleteDate"),s=document.getElementById("deleteValue"),r=document.getElementById("deleteDescription");if(t&&(t.textContent=String(e.rowIndex||"-")),a){let o="-";e.data&&(typeof e.data=="number"?o=k(e.data):typeof e.data=="string"&&(o=e.data)),a.textContent=o}s&&(s.textContent=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(e.valor)),r&&(r.textContent=e.descricao||"-");const l=document.getElementById("deleteModal");l&&(l.style.display="flex")}function $(){w=null;const n=document.getElementById("deleteModal");n&&(n.style.display="none")}async function Ee(){if(w===null){console.error("Nenhum lançamento pendente para exclusão");return}const n=w,e=document.getElementById("deleteConfirmBtn");e&&(e.disabled=!0,e.textContent="Excluindo...");try{await f.deleteEntry(n),_("Lançamento excluído com sucesso","success"),$(),await E()}catch(t){console.error("Erro ao deletar lançamento:",t),_("Erro ao deletar lançamento: "+t.message,"error")}finally{e&&(e.disabled=!1,e.textContent="Excluir")}}function pe(n){ye(n)}window.editEntry=fe;window.deleteEntry=pe;window.lancamentosManager={closeDeleteModal:$,confirmDelete:Ee,closeSplitModal:()=>{const n=document.getElementById("splitModal");n&&(n.style.display="none")},confirmSplit:()=>{console.warn("Funcionalidade de divisão de parcelas não implementada")}};async function D(){if(console.log("[Lançamentos] Inicializando página..."),!await R()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}J(),await j(o=>{console.log("✅ Lançamento adicionado:",o),E()}),await ne(o=>{console.log("✅ Lançamento editado:",o),E()}),await z(o=>{console.log("✅ Lançamento futuro adicionado:",o),E()}),await U(o=>{console.log("✅ Transferência realizada:",o),E()}),H(()=>C(),()=>G(),()=>W());const e=document.getElementById("openAddEntryModalBtn");e&&e.addEventListener("click",()=>{console.log("🔓 Abrindo modal de adicionar lançamento..."),C()});const t=document.getElementById("refreshEntriesBtn");t&&t.addEventListener("click",()=>{console.log("🔄 Atualizando lançamentos (forceRefresh=true)..."),E(!0)});const a=document.getElementById("searchInput");a&&a.addEventListener("input",o=>{I(o.target.value)});const s=document.getElementById("clearSearchBtn");s&&s.addEventListener("click",()=>{ge()});const r=document.getElementById("sortSelect");r&&(r.value=i.sortBy,r.addEventListener("change",o=>{me(o.target.value)}));const l=document.getElementById("hideBlankDatesCheck");l&&(l.checked=i.hideBlankDates,l.addEventListener("change",o=>{ue(o.target.checked)})),document.addEventListener("entry:edited",()=>{console.log("📝 Entrada editada, recarregando..."),setTimeout(()=>{E()},300)}),await E(),oe(i.entries),he(),console.log("✅ Página de lançamentos inicializada")}function he(){const n=new URLSearchParams(window.location.search),e=n.get("conta"),t=n.get("categoria");e?(console.log("[Lançamentos] Filtrando por conta:",e),I(e)):t&&(console.log("[Lançamentos] Filtrando por categoria:",t),I(t));const a=document.getElementById("searchInput");a&&(e||t)&&(a.value=e||t||"")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",D):D();
