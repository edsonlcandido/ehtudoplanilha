/**
 * Serviço de Autenticação OAuth para Login/Registro
 * 
 * Este serviço gerencia o fluxo OAuth2 manual (code exchange) para autenticação
 * de usuários via Google, sem depender de EventSource/SSE.
 * 
 * Fluxo:
 * 1. Obter URL OAuth pré-configurada do PocketBase
 * 2. Salvar state e codeVerifier no localStorage
 * 3. Redirecionar para Google OAuth
 * 4. Google redireciona de volta com code e state
 * 5. Validar state e trocar código por tokens
 * 6. Autenticar usuário no PocketBase
 */

import pb from '../pocketbase'

/**
 * Serviço de autenticação OAuth
 */
export class AuthOAuthService {
  /**
   * Inicia o fluxo de login com Google OAuth
   * Usa redirect direto sem EventSource/SSE
   */
  static async loginWithGoogle(): Promise<void> {
    try {
      console.log('[AuthOAuth] Iniciando login com Google OAuth...')

      // Obter URL OAuth e configurações do PocketBase
      const authMethods = await pb.collection('users').listAuthMethods()
      
      if (!authMethods.oauth2 || !authMethods.oauth2.providers) {
        throw new Error('OAuth2 não está configurado no PocketBase')
      }

      // Encontrar provider Google
      const googleProvider = authMethods.oauth2.providers.find(
        (p) => p.name === 'google'
      )

      if (!googleProvider) {
        throw new Error('Provider Google não encontrado. Configure OAuth no PocketBase Admin UI.')
      }

      console.log('[AuthOAuth] Provider Google encontrado:', googleProvider.name)

      // Salvar state e codeVerifier no localStorage para validação posterior
      localStorage.setItem('oauth_state', googleProvider.state)
      localStorage.setItem('oauth_code_verifier', googleProvider.codeVerifier)
      localStorage.setItem('oauth_provider', googleProvider.name)
      
      // Salvar caminho atual para retornar após o OAuth
      localStorage.setItem('oauth_return_path', window.location.pathname)

      // Construir URL de redirecionamento OAuth
      // Aponta diretamente para a página de login do PWA (não /api/oauth2-redirect)
      // Development: http://localhost:5173/pwa/login
      // Production: https://planilha.ehtudo.app/pwa/login
      const redirectUrl = `${window.location.origin}/pwa/login`
      
      // Construir URL OAuth completa com redirect_uri
      const authUrl = new URL(googleProvider.authURL)
      authUrl.searchParams.set('redirect_uri', redirectUrl)

      console.log('[AuthOAuth] Redirecionando para Google OAuth...')
      console.log('[AuthOAuth] Redirect URI:', redirectUrl)

      // Redirecionar para Google OAuth
      window.location.href = authUrl.toString()
    } catch (error: any) {
      console.error('[AuthOAuth] Erro ao iniciar login com Google:', error)
      throw new Error(error.message || 'Erro ao iniciar autenticação com Google')
    }
  }

  /**
   * Inicia o fluxo de registro com Google OAuth
   * Idêntico ao login - o PocketBase cria o usuário automaticamente se não existir
   */
  static async registerWithGoogle(): Promise<void> {
    // Registro é idêntico ao login - PocketBase cria usuário se não existir
    return this.loginWithGoogle()
  }

  /**
   * Verifica se a URL atual contém parâmetros de callback OAuth
   */
  static isOAuthCallback(): boolean {
    const params = new URLSearchParams(window.location.search)
    return params.has('code') && params.has('state')
  }

  /**
   * Processa o callback OAuth após redirecionamento do Google
   * Valida state, troca código por tokens e autentica usuário
   */
  static async handleOAuthCallback(): Promise<boolean> {
    if (!this.isOAuthCallback()) {
      return false
    }

    console.log('[AuthOAuth] Callback OAuth detectado, processando...')

    try {
      // Extrair parâmetros da URL
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      const error = params.get('error')
      const errorDescription = params.get('error_description')

      // Verificar se houve erro do Google
      if (error) {
        const errorMsg = errorDescription || error
        console.error('[AuthOAuth] Erro do Google OAuth:', errorMsg)
        throw new Error(`Erro do Google: ${errorMsg}`)
      }

      if (!code || !state) {
        throw new Error('Parâmetros OAuth inválidos')
      }

      console.log('[AuthOAuth] Code e state recebidos')

      // Recuperar dados salvos do localStorage
      const savedState = localStorage.getItem('oauth_state')
      const codeVerifier = localStorage.getItem('oauth_code_verifier')
      const provider = localStorage.getItem('oauth_provider') || 'google'

      // Validar state (proteção CSRF)
      if (state !== savedState) {
        throw new Error('State OAuth inválido. Possível ataque CSRF.')
      }

      if (!codeVerifier) {
        throw new Error('Code verifier não encontrado')
      }

      console.log('[AuthOAuth] State validado, trocando código por tokens...')

      // Construir URL de redirecionamento (deve ser a mesma usada na autorização)
      // Development: http://localhost:5173/pwa/login
      // Production: https://planilha.ehtudo.app/pwa/login
      const redirectUrl = `${window.location.origin}/pwa/login`

      // Trocar código por tokens e autenticar
      const authData = await pb.collection('users').authWithOAuth2Code(
        provider,
        code,
        codeVerifier,
        redirectUrl
      )

      console.log('[AuthOAuth] Autenticação bem-sucedida!')
      console.log('[AuthOAuth] Usuário:', authData.record.email)

      // Limpar localStorage
      localStorage.removeItem('oauth_state')
      localStorage.removeItem('oauth_code_verifier')
      localStorage.removeItem('oauth_provider')
      localStorage.removeItem('oauth_return_path')

      // Limpar parâmetros da URL
      const cleanUrl = `${window.location.origin}${window.location.pathname}`
      window.history.replaceState({}, document.title, cleanUrl)

      return true
    } catch (error: any) {
      console.error('[AuthOAuth] Erro ao processar callback OAuth:', error)

      // Limpar localStorage em caso de erro
      localStorage.removeItem('oauth_state')
      localStorage.removeItem('oauth_code_verifier')
      localStorage.removeItem('oauth_provider')
      localStorage.removeItem('oauth_return_path')

      // Extrair mensagem de erro
      let errorMsg = 'Erro ao autenticar com Google'
      if (error.message) {
        errorMsg = error.message
      } else if (error.data?.message) {
        errorMsg = error.data.message
      }

      // Limpar parâmetros da URL
      const cleanUrl = `${window.location.origin}${window.location.pathname}`
      window.history.replaceState({}, document.title, cleanUrl)

      throw new Error(errorMsg)
    }
  }

  /**
   * Verifica se há um usuário autenticado
   */
  static isAuthenticated(): boolean {
    return pb.authStore.isValid
  }

  /**
   * Obtém o usuário autenticado atual
   */
  static getCurrentUser() {
    return pb.authStore.record
  }

  /**
   * Faz logout do usuário atual
   */
  static logout(): void {
    pb.authStore.clear()
  }
}

export default AuthOAuthService
