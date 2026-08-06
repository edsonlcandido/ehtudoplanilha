# PRD-001 — Autenticação e Cadastro de Usuários

## Contexto

A Planilha Eh Tudo é multi-tenant: cada usuário tem **a própria planilha
Google Sheets** e **os próprios lançamentos**. Pra evitar que alguém veja
os dados financeiros de outro, todo o acesso (incluindo o OAuth Google)
exige usuário autenticado.

A autenticação é **dupla**:
1. **Auth do app** (PocketBase nativo) — controla acesso a todas as rotas
2. **Auth do Google** (OAuth) — controla acesso ao Drive/Sheets do user

Este PRD cobre a **#1**. A #2 está no [PRD-002](./PRD-002-conexao-google-e-planilha.md).

## Objetivos

- Permitir que o usuário crie conta (email + senha) e faça login
- Manter sessão persistente entre reloads
- Permitir logout que limpa sessão, cache local e token OAuth (se houver)
- Expor `authStore.isValid` confiável para as rotas decidirem se mostram
  a UI de login ou o app

## Não-objetivos

- Recuperação de senha por email (PocketBase tem, mas não é feature
  documentada aqui — vide débitos)
- Login via Google como substituto do email/senha (existe paralelo
  via OAuth PB nativo, vide `pwa/OAUTH_CONFIG.md` — fora do escopo deste PRD)
- 2FA
- Perfil editável (nome, avatar) — o user tem só email

## Personas

- **Visitante** — não tem conta. Pode ver a landing page e o form de
  registro/login.
- **Usuário autenticado** — tem conta e fez login. Pode acessar o app.

## User Stories

### US-1.1 — Cadastro

**Como** visitante,
**quero** criar uma conta com email e senha,
**para** acessar a planilha pessoal e lançar meus gastos.

**Critérios de aceite:**
- [ ] Form de cadastro valida email (formato) e senha (mín. 8 chars)
- [ ] Email duplicado mostra erro claro ("este email já está cadastrado")
- [ ] Senha é enviada com hash (PB nativo já faz)
- [ ] Após cadastro bem-sucedido, o user é automaticamente logado
- [ ] Redirecionado pro dashboard (ou PWA, dependendo do entry point)

### US-1.2 — Login

**Como** usuário com conta,
** quero** entrar com email e senha,
** para** acessar minha planilha e meus lançamentos.

**Critérios de aceite:**
- [ ] Form de login mostra erro claro se email não existe ou senha errada
- [ ] Após login, token JWT é guardado no localStorage (chave `pocketbase_auth`)
- [ ] Sessão persiste entre reloads do browser
- [ ] Validação periódica: se `authStore.isValid === false`, tenta
      `authRefresh()` antes de redirecionar pro login

### US-1.3 — Logout

**Como** usuário autenticado,
**quero** sair da minha conta,
**para** que ninguém mais no mesmo device acesse meus dados.

**Critérios de aceite:**
- [ ] Logout limpa `authStore` (token + model)
- [ ] Logout limpa todo o cache local (`CacheService.clearAll()`)
- [ ] Redireciona pra landing page (ou `/pwa/login` no PWA)
- [ ] Confirmação visual (modal "Deseja realmente sair?") antes de efetivar

### US-1.4 — Validação de token

**Como** sistema,
**preciso** saber se o token é válido antes de mostrar UI protegida,
**para** evitar que o user veja dados antigos/expirados.

**Critérios de aceite:**
- [ ] `verifyTokenValidity()` retorna `true` se token local é válido
- [ ] Se token local é inválido, tenta `authRefresh()` uma vez
- [ ] Se refresh falha, redireciona pra landing (sem mostrar erro técnico)
- [ ] Logs claros em PT-BR no console pra debug

## Fluxo de uso

### Cadastro
```
Visitante acessa /registro.html
  → preenche email + senha
  → submit → POST /api/collections/users/records (PB)
  → sucesso → authStore.set(token, model)
  → redirect → /dashboard/index.html
```

### Login
```
User acessa /login.html
  → preenche email + senha
  → submit → POST /api/collections/users/auth-with-password
  → sucesso → authStore.set(token, model)
  → redirect → /dashboard/index.html
  → verifyTokenValidity() roda em cada página protegida
```

### Logout
```
User clica no menu → "Sair"
  → modal de confirmação
  → confirma
  → CacheService.clearAll()
  → authStore.clear()
  → window.location.href = '/'
```

## Edge cases

- **Token expirado + offline**: `authRefresh()` falha. App mostra
  "Sessão expirada, faça login novamente" e botão de login.
- **Login com token OAuth existente**: se já tem `google_infos` salvo,
  não precisa re-autorizar Google. Senão, fluxo do PRD-002 dispara.
- **Cache desatualizado pós-logout**: garantir que `clearAll()` é
  chamado ANTES de `authStore.clear()`.
- **Dois devices, mesma conta**: cada um tem seu próprio `authStore`.
  A planilha é a mesma (sincroniza via Google).

## Requisitos técnicos

- PB ≥ v0.28 (collection `users` nativa)
- `pocketbase` SDK JS v0.26+
- Token guardado no localStorage, **NÃO cookie**
- Header `Authorization: <token>` (NÃO cookie — confirmado via
  `/debug-localstorage.html` em dev)
- Logout via modal injetado globalmente em `main.ts`

## Métricas de sucesso

- **Taxa de cadastro completo** — % que preenche o form e submete
- **Login bem-sucedido no primeiro try** — % que não erra email/senha
- **Sessões persistentes** — quantos logins repetidos no mesmo device
  em 30 dias (quanto menor, melhor a persistência)

## Notas / Pendências

- Recuperação de senha não está implementada na UI (PB suporta)
- 2FA não está no roadmap
- `pb_hooks/oauth-redirect.pb.js` referenciado no `pwa/OAUTH_CONFIG.md`
  não existe (mas o login OAuth via PB nativo funciona — **NÃO MEXER**)
