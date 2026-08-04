/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: SPA fallback para o PWA
 *
 * O PocketBase tem um fallback padrão que serve `pb_public/index.html`
 * (raiz do frontend principal) pra qualquer path não encontrado. Isso
 * quebra o PWA em URLs tipo `/pwa/login` (que mostra a landing page
 * do site em vez do shell do PWA).
 *
 * Este hook intercepta GETs em `/pwa/*` que NÃO são assets estáticos
 * (sem extensão) e serve o conteúdo de `pb_public/pwa/index.html`,
 * preservando a URL original (com query params) no navegador. Assim o
 * Vue Router recebe o pathname correto (`/pwa/login`) e o LoginPage
 * consegue ler o `code` e `state` do callback OAuth.
 *
 * Assets estáticos (`.js`, `.css`, `.svg`, etc) são passados adiante
 * via `c.next()` pro static file serving padrão do PB.
 */

const PWA_INDEX_PATH = 'pb_public/pwa/index.html';

const ASSET_EXTENSIONS = [
  '.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.ico',
  '.json', '.webmanifest', '.woff', '.woff2', '.ttf', '.map',
  '.png', '.gif', '.webp', '.txt', '.xml'
];

function hasAssetExtension(path) {
  const lower = path.toLowerCase();
  // Pega o último '.' do path; se for uma das extensões conhecidas, é asset
  const dotIdx = lower.lastIndexOf('.');
  if (dotIdx < 0) return false;
  // Se tem '/' depois do último '.', não é extensão
  const slashAfterDot = lower.indexOf('/', dotIdx);
  if (slashAfterDot >= 0 && slashAfterDot < lower.length - 1) {
    // Pode ter extensão ainda (e.g. /foo.json/bar), mas é raro
    // Tratar como não-asset nesse caso
    return false;
  }
  const ext = lower.substring(dotIdx);
  return ASSET_EXTENSIONS.indexOf(ext) >= 0;
}

routerAdd('GET', '/pwa/*', (c) => {
  try {
    const path = (c.requestInfo && c.requestInfo().path) || '';

    // Asset estático: passa pro static file serving do PB
    if (hasAssetExtension(path)) {
      return c.next();
    }

    // HTML navigation (rota SPA): serve o index.html do PWA
    let content;
    try {
      content = $filesystem.readFile(PWA_INDEX_PATH);
    } catch (e) {
      // PWA index.html não existe no filesystem — passa pro próximo
      console.log('[pwa-spa-fallback] PWA index.html não encontrado em', PWA_INDEX_PATH);
      return c.next();
    }

    // Conteúdo como string; goja aceita string direto
    const body = typeof content === 'string' ? content : new TextDecoder().decode(content);

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (e) {
    console.log('[pwa-spa-fallback] Erro:', e && e.message);
    return c.next();
  }
});
