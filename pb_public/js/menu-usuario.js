import { estaAutenticado, obterUsuarioAtual, realizarLogout } from './auth-service.js';

export function exibirMenuUsuario(menuElementId = 'menu-user') {
    const menuUser = document.getElementById(menuElementId);
    if (!menuUser) {
        console.error(`Elemento com ID "${menuElementId}" não encontrado.`);
        return;
    }

    if (estaAutenticado()) {
        const usuario = obterUsuarioAtual();
        menuUser.innerHTML = `
            <span class="pseudo button">${usuario.email}</span>
            <a href="/dashboard/index.html" class="button success">Dashboard</a>
            <a href="/dashboard/configuracao.html" class="button icon-cog">Configuração</a>
            <button class="button error" id="logoutBtn">Sair</button>
        `;

        // Adicionar evento de logout ao botão
        document.getElementById('logoutBtn').addEventListener('click', function () {
            realizarLogout();
            window.location.reload();
        });
    } else {
        // Usuário não logado: mostra botões de login e registro
        menuUser.innerHTML = `
            <a href="/login.html" class="button" id="loginBtn">Login</a>
            <a href="/registro.html" class="button" id="registerBtn">Registrar</a>
        `;
    }
}

/**
 * Inicializa o menu de usuário quando o DOM estiver pronto
 */
export function inicializarMenuUsuario() {
    document.addEventListener('DOMContentLoaded', function () {
        exibirMenuUsuario();
    });
}