/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para renovar tokens Google OAuth usando refresh_token
 * Endpoint para renovação automática de tokens expirados
 */

routerAdd("POST", "/google-refresh-token", (c) => {
  const data = $apis.requestInfo(c).data
  const userId = data.user_id

  if (!userId) {
    return c.json(400, { "error": "User ID é obrigatório" })
  }

  try {
    // Buscar refresh_token do usuário
    const googleInfo = $app.findFirstRecordByFilter(
      "google_infos",
      "user_id = {:userId}",
      { userId: userId }
    )

    if (!googleInfo || !googleInfo.get("refresh_token")) {
      return c.json(404, { "error": "Refresh token não encontrado" })
    }

    const refreshToken = googleInfo.get("refresh_token")
    const clientId = $os.getenv("GOOGLE_CLIENT_ID") || "SEU_CLIENT_ID.apps.googleusercontent.com"
    const clientSecret = $os.getenv("GOOGLE_CLIENT_SECRET") || "SEU_CLIENT_SECRET"

    // Preparar dados para renovar token
    const refreshRequestBody = [
      `refresh_token=${encodeURIComponent(refreshToken)}`,
      `client_id=${encodeURIComponent(clientId)}`,
      `client_secret=${encodeURIComponent(clientSecret)}`,
      `grant_type=refresh_token`
    ].join('&')

    // Fazer requisição para renovar token
    const tokenResponse = $http.send({
      url: "https://oauth2.googleapis.com/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: refreshRequestBody
    })

    if (tokenResponse.statusCode !== 200) {
      console.log("Erro ao renovar token:", tokenResponse.json)
      return c.json(400, { "error": "Falha ao renovar token" })
    }

    const tokenData = tokenResponse.json
    const newAccessToken = tokenData.access_token
    const expiresIn = tokenData.expires_in

    // Atualizar access_token no banco
    googleInfo.set("access_token", newAccessToken)
    $app.dao().saveRecord(googleInfo)

    console.log("Token renovado para usuário:", userId)

    return c.json(200, {
      "success": true,
      "access_token": newAccessToken,
      "expires_in": expiresIn,
      "token_type": "Bearer"
    })

  } catch (error) {
    console.log("Erro ao renovar token:", error)
    return c.json(500, { "error": "Erro interno do servidor" })
  }
})