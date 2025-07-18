class ApiConfig {
  constructor() {
    this.isDevEnvironment = this.checkIfDev();
    this.baseURL = this.getBaseURL();
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

  // Método helper para construir URLs
  buildUrl(endpoint) {
    return `${this.baseURL}${endpoint}`;
  }
}

// Cria uma instância global
const apiConfig = new ApiConfig();
