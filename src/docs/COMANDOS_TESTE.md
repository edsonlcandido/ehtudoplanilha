# 🚀 Comandos Rápidos - Teste da Página de Configuração

**Data:** 30 de Janeiro de 2025  
**Objetivo:** Rodar e testar a nova página de configuração

---

## 📦 1. Preparar Ambiente

### Backend (PocketBase)

```bash
# Na raiz do projeto
./iniciar-pb.sh
```

**Console deve mostrar:**
```
Server started at http://127.0.0.1:8090
├─ REST API: http://127.0.0.1:8090/api/
└─ Admin UI: http://127.0.0.1:8090/_/
```

---

### Frontend (Vite Dev Server)

```bash
# Entrar na pasta src
cd src

# Instalar dependências (se necessário)
npm install

# Rodar dev server
npm run dev
```

**Console deve mostrar:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

---

## 🌐 2. Acessar a Aplicação

### Opção A: Via Vite Dev Server (Desenvolvimento)

1. Abra o navegador
2. Acesse: `http://localhost:5173/dashboard/configuracao.html`

### Opção B: Via PocketBase (Produção Simulada)

1. Buildar o frontend:
   ```bash
   cd src
   npm run build
   ```

2. Abra o navegador
3. Acesse: `http://localhost:8090/dashboard/configuracao.html`

---

## 🔍 3. Abrir DevTools (Console)

### No Chrome/Edge:
- **F12** ou **Ctrl+Shift+I**

### No Firefox:
- **F12** ou **Ctrl+Shift+K**

### Abas Importantes:
1. **Console** - Ver logs e erros
2. **Network** - Ver requisições HTTP
3. **Application** → Storage → Local Storage - Ver autenticação

---

## 🧪 4. Teste Rápido (Happy Path)

### Passo 1: Login
```
1. Acesse /login.html
2. Faça login com sua conta
3. Será redirecionado para o dashboard
```

### Passo 2: Ir para Configuração
```
1. Acesse /dashboard/configuracao.html
2. Deve ver 3 cartões
```

### Passo 3: Autorizar Google
```
1. Clique em "🔑 Autorizar com Google"
2. Será redirecionado para Google
3. Autorize com sua conta
4. Volte para o app
5. Botão deve mudar para "✅ Conectado ao Google Drive"
```

### Passo 4: Criar Planilha
```
1. Clique em "Copiar Template"
2. Aguarde mensagem de sucesso
3. Nome da planilha aparece em verde
```

### Passo 5: Verificar no Google Drive
```
1. Abra https://drive.google.com
2. Procure por "Planilha Eh Tudo - [Seu Nome]"
3. Abra a planilha
4. Verifique abas: "Lançamentos" e "Categorias"
```

---

## 🐛 5. Debug - Logs Importantes

### No Console do Browser:

#### Carregamento:
```
✅ Página de configuração inicializada
✅ Status carregado: {hasRefreshToken: true, hasSheetId: false, ...}
```

#### OAuth:
```
🔑 Iniciando fluxo OAuth...
```

#### Provisionar:
```
📋 Provisionando planilha...
✅ Planilha criada: {sheetId: "...", sheetName: "..."}
```

#### Listar Planilhas:
```
📋 Listando planilhas...
✅ 5 planilhas encontradas
```

#### Salvar Seleção:
```
💾 Salvando seleção: Minha Planilha
```

---

### No Console do PocketBase:

#### Provisionar Planilha:
```
Criando nova planilha para usuário abc123
Planilha criada: 1abc...xyz
Planilha provisionada com sucesso para usuário abc123
```

#### Token Expirado:
```
Token expirado, renovando...
Token renovado com sucesso
```

---

## 🔧 6. Comandos de Troubleshooting

### Limpar Cache do Browser:
```
Chrome: Ctrl+Shift+Delete
- Selecione "Cached images and files"
- Clique em "Clear data"
```

### Limpar Local Storage:
```
1. F12 → Application → Storage → Local Storage
2. Clique com botão direito em http://localhost:xxxx
3. Clear
```

### Reiniciar PocketBase:
```bash
# Ctrl+C para parar
# Depois:
./iniciar-pb.sh
```

### Rebuild Frontend:
```bash
cd src
rm -rf dist/
npm run build
```

### Ver Logs do PocketBase:
```bash
# Já deve estar visível no terminal onde rodou ./iniciar-pb.sh
# Se não aparecer nada, verifique se o hook está executando
```

---

## 📊 7. Verificações Rápidas

### Checklist Visual (5 minutos):

#### Página Carrega:
- [ ] Menu superior aparece
- [ ] Menu lateral esquerdo aparece
- [ ] 3 cartões visíveis
- [ ] Botão de autorização habilitado

#### OAuth Funciona:
- [ ] Clique no botão redireciona para Google
- [ ] Tela de consentimento mostra escopo correto
- [ ] Callback funciona
- [ ] Botão muda para "Conectado"

