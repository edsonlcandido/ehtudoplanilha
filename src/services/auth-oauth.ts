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
interface OAuthAuthData {
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
      const methods = await pb.collection('users').listAuthMethods();
      return methods.authProviders || [];
    } catch (error) {
      console.error('[AuthOAuth] Erro ao listar provedores OAuth:', error);
      return [];
    }
  }

  /**
   * Inicia o fluxo OAuth com o Google
   * Redireciona o usuário para a página de consentimento do Google
   */
  static async loginWithGoogle(): Promise<void> {
    try {
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Iniciando fluxo OAuth com Google...');
      }

      // Obtém a URL de autenticação do provedor Google
      const authData = await pb.collection('users').authWithOAuth2({
        provider: 'google',
        // O PocketBase redireciona automaticamente para a página de consentimento
        // e volta para a URL atual após autorização
      });

      if (config.isDevelopment) {
        console.log('[AuthOAuth] Autenticação OAuth bem-sucedida:', authData.record.email);
      }

      return authData;
    } catch (error: any) {
      console.error('[AuthOAuth] Erro no fluxo OAuth:', error);
      throw error;
    }
  }

  /**
   * Verifica se há dados de callback OAuth na URL
   */
  static hasOAuthCallback(): boolean {
    const params = new URLSearchParams(window.location.search);
    return params.has('code') || params.has('state');
  }

  /**
   * Processa o callback OAuth após redirecionamento
   */
  static async handleOAuthCallback(): Promise<OAuthAuthData | null> {
    if (!this.hasOAuthCallback()) {
      return null;
    }

    try {
      // O PocketBase automaticamente lida com o callback OAuth
      // quando detecta os parâmetros code/state na URL
      const authData = await pb.collection('users').authWithOAuth2Code(
        'google',
        window.location.search,
        // Redireciona de volta para a URL atual sem os parâmetros OAuth
        window.location.origin + window.location.pathname
      );

      if (config.isDevelopment) {
        console.log('[AuthOAuth] Callback OAuth processado:', authData.record.email);
      }

      // Limpa os parâmetros OAuth da URL
      this.clearUrlParams();

      return authData;
    } catch (error) {
      console.error('[AuthOAuth] Erro ao processar callback OAuth:', error);
      throw error;
    }
  }

  /**
   * Limpa os parâmetros OAuth da URL sem recarregar a página
   */
  static clearUrlParams(): void {
    if (window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      url.searchParams.delete('error');
      window.history.replaceState({}, document.title, url.toString());
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
