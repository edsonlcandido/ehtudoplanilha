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
 * Reusa o MESMO handler estático do PocketBase ($apis.static), só que com
 * `Cache-Control: no-cache, must-revalidate` — o browser sempre revalida e
 * nunca usa uma cópia velha sem checar.
 *
 * ⚠️ O $apis.static do PB resolve o arquivo pelo PARÂMETRO {path...} da rota
 * (não pela URL), então a rota precisa ter o wildcard — e o root do FS
 * precisa ser a pasta à qual o wildcard é relativo.
 *
 * Os assets em /assets/* ficam no handler padrão do PB: a query
 * `?v=timestamp` no HTML já quebra o cache deles a cada build.
 */

const CACHE_CONTROL = 'no-cache, must-revalidate';

module.exports = {
  /**
   * serve: serve um arquivo do pb_public com no-cache.
   * @param {*} c              core.RequestEvent
   * @param {string} subDir    subpasta do pb_public (ex.: '/dashboard')
   * @param {boolean} indexFallback  true = cai no index.html da raiz
   */
  serve: function (c, subDir, indexFallback) {
    // no JSVM do PB os métodos do ResponseWriter são minúsculos: header(), write()
    c.response.header().set('Cache-Control', CACHE_CONTROL);
    // __hooks = /app/pb_hooks/  ->  /app/pb_public
    return $apis.static(__hooks + '/../pb_public' + subDir, indexFallback)(c);
  },
};
