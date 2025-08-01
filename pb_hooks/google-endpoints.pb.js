/// <reference path="../pb_data/types.d.ts" />

/**
 * Endpoints auxiliares para integração Google
 * Contém endpoints de verificação e gerenciamento que não foram movidos para outros hooks
 */

// Endpoint para obter variáveis de ambiente do Google OAuth
routerAdd("GET", "/env-variables", (c) => {
  const authUser = c.auth;
  console.log("Auth User:", authUser.id);
  return c.json(200, {
    GOOGLE_CLIENT_ID: $os.getenv("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: $os.getenv("GOOGLE_CLIENT_SECRET"),
    GOOGLE_REDIRECT_URI: $os.getenv("GOOGLE_REDIRECT_URI")
  })
}, $apis.requireAuth())

// Endpoint para verificar se usuário possui refresh token
routerAdd("GET", "/check-refresh-token", (c) => {
  const authUser = c.auth;
  console.log("Auth User:", authUser);
  const userId = authUser.id;

  try {
    // Tentar encontrar registro google_info existente para este usuário
    const googleInfo = $app.findFirstRecordByFilter(
      "google_infos",
      "user_id = {:userId}",
      { userId: userId }
    )

    const hasRefreshToken = googleInfo && googleInfo.get("refresh_token") && googleInfo.get("refresh_token").trim() !== "";

    return c.json(200, {
      hasRefreshToken: hasRefreshToken,
      userId: userId
    })
  } catch (e) {
    // Registro não encontrado ou outro erro
    return c.json(200, {
      hasRefreshToken: false,
      userId: userId
    })
  }
}, $apis.requireAuth())

// Endpoint para listar planilhas Google Sheets do usuário
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

// Endpoint para salvar sheet_id selecionado
routerAdd("POST", "/save-sheet-id", (c) => {
  const auth = c.auth
  const userId = auth.id
  const data = c.requestInfo().body
  console.log("Dados recebidos:", data)
  if (!userId) {
    return c.json(401, { "error": "Usuário não autenticado" })
  }

  const sheetId = data.sheet_id
  const sheetName = data.sheet_name || ""

  if (!sheetId) {
    return c.json(400, { "error": "sheet_id é obrigatório" })
  }

  try {
    // Buscar registro do usuário
    let googleInfo
    try {
      googleInfo = $app.findFirstRecordByFilter(
        "google_infos",
        "user_id = {:userId}",
        { userId: userId }
      )
    } catch (e) {
      return c.json(404, { "error": "Registro Google não encontrado" })
    }

    // Atualizar sheet_id
    googleInfo.set("sheet_id", sheetId)
    $app.save(googleInfo)

    console.log(`Sheet ID atualizado para usuário ${userId}: ${sheetId} (${sheetName})`)

    return c.json(200, {
      "success": true,
      "message": "Planilha selecionada com sucesso",
      "sheet_id": sheetId,
      "sheet_name": sheetName
    })

  } catch (error) {
    console.log("Erro ao salvar sheet_id:", error)
    return c.json(500, { "error": "Erro interno do servidor" })
  }
}, $apis.requireAuth())