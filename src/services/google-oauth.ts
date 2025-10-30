import { pb } from '../main';
import { config, API_ENDPOINTS } from '../config/env';

/**
 * Interface para variáveis de ambiente OAuth
 */
export interface OAuthEnvVariables {
  clientId: string;
  redirectUri: string;
  scopes: string;
}

/**
 * Serviço para autenticação OAuth com Google
 */
export class GoogleOAuthService {
  /**
   * Obtém as variáveis de ambiente necessárias para OAuth
   */
  static async getEnvVariables(): Promise<OAuthEnvVariables> {
    try {
      const response = await pb.send<OAuthEnvVariables>(
        API_ENDPOINTS.envVariables,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      console.error('[GoogleOAuth] Erro ao obter variáveis de ambiente:', error);
      throw error;
    }
  }

  /**
   * Constrói a URL de autorização do Google OAuth
   */
  static async buildAuthUrl(userId: string): Promise<string> {
    const envVars = await this.getEnvVariables();
    
    const params = new URLSearchParams({
      client_id: envVars.clientId,
      redirect_uri: envVars.redirectUri,
      response_type: 'code',
      scope: envVars.scopes || config.googleOAuthScopes,
      access_type: 'offline',
      prompt: 'consent',
      state: userId, // Passa o user_id como state para recuperar no callback
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Inicia o fluxo de autorização OAuth
   * Redireciona o usuário para a página de consentimento do Google
   */
  static async startAuthFlow(userId: string): Promise<void> {
    try {
      const authUrl = await this.buildAuthUrl(userId);
      window.location.href = authUrl;
    } catch (error) {
      console.error('[GoogleOAuth] Erro ao iniciar fluxo OAuth:', error);
      throw error;
    }
  }

  /**
   * Verifica se há código de autorização na URL (após callback)
   */
  static hasAuthCode(): boolean {
    const params = new URLSearchParams(window.location.search);
    return params.has('code');
  }

  /**
   * Obtém o código de autorização da URL
   */
  static getAuthCode(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('code');
  }

  /**
   * Obtém o state (userId) da URL
   */
  static getState(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('state');
  }

  /**
   * Verifica se houve erro no callback
   */
  static hasAuthError(): boolean {
    const params = new URLSearchParams(window.location.search);
    return params.has('error');
  }

  /**
   * Obtém a mensagem de erro do callback
   */
  static getAuthError(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('error');
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
      url.searchParams.delete('scope');
      window.history.replaceState({}, document.title, url.toString());
    }
  }

  /**
   * Manipula o callback OAuth após redirecionamento
   * NOTA: O callback real é tratado pelo hook /google-oauth-callback
   * Este método é para limpar a URL no frontend
   */
  static handleCallback(): { success: boolean; error?: string } {
    if (this.hasAuthError()) {
      const error = this.getAuthError() || 'Erro desconhecido na autorização';
      return { success: false, error };
    }

    if (this.hasAuthCode()) {
      // O código foi processado pelo backend via /google-oauth-callback
      // Aqui apenas limpamos a URL
      this.clearUrlParams();
      return { success: true };
    }

    return { success: false, error: 'Sem código de autorização' };
  }
}

export default GoogleOAuthService;
