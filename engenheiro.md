### **Instruções Detalhadas para o Engenheiro de Software: Implementação do SaaS Multi-Tenant**

Como engenheiro de software, sua tarefa é traduzir o blueprint arquitetônico em código funcional, com foco na robustez, segurança e experiência do usuário.

#### **1. Configuração Inicial e Ambiente**

* **PocketBase**:
    * [cite_start]Crie as coleções necessárias, especialmente a coleção `users` com os campos personalizados: `google_access_token` (Texto), `google_refresh_token` (Texto) e `google_sheet_id` (Texto). [cite: 91]
    * [cite_start]Configure rigorosamente as **regras de API** para cada coleção, garantindo que usuários só possam ler/atualizar seus próprios registros (`@request.auth.id`). [cite: 26, 179]
    * [cite_start]Habilite a autenticação de superusuário com MFA (Multi-Factor Authentication) para o ambiente de produção. [cite: 175]
    * [cite_start]Implemente um limitador de taxa (rate limiter) na API para prevenir abusos. [cite: 175]
* **N8N**:
    * Instale e configure o N8N em um ambiente de desenvolvimento. [cite_start]Para produção, considere Docker/Kubernetes, com Google Cloud Run sendo uma opção atraente. [cite: 168, 169]
    * [cite_start]Configure as credenciais de acesso ao PocketBase para o N8N (e.g., via chave de API ou token de superusuário, dependendo do fluxo). [cite: 117]
* **Google Cloud Console**:
    * [cite_start]Crie um novo projeto Google Cloud. [cite: 98]
    * [cite_start]Habilite a Google Sheets API e a Google Drive API (essencial para copiar planilhas). [cite: 99]
    * [cite_start]Configure a Tela de Consentimento OAuth (usuário "Externo"). [cite: 100, 101]
    * [cite_start]Crie credenciais OAuth 2.0 (Tipo "Aplicação Web"), adicionando o URI de redirecionamento do N8N (e.g., `https://SEUDOMINIO.COM/rest/oauth2-credential/callback`). [cite: 102, 103]
    * [cite_start]Obtenha o `ID do Cliente` e o `Segredo do Cliente`. [cite: 104]
* **Frontend (Appsmith, UI Bakery, Bubble)**:
    * [cite_start]Crie o frontend para registro/login de usuários e para o formulário de entrada financeira. [cite: 79]
    * [cite_start]Configure a integração com o PocketBase para autenticação de usuários. [cite: 83]
    * [cite_start]Implemente o fluxo OAuth 2.0 do Google no frontend, garantindo que `access_type=offline` e `prompt=consent` sejam incluídos na requisição de autorização para obter o `refresh_token`. [cite: 108, 109]

#### **2. Implementação dos Fluxos de Trabalho no N8N**

##### **2.1. Fluxo de Onboarding de Usuários e Autorização do Google Sheets**

* **Objetivo**: Registrar o usuário no PocketBase e obter e armazenar seus tokens OAuth do Google Sheets e o ID da planilha recém-criada.
* **Nós N8N Envolvidos**:
    * **Webhook Trigger**: Recebe o `code` e `state` do redirecionamento OAuth do Google, além de dados de registro do usuário, se aplicável.
    * **HTTP Request (para PocketBase)**:
        * **Criação de Usuário**: Se for um novo registro, crie o usuário no PocketBase.
        * [cite_start]**Atualização de Usuário**: Atualize os campos `google_access_token`, `google_refresh_token` e `google_sheet_id` do usuário. [cite: 115]
    * **HTTP Request (para Google OAuth API)**: Troque o `code` por `access_token` e `refresh_token` na API do Google.
    * **Function/Code Node**: Para extrair os tokens da resposta da API do Google e prepará-los para o PocketBase.
* **Detalhes de Implementação**:
    * [cite_start]**Persistência de Tokens**: Garanta que o `access_token` e, crucialmente, o `refresh_token` sejam armazenados de forma segura nos campos personalizados do usuário no PocketBase. [cite: 115]
    * **Tratamento de Erros**: Implemente tratamento de erros para falhas na criação de usuários ou na obtenção de tokens.

