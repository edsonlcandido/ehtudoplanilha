/**
 * Serviço de autenticação OAuth Google
 * Responsável por gerenciar o fluxo completo de autenticação
 */

import apiConfig from '../config/api-config.js';

class GoogleOAuthService {
    constructor() {
        this.pb = null;
        this.hasRefreshToken = false;
    }

    /**
     * Inicializa o serviço com instância do PocketBase
     * @param {PocketBase} pocketbaseInstance 
     */
    init(pocketbaseInstance) {
        this.pb = pocketbaseInstance;
    }

    /**
     * Verifica se o usuário possui refresh token válido
     * @returns {Promise<boolean>}
     */
    async checkRefreshTokenStatus() {
        if (!this.pb) {
            throw new Error('Serviço OAuth não inicializado');
        }

        try {
            const response = await fetch(`${this.pb.baseUrl}/check-refresh-token`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.pb.authStore.token}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Erro ao verificar status do token: ' + response.statusText);
            }

            const data = await response.json();
            this.hasRefreshToken = data.hasRefreshToken;
            
            console.log('Status do refresh token:', this.hasRefreshToken);
            return this.hasRefreshToken;
        } catch (error) {
            console.error('Erro ao verificar refresh token:', error);
            this.hasRefreshToken = false;
            return false;
        }
    }

    /**
     * Obtém as variáveis de ambiente do Google OAuth
     * @returns {Promise<Object>}
     */
    async getOAuthEnvironmentVariables() {
        if (!this.pb) {
            throw new Error('Serviço OAuth não inicializado');
        }

        const response = await fetch(`${this.pb.baseUrl}/env-variables`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.pb.authStore.token}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar variáveis do sistema: ' + response.statusText);
        }

        return await response.json();
    }

    /**
     * Inicia o fluxo de autorização OAuth do Google
     * @returns {Promise<void>}
     */
    async startOAuthFlow() {
        if (!this.pb) {
            throw new Error('Serviço OAuth não inicializado');
        }

        const userId = this.pb.authStore.model?.id || '';

        try {
            // Obter variáveis do sistema do backend
            const envData = await this.getOAuthEnvironmentVariables();
            
            // Construir URL do Google OAuth
            const clientId = envData.GOOGLE_CLIENT_ID;
            const redirectUri = envData.GOOGLE_REDIRECT_URI;
            const scope = 'https://www.googleapis.com/auth/drive.file';
            const state = userId; // Usado para identificar usuário após callback
            
            const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth` +
                `?client_id=${encodeURIComponent(clientId)}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&scope=${encodeURIComponent(scope)}` +
                `&response_type=code` +
                `&access_type=offline` +
                `&prompt=consent` +
                `&state=${encodeURIComponent(userId)}`;

            // Redirecionar para URL OAuth
            window.location.href = oauthUrl;
        } catch (error) {
            console.error('Erro ao iniciar OAuth:', error);
            throw error;
        }
    }

    /**
     * Renova o access token usando refresh token
     * @param {string} userId - ID do usuário
     * @returns {Promise<Object>}
     */
    async refreshAccessToken(userId) {
        if (!userId) {
            throw new Error('User ID é obrigatório');
        }

        try {
            const response = await fetch(`${this.pb.baseUrl}/google-refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id: userId })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Falha ao renovar token');
            }

            return data;
        } catch (error) {
            console.error('Erro ao renovar token:', error);
            throw error;
        }
    }

    /**
     * Verifica se o usuário está autenticado no OAuth
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.hasRefreshToken;
    }

    /**
     * Obtém ID do usuário atual
     * @returns {string|null}
     */
    getCurrentUserId() {
        return this.pb?.authStore.model?.id || null;
    }

    /**
     * Revoga o acesso Google (backend limpa tokens)
     * @returns {Promise<Object>}
     */
    async revokeAccess() {
        if (!this.pb) {
            throw new Error('Serviço OAuth não inicializado');
        }

        const response = await fetch(`${this.pb.baseUrl}/revoke-google-access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.pb.authStore.token}`
            },
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Falha ao revogar acesso Google');
        }
        this.hasRefreshToken = false;
        return data;
    }
}

// Exportar instância singleton
const googleOAuthService = new GoogleOAuthService();
export default googleOAuthService;