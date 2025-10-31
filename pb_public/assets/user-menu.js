import{i as r,g as s,l as u}from"./auth.js";function a(){const e=document.getElementById("menu-user");if(!e){console.error("[UserMenu] Elemento #menu-user não encontrado no DOM");return}r()?i(e):o(e)}function i(e){const n=s();if(!n){o(e);return}e.innerHTML=`
    <span class="pseudo button">${d(n.email)}</span>
    <a href="/dashboard/index.html" class="button success" id="dashboardBtn">Dashboard</a>
    <a href="/dashboard/configuracao.html" class="button" id="configBtn">Configuração</a>
    <button class="button error" id="logoutBtn">Sair</button>
  `;const t=document.getElementById("logoutBtn");t&&t.addEventListener("click",c)}function o(e){e.innerHTML=`
    <a href="/" class="pseudo button icon-picture">Home</a>
    <a href="login.html" class="button icon-puzzle" id="loginBtn">Login</a>
    <a href="registro.html" class="button icon-user" id="registerBtn">Registrar</a>
  `}function c(e){e.preventDefault(),confirm("Deseja realmente sair?")&&u()}function d(e){const n=document.createElement("div");return n.textContent=e,n.innerHTML}function f(){a()}export{f as i,a as r};
