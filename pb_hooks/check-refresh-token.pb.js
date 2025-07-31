/// <reference path="../pb_data/types.d.ts" />

/**
 * Endpoint para verificar se o usuário possui um refresh token válido
 * Usado na página de configuração para mostrar o estado da autorização
 */
routerAdd("GET", "/check-refresh-token", (c) => {
  const authUser = c.auth;
  console.log("Auth User:", authUser);
  const userId = authUser.id;

  try {
    // Verificar se existe registro google_info para o usuário
    const googleInfo = $app.findFirstRecordByFilter(
      "google_infos",
      "user_id = {:userId}",
      { userId: userId }
    );

    const hasRefreshToken = googleInfo && 
                           googleInfo.get("refresh_token") && 
                           googleInfo.get("refresh_token").trim() !== "";

    return c.json(200, {
      hasRefreshToken: hasRefreshToken,
      userId: userId
    });
  } catch (e) {
    // Registro não encontrado ou outro erro
    return c.json(200, {
      hasRefreshToken: false,
      userId: userId
    });
  }
}, $apis.requireAuth())