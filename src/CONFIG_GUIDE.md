# Configuração Automática de Ambiente

## 🎯 Problema Resolvido

**Antes**: Código original com detecção manual de ambiente
```javascript
// Código antigo (não usar mais)
class ApiConfig {
  checkIfDev() {
    return window.location.port === '5500' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname === 'localhost';
  }
  
  getBaseURL() {
    if (this.isDevEnvironment) {
      return 'http://localhost:8090';
    }
    return window.location.origin;
  }
}
```

**Agora**: Configuração automática com Vite
```typescript
// config/env.ts - NOVO
function isDevelopmentEnvironment(): boolean {
  // Vite define automaticamente
  if (import.meta.env.DEV !== undefined) {
    return import.meta.env.DEV;
  }
  
  // Fallback para compatibilidade
  const { hostname, port } = window.location;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    port === '5500' ||
    port === '5173'  // Porta padrão do Vite
  );
}

function getPocketBaseUrl(): string {
  if (isDevelopmentEnvironment()) {
    return 'http://localhost:8090';
  }
  return window.location.origin;
}

export const config = {
  isDevelopment: isDevelopmentEnvironment(),
  pocketbaseUrl: getPocketBaseUrl(),
};
```

## 🔄 Como Funciona

### Ambiente de Desenvolvimento

#### Durante `npm run dev`
```typescript
// Vite automaticamente define:
import.meta.env.DEV = true
import.meta.env.PROD = false
import.meta.env.MODE = 'development'

// Resultado:
config.isDevelopment = true
config.pocketbaseUrl = 'http://localhost:8090'

// PocketBase criado com:
const pb = new PocketBase('http://localhost:8090');
```

**URLs:**
- Frontend: `http://localhost:5173` (Vite dev server)
- Backend: `http://localhost:8090` (PocketBase)
- Requisições: Frontend → `http://localhost:8090/api/...`

#### Fluxo de Requisição
```
Browser (localhost:5173)
    ↓
    GET /index.html
    ↓
Vite Dev Server responde index.html
    ↓
Browser executa main.ts
    ↓
config detecta: isDevelopment = true
    ↓
PocketBase criado com URL: http://localhost:8090
    ↓
Requisição: fetch('http://localhost:8090/api/collections/users/...')
    ↓
PocketBase Server (localhost:8090) responde
```

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
