# Dashboard Authentication

Este diretório contém as páginas do dashboard que requerem autenticação.

## Proteção de Autenticação

Todas as páginas neste diretório estão protegidas por autenticação usando PocketBase. Para adicionar uma nova página do dashboard:

1. Inclua os scripts necessários no `<head>` ou antes do `</body>`:
   ```html
   <script src="../js/api-config.js"></script>
   <script src="../js/dashboard-auth.js"></script>
   ```

2. Certifique-se de que há um elemento com id `menu-user` no seu menu de navegação:
   ```html
   <div class="menu" id="menu-user"></div>
   ```

## Como Funciona

- O script `dashboard-auth.js` verifica automaticamente se o usuário está autenticado ao carregar a página
- Se não estiver autenticado, redireciona para a página de login
- Se estiver autenticado, renderiza o menu do usuário com opção de logout
- Funciona com qualquer profundidade de diretório dentro de `/dashboard`

## Exemplo de Uso

```html
<!DOCTYPE html>
<html>
<head>
    <title>Nova Página do Dashboard</title>
    <script src="../js/api-config.js"></script>
    <script src="../js/dashboard-auth.js"></script>
</head>
<body>
    <nav>
        <div class="menu" id="menu-user"></div>
    </nav>
    <!-- Conteúdo da página -->
</body>
</html>
```

O script irá automaticamente:
- Verificar autenticação
- Redirecionar para login se necessário  
- Renderizar o menu do usuário se autenticado