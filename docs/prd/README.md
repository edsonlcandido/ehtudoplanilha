# PRDs e Histórias de Usuário — Planilha Eh Tudo

> Documentação reversa: cada PRD aqui descreve uma feature que **já existe no
> código** deste repositório. Útil pra (1) ter especificação do que foi
> construído e (2) aprender o formato PRD/User Story na prática.

---

## O que é um PRD

**PRD** = Product Requirements Document (Documento de Requisitos do Produto).
É o documento que descreve **o quê** e **por quê** de uma feature — separado
do **como** (que fica em docs técnicas, RFCs ou tasks).

Um bom PRD deve ser lido em 5 minutos por qualquer pessoa do time e responder:
1. **O que** é? (resumo em 1 linha)
2. **Por que** existe? (problema de quem)
3. **Quem** usa? (persona)
4. **Como** a pessoa usa? (fluxo de uso)
5. **Como sei que tá pronto?** (critérios de aceite)

## Estrutura usada aqui

Cada PRD tem **10 seções principais** (mais **seções opcionais** comuns):

| Seção | Pergunta que responde |
|---|---|
| **Contexto** | Por que essa feature existe? Qual problema resolve? |
| **Objetivos** | O que precisa ser entregue, em bullets curtos. |
| **Não-objetivos** | O que está **fora do escopo** (tão importante quanto o escopo). |
| **Personas** | Quem usa. Tipos de usuário. |
| **User Stories** | "Como [persona], quero [ação], para [benefício]". Cada história é uma entrega pequena. |
| **Critérios de aceite** | Checklist verificável. Quando tudo aqui está ✅, a feature tá pronta. |
| **Fluxo de uso** | Passo a passo do happy path (texto). |
| **Diagrama de sequência** | Versão visual do fluxo: quem chama quem, em que ordem, com branches. Em **Mermaid** — renderiza no GitHub, VS Code, etc. |
| **Edge cases** | O que acontece nos cantos: dados vazios, erros, race conditions, etc. |
| **Métricas de sucesso** | Como medir se a feature tá sendo usada e entregando valor. |
| **Requisitos técnicos** (opcional) | Hooks PB, env vars, libs, integrações externas. Aparece em PRDs que mexem com infra. |
| **Notas / Pendências** (opcional) | Coisas conhecidas, débitos, roadmap, links cruzados. Quase todos os PRDs têm. |

**Seções especiais** que aparecem em PRDs específicos:

| Seção | Onde aparece | Pra quê |
|---|---|---|
| **⚠️ Princípio de segurança** | PRD-011 (OCR), PRD-012 (Chat) | Regras invariantes (ex: "agente NUNCA salva direto") que precisam estar no topo do PRD pra serem vistas primeiro |
| **⚠️ Contrato: X** | PRD-002 (abas Sheets hardcoded) | Regras de produto que não podem ser quebradas |
| **Ideias em aberto** | PRD-002 (criar nova planilha) | Features desejadas mas sem compromisso de prazo |
| **⚠️ NÃO IMPLEMENTADO** | Vários PRDs (US marcada como não implementada, ou seja, subseção) | Marcar partes do PRD que não estão no código (pode ser parcial: hook existe mas UI não) |

## Formato de User Story

```
Como [persona],
quero [ação/funcionalidade],
para [benefício/motivo].
```

A **persona** é o "ator" — não é "o sistema" nem "o admin", é a pessoa.
A **ação** é específica e verificável.
O **benefício** é o "pra quê" — evita features que existem "porque sim".

Boas histórias são:
- **Independentes** (não dependem de outra pra entregar valor)
- **Negociáveis** (detalhe é conversado, não congelado)
- **Valiosas** (entregam valor pro usuário ou pro negócio)
- **Estimáveis** (o time consegue estimar o tamanho)
- **Pequenas** (cabem numa sprint)
- **Testáveis** (dá pra escrever teste automatizado que prova que tá pronto)

Critérios de aceite de uma história usam o formato **Given/When/Then**
( Dado/Quando/Então ):

```
Dado que [contexto inicial],
Quando [ação do usuário],
Então [resultado esperado].
```

