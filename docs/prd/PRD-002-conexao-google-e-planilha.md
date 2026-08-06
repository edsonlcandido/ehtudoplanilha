# PRD-002 — Conexão Google e Criação da Planilha

## Contexto

A planilha Google Sheets é onde os dados financeiros do usuário ficam.
Como o app não tem banco de dados próprio (regra de produto: **dados
ficam no Drive do user, não no nosso servidor**), precisamos de:

1. **Tokens Google** do user (pra chamar Sheets/Drive API em nome dele)
2. **ID da planilha** (pra saber qual planilha escrever)
3. **A própria planilha** (criada no Drive do user)

Este PRD cobre a **primeira execução** desse fluxo (cold start):
- Conectar o Google do user
- Criar a planilha dele
- Salvar tokens + sheet_id pra uso futuro

Após isso, o user está pronto pra lançar (PRD-003).

## Objetivos

- Guiar o user no OAuth Google (escopo: Sheets + Drive)
- Salvar `access_token` e `refresh_token` em `google_infos`
- Criar uma planilha do zero no Drive do user
- Popular as abas `Lançamentos` (header) e `Categorias` (lista padrão)
- Tornar a operação **idempotente** (se já tem planilha, não recria)
- Tratar expiração de token via refresh automático

## Não-objetivos

- Permitir que o user traga uma planilha existente dele (a planilha
  é SEMPRE criada do zero — contrato de produto)
- Customizar nome da planilha, abas, ou estrutura (abas hardcoded)
- Renomear/mover a planilha depois de criada (user pode, mas quebra
  o sistema — vide contrato)
- Compartilhar a planilha com outros usuários

## ⚠️ Contrato: nomes das abas são HARDCODED

> As abas `Lançamentos` e `Categorias` são **parte do contrato do produto**.
> Se o user renomear qualquer das duas, o sistema quebra.
>
> Os hooks sempre usam a constante `gsheets.SHEET_NAME_DEFAULT` e NUNCA
> leem `google_infos.sheet_name` (que é só informativo).

## Personas

- **Usuário autenticado** (PRD-001) — tem conta no app mas ainda não
  conectou o Google. Ao entrar pela primeira vez, vê tela "Conecte
  seu Google".

## User Stories

### US-2.1 — Conectar Google

**Como** usuário autenticado sem Google conectado,
**quero** autorizar o app a acessar meu Google Drive e Sheets,
**para** poder criar e usar minha planilha.

**Critérios de aceite:**
- [ ] Botão "Conectar Google" claro e visível no dashboard e no PWA
- [ ] Redireciona pro Google com escopo `spreadsheets` + `drive.file`
- [ ] State PKCE guardado no localStorage (proteção CSRF)
- [ ] Após consentimento, Google volta pro `/google-oauth-callback?code=...&state=...`
- [ ] Hook troca code por `access_token` + `refresh_token` e salva em
      `google_infos` (collection 1:1 com user)
- [ ] Se der erro no callback, redireciona pro dashboard com
      `?error=...` (mostra toast)

### US-2.2 — Criar planilha no primeiro acesso

**Como** usuário autenticado com Google conectado mas sem planilha,
**quero** que o app crie automaticamente uma planilha no meu Drive,
**para** começar a lançar sem trabalho manual.

**Critérios de aceite:**
- [ ] Após salvar tokens, frontend chama `POST /provision-sheet`
- [ ] Hook cria planilha via `POST /v4/spreadsheets` com abas
      **hardcoded** `Lançamentos` e `Categorias`
- [ ] Hook popula `Lançamentos!A1:G1` com header (data, conta, valor,
      descricao, categoria, orcamento, observacao)
- [ ] Hook popula `Categorias!A1:B<n>` com 45+ categorias padrão
      (RENDA, PRECISO, QUERO, INVESTIMENTOS, TRANSFERÊNCIA, SALDO)
- [ ] Hook salva `sheet_id` + `sheet_name` em `google_infos`
- [ ] Frontend recebe `action: "created"` e redireciona pro dashboard
- [ ] Se token expirou, hook renova via `refresh_token` e tenta de novo

### US-2.3 — Idempotência

**Como** sistema,
**quero** que `/provision-sheet` não crie planilha duplicada se o user
já tem uma,
**para** evitar lixo no Drive do user e sheet_id sobrescrito.

