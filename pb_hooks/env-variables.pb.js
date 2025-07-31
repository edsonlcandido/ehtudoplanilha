/// <reference path="../pb_data/types.d.ts" />

/**
 * Endpoint para obter variáveis de ambiente necessárias para o frontend
 * Usado na página de configuração para iniciar o fluxo OAuth
 */
routerAdd("GET", "/env-variables", (c) => {
  const authUser = c.auth;
  console.log("Auth User:", authUser.id);
  return c.json(200, {
    GOOGLE_CLIENT_ID: $os.getenv("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: $os.getenv("GOOGLE_CLIENT_SECRET"),
    GOOGLE_REDIRECT_URI: $os.getenv("GOOGLE_REDIRECT_URI")
  })
}, $apis.requireAuth())