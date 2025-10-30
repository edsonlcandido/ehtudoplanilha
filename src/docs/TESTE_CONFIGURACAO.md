# ✅ Checklist de Teste - Página de Configuração

**Data:** 30 de Janeiro de 2025  
**Página:** `/dashboard/configuracao.html`  
**Objetivo:** Validar novo método de provisionamento com escopo `drive.file`

---

## 📋 Pré-requisitos

- [ ] PocketBase rodando localmente (`./iniciar-pb.sh`)
- [ ] Build do frontend Vite atualizado (`npm run dev` ou `npm run build`)
- [ ] Variáveis de ambiente configuradas (`.env`)
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`

---

## 🧪 Testes Funcionais

### 1️⃣ Teste: Carregamento Inicial da Página

**Objetivo:** Verificar se a página carrega corretamente e exibe os 3 cartões

#### Passos:
1. Acesse `/dashboard/configuracao.html`
2. Faça login se necessário

#### Resultado Esperado:
- [ ] Página carrega sem erros no console
- [ ] Menu de usuário aparece no topo
- [ ] Menu lateral esquerdo visível
- [ ] 3 cartões visíveis:
  - Cartão 1: "Autorização Google Drive"
  - Cartão 2: "Planilha Atual"
  - Cartão 3: "Gerenciar Planilha"

#### Status Atual:
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever problema):

---

### 2️⃣ Teste: Autorização Google OAuth

**Objetivo:** Verificar fluxo completo de autorização OAuth

#### Cenário A: Usuário SEM autorização prévia

##### Passos:
1. Clique no botão "🔑 Autorizar com Google"
2. Será redirecionado para Google
3. Na tela de consentimento do Google, observe:
   - Deve mostrar: **"Ver e gerenciar os arquivos do Google Drive criados ou abertos por este app"**
   - NÃO deve mostrar: "Ver e gerenciar todos os seus arquivos do Drive"
4. Clique em "Permitir"
5. Será redirecionado de volta para a aplicação

##### Resultado Esperado:
- [ ] Redirecionamento para Google funciona
- [ ] Tela de consentimento mostra apenas escopo `drive.file`
- [ ] Callback redireciona corretamente para `/google-oauth-callback`
- [ ] Após callback, volta para dashboard ou página de configuração
- [ ] Botão muda para "✅ Conectado ao Google Drive" (verde, desabilitado)
- [ ] Cartão 2 e 3 ficam habilitados

##### Status:
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever problema):

#### Cenário B: Usuário JÁ autorizado

##### Passos:
1. Recarregue a página `/dashboard/configuracao.html`

##### Resultado Esperado:
- [ ] Botão já aparece como "✅ Conectado ao Google Drive"
- [ ] Botão está desabilitado
- [ ] Não precisa autorizar novamente

##### Status:
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever problema):

---

### 3️⃣ Teste: Provisionar Nova Planilha (Criar Programaticamente)

**Objetivo:** Criar planilha via Sheets API (sem copiar template)

#### Cenário A: Usuário SEM planilha configurada

##### Passos:
1. Certifique-se de estar autorizado no Google
2. No Cartão 2 ("Planilha Atual"), clique em "Copiar Template"
3. Aguarde a criação

##### Resultado Esperado:
- [ ] Botão muda para "⏳ Criando planilha..." (desabilitado)
- [ ] Após alguns segundos, alerta de sucesso aparece no canto superior direito
- [ ] Mensagem: "Planilha 'Planilha Eh Tudo - [Seu Nome]' criada com sucesso!"
- [ ] Cartão 2 atualiza:
  - Nome da planilha em verde
  - Botão "Copiar Template" desaparece
  - Botões "Limpar Conteúdo de exemplo" e "Desvincular Planilha" aparecem
- [ ] Console do browser mostra: "✅ Planilha criada: [sheet_id]"

##### Verificações no Google Drive:
1. Abra Google Drive no navegador
2. Verifique se a planilha aparece na lista
3. Abra a planilha criada
4. Verifique:
   - [ ] Aba "Lançamentos" existe
   - [ ] Header: Data | Conta | Valor | Descrição | Categoria | Orçamento | Observação
   - [ ] Aba "Categorias" existe
   - [ ] 44 categorias + header (45 linhas total)
   - [ ] Categorias incluem: ALIMENTAÇÃO, SAÚDE, TRANSPORTE, etc.

##### Status:
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever problema):

#### Cenário B: Usuário JÁ possui planilha

##### Passos:
1. Tente clicar novamente em "Copiar Template"

##### Resultado Esperado:
- [ ] Deve mostrar mensagem: "Usuário já possui uma planilha configurada"
- [ ] Não cria planilha duplicada

##### Status:
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever problema):

---

### 4️⃣ Teste: Selecionar Planilha Existente

**Objetivo:** Permitir escolher uma planilha já criada

#### Passos:
1. No Cartão 3 ("Gerenciar Planilha"), clique em "📋 Selecionar Planilha"
2. Modal abre com "Carregando suas planilhas..."
3. Após carregar, lista de planilhas aparece

##### Resultado Esperado - Modal:
- [ ] Modal abre corretamente
- [ ] Estado de loading aparece primeiro
- [ ] Lista de planilhas do Google Drive aparece
- [ ] Cada item mostra: Nome da planilha + ID
- [ ] Planilhas criadas pelo app aparecem na lista

##### Resultado Esperado - Seleção:
1. Clique em uma planilha da lista
2. Item selecionado:
   - [ ] Borda azul
   - [ ] Fundo azul claro
3. Botão "Confirmar Seleção" aparece
4. Clique em "Confirmar Seleção"
5. Modal fecha
6. Alerta de sucesso: "Planilha '[nome]' selecionada com sucesso!"
7. Cartão 2 atualiza com o nome da planilha

##### Status:
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever problema):

---

### 5️⃣ Teste: Desvincular Planilha

**Objetivo:** Remover planilha configurada (não deleta a planilha do Drive)

#### Passos:
1. Com planilha configurada, clique em "Desvincular Planilha" no Cartão 2
2. Confirme o alerta

##### Resultado Esperado:
- [ ] Mensagem de confirmação aparece
- [ ] Após confirmar, alerta de sucesso
- [ ] Cartão 2 volta ao estado inicial:
  - "Nenhuma planilha selecionada" (vermelho)
  - Botão "Copiar Template" reaparece
  - Botões "Limpar" e "Desvincular" desaparecem

##### Verificação no Drive:
- [ ] Planilha ainda existe no Google Drive (não foi deletada)

##### Status:
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever problema):

---

### 6️⃣ Teste: Limpar Conteúdo de Exemplo

**Objetivo:** Remover dados de exemplo da planilha (se houver)

#### Passos:
1. Clique em "Limpar Conteúdo de exemplo"
2. Confirme

##### Resultado Esperado:
- [ ] Alerta de confirmação aparece
- [ ] Alerta de sucesso após operação
- [ ] Planilha no Drive tem conteúdo de exemplo removido

##### Status:
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever problema):

---

## 🧩 Testes de Integração

### 7️⃣ Teste: Token Expirado (Renovação Automática)

**Objetivo:** Verificar se o sistema renova automaticamente o access_token

#### Pré-condição:
- Usuário já autorizou o Google
- Access token válido por 1 hora

#### Passos:
1. Configure a planilha normalmente
2. Aguarde 1 hora (ou force expiração no backend)
3. Tente provisionar uma nova planilha OU listar planilhas

##### Resultado Esperado:
- [ ] Sistema detecta token expirado (401)
- [ ] Renova automaticamente usando refresh_token
- [ ] Operação completa com sucesso
- [ ] Logs no console do PocketBase mostram: "Token expirado, renovando..."

##### Status:
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever problema):

---

### 8️⃣ Teste: Fluxo Completo (End-to-End)

**Objetivo:** Simular jornada completa do usuário

#### Cenário: Novo Usuário

##### Passos:
1. Registre um novo usuário
2. Faça login
3. Acesse `/dashboard/configuracao.html`
4. Clique em "Autorizar com Google"
5. Autorize com escopo `drive.file`
6. Volte à página de configuração
7. Clique em "Copiar Template"
8. Aguarde criação da planilha
9. Acesse `/dashboard/lancamentos.html`
10. Adicione um lançamento
11. Volte ao Google Drive e verifique se lançamento foi salvo

##### Resultado Esperado:
- [ ] Todos os passos funcionam sem erros
- [ ] Lançamento aparece na planilha do Google Drive
- [ ] Nenhum erro no console do browser
- [ ] Nenhum erro no console do PocketBase

##### Status:
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever problema):

---

## 🐛 Testes de Erro

### 9️⃣ Teste: Usuário Não Autorizado

**Objetivo:** Verificar comportamento quando não há refresh_token

#### Passos:
1. Acesse a página sem ter autorizado o Google
2. Tente clicar em "Selecionar Planilha"

##### Resultado Esperado:
- [ ] Botão está desabilitado
- [ ] Texto do botão: "🔒 Autorize primeiro o Google Drive"

##### Status:
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever problema):

---

### 🔟 Teste: Erro de Rede

**Objetivo:** Verificar tratamento de erros de conexão

#### Passos:
1. Desligue a internet
2. Tente listar planilhas

##### Resultado Esperado:
- [ ] Modal mostra estado de erro
- [ ] Mensagem de erro apropriada
- [ ] Botão "Tentar Novamente" disponível

##### Status:
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever problema):

---

## 📱 Testes Responsivos

### 1️⃣1️⃣ Teste: Mobile (Viewport < 768px)

#### Passos:
1. Abra DevTools (F12)
2. Alterne para modo mobile (Ctrl+Shift+M)
3. Teste iPhone 12 Pro (390x844)

##### Resultado Esperado:
- [ ] Menu lateral colapsa
- [ ] Cartões empilham verticalmente
- [ ] Botões ficam em largura total
- [ ] Alertas não ultrapassam a tela
- [ ] Modal se ajusta à tela

##### Status:
- [ ] ✅ Passou
- [ ] ❌ Falhou (descrever problema):

---

## 🔍 Inspeção de Código

### Verificações no Backend (`pb_hooks/provision-sheet.pb.js`)

- [ ] Usa `createSpreadsheet()` em vez de copiar template
- [ ] Cria aba "Lançamentos" com 7 colunas
- [ ] Cria aba "Categorias" com 44 categorias
- [ ] Popula categorias usando `populateCategorias()`
- [ ] Trata erro 401 (token expirado) e renova automaticamente
- [ ] Retorna `spreadsheetId`, `sheet_name` e `sheet_url`

### Verificações no Frontend (`src/dashboard/configuracao.ts`)

- [ ] Carrega status inicial com `SheetsService.getConfigStatus()`
- [ ] Atualiza UI baseado no estado (`pageState`)
- [ ] Trata todos os eventos de clique dos botões
- [ ] Mostra alertas de sucesso/erro
- [ ] Modal funciona corretamente
- [ ] Renderiza lista de planilhas dinamicamente

### Verificações no CSS (`src/css/pages/configuracao.css`)

- [ ] Estilos de alertas (`.alert.success`, `.alert.error`)
- [ ] Estilos da lista de planilhas (`.sheet-item`)
- [ ] Animações (`@keyframes slideIn`)
- [ ] Responsividade mobile (`@media`)

---

## ✅ Checklist Final

Antes de considerar a migração completa:

- [ ] Todos os testes funcionais passaram
- [ ] Testes de integração OK
- [ ] Testes de erro OK
- [ ] Testes responsivos OK
- [ ] Código inspecionado e sem erros
- [ ] Console do browser limpo (sem erros)
- [ ] Console do PocketBase limpo (apenas logs informativos)
- [ ] Documentação atualizada
- [ ] Commit das mudanças

---

## 📝 Notas de Teste

**Testado por:** _______________  
**Data:** _______________  
**Ambiente:** _______________  
**Navegador:** _______________  

**Observações Gerais:**



**Bugs Encontrados:**



**Melhorias Sugeridas:**



---

## 🎉 Resultado Final

- [ ] ✅ **APROVADO** - Pronto para produção
- [ ] ⚠️ **APROVADO COM RESSALVAS** - Pequenos ajustes necessários
- [ ] ❌ **REPROVADO** - Necessita correções significativas

---

**Próximos Passos:**
1. Corrigir bugs encontrados (se houver)
2. Deploy em ambiente de homologação
3. Testes com usuários reais
4. Deploy em produção

---

*Documento gerado em 30/01/2025 - Migração OAuth Scope `drive.file`*
