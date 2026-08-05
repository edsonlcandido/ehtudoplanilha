import { pb } from '../main';
import type { User } from '../types';
import { CacheService } from './cache';

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
  // Limpa todos os caches antes de fazer logout
  console.log('[Auth] Limpando caches ao fazer logout');
  CacheService.clearAll();
  
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

/**
 * Verifica se o token do PocketBase é válido
 *
 * Versão conservadora: confia no `pb.authStore.isValid` (que checa expiração
 * do JWT localmente). NÃO chama `authRefresh()` automaticamente porque isso
 * estava deletando o `pocketbase_auth` do localStorage quando o servidor
 * rejeitava o token por qualquer motivo (CORS, network, diferença de
 * storage entre o PWA e o frontend principal, etc).
 *
 * Se o user estiver no PWA e navegar pro /dashboard, o token no
 * localStorage é compartilhado entre os dois, e a checagem local
 * é suficiente pra autorizar.
 *
 * Se o token realmente expirar, o backend vai retornar 401 em alguma
 * chamada, e o handler de 401 pode decidir o que fazer.
 *
 * Deve ser chamado no início do carregamento de páginas protegidas.
 */
export async function verifyTokenValidity(): Promise<boolean> {
  if (!isAuthenticated()) {
    console.warn('[Auth] Usuário não autenticado localmente');
    redirectToHome();
    return false;
  }

  console.log('[Auth] Token válido localmente ✓');
  return true;
}

/**
 * Redireciona para a página inicial
 */
function redirectToHome(): void {
  window.location.href = '/';
}