#### Provisionar Funciona:
- [ ] Botão "Copiar Template" habilitado
- [ ] Clique mostra loading
- [ ] Alerta de sucesso aparece
- [ ] Nome da planilha em verde

#### Modal Funciona:
- [ ] "Selecionar Planilha" abre modal
- [ ] Lista de planilhas carrega
- [ ] Clique seleciona (borda azul)
- [ ] "Confirmar" salva e fecha

---

## 🚨 8. Erros Comuns e Soluções

### Erro 1: "Usuário não autenticado"
**Causa:** Não fez login  
**Solução:** Acesse `/login.html` e faça login

### Erro 2: "CORS error" ou "Failed to fetch"
**Causa:** PocketBase não está rodando  
**Solução:** Execute `./iniciar-pb.sh`

### Erro 3: "Cannot read properties of null"
**Causa:** Elemento do DOM não encontrado  
**Solução:** Verifique se está na página correta (`configuracao.html`)

### Erro 4: "401 Unauthorized" no Google
**Causa:** Token expirado  
**Solução:** Sistema deve renovar automaticamente. Se persistir, revogue acesso e autorize novamente.

### Erro 5: Modal não abre
**Causa:** JavaScript não carregou  
**Solução:** 
```bash
# Rebuild
cd src
npm run build
# Limpar cache do browser
Ctrl+Shift+Delete
```

### Erro 6: Planilha não aparece no Drive
**Causa:** Escopo errado ou erro na criação  
**Solução:** 
1. Verifique logs do PocketBase
2. Confirme escopo `drive.file`
3. Tente reprovisionar

---

## 🔄 9. Resetar Estado (Limpar Tudo)

### Resetar Configuração do Usuário:

#### Via UI:
```
1. Clique em "Desvincular Planilha"
2. Confirme
```

#### Via Backend (Admin):
```
1. Acesse http://localhost:8090/_/
2. Login com admin
3. Acesse coleção "google_infos"
4. Encontre seu registro
5. Delete campos: sheet_id, sheet_name
6. Ou delete o registro inteiro
```

### Revogar Acesso Google:
```
1. Acesse https://myaccount.google.com/permissions
2. Encontre "Planilha Eh Tudo"
3. Clique em "Remover acesso"
4. Confirme
```

---

## 📱 10. Testar Mobile

### Via DevTools:

```
1. F12
2. Ctrl+Shift+M (Toggle device toolbar)
3. Selecione dispositivo: iPhone 12 Pro
4. Recarregue a página
5. Teste todas as funcionalidades
```

### Verifique:
- [ ] Cartões empilham verticalmente
- [ ] Botões em largura total
- [ ] Menu lateral funciona
- [ ] Modal ajusta à tela
- [ ] Alertas não ultrapassam tela

---

## ✅ 11. Checklist Final de Teste

### Marque conforme testa:

- [ ] Página carrega sem erros
- [ ] OAuth funciona
- [ ] Provisionar cria planilha
- [ ] Planilha aparece no Drive
- [ ] Aba "Lançamentos" OK
- [ ] Aba "Categorias" com 44 itens
- [ ] Selecionar planilha funciona
- [ ] Modal funciona
- [ ] Desvincular funciona
- [ ] Alertas aparecem
- [ ] Responsivo funciona
- [ ] Console limpo (sem erros)

---

## 🎉 12. Se Tudo Funcionou

### Parabéns! 🎊

Sua implementação está funcionando perfeitamente!

### Próximos passos:
1. Commit das mudanças
2. Push para o repositório
3. Deploy em homologação
4. Testes com usuários reais

### Comando de Commit:
```bash
git add .
git commit -m "feat: implementa página de configuração com novo método OAuth (drive.file)

- Adiciona lógica completa em configuracao.ts
- Implementa provisionar planilha programaticamente
- Adiciona modal de seleção de planilhas
- Estiliza alertas e componentes
- Suporta responsividade mobile
- Integra com GoogleOAuthService e SheetsService"

git push origin feature/migrate-to-vite
```

---

## 📞 13. Precisa de Ajuda?

### Logs Detalhados:

#### Browser Console:
- Pressione F12
- Vá para aba Console
- Filtre por: `config`, `oauth`, `sheet`

#### PocketBase Console:
- Terminal onde rodou `./iniciar-pb.sh`
- Procure por: `provision`, `oauth`, `error`

### Arquivos para Revisar:
1. `src/dashboard/configuracao.ts` - Lógica principal
2. `pb_hooks/provision-sheet.pb.js` - Backend
3. `src/css/pages/configuracao.css` - Estilos

---

## 🔗 Links Úteis

- **Aplicação Local:** http://localhost:5173/dashboard/configuracao.html
- **PocketBase Admin:** http://localhost:8090/_/
- **Google Drive:** https://drive.google.com
- **Permissões Google:** https://myaccount.google.com/permissions
- **Documentação:** `src/docs/OAUTH_SCOPE_MIGRATION.md`
- **Testes:** `src/docs/TESTE_CONFIGURACAO.md`

---

*Comandos preparados em 30/01/2025 - Boa sorte nos testes! 🚀*
