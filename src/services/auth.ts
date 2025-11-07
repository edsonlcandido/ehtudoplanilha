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
 * Usa a melhor prática do PocketBase:
 * 1. Verifica pb.authStore.isValid
 * 2. Chama pb.collection('users').authRefresh() para validar com o servidor
 * 3. Se falhar, limpa o authStore
 * 4. Se inválido após refresh, redireciona para /
 * 
 * Deve ser chamado no início do carregamento de páginas protegidas
 */
export async function verifyTokenValidity(): Promise<boolean> {
  // Passo 1: Verificar se está autenticado localmente
  if (!isAuthenticated()) {
    console.warn('[Auth] Usuário não autenticado localmente');
    redirectToHome();
    return false;
  }

  try {
    // Passo 2: Validar token com o servidor usando authRefresh()
    console.log('[Auth] Validando token com o servidor...');
    await pb.collection('users').authRefresh();
    
    // Passo 3: Verificar novamente após refresh
    if (!isAuthenticated()) {
      console.warn('[Auth] Token inválido após refresh');
      redirectToHome();
      return false;
    }

    console.log('[Auth] Token válido ✓');
    return true;
  } catch (error) {
    // Passo 4: Se houver erro (ex: 401), limpar o authStore e redirecionar
    console.error('[Auth] Erro ao validar token:', error);
    logout();
    redirectToHome();
    return false;
  }
}

/**
 * Redireciona para a página inicial
 */
function redirectToHome(): void {
  window.location.href = '/';
}
