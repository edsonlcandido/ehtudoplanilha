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
   * Inicia o fluxo OAuth com o Google
   * Usa redirect flow para melhor compatibilidade
   */
  static async loginWithGoogle(): Promise<any> {
    try {
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Iniciando fluxo OAuth com Google...');
      }

      // Guarda a URL de retorno antes de redirecionar
      const returnUrl = window.location.href;
      sessionStorage.setItem('oauth_return_url', returnUrl);

      // O PocketBase redireciona para a página do Google OAuth
      // e depois volta para a URL especificada em urlCallback
      const authData = await pb.collection('users').authWithOAuth2({
        provider: 'google',
        // urlCallback permite usar redirect ao invés de popup
        urlCallback: (url) => {
          // Redireciona para a URL do Google OAuth
          window.location.href = url;
        },
        // createData é usado se o usuário não existir (registro automático)
        createData: {
          emailVisibility: true,
        },
      });

      if (config.isDevelopment) {
        console.log('[AuthOAuth] Autenticação OAuth bem-sucedida:', authData.record.email);
        console.log('[AuthOAuth] Novo usuário:', authData.meta?.isNew);
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
    // Verifica se há parâmetros típicos de OAuth callback
    return params.has('code') && params.has('state');
  }

  /**
   * Processa o callback OAuth após redirecionamento
   * NOTA: Com urlCallback, o PocketBase já processa automaticamente
   * Esta função apenas verifica se o usuário está autenticado e limpa a URL
   */
  static async handleOAuthCallback(): Promise<boolean> {
    if (!this.hasOAuthCallback()) {
      return false;
    }

    try {
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Processando callback OAuth...');
      }

      // Aguarda um pouco para o PocketBase processar
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verifica se está autenticado (PocketBase já deve ter processado)
      if (this.isAuthenticated()) {
        const user = this.getCurrentUser();
        
        if (config.isDevelopment) {
          console.log('[AuthOAuth] Callback OAuth processado com sucesso:', user?.email);
        }

        // Limpa os parâmetros OAuth da URL
        this.clearUrlParams();
        
        return true;
      }

      // Se não está autenticado, algo deu errado
      throw new Error('Falha ao processar autenticação OAuth');
      
    } catch (error) {
      console.error('[AuthOAuth] Erro ao processar callback OAuth:', error);
      this.clearUrlParams();
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