##### **2.2. Fluxo de Provisionamento Automatizado do Google Sheet**

* **Objetivo**: Copiar uma planilha modelo para o novo usuário e associar o ID da nova planilha ao seu registro no PocketBase.
* **Nós N8N Envolvidos**:
    * **Webhook Trigger/Manual Trigger**: Acionado após o sucesso do fluxo de onboarding e autorização.
    * **HTTP Request (para PocketBase)**: Recupera o `access_token` e `refresh_token` do usuário.
    * **Function/Code Node**: Para gerenciar a lógica de atualização do token se necessário.
    * **HTTP Request (para Google Drive API)**:
        * Utilize o endpoint de cópia de arquivos do Google Drive (ex: `https://www.googleapis.com/drive/v3/files/{fileId}/copy`).
        * [cite_start]Injete o `access_token` no cabeçalho `Authorization: Bearer <access_token>`. [cite: 121]
        * [cite_start]O `fileId` da planilha modelo deve ser uma variável de ambiente ou um valor fixo. [cite: 133]
    * **HTTP Request (para Google Sheets API)**:
        * [cite_start]Após a cópia, use a API do Google Sheets para "limpar" a nova planilha (remover dados, manter cabeçalhos). [cite: 135, 136]
        * Exemplo: `https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values:clear`.
    * [cite_start]**HTTP Request (para PocketBase)**: Atualize o campo `google_sheet_id` do usuário com o ID da nova planilha copiada. [cite: 139]
* **Detalhes de Implementação**:
    * Assegure que a cópia preserve a formatação e os cabeçalhos.
    * Verifique a resposta da API do Google Drive para obter o novo `spreadsheetId`.

##### **2.3. Fluxo de Webhook para Envio de Lançamentos Financeiros**

* **Objetivo**: Receber dados do formulário frontend e inserir na planilha Google Sheets do usuário correto.
* **Nós N8N Envolvidos**:
    * **Webhook Trigger**:
        * [cite_start]Configure o método HTTP para POST. [cite: 144]
        * [cite_start]Configure `Header Authentication` com uma chave secreta (`X-API-Key`) compartilhada com o frontend. [cite: 146]
        * [cite_start]Considere incluir o `userId` ou `tenantId` no URL do webhook para identificação do cliente (`/webhook/{userId}/entry`). [cite: 147]
    * **Function/Code Node**:
        * [cite_start]Extraia o `userId` do URL do webhook ou de um cabeçalho. [cite: 153]
        * [cite_start]Prepare os dados do payload do webhook (`timestamp`, `title`, `message`, `package`) para a inserção no Google Sheets, mapeando para as colunas corretas. [cite: 160]
    * **HTTP Request (para PocketBase)**:
        * [cite_start]Faça uma requisição GET autenticada para `/api/collections/users/records/{userId}` para recuperar `google_sheet_id`, `google_access_token` e `google_refresh_token` do usuário. [cite: 118, 154]
        * **Prioridade**: Implemente a lógica de **verificação e atualização de token** aqui. [cite_start]Se o `access_token` estiver expirado (identificado por erro 401 da API do Google), use o `refresh_token` para obter um novo `access_token` e **atualize-o no PocketBase antes de prosseguir**. [cite: 123, 124, 156, 157]
    * **HTTP Request (para Google Sheets API)**:
        * [cite_start]**Endpoint**: Utilize o endpoint `Append` da API do Google Sheets (e.g., `https://sheets.googleapis.com/v4/spreadsheets/{google_sheet_id}/values/{range}:append`). [cite: 161, 162]
        * [cite_start]**Autenticação**: Inclua o `access_token` (obtido dinamicamente) no cabeçalho `Authorization: Bearer <access_token>`. [cite: 121]
        * **Corpo da Requisição**: Envie os dados formatados do payload.
    * [cite_start]**Respond to Webhook Node**: Envie uma resposta HTTP (sucesso/falha) de volta ao frontend. [cite: 163]
* **Detalhes de Implementação**:
    * Garanta que a lógica de atualização de token seja robusta e não cause loops infinitos ou falhas.
    * [cite_start]Trate possíveis limites de taxa da API do Google Sheets com lógica de *retry* ou backoff exponencial. [cite: 193]

