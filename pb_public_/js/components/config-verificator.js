/**
 * Componente para verificação de configuração da planilha do Google Sheets
 * Verifica se o usuário já configurou sua integração e exibe botão quando necessário
 * @author Eh!Tudo.app
 */

import apiConfig from '../config/api-config.js';

class ConfigVerificator {
    /**
     * Cria uma nova instância do verificador de configuração
     * @param {Object} options - Opções de configuração
     * @param {string} options.configBtnId - ID do botão de configuração
     * @param {Function} options.onConfigValid - Callback para quando a configuração é válida
     * @param {Function} options.onConfigInvalid - Callback para quando a configuração é inválida
     */
    constructor(options = {}) {
        this.options = {
            configBtnId: 'configBtn',
            onConfigValid: null,
            onConfigInvalid: null,
            ...options
        };
        
        this.configBtn = document.getElementById(this.options.configBtnId);
        this.isVerifying = false;
    }

    /**
     * Inicializa o componente
     * @returns {ConfigVerificator} A instância atual para encadeamento
     */
    init() {
        if (!this.configBtn) {
            console.warn('Botão de configuração não encontrado:', this.options.configBtnId);
            return this;
        }
        return this;
    }

    /**
     * Verifica o status da configuração da planilha
     * @param {Object} pb - Instância do PocketBase
     * @returns {Promise<Object>} Resultado da verificação: {validConfig, data}
     */
    async verificarConfiguracao(pb) {
        if (this.isVerifying) return null;
        
        this.isVerifying = true;
        
        try {
            console.log('Verificando status de configuração...');
            
            const response = await fetch(`${apiConfig.getBaseURL()}/config-status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Erro na requisição de configuração');
            }
            
            const data = await response.json();
            console.log('Dados de configuração:', data);
            
            // Exibe botão se configuração inválida ou campos faltando
            if (!data.validConfig) {
                console.log('Configuração incompleta, campos faltando:', data.missing);
                this.configBtn.style.display = '';
                
                // Callback para configuração inválida
                if (typeof this.options.onConfigInvalid === 'function') {
                    this.options.onConfigInvalid(data);
                }
                
                return { validConfig: false, data };
            } else {
                console.log('Configuração OK');
                
                // Callback para configuração válida
                if (typeof this.options.onConfigValid === 'function') {
                    this.options.onConfigValid(data);
                }
                
                return { validConfig: true, data };
            }
        } catch (error) {
            console.error('Erro ao verificar configuração do Google:', error);
            this.configBtn.style.display = '';
            
            // Callback para configuração inválida (erro)
            if (typeof this.options.onConfigInvalid === 'function') {
                this.options.onConfigInvalid({ error: error.message });
            }
            
            return { validConfig: false, error: error.message };
        } finally {
            this.isVerifying = false;
        }
    }
}

export default ConfigVerificator;