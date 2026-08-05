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
 * Fluxo:
 * 1. Se `authStore.isValid` local (token + model populados), retorna true
 * 2. Se NÃO, tenta `pb.collection('users').authRefresh()` pra obter
 *    um token novo a partir do localStorage
 * 3. Se refresh OK, retorna true
 * 4. Se refresh falhou, redireciona pro / e retorna false
 *
 * IMPORTANTE: PocketBase autentica via header `Authorization: <token>`
 * (lido do localStorage com chave `pocketbase_auth`). NÃO usa cookie
 * (confirmado via /debug-auth). O `pb.send` adiciona o header
 * automaticamente quando o `authStore.token` é truthy.
 *
 * POR QUE NÃO CHAMA authRefresh EM TODO LOAD: o bug original era
 * `authRefresh()` falhando e o app redirecionando pro login. Agora
 * só chamamos se o token local NÃO é válido (isValid = false), que
 * é o cenário onde o token provavelmente está expirado mesmo.
 *
 * Deve ser chamado no início do carregamento de páginas protegidas.
 */
export async function verifyTokenValidity(): Promise<boolean> {
  if (isAuthenticated()) {
    console.log('[Auth] Token válido localmente ✓');
    return true;
  }

  console.log('[Auth] Token local inválido, tentando refresh via SDK...');
  try {
    const authData = await pb.collection('users').authRefresh();
    if (authData?.token) {
      console.log('[Auth] Refresh OK ✓');
      return true;
    }
    console.warn('[Auth] Refresh retornou sem token');
  } catch (e: any) {
    console.warn('[Auth] Refresh falhou:', e?.status, e?.message);
  }

  console.warn('[Auth] Não autenticado, redirecionando para /');
  redirectToHome();
  return false;
}

/**
 * Redireciona para a página inicial
 */
function redirectToHome(): void {
  window.location.href = '/';
}
