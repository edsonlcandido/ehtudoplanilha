# Instruções para o GitHub Copilot

Você é um assistente de programação brasileiro, responda sempre em português especializado em:

- JavaScript e TypeScript (ES6+ / módulos)
- HTML5 semântico
- CSS base com Picnic CSS (https://picnicss.com)

## Estrutura do projeto

- Frontend: `src/`  
  • HTML: `src/*.html`  
  • CSS: `src/css/`  
  • TypeScript: `src/*.ts` (módulos, importe `api-config.js` e `pocketbase.umd.js`)
- Backend: PocketBase  
  • Hooks em `pb_hooks/` (versão do PocketBase ≥ 0.28.x)  
  • Migrações em `pb_migrations/`

## Diretrizes de código

1. Frontend
   - Use HTML5 semântico e classes BEM.  
   - Separe lógica em ES Modules quando possível.  
   - Trate erros com mensagens claras em PT-BR.
2. Backend (hooks PocketBase)
   - Nomeie arquivos como `*.pb.js`.  
   - Use `async/await`, `request`, `reply.send()` e `reply.redirect()`.  
   - Acesse variáveis de ambiente via `process.env.VARIÁVEL`.

## Instruções para assistentes de código (Copilot / agentes)

Estas instruções focam o conhecimento mínimo para ser produtivo neste repositório.

Principais tecnologias: PocketBase (hooks em JS), frontend estático em `pb_public/` (ES Modules), Google OAuth + Sheets API.

Rápido resumo (big picture)
- Backend: PocketBase com hooks em `pb_hooks/` que expõem endpoints customizados para OAuth, refresh e operações sobre Google Sheets.
- Frontend: `src/` serve páginas estáticas que usam `src/*.ts` (typeScript).
- Persistência: SQLite (arquivos em `pb_data/`), coleções principais: `users` e `google_infos` (tokens, sheet_id).

Como rodar localmente
- Defina variáveis de ambiente em um `.env` na raiz (ver `pb_hooks/README.md` e `arquitetura.md`).
- Use o script de conveniência `./iniciar-pb.sh` (carrega `.env` e executa `./pocketbase serve --dev`).
- Dev server padrão: http://localhost:8090 (ajuste `GOOGLE_REDIRECT_URI` conforme necessário).

Padrões e convenções do projeto
- Arquivos de hook: `*.pb.js` dentro de `pb_hooks/`.
- Strings JS/TS: aspas simples. Comentários e mensagens de erro em PT-BR.
- Não enviar `userId` no payload do frontend; confiar na autenticação do PocketBase (`request.auth`).

Fluxos e endpoints relevantes (exemplos concretos)
- OAuth callback: GET `/google-oauth-callback` (arquivo: `pb_hooks/google-oauth-callback.pb.js`) — troca code por tokens e salva em `google_infos`.
- Refresh token: POST `/google-refresh-token` (renova `access_token` usando `refresh_token`).
- Provisionar planilha: POST `/provision-sheet` (copia template e grava `sheet_id`).
- Inserir lançamento: POST `/append-entry` — payload contém campos como `data`, `conta`, `valor`, `descricao`, `categoria`; hook escreve em `LANCAMENTOS!A:G`.

Dados e regras importantes
- Coleção `google_infos` contém: `user_id`, `access_token`, `refresh_token`, `expires_at`, `sheet_id`, `sheet_name`.
- Regras de acesso PocketBase: ver `arquitetura.md` e `engenheiro.md` (uso de `@request.auth.id` nos filtros de leitura/escrita).

Debug e operações comuns
- Ver banco SQLite: `pb_data/data.db` (abra com DB Browser for SQLite para inspecionar registros durante dev).
- Logs: execute `./pocketbase serve --dev` via `iniciar-pb.sh` e observe stdout; hooks usam `console.log` em pontos-chave.
- Erros de token/Sheets: ver `pb_hooks/google-endpoints.pb.js` para padrões de retry e refresh automático (busca refresh_token e re-tenta 401).

Pequenas boas práticas de PR
- Mensagens em PT-BR, verbo no imperativo (ex.: "Adiciona endpoint de listagem de planilhas").
- Ao tocar em hooks, inclua testes manuais descritos em `pb_hooks/README.md` (curl ou página de teste `oauth-test.html`).

Onde procurar exemplos
- Fluxos detalhados: `arquitetura.md` (onboarding OAuth, provisionamento, append).
- Helpers e README: `pb_hooks/README.md` contém exemplos de payloads e respostas do Google.