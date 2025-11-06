var A=Object.defineProperty;var F=(n,e,t)=>e in n?A(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var g=(n,e,t)=>F(n,typeof e!="symbol"?e+"":e,t);import"./auth.js";/* empty css          */import{h as w,j as $,k as O,l as u,m as S,e as V,i as N,a as q,b as R,c as j,o as z,d as H,f as I}from"./lancamentos2.js";import{r as U}from"./user-menu.js";import{a as P,s as G,b as J}from"./toast.js";let f=null;class K{constructor(){g(this,"modal",null);g(this,"form",null);g(this,"callback");g(this,"currentEntry",null);g(this,"accounts",[]);g(this,"categories",[]);g(this,"descriptions",[]);g(this,"entries",[])}getTemplate(){return`
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
    `}async init(e){if(console.log("[EditEntryModal] Inicializando..."),this.callback=e,document.body.insertAdjacentHTML("beforeend",this.getTemplate()),this.modal=document.getElementById("editEntryModal"),this.form=document.getElementById("editEntryForm"),!this.modal||!this.form)throw new Error("[EditEntryModal] Elementos do modal não encontrados");this.setupEventListeners(),console.log("[EditEntryModal] ✅ Inicializado com sucesso")}setupEventListeners(){var o,r;const e=document.getElementById("closeEditEntryModal");e==null||e.addEventListener("click",()=>this.close());const t=document.getElementById("cancelEditEntryBtn");t==null||t.addEventListener("click",()=>this.close()),(o=this.modal)==null||o.addEventListener("click",s=>{s.target===this.modal&&this.close()}),document.addEventListener("keydown",s=>{var l;s.key==="Escape"&&((l=this.modal)==null?void 0:l.style.display)==="flex"&&this.close()});const a=document.getElementById("editEntrySignBtn");a==null||a.addEventListener("click",()=>this.toggleSign()),(r=this.form)==null||r.addEventListener("submit",s=>this.handleSubmit(s)),this.setupCategoryAutocomplete(),this.setupDescriptionAutocomplete(),this.setupAccountAutocomplete()}setupCategoryAutocomplete(){const e=document.getElementById("editEntryCategory");if(!e)return;let t=this.ensureSuggestionsContainer("editCatSuggestions",e);e.addEventListener("focus",()=>{this.categories.length>0&&this.showAllSuggestions(e,t,this.categories)}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.categories)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}setupDescriptionAutocomplete(){const e=document.getElementById("editEntryDescription");if(!e)return;let t=this.ensureSuggestionsContainer("editDescSuggestions",e);e.addEventListener("focus",()=>{this.descriptions.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.descriptions,o=>{this.autoFillCategoryFromDescription(o)}))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.descriptions,a=>{this.autoFillCategoryFromDescription(a)})}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}autoFillCategoryFromDescription(e){const t=this.entries.find(a=>a.descricao&&a.descricao.trim().toLowerCase()===e.toLowerCase());if(t&&t.categoria){const a=document.getElementById("editEntryCategory");a&&(a.value=t.categoria)}}setupAccountAutocomplete(){const e=document.getElementById("editEntryAccount");if(!e)return;let t=this.ensureSuggestionsContainer("editAccountSuggestions",e);e.addEventListener("focus",()=>{this.accounts.length>0&&(e.value.trim().toLowerCase()||this.showAllSuggestions(e,t,this.accounts))}),e.addEventListener("input",()=>{this.showSuggestions(e,t,this.accounts)}),e.addEventListener("blur",()=>{setTimeout(()=>t.style.display="none",200)})}ensureSuggestionsContainer(e,t){let a=document.getElementById(e);if(!a){a=document.createElement("div"),a.id=e,a.classList.add("entry-modal__suggestions"),a.setAttribute("role","listbox");const o=t.parentElement;o&&(o.style.position=o.style.position||"relative",o.appendChild(a))}return a}showAllSuggestions(e,t,a,o){if(t.innerHTML="",a.length===0){t.style.display="none";return}a.slice(0,20).forEach(s=>{const l=document.createElement("div");l.setAttribute("role","option"),l.classList.add("entry-modal__suggestion"),l.textContent=s,l.addEventListener("click",()=>{e.value=s,t.style.display="none",e.focus(),o&&o(s)}),t.appendChild(l)}),t.style.display="block"}showSuggestions(e,t,a,o){t.innerHTML="";const r=e.value.trim().toLowerCase();if(!r||r.length<1){this.showAllSuggestions(e,t,a,o);return}if(a.length===0){t.style.display="none";return}const s=a.filter(l=>l.toLowerCase().includes(r));if(s.length===0){t.style.display="none";return}s.forEach(l=>{const m=document.createElement("div");m.setAttribute("role","option"),m.classList.add("entry-modal__suggestion"),m.textContent=l,m.addEventListener("click",()=>{e.value=l,t.style.display="none",e.focus(),o&&o(l)}),t.appendChild(m)}),t.style.display="block"}formatDateTimeLocal(e){const[t,a]=e.split("T"),[o,r,s]=t.split("-");return`${s}/${r}/${o} ${a}`}formatDate(e){const[t,a,o]=e.split("-");return`${o}/${a}/${t}`}toggleSign(){var a;const e=document.getElementById("editEntrySignBtn"),t=((a=e==null?void 0:e.textContent)==null?void 0:a.trim())==="−";this.setSignState(!t)}setSignState(e){const t=document.getElementById("editEntrySignBtn"),a=document.getElementById("editEntrySignValue");!t||!a||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),a.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),a.value="+"))}open(e){var o;if(!this.modal||!e)return;console.log("[EditEntryModal] Abrindo modal para edição:",e),this.currentEntry=e,this.populateForm(e),this.modal.style.display="flex",this.modal.setAttribute("aria-hidden","false");const t=document.getElementById("openEntryModal");t&&(t.style.visibility="hidden",console.log("[EditEntryModal] ✅ Botão FAB oculto"));const a=(o=this.form)==null?void 0:o.querySelector("input");a==null||a.focus()}applySignState(e){const t=document.getElementById("editEntrySignBtn"),a=document.getElementById("editEntrySignValue");!t||!a||(e?(t.textContent="−",t.classList.add("entry-toggle--expense"),t.classList.remove("entry-toggle--income"),a.value="−"):(t.textContent="+",t.classList.remove("entry-toggle--expense"),t.classList.add("entry-toggle--income"),a.value="+"))}populateForm(e){const t=document.getElementById("editEntryDate");if(t&&e.data){let d="";if(typeof e.data=="number"){const c=w(e.data,!0);c&&(d=c.toISOString().slice(0,16))}else if(typeof e.data=="string"){const c=$(e.data);c&&(d=c.toISOString().slice(0,16))}t.value=d}else t&&(t.value="");const a=document.getElementById("editEntryAccount");a&&(a.value=e.conta||"");const o=document.getElementById("editEntryValue");if(o&&e.valor!==void 0){const d=Math.abs(e.valor);o.value=d.toString(),this.applySignState(e.valor<0)}const r=document.getElementById("editEntryDescription");r&&(r.value=e.descricao||"");const s=document.getElementById("editEntryCategory");s&&(s.value=e.categoria||"");const l=document.getElementById("editEntryBudget");if(l&&e.orcamento){let d="";if(typeof e.orcamento=="number"){const c=w(e.orcamento,!1);c&&(d=c.toISOString().split("T")[0])}else if(typeof e.orcamento=="string"){const c=O(e.orcamento);c&&(d=c.toISOString().split("T")[0])}l.value=d}const m=document.getElementById("editEntryObs");m&&(m.value=e.obs||"")}close(){if(!this.modal)return;this.modal.style.display="none",this.modal.setAttribute("aria-hidden","true"),this.currentEntry=null;const e=document.getElementById("openEntryModal");e&&(e.style.visibility="visible",console.log("[EditEntryModal] ✅ Botão FAB visível")),this.form&&this.form.reset(),this.clearFeedback()}isOpen(){var e;return((e=this.modal)==null?void 0:e.style.display)==="flex"}async handleSubmit(e){if(e.preventDefault(),!this.form||!this.currentEntry||!this.currentEntry.rowIndex){console.error("[EditEntryModal] Dados insuficientes para edição");return}const t=new FormData(this.form),a=document.getElementById("saveEditEntryBtn");a&&(a.disabled=!0,a.textContent="Salvando...");try{const o=t.get("data"),r=t.get("orcamento"),s=parseFloat(t.get("valor")),l=t.get("sinal"),m=new Date(r);if(isNaN(m.getTime()))throw new Error("Data de orçamento inválida");let d="";if(o&&o.trim()!==""){if(!o.includes("T"))throw new Error("Formato de data/hora inválido");const b=new Date(o);if(isNaN(b.getTime()))throw new Error("Data inválida");d=this.formatDateTimeLocal(o)}const c=l==="−"||l==="-"?-Math.abs(s):Math.abs(s),T=this.formatDate(r),p={data:d,conta:t.get("conta"),valor:c,descricao:t.get("descricao"),categoria:t.get("categoria"),orcamento:T,obs:t.get("observacoes")||""};console.log("[EditEntryModal] 📤 Enviando edição:",p),await u.editEntry(this.currentEntry.rowIndex,p),this.showFeedback("✅ Lançamento editado com sucesso!","success"),setTimeout(()=>{var B;this.close();const b=new CustomEvent("entry:edited",{detail:{rowIndex:(B=this.currentEntry)==null?void 0:B.rowIndex,entry:p}});document.dispatchEvent(b),this.callback&&this.callback({success:!0,entry:p})},500)}catch(o){console.error("[EditEntryModal] ❌ Erro ao editar:",o),this.showFeedback(`❌ Erro: ${o instanceof Error?o.message:"Erro desconhecido"}`,"error")}finally{a&&(a.disabled=!1,a.textContent="Salvar")}}showFeedback(e,t){const a=document.getElementById("editEntryFeedback");a&&(a.textContent=e,a.className=`modal-feedback modal-feedback--${t}`,a.style.display="block",(t==="success"||t==="error")&&setTimeout(()=>{this.clearFeedback()},5e3))}clearFeedback(){const e=document.getElementById("editEntryFeedback");e&&(e.className="modal-feedback",e.textContent="",e.style.display="none")}setEntries(e){this.entries=e,this.accounts=u.getUniqueAccounts(e),this.categories=u.getUniqueCategories(e),this.descriptions=u.getUniqueDescriptions(e)}}async function Q(n){if(f)return console.log("[EditEntryModal] Reutilizando instância existente"),f;try{return f=new K,await f.init(n),f}catch(e){return console.error("[EditEntryModal] Erro ao inicializar:",e),null}}function W(n){f?f.open(n):console.error("[EditEntryModal] Modal não inicializado")}function X(n){f&&f.setEntries(n)}function C(n){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n)}function x(n){return n?typeof n=="number"?S(n):String(n):"-"}function D(n){return n?typeof n=="number"?V(n):String(n):"-"}function M(n){return`
    <button class="button small" onclick="window.editEntry(${n.rowIndex})" title="Editar">
      ✏️ Editar
    </button>
    <button class="button small danger" onclick="window.deleteEntry(${n.rowIndex})" title="Excluir">
      🗑️ Excluir
    </button>
  `}function Y(n){return n.length===0?`
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
        <div class="lancamentos__table-cell">${x(t.data)}</div>
        <div class="lancamentos__table-cell">${t.conta||"-"}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--number ${a}">
          ${C(t.valor)}
        </div>
        <div class="lancamentos__table-cell">${t.descricao||"-"}</div>
        <div class="lancamentos__table-cell">${t.categoria||"-"}</div>
        <div class="lancamentos__table-cell">${D(t.orcamento)}</div>
        <div class="lancamentos__table-cell lancamentos__table-cell--actions">
          ${M(t)}
        </div>
      </div>
    `}).join("")}
    </div>
  `}function Z(n){return n.length===0?`
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
              <span class="lancamentos__item-value">${x(t.data)}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Conta:</span>
              <span class="lancamentos__item-value">${t.conta||"-"}</span>
            </div>
            <div class="lancamentos__item-row">
              <span class="lancamentos__item-label">Valor:</span>
              <span class="lancamentos__item-value lancamentos__item-value--valor ${a}">
                ${C(t.valor)}
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
          ${M(t)}
        </div>
      </div>
    `}).join("")}
    </div>
  `}function ee(n){return`
    ${Y(n)}
    ${Z(n)}
  `}const i={entries:[],filteredEntries:[],originalEntries:[],searchTerm:"",sortBy:"original",hideBlankDates:!0,isLoading:!1};function te(){const n=document.getElementById("loadingIndicator");n&&(n.style.display="flex")}function ne(){const n=document.getElementById("loadingIndicator");n&&(n.style.display="none")}function v(n,e="info"){e==="success"?P(n):e==="error"?G(n):J(n,"Info")}function ae(){const n=document.getElementById("searchResults"),e=document.getElementById("searchCount"),t=document.getElementById("clearSearchBtn");!n||!e||!t||(i.searchTerm?(e.textContent=`${i.filteredEntries.length} resultado(s) encontrado(s)`,n.classList.add("lancamentos__search-results--visible"),t.style.display="flex"):(n.classList.remove("lancamentos__search-results--visible"),t.style.display="none"))}async function y(n=!1){if(!i.isLoading){i.isLoading=!0,i.entries=[],_(),te();try{const a=((await u.fetchEntries(100,n)).entries||[]).filter(r=>!u.isBlankEntry(r));i.originalEntries=a,i.entries=[...i.originalEntries],E(),v("Lançamentos carregados com sucesso"+(n?" (cache atualizado)":""),"success")}catch(e){console.error("Erro ao carregar lançamentos:",e),v("Erro ao carregar lançamentos: "+e.message,"error"),i.entries=[],i.filteredEntries=[],_()}finally{i.isLoading=!1,ne()}}}function E(){let n=[...i.originalEntries];i.hideBlankDates&&(n=n.filter(e=>!(e.data===null||e.data===void 0||typeof e.data=="string"&&e.data.trim()===""))),n=u.sortEntries(n,i.sortBy),i.searchTerm&&(n=u.filterEntries(n,i.searchTerm)),i.filteredEntries=n,i.entries=i.sortBy==="original"?[...i.originalEntries]:u.sortEntries([...i.originalEntries],i.sortBy),_(),ae()}function _(){const n=document.getElementById("entriesContainer");if(!n)return;const e=i.searchTerm||i.filteredEntries.length>0?i.filteredEntries:i.entries;n.innerHTML=ee(e)}function oe(n){i.sortBy=n,E()}function se(n){i.hideBlankDates=n,E()}function ie(n){i.searchTerm=n.trim(),E()}function le(){const n=document.getElementById("searchInput");n&&(n.value=""),i.searchTerm="",E()}function re(n){const e=i.entries.find(t=>t.rowIndex===n);e?W(e):console.error("Lançamento não encontrado:",n)}let h=null;function ce(n){const e=i.entries.find(l=>l.rowIndex===n);if(!e){console.error("Lançamento não encontrado:",n);return}h=n;const t=document.getElementById("deleteRowNumber"),a=document.getElementById("deleteDate"),o=document.getElementById("deleteValue"),r=document.getElementById("deleteDescription");if(t&&(t.textContent=String(e.rowIndex||"-")),a){let l="-";e.data&&(typeof e.data=="number"?l=S(e.data):typeof e.data=="string"&&(l=e.data)),a.textContent=l}o&&(o.textContent=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(e.valor)),r&&(r.textContent=e.descricao||"-");const s=document.getElementById("deleteModal");s&&(s.style.display="flex")}function k(){h=null;const n=document.getElementById("deleteModal");n&&(n.style.display="none")}async function de(){if(h===null){console.error("Nenhum lançamento pendente para exclusão");return}const n=h,e=document.getElementById("deleteConfirmBtn");e&&(e.disabled=!0,e.textContent="Excluindo...");try{await u.deleteEntry(n),v("Lançamento excluído com sucesso","success"),k(),await y()}catch(t){console.error("Erro ao deletar lançamento:",t),v("Erro ao deletar lançamento: "+t.message,"error")}finally{e&&(e.disabled=!1,e.textContent="Excluir")}}function me(n){ce(n)}window.editEntry=re;window.deleteEntry=me;window.lancamentosManager={closeDeleteModal:k,confirmDelete:de,closeSplitModal:()=>{const n=document.getElementById("splitModal");n&&(n.style.display="none")},confirmSplit:()=>{console.warn("Funcionalidade de divisão de parcelas não implementada")}};async function L(){console.log("[Lançamentos] Inicializando página..."),U(),await N(s=>{console.log("✅ Lançamento adicionado:",s),y()}),await Q(s=>{console.log("✅ Lançamento editado:",s),y()}),await q(s=>{console.log("✅ Lançamento futuro adicionado:",s),y()}),await R(s=>{console.log("✅ Transferência realizada:",s),y()}),j(()=>I(),()=>H(),()=>z());const n=document.getElementById("openAddEntryModalBtn");n&&n.addEventListener("click",()=>{console.log("🔓 Abrindo modal de adicionar lançamento..."),I()});const e=document.getElementById("refreshEntriesBtn");e&&e.addEventListener("click",()=>{console.log("🔄 Atualizando lançamentos (forceRefresh=true)..."),y(!0)});const t=document.getElementById("searchInput");t&&t.addEventListener("input",s=>{ie(s.target.value)});const a=document.getElementById("clearSearchBtn");a&&a.addEventListener("click",()=>{le()});const o=document.getElementById("sortSelect");o&&(o.value=i.sortBy,o.addEventListener("change",s=>{oe(s.target.value)}));const r=document.getElementById("hideBlankDatesCheck");r&&(r.checked=i.hideBlankDates,r.addEventListener("change",s=>{se(s.target.checked)})),document.addEventListener("entry:edited",()=>{console.log("📝 Entrada editada, recarregando..."),setTimeout(()=>{y()},300)}),await y(),X(i.entries),console.log("✅ Página de lançamentos inicializada")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",L):L();
