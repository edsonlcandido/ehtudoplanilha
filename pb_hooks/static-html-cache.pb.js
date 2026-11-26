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
 * Registra as rotas do site usando o MESMO handler estático do PocketBase
 * ($apis.static), só que com `Cache-Control: no-cache, must-revalidate`.
 *
 * Os assets em /assets/* continuam no handler padrão do PB: a query
 * `?v=timestamp` no HTML já quebra o cache deles a cada build.
 *
 * ⚠️ REGRA DO JSVM: dentro do handler não dá pra usar variável de topo do
 * arquivo (contexto isolado). Por isso o require() é feito DENTRO do
 * handler e o handler só passa literais.
 *
 * ⚠️ O $apis.static do PB resolve o arquivo pelo PARÂMETRO {path...} da rota,
 * então as rotas precisam ter wildcard e o root do FS precisa ser a pasta à
 * qual esse wildcard é relativo.
 */

// a raiz "/" — '{path}' não casa com "/" (exige 1 segmento), e "/$" seria
// catch-all. '{$}' casa SÓ com "/" e não sombreia as demais rotas.
routerAdd('GET', '/{$}', (c) => {
  const html = require(`${__hooks}/_static-html-cache.js`);
  return html.serve(c, '', false);
});

// arquivos de uma pasta só na raiz: /index.html, /login.html, /termos.html,
// /favicon.ico, etc. (o "/" cai no index.html)
routerAdd('GET', '/{path}', (c) => {
  const html = require(`${__hooks}/_static-html-cache.js`);
  return html.serve(c, '', false);
});

// páginas do dashboard (subpasta: /dashboard/lancamentos.html, ...)
routerAdd('GET', '/dashboard/{path...}', (c) => {
  const html = require(`${__hooks}/_static-html-cache.js`);
  return html.serve(c, '/dashboard', false);
});
