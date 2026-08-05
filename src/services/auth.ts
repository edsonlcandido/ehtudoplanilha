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
 * Faz bootstrap do token via cookie HttpOnly.
 *
 * POR QUE EXISTE: o PB JS SDK NÃO carrega `authStore` do localStorage
 * automaticamente quando a instância `pb` é criada. Se o user logar pelo
 * PWA (Vue) e depois abrir uma página da app web (Vite/TS), a nova
 * instância `pb` tem `authStore.token` vazio — mesmo que o cookie
 * HttpOnly `pocketbase_auth` esteja válido e o localStorage tenha o
 * token (em teoria a storage key é a mesma, mas o SDK não popula
 * sozinho no construtor).
 *
 * COMO FUNCIONA: usa `fetch()` direto pra `/api/collections/users/auth-refresh`
 * com `credentials: 'include'` (envia o cookie HttpOnly). Se o server
 * validar o cookie e retornar 200 com `{ token, record }`, popula
 * `pb.authStore` e retorna true. Se 401, retorna false.
 *
 * POR QUE NÃO USA `pb.collection('users').authRefresh()`: o SDK
 * automaticamente chama `authStore.clear()` em caso de 401. Isso era
 * a causa do bug original de deletar o token. Usando `fetch()` direto
 * temos controle total sobre o que fazer em cada caso.
 *
 * Deve ser chamado quando o `authStore.token` local está vazio mas
 * o cookie HttpOnly pode estar válido (ex: cross-app login).
 */
export async function bootstrapAuthFromCookie(): Promise<boolean> {
  try {
    console.log('[Auth] Bootstrap via cookie HttpOnly...');
    const response = await fetch('/api/collections/users/auth-refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      const data = await response.json();
      // data = { token, record }
      if (data?.token && data?.record) {
        pb.authStore.save(data.token, data.record);
        console.log('[Auth] Bootstrap OK ✓ token carregado do cookie');
        return true;
      }
      console.warn('[Auth] Bootstrap retornou 200 mas sem token/record');
      return false;
    }

    console.log(`[Auth] Bootstrap falhou (status ${response.status})`);
    return false;
  } catch (error) {
    console.error('[Auth] Erro no bootstrap:', error);
    return false;
  }
}

/**
 * Verifica se o token do PocketBase é válido
 *
 * Fluxo:
 * 1. Se `authStore.isValid` local (token + model populados), retorna true
 * 2. Se NÃO, tenta bootstrap via cookie HttpOnly (cross-app login via PWA)
 * 3. Se bootstrap OK, retorna true
 * 4. Se bootstrap falhou, redireciona pro / e retorna false
 *
 * NÃO chama `pb.collection('users').authRefresh()` (que auto-limpa o
 * store em caso de 401). Em vez disso usa `bootstrapAuthFromCookie()`
 * com `fetch()` direto.
 *
 * Deve ser chamado no início do carregamento de páginas protegidas.
 */
export async function verifyTokenValidity(): Promise<boolean> {
  if (isAuthenticated()) {
    console.log('[Auth] Token válido localmente ✓');
    return true;
  }

  console.log('[Auth] Token local ausente, tentando bootstrap via cookie...');
  const ok = await bootstrapAuthFromCookie();
  if (ok) {
    return true;
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
