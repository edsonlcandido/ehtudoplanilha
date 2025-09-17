export const editEntryModalTemplate = /* html */ `
<div id="editEntryModal" class="entry-modal" style="display: none;" aria-hidden="true">
  <button id="closeEditEntryModal" class="entry-modal__close" aria-label="Fechar modal">×</button>
  <div class="edit-entry-modal__content">
    <h3 class="edit-entry-modal__title">Editar Lançamento</h3>
    <form id="editEntryForm" class="edit-entry-modal__form">
      <fieldset style="border: none; padding: 0; margin: 0;">
        <div class="form-group">
          <label for="editEntryDate">Data:</label>
          <input type="datetime-local" id="editEntryDate" name="data" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="editEntryAccount">Conta:</label>
          <div class="edit-input-container">
            <input type="text" id="editEntryAccount" name="conta" class="form-control" placeholder="Ex: Conta Corrente" required>
            <div id="editAccountSuggestions" class="edit-modal__suggestions"></div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="editEntryValue">Valor:</label>
          <div class="edit-valor-toggle-container">
            <button type="button" id="editEntrySignBtn" class="entry-toggle" aria-label="Alternar sinal">−</button>
            <input type="number" id="editEntryValue" name="valor" class="form-control" step="0.01" min="0" placeholder="0,00" required>
            <input type="hidden" id="editEntrySignValue" name="sinal" value="-">
          </div>
        </div>
        
        <div class="form-group">
          <label for="editEntryDescription">Descrição:</label>
          <div class="edit-input-container">
            <input type="text" id="editEntryDescription" name="descricao" class="form-control" placeholder="Descrição" required>
            <div id="editDescriptionSuggestions" class="edit-modal__suggestions"></div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="editEntryCategory">Categoria:</label>
          <div class="edit-input-container">
            <input type="text" id="editEntryCategory" name="categoria" class="form-control" placeholder="Digite uma categoria" required>
            <div id="editCategorySuggestions" class="edit-modal__suggestions"></div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="editEntryBudget">Orçamento (data-chave):</label>
          <input type="date" id="editEntryBudget" name="orcamento" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="editEntryObs">Observações:</label>
          <textarea id="editEntryObs" name="observacoes" rows="3" class="form-control" placeholder="Notas adicionais..."></textarea>
        </div>
        
        <div id="editEntryFeedback" class="edit-modal-feedback"></div>
        
        <div class="edit-entry-modal__actions">
          <button type="button" id="cancelEditEntryBtn" class="button">Cancelar</button>
          <button type="submit" id="saveEditEntryBtn" class="button success">Salvar</button>
        </div>
      </fieldset>
    </form>
  </div>
</div>
`;
