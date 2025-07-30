/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para lidar com o redirecionamento do Google OAuth
 * Recebe o código de autorização e troca por tokens de acesso
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

// Endpoint to check if user has a refresh token
routerAdd("GET", "/check-refresh-token", (c) => {
  const authUser = c.auth;
  console.log("Auth User:", authUser);
  const userId = authUser.id;

  try {
    // Try to find existing google_info record for this user
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
    // Record not found or other error
    return c.json(200, {
      hasRefreshToken: false,
      userId: userId
    })
  }
}, $apis.requireAuth())

routerAdd("GET", "/google-oauth-callback", (c) => {
  const code = c.requestInfo().query["code"];
  const state = c.requestInfo().query["state"]; // pode conter o user_id
  const error = c.requestInfo().query["error"];

  // Verificar se houve erro na autorização
  if (error) {
    console.log("Erro na autorização Google:", error)
    return c.redirect(302, "/dashboard/configuracao.html?error=" + encodeURIComponent(error))
  }

  // Verificar se o código foi fornecido
  if (!code) {
    console.log("Código de autorização não fornecido")
    return c.redirect(302, "/dashboard/configuracao.html?error=" + encodeURIComponent("Código de autorização não fornecido"))
  }

  try {
    // Configurações OAuth (estas devem vir de variáveis de ambiente em produção)
    const clientId = $os.getenv("GOOGLE_CLIENT_ID") || "SEU_CLIENT_ID.apps.googleusercontent.com"
    const clientSecret = $os.getenv("GOOGLE_CLIENT_SECRET") || "SEU_CLIENT_SECRET"
    const redirectUri = $os.getenv("GOOGLE_REDIRECT_URI") || "http://localhost:8090/google-oauth-callback"

    console.log("Iniciando troca de código por tokens...")
    console.log("Código recebido:", code);
    console.log("Client ID:", clientId);
    console.log("Client Secret:", clientSecret);
    console.log("Redirect URI:", redirectUri);  

    // Preparar dados para trocar código por tokens
    const tokenRequestBody = [
      `code=${encodeURIComponent(code)}`,
      `client_id=${encodeURIComponent(clientId)}`,
      `client_secret=${encodeURIComponent(clientSecret)}`,
      `redirect_uri=${encodeURIComponent(redirectUri)}`,
      `grant_type=authorization_code`
    ].join('&')
    console.log("Dados da requisição de token:", tokenRequestBody);
    
    // Fazer requisição para o endpoint de token do Google
    const tokenResponse = $http.send({
      url: "https://oauth2.googleapis.com/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: tokenRequestBody
    })

    if (tokenResponse.statusCode !== 200) {
      console.log("Erro ao trocar código por tokens:", tokenResponse.json)
      return c.redirect(302, "/dashboard/configuracao.html?error=" + encodeURIComponent("Falha ao obter tokens do Google"))
    }

    const tokenData = tokenResponse.json

    // Extrair tokens da resposta
    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token
    const expiresIn = tokenData.expires_in
    const scope = tokenData.scope
    const tokenType = tokenData.token_type

    // Log para debug (remover em produção)
    console.log("Tokens recebidos do Google:")
    console.log("Access Token:", accessToken)
    console.log("Refresh Token:", refreshToken)
    console.log("Expires In:", expiresIn)
    console.log("Scope:", scope)

    // Obter o usuário atual (assumindo que o state contém o user_id ou usar autenticação)
    let userId = state
    console.log("userId:", userId)

    // Buscar ou criar registro na coleção google_infos
    const googleInfosCollection = $app.findCollectionByNameOrId("google_infos")

    // Tentar encontrar registro existente para este usuário
    let googleInfo
    try {
      googleInfo = $app.findFirstRecordByFilter(
        "google_infos",
        "user_id = {:userId}",
        { userId: userId }
      )
    } catch (e) {
      // Registro não encontrado, será criado novo
      googleInfo = null
    }

    if (googleInfo) {
      // Atualizar registro existente
      googleInfo.set("access_token", accessToken)
      if (refreshToken) {
        googleInfo.set("refresh_token", refreshToken)
      }
      $app.save(googleInfo)

      console.log("Tokens atualizados para usuário:", userId)
    } else {
      // Criar novo registro
      const newGoogleInfo = new Record(googleInfosCollection)
      newGoogleInfo.set("user_id", userId)
      newGoogleInfo.set("access_token", accessToken)
      if (refreshToken) {
        newGoogleInfo.set("refresh_token", refreshToken)
      }
      $app.save(newGoogleInfo)

      console.log("Novos tokens salvos para usuário:", userId)
    }

    // Após salvar os tokens, automaticamente provisionar a planilha template
    console.log("Tentando provisionar planilha template automaticamente...")
    
    try {
      // Verificar se já existe uma planilha configurada
      const existingSheetId = googleInfo ? googleInfo.get("sheet_id") : null;
      
      if (!existingSheetId || existingSheetId.trim() === "") {
        // Obter o ID do template das variáveis de ambiente
        const templateId = $os.getenv("SHEET_TEMPLATE_ID");
        
        if (templateId) {
          // Preparar o corpo da requisição para copiar a planilha
          const copyRequestBody = JSON.stringify({
            "name": `Controle Financeiro - ${new Date().toLocaleDateString('pt-BR')}`
          });

          // Fazer requisição para copiar a planilha template
          const copyResponse = $http.send({
            url: `https://www.googleapis.com/drive/v3/files/${templateId}/copy`,
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: copyRequestBody
          });

          if (copyResponse.statusCode === 200) {
            const copyData = copyResponse.json;
            const newSheetId = copyData.id;
            
            // Atualizar o registro com o ID da nova planilha
            if (googleInfo) {
              googleInfo.set("sheet_id", newSheetId);
              $app.save(googleInfo);
            } else {
              // Criar novo registro com sheet_id
              const newGoogleInfo = new Record(googleInfosCollection);
              newGoogleInfo.set("user_id", userId);
              newGoogleInfo.set("access_token", accessToken);
              if (refreshToken) {
                newGoogleInfo.set("refresh_token", refreshToken);
              }
              newGoogleInfo.set("sheet_id", newSheetId);
              $app.save(newGoogleInfo);
            }

            console.log(`Planilha template copiada automaticamente: ${newSheetId}`);
            
            const params = new URLSearchParams({
              success: "true",
              provision: "true", 
              sheet_name: copyData.name || `Controle Financeiro - ${new Date().toLocaleDateString('pt-BR')}`,
              message: "Autorização concluída e planilha template copiada com sucesso!"
            });
            return c.redirect(302, `/dashboard/configuracao.html?${params.toString()}`);
          } else {
            console.log("Erro ao copiar planilha template:", copyResponse.json);
          }
        } else {
          console.log("SHEET_TEMPLATE_ID não configurado");
        }
      }
      
      // Se chegou aqui, não foi possível copiar automaticamente ou já existe planilha
      return c.redirect(302, "/dashboard/configuracao.html?success=true&provision=false");
      
    } catch (provisionError) {
      console.log("Erro interno ao provisionar planilha:", provisionError);
      // Ainda redireciona com sucesso OAuth, mas sem provisionamento
      return c.redirect(302, "/dashboard/configuracao.html?success=true&provision=false");
    }

  } catch (error) {
    console.log("Erro interno no processamento OAuth:", error)
    return c.redirect(302, "/dashboard/configuracao.html?error=" + encodeURIComponent("Erro interno do servidor"))
  }
})


