import{i as u,g as r,l as i}from"./auth.js";function o(){const e=document.getElementById("menu-user");if(!e){console.error("[UserMenu] Elemento #menu-user não encontrado no DOM");return}u()?d(e):a(e)}function d(e){const n=r();if(!n){a(e);return}e.classList.remove("user-menu--guest"),e.classList.add("user-menu--authenticated"),e.innerHTML=`
    <div class="user-menu__item">
      <span class="user-menu__email" title="${s(n.email)}">
        ${s(n.email)}
      </span>
    </div>
    
    <div class="user-menu__item">
      <a 
        href="/dashboard/index.html" 
        class="user-menu__button user-menu__button--primary user-menu__button--icon"
        id="dashboardBtn"
        title="Ir para Dashboard"
      >
        <span>🏠</span>
        <span>Dashboard</span>
      </a>
    </div>
    
    <div class="user-menu__item">
      <a 
        href="/dashboard/configuracao.html" 
        class="user-menu__button user-menu__button--secondary user-menu__button--icon"
        id="configBtn"
        title="Abrir Configuração"
      >
        <span>⚙️</span>
        <span>Config</span>
      </a>
    </div>
    
    <div class="user-menu__item">
      <button 
        type="button"
        class="user-menu__button user-menu__button--danger user-menu__button--icon"
        id="logoutBtn"
        title="Sair da aplicação"
        aria-label="Fazer logout"
      >
        <span>🚪</span>
        <span>Sair</span>
      </button>
    </div>
  `,c()}function a(e){e.classList.remove("user-menu--authenticated"),e.classList.add("user-menu--guest"),e.innerHTML=`
    <div class="user-menu__item">
      <a 
        href="/" 
        class="user-menu__button user-menu__button--secondary user-menu__button--icon"
        title="Voltar à página inicial"
      >
        <span>🏠</span>
        <span>Home</span>
      </a>
    </div>
    
    <div class="user-menu__item">
      <a 
        href="/login.html" 
        class="user-menu__button user-menu__button--primary user-menu__button--icon"
        id="loginBtn"
        title="Fazer login"
      >
        <span>🔑</span>
        <span>Login</span>
      </a>
    </div>
    
    <div class="user-menu__item">
      <a 
        href="/registro.html" 
        class="user-menu__button user-menu__button--secondary user-menu__button--icon"
        id="registerBtn"
        title="Criar nova conta"
      >
        <span>👤</span>
        <span>Registrar</span>
      </a>
    </div>
  `}function c(){const e=document.getElementById("logoutBtn");e&&e.addEventListener("click",l)}function l(e){if(e.preventDefault(),confirm("Deseja realmente sair? Você será desconectado.")){const t=e.target;t&&(t.disabled=!0,t.classList.add("is-loading"),t.textContent="🔄 Saindo..."),i()}}function s(e){const n=document.createElement("div");return n.textContent=e,n.innerHTML}function _(){o()}export{_ as i,o as r};
