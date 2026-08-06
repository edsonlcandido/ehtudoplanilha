# PRD-007 — Resumo Financeiro e Dashboard

## Contexto

O usuário precisa **entender sua saúde financeira** olhando para
agregados, não linha por linha. O dashboard deve mostrar:

- **Total de receitas** no período
- **Total de despesas** no período
- **Saldo** (receitas - despesas)
- **Gastos por categoria** (top 5, ou ranking)
- **Comparação com limite** (categorias PRECISO)
- **Meses disponíveis** (pra navegação)

## Objetivos

- Calcular agregados a partir dos lançamentos
- Filtrar por período (mês, intervalo custom)
- Excluir transferências do cálculo de receita/despesa
- Performance: agregado < 2s com 1000 lançamentos

## Não-objetivos

- **Gráficos complexos** (pizza, linha do tempo) — fora do MVP
- **Projeção** de gastos futuros (baseado em média) — fora
- **Insights de IA** ("você gastou 30% mais em delivery") — fora
- **Comparação mês a mês** (delta % vs mês anterior) — fora

## Personas

- **Usuário autenticado com planilha** — consulta o dashboard pra
  entender pra onde o dinheiro vai

## User Stories

### US-7.1 — Ver dashboard

**Como** usuário,
** quero** ver o resumo do mês atual ao abrir o dashboard,
** para** ter uma visão rápida da minha situação.

**Critérios de aceite:**
- [ ] Cards: Total Receitas, Total Despesas, Saldo (verde/vermelho)
- [ ] Top 5 categorias por gasto
- [ ] Período default: mês corrente (do dia 1 até hoje)
- [ ] Loading skeleton enquanto carrega
- [ ] Recarregar ao trocar de mês (com cache invalidado se forçar)

### US-7.2 — Trocar mês

**Como** usuário,
** quero** navegar entre meses passados,
** para** comparar e revisar histórico.

**Critérios de aceite:**
- [ ] Seletor de mês (dropdown ou calendário)
- [ ] Lista de meses disponíveis vem de `GET /get-available-months`
- [ ] Default: mês atual
- [ ] Ao trocar, recarrega agregado

### US-7.3 — Ver gastos por categoria

**Como** usuário,
** quero** ver o total gasto por categoria,
** para** saber onde meu dinheiro vai.

**Critérios de aceite:**
- [ ] Lista ordenada (maior pro menor)
- [ ] Exclui categoria "Transferência" do cálculo de despesa total
- [ ] Categoria PRECISO com limite: mostra barra de progresso
      (gasto / limite)
- [ ] Cor da barra: verde (<70%), amarelo (70-100%), vermelho (>100%)

### US-7.4 — Intervalo customizado

**Como** usuário,
** quero** filtrar por intervalo de datas (ex: 15/mar a 15/abr),
** para** análises específicas (ex: ver gasto total da viagem).

**Critérios de aceite:**
- [ ] Dois date pickers (início, fim)
- [ ] Default: mês corrente
- [ ] Ao aplicar, recarrega agregado

## Fluxo de uso

### Carregar dashboard
```
User abre /dashboard/index.html
  → GET /get-financial-summary?inicio=2025-11-01&fim=2025-11-30
  → hook busca entries da planilha
  → filtra transferências
  → agrega por tipo, categoria
  → retorna { totalReceitas, totalDespesas, saldo, porCategoria,
              porConta, mesesDisponiveis }
  → frontend renderiza cards e listas
```

### Trocar mês
```
User clica no seletor de mês → escolhe "Outubro 2025"
  → GET /get-financial-summary?inicio=2025-10-01&fim=2025-10-31
  → mesma lógica, retorna dados de outubro
```

## Edge cases

- **Mês sem lançamentos**: cards zerados, mensagem "Sem dados
  neste mês".
- **Mês com só transferências**: receitas/despesas zerados (excluindo
  transferências). Saldo = 0.
- **Limite zero ou não-setado**: categoria aparece sem barra de
  progresso.
- **Categoria deletada mas com lançamentos**: lançamentos antigos
  têm nome órfão. Agregado conta normalmente.
- **Performance com 5000+ entradas**: hook pode demorar. Cache de
  5min ajuda. Roadmap: agregação server-side com cache maior.
- **Lançamentos futuros no agregado**: hoje provavelmente **contam**
  (vide PRD-004). Decisão MVP: contar no orçamento mas **não**
  no saldo por conta. Implementação pode divergir.

## Requisitos técnicos

- Hook: `get-financial-summary.pb.js` (508 linhas no repo —
  relativamente grande)
- Hook: `get-available-months.pb.js` (lista meses com lançamentos)
- Hook: `get-sheet-entries.pb.js` (lista os lançamentos pra agregar)
- Cache: chave `ehtudoplanilha:sheet-entries` (TTL 5min)
- Exclusão de transferências: filtro por categoria hardcoded
  (vide PRD-005)

## Métricas de sucesso

- **Tempo de carregamento do dashboard** — meta: <2s com 1000 entries
- **% de uso por mês** — quantos acessos de dashboard por user/mês
  (engajamento)
- **Cache hit rate** — % de requests que voltam do cache
- **Taxa de erro** — % de requests com 500 ou timeout (meta: <1%)

## Notas / Pendências

- O hook `get-financial-summary.pb.js` está com 508 linhas — é o
  maior hook do projeto. Vale refatorar pra quebrar em helpers.
- Cálculo é feito **pelo backend** buscando entries da planilha
  (não há tabela de agregado no PB). Isso significa que o tempo
  de resposta é proporcional ao volume de entries.
- **Gráficos** são roadmap (PRD-013 futuro).
- **Comparação mês a mês** é roadmap.
- **Insights de IA** é roadmap.
