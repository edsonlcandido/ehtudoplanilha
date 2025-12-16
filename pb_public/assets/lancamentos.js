const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/sheets.js","assets/auth.js"])))=>i.map(i=>d[i]);
var P=Object.defineProperty;var V=(n,e,t)=>e in n?P(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var p=(n,e,t)=>V(n,typeof e!="symbol"?e+"":e,t);import{v as q}from"./auth.js";/* empty css     */import{a as N,s as R,b as H}from"./toast.js";import{r as j}from"./user-menu.js";import{a as w,j as S,k as z,m as U,l as E,n as T,e as W,p as Y,i as G,b as J,c as K,d as Q,o as X,f as Z,h as F}from"./fab-menu.js";import"./sheets.js";const ee="modulepreload",te=function(n){return"/"+n},x={},ne=function(e,t,o){let a=Promise.resolve();if(t&&t.length>0){let r=function(c){return Promise.all(c.map(m=>Promise.resolve(m).then(g=>({status:"fulfilled",value:g}),g=>({status:"rejected",reason:g}))))};document.getElementsByTagName("link");const s=document.querySelector("meta[property=csp-nonce]"),u=(s==null?void 0:s.nonce)||(s==null?void 0:s.getAttribute("nonce"));a=r(t.map(c=>{if(c=te(c),c in x)return;x[c]=!0;const m=c.endsWith(".css"),g=m?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${g}`))return;const f=document.createElement("link");if(f.rel=m?"stylesheet":ee,m||(f.as="script"),f.crossOrigin="",f.href=c,u&&f.setAttribute("nonce",u),document.head.appendChild(f),m)return new Promise((d,I)=>{f.addEventListener("load",d),f.addEventListener("error",()=>I(new Error(`Unable to preload CSS for ${c}`)))})}))}function l(r){const s=new Event("vite:preloadError",{cancelable:!0});if(s.payload=r,window.dispatchEvent(s),!s.defaultPrevented)throw r}return a.then(r=>{for(const s of r||[])s.status==="rejected"&&l(s.reason);return e().catch(l)})};let y=null;class oe{constructor(){p(this,"modal",null);p(this,"form",null);p(this,"callback");p(this,"currentEntry",null);p(this,"accounts",[]);p(this,"categories",[]);p(this,"categoriesComplete",[]);p(this,"descriptions",[]);p(this,"entries",[])}getTemplate(){return`
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
    `}async init(e){if(console.log("[EditEntryModal] Inicializando..."),this.callback=e,document.body.insertAdjacentHTML("beforeend",this.getTemplate()),this.modal=document.getElementById("editEntryModal"),this.form=document.getElementById("editEntryForm"),!this.modal||!this.form)throw new Error("[EditEntryModal] Elementos do modal não encontrados");this.setupEventListeners(),console.log("[EditEntryModal] ✅ Inicializado com sucesso")}setupEventListeners(){var a,l;const e=document.getElementById("closeEditEntryModal");e==null||e.addEventListener("click",()=>this.close());const t=document.getElementById("cancelEditEntryBtn");t==null||t.addEventListener("click",()=>this.close()),(a=this.modal)==null||a.addEventListener("click",r=>{r.target===this.modal&&this.close()}),document.addEventListener("keydown",r=>{var s;r.key==="Escape"&&((s=this.modal)==null?void 0:s.style.display)==="flex"&&this.close()});const o=document.getElementById("editEntrySignBtn");o==null||o.addEventListener("click",()=>this.toggleSign()),(l=this.form)==null||l.addEventListener("submit",r=>this.handleSubmit(r)),this.setupCategoryAutocomplete(),this.setupDescriptionAutocomplete(),this.setupAccountAutocomplete()}setupCategoryAutocomplete(){const e=document.getElementById("editEntryCategory");if(!e)return;let t=this.ensureSuggestionsContainer("editCatSuggestions",e);e.addEventListener("focus",()=>{this.categories.length>0&&this.showAllSuggestions(e,t,this.categories)}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.categories)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}setupDescriptionAutocomplete(){const e=document.getElementById("editEntryDescription");if(!e)return;let t=this.ensureSuggestionsContainer("editDescSuggestions",e);e.addEventListener("focus",()=>{this.descriptions.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.descriptions,a=>{this.autoFillCategoryFromDescription(a)}))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.descriptions,o=>{this.autoFillCategoryFromDescription(o)})}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}autoFillCategoryFromDescription(e){const t=this.entries.find(o=>o.descricao&&o.descricao.trim().toLowerCase()===e.toLowerCase());if(t&&t.categoria){const o=document.getElementById("editEntryCategory");o&&(o.value=t.categoria)}}setupAccountAutocomplete(){const e=document.getElementById("editEntryAccount");if(!e)return;let t=this.ensureSuggestionsContainer("editAccountSuggestions",e);e.addEventListener("focus",()=>{this.accounts.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.accounts))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.accounts)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}ensureSuggestionsContainer(e,t){let o=document.getElementById(e);if(!o){o=document.createElement("div"),o.id=e,o.classList.add("entry-modal__suggestions"),o.setAttribute("role","listbox");const a=t.parentElement;a&&(a.style.position=a.style.position||"relative",a.appendChild(o))}return o}showAllSuggestions(e,t,o,a){if(t.innerHTML="",o.length===0){t.style.display="none";return}o.slice(0,20).forEach(r=>{const s=document.createElement("div");s.setAttribute("role","option"),s.classList.add("entry-modal__suggestion"),s.textContent=r,s.addEventListener("click",()=>{e.value=r,t.style.display="none",e.focus(),a&&a(r)}),t.appendChild(s)}),t.style.display="block"}showSuggestions(e,t,o,a){t.innerHTML="";const l=e.value.trim().toLowerCase();if(!l||l.length<1){this.showAllSuggestions(e,t,o,a);return}if(o.length===0){t.style.display="none";return}const r=o.filter(s=>s.toLowerCase().includes(l));if(r.length===0){t.style.display="none";return}r.forEach(s=>{const u=document.createElement("div");u.setAttribute("role","option"),u.classList.add("entry-modal__suggestion"),u.textContent=s,u.addEventListener("click",()=>{e.value=s,t.style.display="none",e.focus(),a&&a(s)}),t.appendChild(u)}),t.style.display="block"}formatDateTimeLocal(e){const[t,o]=e.split("T"),[a,l,r]=t.split("-");return`${r}/${l}/${a} ${o}`}formatDate(e){const[t,o,a]=e.split("-");return`${a}/${o}/${t}`}toggleSign(){var o;const e=document.getElementById("editEntrySignBtn"),t=((o=e==null?void 0:e.textContent)==null?void 0:o.trim())==="−";this.setSignState(!t)}setSignState(e){const t=document.getElementById("editEntrySignBtn"),o=document.getElementById("editEntrySignValue");!t||!o||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),o.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),o.value="+"))}open(e){var a;if(!this.modal||!e)return;console.log("[EditEntryModal] Abrindo modal para edição:",e),this.currentEntry=e,this.populateForm(e),this.modal.style.display="flex",this.modal.setAttribute("aria-hidden","false");const t=document.getElementById("openEntryModal");t&&(t.style.visibility="hidden",console.log("[EditEntryModal] ✅ Botão FAB oculto"));const o=(a=this.form)==null?void 0:a.querySelector("input");o==null||o.focus()}applySignState(e){const t=document.getElementById("editEntrySignBtn"),o=document.getElementById("editEntrySignValue");!t||!o||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),o.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),o.value="+"))}populateForm(e){const t=document.getElementById("editEntryDate");if(t&&e.data){let c="";if(typeof e.data=="number"){const m=w(e.data,!0);m&&(c=S(m))}else if(typeof e.data=="string"){const m=z(e.data);m&&(c=S(m))}t.value=c}else t&&(t.value="");const o=document.getElementById("editEntryAccount");o&&(o.value=e.conta||"");const a=document.getElementById("editEntryValue");if(a&&e.valor!==void 0){const c=Math.abs(e.valor);a.value=c.toString(),this.applySignState(e.valor<0)}const l=document.getElementById("editEntryDescription");l&&(l.value=e.descricao||"");const r=document.getElementById("editEntryCategory");r&&(r.value=e.categoria||"");const s=document.getElementById("editEntryBudget");if(s&&e.orcamento){let c="";if(typeof e.orcamento=="number"){const m=w(e.orcamento,!1);m&&(c=m.toISOString().split("T")[0])}else if(typeof e.orcamento=="string"){const m=U(e.orcamento);m&&(c=m.toISOString().split("T")[0])}s.value=c}const u=document.getElementById("editEntryObs");u&&(u.value=e.obs||"")}close(){if(!this.modal)return;this.modal.style.display="none",this.modal.setAttribute("aria-hidden","true"),this.currentEntry=null;const e=document.getElementById("openEntryModal");e&&(e.style.visibility="visible",console.log("[EditEntryModal] ✅ Botão FAB visível")),this.form&&this.form.reset(),this.clearFeedback()}isOpen(){var e;return((e=this.modal)==null?void 0:e.style.display)==="flex"}async handleSubmit(e){if(e.preventDefault(),!this.form||!this.currentEntry||!this.currentEntry.rowIndex){console.error("[EditEntryModal] Dados insuficientes para edição");return}const t=new FormData(this.form),o=document.getElementById("saveEditEntryBtn");o&&(o.disabled=!0,o.textContent="Salvando...");try{const a=t.get("data"),l=t.get("orcamento"),r=parseFloat(t.get("valor")),s=t.get("sinal"),u=new Date(l);if(isNaN(u.getTime()))throw new Error("Data de orçamento inválida");let c="";if(a&&a.trim()!==""){if(!a.includes("T"))throw new Error("Formato de data/hora inválido");const d=new Date(a);if(isNaN(d.getTime()))throw new Error("Data inválida");c=this.formatDateTimeLocal(a)}const m=s==="−"||s==="-"?-Math.abs(r):Math.abs(r),g=this.formatDate(l),f={data:c,conta:t.get("conta"),valor:m,descricao:t.get("descricao"),categoria:t.get("categoria"),orcamento:g,obs:t.get("observacoes")||""};console.log("[EditEntryModal] 📤 Enviando edição:",f),await E.editEntry(this.currentEntry.rowIndex,f),this.showFeedback("✅ Lançamento editado com sucesso!","success"),setTimeout(()=>{var I;this.close();const d=new CustomEvent("entry:edited",{detail:{rowIndex:(I=this.currentEntry)==null?void 0:I.rowIndex,entry:f}});document.dispatchEvent(d),this.callback&&this.callback({success:!0,entry:f})},500)}catch(a){console.error("[EditEntryModal] ❌ Erro ao editar:",a),this.showFeedback(`❌ Erro: ${a instanceof Error?a.message:"Erro desconhecido"}`,"error")}finally{o&&(o.disabled=!1,o.textContent="Salvar")}}showFeedback(e,t){const o=document.getElementById("editEntryFeedback");o&&(o.textContent=e,o.className=`modal-feedback modal-feedback--${t}`,o.style.display="block",(t==="success"||t==="error")&&setTimeout(()=>{this.clearFeedback()},5e3))}clearFeedback(){const e=document.getElementById("editEntryFeedback");e&&(e.className="modal-feedback",e.textContent="",e.style.display="none")}async setEntries(e){this.entries=e,this.accounts=E.getUniqueAccounts(e),this.descriptions=E.getUniqueDescriptions(e);const t=E.getUniqueCategories(e);try{const{SheetsService:o}=await ne(async()=>{const{SheetsService:a}=await import("./sheets.js");return{SheetsService:a}},__vite__mapDeps([0,1]));this.categoriesComplete=await o.getSheetCategoriesComplete(),this.categoriesComplete.length>0?(this.categories=this.categoriesComplete.map(a=>a.categoria),console.log("[EditEntryModal] Categorias completas carregadas:",this.categoriesComplete.length)):(this.categories=t,console.log("[EditEntryModal] Usando categorias dos entries:",this.categories.length))}catch(o){console.warn("[EditEntryModal] Erro ao carregar categorias completas, usando entries:",o),this.categories=t}}}async function ae(n){if(y)return console.log("[EditEntryModal] Reutilizando instância existente"),y;try{return y=new oe,await y.init(n),y}catch(e){return console.error("[EditEntryModal] Erro ao inicializar:",e),null}}function ie(n){y?y.open(n):console.error("[EditEntryModal] Modal não inicializado")}function se(n){y&&y.setEntries(n)}function k(n){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n)}function M(n){return n?typeof n=="number"?T(n):String(n):"-"}function A(n){return n?typeof n=="number"?W(n):String(n):"-"}function $(n){return`
    <button class="button small" onclick="window.editEntry(${n.rowIndex})" title="Editar">
      ✏️
    </button>
    <button class="button small" onclick="window.copyEntry(${n.rowIndex})" title="Copiar">
      📑
    </button>
    <button class="button small danger" onclick="window.deleteEntry(${n.rowIndex})" title="Excluir">
      🗑️
    </button>
  `}function le(n){return n.length===0?`
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
        <div class="lancamentos__table-cell">${M(t.data)}</div>
        <div class="lancamentos__table-cell">${t.conta||"-"}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--number ${o}">
          ${k(t.valor)}
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
  `}function re(n){return n.length===0?`
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
              <span class="lancamentos__item-value">${M(t.data)}</span>
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
  `}function ce(n){return`
    ${le(n)}
    ${re(n)}
  `}const i={entries:[],filteredEntries:[],originalEntries:[],searchTerm:"",sortBy:"original",showConsolidated:!0,showFuture:!1,isLoading:!1,filters:{conta:"",dataInicio:"",dataFim:"",orcamento:""},filterPanelOpen:!1};function de(){const n=document.getElementById("loadingIndicator");n&&(n.style.display="flex")}function me(){const n=document.getElementById("loadingIndicator");n&&(n.style.display="none")}function b(n,e="info"){e==="success"?N(n):e==="error"?R(n):H(n,"Info")}function ue(){const n=document.getElementById("searchResults"),e=document.getElementById("searchCount"),t=document.getElementById("clearSearchBtn");!n||!e||!t||(i.searchTerm?(e.textContent=`${i.filteredEntries.length} resultado(s) encontrado(s)`,n.classList.add("lancamentos__search-results--visible"),t.style.display="flex"):(n.classList.remove("lancamentos__search-results--visible"),t.style.display="none"))}async function h(n=!1){if(!i.isLoading){i.isLoading=!0,i.entries=[],C(),n||de();try{const o=((await E.fetchEntries(0,n)).entries||[]).filter(l=>!E.isBlankEntry(l));i.originalEntries=o,i.entries=[...i.originalEntries],he(),ve(),v(),b("Lançamentos carregados com sucesso"+(n?" (cache atualizado)":""),"success")}catch(e){console.error("Erro ao carregar lançamentos:",e),b("Erro ao carregar lançamentos: "+e.message,"error"),i.entries=[],i.filteredEntries=[],C()}finally{i.isLoading=!1,n||me()}}}function v(){let n=[...i.originalEntries];n=be(n),i.searchTerm&&(n=E.filterEntries(n,i.searchTerm)),n=n.filter(e=>e.data!==null&&e.data!==void 0&&!(typeof e.data=="string"&&e.data.trim()==="")?i.showConsolidated:i.showFuture),n=E.sortEntries(n,i.sortBy),i.filteredEntries=n,i.entries=n,C(),ue()}function C(){const n=document.getElementById("entriesContainer");if(!n)return;const t=i.filteredEntries.slice(0,100);n.innerHTML=ce(t)}function fe(n){i.sortBy=n,v()}function ge(n){i.showConsolidated=n,v()}function pe(n){i.showFuture=n,v()}function L(n){i.searchTerm=n.trim(),v()}function ye(){const n=document.getElementById("searchInput");n&&(n.value=""),i.searchTerm="",v()}function Ee(){const n=document.getElementById("filterPanel"),e=document.getElementById("openFilterPanel");n&&e&&(n.setAttribute("aria-hidden","false"),e.classList.add("active"),i.filterPanelOpen=!0,setTimeout(()=>{const t=n.querySelector("select, input");t&&t.focus()},300))}function _(){const n=document.getElementById("filterPanel"),e=document.getElementById("openFilterPanel");n&&e&&(n.setAttribute("aria-hidden","true"),e.classList.remove("active"),i.filterPanelOpen=!1)}function he(){const n=document.getElementById("filterConta");if(!n)return;const e=new Set;i.originalEntries.forEach(a=>{a.conta&&a.conta.trim()&&e.add(a.conta.trim())});const t=Array.from(e).sort(),o=n.options[0];n.innerHTML="",n.appendChild(o),t.forEach(a=>{const l=document.createElement("option");l.value=a,l.textContent=a,i.filters.conta===a&&(l.selected=!0),n.appendChild(l)})}function ve(){const n=document.getElementById("filterOrcamento");if(!n)return;const e=new Set;i.originalEntries.forEach(a=>{if(a.orcamento){let l="";if(typeof a.orcamento=="number"){const r=w(a.orcamento);r&&(l=`${String(r.getMonth()+1).padStart(2,"0")}/${r.getFullYear()}`)}else typeof a.orcamento=="string"&&(l=a.orcamento.trim());l&&e.add(l)}});const t=Array.from(e).sort().reverse(),o=n.options[0];n.innerHTML="",n.appendChild(o),t.forEach(a=>{const l=document.createElement("option");l.value=a,l.textContent=a,i.filters.orcamento===a&&(l.selected=!0),n.appendChild(l)})}function be(n){let e=[...n];return i.filters.conta&&(e=e.filter(t=>t.conta&&t.conta.trim()===i.filters.conta)),i.filters.orcamento&&(e=e.filter(t=>{if(!t.orcamento)return!1;let o="";if(typeof t.orcamento=="number"){const a=w(t.orcamento);a&&(o=`${String(a.getMonth()+1).padStart(2,"0")}/${a.getFullYear()}`)}else typeof t.orcamento=="string"&&(o=t.orcamento.trim());return o===i.filters.orcamento})),(i.filters.dataInicio||i.filters.dataFim)&&(e=e.filter(t=>{if(!t.data)return!1;let o=null;if(typeof t.data=="number")o=w(t.data),o&&o.setHours(0,0,0,0);else if(typeof t.data=="string"){const a=t.data.split(" ")[0].split("/");if(a.length===3){const[l,r,s]=a;o=new Date(parseInt(s),parseInt(r)-1,parseInt(l)),o.setHours(0,0,0,0)}}if(!o||isNaN(o.getTime()))return!1;if(i.filters.dataInicio){const[a,l,r]=i.filters.dataInicio.split("-").map(Number),s=new Date(a,l-1,r);if(s.setHours(0,0,0,0),o<s)return!1}if(i.filters.dataFim){const[a,l,r]=i.filters.dataFim.split("-").map(Number),s=new Date(a,l-1,r);if(s.setHours(23,59,59,999),o>s)return!1}return!0})),e}function _e(){const n=document.getElementById("filterConta"),e=document.getElementById("filterDataInicio"),t=document.getElementById("filterDataFim"),o=document.getElementById("filterOrcamento");n&&(i.filters.conta=n.value),e&&(i.filters.dataInicio=e.value),t&&(i.filters.dataFim=t.value),o&&(i.filters.orcamento=o.value),_(),v();const a=[i.filters.conta,i.filters.dataInicio,i.filters.dataFim,i.filters.orcamento].filter(l=>l).length;a>0&&b(`${a} filtro(s) aplicado(s)`,"success")}function we(){i.filters={conta:"",dataInicio:"",dataFim:"",orcamento:""};const n=document.getElementById("filterConta"),e=document.getElementById("filterDataInicio"),t=document.getElementById("filterDataFim"),o=document.getElementById("filterOrcamento");n&&(n.value=""),e&&(e.value=""),t&&(t.value=""),o&&(o.value=""),_(),v(),b("Filtros limpos","info")}function Ie(n){const e=i.originalEntries.find(t=>t.rowIndex===n);e?ie(e):console.error("Lançamento não encontrado:",n)}function Be(n){const e=i.originalEntries.find(t=>t.rowIndex===n);if(e){const t={conta:e.conta,valor:e.valor,descricao:e.descricao,categoria:e.categoria,orcamento:e.orcamento,obs:e.obs};Y(t)}else console.error("Lançamento não encontrado para copiar:",n)}let B=null;function Ce(n){const e=i.originalEntries.find(s=>s.rowIndex===n);if(!e){console.error("Lançamento não encontrado:",n);return}B=n;const t=document.getElementById("deleteRowNumber"),o=document.getElementById("deleteDate"),a=document.getElementById("deleteValue"),l=document.getElementById("deleteDescription");if(t&&(t.textContent=String(e.rowIndex||"-")),o){let s="-";e.data&&(typeof e.data=="number"?s=T(e.data):typeof e.data=="string"&&(s=e.data)),o.textContent=s}a&&(a.textContent=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(e.valor)),l&&(l.textContent=e.descricao||"-");const r=document.getElementById("deleteModal");r&&(r.style.display="flex")}function O(){B=null;const n=document.getElementById("deleteModal");n&&(n.style.display="none")}async function Le(){if(B===null){console.error("Nenhum lançamento pendente para exclusão");return}const n=B,e=document.getElementById("deleteConfirmBtn");e&&(e.disabled=!0,e.textContent="Excluindo...");try{await E.deleteEntry(n),b("Lançamento excluído com sucesso","success"),O(),await h()}catch(t){console.error("Erro ao deletar lançamento:",t),b("Erro ao deletar lançamento: "+t.message,"error")}finally{e&&(e.disabled=!1,e.textContent="Excluir")}}function Se(n){Ce(n)}window.editEntry=Ie;window.copyEntry=Be;window.deleteEntry=Se;window.lancamentosManager={closeDeleteModal:O,confirmDelete:Le,closeSplitModal:()=>{const n=document.getElementById("splitModal");n&&(n.style.display="none")},confirmSplit:()=>{console.warn("Funcionalidade de divisão de parcelas não implementada")}};async function D(){if(console.log("[Lançamentos] Inicializando página..."),!await q()){console.warn("⚠️ Token inválido ou usuário não autenticado");return}j(),await G(d=>{console.log("✅ Lançamento adicionado:",d),h()}),await ae(d=>{console.log("✅ Lançamento editado:",d),h()}),await J(d=>{console.log("✅ Lançamento futuro adicionado:",d),h()}),await K(d=>{console.log("✅ Transferência realizada:",d),h()}),Q(()=>F(),()=>Z(),()=>X());const e=document.getElementById("openAddEntryModalBtn");e&&e.addEventListener("click",()=>{console.log("🔓 Abrindo modal de adicionar lançamento..."),F()});const t=document.getElementById("refreshEntriesBtn");t&&t.addEventListener("click",async()=>{console.log("🔄 Atualizando lançamentos (forceRefresh=true)...");const d=t.innerHTML;t.disabled=!0,t.innerHTML="⏳ Atualizando...";try{await h(!0)}finally{t.disabled=!1,t.innerHTML=d}});const o=document.getElementById("searchInput");o&&o.addEventListener("input",d=>{L(d.target.value)});const a=document.getElementById("clearSearchBtn");a&&a.addEventListener("click",()=>{ye()});const l=document.getElementById("sortSelect");l&&(l.value=i.sortBy,l.addEventListener("change",d=>{fe(d.target.value)}));const r=document.getElementById("showConsolidatedCheck");r&&(r.checked=i.showConsolidated,r.addEventListener("change",d=>{ge(d.target.checked)}));const s=document.getElementById("showFutureCheck");s&&(s.checked=i.showFuture,s.addEventListener("change",d=>{pe(d.target.checked)}));const u=document.getElementById("openFilterPanel");u&&u.addEventListener("click",()=>{console.log("🔍 Abrindo painel de filtros..."),Ee()});const c=document.getElementById("closeFilterPanel");c&&c.addEventListener("click",()=>{console.log("❌ Fechando painel de filtros..."),_()});const m=document.getElementById("filterPanelOverlay");m&&m.addEventListener("click",()=>{console.log("🖱️ Clique no overlay - fechando painel de filtros..."),_()});const g=document.getElementById("applyFiltersBtn");g&&g.addEventListener("click",()=>{console.log("✅ Aplicando filtros..."),_e()});const f=document.getElementById("clearFiltersBtn");f&&f.addEventListener("click",()=>{console.log("🧹 Limpando filtros..."),we()}),document.addEventListener("keydown",d=>{d.key==="Escape"&&i.filterPanelOpen&&_()}),document.addEventListener("entry:edited",()=>{console.log("📝 Entrada editada, recarregando..."),setTimeout(()=>{h()},300)}),await h(),se(i.originalEntries),Fe(),console.log("✅ Página de lançamentos inicializada")}function Fe(){const n=new URLSearchParams(window.location.search),e=n.get("conta"),t=n.get("categoria");e?(console.log("[Lançamentos] Filtrando por conta:",e),L(e)):t&&(console.log("[Lançamentos] Filtrando por categoria:",t),L(t));const o=document.getElementById("searchInput");o&&(e||t)&&(o.value=e||t||"")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",D):D();
