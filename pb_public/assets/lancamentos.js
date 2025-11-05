var F=Object.defineProperty;var O=(a,e,t)=>e in a?F(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var g=(a,e,t)=>O(a,typeof e!="symbol"?e+"":e,t);import{p as f}from"./auth.js";/* empty css          */import{r as N}from"./user-menu.js";import{a as p,d as V,b as j,f as q,e as z,i as R,o as S,c as U}from"./date-helpers.js";class P{async fetchEntries(e=100){if(!f)throw new Error("PocketBase não inicializado");try{const t=await fetch(`${f.baseUrl}/get-sheet-entries?limit=${e}`,{method:"GET",headers:{Authorization:`Bearer ${f.authStore.token}`,"Content-Type":"application/json"}}),n=await t.json();if(!t.ok)throw new Error(n.error||"Erro ao carregar entradas da planilha");return n}catch(t){throw console.error("Erro ao buscar entradas da planilha:",t),t}}async editEntry(e,t){if(!f)throw new Error("PocketBase não inicializado");try{const n=await fetch(`${f.baseUrl}/edit-sheet-entry`,{method:"PUT",headers:{Authorization:`Bearer ${f.authStore.token}`,"Content-Type":"application/json"},body:JSON.stringify({rowIndex:e,...t})}),o=await n.json();if(!n.ok)throw new Error(o.error||"Erro ao editar lançamento");return o}catch(n){throw console.error("Erro ao editar lançamento:",n),n}}async deleteEntry(e){if(!f)throw new Error("PocketBase não inicializado");try{const t=await fetch(`${f.baseUrl}/delete-sheet-entry`,{method:"DELETE",headers:{Authorization:`Bearer ${f.authStore.token}`,"Content-Type":"application/json"},body:JSON.stringify({rowIndex:e})}),n=await t.json();if(!t.ok)throw new Error(n.error||"Erro ao deletar lançamento");return n}catch(t){throw console.error("Erro ao deletar lançamento:",t),t}}isBlankEntry(e){return e?["data","conta","valor","descricao","categoria","orcamento","obs"].every(n=>{const o=e[n];return o==null?!0:typeof o=="number"?!1:String(o).trim()===""}):!0}normalizeEntry(e){const t={...e};if(typeof t.data=="number"){const n=p(t.data);n&&(t.data=n.toISOString())}if(typeof t.orcamento=="number"){const n=p(t.orcamento);n&&(t.orcamento=n.toISOString().split("T")[0])}return t}sortEntries(e,t){const n=[...e];return t==="original"?n.sort((o,l)=>(l.rowIndex||0)-(o.rowIndex||0)):t==="date"?n.sort((o,l)=>{const r=this.getDateValue(o.data);return this.getDateValue(l.data)-r}):t==="budget_date"?n.sort((o,l)=>{const r=this.getDateValue(o.orcamento),s=this.getDateValue(l.orcamento);if(r!==s)return s-r;const c=this.getDateValue(o.data);return this.getDateValue(l.data)-c}):n}getDateValue(e){if(!e)return Number.MAX_SAFE_INTEGER;if(typeof e=="number")return e;const t=new Date(e);return isNaN(t.getTime())?Number.MAX_SAFE_INTEGER:t.getTime()}filterEntries(e,t){if(!t||t.trim()==="")return e;const n=t.toLowerCase().trim();return e.filter(o=>{const l=this.formatDateForSearch(o.data),r=String(o.valor||""),s=String(o.descricao||"").toLowerCase(),c=String(o.categoria||"").toLowerCase(),m=String(o.conta||"").toLowerCase(),d=String(o.obs||"").toLowerCase();return l.includes(n)||r.includes(n)||s.includes(n)||c.includes(n)||m.includes(n)||d.includes(n)})}formatDateForSearch(e){if(!e)return"";let t=null;if(typeof e=="number"?t=p(e):t=new Date(e),!t||isNaN(t.getTime()))return"";const n=String(t.getDate()).padStart(2,"0"),o=String(t.getMonth()+1).padStart(2,"0"),l=t.getFullYear();return`${n}/${o}/${l}`}getUniqueAccounts(e){const t=new Set;return e.forEach(n=>{n.conta&&typeof n.conta=="string"&&t.add(n.conta.trim())}),Array.from(t).sort()}getUniqueCategories(e){const t=new Set;return e.forEach(n=>{n.categoria&&typeof n.categoria=="string"&&t.add(n.categoria.trim())}),Array.from(t).sort()}getUniqueDescriptions(e){const t=new Set;return e.forEach(n=>{n.descricao&&typeof n.descricao=="string"&&t.add(n.descricao.trim())}),Array.from(t).sort()}}const u=new P;let E=null;class H{constructor(){g(this,"modal",null);g(this,"form",null);g(this,"callback");g(this,"currentEntry",null);g(this,"accounts",[]);g(this,"categories",[]);g(this,"descriptions",[]);g(this,"entries",[])}getTemplate(){return`
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
    `}async init(e){if(console.log("[EditEntryModal] Inicializando..."),this.callback=e,document.body.insertAdjacentHTML("beforeend",this.getTemplate()),this.modal=document.getElementById("editEntryModal"),this.form=document.getElementById("editEntryForm"),!this.modal||!this.form)throw new Error("[EditEntryModal] Elementos do modal não encontrados");this.setupEventListeners(),console.log("[EditEntryModal] ✅ Inicializado com sucesso")}setupEventListeners(){var o,l;const e=document.getElementById("closeEditEntryModal");e==null||e.addEventListener("click",()=>this.close());const t=document.getElementById("cancelEditEntryBtn");t==null||t.addEventListener("click",()=>this.close()),(o=this.modal)==null||o.addEventListener("click",r=>{r.target===this.modal&&this.close()}),document.addEventListener("keydown",r=>{var s;r.key==="Escape"&&((s=this.modal)==null?void 0:s.style.display)==="flex"&&this.close()});const n=document.getElementById("editEntrySignBtn");n==null||n.addEventListener("click",()=>this.toggleSign()),(l=this.form)==null||l.addEventListener("submit",r=>this.handleSubmit(r)),this.setupCategoryAutocomplete(),this.setupDescriptionAutocomplete(),this.setupAccountAutocomplete()}setupCategoryAutocomplete(){const e=document.getElementById("editEntryCategory");if(!e)return;let t=this.ensureSuggestionsContainer("editCatSuggestions",e);e.addEventListener("focus",()=>{this.categories.length>0&&this.showAllSuggestions(e,t,this.categories)}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.categories)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}setupDescriptionAutocomplete(){const e=document.getElementById("editEntryDescription");if(!e)return;let t=this.ensureSuggestionsContainer("editDescSuggestions",e);e.addEventListener("focus",()=>{this.descriptions.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.descriptions,o=>{this.autoFillCategoryFromDescription(o)}))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.descriptions,n=>{this.autoFillCategoryFromDescription(n)})}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}autoFillCategoryFromDescription(e){const t=this.entries.find(n=>n.descricao&&n.descricao.trim().toLowerCase()===e.toLowerCase());if(t&&t.categoria){const n=document.getElementById("editEntryCategory");n&&(n.value=t.categoria)}}setupAccountAutocomplete(){const e=document.getElementById("editEntryAccount");if(!e)return;let t=this.ensureSuggestionsContainer("editAccountSuggestions",e);e.addEventListener("focus",()=>{this.accounts.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.accounts))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.accounts)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}ensureSuggestionsContainer(e,t){let n=document.getElementById(e);if(!n){n=document.createElement("div"),n.id=e,n.classList.add("entry-modal__suggestions"),n.setAttribute("role","listbox");const o=t.parentElement;o&&(o.style.position=o.style.position||"relative",o.appendChild(n))}return n}showAllSuggestions(e,t,n,o){if(t.innerHTML="",n.length===0){t.style.display="none";return}n.slice(0,20).forEach(r=>{const s=document.createElement("div");s.setAttribute("role","option"),s.classList.add("entry-modal__suggestion"),s.textContent=r,s.addEventListener("click",()=>{e.value=r,t.style.display="none",e.focus(),o&&o(r)}),t.appendChild(s)}),t.style.display="block"}showSuggestions(e,t,n,o){t.innerHTML="";const l=e.value.trim().toLowerCase();if(!l||l.length<1){this.showAllSuggestions(e,t,n,o);return}if(n.length===0){t.style.display="none";return}const r=n.filter(s=>s.toLowerCase().includes(l));if(r.length===0){t.style.display="none";return}r.forEach(s=>{const c=document.createElement("div");c.setAttribute("role","option"),c.classList.add("entry-modal__suggestion"),c.textContent=s,c.addEventListener("click",()=>{e.value=s,t.style.display="none",e.focus(),o&&o(s)}),t.appendChild(c)}),t.style.display="block"}formatDateTimeLocal(e){const[t,n]=e.split("T"),[o,l,r]=t.split("-");return`${r}/${l}/${o} ${n}`}formatDate(e){const[t,n,o]=e.split("-");return`${o}/${n}/${t}`}toggleSign(){var n;const e=document.getElementById("editEntrySignBtn"),t=((n=e==null?void 0:e.textContent)==null?void 0:n.trim())==="−";this.setSignState(!t)}setSignState(e){const t=document.getElementById("editEntrySignBtn"),n=document.getElementById("editEntrySignValue");!t||!n||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),n.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),n.value="+"))}open(e){var o;if(!this.modal||!e)return;console.log("[EditEntryModal] Abrindo modal para edição:",e),this.currentEntry=e,this.populateForm(e),this.modal.style.display="flex",this.modal.setAttribute("aria-hidden","false");const t=document.getElementById("openEntryModal");t&&(t.style.display="none",console.log("[EditEntryModal] ✅ Botão FAB oculto"));const n=(o=this.form)==null?void 0:o.querySelector("input");n==null||n.focus()}applySignState(e){const t=document.getElementById("editEntrySignBtn"),n=document.getElementById("editEntrySignValue");!t||!n||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),n.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),n.value="+"))}populateForm(e){const t=document.getElementById("editEntryDate");if(t&&e.data){let m="";if(typeof e.data=="number"){const d=p(e.data,!0);d&&(m=d.toISOString().slice(0,16))}else if(typeof e.data=="string"){const d=V(e.data);d&&(m=d.toISOString().slice(0,16))}t.value=m}const n=document.getElementById("editEntryAccount");n&&(n.value=e.conta||"");const o=document.getElementById("editEntryValue");if(o&&e.valor!==void 0){const m=Math.abs(e.valor);o.value=m.toString(),this.applySignState(e.valor<0)}const l=document.getElementById("editEntryDescription");l&&(l.value=e.descricao||"");const r=document.getElementById("editEntryCategory");r&&(r.value=e.categoria||"");const s=document.getElementById("editEntryBudget");if(s&&e.orcamento){let m="";if(typeof e.orcamento=="number"){const d=p(e.orcamento,!1);d&&(m=d.toISOString().split("T")[0])}else if(typeof e.orcamento=="string"){const d=j(e.orcamento);d&&(m=d.toISOString().split("T")[0])}s.value=m}const c=document.getElementById("editEntryObs");c&&(c.value=e.obs||"")}close(){if(!this.modal)return;this.modal.style.display="none",this.modal.setAttribute("aria-hidden","true"),this.currentEntry=null;const e=document.getElementById("openEntryModal");e&&(e.style.display="block",console.log("[EditEntryModal] ✅ Botão FAB visível")),this.form&&this.form.reset(),this.clearFeedback()}isOpen(){var e;return((e=this.modal)==null?void 0:e.style.display)==="flex"}async handleSubmit(e){if(e.preventDefault(),!this.form||!this.currentEntry||!this.currentEntry.rowIndex){console.error("[EditEntryModal] Dados insuficientes para edição");return}const t=new FormData(this.form),n=document.getElementById("saveEditEntryBtn");n&&(n.disabled=!0,n.textContent="Salvando...");try{const o=t.get("data"),l=t.get("orcamento"),r=parseFloat(t.get("valor")),s=t.get("sinal"),c=new Date(o),m=new Date(l);if(isNaN(c.getTime()))throw new Error("Data inválida");if(isNaN(m.getTime()))throw new Error("Data de orçamento inválida");const d=s==="−"||s==="-"?-Math.abs(r):Math.abs(r),T=this.formatDateTimeLocal(o),M=this.formatDate(l),v={data:T,conta:t.get("conta"),valor:d,descricao:t.get("descricao"),categoria:t.get("categoria"),orcamento:M,obs:t.get("observacoes")||""};console.log("[EditEntryModal] 📤 Enviando edição:",v),await u.editEntry(this.currentEntry.rowIndex,v),this.showFeedback("✅ Lançamento editado com sucesso!","success"),setTimeout(()=>{var B;this.close();const $=new CustomEvent("entry:edited",{detail:{rowIndex:(B=this.currentEntry)==null?void 0:B.rowIndex,entry:v}});document.dispatchEvent($),this.callback&&this.callback({success:!0,entry:v})},500)}catch(o){console.error("[EditEntryModal] ❌ Erro ao editar:",o),this.showFeedback(`❌ Erro: ${o instanceof Error?o.message:"Erro desconhecido"}`,"error")}finally{n&&(n.disabled=!1,n.textContent="Salvar")}}showFeedback(e,t){const n=document.getElementById("editEntryFeedback");n&&(n.textContent=e,n.className=`modal-feedback modal-feedback--${t}`,n.style.display="block",(t==="success"||t==="error")&&setTimeout(()=>{this.clearFeedback()},5e3))}clearFeedback(){const e=document.getElementById("editEntryFeedback");e&&(e.className="modal-feedback",e.textContent="",e.style.display="none")}setEntries(e){this.entries=e,this.accounts=u.getUniqueAccounts(e),this.categories=u.getUniqueCategories(e),this.descriptions=u.getUniqueDescriptions(e)}}async function G(a){if(E)return console.log("[EditEntryModal] Reutilizando instância existente"),E;try{return E=new H,await E.init(a),E}catch(e){return console.error("[EditEntryModal] Erro ao inicializar:",e),null}}function J(a){E?E.open(a):console.error("[EditEntryModal] Modal não inicializado")}function X(a){E&&E.setEntries(a)}function L(a){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(a)}function C(a){return a?typeof a=="number"?q(a):String(a):"-"}function D(a){return a?typeof a=="number"?z(a):String(a):"-"}function x(a){return`
    <button class="button small" onclick="window.editEntry(${a.rowIndex})" title="Editar">
      ✏️ Editar
    </button>
    <button class="button small danger" onclick="window.deleteEntry(${a.rowIndex})" title="Excluir">
      🗑️ Excluir
    </button>
  `}function Y(a){return a.length===0?`
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
      ${a.map(t=>{const n=t.valor<0?"lancamentos__table-cell--expense":"lancamentos__table-cell--income";return`
      <div class="lancamentos__table-row">
        <div class="lancamentos__table-cell">${t.rowIndex||"-"}</div>
        <div class="lancamentos__table-cell">${C(t.data)}</div>
        <div class="lancamentos__table-cell">${t.conta||"-"}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--number ${n}">
          ${L(t.valor)}
        </div>
        <div class="lancamentos__table-cell">${t.descricao||"-"}</div>
        <div class="lancamentos__table-cell">${t.categoria||"-"}</div>
        <div class="lancamentos__table-cell">${D(t.orcamento)}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--actions">
          ${x(t)}
        </div>
      </div>
    `}).join("")}
    </div>
  `}function K(a){return a.length===0?`
      <div class="lancamentos__empty">
        <div class="lancamentos__empty-icon">📋</div>
        <p class="lancamentos__empty-text">Nenhum lançamento encontrado</p>
        <p>Adicione seu primeiro lançamento usando o botão "+" no canto inferior direito.</p>
      </div>
    `:`
    <div class="lancamentos__list">
      ${a.map(t=>{const n=t.valor<0?"lancamentos__item-value--expense":"lancamentos__item-value--income";return`
      <div class="lancamentos__item">
        <div class="lancamentos__item-header">
          <div class="lancamentos__item-info">
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">#:</span>
              <span class="lancamentos__item-value">${t.rowIndex||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Data:</span>
              <span class="lancamentos__item-value">${C(t.data)}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Conta:</span>
              <span class="lancamentos__item-value">${t.conta||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Valor:</span>
              <span class="lancamentos__item-value lancamentos__item-value--valor ${n}">
                ${L(t.valor)}
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
              <span class="lancamentos__item-value">${D(t.orcamento)}</span>
            </div>
          </div>
        </div>
        <div class="lancamentos__item-actions">
          ${x(t)}
        </div>
      </div>
    `}).join("")}
    </div>
  `}function Q(a){return`
    ${Y(a)}
    ${K(a)}
  `}const i={entries:[],filteredEntries:[],originalEntries:[],searchTerm:"",sortBy:"original",hideBlankDates:!0,isLoading:!1};function W(){const a=document.getElementById("loadingIndicator");a&&(a.style.display="flex")}function Z(){const a=document.getElementById("loadingIndicator");a&&(a.style.display="none")}function b(a,e="info"){const t=document.getElementById("messageContainer");if(!t)return;const n=document.createElement("div");n.className=`lancamentos__message lancamentos__message--${e}`,n.textContent=a,t.innerHTML="",t.appendChild(n),setTimeout(()=>{n.remove()},5e3)}function ee(){const a=document.getElementById("searchResults"),e=document.getElementById("searchCount"),t=document.getElementById("clearSearchBtn");!a||!e||!t||(i.searchTerm?(e.textContent=`${i.filteredEntries.length} resultado(s) encontrado(s)`,a.classList.add("lancamentos__search-results--visible"),t.style.display="flex"):(a.classList.remove("lancamentos__search-results--visible"),t.style.display="none"))}async function y(){if(!i.isLoading){i.isLoading=!0,i.entries=[],w(),W();try{const t=((await u.fetchEntries(100)).entries||[]).filter(n=>!u.isBlankEntry(n));i.originalEntries=t,i.entries=[...i.originalEntries],h(),b("Lançamentos carregados com sucesso","success")}catch(a){console.error("Erro ao carregar lançamentos:",a),b("Erro ao carregar lançamentos: "+a.message,"error"),i.entries=[],i.filteredEntries=[],w()}finally{i.isLoading=!1,Z()}}}function h(){let a=[...i.originalEntries];i.hideBlankDates&&(a=a.filter(e=>!(e.data===null||e.data===void 0||typeof e.data=="string"&&e.data.trim()===""))),a=u.sortEntries(a,i.sortBy),i.searchTerm&&(a=u.filterEntries(a,i.searchTerm)),i.filteredEntries=a,i.entries=i.sortBy==="original"?[...i.originalEntries]:u.sortEntries([...i.originalEntries],i.sortBy),w(),ee()}function w(){const a=document.getElementById("entriesContainer");if(!a)return;const e=i.searchTerm||i.filteredEntries.length>0?i.filteredEntries:i.entries;a.innerHTML=Q(e)}function te(a){i.sortBy=a,h()}function ne(a){i.hideBlankDates=a,h()}function ae(a){i.searchTerm=a.trim(),h()}function oe(){const a=document.getElementById("searchInput");a&&(a.value=""),i.searchTerm="",h()}function se(a){const e=i.entries.find(t=>t.rowIndex===a);e?J(e):console.error("Lançamento não encontrado:",a)}let _=null;function k(a){var s;const e=i.entries.find(c=>c.rowIndex===a);if(!e){console.error("Lançamento não encontrado:",a);return}_=a;const t=document.getElementById("deleteRowNumber"),n=document.getElementById("deleteDate"),o=document.getElementById("deleteValue"),l=document.getElementById("deleteDescription");t&&(t.textContent=String(e.rowIndex||"-")),n&&(n.textContent=String(e.data||"-")),o&&(o.textContent=`R$ ${((s=e.valor)==null?void 0:s.toFixed(2))||"0.00"}`),l&&(l.textContent=e.descricao||"-");const r=document.getElementById("deleteModal");r&&(r.style.display="flex")}function A(){const a=document.getElementById("deleteModal");a&&(a.style.display="none"),_=null}async function ie(){if(_===null){console.error("Nenhum lançamento selecionado para exclusão");return}const a=document.getElementById("deleteConfirmBtn");a&&(a.disabled=!0,a.textContent="Excluindo...");try{await u.deleteEntry(_),b("Lançamento excluído com sucesso","success"),A(),await y()}catch(e){console.error("Erro ao deletar lançamento:",e),b("Erro ao deletar lançamento: "+e.message,"error")}finally{a&&(a.disabled=!1,a.textContent="Excluir")}}function re(a){k(a)}window.editEntry=se;window.deleteEntry=re;window.openDeleteModal=k;window.closeDeleteModal=A;window.confirmDelete=ie;async function I(){console.log("[Lançamentos] Inicializando página..."),N(),await R(s=>{console.log("✅ Lançamento adicionado:",s),y()}),await G(s=>{console.log("✅ Lançamento editado:",s),y()});const a=document.getElementById("openAddEntryModalBtn"),e=document.getElementById("openEntryModal");a&&a.addEventListener("click",()=>{console.log("🔓 Abrindo modal de adicionar lançamento..."),S()}),e&&e.addEventListener("click",()=>{console.log("🔓 Toggle modal de adicionar lançamento (FAB)...");const s=document.getElementById("entryModal");(s==null?void 0:s.style.display)==="flex"?U():S()});const t=document.getElementById("refreshEntriesBtn");t&&t.addEventListener("click",()=>{console.log("🔄 Atualizando lançamentos..."),y()});const n=document.getElementById("searchInput");n&&n.addEventListener("input",s=>{ae(s.target.value)});const o=document.getElementById("clearSearchBtn");o&&o.addEventListener("click",()=>{oe()});const l=document.getElementById("sortSelect");l&&(l.value=i.sortBy,l.addEventListener("change",s=>{te(s.target.value)}));const r=document.getElementById("hideBlankDatesCheck");r&&(r.checked=i.hideBlankDates,r.addEventListener("change",s=>{ne(s.target.checked)})),document.addEventListener("entry:edited",()=>{console.log("📝 Entrada editada, recarregando..."),setTimeout(()=>{y()},300)}),await y(),X(i.entries),console.log("✅ Página de lançamentos inicializada")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",I):I();
