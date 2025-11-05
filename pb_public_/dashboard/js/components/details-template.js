// Template HTML para injeção dentro do <aside class="details">
export const detailsTemplate = `
  <div class="details__aggregates">
    <h3 class="details__title">Saldo e contas</h3>
    <h3><span id="detail-saldo">R$ 0,00</span></h3>
    <div id="detail-accounts-cards" class="details__cards">
      <!-- cards por conta serão inseridos aqui -->
    </div>
  </div>
  <div class="details__top-categories" style="margin-top:1rem;">
    <h3 class="details__title">Top 10 Gastos por Categoria</h3>
    <div class="tabela-rolavel">
      <table class="details__table primary">
        <thead>
          <tr><th>#</th><th>Categoria</th><th>Total</th></tr>
        </thead>
        <tbody id="detail-categories-list"></tbody>
      </table>
    </div>
  </div>
`;