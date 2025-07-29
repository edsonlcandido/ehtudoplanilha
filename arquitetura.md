# Arquitetura do SaaS Multi-Tenant com PocketBase e Google Sheets

## 1. Visão Geral
Este projeto é um SaaS multi-tenant que permite a cada cliente gerenciar entradas financeiras em sua própria planilha do Google Sheets.  
O backend é 100% PocketBase (SQLite), com hooks para integrar Google OAuth e interações com a API do Sheets.

## 2. Multi-Tenancy e Isolamento de Dados
- Modelo: Banco de Dados Único, Esquema Compartilhado no PocketBase.  
- Coleções:
  - `users`: cadastro e autenticação (email/senha).  
  - `google_infos`: credenciais e metadados do Sheets.  
    - `user_id` (Relacionamento com users)  
    - `access_token` (Texto)  
    - `refresh_token` (Texto)  
    - `sheet_id` (Texto)  
- Regras de API:
  - Usuários só acessam seu próprio registro em `users`.  
  - Endpoints e hooks validam `@request.auth.id` antes de operar em `google_infos`.  

## 3. Componentes Principais
- PocketBase  
  - Autenticação de usuários.  
  - Hooks em `pb_hooks/`:
    - **GET /google-oauth-callback**: troca `code` → tokens → cria/atualiza em `google_infos`.  
    - **POST /google-refresh-token**: renova `access_token` usando `refresh_token`.  
    - **POST /provision-sheet**: copia planilha modelo e grava `sheet_id` em `google_infos`.  
    - **POST /append-entry**: insere lançamentos direto na planilha via Sheets API.  
- Google Sheets API  
  - `drive/v3/files/{templateId}/copy`  
  - `sheets/v4/spreadsheets/{id}/values:append`  
- Frontend (`/pb_public`)
  - HTML + Picnic CSS + PocketBase UMD.  
  - Página inicial (dashboard) e página de configuração OAuth/Provisionamento.

## 4. Fluxos de Trabalho Essenciais

### A. Onboarding e Configuração
1. Usuário registra-se no PocketBase.  
2. Após login, acessa página inicial do dashboard.  
3. Do dashboard, navega para a página de configuração.  
4. Clica em “Conectar Google Sheets” → `startGoogleAuth(userId)` → redireciona para consentimento Google.  
5. Google retorna em `/google-oauth-callback?code=&state={userId}`.  
6. Hook processa o callback, troca `code` por tokens e atualiza/cria registro em `google_infos`.

### B. Provisionamento da Planilha Modelo
1. Na página de configuração, usuário aciona POST `/provision-sheet`.  
2. Hook usa `google_infos.access_token` para:
   - Copiar planilha modelo (`drive/v3/files/{templateId}/copy`).
   - **Obs:** não é preciso limpar a planilha modelo neste momento.
3. Atualiza `google_infos.sheet_id` com o novo ID.

### C. Inserção de Lançamentos Financeiros
1. Frontend envia POST para `/append-entry?userId={userId}` com JSON:
   ```json
   { "title": "...", "amount": 123.45, "timestamp": "2025-07-29T12:00:00Z" }
   ```
2. Hook busca registro em `google_infos` por `user_id`.  
3. Valida `access_token`; se expirado, chama `/google-refresh-token`.  
4. Chama `sheets/v4/spreadsheets/{sheet_id}/values:append` com o payload.  
5. Retorna status (sucesso/erro) ao frontend.

## 5. Implantação, Segurança e Escalabilidade
- Hospedagem PocketBase: Linux (Systemd) ou Docker.  
- Variáveis de ambiente:
  ```env
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  GOOGLE_REDIRECT_URI=https://seu-dominio.com/google-oauth-callback
  ```
- Segurança:
  - HTTPS obrigatório.  
  - CORS e regras de API no PocketBase.  
  - Rate limiting e logs em hooks.  
- Escalabilidade:
  - Backup diário do SQLite.  
  - Monitorar cotas da API Google e implementar backoff.