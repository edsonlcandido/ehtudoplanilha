# Configuração Automática de Ambiente com Vite Proxy

## 🎯 Problema Resolvido

**Antes**: URLs diferentes em dev e produção causavam problemas de CORS e diferenças de comportamento.

**Agora**: Proxy do Vite simula produção em desenvolvimento - **mesma origem sempre!**

## 🔧 Como Funciona

### Desenvolvimento (com Vite Proxy)

```typescript
// Frontend: http://localhost:5173
// PocketBase: http://localhost:8090

// Requisição do código:
await pb.send('/api/collections/users/records')
// URL real: http://localhost:5173/api/collections/users/records
//           ↓ (Vite Proxy intercepta)
//           ↓ (Redireciona para)
// URL final: http://localhost:8090/api/collections/users/records

// VANTAGENS:
// ✅ Mesma origem (sem CORS)
// ✅ Comportamento idêntico à produção
// ✅ Testa build sem diferenças
```

### Produção

```typescript
// Frontend: https://planilha.ehtudo.app (servido pelo PocketBase)
// PocketBase: https://planilha.ehtudo.app

// Requisição do código:
await pb.send('/api/collections/users/records')
// URL real: https://planilha.ehtudo.app/api/collections/users/records
//           ↓ (PocketBase responde diretamente)
// URL final: https://planilha.ehtudo.app/api/collections/users/records

// VANTAGENS:
// ✅ Mesma origem (sem CORS)
// ✅ Sem configuração extra
```

## 📋 Configuração do Proxy

### vite.config.ts

```typescript
const POCKETBASE_CUSTOM_ENDPOINTS = [
  '/google-oauth-callback',
  '/google-refresh-token',
  '/env-variables',
  // ... todos os 19 endpoints
];

function createProxyConfig(target = 'http://localhost:8090') {
  return {
    target,           // Redireciona para
    changeOrigin: true,  // Muda o header Origin
    secure: false,       // Aceita SSL auto-assinado
  };
}

// Proxy automático para todos os endpoints
server: {
  proxy: {
    '/api': createProxyConfig(),  // API padrão PocketBase
    ...generateProxyConfig()       // Todos os hooks customizados
  }
}
```

### config/env.ts (Simplificado)

```typescript
function getPocketBaseUrl(): string {
  // SEMPRE usa window.location.origin
  // Vite proxy cuida do resto!
  return window.location.origin;
}

// Resultado:
// Dev:  http://localhost:5173 → proxy → http://localhost:8090
// Prod: https://planilha.ehtudo.app → direto
```


## 🔄 Fluxo de Requisições

### Desenvolvimento com Proxy

```
Browser (localhost:5173)
    ↓
    Código: pb.send('/append-entry', {...})
    ↓
    URL: http://localhost:5173/append-entry
    ↓
Vite Proxy intercepta
    ↓
    Verifica: "/append-entry" está em POCKETBASE_CUSTOM_ENDPOINTS?
    ↓ SIM
    Redireciona para: http://localhost:8090/append-entry
    ↓
PocketBase (localhost:8090) processa
    ↓
Hook pb_hooks/append-entry.pb.js executa
    ↓
Resposta volta pelo proxy
    ↓
Browser recebe resposta
```

### Produção (Sem Proxy)

```
Browser (planilha.ehtudo.app)
    ↓
    Código: pb.send('/append-entry', {...})
    ↓
    URL: https://planilha.ehtudo.app/append-entry
    ↓
PocketBase serve e processa diretamente
    ↓
Hook pb_hooks/append-entry.pb.js executa
    ↓
Resposta direta para browser
```

## 📊 Comparação: Antes vs Agora

| Aspecto | Antes (sem proxy) | Agora (com proxy) |
|---------|------------------|-------------------|
| **URLs em Dev** | Frontend: 5173<br>Backend: 8090 | Frontend: 5173<br>Backend: 5173 (proxy) |
| **CORS** | ❌ Necessário | ✅ Não precisa |
| **Origin** | Diferente | ✅ Mesma |
| **Testa Prod** | ⚠️ Diferente | ✅ Idêntico |
| **Configuração** | 2 URLs diferentes | ✅ 1 URL sempre |
| **Cookies** | ⚠️ SameSite issues | ✅ Funciona |
| **Headers** | ⚠️ CORS preflight | ✅ Sem preflight |

## 🎯 Vantagens do Proxy

### 1. **Comportamento Idêntico**
```typescript
// Código EXATAMENTE igual em dev e prod
const pb = new PocketBase(window.location.origin);

// Dev:  http://localhost:5173
// Prod: https://planilha.ehtudo.app
```

### 2. **Sem CORS**
```typescript
// Antes (sem proxy):
// ❌ Error: CORS policy blocked request from localhost:5173 to localhost:8090

// Agora (com proxy):
// ✅ Mesma origem - sem erro CORS
```

### 3. **Build Confiável**
```bash
# npm run build gera bundle idêntico ao dev
# Testa em npm run preview com comportamento de produção
```

