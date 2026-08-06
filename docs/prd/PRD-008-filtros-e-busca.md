# PRD-008 — Filtros e Busca de Lançamentos

## Contexto

A lista de lançamentos cresce rápido. Em 6 meses, um usuário ativo
pode ter 200+ entradas. Procurar uma específica vira pesadelo sem
filtro.

O usuário precisa:
- Buscar por **texto livre** (descrição, observação)
- Filtrar por **conta** específica
- Filtrar por **categoria**
- Filtrar por **período** (data início/fim OU orçamento)
- **Ordenar** por data, valor, ou ordem original
- Combinar filtros (AND)

## Objetivos

- Filtros aplicam client-side sobre o resultado de `get-sheet-entries`
- Performance: 1000 entries filtrados em <100ms
- Estado dos filtros persiste na sessão (não entre reloads)
- "Reset" rápido

## Não-objetivos

- **Filtros salvos** ("sempre ver só Alimentação") — fora
- **Filtros compartilháveis** (URL com query string) — fora do MVP
- **Busca fuzzy** (tolerância a typo) — fora
- **Busca server-side** (com volume, faz sentido, mas não hoje)

## Personas

- **Usuário autenticado com planilha** — procura lançamentos
  específicos, revisa gastos de uma categoria, etc

## User Stories

### US-8.1 — Busca por texto

**Como** usuário,
** quero** digitar "supermercado" e ver só os lançamentos com essa
 palavra,
** para** achar rápido.

**Critérios de aceite:**
- [ ] Input de busca no topo da lista
- [ ] Filtragem client-side, case-insensitive
- [ ] Busca em: descrição, observação
- [ ] **Não** busca em: data, conta, valor, categoria (esses têm
      filtros próprios)
- [ ] Resultado atualiza enquanto digita (debounce ~200ms)
- [ ] Contador: "12 lançamentos encontrados"

### US-8.2 — Filtrar por conta

**Como** usuário,
** quero** ver só os lançamentos da conta "Banco do Brasil",
** para** conferir o extrato de uma conta específica.

**Critérios de aceite:**
- [ ] Select de conta (pode ser dropdown multi-select)
- [ ] Opções vêm da lista de contas já usadas nos lançamentos
      (não precisa estar na aba Categorias)
- [ ] "Todas" como default

### US-8.3 — Filtrar por categoria

**Como** usuário,
** quero** ver só os lançamentos da categoria "Alimentação",
** para** conferir o quanto gastei com isso.

**Critérios de aceite:**
- [ ] Select de categoria (vem da aba Categorias via cache)
- [ ] "Todas" como default

### US-8.4 — Filtrar por período

**Como** usuário,
** quero** ver só lançamentos de outubro,
** para** conferir o que entrou/saiu naquele mês.

**Critérios de aceite:**
- [ ] Dois date pickers (início, fim)
- [ ] Default: mês corrente
- [ ] **Atenção**: pode filtrar por **data efetiva** (coluna A) OU
      por **orçamento** (coluna F). Decisão MVP: filtrar por data
      efetiva. Roadmap: toggle "filtrar por orçamento".

### US-8.5 — Ordenar

**Como** usuário,
** quero** ordenar por data (mais recente primeiro) ou por valor,
** para** ver do meu jeito.

**Critérios de aceite:**
- [ ] Opções: data desc (default), data asc, valor desc, valor asc
- [ ] Mantém filtros aplicados

### US-8.6 — Reset filtros

**Como** usuário,
** quero** limpar todos os filtros de uma vez,
** para** voltar à lista completa.

**Critérios de aceite:**
- [ ] Botão "Limpar filtros" visível quando há algum filtro ativo
- [ ] Reseta busca, conta, categoria, período, ordenação

### US-8.7 — Toggle "futuros" / "efetivados"

**Como** usuário,
** quero** ver só os lançamentos futuros OU só os efetivados,
** para** revisar separadamente.

**Critérios de aceite:**
- [ ] Toggle "Mostrar só futuros" (vide PRD-004)
- [ ] Toggle "Mostrar só efetivados"
- [ ] Default: todos

## Fluxo de uso

### Buscar
```
User na lista de lançamentos
  → digita "uber" no campo de busca
  → debounce 200ms
  → filtra array client-side (descricao.includes("uber"))
  → re-renderiza lista
  → atualiza contador
```

### Combinar filtros
```
User aplica: conta="Nubank" + categoria="Delivery" + período=nov/2025
  → array filtrado progressivamente
  → re-renderiza
  → botão "Limpar filtros" aparece
```

## Edge cases

- **Filtro que retorna 0 resultados**: mensagem "Nenhum lançamento
  encontrado com esses filtros" + botão "Limpar".
- **1000+ entries**: filtros client-side ainda são OK (V8
  é rápido). Acima de 10k, fica lento. Roadmap: virtual scroll.
- **User troca de aba Categorias** (adiciona categoria nova):
  filtro de categoria já existente no cache fica desatualizado
  por 5min. User pode forçar reload.
- **Datas inválidas no input** (início > fim): valida no submit.
- **Busca por texto com regex chars** (ex: "C++"): escapado
  automaticamente (ou usar indexOf em vez de regex).
- **Acentos**: busca case-insensitive mas **não** accent-insensitive.
  "acao" não encontra "ação". Roadmap: normalizar.

## Requisitos técnicos

- Componente de filtros no frontend (estado em memória)
- `LancamentosState` em `src/types/index.ts` já tem `filters`,
  `searchTerm`, `sortBy`, `showFuture`
- Função `filterEntriesByInterval()` em `src/utils/date-helpers.ts`
  (filtra por intervalo de seriais Excel)
- Função `getIntervalSerials()` em `src/utils/date-helpers.ts`
  (converte datas JS pra intervalo de seriais)
- Não há chamada nova ao backend — filtros rodam client-side

## Métricas de sucesso

- **% de uso de filtros** — quantos acessos à lista usam algum
  filtro (vs só ver tudo)
- **Busca mais usada** — quais campos são mais filtrados
- **Performance** — tempo médio de filtragem com 1000 entries
  (meta: <50ms)

## Notas / Pendências

- **Filtros salvos** (cross-session) — roadmap
- **Busca fuzzy** (typo tolerance) — roadmap
- **Filtros por conta/categoria com multi-select** — roadmap
  (hoje single-select)
- **Compartilhar filtro por URL** — roadmap
- **Server-side filtering** (volume) — roadmap, crítico >10k entries
