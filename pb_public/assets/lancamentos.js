var T=Object.defineProperty;var $=(a,t,e)=>t in a?T(a,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[t]=e;var g=(a,t,e)=>$(a,typeof t!="symbol"?t+"":t,e);import{p as f}from"./auth.js";/* empty css          */import{r as M}from"./user-menu.js";import{a as y,d as F,b as O,f as V,e as N,i as j,o as B,c as q}from"./date-helpers.js";class z{async fetchEntries(t=100){if(!f)throw new Error("PocketBase não inicializado");try{const e=await fetch(`${f.baseUrl}/get-sheet-entries?limit=${t}`,{method:"GET",headers:{Authorization:`Bearer ${f.authStore.token}`,"Content-Type":"application/json"}}),n=await e.json();if(!e.ok)throw new Error(n.error||"Erro ao carregar entradas da planilha");return n}catch(e){throw console.error("Erro ao buscar entradas da planilha:",e),e}}async editEntry(t,e){if(!f)throw new Error("PocketBase não inicializado");try{const n=await fetch(`${f.baseUrl}/edit-sheet-entry`,{method:"PUT",headers:{Authorization:`Bearer ${f.authStore.token}`,"Content-Type":"application/json"},body:JSON.stringify({rowIndex:t,...e})}),o=await n.json();if(!n.ok)throw new Error(o.error||"Erro ao editar lançamento");return o}catch(n){throw console.error("Erro ao editar lançamento:",n),n}}async deleteEntry(t){if(!f)throw new Error("PocketBase não inicializado");try{const e=await fetch(`${f.baseUrl}/delete-sheet-entry`,{method:"POST",headers:{Authorization:`Bearer ${f.authStore.token}`,"Content-Type":"application/json"},body:JSON.stringify({rowIndex:t})}),n=await e.json();if(!e.ok)throw new Error(n.error||"Erro ao deletar lançamento");return n}catch(e){throw console.error("Erro ao deletar lançamento:",e),e}}isBlankEntry(t){return t?["data","conta","valor","descricao","categoria","orcamento","obs"].every(n=>{const o=t[n];return o==null?!0:typeof o=="number"?!1:String(o).trim()===""}):!0}normalizeEntry(t){const e={...t};if(typeof e.data=="number"){const n=y(e.data);n&&(e.data=n.toISOString())}if(typeof e.orcamento=="number"){const n=y(e.orcamento);n&&(e.orcamento=n.toISOString().split("T")[0])}return e}sortEntries(t,e){const n=[...t];return e==="original"?n.sort((o,l)=>(l.rowIndex||0)-(o.rowIndex||0)):e==="date"?n.sort((o,l)=>{const r=this.getDateValue(o.data);return this.getDateValue(l.data)-r}):e==="budget_date"?n.sort((o,l)=>{const r=this.getDateValue(o.orcamento),s=this.getDateValue(l.orcamento);if(r!==s)return s-r;const c=this.getDateValue(o.data);return this.getDateValue(l.data)-c}):n}getDateValue(t){if(!t)return Number.MAX_SAFE_INTEGER;if(typeof t=="number")return t;const e=new Date(t);return isNaN(e.getTime())?Number.MAX_SAFE_INTEGER:e.getTime()}filterEntries(t,e){if(!e||e.trim()==="")return t;const n=e.toLowerCase().trim();return t.filter(o=>{const l=this.formatDateForSearch(o.data),r=String(o.valor||""),s=String(o.descricao||"").toLowerCase(),c=String(o.categoria||"").toLowerCase(),m=String(o.conta||"").toLowerCase(),d=String(o.obs||"").toLowerCase();return l.includes(n)||r.includes(n)||s.includes(n)||c.includes(n)||m.includes(n)||d.includes(n)})}formatDateForSearch(t){if(!t)return"";let e=null;if(typeof t=="number"?e=y(t):e=new Date(t),!e||isNaN(e.getTime()))return"";const n=String(e.getDate()).padStart(2,"0"),o=String(e.getMonth()+1).padStart(2,"0"),l=e.getFullYear();return`${n}/${o}/${l}`}getUniqueAccounts(t){const e=new Set;return t.forEach(n=>{n.conta&&typeof n.conta=="string"&&e.add(n.conta.trim())}),Array.from(e).sort()}getUniqueCategories(t){const e=new Set;return t.forEach(n=>{n.categoria&&typeof n.categoria=="string"&&e.add(n.categoria.trim())}),Array.from(e).sort()}getUniqueDescriptions(t){const e=new Set;return t.forEach(n=>{n.descricao&&typeof n.descricao=="string"&&e.add(n.descricao.trim())}),Array.from(e).sort()}}const u=new z;let E=null;class U{constructor(){g(this,"modal",null);g(this,"form",null);g(this,"callback");g(this,"currentEntry",null);g(this,"accounts",[]);g(this,"categories",[]);g(this,"descriptions",[]);g(this,"entries",[])}getTemplate(){return`
      <div id="editEntryModal" class="entry-modal" aria-hidden="true" style="display: none;">
        <div class="entry-modal__content">
          <button id="closeEditEntryModal" class="entry-modal__close" aria-label="Fechar modal">×</button>
          <h3 class="entry-modal__title">Editar Lançamento</h3>
          <form id="editEntryForm" class="entry-modal__form">
            <fieldset>
              <div class="form-group">
                <label for="editEntryDate">Data:</label>
                <input type="datetime-local" id="editEntryDate" name="data" class="form-control" required>
              </div>
              
              <div class="form-group">
                <label for="editEntryAccount">Conta:</label>
                <input type="text" id="editEntryAccount" name="conta" class="form-control" placeholder="Ex: Conta Corrente" autocomplete="off" required>
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
    `}async init(t){if(console.log("[EditEntryModal] Inicializando..."),this.callback=t,document.body.insertAdjacentHTML("beforeend",this.getTemplate()),this.modal=document.getElementById("editEntryModal"),this.form=document.getElementById("editEntryForm"),!this.modal||!this.form)throw new Error("[EditEntryModal] Elementos do modal não encontrados");this.setupEventListeners(),console.log("[EditEntryModal] ✅ Inicializado com sucesso")}setupEventListeners(){var o,l;const t=document.getElementById("closeEditEntryModal");t==null||t.addEventListener("click",()=>this.close());const e=document.getElementById("cancelEditEntryBtn");e==null||e.addEventListener("click",()=>this.close()),(o=this.modal)==null||o.addEventListener("click",r=>{r.target===this.modal&&this.close()}),document.addEventListener("keydown",r=>{var s;r.key==="Escape"&&((s=this.modal)==null?void 0:s.style.display)==="flex"&&this.close()});const n=document.getElementById("editEntrySignBtn");n==null||n.addEventListener("click",()=>this.toggleSign()),(l=this.form)==null||l.addEventListener("submit",r=>this.handleSubmit(r)),this.setupCategoryAutocomplete(),this.setupDescriptionAutocomplete(),this.setupAccountAutocomplete()}setupCategoryAutocomplete(){const t=document.getElementById("editEntryCategory");if(!t)return;let e=this.ensureSuggestionsContainer("editCatSuggestions",t);t.addEventListener("focus",()=>{this.categories.length>0&&this.showAllSuggestions(t,e,this.categories)}),t.addEventListener("input",()=>{this.showSuggestions(t,e,this.categories)}),t.addEventListener("blur",()=>{setTimeout(()=>e.style.display="none",200)})}setupDescriptionAutocomplete(){const t=document.getElementById("editEntryDescription");if(!t)return;let e=this.ensureSuggestionsContainer("editDescSuggestions",t);t.addEventListener("focus",()=>{this.descriptions.length>0&&(t.value.trim().toLowerCase()||this.showAllSuggestions(t,e,this.descriptions,o=>{this.autoFillCategoryFromDescription(o)}))}),t.addEventListener("input",()=>{this.showSuggestions(t,e,this.descriptions,n=>{this.autoFillCategoryFromDescription(n)})}),t.addEventListener("blur",()=>{setTimeout(()=>e.style.display="none",200)})}autoFillCategoryFromDescription(t){const e=this.entries.find(n=>n.descricao&&n.descricao.trim().toLowerCase()===t.toLowerCase());if(e&&e.categoria){const n=document.getElementById("editEntryCategory");n&&(n.value=e.categoria)}}setupAccountAutocomplete(){const t=document.getElementById("editEntryAccount");if(!t)return;let e=this.ensureSuggestionsContainer("editAccountSuggestions",t);t.addEventListener("focus",()=>{this.accounts.length>0&&(t.value.trim().toLowerCase()||this.showAllSuggestions(t,e,this.accounts))}),t.addEventListener("input",()=>{this.showSuggestions(t,e,this.accounts)}),t.addEventListener("blur",()=>{setTimeout(()=>e.style.display="none",200)})}ensureSuggestionsContainer(t,e){let n=document.getElementById(t);if(!n){n=document.createElement("div"),n.id=t,n.classList.add("entry-modal__suggestions"),n.setAttribute("role","listbox");const o=e.parentElement;o&&(o.style.position=o.style.position||"relative",o.appendChild(n))}return n}showAllSuggestions(t,e,n,o){if(e.innerHTML="",n.length===0){e.style.display="none";return}n.slice(0,20).forEach(r=>{const s=document.createElement("div");s.setAttribute("role","option"),s.classList.add("entry-modal__suggestion"),s.textContent=r,s.addEventListener("click",()=>{t.value=r,e.style.display="none",t.focus(),o&&o(r)}),e.appendChild(s)}),e.style.display="block"}showSuggestions(t,e,n,o){e.innerHTML="";const l=t.value.trim().toLowerCase();if(!l||l.length<1){this.showAllSuggestions(t,e,n,o);return}if(n.length===0){e.style.display="none";return}const r=n.filter(s=>s.toLowerCase().includes(l));if(r.length===0){e.style.display="none";return}r.forEach(s=>{const c=document.createElement("div");c.setAttribute("role","option"),c.classList.add("entry-modal__suggestion"),c.textContent=s,c.addEventListener("click",()=>{t.value=s,e.style.display="none",t.focus(),o&&o(s)}),e.appendChild(c)}),e.style.display="block"}formatDateTimeLocal(t){const[e,n]=t.split("T"),[o,l,r]=e.split("-");return`${r}/${l}/${o} ${n}`}formatDate(t){const[e,n,o]=t.split("-");return`${o}/${n}/${e}`}toggleSign(){var n;const t=document.getElementById("editEntrySignBtn"),e=((n=t==null?void 0:t.textContent)==null?void 0:n.trim())==="−";this.setSignState(!e)}setSignState(t){const e=document.getElementById("editEntrySignBtn"),n=document.getElementById("editEntrySignValue");!e||!n||(t?(e.textContent="−",e.classList.add("entry-toggle--expense"),e.classList.remove("entry-toggle--income"),n.value="−"):(e.textContent="+",e.classList.remove("entry-toggle--expense"),e.classList.add("entry-toggle--income"),n.value="+"))}open(t){var o;if(!this.modal||!t)return;console.log("[EditEntryModal] Abrindo modal para edição:",t),this.currentEntry=t,this.populateForm(t),this.modal.style.display="flex",this.modal.setAttribute("aria-hidden","false");const e=document.getElementById("openEntryModal");e&&(e.style.display="none",console.log("[EditEntryModal] ✅ Botão FAB oculto"));const n=(o=this.form)==null?void 0:o.querySelector("input");n==null||n.focus()}applySignState(t){const e=document.getElementById("editEntrySignBtn"),n=document.getElementById("editEntrySignValue");!e||!n||(t?(e.textContent="−",e.classList.add("entry-toggle--expense"),e.classList.remove("entry-toggle--income"),n.value="−"):(e.textContent="+",e.classList.remove("entry-toggle--expense"),e.classList.add("entry-toggle--income"),n.value="+"))}populateForm(t){const e=document.getElementById("editEntryDate");if(e&&t.data){let m="";if(typeof t.data=="number"){const d=y(t.data,!0);d&&(m=d.toISOString().slice(0,16))}else if(typeof t.data=="string"){const d=F(t.data);d&&(m=d.toISOString().slice(0,16))}e.value=m}const n=document.getElementById("editEntryAccount");n&&(n.value=t.conta||"");const o=document.getElementById("editEntryValue");if(o&&t.valor!==void 0){const m=Math.abs(t.valor);o.value=m.toString(),this.applySignState(t.valor<0)}const l=document.getElementById("editEntryDescription");l&&(l.value=t.descricao||"");const r=document.getElementById("editEntryCategory");r&&(r.value=t.categoria||"");const s=document.getElementById("editEntryBudget");if(s&&t.orcamento){let m="";if(typeof t.orcamento=="number"){const d=y(t.orcamento,!1);d&&(m=d.toISOString().split("T")[0])}else if(typeof t.orcamento=="string"){const d=O(t.orcamento);d&&(m=d.toISOString().split("T")[0])}s.value=m}const c=document.getElementById("editEntryObs");c&&(c.value=t.obs||"")}close(){if(!this.modal)return;this.modal.style.display="none",this.modal.setAttribute("aria-hidden","true"),this.currentEntry=null;const t=document.getElementById("openEntryModal");t&&(t.style.display="block",console.log("[EditEntryModal] ✅ Botão FAB visível")),this.form&&this.form.reset(),this.clearFeedback()}isOpen(){var t;return((t=this.modal)==null?void 0:t.style.display)==="flex"}async handleSubmit(t){if(t.preventDefault(),!this.form||!this.currentEntry||!this.currentEntry.rowIndex){console.error("[EditEntryModal] Dados insuficientes para edição");return}const e=new FormData(this.form),n=document.getElementById("saveEditEntryBtn");n&&(n.disabled=!0,n.textContent="Salvando...");try{const o=e.get("data"),l=e.get("orcamento"),r=parseFloat(e.get("valor")),s=e.get("sinal"),c=new Date(o),m=new Date(l);if(isNaN(c.getTime()))throw new Error("Data inválida");if(isNaN(m.getTime()))throw new Error("Data de orçamento inválida");const d=s==="−"||s==="-"?-Math.abs(r):Math.abs(r),k=this.formatDateTimeLocal(o),x=this.formatDate(l),v={data:k,conta:e.get("conta"),valor:d,descricao:e.get("descricao"),categoria:e.get("categoria"),orcamento:x,obs:e.get("observacoes")||""};console.log("[EditEntryModal] 📤 Enviando edição:",v),await u.editEntry(this.currentEntry.rowIndex,v),this.showFeedback("✅ Lançamento editado com sucesso!","success"),setTimeout(()=>{var w;this.close();const A=new CustomEvent("entry:edited",{detail:{rowIndex:(w=this.currentEntry)==null?void 0:w.rowIndex,entry:v}});document.dispatchEvent(A),this.callback&&this.callback({success:!0,entry:v})},500)}catch(o){console.error("[EditEntryModal] ❌ Erro ao editar:",o),this.showFeedback(`❌ Erro: ${o instanceof Error?o.message:"Erro desconhecido"}`,"error")}finally{n&&(n.disabled=!1,n.textContent="Salvar")}}showFeedback(t,e){const n=document.getElementById("editEntryFeedback");n&&(n.textContent=t,n.className=`modal-feedback modal-feedback--${e}`,n.style.display="block",(e==="success"||e==="error")&&setTimeout(()=>{this.clearFeedback()},5e3))}clearFeedback(){const t=document.getElementById("editEntryFeedback");t&&(t.className="modal-feedback",t.textContent="",t.style.display="none")}setEntries(t){this.entries=t,this.accounts=u.getUniqueAccounts(t),this.categories=u.getUniqueCategories(t),this.descriptions=u.getUniqueDescriptions(t)}}async function R(a){if(E)return console.log("[EditEntryModal] Reutilizando instância existente"),E;try{return E=new U,await E.init(a),E}catch(t){return console.error("[EditEntryModal] Erro ao inicializar:",t),null}}function P(a){E?E.open(a):console.error("[EditEntryModal] Modal não inicializado")}function H(a){E&&E.setEntries(a)}function I(a){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(a)}function L(a){return a?typeof a=="number"?V(a):String(a):"-"}function C(a){return a?typeof a=="number"?N(a):String(a):"-"}function D(a){return`
    <button class="button small" onclick="window.editEntry(${a.rowIndex})" title="Editar">
      ✏️ Editar
    </button>
    <button class="button small danger" onclick="window.deleteEntry(${a.rowIndex})" title="Excluir">
      🗑️ Excluir
    </button>
  `}function G(a){return a.length===0?`
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
      ${a.map(e=>{const n=e.valor<0?"lancamentos__table-cell--expense":"lancamentos__table-cell--income";return`
      <div class="lancamentos__table-row">
        <div class="lancamentos__table-cell">${e.rowIndex||"-"}</div>
        <div class="lancamentos__table-cell">${L(e.data)}</div>
        <div class="lancamentos__table-cell">${e.conta||"-"}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--number ${n}">
          ${I(e.valor)}
        </div>
        <div class="lancamentos__table-cell">${e.descricao||"-"}</div>
        <div class="lancamentos__table-cell">${e.categoria||"-"}</div>
        <div class="lancamentos__table-cell">${C(e.orcamento)}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--actions">
          ${D(e)}
        </div>
      </div>
    `}).join("")}
    </div>
  `}function J(a){return a.length===0?`
      <div class="lancamentos__empty">
        <div class="lancamentos__empty-icon">📋</div>
        <p class="lancamentos__empty-text">Nenhum lançamento encontrado</p>
        <p>Adicione seu primeiro lançamento usando o botão "+" no canto inferior direito.</p>
      </div>
    `:`
    <div class="lancamentos__list">
      ${a.map(e=>{const n=e.valor<0?"lancamentos__item-value--expense":"lancamentos__item-value--income";return`
      <div class="lancamentos__item">
        <div class="lancamentos__item-header">
          <div class="lancamentos__item-info">
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">#:</span>
              <span class="lancamentos__item-value">${e.rowIndex||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Data:</span>
              <span class="lancamentos__item-value">${L(e.data)}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Conta:</span>
              <span class="lancamentos__item-value">${e.conta||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Valor:</span>
              <span class="lancamentos__item-value lancamentos__item-value--valor ${n}">
                ${I(e.valor)}
              </span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Descrição:</span>
              <span class="lancamentos__item-value">${e.descricao||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Categoria:</span>
              <span class="lancamentos__item-value">${e.categoria||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Orçamento:</span>
              <span class="lancamentos__item-value">${C(e.orcamento)}</span>
            </div>
          </div>
        </div>
        <div class="lancamentos__item-actions">
          ${D(e)}
        </div>
      </div>
    `}).join("")}
    </div>
  `}function X(a){return`
    ${G(a)}
    ${J(a)}
  `}const i={entries:[],filteredEntries:[],originalEntries:[],searchTerm:"",sortBy:"original",hideBlankDates:!0,isLoading:!1};function Y(){const a=document.getElementById("loadingIndicator");a&&(a.style.display="flex")}function K(){const a=document.getElementById("loadingIndicator");a&&(a.style.display="none")}function b(a,t="info"){const e=document.getElementById("messageContainer");if(!e)return;const n=document.createElement("div");n.className=`lancamentos__message lancamentos__message--${t}`,n.textContent=a,e.innerHTML="",e.appendChild(n),setTimeout(()=>{n.remove()},5e3)}function Q(){const a=document.getElementById("searchResults"),t=document.getElementById("searchCount"),e=document.getElementById("clearSearchBtn");!a||!t||!e||(i.searchTerm?(t.textContent=`${i.filteredEntries.length} resultado(s) encontrado(s)`,a.classList.add("lancamentos__search-results--visible"),e.style.display="flex"):(a.classList.remove("lancamentos__search-results--visible"),e.style.display="none"))}async function p(){if(!i.isLoading){i.isLoading=!0,i.entries=[],_(),Y();try{const e=((await u.fetchEntries(100)).entries||[]).filter(n=>!u.isBlankEntry(n));i.originalEntries=e,i.entries=[...i.originalEntries],h(),b("Lançamentos carregados com sucesso","success")}catch(a){console.error("Erro ao carregar lançamentos:",a),b("Erro ao carregar lançamentos: "+a.message,"error"),i.entries=[],i.filteredEntries=[],_()}finally{i.isLoading=!1,K()}}}function h(){let a=[...i.originalEntries];i.hideBlankDates&&(a=a.filter(t=>!(t.data===null||t.data===void 0||typeof t.data=="string"&&t.data.trim()===""))),a=u.sortEntries(a,i.sortBy),i.searchTerm&&(a=u.filterEntries(a,i.searchTerm)),i.filteredEntries=a,i.entries=i.sortBy==="original"?[...i.originalEntries]:u.sortEntries([...i.originalEntries],i.sortBy),_(),Q()}function _(){const a=document.getElementById("entriesContainer");if(!a)return;const t=i.searchTerm||i.filteredEntries.length>0?i.filteredEntries:i.entries;a.innerHTML=X(t)}function W(a){i.sortBy=a,h()}function Z(a){i.hideBlankDates=a,h()}function ee(a){i.searchTerm=a.trim(),h()}function te(){const a=document.getElementById("searchInput");a&&(a.value=""),i.searchTerm="",h()}function ne(a){const t=i.entries.find(e=>e.rowIndex===a);t?P(t):console.error("Lançamento não encontrado:",a)}async function ae(a){const t=i.entries.find(e=>e.rowIndex===a);if(!t){console.error("Lançamento não encontrado:",a);return}if(confirm(`Tem certeza que deseja excluir o lançamento?

Descrição: ${t.descricao}
Valor: R$ ${t.valor}`))try{await u.deleteEntry(a),b("Lançamento excluído com sucesso","success"),await p()}catch(e){console.error("Erro ao deletar lançamento:",e),b("Erro ao deletar lançamento: "+e.message,"error")}}window.editEntry=ne;window.deleteEntry=ae;async function S(){console.log("[Lançamentos] Inicializando página..."),M(),await j(s=>{console.log("✅ Lançamento adicionado:",s),p()}),await R(s=>{console.log("✅ Lançamento editado:",s),p()});const a=document.getElementById("openAddEntryModalBtn"),t=document.getElementById("openEntryModal");a&&a.addEventListener("click",()=>{console.log("🔓 Abrindo modal de adicionar lançamento..."),B()}),t&&t.addEventListener("click",()=>{console.log("🔓 Toggle modal de adicionar lançamento (FAB)...");const s=document.getElementById("entryModal");(s==null?void 0:s.style.display)==="flex"?q():B()});const e=document.getElementById("refreshEntriesBtn");e&&e.addEventListener("click",()=>{console.log("🔄 Atualizando lançamentos..."),p()});const n=document.getElementById("searchInput");n&&n.addEventListener("input",s=>{ee(s.target.value)});const o=document.getElementById("clearSearchBtn");o&&o.addEventListener("click",()=>{te()});const l=document.getElementById("sortSelect");l&&(l.value=i.sortBy,l.addEventListener("change",s=>{W(s.target.value)}));const r=document.getElementById("hideBlankDatesCheck");r&&(r.checked=i.hideBlankDates,r.addEventListener("change",s=>{Z(s.target.checked)})),document.addEventListener("entry:edited",()=>{console.log("📝 Entrada editada, recarregando..."),setTimeout(()=>{p()},300)}),await p(),H(i.entries),console.log("✅ Página de lançamentos inicializada")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",S):S();