### 4. **Cookies Funcionam**
```typescript
// PocketBase authStore usa cookies
// Proxy mantém cookies funcionando corretamente
pb.authStore.save(token, user);  // ✅ Funciona em dev e prod
```

## 🧪 Como Testar

### 1. Testar Dev com Proxy
```bash
# Terminal 1: PocketBase
./pocketbase serve

# Terminal 2: Vite
cd src
npm run dev

# Verificar no console:
console.log('PB URL:', window.pb.baseUrl);
// Dev:  http://localhost:5173
// Requisições vão para localhost:8090 via proxy
```

### 2. Testar Build (Simula Produção)
```bash
# Build
npm run build

# Preview (comportamento de produção)
npm run preview

# Acesse: http://localhost:4173
# config.pocketbaseUrl = window.location.origin
# = http://localhost:4173
```

### 3. Verificar Proxy Funcionando
```typescript
// No console do browser (dev):
fetch('http://localhost:5173/api/collections/users/records')
  .then(r => r.json())
  .then(d => console.log('Proxy funcionou!', d))
  .catch(e => console.error('Proxy falhou', e));

// Se aparecer dados: ✅ Proxy OK
// Se erro CORS: ❌ Proxy não configurado
```

## 🔧 Adicionar Novo Endpoint

Quando criar novo hook em `pb_hooks/`:

```typescript
// 1. Adicionar endpoint em vite.config.ts
const POCKETBASE_CUSTOM_ENDPOINTS = [
  // ... existentes
  '/meu-novo-endpoint',  // ← Adicionar aqui
];

// 2. Adicionar em config/env.ts
export const API_ENDPOINTS = {
  // ... existentes
  meuNovoEndpoint: '/meu-novo-endpoint',  // ← Adicionar aqui
} as const;

// 3. Reiniciar Vite dev server
// Ctrl+C e npm run dev novamente
```

## ⚙️ Configuração Avançada

### Mudar Porta do PocketBase

```typescript
// vite.config.ts
function createProxyConfig(target = 'http://localhost:9090') {  // ← Mudar aqui
  return {
    target,
    changeOrigin: true,
    secure: false,
  };
}
```

### Habilitar Logs do Proxy

```typescript
// vite.config.ts
function createProxyConfig(target = 'http://localhost:8090') {
  return {
    target,
    changeOrigin: true,
    secure: false,
    configure: (proxy, options) => {
      proxy.on('error', (err, req, res) => {
        console.log('[Proxy Error]', err);
      });
      proxy.on('proxyReq', (proxyReq, req, res) => {
        console.log('[Proxy Request]', req.method, req.url);
      });
      proxy.on('proxyRes', (proxyRes, req, res) => {
        console.log('[Proxy Response]', proxyRes.statusCode, req.url);
      });
    },
  };
}
```

### SSL em Desenvolvimento

```typescript
// vite.config.ts
server: {
  https: true,  // Habilita HTTPS
  proxy: {
    '/api': {
      target: 'https://localhost:8090',
      changeOrigin: true,
      secure: false,  // Aceita certificado auto-assinado
    },
  },
}
```

## 🚨 Troubleshooting

### Proxy não funciona
```bash
# 1. Verificar se PocketBase está rodando
curl http://localhost:8090/api/health

# 2. Reiniciar Vite
# Ctrl+C e npm run dev

# 3. Verificar porta correta em vite.config.ts
```

### Erro 504 Gateway Timeout
```bash
# PocketBase não está respondendo
# Verificar se está rodando:
./pocketbase serve --dev
```

### Cookies não salvam
```typescript
// Verificar se changeOrigin está true
proxy: {
  '/api': {
    target: 'http://localhost:8090',
    changeOrigin: true,  // ← IMPORTANTE
  },
}
```

## 📚 Recursos