**Critérios de aceite:**
- [ ] Se `google_infos.sheet_id` já existe e não-vazio, retorna
      `{ success: true, action: "existing", sheet_id }`
- [ ] Frontend não mostra UI de "criando" no caminho existing

### US-2.4 — Refresh automático de token

**Como** sistema,
**quero** renovar `access_token` automaticamente quando expirar,
**para** não interromper o user com re-login.

**Critérios de aceite:**
- [ ] Helper `callWithRefresh()` detecta 401 da API Google
- [ ] Renova via `oauth2.googleapis.com/token` com `refresh_token`
- [ ] Persiste novo `access_token` no `google_infos`
- [ ] Retry da chamada original uma vez
- [ ] Se refresh falhar, retorna erro 401 pro frontend
      (frontend deve disparar fluxo de "reconectar Google")

## Fluxo de uso

### Primeira vez
```
User autenticado → dashboard
  → vê "Conecte seu Google" (status check: /config-status)
  → clica "Conectar Google"
  → Google OAuth (escopo spreadsheets + drive.file)
  → consent
  → Google → /google-oauth-callback?code=&state=
  → hook troca code por tokens
  → salva em google_infos (cria registro)
  → redirect → /dashboard/configuracao.html?success=true
  → frontend lê ?success → chama POST /provision-sheet
  → hook CRIA planilha
  → popula abas
  → salva sheet_id em google_infos
  → redirect → /dashboard/index.html
  → user pode lançar
```

### Re-conexão (token revogado/expirado sem refresh)
```
User tenta lançar → 401 do hook
  → hook tenta refresh
  → refresh falha (refresh_token revogado)
  → hook retorna 401
  → frontend vê 401
  → toast: "Reconecte seu Google"
  → botão → fluxo de OAuth de novo
```

## Edge cases

- **User revoga acesso no Google**: o `refresh_token` para de funcionar.
  Próxima chamada falha. User precisa re-autorizar.
- **User deleta a planilha no Drive**: `sheet_id` salvo fica apontando
  pra planilha inexistente. Frontend precisa detectar e oferecer
  recriar (PRD-009).
- **User renomeia a planilha**: `google_infos.sheet_name` diverge
  do real. Sistema **não** lê esse campo pra decidir, então não
  quebra. Mas o display fica errado.
- **User renomeia as abas**: **sistema quebra**. Display mostra
  planilha vazia, todas as escritas vão pra lugar errado.
- **Race condition no provision**: dois devices do mesmo user
  clicam "conectar" ao mesmo tempo. Como o hook checa `sheet_id`
  antes de criar, só um cria. O outro recebe `action: existing`.
- **Quota do Sheets API**: `values.append` tem rate limit. Em uso
  normal (1 user lançando 10x/dia) é OK. User power-user com
  muitos lançamentos por minuto pode bater limite.

## Requisitos técnicos

- Google Cloud project com **Sheets API v4** e **Drive API v3** habilitadas
- OAuth client com redirect URI do app
- `client_id` e `client_secret` configurados no **PB Admin UI** (collection
  `users` → OAuth2), **NUNCA** no frontend
- Hooks PB: `google-oauth-callback.pb.js`, `google-refresh-token.pb.js`,
  `google-endpoints.pb.js` (auth + refresh), `provision-sheet.pb.js`
  (criação)
- Helper compartilhado `_google-sheets-helper.js` (extensão `.js` pura)

## Métricas de sucesso

- **Taxa de primeira-conversão** — % de cadastros que completam OAuth
  Google (meta: >70%)
- **Tempo até primeira planilha pronta** — do clique em "Conectar" até
  poder lançar (meta: <10s)
- **Taxa de erro no OAuth** — % que precisa re-tentar (meta: <5%)
- **Token refresh success rate** — % de 401 que recuperam com refresh
  sem o user perceber (meta: >95%)

## Notas / Pendências

- O hook `provision-sheet.pb.js` é idempotente mas **NÃO renova
  planilha deletada**. Se o user deletar a planilha e clicar "conectar"
  de novo, o hook retorna `existing` com `sheet_id` inválido.
  Solução: frontend precisa checar 404 do Sheets e oferecer recriar.
- Não há UI pra "mudar de planilha" (PRD-009 cobre listar/selecionar
  de planilhas existentes, mas o fluxo de "criar nova" depois de ter
  uma é manual).
- `google_infos.sheet_name` é só display — **NUNCA** usado em lógica.
