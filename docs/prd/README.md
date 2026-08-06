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

Cada PRD tem 9 seções (algumas opcionais):

| Seção | Pergunta que responde |
|---|---|
| **Contexto** | Por que essa feature existe? Qual problema resolve? |
| **Objetivos** | O que precisa ser entregue, em bullets curtos. |
| **Não-objetivos** | O que está **fora do escopo** (tão importante quanto o escopo). |
| **Personas** | Quem usa. Tipos de usuário. |
| **User Stories** | "Como [persona], quero [ação], para [benefício]". Cada história é uma entrega pequena. |
| **Critérios de aceite** | Checklist verificável. Quando tudo aqui está ✅, a feature tá pronta. |
| **Fluxo de uso** | Passo a passo do happy path. Às vezes tem fluxos alternativos. |
| **Edge cases** | O que acontece nos cantos: dados vazios, erros, race conditions, etc. |
| **Métricas de sucesso** | Como medir se a feature tá sendo usada e entregando valor. |

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
| [PRD-002](./PRD-002-conexao-google-e-planilha.md) | Conexão Google + Planilha | OAuth Sheets/Drive, provisionamento |
| [PRD-003](./PRD-003-lancamentos-crud.md) | Lançamentos Financeiros (CRUD) | Criar, editar, deletar, listar |
| [PRD-004](./PRD-004-lancamento-futuro.md) | Lançamento Futuro | Planejar sem data/conta |
| [PRD-005](./PRD-005-transferencia-entre-contas.md) | Transferência entre Contas | Mover saldo entre contas |
| [PRD-006](./PRD-006-categorias.md) | Categorias e Tipos | CRUD de categorias, tipo, limite |
| [PRD-007](./PRD-007-resumo-financeiro.md) | Resumo Financeiro | Agregados, totais, dashboard |
| [PRD-008](./PRD-008-filtros-e-busca.md) | Filtros e Busca | Busca textual, filtros avançados |
| [PRD-009](./PRD-009-configuracao-planilha.md) | Configuração de Planilha | Listar/selecionar/desvincular/revogar |
| [PRD-010](./PRD-010-pwa-instalacao-share-target.md) | PWA: Instalação + Share Target | Install no celular, share de imagem |
| [PRD-011](./PRD-011-ocr-comprovantes.md) | OCR de Comprovantes | Upload de imagem + webhook n8n (premium) |
| [PRD-012](./PRD-012-chat-ia.md) | Chat com IA | ChatFAB do PWA (premium) |

## Como ler

- Se você é **product manager/engenheiro** e tá chegando no projeto: leia o
  índice, depois abra o PRD da feature que te interessa.
- Se você é **dev** implementando uma feature: leia o PRD inteiro antes de
  codar. Critérios de aceite viram checklist do PR.
- Se você é **designer**: foque em Personas, User Stories e Fluxo de uso.

## Notas sobre estas specs

- São **retroativas** — descrevem o que o código JÁ faz, não o ideal.
  Onde o código diverge do que seria "perfeito", o PRD descreve o real
  (e o ideal fica implícito como evolução futura).
- O número do PRD é estável — mesmo que a gente reordene ou remova um,
  o ID não se reutiliza.
- Mudanças em PRD devem ser commitadas no mesmo PR que muda o código
  (regra de ouro pra spec não ficar mentirosa).
