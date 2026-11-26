/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: Cache-Control correto nos HTMLs do site.
 *
 * POR QUE EXISTE
 * O handler estático do PocketBase responde os arquivos de pb_public/ com
 * apenas `Last-Modified` (sem `Cache-Control` nem `ETag`). Sem Cache-Control
 * o browser aplica cache HEURÍSTICO (RFC 9111 §4.2.2: 10% da idade do
 * arquivo, teto de 24h) e continua servindo o HTML antigo — que aponta para
 * os bundles antigos (?v=) — por horas ou até dias.
 *
 * Era esse o motivo do "no celular o site não atualiza": mesmo com o
 * `?v=timestamp` correto no HTML, um HTML velho no cache mantém o app velho.
 *
 * O QUE FAZ
 * Registra as rotas de HTML do site com `Cache-Control: no-cache,
 * must-revalidate`, usando o mesmo serving de arquivo do PocketBase.
 *
 * Os assets em /assets/* continuam no handler padrão do PB: a query
 * `?v=timestamp` no HTML já quebra o cache deles a cada build.
 *
 * ⚠️ REGRA DO JSVM: dentro do handler não dá pra usar variável de topo do
 * arquivo (escopo isolado) — só literais e o que vier do require() feito
 * DENTRO do handler.
 *
 * ⚠️ NÃO usar rota catch-all (ex.: `/{path}`) aqui: ela sombreia as rotas do
 * próprio PocketBase. Foi o que quebrou o admin do PB: `/_` (que o PB
 * redireciona 307 para `/_/`) caía no catch-all e voltava 404.
 * Rotas literais não sombriam nada.
 */

// landing page (index.html da raiz). '{$}'' casa SÓ com "/" e não sombreia
// as demais rotas (ao contrário de "/", que é catch-all no Go ServeMux).
routerAdd('GET', '/{$}', (c) => {
  const html = require(`${__hooks}/_static-html-cache.js`);
  return html.serveFile(c, 'index.html');
});

// HTMLs da raiz do site (entry points do Vite — ver src/vite.config.ts).
// ROTA LITERAL = não sombreia nada do PocketBase.
routerAdd('GET', '/login.html', (c) => {
  const html = require(`${__hooks}/_static-html-cache.js`);
  return html.serveFile(c, 'login.html');
});

routerAdd('GET', '/registro.html', (c) => {
  const html = require(`${__hooks}/_static-html-cache.js`);
  return html.serveFile(c, 'registro.html');
});

routerAdd('GET', '/primeiros-passos.html', (c) => {
  const html = require(`${__hooks}/_static-html-cache.js`);
  return html.serveFile(c, 'primeiros-passos.html');
});

routerAdd('GET', '/prints.html', (c) => {
  const html = require(`${__hooks}/_static-html-cache.js`);
  return html.serveFile(c, 'prints.html');
});

routerAdd('GET', '/privacidade.html', (c) => {
  const html = require(`${__hooks}/_static-html-cache.js`);
  return html.serveFile(c, 'privacidade.html');
});

routerAdd('GET', '/termos.html', (c) => {
  const html = require(`${__hooks}/_static-html-cache.js`);
  return html.serveFile(c, 'termos.html');
});

// páginas do dashboard: subpasta, então o wildcard {path...} não colide com
// nenhuma rota do PB (/dashboard/ não existe lá).
// ⚠️ o $apis.static do PB resolve o arquivo pelo PARÂMETRO {path...} da rota
// (não pela URL) — por isso o root do FS é a subpasta.
routerAdd('GET', '/dashboard/{path...}', (c) => {
  const html = require(`${__hooks}/_static-html-cache.js`);
  return html.serveDir(c, '/dashboard');
});
