/**
 * Serviço de autenticação OAuth
 * Gerencia login e registro via provedores OAuth (Google)
 */

import { pb } from '../main';
import { config } from '../config/env';

/**
 * Interface para dados do usuário OAuth
 */
interface OAuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Interface para resultado da autenticação OAuth
 */
export interface OAuthAuthData {
  record: OAuthUser;
  token: string;
  meta?: {
    isNew: boolean;
    avatarUrl?: string;
    rawUser?: any;
  };
}

/**
 * Serviço para autenticação OAuth
 */
export class AuthOAuthService {
  /**
   * Lista os provedores OAuth disponíveis
   */
  static async listOAuthProviders(): Promise<any[]> {
    try {
      const methods: any = await pb.collection('users').listAuthMethods();
      return methods.authProviders || [];
    } catch (error) {
      console.error('[AuthOAuth] Erro ao listar provedores OAuth:', error);
      return [];
    }
  }

  /**
   * Inicia o fluxo OAuth com o Google usando redirect completo
   * Este método faz redirect para o Google OAuth e depois retorna via /api/oauth2-redirect
   * Funciona em todos os ambientes sem depender de EventSource ou popups
   */
  static loginWithGoogle(): void {
    try {
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Iniciando fluxo OAuth com Google (redirect completo)...');
      }

      // Salva a página atual para retornar depois do OAuth
      localStorage.setItem('oauth_return_path', window.location.pathname);

      // Usa authWithOAuth2 com urlCallback para fazer redirect completo
      // Isso evita problemas de EventSource/popup que ocorrem em alguns ambientes
      pb.collection('users').authWithOAuth2({
        provider: 'google',
        // urlCallback faz redirect ao invés de abrir popup
        urlCallback: (url: string) => {
          if (config.isDevelopment) {
            console.log('[AuthOAuth] Redirecionando para:', url);
          }
          // Redireciona a página inteira para o Google OAuth
          window.location.href = url;
        },
      }).catch((error: any) => {
        // Este catch provavelmente não será executado pois estamos fazendo redirect
        console.error('[AuthOAuth] Erro ao iniciar OAuth:', error);
      });
    } catch (error: any) {
      console.error('[AuthOAuth] Erro ao iniciar OAuth:', error);
      alert('Erro ao iniciar login com Google. Tente novamente.');
    }
  }

  /**
   * Verifica se há callback OAuth na URL (após retorno do Google)
   */
  static isOAuthCallback(): boolean {
    const params = new URLSearchParams(window.location.search);
    // Verifica se há code ou error na URL (indicadores de retorno OAuth)
    return params.has('code') || params.has('error');
  }

  /**
   * Processa o callback OAuth após retorno do Google
   * Este método deve ser chamado ao carregar a página se detectar callback OAuth
   */
  static async handleOAuthCallback(): Promise<boolean> {
    if (!this.isOAuthCallback()) {
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    
    // Verifica se houve erro no OAuth
    if (params.has('error')) {
      const error = params.get('error');
      console.error('[AuthOAuth] Erro no callback OAuth:', error);
      
      // Limpa a URL e mostra erro
      window.history.replaceState({}, document.title, window.location.pathname);
      alert(`Erro na autenticação: ${error}`);
      return false;
    }

    try {
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Processando callback OAuth...');
      }

      // Aguarda um momento para garantir que o PocketBase processou o OAuth
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verifica se o usuário foi autenticado
      if (this.isAuthenticated()) {
        const user = this.getCurrentUser();
        
        if (config.isDevelopment) {
          console.log('[AuthOAuth] OAuth bem-sucedido:', user?.email);
        }

        // Limpa os parâmetros OAuth da URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Remove a flag de retorno e redireciona para o dashboard
        localStorage.removeItem('oauth_return_path');
        
        window.location.href = '/dashboard/';
        return true;
      }

      // Se não está autenticado, algo deu errado
      console.error('[AuthOAuth] Callback processado mas usuário não está autenticado');
      window.history.replaceState({}, document.title, window.location.pathname);
      return false;
      
    } catch (error) {
      console.error('[AuthOAuth] Erro ao processar callback OAuth:', error);
      window.history.replaceState({}, document.title, window.location.pathname);
      return false;
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  static isAuthenticated(): boolean {
    return pb.authStore.isValid;
  }

  /**
   * Obtém o usuário autenticado atual
   */
  static getCurrentUser(): OAuthUser | null {
    return pb.authStore.model as OAuthUser | null;
  }
}

export default AuthOAuthService;
