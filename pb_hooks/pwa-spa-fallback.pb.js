/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: SPA fallback para o PWA
 *
 * Serve o PWA em /pwa/* usando $apis.static com indexFallback=true.
 * Quando o user acessa /pwa/login (rota SPA sem arquivo correspondente),
 * o PB faz fallback pro index.html do PWA. Vue Router processa o path
 * e renderiza o LoginPage, que lê code+state do OAuth callback.
 *
 * Sintaxe do path usa Go ServeMux (não path-to-regexp): {path...} = catch-all.
 */

// __hooks = /app/pb_hooks/, então /app/pb_hooks/../pb_public/pwa = /app/pb_public/pwa
const PWA_DIR = __hooks + '/../pb_public/pwa';

routerAdd('GET', '/pwa/{path...}', $apis.static(PWA_DIR, true));