#### **3. Frontend (Integração e UX)**

* **Registro/Login**:
    * Conecte o formulário de registro/login aos endpoints de autenticação do PocketBase.
    * Inicie o fluxo OAuth do Google após o registro bem-sucedido ou como uma etapa separada de integração.
* **Formulário de Entrada Financeira**:
    * [cite_start]Colete `timestamp`, `title`, `message`, `package`. [cite: 150]
    * [cite_start]Envie os dados via POST para o webhook N8N com a chave de API no cabeçalho e o `userId` (se aplicável) no URL. [cite: 146, 147]
    * Exiba feedback adequado ao usuário (sucesso/erro) com base na resposta do webhook.
* **Gerenciamento de Erros**: Implemente tratamento de erros e mensagens amigáveis para o usuário em caso de falhas na comunicação com o backend ou Google Sheets.

#### **4. Considerações de Produção e Manutenção**

* [cite_start]**Logs e Monitoramento**: Configure o N8N para logs detalhados e monitore a saúde dos workflows. [cite: 187] Implemente monitoramento para PocketBase também.
* [cite_start]**Backups**: Garanta backups diários automatizados do PocketBase (o SQLite é um arquivo, o que facilita o backup). [cite: 171]
* [cite_start]**Segurança**: Revise regularmente as regras de API do PocketBase e as configurações de segurança do N8N e Google Cloud. [cite: 178, 179]
* **Testes**: Desenvolva testes abrangentes para os fluxos de trabalho do N8N, especialmente para o gerenciamento de tokens e inserção de dados. Teste o isolamento de dados entre tenants.
* **Documentação**: Mantenha a documentação interna atualizada para os fluxos de trabalho N8N e o esquema do PocketBase.

---

### **Casos de Uso Detalhados**

#### **Caso de Uso 1: Registro de Novo Cliente e Ativação da Planilha**

**Cenário**: Um novo usuário se cadastra no SaaS e deseja começar a usar o sistema de entradas financeiras.

1.  **Registro de Usuário**:
    * O usuário acessa o frontend e preenche um formulário de registro (email, senha).
    * O frontend envia os dados para o PocketBase, que cria a conta do usuário.
    * [cite_start]**PocketBase**: Um novo registro é criado na coleção `users` com `email` e `password` (hash). [cite: 83, 86]
2.  **Autorização Google Sheets (OAuth 2.0)**:
    * Após o registro (ou como uma etapa subsequente), o frontend inicia o fluxo OAuth 2.0 do Google.
    * [cite_start]O usuário é redirecionado para a página de consentimento do Google, concede as permissões necessárias (acesso a planilhas e Google Drive). [cite: 95]
    * [cite_start]O Google redireciona de volta para um endpoint do N8N com um `code`. [cite: 85]
    * **N8N (Fluxo de Onboarding)**: O Webhook Trigger do N8N captura o `code`. [cite_start]Um nó HTTP Request troca este `code` por um `access_token` e, crucialmente, um `refresh_token` junto à API OAuth do Google. [cite: 108, 109, 110]
3.  **Armazenamento de Tokens**:
    * [cite_start]**N8N**: O `access_token` e `refresh_token` são enviados para o PocketBase via HTTP Request, atualizando o registro do usuário recém-criado. [cite: 115]
    * [cite_start]**PocketBase**: Os campos `google_access_token` e `google_refresh_token` do usuário são preenchidos. [cite: 91]
4.  **Provisionamento da Planilha Google Sheets**:
    * **N8N (Fluxo de Provisionamento)**: Um fluxo de trabalho é acionado.
    * [cite_start]Ele usa o `access_token` do usuário (obtido dinamicamente do PocketBase) para chamar a Google Drive API para copiar uma planilha modelo. [cite: 131]
    * [cite_start]Em seguida, usa a Google Sheets API para limpar quaisquer dados da planilha copiada, mantendo a estrutura. [cite: 135, 136]
    * O ID da nova planilha é retornado.
