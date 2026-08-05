/// <reference path="../pb_data/types.d.ts" />

/**
 * Endpoints auxiliares para integração Google
 * Contém endpoints de verificação e gerenciamento que não foram movidos para outros hooks
 */

// Endpoint para obter variáveis de ambiente do Google OAuth
// NOTA: sem requireAuth() — GOOGLE_CLIENT_ID e GOOGLE_REDIRECT_URI são
// informação pública (não-sensível). Exigir auth aqui quebra o fluxo
// quando o user loga via PWA e depois abre o dashboard legado, porque
// o legado tem instância `pb` separada e o `authStore.token` não
// necessariamente é sincronizado entre o PWA e o legado (storage keys
// podem diferir entre versões do SDK). O secret real (CLIENT_SECRET)
// continua SÓ no backend e nunca é exposto.
routerAdd("GET", "/env-variables", (c) => {
  return c.json(200, {
    GOOGLE_CLIENT_ID: $os.getenv("GOOGLE_CLIENT_ID"),
    GOOGLE_REDIRECT_URI: $os.getenv("GOOGLE_REDIRECT_URI")
    // CLIENT_SECRET é usado APENAS no backend
  })
})

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
  console.log("🚀 Endpoint /list-google-sheets chamado")
  
  const auth = c.auth
  const userId = auth?.id

  console.log("👤 User ID:", userId)

  if (!userId) {
    console.log("❌ Usuário não autenticado")
    return c.json(401, { "error": "Usuário não autenticado" })
  }

  try {
    // Buscar informações do Google para o usuário
    console.log("🔍 Buscando informações do Google para o usuário...")
    let googleInfo
    try {
      googleInfo = $app.findFirstRecordByFilter(
        "google_infos",
        "user_id = {:userId}",
        { userId: userId }
      )
      console.log("✅ Registro google_infos encontrado:", googleInfo.id)
    } catch (e) {
      console.log("❌ Registro google_infos não encontrado:", e)
      return c.json(404, { "error": "Usuário não autorizou acesso ao Google Drive" })
    }

    let accessToken = googleInfo.get("access_token")
    
    console.log("🔑 Access token existe:", accessToken ? "Sim" : "Não")
    console.log("🔑 Access token length:", accessToken ? accessToken.length : 0)
    
    if (!accessToken) {
      console.log("❌ Token de acesso não encontrado")
      return c.json(404, { "error": "Token de acesso não encontrado" })
    }

    // Tentar listar planilhas com o token atual (excluindo planilhas na lixeira)
    console.log("🔍 Tentando listar planilhas com token atual...")
    
    // Query corretamente escapada para o Google Drive API
    const query = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
    const encodedQuery = encodeURIComponent(query)
    const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodedQuery}&fields=files(id,name,modifiedTime,createdTime)&orderBy=modifiedTime%20desc`
    
    console.log("🔗 URL da requisição:", driveUrl)
    
    let driveResponse = $http.send({
      url: driveUrl,
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    })

    console.log("📊 Status da resposta do Google Drive:", driveResponse.statusCode)

    // Se token expirado, tentar renovar
    if (driveResponse.statusCode === 401) {
      console.log("⚠️ Token expirado (401), tentando renovar...")
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

      console.log("📊 Status da renovação do token:", tokenResponse.statusCode)

      if (tokenResponse.statusCode !== 200) {
        console.log("❌ Erro ao renovar token:", tokenResponse.json || tokenResponse.raw)
        return c.json(400, { "error": "Falha ao renovar token de acesso" })
      }

      // Atualizar token no banco
      const newTokenData = tokenResponse.json
      accessToken = newTokenData.access_token
      
      console.log("✅ Token renovado com sucesso")
      
      googleInfo.set("access_token", accessToken)
      $app.save(googleInfo)

      // Tentar novamente com o novo token
      console.log("🔄 Tentando listar planilhas novamente com token renovado...")
      driveResponse = $http.send({
        url: driveUrl,
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      })
    }

    console.log("📊 Status final da resposta:", driveResponse.statusCode)

    if (driveResponse.statusCode !== 200) {
      const errorBody = driveResponse.json || driveResponse.raw || 'Sem detalhes do erro'
      console.log("❌ Erro ao listar planilhas:", errorBody)
      console.log("❌ Status Code:", driveResponse.statusCode)
      console.log("❌ Headers:", driveResponse.headers)
      return c.json(400, { 
        "error": "Falha ao listar planilhas do Google Drive",
        "details": errorBody,
        "statusCode": driveResponse.statusCode
      })
    }

    const driveData = driveResponse.json
    console.log("✅ Planilhas listadas com sucesso:", driveData)
    
    const sheets = driveData.files || []
    console.log("📋 Total de planilhas encontradas:", sheets.length)

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
    console.log("❌ [CATCH] Erro ao listar planilhas:", error)
    console.log("❌ [CATCH] Tipo do erro:", typeof error)
    console.log("❌ [CATCH] Stack:", error?.stack || 'Sem stack trace')
    return c.json(500, { 
      "error": "Erro interno do servidor",
      "message": error?.message || String(error)
    })
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

    // Atualizar sheet_id e sheet_name
    googleInfo.set("sheet_id", sheetId)
    googleInfo.set("sheet_name", sheetName)
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

// Endpoint para obter informações da planilha atual do usuário
routerAdd("GET", "/get-current-sheet", (c) => {
  const auth = c.auth
  const userId = auth.id

  if (!userId) {
    return c.json(401, { "error": "Usuário não autenticado" })
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
      return c.json(200, {
        "success": true,
        "hasSheet": false,
        "message": "Nenhuma planilha configurada"
      })
    }

    const sheetId = googleInfo.get("sheet_id")
    const sheetName = googleInfo.get("sheet_name") || ""

    if (!sheetId) {
      return c.json(200, {
        "success": true,
        "hasSheet": false,
        "message": "Nenhuma planilha configurada"
      })
    }

    return c.json(200, {
      "success": true,
      "hasSheet": true,
      "sheet_id": sheetId,
      "sheet_name": sheetName
    })

  } catch (error) {
    console.log("Erro ao obter informações da planilha atual:", error)
    return c.json(500, { "error": "Erro interno do servidor" })
  }
}, $apis.requireAuth())

// Endpoint para limpar conteúdo da planilha
routerAdd("POST", "/clear-sheet-content", (c) => {
  try {
    const gsheets = require(`${__hooks}/_google-sheets-helper.js`)

    const auth = c.auth
    if (!auth || !auth.id) {
      return c.json(401, { "error": "Usuário não autenticado" })
    }

    const googleInfo = gsheets.getGoogleInfo(auth.id)
    if (!googleInfo) {
      return c.json(404, { "error": "Registro Google não encontrado" })
    }

    // PREMISSA DO PRODUTO: nome da aba hardcoded
    const sheetName = gsheets.SHEET_NAME_DEFAULT

    // Limpa da linha 2 em diante (preserva cabeçalho), colunas A:Z (folga)
    const url = gsheets.buildClearUrl(sheetName + '!A2:Z2000')

    const result = gsheets.callWithRefresh(googleInfo, {
      method: 'POST',
      url: url,
      body: undefined
    })

    if (!result.ok) {
      console.log(`[clear-sheet-content] Falha ao limpar:`, result.status, result.error)
      const status = result.status >= 400 && result.status < 600 ? result.status : 500
      return c.json(status, { "error": "Erro ao limpar conteúdo da planilha" })
    }

    console.log(`[clear-sheet-content] Conteúdo da planilha limpo para usuário ${auth.id}`)
    return c.json(200, {
      "success": true,
      "message": "Conteúdo da planilha limpo com sucesso"
    })
  } catch (e) {
    console.log(`[clear-sheet-content] EXCEÇÃO não tratada:`, e && e.message, e && e.stack)
    return c.json(500, { "error": "Erro interno do servidor", detail: e && e.message })
  }
}, $apis.requireAuth())

// Endpoint para verificar status de configuração completa
routerAdd("GET", "/config-status", (c) => {
  const authUser = c.auth;
  const userId = authUser?.id;
  if (!userId) {
    return c.json(401, { error: "Usuário não autenticado" });
  }

  try {
    const googleInfo = $app.findFirstRecordByFilter(
      "google_infos",
      "user_id = {:userId}",
      { userId }
    );

    const hasRefreshToken = googleInfo && 
                           googleInfo.get("refresh_token") && 
                           googleInfo.get("refresh_token").trim() !== "";
    
    const hasSheetId = googleInfo && 
                      googleInfo.get("sheet_id") && 
                      googleInfo.get("sheet_id").trim() !== "";
    
    const sheetId = hasSheetId ? googleInfo.get("sheet_id") : undefined;
    const sheetName = hasSheetId ? googleInfo.get("sheet_name") : undefined;

    console.log("📊 [config-status] Status do usuário:", {
      userId,
      hasRefreshToken,
      hasSheetId,
      sheetId: sheetId ? "✓" : "✗",
      sheetName: sheetName || "N/A"
    });

    return c.json(200, {
      hasRefreshToken,
      hasSheetId,
      sheetId,
      sheetName
    });
  } catch (error) {
    console.log("❌ [config-status] Erro ou registro não encontrado:", error);
    // Registro não encontrado - usuário ainda não autorizou
    return c.json(200, {
      hasRefreshToken: false,
      hasSheetId: false
    });
  }
}, $apis.requireAuth());

// Endpoint para desvincular a planilha atual do usuário
routerAdd("POST", "/delete-sheet-config", (c) => {
  const auth = c.auth;
  const userId = auth.id;

  if (!userId) {
    return c.json(401, { "error": "Usuário não autenticado" });
  }

  try {
    let googleInfo;
    try {
      googleInfo = $app.findFirstRecordByFilter(
        "google_infos",
        "user_id = {:userId}",
        { userId: userId }
      );
    } catch (e) {
      return c.json(404, { "error": "Configuração do Google não encontrada para este usuário." });
    }

    // Limpa campos relacionados à planilha
    googleInfo.set("sheet_id", null);
    googleInfo.set("sheet_name", null);

    // Campos opcionais existentes podem precisar ser resetados para evitar referências antigas
    try {
      if (typeof googleInfo.get("last_success_append_at") !== "undefined") {
        googleInfo.set("last_success_append_at", null);
      }
    } catch (_) {
      // Campo não existe no schema atual; ignora reset adicional
    }

    $app.save(googleInfo);

    console.log(`Configuração de planilha desvinculada para o usuário ${userId}`);

    return c.json(200, {
      "success": true,
      "message": "Planilha desvinculada com sucesso.",
      "sheet_id": null,
      "sheet_name": null
    });

  } catch (error) {
    console.log("Erro ao desvincular planilha:", error);
    return c.json(500, { "error": "Erro interno do servidor ao tentar desvincular a planilha." });
  }
}, $apis.requireAuth());

// Endpoint para revogar acesso Google (revoga tokens e limpa configuração)
routerAdd("POST", "/revoke-google-access", (c) => {
  const auth = c.auth;
  const userId = auth?.id;

  if (!userId) {
    return c.json(401, { error: "Usuário não autenticado" });
  }

  try {
    let googleInfo;
    try {
      googleInfo = $app.findFirstRecordByFilter(
        "google_infos",
        "user_id = {:userId}",
        { userId }
      );
    } catch (e) {
      return c.json(404, { error: "Não há tokens Google salvos para este usuário" });
    }

    const accessToken = googleInfo.get("access_token");
    const refreshToken = googleInfo.get("refresh_token");

    // Escolhe token a revogar (preferir refresh se existir)
    const tokenParaRevogar = refreshToken && refreshToken.trim() !== "" ? refreshToken : accessToken;

    if (tokenParaRevogar && tokenParaRevogar.trim() !== "") {
      const revokeResp = $http.send({
        url: "https://oauth2.googleapis.com/revoke",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `token=${encodeURIComponent(tokenParaRevogar)}`
      });

      // 200 = ok; 400 invalid_token também consideramos sucesso pois já está revogado
      if (![200,400].includes(revokeResp.statusCode)) {
        console.log("Falha ao revogar token:", revokeResp.raw);
        return c.json(500, { error: "Erro ao revogar token junto ao Google" });
      }
    }

    // Limpa todos os campos relacionados
    googleInfo.set("access_token", "");
    googleInfo.set("refresh_token", "");
    googleInfo.set("sheet_id", "");
    googleInfo.set("sheet_name", "");
    $app.save(googleInfo);

    console.log(`Tokens Google revogados para usuário ${userId}`);
    return c.json(200, { success: true, message: "Acesso Google revogado com sucesso" });
  } catch (error) {
    console.log("Erro ao revogar acesso Google:", error);
    return c.json(500, { error: "Erro interno ao revogar acesso" });
  }
}, $apis.requireAuth());