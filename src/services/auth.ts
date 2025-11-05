import { pb } from '../main';
import type { User } from '../types';

/**
 * Verifica se o usuário está autenticado
 */
export function isAuthenticated(): boolean {
  return pb.authStore.isValid && pb.authStore.model !== null;
}

/**
 * Obtém o usuário autenticado atual
 */
export function getCurrentUser(): User | null {
  if (!isAuthenticated()) {
    return null;
  }
  return pb.authStore.model as User;
}

/**
 * Realiza logout do usuário
 */
export function logout(): void {
  pb.authStore.clear();
}

/**
 * Realiza logout e recarrega a página
 */
export function logoutAndReload(): void {
  logout();
  window.location.reload();
}

/**
 * Redireciona para a página de login
 */
export function redirectToLogin(): void {
  window.location.href = '/login.html';
}

/**
 * Redireciona para a página de dashboard
 */
export function redirectToDashboard(): void {
  window.location.href = '/dashboard/index.html';
}

/**
 * Redireciona para a página de registro
 */
export function redirectToRegister(): void {
  window.location.href = '/registro.html';
}

/**
 * Observador de mudanças no estado de autenticação
 * @param callback Função chamada quando o estado muda
 */
export function onAuthChange(callback: (isAuth: boolean) => void): void {
  pb.authStore.onChange(() => {
    callback(isAuthenticated());
  });
}
