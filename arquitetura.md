nformações desse projeto
### Guia Arquitetural para o Agente de Código: SaaS Multi-Tenant com N8N e PocketBase para Google Sheets

Como arquiteto de software, a sua missão é desenvolver um SaaS multi-tenant utilizando uma abordagem low-code, focado na integração com o Google Sheets para gerenciamento de entradas financeiras. Este guia conciso fornecerá as diretrizes essenciais para o agente de código.

---

#### **1. Visão Geral da Arquitetura**


O projeto consiste em um SaaS multi-tenant que permite a clientes gerenciar entradas financeiras em suas planilhas privadas do Google Sheets através de um formulário web simples. A arquitetura será baseada em:


**N8N**: Orquestrador de fluxos de trabalho e automação
**PocketBase**: Backend leve para autenticação de usuários, persistência de dados e armazenamento de credenciais de clientes
**Google Sheets**: Camada de armazenamento de dados específica para cada cliente (tenant)

A abordagem é low-code/no-code para reduzir o tempo e custo de desenvolvimento, ideal para prototipagem rápida e implantação escalável

#### **2. Multi-Tenancy e Isolamento de Dados**


Adotaremos o modelo de **Banco de Dados Único, Esquema Compartilhado** no PocketBase


**Identificação de Tenant**: Cada registro no PocketBase incluirá um campo `tenantId` (ou `userId`) para segregação lógica dos dados
* **Regras de API do PocketBase**: Essenciais para aplicar o isolamento de dados na camada da aplicação. Configure permissões granulares para que os usuários só acessem registros associados ao seu próprio `tenantId` (`@request.auth.id`)

#### **3. Componentes Principais e Funções**

* **N8N (Orquestrador)**:

    **Webhook Trigger**: Ponto de entrada para receber dados do frontend (entradas financeiras, eventos de onboarding)
    **HTTP Request Node**: Crucial para interagir com a API do PocketBase (autenticação, recuperação de dados/tokens do Google) e com a API do Google Sheets (para chamadas diretas com tokens dinâmicos)
    **Function/Code Node**: Para lógica personalizada, manipulação de dados, construção de requisições API complexas e gerenciamento de expiração de tokens Google
    **Respond to Webhook Node**: Envia respostas ao frontend

* **PocketBase (Backend)**:

    **Gerenciamento de Usuários**: Registro, login e perfis
    **Armazenamento de Credenciais**: Armazenar `google_access_token`, `google_refresh_token` e `google_sheet_id` como campos personalizados na coleção de usuários
    **Isolamento de Dados**: Garanta que as regras de API permitam acesso apenas ao próprio usuário (`@request.auth.id`) para seus tokens e IDs de planilha

* **Google Sheets (Dados Multi-Tenant)**:

    Camada de armazenamento de dados para cada cliente
    A API do Google Sheets permite criar, manipular e duplicar planilhas

#### **4. Fluxos de Trabalho Essenciais (N8N)**

* **A. Onboarding de Usuários e Autorização do Google Sheets**:

    * **Frontend (Appsmith, UI Bakery, Bubble)**: Coleta registro, interage com PocketBase para criar conta e inicia o fluxo OAuth 2.0 do Google. Envia tokens resultantes para N8N/PocketBase
    * **Google Cloud Console**: Configurar novo projeto, habilitar Google Sheets API e Google Drive API. Criar "ID do Cliente OAuth" (Tipo "Aplicação Web") e configurar URI de redirecionamento do N8N
    **Armazenamento de Tokens**: O N8N, após o fluxo OAuth, armazenará `access_token` e `refresh_token` nos campos personalizados do usuário no PocketBase. **É crucial solicitar `access_type=offline` e `prompt=consent` para obter um `refresh_token` de longo prazo**

* **B. Provisionamento Automatizado do Google Sheet**:

    **Gatilho**: Após a autorização bem-sucedida do Google Sheets
    **Cópia de Modelo**: N8N usará o nó HTTP Request (com tokens dinâmicos do usuário) para copiar uma planilha modelo
    **Limpeza**: Limpar os dados da nova planilha, mantendo cabeçalhos e formatação
    **Associação de ID**: Armazenar o ID da nova planilha no campo `google_sheet_id` do usuário no PocketBase

* **C. Webhook para Envio de Lançamentos Financeiros**:

    **Webhook Trigger**: Recebe requisições POST do frontend
    **Segurança**: Configure autenticação por cabeçalho (`X-API-Key`) e inclua `userId` no URL do webhook para identificação
    * **Recuperação de Credenciais**: Extraia `userId` do webhook. Use HTTP Request para obter `google_sheet_id` e tokens OAuth do PocketBase para aquele usuário
    * **Gerenciamento de Expiração de Token**: Implemente lógica para verificar validade do `access_token`. Se expirado, use `refresh_token` para obter um novo e atualize no PocketBase
    **Inserção no Google Sheets**: Use HTTP Request para inserir dados na planilha correta do cliente, usando o `google_sheet_id` e o `access_token` dinamicamente

#### **5. Implantação, Segurança e Escalabilidade**

* **Hospedagem**:
    **N8N**: Google Cloud Run (escalabilidade automática, custo-benefício) ou Google Compute Engine (para cargas constantes)
    * **PocketBase**: Qualquer provedor de VPS com armazenamento persistente (Hetzner, Vultr, DigitalOcean). Configure como serviço Systemd
* **Segurança**:
    **Isolamento de Dados**: Reforce as regras de API do PocketBase
    * **Credenciais**: Armazene com segurança. Proteja tokens OAuth no PocketBase com regras de API
    **Webhook**: Use autenticação por cabeçalho
    **Monitoramento e Auditoria**: Habilite logs no N8N
* **Escalabilidade**:
    **N8N**: Suporta filas de trabalho (BullMQ, Redis) e escalonamento de workers
    * **PocketBase**: Escala verticalmente em um único servidor. Suficiente para aplicações de pequeno a médio porte
    **Limites da API Google Sheets**: Esteja ciente das cotas e implemente lógica de backoff exponencial no N8N para lidar com erros de limite de taxa