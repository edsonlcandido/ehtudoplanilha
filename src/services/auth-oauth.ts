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
   * Este método obtém a URL OAuth e faz redirect direto, evitando completamente EventSource
   * Funciona em todos os ambientes sem depender de EventSource ou popups
   */
  static async loginWithGoogle(): Promise<void> {
    try {
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Iniciando fluxo OAuth com Google (redirect direto)...');
      }

      // Salva a página atual para retornar depois do OAuth
      localStorage.setItem('oauth_return_path', window.location.pathname);

      // Obtém os métodos de autenticação para pegar a URL do OAuth
      const authMethods: any = await pb.collection('users').listAuthMethods();
      
      if (!authMethods.authProviders || authMethods.authProviders.length === 0) {
        throw new Error('Nenhum provedor OAuth configurado. Configure o Google OAuth no PocketBase Admin UI.');
      }

      // Encontra o provedor Google
      const googleProvider = authMethods.authProviders.find((p: any) => p.name === 'google');
      
      if (!googleProvider) {
        throw new Error('Provedor Google não configurado. Habilite-o no PocketBase Admin UI.');
      }

      if (config.isDevelopment) {
        console.log('[AuthOAuth] Provedor Google encontrado');
      }

      // Constrói a URL de redirect manualmente
      // Formato: {authUrl}?client_id={clientId}&redirect_uri={redirectUri}&response_type=code&scope=...&state={state}
      const redirectUrl = encodeURIComponent(`${pb.baseUrl}/api/oauth2-redirect`);
      const state = encodeURIComponent(googleProvider.state);
      const codeChallenge = googleProvider.codeChallenge ? `&code_challenge=${encodeURIComponent(googleProvider.codeChallenge)}&code_challenge_method=S256` : '';
      
      const oauthUrl = `${googleProvider.authUrl}${redirectUrl}&state=${state}${codeChallenge}`;
      
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Redirecionando para Google OAuth...');
      }

      // Faz redirect direto sem usar authWithOAuth2 (evita EventSource completamente)
      window.location.href = oauthUrl;
      
    } catch (error: any) {
      console.error('[AuthOAuth] Erro ao iniciar OAuth:', error);
      alert(error?.message || 'Erro ao iniciar login com Google. Verifique se o OAuth está configurado no PocketBase Admin UI.');
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
