# PRD-004 — Lançamento Futuro

## Contexto

Às vezes o usuário quer **planejar** um gasto que ainda não aconteceu:
- Conta de luz que vence dia 30 mas ainda não paguei
- Parcela do carnê que sei que vai cair
- Salário que entra toda segunda

Esses lançamentos não têm **data efetiva** (ainda não rolou) nem
**conta** (ainda não saiu de lugar nenhum). Mas precisam de
**orçamento** (mês que afeta) e **valor/categoria/descrição** (pra
entrar no agregado).

Este PRD cobre o "lançamento futuro":

| Col | Campo | Lançamento normal | Lançamento futuro |
|---|---|---|---|
| A | data | `01/11/2025 14:30` | **`vazio`** |
| B | conta | `Banco do Brasil` | **`vazio`** |
| C | valor | `-150.50` | `-250.00` |
| D | descricao | `Supermercado` | `Conta de luz` |
| E | categoria | `Alimentação` | `Contas` |
| F | orcamento | `30/11/2025` | `30/11/2025` (obrigatório) |
| G | observacao | opcional | opcional |

## Objetivos

- Permitir criar lançamento SEM data e SEM conta
- Marcar visualmente como "futuro" (não aconteceu ainda)
- Permitir "completar" depois (adicionar data + conta quando efetivar)
- Entrar no agregado do **orçamento** (mês) mas NÃO no agregado de
  **saldos por conta** (afinal, conta está vazia)

## Não-objetivos

- Lembretes/notificações "sua conta de luz vence amanhã" — fora
- Recorrência automática (todo mês gera um) — fora
- Diferenciar visualmente "planejado pra esse mês" de "efetivado no
  mês passado" no agregado — fora (só a flag futuro resolve MVP)

## Personas

- **Usuário autenticado com planilha** — usa pra planejar

## User Stories

### US-4.1 — Criar lançamento futuro

**Como** usuário,
** quero** planejar uma despesa que ainda não aconteceu,
** para** lembrar dela no mês certo e não esquecer.

**Critérios de aceite:**
- [ ] Botão dedicado "+ Lançamento futuro" separado do "+ Lançamento"
- [ ] Modal **mais simples**: sem campo data (esconde), sem campo conta
      (esconde)
- [ ] Campos obrigatórios: valor, descrição, categoria, **orçamento**
- [ ] Orçamento default: dia 1 do próximo mês
- [ ] Submeter: `POST /append-entry` com `data: ""` e `conta: ""`
- [ ] Backend aceita (não valida data/conta como obrigatórios)
- [ ] Linha vai pra planilha com colunas A e B em branco
- [ ] Na lista de lançamentos, exibir com badge/ícone "planejado"

### US-4.2 — Completar lançamento futuro

**Como** usuário,
** quero** adicionar data e conta a um lançamento futuro,
** para** marcar como efetivado quando acontecer.

**Critérios de aceite:**
- [ ] Click no lançamento futuro → modal de edição normal
      (com data e conta)
- [ ] User preenche data efetiva + conta onde debitou
- [ ] Salvar: edita a linha, agora tem data e conta
- [ ] Visualmente deixa de ser "futuro"

### US-4.3 — Filtrar por futuros vs efetivados

**Como** usuário,
** quero** ver só os lançamentos futuros,
** para** revisar o que ainda não foi efetivado.

**Critérios de aceite:**
- [ ] Toggle "Mostrar só futuros" na lista
- [ ] Toggle "Mostrar só efetivados" na lista
- [ ] Default: mostrar todos
- [ ] Filtro persiste na sessão (não entre reloads)

## Fluxo de uso

### Criar
```
User no dashboard/PWA → clica no FAB
  → opções: "Lançamento" | "Lançamento futuro" | "Transferência"
  → escolhe "Lançamento futuro"
  → modal abre (sem data, sem conta)
  → preenche valor, descrição, categoria, orçamento
  → submit
  → POST /append-entry { data: "", conta: "", valor, descricao,
                          categoria, orcamento }
  → hook append em Lançamentos!A:G
  → linha vai com A e B vazios
  → frontend invalida cache, recarrega
  → lista mostra o lançamento com badge "planejado"
```

### Completar
```
User na lista → clica no lançamento futuro
  → modal de edição abre (com data e conta visíveis, vazios)
  → preenche data efetiva + conta
  → submit → /edit-sheet-entry
  → linha atualizada na planilha
  → frontend invalida cache, recarrega
  → lista mostra sem badge "planejado"
```

## Edge cases

- **Lançamento futuro "eterno"**: user cria e nunca completa. Vai
  aparecer pra sempre no agregado. Decisão: warning quando
  passarem 90 dias? Não-MVP.
- **Lançamento futuro com valor positivo (receita)**: aceito (pode
  ser "salário previsto", "freela esperada"). Sem validação
  diferenciada.
- **Editar lançamento futuro sem data**: pode. Volta a ser
  efetivado se adicionar data.
- **Múltiplos futuros do mesmo orçamento**: permitido (ex: várias
  contas no mesmo mês).
- **Completar com data anterior a hoje**: aceito (ex: esqueci de
  lançar ontem, era pra ser "futuro" mas hoje virou retroativo).
- **Filtro "futuros" combinando com outros filtros** (categoria,
  conta, etc): os filtros são AND. OK.

## Requisitos técnicos

- Mesmo endpoint do PRD-003: `POST /append-entry`
- Hook: `append-entry.pb.js` aceita `data: ""` e `conta: ""`
  (validação só exige `valor` e `descricao`)
- Frontend: form diferenciado com campos condicionais
- Storage: linha na planilha é normal, só A e B vazios. Sem
  coluna extra de "futuro".
- Detecção de "futuro" no frontend: `!row.data || !row.conta`

## Métricas de sucesso

- **% de usuários que usam** — qual fração dos lançamentos criados
  são futuros (baseline: ~10% do volume, mas mais comum em quem
  planeja)
- **Taxa de "completar"** — % de lançamentos futuros que viram
  efetivados em ≤30 dias (meta: >60% — senão é ruído)
- **Lançamentos órfãos** — quantos futuros passam de 90 dias sem
  completar (meta: <20% do total de futuros)

## Notas / Pendências

- Hoje o agregado (`get-financial-summary`) provavelmente conta
  lançamentos futuros junto. **Validar** se isso é o desejado —
  o PRD diz que o **orçamento** inclui, mas o **saldo por conta**
  não (porque conta está vazia). Implementação atual pode divergir.
- Sem recorrência automática. Se o user lança "Conta de luz" todo
  mês, tem que fazer manualmente.
- Sem lembrete. (Roadmap.)