routerAdd("GET", "/v1/google-oauth-callback", (c) => {
  const code = c.queryParam("code")
  const state = c.queryParam("state") // pode conter o user_id
  const error = c.queryParam("error")

  // Verificar se houve erro na autorização
  if (error) {
    console.log("Erro na autorização Google:", error)
    return c.json(400, { "error": "Autorização negada pelo Google" })
  }

  // Verificar se o código foi fornecido
  if (!code) {
    console.log("Código de autorização não fornecido")
    return c.json(400, { "error": "Código de autorização não fornecido" })
  }

  try {
    // Configurações OAuth (estas devem vir de variáveis de ambiente em produção)
    const clientId = $os.getenv("GOOGLE_CLIENT_ID") || "SEU_CLIENT_ID.apps.googleusercontent.com"
    const clientSecret = $os.getenv("GOOGLE_CLIENT_SECRET") || "SEU_CLIENT_SECRET"
    const redirectUri = $os.getenv("GOOGLE_REDIRECT_URI") || "http://localhost:8090/google-oauth-callback"

    // Preparar dados para trocar código por tokens
    const tokenRequestBody = [
      `code=${encodeURIComponent(code)}`,
      `client_id=${encodeURIComponent(clientId)}`,
      `client_secret=${encodeURIComponent(clientSecret)}`,
      `redirect_uri=${encodeURIComponent(redirectUri)}`,
      `grant_type=authorization_code`
    ].join('&')

    // Fazer requisição para o endpoint de token do Google
    const tokenResponse = $http.send({
      url: "https://oauth2.googleapis.com/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: tokenRequestBody
    })

    if (tokenResponse.statusCode !== 200) {
      console.log("Erro ao trocar código por tokens:", tokenResponse.json)
      return c.json(400, { "error": "Falha ao obter tokens do Google" })
    }

    const tokenData = tokenResponse.json

    // Extrair tokens da resposta
    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token
    const expiresIn = tokenData.expires_in
    const scope = tokenData.scope
    const tokenType = tokenData.token_type

    // Log para debug (remover em produção)
    console.log("Tokens recebidos do Google:")
    console.log("Access Token:", accessToken ? "✓" : "✗")
    console.log("Refresh Token:", refreshToken ? "✓" : "✗")
    console.log("Expires In:", expiresIn)
    console.log("Scope:", scope)

    // Obter o usuário atual (assumindo que o state contém o user_id ou usar autenticação)
    let userId = state

    // Se não temos userId no state, precisamos obter de outra forma
    if (!userId) {
      // Em um cenário real, você pode querer extrair o userId de um JWT ou sessão
      console.log("User ID não fornecido no state")
      return c.json(400, { "error": "Usuário não identificado" })
    }

    // Buscar ou criar registro na coleção google_infos
    const googleInfosCollection = $app.dao().findCollectionByNameOrId("google_infos")

    // Tentar encontrar registro existente para este usuário
    let googleInfo
    try {
      googleInfo = $app.dao().findFirstRecordByFilter(
        "google_infos",
        "user_id = {:userId}",
        { userId: userId }
      )
    } catch (e) {
      // Registro não encontrado, será criado novo
      googleInfo = null
    }

    if (googleInfo) {
      // Atualizar registro existente
      googleInfo.set("access_token", accessToken)
      if (refreshToken) {
        googleInfo.set("refresh_token", refreshToken)
      }
      $app.dao().saveRecord(googleInfo)

      console.log("Tokens atualizados para usuário:", userId)
    } else {
      // Criar novo registro
      const newGoogleInfo = new Record(googleInfosCollection)
      newGoogleInfo.set("user_id", userId)
      newGoogleInfo.set("access_token", accessToken)
      if (refreshToken) {
        newGoogleInfo.set("refresh_token", refreshToken)
      }
      $app.dao().saveRecord(newGoogleInfo)

      console.log("Novos tokens salvos para usuário:", userId)
    }

    // Resposta de sucesso - redirecionar para página de sucesso ou retornar JSON
    const response = {
      "success": true,
      "message": "Autorização Google concluída com sucesso",
      "data": {
        "access_token": accessToken ? "***" : null, // Mascarar token na resposta
        "expires_in": expiresIn,
        "scope": scope,
        "token_type": tokenType,
        "has_refresh_token": !!refreshToken
      }
    }

    return c.json(200, response)

  } catch (error) {
    console.log("Erro interno no processamento OAuth:", error)
    return c.json(500, { "error": "Erro interno do servidor" })
  }
})

// Hook adicional para renovar tokens usando refresh_token
routerAdd("POST", "/google-refresh-token", (c) => {
  const data = $apis.requestInfo(c).data
  const userId = data.user_id

  if (!userId) {
    return c.json(400, { "error": "User ID é obrigatório" })
  }

  try {
    // Buscar refresh_token do usuário
    const googleInfo = $app.dao().findFirstRecordByFilter(
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