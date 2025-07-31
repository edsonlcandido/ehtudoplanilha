import {estaAutenticado} from './auth-service.js';
import {inicializarMenuUsuario} from './menu-usuario.js';

export function protegerPagina(){
    if (!estaAutenticado()) {
        // Calcular caminho relativo para login
        const pathDepth = window.location.pathname
            .split('/')
            .filter(p => p && p !== 'dashboard').length;
        
        const loginPath = '../'.repeat(Math.max(1, pathDepth)) + 'login.html';
        
        // Redirecionar para login
        console.log(`Redirecionando para ${loginPath}`);
        window.location.href = loginPath;
        return false;
    }
}

export function inicializarDashboard() {
    if (!protegerPagina()) {
        return; // Para execução se redirecionou
    }

    // Renderizar menu de usuário
    document.addEventListener('DOMContentLoaded', function() {
        inicializarMenuUsuario();
    });
}

inicializarDashboard();