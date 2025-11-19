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
   * Usa o método padrão do PocketBase que abre popup com OAuth do Google
   * e redireciona para /api/oauth2-redirect
   */
  static async loginWithGoogle(): Promise<any> {
    try {
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Iniciando fluxo OAuth com Google...');
      }

      // Este método inicializa uma conexão realtime e abre popup com OAuth
      // O PocketBase gerencia tudo automaticamente usando /api/oauth2-redirect
      const authData = await pb.collection('users').authWithOAuth2({
        provider: 'google',
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
