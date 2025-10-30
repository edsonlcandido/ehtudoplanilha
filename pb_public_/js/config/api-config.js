class ApiConfig {
  constructor() {
    this.isDevEnvironment = this.checkIfDev();
    this.baseURL = this.getBaseURL();
    this.googleOAuth = this.getGoogleOAuthConfig();
  }

  checkIfDev() {
    // Verifica se está no Live Server
    return window.location.port === '5500' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname === 'localhost';
  }

  getBaseURL() {
    if (this.isDevEnvironment) {
      return 'http://localhost:8090';
    }
    // Em produção, usa a mesma origem
    return window.location.origin;
  }

  // Configurações do Google OAuth
  getGoogleOAuthConfig() {
    return {
      scopes: 'https://www.googleapis.com/auth/drive.file',
      responseType: 'code',
      accessType: 'offline',
      prompt: 'consent',
      endpoints: {
        authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
        token: 'https://oauth2.googleapis.com/token'
      },
      apiEndpoints: {
        envVariables: '/env-variables',
        oauthCallback: '/google-oauth-callback',
        refreshToken: '/google-refresh-token',
        checkRefreshToken: '/check-refresh-token',
        listSheets: '/list-google-sheets',
        saveSheetId: '/save-sheet-id',
        provisionSheet: '/provision-sheet',
        appendEntry: '/append-entry'
      }
    };
  }

  // Método helper para construir URLs
  buildUrl(endpoint) {
    return `${this.baseURL}${endpoint}`;
  }

  // Método helper para obter URL de endpoint OAuth
  getOAuthEndpoint(endpoint) {
    return this.buildUrl(this.googleOAuth.apiEndpoints[endpoint]);
  }
}

// Cria uma instância global
const apiConfig = new ApiConfig();

export default apiConfig;