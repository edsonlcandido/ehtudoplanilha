/**
 * Página de Registro
 * Gerencia o formulário de criação de nova conta
 */

import { isAuthenticated, redirectToDashboard, redirectToLogin } from './services/auth';
import { AuthOAuthService } from './services/auth-oauth';
import { config } from './config/env';

// ============================================================================
// Interfaces
// ============================================================================

interface RegisterElements {
  form: HTMLFormElement;
  emailInput: HTMLInputElement;
  passwordInput: HTMLInputElement;
  confirmPasswordInput: HTMLInputElement;
  submitButton: HTMLButtonElement;
  buttonText: HTMLSpanElement;
  buttonLoading: HTMLSpanElement;
  googleRegisterBtn: HTMLButtonElement;
  errorMsg: HTMLDivElement;
  successMsg: HTMLDivElement;
}

interface RegisterData {
  email: string;
  password: string;
  passwordConfirm: string;
}

// ============================================================================
// Estado
// ============================================================================

let isLoading = false;

// ============================================================================
// Elementos do DOM
// ============================================================================

function getElements(): RegisterElements | null {
  const form = document.getElementById('registerForm') as HTMLFormElement;
  const emailInput = document.getElementById('email') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;
  const submitButton = document.getElementById('submitButton') as HTMLButtonElement;
  const buttonText = document.getElementById('buttonText') as HTMLSpanElement;
  const buttonLoading = document.getElementById('buttonLoading') as HTMLSpanElement;
  const googleRegisterBtn = document.getElementById('googleRegisterBtn') as HTMLButtonElement;
  const errorMsg = document.getElementById('errorMsg') as HTMLDivElement;
  const successMsg = document.getElementById('successMsg') as HTMLDivElement;

  if (!form || !emailInput || !passwordInput || !confirmPasswordInput || 
      !submitButton || !buttonText || !buttonLoading || !googleRegisterBtn || !errorMsg || !successMsg) {
    console.error('Elementos do formulário de registro não encontrados');
    return null;
  }

  return {
    form,
    emailInput,
    passwordInput,
    confirmPasswordInput,
    submitButton,
    buttonText,
    buttonLoading,
    googleRegisterBtn,
    errorMsg,
    successMsg,
  };
}

// ============================================================================
// UI Helpers
// ============================================================================

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

// ============================================================================
// Validação
// ============================================================================

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

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: 'Senha é obrigatória' };
  }

  return { valid: true };
}

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

  // Valida confirmação de senha
  const confirmValidation = validatePasswordConfirmation(
    data.password,
    data.passwordConfirm
  );
  if (!confirmValidation.valid) {
    return confirmValidation;
  }

  return { valid: true };
}

// ============================================================================
// Registro
// ============================================================================

async function performRegister(elements: RegisterElements): Promise<void> {
  if (isLoading) return;

  hideMessages(elements);

  const data: RegisterData = {
    email: elements.emailInput.value.trim(),
    password: elements.passwordInput.value,
    passwordConfirm: elements.confirmPasswordInput.value,
  };

  // Validação do formulário
  const validation = validateForm(data);
  if (!validation.valid) {
    showError(elements, validation.message || 'Erro de validação');
    return;
  }

  setLoading(elements, true);

  try {
    // Cria o usuário no PocketBase
    await window.pb.collection('users').create({
      email: data.email,
      emailVisibility: true,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
    });

    // Sucesso - mostra mensagem e redireciona
    showSuccess(elements, 'Conta criada com sucesso! Redirecionando...');
    
    // Aguarda 1.5 segundos antes de redirecionar
    setTimeout(() => {
      redirectToLogin();
    }, 1500);
  } catch (error: any) {
    console.error('Erro ao registrar:', error);
    
    // Trata erros específicos do PocketBase
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
    setLoading(elements, false);
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

function setupFormHandler(elements: RegisterElements): void {
  elements.form.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    await performRegister(elements);
  });
}

function setupInputValidation(elements: RegisterElements): void {
  // Limpa mensagens de erro ao digitar
  elements.emailInput.addEventListener('input', () => hideMessages(elements));
  elements.passwordInput.addEventListener('input', () => hideMessages(elements));
  elements.confirmPasswordInput.addEventListener('input', () => hideMessages(elements));
}

/**
 * Handler para registro com Google OAuth
 */
function handleGoogleRegister(elements: RegisterElements): void {
  hideMessages(elements);
  
  try {
    if (config.isDevelopment) {
      console.log('[Registro] Iniciando registro com Google OAuth...');
    }
    
    // Inicia o fluxo OAuth com Google (redirect para o Google)
    // Não é async para evitar problemas com popup blocking
    AuthOAuthService.loginWithGoogle().catch((error: any) => {
      console.error('[Registro] Erro ao iniciar registro com Google:', error);
      showError(elements, 'Erro ao iniciar registro com Google. Tente novamente.');
    });
    
  } catch (error: any) {
    console.error('[Registro] Erro ao registrar com Google:', error);
    
    let errorMessage = 'Erro ao registrar com Google';
    
    if (error?.message) {
      errorMessage = error.message;
    }
    
    showError(elements, errorMessage);
  }
}

/**
 * Setup dos handlers do botão Google
 */
function setupGoogleRegisterHandler(elements: RegisterElements): void {
  elements.googleRegisterBtn.addEventListener('click', async () => {
    await handleGoogleRegister(elements);
  });
}

// ============================================================================
// Inicialização
// ============================================================================

async function init(): Promise<void> {
  // Verificar se há callback OAuth pendente (usuário retornou do Google)
  if (AuthOAuthService.hasOAuthCallback()) {
    if (config.isDevelopment) {
      console.log('[Registro] Detectado callback OAuth, processando...');
    }

    const success = await AuthOAuthService.handleOAuthCallback();
    
    if (success) {
      // Redireciona para o dashboard após registro OAuth bem-sucedido
      redirectToDashboard();
      return;
    } else {
      console.error('[Registro] Falha ao processar callback OAuth');
    }
  }

  // Verifica se já está autenticado
  if (isAuthenticated()) {
    redirectToDashboard();
    return;
  }

  // Obtém elementos do DOM
  const elements = getElements();
  if (!elements) {
    console.error('Não foi possível inicializar a página de registro');
    return;
  }

  // Configura handlers
  setupFormHandler(elements);
  setupInputValidation(elements);
  setupGoogleRegisterHandler(elements);

  console.log('✅ Página de registro inicializada');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
