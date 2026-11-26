/**
 * Helper compartilhado (CommonJS puro) — servir HTML com Cache-Control.
 *
 * POR QUE
 * O handler estático do PocketBase responde os arquivos de pb_public/ com
 * apenas `Last-Modified` (sem `Cache-Control` nem `ETag`). Sem Cache-Control
 * o browser aplica cache HEURÍSTICO (RFC 9111 §4.2.2: 10% da idade do
 * arquivo, teto de 24h) e continua servindo o HTML antigo — que aponta para
 * os bundles antigos (?v=) — por horas ou até dias.
 *
 * Era esse o motivo do "no celular o site não atualiza": mesmo com o
 * `?v=timestamp` correto no HTML, um HTML velho no cache mantém o app velho.
 *
 * COMO
 * Reusa o mesmo serving de arquivo do PocketBase, só que com
 * `Cache-Control: no-cache, must-revalidate` — o browser sempre revalida e
 * nunca usa uma cópia velha sem checar.
 *
 * ⚠️ NÃO registrar rota "catch-all" (ex.: `/{path}`) aqui: ela sombreia
 * rotas do próprio PocketBase. Foi o que quebrou o admin: `/_` (redirect do
 * PB para `/_/`) caía no catch-all e virava 404. Rotas literais não tem esse
 * problema.
 *
 * Os assets em /assets/* ficam no handler padrão do PB: a query
 * `?v=timestamp` no HTML já quebra o cache deles a cada build.
 */

const CACHE_CONTROL = 'no-cache, must-revalidate';

// __hooks = /app/pb_hooks/  ->  /app/pb_public
const PUBLIC_DIR = __hooks + '/../pb_public';

module.exports = {
  /**
   * serveFile: serve um arquivo do pb_public com no-cache.
   *
   * @param {*} c        core.RequestEvent
   * @param {string} relPath  caminho relativo dentro de pb_public
   *                          (ex.: 'login.html', 'dashboard/lancamentos.html')
   */
  serveFile: function (c, relPath) {
    // no JSVM do PB os métodos do ResponseWriter são minúsculos: header(), write()
    c.response.header().set('Cache-Control', CACHE_CONTROL);
    // fileFS usa o mesmo serving do PB (Content-Type, Last-Modified, ranges)
    // ⚠️ no JSVM do PB o binding é $os.dirFS (minúsculo), não $os.DirFS
    return c.fileFS($os.dirFS(PUBLIC_DIR), relPath);
  },

  /**
   * serveDir: serve uma subpasta do pb_public a partir do wildcard {path...}
   * da rota (mesmo mecanismo do $apis.static).
   *
   * @param {*} c            core.RequestEvent
   * @param {string} subDir  subpasta (ex.: '/dashboard')
   */
  serveDir: function (c, subDir) {
    c.response.header().set('Cache-Control', CACHE_CONTROL);
    return $apis.static(PUBLIC_DIR + subDir, false)(c);
  },
};