5.  **Associação da Planilha ao Usuário**:
    * [cite_start]**N8N**: O ID da nova planilha é enviado para o PocketBase via HTTP Request, atualizando o campo `google_sheet_id` do usuário. [cite: 138, 139]
    * [cite_start]**PocketBase**: O `google_sheet_id` do usuário é preenchido. [cite: 91]
6.  **Confirmação**: O frontend informa ao usuário que sua planilha está pronta.

#### **Caso de Uso 2: Inserção de Nova Entrada Financeira**

**Cenário**: Um cliente logado deseja registrar uma nova despesa ou receita em sua planilha.

1.  **Formulário de Entrada no Frontend**:
    * [cite_start]O cliente preenche um formulário simples no frontend com os detalhes da entrada (e.g., título, mensagem, valor, categoria). [cite: 78, 150]
2.  **Envio de Dados via Webhook**:
    * [cite_start]O frontend envia os dados do formulário como um payload POST para o webhook N8N configurado para o usuário (e.g., `/webhook/{userId}/entry`). [cite: 147]
    * [cite_start]Um cabeçalho `X-API-Key` é incluído para autenticação do webhook. [cite: 146]
3.  **Processamento pelo N8N**:
    * **N8N (Webhook Trigger)**: Recebe o payload.
    * [cite_start]**N8N (Function/Code Node)**: Extrai o `userId` do URL do webhook e prepara os dados para inserção na planilha. [cite: 153, 160]
    * [cite_start]**N8N (HTTP Request para PocketBase)**: Faz uma requisição GET para o PocketBase para recuperar o `google_sheet_id` e os tokens (`access_token`, `refresh_token`) do usuário autenticado. [cite: 118, 154]
    * [cite_start]**N8N (Lógica de Refresh Token)**: Se o `access_token` estiver expirado (erro 401), o N8N usa o `refresh_token` para solicitar um novo `access_token` à API OAuth do Google e atualiza o registro do usuário no PocketBase com o novo token. [cite: 123, 124, 156, 157]
    * [cite_start]**N8N (HTTP Request para Google Sheets API)**: Com o `google_sheet_id` e o `access_token` válidos, o N8N faz uma requisição POST (`Append Row`) para a API do Google Sheets, inserindo a nova entrada na planilha específica do cliente. [cite: 161, 162]
4.  **Resposta ao Frontend**:
    * [cite_start]**N8N (Respond to Webhook Node)**: Envia uma resposta (HTTP 200 OK ou 500 Erro) de volta ao frontend, indicando o sucesso ou falha da operação. [cite: 163]
5.  **Confirmação ao Usuário**: O frontend exibe uma mensagem de sucesso ou erro.

#### **Caso de Uso 3: Visualização e Edição de Entradas Existentes (Opcional - Requer Frontend mais Complexo)**

**Cenário**: O cliente deseja visualizar ou editar entradas financeiras diretamente de um painel no SaaS, sem ir ao Google Sheets.

1.  **Requisição de Dados no Frontend**:
    * O cliente solicita a visualização de suas entradas.
    * O frontend faz uma requisição para um endpoint no N8N (ou diretamente para o PocketBase se dados resumidos forem suficientes, mas para detalhes da planilha, N8N é melhor).
2.  **Processamento pelo N8N**:
    * **N8N (Webhook Trigger)**: Recebe a requisição (incluindo `userId`).
    * **N8N (HTTP Request para PocketBase)**: Recupera `google_sheet_id` e tokens do usuário.
    * **N8N (Lógica de Refresh Token)**: Atualiza o `access_token` se necessário.
    * **N8N (HTTP Request para Google Sheets API)**: Faz uma requisição GET para a API do Google Sheets (e.g., `values:get` para um intervalo específico da planilha do cliente).
    * **N8N (Transformação de Dados)**: Formata os dados da planilha para serem consumíveis pelo frontend.
    * **N8N (Respond to Webhook Node)**: Envia os dados formatados de volta ao frontend.
3.  **Exibição e Edição no Frontend**:
    * O frontend exibe os dados em uma tabela ou lista.
    * Para edição, o frontend pode enviar requisições de PATCH/PUT para outro webhook N8N, que faria chamadas correspondentes à API do Google Sheets (`values:update`).