- [Vite Proxy Config](https://vitejs.dev/config/server-options.html#server-proxy)
- [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)
- [PocketBase API](https://pocketbase.io/docs/api-records/)

---

**Resultado**: Desenvolvimento com proxy = Comportamento idêntico à produção! 🎉

### Ambiente de Produção

#### Durante `npm run build`
```typescript
// Vite define:
import.meta.env.DEV = false
import.meta.env.PROD = true
import.meta.env.MODE = 'production'

// Resultado NO BUILD:
config.isDevelopment = false
config.pocketbaseUrl = window.location.origin

// No browser do usuário:
// Se URL é https://planilha.ehtudo.app
window.location.origin = 'https://planilha.ehtudo.app'

// PocketBase criado com:
const pb = new PocketBase('https://planilha.ehtudo.app');
```

**URLs:**
- Frontend: `https://planilha.ehtudo.app` (servido pelo PocketBase)
- Backend: `https://planilha.ehtudo.app` (PocketBase)
- Requisições: mesma origem, sem CORS

#### Fluxo de Requisição
```
Browser (planilha.ehtudo.app)
    ↓
    GET /index.html
    ↓
PocketBase Server responde index.html (de pb_public/)
    ↓
Browser executa main.js (compilado)
    ↓
config detecta: isDevelopment = false
    ↓
window.location.origin = 'https://planilha.ehtudo.app'
    ↓
PocketBase criado com URL: window.location.origin
    ↓
Requisição: fetch('https://planilha.ehtudo.app/api/collections/users/...')
    ↓
PocketBase Server (mesma origem) responde
```

## 📋 Comparação

### Desenvolvimento

| Aspecto | Dev | Descrição |
|---------|-----|-----------|
| **Frontend URL** | `http://localhost:5173` | Vite dev server |
| **Backend URL** | `http://localhost:8090` | PocketBase |
| **CORS** | Necessário | Origens diferentes |
| **Hot Reload** | ✅ Sim | Vite HMR |
| **Build** | ❌ Não | Serve diretamente |

### Produção

| Aspecto | Prod | Descrição |
|---------|------|-----------|
| **Frontend URL** | `https://planilha.ehtudo.app` | PocketBase serve |
| **Backend URL** | `https://planilha.ehtudo.app` | Mesmo servidor |
| **CORS** | ❌ Não precisa | Mesma origem |
| **Hot Reload** | ❌ Não | Arquivos estáticos |
| **Build** | ✅ Sim | Otimizado/minificado |

## 🛠️ Detecção Inteligente

### 1. Via Vite (Preferencial)
```typescript
if (import.meta.env.DEV !== undefined) {
  return import.meta.env.DEV;
}
```
- ✅ Método confiável
- ✅ Definido em build time
- ✅ Não pode ser spoofed

### 2. Fallback Manual
```typescript
const { hostname, port } = window.location;
return (
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  port === '5500' ||  // Live Server
  port === '5173'     // Vite
);
```
- ✅ Compatibilidade com Live Server
- ✅ Detecção por URL
- ⚠️ Pode falhar em cenários edge

## 🔒 Vantagens da Nova Abordagem

### 1. **Automático**
```typescript
// NÃO precisa mais configurar manualmente
// Vite cuida disso automaticamente
```

### 2. **Seguro**
```typescript
// import.meta.env é definido em BUILD TIME
// Não pode ser alterado em runtime
```

### 3. **Simples**
```typescript
// Um único arquivo de config
import { config } from './config/env';

if (config.isDevelopment) {
  console.log('Dev mode');
}
```

### 4. **Centralizado**
```typescript
// Todos os endpoints em um lugar
import { API_ENDPOINTS } from './config/env';

await pb.send(API_ENDPOINTS.appendEntry, {...});
```

## 🧪 Testando a Configuração

### Ver Configuração Atual
```typescript
// Em qualquer arquivo .ts
import { config } from './config/env';

console.log('Ambiente:', config.isDevelopment ? 'Dev' : 'Prod');
console.log('PocketBase URL:', config.pocketbaseUrl);
console.log('Google Scopes:', config.googleOAuthScopes);
```

### Verificar no Browser Console
```javascript
// No console do browser:
console.log('PB URL:', window.pb.baseUrl);
console.log('Origem:', window.location.origin);
```

### Forçar Produção Localmente
```bash
# Build e preview
npm run build
npm run preview

# Agora está em "modo produção" localmente
# config.isDevelopment = false
# mas ainda usa localhost
```

## 📦 Deploy

### 1. Build
```bash
cd src
npm run build
```

### 2. Copiar para PocketBase
```bash
# Windows PowerShell
Remove-Item -Recurse -Force ..\pb_public\*
Copy-Item -Recurse dist\* ..\pb_public\

# Linux/Mac
rm -rf ../pb_public/*
cp -r dist/* ../pb_public/
```

### 3. Verificar
```bash
# Inicie o PocketBase
cd ..
./pocketbase serve

# Acesse: http://localhost:8090
# O config detectará automaticamente que é produção
# porque window.location.origin === 'http://localhost:8090'
```

## 🎯 Resumo

### ✅ O que mudou

1. **Detecção automática** via `import.meta.env.DEV`
2. **Config centralizado** em `config/env.ts`
3. **Endpoints centralizados** em `API_ENDPOINTS`
4. **Type-safe** com TypeScript
5. **Build otimizado** pelo Vite

### ✅ O que melhorou

1. **Menos código** boilerplate
2. **Mais confiável** detecção de ambiente
3. **Mais seguro** não pode ser alterado
4. **Mais fácil** de usar e manter
5. **Mais limpo** sem classe ApiConfig complexa

### ✅ Compatibilidade

- ✅ **Dev**: Vite dev server + PocketBase separados
- ✅ **Prod**: PocketBase serve tudo da mesma origem
- ✅ **Fallback**: Live Server e outras ferramentas
- ✅ **Build**: Otimizado e minificado

---

**Resultado**: Configuração automática, segura e fácil de usar! 🚀
