import './main';
import { pb } from './main';
import { isAuthenticated, redirectToDashboard } from './services/auth';
import { config } from './config/env';
import { AuthOAuthService } from './services/auth-oauth';

/**
 * Elementos do DOM
 */
interface LoginElements {
  form: HTMLFormElement;
  emailInput: HTMLInputElement;
  passwordInput: HTMLInputElement;
  loginBtn: HTMLButtonElement;
  googleLoginBtn: HTMLButtonElement;
  errorMsg: HTMLParagraphElement;
  successMsg: HTMLParagraphElement;
}

let elements: LoginElements;

/**
 * Inicializa a página de login
 */
function init(): void {
  if (config.isDevelopment) {
    console.log('[Login] Página inicializada em modo desenvolvimento');
  }

  // Se já estiver autenticado, redirecionar para dashboard
  if (isAuthenticated()) {
    redirectToDashboard();
    return;
  }

  // Obter elementos do DOM
  elements = {
    form: document.getElementById('login-form') as HTMLFormElement,
    emailInput: document.getElementById('email') as HTMLInputElement,
    passwordInput: document.getElementById('password') as HTMLInputElement,
    loginBtn: document.getElementById('login-btn') as HTMLButtonElement,
    googleLoginBtn: document.getElementById('google-login-btn') as HTMLButtonElement,
    errorMsg: document.getElementById('errorMsg') as HTMLParagraphElement,
    successMsg: document.getElementById('successMsg') as HTMLParagraphElement,
  };

  // Verificar se todos os elementos foram encontrados
  if (!validateElements()) {
    console.error('[Login] Elementos do DOM não encontrados');
    return;
  }

  // Setup event listeners
  setupEventListeners();
}

/**
 * Valida se todos os elementos do DOM foram encontrados
 */
function validateElements(): boolean {
  return !!(
    elements.form &&
    elements.emailInput &&
    elements.passwordInput &&
    elements.loginBtn &&
    elements.googleLoginBtn &&
    elements.errorMsg &&
    elements.successMsg
  );
}

/**
 * Setup dos event listeners
 */
function setupEventListeners(): void {
  elements.form.addEventListener('submit', handleSubmit);
  elements.googleLoginBtn.addEventListener('click', handleGoogleLogin);
}

/**
 * Handler do submit do formulário
 */
async function handleSubmit(event: Event): Promise<void> {
  event.preventDefault();

  const email = elements.emailInput.value.trim();
  const password = elements.passwordInput.value;

  // Validação básica
  if (!email || !password) {
    showError('Por favor, preencha todos os campos');
    return;
  }

  if (!isValidEmail(email)) {
    showError('Por favor, insira um e-mail válido');
    return;
  }

  // Realizar login
  await performLogin(email, password);
}

/**
 * Realiza o login usando PocketBase
 */
async function performLogin(email: string, password: string): Promise<void> {
  // Desabilitar botão e mostrar loading
  setLoadingState(true);
  hideMessages();

  try {
    // Autenticar com PocketBase
    const authData = await pb.collection('users').authWithPassword(email, password);

    if (config.isDevelopment) {
      console.log('[Login] Login bem-sucedido:', authData.record.email);
    }

    // Mostrar mensagem de sucesso
    showSuccess('Login realizado com sucesso! Redirecionando...');

    // Aguardar 1 segundo e redirecionar
    setTimeout(() => {
      redirectToDashboard();
    }, 1000);
  } catch (error: any) {
    console.error('[Login] Erro ao fazer login:', error);

    // Tratar diferentes tipos de erro
    if (error.status === 400) {
      showError('E-mail ou senha incorretos');
    } else if (error.status === 0) {
      showError('Erro de conexão. Verifique sua internet');
    } else {
      showError('Erro ao realizar login. Tente novamente');
    }

    setLoadingState(false);
  }
}

/**
 * Define o estado de loading do formulário
 */
function setLoadingState(loading: boolean): void {
  elements.loginBtn.disabled = loading;
  elements.emailInput.disabled = loading;
  elements.passwordInput.disabled = loading;

  if (loading) {
    elements.loginBtn.textContent = 'Entrando...';
  } else {
    elements.loginBtn.textContent = 'Entrar';
  }
}

/**
 * Mostra mensagem de erro
 */
function showError(message: string): void {
  elements.errorMsg.textContent = message;
  elements.errorMsg.style.display = 'block';
  elements.successMsg.style.display = 'none';
}

/**
 * Mostra mensagem de sucesso
 */
function showSuccess(message: string): void {
  elements.successMsg.textContent = message;
  elements.successMsg.style.display = 'block';
  elements.errorMsg.style.display = 'none';
}

/**
 * Esconde todas as mensagens
 */
function hideMessages(): void {
  elements.errorMsg.style.display = 'none';
  elements.successMsg.style.display = 'none';
}

/**
 * Valida formato de e-mail
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Handler para login com Google OAuth
 */
async function handleGoogleLogin(event: Event): Promise<void> {
  event.preventDefault();
  
  hideMessages();
  
  try {
    if (config.isDevelopment) {
      console.log('[Login] Iniciando login com Google OAuth...');
    }
    
    // Inicia o fluxo OAuth com Google
    // O PocketBase abre popup automaticamente e gerencia todo o fluxo
    const authData = await AuthOAuthService.loginWithGoogle();
    
    // Se chegou aqui, o login foi bem-sucedido
    if (config.isDevelopment) {
      console.log('[Login] Login OAuth bem-sucedido:', authData.record.email);
    }
    
    showSuccess('Login realizado com sucesso! Redirecionando...');
    
    setTimeout(() => {
      redirectToDashboard();
    }, 1000);
    
  } catch (error: any) {
    console.error('[Login] Erro ao fazer login com Google:', error);
    
    let errorMessage = 'Erro ao fazer login com Google';
    
    if (error?.message) {
      errorMessage = error.message;
    }
    
    showError(errorMessage);
  }
}

/**
 * Inicializar quando DOM estiver pronto
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
