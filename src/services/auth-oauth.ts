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
   * Usa redirect manual para evitar problemas com EventSource/realtime
   */
  static async loginWithGoogle(): Promise<void> {
    try {
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Iniciando fluxo OAuth com Google...');
      }

      // Salva a URL atual para retornar após o OAuth
      sessionStorage.setItem('oauth_redirect_after', window.location.pathname);

      // Lista os métodos de autenticação para obter as URLs do OAuth
      const authMethods: any = await pb.collection('users').listAuthMethods();
      
      if (!authMethods.authProviders || authMethods.authProviders.length === 0) {
        throw new Error('Nenhum provedor OAuth configurado no PocketBase');
      }

      // Encontra o provedor Google
      const googleProvider = authMethods.authProviders.find(
        (p: any) => p.name === 'google'
      );

      if (!googleProvider) {
        throw new Error('Provedor Google não está configurado no PocketBase');
      }

      if (config.isDevelopment) {
        console.log('[AuthOAuth] Provedor Google encontrado:', googleProvider);
      }

      // Redireciona para a URL de autorização do Google
      // O PocketBase retornará para /api/oauth2-redirect após a autorização
      const redirectUrl = `${pb.baseUrl}/api/oauth2-redirect`;
      const authUrl = `${googleProvider.authUrl}${redirectUrl}`;
      
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Redirecionando para:', authUrl);
      }

      window.location.href = authUrl;
    } catch (error: any) {
      console.error('[AuthOAuth] Erro no fluxo OAuth:', error);
      throw error;
    }
  }

  /**
   * Verifica se há parâmetros OAuth de retorno na URL
   */
  static hasOAuthCallback(): boolean {
    const params = new URLSearchParams(window.location.search);
    return params.has('code') && params.has('state');
  }

  /**
   * Processa o callback OAuth após retorno do /api/oauth2-redirect
   */
  static async handleOAuthCallback(): Promise<boolean> {
    if (!this.hasOAuthCallback()) {
      return false;
    }

    try {
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Processando callback OAuth...');
      }

      // Aguarda um momento para o PocketBase processar o OAuth
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verifica se o usuário está autenticado
      if (this.isAuthenticated()) {
        const user = this.getCurrentUser();
        
        if (config.isDevelopment) {
          console.log('[AuthOAuth] OAuth bem-sucedido:', user?.email);
        }

        // Limpa os parâmetros da URL
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        window.history.replaceState({}, document.title, url.toString());

        return true;
      }

      return false;
    } catch (error) {
      console.error('[AuthOAuth] Erro ao processar callback:', error);
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
