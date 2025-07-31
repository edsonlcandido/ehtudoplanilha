/// <reference path="../pb_data/types.d.ts" />

/**
 * Endpoint para listar planilhas disponíveis no Google Drive do usuário
 * Usado na página de configuração para seleção de planilha
 */
routerAdd("GET", "/list-google-sheets", (c) => {
  const auth = c.auth
  const userId = auth?.id

  if (!userId) {
    return c.json(401, { "error": "Usuário não autenticado" })
  }

  try {
    // Buscar informações do Google para o usuário
    let googleInfo
    try {
      googleInfo = $app.findFirstRecordByFilter(
        "google_infos",
        "user_id = {:userId}",
        { userId: userId }
      )
    } catch (e) {
      return c.json(404, { "error": "Usuário não autorizou acesso ao Google Drive" })
    }

    let accessToken = googleInfo.get("access_token")
    
    if (!accessToken) {
      return c.json(404, { "error": "Token de acesso não encontrado" })
    }

    // Tentar listar planilhas com o token atual
    let driveResponse = $http.send({
      url: "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id,name,modifiedTime,createdTime)&orderBy=modifiedTime%20desc",
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    })

    // Se token expirado, tentar renovar
    if (driveResponse.statusCode === 401) {
      const refreshToken = googleInfo.get("refresh_token")
      
      if (!refreshToken) {
        return c.json(401, { "error": "Token expirado e refresh token não disponível" })
      }

      // Renovar token
      const clientId = $os.getenv("GOOGLE_CLIENT_ID")
      const clientSecret = $os.getenv("GOOGLE_CLIENT_SECRET")

      const refreshRequestBody = [
        `refresh_token=${encodeURIComponent(refreshToken)}`,
        `client_id=${encodeURIComponent(clientId)}`,
        `client_secret=${encodeURIComponent(clientSecret)}`,
        `grant_type=refresh_token`
      ].join('&')

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
        return c.json(400, { "error": "Falha ao renovar token de acesso" })
      }

      // Atualizar token no banco
      const newTokenData = tokenResponse.json
      accessToken = newTokenData.access_token
      googleInfo.set("access_token", accessToken)
      $app.save(googleInfo)

      // Tentar novamente com o novo token
      driveResponse = $http.send({
        url: "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id,name,modifiedTime,createdTime)&orderBy=modifiedTime%20desc",
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      })
    }

    if (driveResponse.statusCode !== 200) {
      console.log("Erro ao listar planilhas:", driveResponse.json)
      return c.json(400, { "error": "Falha ao listar planilhas do Google Drive" })
    }

    const driveData = driveResponse.json
    const sheets = driveData.files || []

    return c.json(200, {
      "success": true,
      "sheets": sheets.map(sheet => ({
        id: sheet.id,
        name: sheet.name,
        createdTime: sheet.createdTime,
        modifiedTime: sheet.modifiedTime
      }))
    })

  } catch (error) {
    console.log("Erro ao listar planilhas:", error)
    return c.json(500, { "error": "Erro interno do servidor" })
  }
}, $apis.requireAuth())