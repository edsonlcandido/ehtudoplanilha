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
   * Usa o método nativo do PocketBase com tratamento adequado
   */
  static loginWithGoogle(): void {
    try {
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Iniciando fluxo OAuth com Google...');
      }

      // Usa o método nativo do PocketBase que gerencia tudo automaticamente
      // IMPORTANTE: Não usar async/await no click handler para evitar popup blocking
      pb.collection('users').authWithOAuth2({ provider: 'google' })
        .then((authData: any) => {
          if (config.isDevelopment) {
            console.log('[AuthOAuth] Autenticação OAuth bem-sucedida:', authData.record.email);
            console.log('[AuthOAuth] Novo usuário:', authData.meta?.isNew);
          }
          
          // Redireciona para o dashboard após sucesso
          window.location.href = '/dashboard/';
        })
        .catch((error: any) => {
          console.error('[AuthOAuth] Erro no fluxo OAuth:', error);
          
          // Mostra mensagem de erro amigável
          let errorMessage = 'Erro ao fazer login com Google';
          if (error?.message) {
            if (error.message.includes('popup')) {
              errorMessage = 'Por favor, habilite popups para este site';
            } else if (error.message.includes('EventSource')) {
              errorMessage = 'Erro de conexão. Tente novamente';
            } else {
              errorMessage = error.message;
            }
          }
          
          alert(errorMessage);
        });
    } catch (error: any) {
      console.error('[AuthOAuth] Erro ao iniciar OAuth:', error);
      alert('Erro ao iniciar login com Google. Tente novamente.');
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
