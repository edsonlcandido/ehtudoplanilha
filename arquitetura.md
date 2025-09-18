# Arquitetura do SaaS Planilha Eh Tudo

## 1. Visão Geral
SaaS multi-tenant onde cada usuário gerencia lançamentos financeiros em sua própria planilha derivada de um template Google Sheets.  
Backend: PocketBase (SQLite) com hooks customizados para OAuth Google e escrita em Sheets.

## 2. Multi-Tenancy e Isolamento
- Estratégia: Banco único, coleções compartilhadas com regras de acesso restritivas.
- Coleções:
  - users (nativa: email + senha)
  - google_infos
    - user_id (rel 1:1 → users)
    - access_token
    - refresh_token (criptografado opcional)
    - token_type
    - scope
    - expires_at (DateTime UTC)
    - sheet_id
    - last_success_append_at (DateTime opcional)
- Regras (versão PocketBase ≥ 0.28):
  - users:  
    read/write: `@request.auth.id = @record.id`
  - google_infos:  
    read/write: `@request.auth.id = @record.user_id`

## 3. Estrutura da Planilha Modelo
A planilha modelo deve conter duas abas:

### 3.1 Aba de Lançamentos (ex.: LANCAMENTOS)
| Coluna | Campo       | Tipo    | Formato / Observação |
|--------|-------------|---------|----------------------|
| A      | data        | Data    | YYYY-MM-DD           |
| B      | conta       | Texto   | ex.: Carteira, Banco |
| C      | valor       | Número  | Decimal (.)          |
| D      | descricao   | Texto   | máx 255 chars        |
| E      | categoria   | Texto   | Deve existir na aba CATEGORIAS |
| F      | orcamento   | Texto   | opcional             |
| G      | observacao  | Texto   | opcional             |

Range de append: `LANCAMENTOS!A:F`

### 3.2 Aba de Categorias (ex.: CATEGORIAS)
| Coluna | Campo     | Tipo  | Observação |
|--------|-----------|-------|-----------|
| A      | categoria | Texto | Nome único da categoria (chave) |
| B      | tipo      | Texto | Livre ou controlado (ex.: "despesa", "receita") |

Regras recomendadas:
- A coluna `categoria` da aba LANCAMENTOS deve referenciar (por validação de dados no Google Sheets, se possível) uma entrada existente na coluna `categoria` da aba CATEGORIAS.
- O campo `tipo` pode ser usado futuramente para relatórios agregados (ex.: separar fluxo de caixa por tipo).
- Opcional: Configurar validação de dados no Google Sheets para a coluna E (categoria) apontando para o intervalo `CATEGORIAS!A:A`.

## 4. Fluxos Principais

### 4.1 Onboarding OAuth
1. Usuário cria conta e autentica no PocketBase.
2. Frontend gera PKCE (code_verifier + code_challenge) e state assinado.
3. Redireciona para endpoint de autorização Google.
4. Google redireciona para `/google-oauth-callback?code=...&state=...`
5. Hook valida state, troca code por tokens, salva tokens + `expires_at`.

### 4.2 Provisionamento da Planilha
1. Usuário aciona `POST /provision-sheet`.
2. Hook verifica se já existe `sheet_id`; se existir pode retornar 409 ou reutilizar.
3. Copia template (Drive API).
4. Atualiza `sheet_id` no registro.

### 4.3 Inserção de Lançamentos
1. Frontend envia `POST /append-entry` (sem userId explícito).
2. Hook resolve userId via `request.auth`, obtém `google_infos`.
3. Valida `expires_at`; se expirado → refresh.
4. Chama Sheets `values:append` em `LANCAMENTOS!A:F`.
5. Atualiza `last_success_append_at`.

(Validação futura: antes do append, opcionalmente ler `CATEGORIAS!A:A` para garantir que a categoria informada existe; em caso de ausência, retornar erro padronizado.)

## 5. Endpoints Custom (Resumo)
- `GET /google-oauth-callback`
- `POST /google-refresh-token`
- `POST /provision-sheet`
- `POST /append-entry`

## 6. Segurança
- OAuth: PKCE para cliente público + state assinado para evitar CSRF.
- Tokens: armazenar `expires_at`, refresh automático.
- Frontend: não enviar userId explícito, usar auth do PocketBase.
- Regras de acesso: baseadas em `@request.auth.id`.

## 7. Escalabilidade & Operações
- Backups SQLite: a cada 6h + retenção 7 dias + teste de restauração semanal.
- Monitorar limites (Drive/Sheets) → retry exponencial em 429/5xx.

## 8. Variáveis de Ambiente
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://seu-dominio.com/google-oauth-callback
SHEET_TEMPLATE_ID=
```

## 9. Roadmap Futuro
- Leitura agregada (dashboards analíticos)
- Relatórios por tipo (despesa/receita) usando aba CATEGORIAS