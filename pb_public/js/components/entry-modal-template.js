export const entryModalTemplate = /* html */ `
<div id="entryModal" class="entry-modal" aria-hidden="true">
  <button id="closeEntryModal" class="entry-modal__close" aria-label="Fechar modal">×</button>
  <div class="entry-modal__content">
    <h3 class="entry-modal__title">Lançamento de Despesa/Receita</h3>
    <form id="expenseForm" class="entry-modal__form">
      <fieldset>
        <div class="form-group">
          <label for="expenseDate">Data:</label>
          <input type="datetime-local" id="expenseDate" name="data" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="expenseAccount">Conta:</label>
          <input type="text" id="expenseAccount" name="conta" class="form-control" placeholder="Ex: Conta Corrente" required>
        </div>
        <div class="form-group valor-toggle-group">
          <label for="expenseValue">Valor:</label>
          <div class="valor-toggle-container">
            <button type="button" id="expenseSignBtn" class="button outline entry-toggle" aria-label="Alternar sinal">−</button>
            <input type="number" id="expenseValue" name="valor" class="form-control" step="0.01" min="0" placeholder="0,00" required>
            <input type="hidden" id="expenseSignValue" name="sinal" value="−">
          </div>
        </div>
        <div class="form-group">
          <label for="expenseDescription">Descrição:</label>
          <input type="text" id="expenseDescription" name="descricao" class="form-control" placeholder="Descrição da despesa" required>
        </div>
        <div class="form-group">
          <label for="expenseCategory">Categoria:</label>
          <input type="text" id="expenseCategory" name="categoria" class="form-control" placeholder="Digite uma categoria" required>
        </div>
        <div class="form-group">
          <label for="expenseBudget">Orçamento (data-chave):</label>
          <input type="date" id="expenseBudget" name="orcamento" class="form-control" required>
        </div>
        <div class="form-actions">
          <button type="reset" class="button warning">Limpar</button>
          <button type="submit" class="button success">Salvar</button>
        </div>
      </fieldset>
    </form>
  </div>
</div>
`;