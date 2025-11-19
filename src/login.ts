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
async function init(): Promise<void> {
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

  // Verificar se há callback OAuth pendente
  await handleOAuthCallbackIfPresent();

  // Setup event listeners
  setupEventListeners();
}

/**
 * Verifica e processa callback OAuth se presente na URL
 */
async function handleOAuthCallbackIfPresent(): Promise<void> {
  if (AuthOAuthService.hasOAuthCallback()) {
    if (config.isDevelopment) {
      console.log('[Login] Detectado callback OAuth, processando...');
    }

    try {
      hideMessages();
      showSuccess('Processando autenticação...');

      // Processa o callback OAuth
      const success = await AuthOAuthService.handleOAuthCallback();

      if (success) {
        if (config.isDevelopment) {
          const user = AuthOAuthService.getCurrentUser();
          console.log('[Login] OAuth callback processado com sucesso:', user?.email);
        }

        showSuccess('Login realizado com sucesso! Redirecionando...');

        setTimeout(() => {
          redirectToDashboard();
        }, 1000);
      }
    } catch (error: any) {
      console.error('[Login] Erro ao processar callback OAuth:', error);
      showError('Erro ao processar autenticação. Tente novamente.');
    }
  }
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
    
    // Desabilitar botão durante o processo
    elements.googleLoginBtn.disabled = true;
    elements.googleLoginBtn.textContent = 'Redirecionando...';
    
    // Inicia o fluxo OAuth com Google
    await AuthOAuthService.loginWithGoogle();
    
    // Se chegou aqui, o login foi bem-sucedido
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
    
    // Re-habilitar botão
    elements.googleLoginBtn.disabled = false;
    elements.googleLoginBtn.innerHTML = `
      <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
      </svg>
      <span>Entrar com Google</span>
    `;
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
