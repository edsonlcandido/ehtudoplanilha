/**
 * Componente de Toast
 * Exibe mensagens temporárias flutuantes no canto superior direito
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  title?: string;
}

/**
 * Exibe uma mensagem toast temporária
 */
export function showToast(options: ToastOptions): void {
  const {
    message,
    type = 'info',
    duration = 4000,
    title
  } = options;

  const toastDiv = document.createElement('div');
  toastDiv.className = `toast toast--${type}`;
  
  let content = '';
  
  if (title) {
    const icon = getIconForType(type);
    content += `<strong class="toast__title">${icon} ${title}</strong>`;
  }
  
  content += `<p class="toast__message">${message}</p>`;
  
  toastDiv.innerHTML = content;
  
  document.body.appendChild(toastDiv);
  
  // Remove o toast após a duração especificada
  setTimeout(() => {
    toastDiv.classList.add('toast--fadeout');
    setTimeout(() => {
      toastDiv.remove();
    }, 300);
  }, duration);
}

/**
 * Exibe uma mensagem de sucesso
 */
export function showSuccessToast(message: string, title?: string): void {
  showToast({
    message,
    type: 'success',
    title: title || 'Sucesso!'
  });
}

/**
 * Exibe uma mensagem de erro
 */
export function showErrorToast(message: string, title?: string): void {
  showToast({
    message,
    type: 'error',
    title: title || 'Erro!',
    duration: 5000
  });
}

/**
 * Exibe uma mensagem informativa
 */
export function showInfoToast(message: string, title?: string): void {
  showToast({
    message,
    type: 'info',
    title
  });
}

/**
 * Exibe uma mensagem de aviso
 */
export function showWarningToast(message: string, title?: string): void {
  showToast({
    message,
    type: 'warning',
    title: title || 'Aviso!',
    duration: 5000
  });
}

/**
 * Retorna o ícone apropriado para cada tipo de toast
 */
function getIconForType(type: ToastType): string {
  const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
  
  return icons[type];
}
