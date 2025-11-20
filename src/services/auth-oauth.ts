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
      
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Resposta de listAuthMethods:', authMethods);
      }
      
      // authProviders pode estar no root ou em oauth2.providers
      const providers = authMethods.authProviders || authMethods.oauth2?.providers || [];
      
      if (providers.length === 0) {
        throw new Error('Nenhum provedor OAuth configurado. Configure o Google OAuth no PocketBase Admin UI.');
      }

      // Encontra o provedor Google
      const googleProvider = providers.find((p: any) => p.name === 'google');
      
      if (!googleProvider) {
        throw new Error('Provedor Google não configurado. Habilite-o no PocketBase Admin UI.');
      }

      if (config.isDevelopment) {
        console.log('[AuthOAuth] Provedor Google encontrado:', googleProvider);
      }

      // O PocketBase já retorna a URL completa, só precisamos adicionar o redirect_uri no final
      // A URL vem no formato: ...&redirect_uri= (vazio no final)
      // IMPORTANTE: Usamos a página de login/registro como redirect_uri (não /api/oauth2-redirect)
      // para receber o code e fazer a troca manual
      const currentPage = window.location.origin + window.location.pathname;
      const redirectUrl = encodeURIComponent(currentPage);
      const oauthUrl = `${googleProvider.authUrl}${redirectUrl}`;
      
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Redirect URI:', currentPage);
        console.log('[AuthOAuth] URL OAuth completa:', oauthUrl);
        console.log('[AuthOAuth] Redirecionando para Google OAuth...');
      }

      // Salva state e codeVerifier no localStorage para validação posterior
      localStorage.setItem('oauth_state', googleProvider.state);
      localStorage.setItem('oauth_code_verifier', googleProvider.codeVerifier);

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
   * Faz a troca manual do código OAuth por tokens
   */
  static async handleOAuthCallback(): Promise<boolean> {
    if (!this.isOAuthCallback()) {
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    
    // Verifica se houve erro no OAuth
    if (params.has('error')) {
      const error = params.get('error');
      const errorDescription = params.get('error_description') || '';
      console.error('[AuthOAuth] Erro no callback OAuth:', error, errorDescription);
      
      // Limpa a URL e mostra erro
      window.history.replaceState({}, document.title, window.location.pathname);
      alert(`Erro na autenticação: ${error}${errorDescription ? ': ' + errorDescription : ''}`);
      
      // Limpa dados do OAuth
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_code_verifier');
      localStorage.removeItem('oauth_return_path');
      
      return false;
    }

    try {
      if (config.isDevelopment) {
        console.log('[AuthOAuth] Processando callback OAuth...');
        console.log('[AuthOAuth] Parâmetros da URL:', Object.fromEntries(params));
      }

      const code = params.get('code');
      const state = params.get('state');
      
      if (!code) {
        throw new Error('Código OAuth não encontrado no callback');
      }

      // Valida o state
      const savedState = localStorage.getItem('oauth_state');
      if (state !== savedState) {
        console.error('[AuthOAuth] State inválido. Esperado:', savedState, 'Recebido:', state);
        throw new Error('State OAuth inválido. Possível ataque CSRF.');
      }

      // Recupera o codeVerifier salvo
      const codeVerifier = localStorage.getItem('oauth_code_verifier');
      if (!codeVerifier) {
        throw new Error('Code verifier não encontrado');
      }

      if (config.isDevelopment) {
        console.log('[AuthOAuth] Trocando código OAuth por tokens...');
      }

      // Faz a troca manual do código por tokens usando a API do PocketBase
      const authData = await pb.collection('users').authWithOAuth2Code(
        'google',
        code,
        codeVerifier,
        window.location.origin + window.location.pathname // redirectUrl usado na solicitação
      );

      if (config.isDevelopment) {
        console.log('[AuthOAuth] Autenticação bem-sucedida:', authData.record.email);
        console.log('[AuthOAuth] Novo usuário:', authData.meta?.isNew);
      }

      // Limpa os parâmetros OAuth da URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Limpa dados temporários do OAuth
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_code_verifier');
      localStorage.removeItem('oauth_return_path');
      
      // Redireciona para o dashboard
      window.location.href = '/dashboard/';
      return true;
      
    } catch (error: any) {
      console.error('[AuthOAuth] Erro ao processar callback OAuth:', error);
      
      // Limpa a URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Limpa dados temporários
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_code_verifier');
      localStorage.removeItem('oauth_return_path');
      
      // Mostra erro para o usuário
      const errorMsg = error?.message || 'Erro ao processar autenticação OAuth';
      alert(`Erro: ${errorMsg}`);
      
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
