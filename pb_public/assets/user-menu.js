import{i as d,g as c,l}from"./auth.js";function m(){const e=document.getElementById("menu-user");if(!e){console.error("[UserMenu] Elemento #menu-user não encontrado no DOM");return}d()?_(e):r(e)}function _(e){const n=c();if(!n){r(e);return}e.classList.remove("user-menu--guest"),e.classList.add("user-menu--authenticated"),e.innerHTML=`
    <div class="user-menu__item">
      <span class="user-menu__email" title="${i(n.email)}">
        ${i(n.email)}
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
  `,g()}function r(e){e.classList.remove("user-menu--authenticated"),e.classList.add("user-menu--guest"),e.innerHTML=`
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
  `}function g(){const e=document.getElementById("logoutBtn");e&&e.addEventListener("click",b);const n=document.getElementById("closeLogoutModal"),u=document.getElementById("cancelLogoutBtn"),a=document.getElementById("confirmLogoutBtn"),t=document.getElementById("logoutModal");n&&n.addEventListener("click",s),u&&u.addEventListener("click",s),a&&a.addEventListener("click",f),t&&t.addEventListener("click",o=>{o.target===t&&s()}),document.addEventListener("keydown",o=>{o.key==="Escape"&&(t==null?void 0:t.style.display)==="flex"&&s()})}function p(){const e=document.getElementById("logoutModal");e&&(e.style.display="flex")}function s(){const e=document.getElementById("logoutModal");e&&(e.style.display="none")}function f(){s();const e=document.getElementById("logoutBtn");e&&(e.disabled=!0,e.classList.add("is-loading"),e.textContent="🔄 Saindo..."),l()}function b(e){e.preventDefault(),p()}function i(e){const n=document.createElement("div");return n.textContent=e,n.innerHTML}function L(){m()}export{L as i,m as r};
