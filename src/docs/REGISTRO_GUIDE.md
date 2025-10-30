# 📝 Guia da Página de Registro

Este documento explica a implementação da página de registro (`registro.html` + `registro.ts`).

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [HTML](#html)
- [TypeScript](#typescript)
- [Validações](#validações)
- [Tratamento de Erros](#tratamento-de-erros)
- [Estados da UI](#estados-da-ui)
- [Fluxo Completo](#fluxo-completo)

## 🎯 Visão Geral

A página de registro permite que novos usuários criem uma conta no sistema. Implementa:

- ✅ Validação de e-mail
- ✅ Validação de senha (mínimo 8 caracteres)
- ✅ Confirmação de senha
- ✅ Estados de loading
- ✅ Mensagens de erro e sucesso
- ✅ Redirecionamento automático após sucesso
- ✅ Verificação de usuário já autenticado
- ✅ TypeScript com tipagem completa

## 📁 Estrutura de Arquivos

```
src/
├── registro.html          # Página HTML
├── registro.ts            # Lógica TypeScript
├── main.ts                # Inicialização do PocketBase
├── services/
│   └── auth.ts            # Funções de autenticação
└── css/
    └── auth.css           # Estilos compartilhados
```

## 🏗️ HTML

### Estrutura do Formulário

```html
<form class="form auth-form" id="registerForm">
  <div class="form-group">
    <label for="email">E-mail</label>
    <input type="email" id="email" name="email" required>
  </div>
  
  <div class="form-group">
    <label for="password">Senha</label>
    <input type="password" id="password" name="password" 
           required minlength="8">
    <small class="form-help">Mínimo de 8 caracteres</small>
  </div>
  
  <div class="form-group">
    <label for="confirmPassword">Confirmar Senha</label>
    <input type="password" id="confirmPassword" name="confirmPassword" required>
  </div>
  
  <button type="submit" class="button primary" id="submitButton">
    <span id="buttonText">Registrar</span>
    <span id="buttonLoading" class="loading" style="display: none;">
      Criando conta...
    </span>
  </button>
  
  <div id="errorMsg" class="error-message" style="display: none;"></div>
  <div id="successMsg" class="success-message" style="display: none;"></div>
  
  <p class="auth-link">
    Já tem uma conta? <a href="/login.html">Fazer login</a>
  </p>
</form>
```

### Scripts Modules

```html
<!-- Carrega PocketBase e config globalmente -->
<script type="module" src="./main.ts"></script>

<!-- Lógica específica da página de registro -->
<script type="module" src="./registro.ts"></script>
```

## 💻 TypeScript

### Interfaces

```typescript
interface RegisterElements {
  form: HTMLFormElement;
  emailInput: HTMLInputElement;
  passwordInput: HTMLInputElement;
  confirmPasswordInput: HTMLInputElement;
  submitButton: HTMLButtonElement;
  buttonText: HTMLSpanElement;
  buttonLoading: HTMLSpanElement;
  errorMsg: HTMLDivElement;
  successMsg: HTMLDivElement;
}

interface RegisterData {
  email: string;
  password: string;
  passwordConfirm: string;
}
```

### Fluxo Principal

```typescript
async function performRegister(elements: RegisterElements): Promise<void> {
  if (isLoading) return;
  
  hideMessages(elements);
  
  // 1. Coleta dados do formulário
  const data: RegisterData = {
    email: elements.emailInput.value.trim(),
    password: elements.passwordInput.value,
    passwordConfirm: elements.confirmPasswordInput.value,
  };
  
  // 2. Valida formulário
  const validation = validateForm(data);
  if (!validation.valid) {
    showError(elements, validation.message || 'Erro de validação');
    return;
  }
  
  setLoading(elements, true);
  
  try {
    // 3. Cria usuário no PocketBase
    await window.pb.collection('users').create({
      email: data.email,
      emailVisibility: true,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
    });
    
    // 4. Sucesso - mostra mensagem
    showSuccess(elements, 'Conta criada com sucesso! Redirecionando...');
    
    // 5. Redireciona após 1.5s
    setTimeout(() => {
      redirectToLogin();
    }, 1500);
  } catch (error: any) {
    // 6. Trata erros
    handleRegistrationError(error, elements);
    setLoading(elements, false);
  }
}
```

## ✅ Validações

### Validação de E-mail

```typescript
function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email) {
    return { valid: false, message: 'E-mail é obrigatório' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'E-mail inválido' };
  }
  
  return { valid: true };
}
```

### Validação de Senha

```typescript
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: 'Senha é obrigatória' };
  }
  
  if (password.length < 8) {
    return { valid: false, message: 'Senha deve ter no mínimo 8 caracteres' };
  }
  
  return { valid: true };
}
```

### Validação de Confirmação

```typescript
function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): { valid: boolean; message?: string } {
  if (!confirmPassword) {
    return { valid: false, message: 'Confirmação de senha é obrigatória' };
  }
  
  if (password !== confirmPassword) {
    return { valid: false, message: 'As senhas não coincidem' };
  }
  
  return { valid: true };
}
```

### Validação Completa do Formulário

```typescript
function validateForm(data: RegisterData): { valid: boolean; message?: string } {
  // Valida e-mail
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    return emailValidation;
  }
  
  // Valida senha
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    return passwordValidation;
  }
  
  // Valida confirmação
  const confirmValidation = validatePasswordConfirmation(
    data.password,
    data.passwordConfirm
  );
  if (!confirmValidation.valid) {
    return confirmValidation;
  }
  
  return { valid: true };
}
```

## 🚨 Tratamento de Erros

### Erros do PocketBase

```typescript
let errorMessage = 'Erro ao criar conta. Tente novamente.';

if (error?.response?.data) {
  const errorData = error.response.data;
  
  // Erro de e-mail já existente
  if (errorData.email) {
    errorMessage = 'Este e-mail já está cadastrado';
  }
  // Erro de senha
  else if (errorData.password) {
    errorMessage = 'Senha inválida. Use no mínimo 8 caracteres';
  }
  // Erro de confirmação de senha
  else if (errorData.passwordConfirm) {
    errorMessage = 'As senhas não coincidem';
  }
  // Mensagem genérica do servidor
  else if (errorData.message) {
    errorMessage = errorData.message;
  }
} else if (error?.message) {
  errorMessage = error.message;
}

showError(elements, errorMessage);
```

### Tipos de Erros

| Tipo | Condição | Mensagem |
|------|----------|----------|
| **E-mail duplicado** | `errorData.email` | "Este e-mail já está cadastrado" |
| **Senha fraca** | `errorData.password` | "Senha inválida. Use no mínimo 8 caracteres" |
| **Senhas diferentes** | `errorData.passwordConfirm` | "As senhas não coincidem" |
| **Erro genérico** | `errorData.message` | Mensagem do servidor |
| **Erro de rede** | `error.message` | Mensagem do erro |

## 🎨 Estados da UI

### Estado Normal

```typescript
function setLoading(elements: RegisterElements, loading: boolean): void {
  isLoading = loading;
  elements.submitButton.disabled = loading;
  elements.emailInput.disabled = loading;
  elements.passwordInput.disabled = loading;
  elements.confirmPasswordInput.disabled = loading;
  
  if (loading) {
    elements.buttonText.style.display = 'none';
    elements.buttonLoading.style.display = 'inline';
  } else {
    elements.buttonText.style.display = 'inline';
    elements.buttonLoading.style.display = 'none';
  }
}
```

### Exibição de Mensagens

```typescript
function showError(elements: RegisterElements, message: string): void {
  elements.errorMsg.textContent = message;
  elements.errorMsg.style.display = 'block';
  elements.successMsg.style.display = 'none';
}

function showSuccess(elements: RegisterElements, message: string): void {
  elements.successMsg.textContent = message;
  elements.successMsg.style.display = 'block';
  elements.errorMsg.style.display = 'none';
}

function hideMessages(elements: RegisterElements): void {
  elements.errorMsg.style.display = 'none';
  elements.successMsg.style.display = 'none';
}
```

### Limpeza ao Digitar

```typescript
function setupInputValidation(elements: RegisterElements): void {
  // Limpa mensagens de erro ao digitar
  elements.emailInput.addEventListener('input', () => hideMessages(elements));
  elements.passwordInput.addEventListener('input', () => hideMessages(elements));
  elements.confirmPasswordInput.addEventListener('input', () => hideMessages(elements));
}
```

## 🔄 Fluxo Completo

### 1. Inicialização

```
Usuario acessa /registro.html
    ↓
main.ts inicializa PocketBase
    ↓
registro.ts carrega
    ↓
Verifica se já está autenticado?
    ├─ SIM → Redireciona para /dashboard
    └─ NÃO → Continua
    ↓
Obtém elementos do DOM
    ↓
Configura event handlers
    ↓
Página pronta ✅
```

### 2. Submissão do Formulário

```
Usuário preenche formulário
    ↓
Clica em "Registrar"
    ↓
Previne submit padrão
    ↓
Valida e-mail
    ├─ Inválido → Mostra erro
    └─ Válido → Continua
    ↓
Valida senha (min 8 chars)
    ├─ Inválida → Mostra erro
    └─ Válida → Continua
    ↓
Valida confirmação de senha
    ├─ Não coincide → Mostra erro
    └─ Coincide → Continua
    ↓
Ativa estado de loading
    ↓
Chama API do PocketBase
    ├─ ERRO → Mostra mensagem de erro
    │          Desativa loading
    │          Permite retry
    └─ SUCESSO → Mostra "Conta criada com sucesso!"
                 Aguarda 1.5s
                 Redireciona para /login.html
```

## 🧪 Testando

### Teste Manual

1. **Acesse a página**
```
http://localhost:5173/registro.html
```

2. **Teste validações**
```typescript
// E-mail inválido
teste@      → "E-mail inválido"

// Senha curta
1234567     → "Senha deve ter no mínimo 8 caracteres"

// Senhas diferentes
senha: 12345678
confirma: 87654321  → "As senhas não coincidem"
```

3. **Teste sucesso**
```typescript
email: novo@exemplo.com
senha: senha123456
confirma: senha123456
→ "Conta criada com sucesso! Redirecionando..."
→ Redireciona para /login.html
```

4. **Teste e-mail duplicado**
```typescript
// Mesmo e-mail duas vezes
email: mesmo@exemplo.com
→ "Este e-mail já está cadastrado"
```

## 🎯 Boas Práticas Implementadas

### ✅ Segurança
- Senha mínima de 8 caracteres
- Input type="password" (oculta senha)
- Validação no cliente E no servidor
- Confirmação de senha obrigatória

### ✅ UX
- Feedback imediato de validação
- Estado de loading durante requisição
- Mensagens de erro claras e específicas
- Redirecionamento automático após sucesso
- Limpa mensagens ao digitar

### ✅ Código
- TypeScript com tipagem completa
- Separação de responsabilidades
- Funções pequenas e testáveis
- Tratamento de erros robusto
- Comentários em pontos-chave

### ✅ Acessibilidade
- Labels associados aos inputs
- Mensagens de ajuda (form-help)
- Feedback visual de erros
- Botões com texto descritivo

## 📚 Recursos Relacionados

- **[LOGIN_GUIDE.md](./LOGIN_GUIDE.md)** - Implementação do login
- **[API_REFERENCE.md](./API_REFERENCE.md)** - AuthService
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura geral

---

**Resultado**: Página de registro completa, validada e segura! 🎉