## Índice

| # | Feature | Cobre |
|---|---|---|
| [PRD-001](./PRD-001-autenticacao-cadastro.md) | Autenticação e Cadastro | Login, registro, logout, sessão |
| [PRD-002](./PRD-002-conexao-google-e-planilha.md) | Conexão Google + Planilha | OAuth Sheets/Drive, criação programática da planilha |
| [PRD-003](./PRD-003-lancamentos-crud.md) | Lançamentos Financeiros (CRUD) | Criar, editar, deletar, listar |
| [PRD-004](./PRD-004-lancamento-futuro.md) | Lançamento Futuro | Planejar sem data/conta |
| [PRD-005](./PRD-005-transferencia-entre-contas.md) | Transferência entre Contas | Mover saldo entre contas (2 lançamentos) |
| [PRD-006](./PRD-006-categorias.md) | Categorias e Tipos | CRUD, 6 tipos (RENDA, PRECISO, QUERO, INVESTIMENTOS, TRANSFERÊNCIA, SALDO), limite |
| [PRD-007](./PRD-007-resumo-financeiro.md) | Resumo Financeiro | Agregados, totais, dashboard |
| [PRD-008](./PRD-008-filtros-e-busca.md) | Filtros e Busca | Busca textual, filtros client-side |
| [PRD-009](./PRD-009-configuracao-planilha.md) | Configuração de Planilha | Listar/selecionar/revogar (desvincular: **NÃO IMPLEMENTADO** na UI) |
| [PRD-010](./PRD-010-pwa-instalacao-share-target.md) | PWA: Instalação + Share Target | Install no celular, share de **imagens** (PDF removido em 2026-08-08) |
| [PRD-011](./PRD-011-ocr-comprovantes.md) | OCR de Comprovantes | Upload imagem → webhook n8n → **array** pra revisar e salvar |
| [PRD-012](./PRD-012-chat-ia.md) | Chat: Agente de Lançamentos | Texto natural → **array** de lançamentos (não conversacional) |

> **Convenções usadas nos títulos do índice:**
> - Itens em **negrito** são alertas/limitações importantes
> - Símbolos ⚠️ dentro dos PRDs marcam regras invariantes (princípio de
>   segurança, contrato) e partes **NÃO IMPLEMENTADAS**

## Como ler

- Se você é **product manager/engenheiro** e tá chegando no projeto: leia o
  índice, depois abra o PRD da feature que te interessa.
- Se você é **dev** implementando uma feature: leia o PRD inteiro antes de
  codar. Critérios de aceite viram checklist do PR.
- Se você é **designer**: foque em Personas, User Stories e Fluxo de uso.
- Se você está **aprendendo a arquitetura** do projeto: comece pelo
  **diagrama de sequência** de cada PRD. Ele mostra visualmente quem
  chama quem — ótimo pra entender o fluxo de dados antes de ler o código.
- Se você vai mexer com **OCR (PRD-011) ou Chat (PRD-012)**: leia o
  **⚠️ Princípio de segurança** PRIMEIRO (topo de cada doc). Ele vale
  pros dois e define o contrato de saída (sempre array, nunca salva
  sozinho, user sempre revisa).
- Se você vê **NÃO IMPLEMENTADO** ou **ideia em aberto** num PRD, é
  feature descrita mas que **não está no código atual** (ou está
  parcial). Verifique antes de assumir que existe.

## Notas sobre estas specs

- São **retroativas** — descrevem o que o código JÁ faz, não o ideal.
  Onde o código diverge do que seria "perfeito", o PRD descreve o real
  (e o ideal fica implícito como evolução futura).
- O número do PRD é estável — mesmo que a gente reordene ou remova um,
  o ID não se reutiliza.
- **Mudanças em PRD são commitadas no mesmo branch que mudanças em
  código** (não precisa ser no mesmo commit, mas no mesmo PR quando
  possível). Exceção: ajustes puramente documentais (correções,
  reestruturações) podem ir sozinhos.
- Onde o código diverge do PRD, **PRD tem razão** (é a fonte de verdade
  do que DEVERIA ser). Atualizar código, não o PRD.
