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
 * IMPORTANTE: PB usa path-to-regexp — wildcard é `{*rest}`, NÃO `*`.
 *
 * Assets estáticos (`.js`, `.css`, `.svg`, etc) são passados adiante
 * via `c.next()` pro static file serving padrão do PB.
 */

const PWA_INDEX_PATH = 'pb_public/pwa/index.html';

const ASSET_EXTENSIONS = [
  '.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.ico',
  '.json', '.webmanifest', '.woff', '.woff2', '.ttf', '.map',
  '.gif', '.webp', '.txt', '.xml', '.zip', '.wasm'
];

function hasAssetExtension(path) {
  if (!path) return false;
  const lower = path.toLowerCase();
  const dotIdx = lower.lastIndexOf('.');
  if (dotIdx < 0) return false;
  const slashAfterDot = lower.indexOf('/', dotIdx);
  // Se tem '/' DEPOIS do último '.', não é extensão (ex: /foo.json/bar)
  if (slashAfterDot >= 0 && slashAfterDot > dotIdx) {
    return false;
  }
  const ext = lower.substring(dotIdx);
  return ASSET_EXTENSIONS.indexOf(ext) >= 0;
}

routerAdd('GET', '/pwa/{path...}', (c) => {
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
      console.log('[pwa-spa-fallback] PWA index.html não encontrado em', PWA_INDEX_PATH, '-', e && e.message);
      return c.next();
    }

    // Converte bytes -> string se necessário
    const body = typeof content === 'string'
      ? content
      : new TextDecoder('utf-8').decode(content);

    return c.string(200, body, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
  } catch (e) {
    console.log('[pwa-spa-fallback] EXCEÇÃO:', e && e.message, e && e.stack);
    return c.next();
  }
});
