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
      return c.json(404, { "error": "Registro Google não encontrado" })
    }

    const sheetId = googleInfo.get("sheet_id")
    const accessToken = googleInfo.get("access_token")
    const refreshToken = googleInfo.get("refresh_token")

    if (!sheetId) {
      return c.json(400, { "error": "Nenhuma planilha configurada" })
    }

    if (!accessToken) {
      return c.json(400, { "error": "Token de acesso não encontrado" })
    }

    // Tentar limpar o conteúdo da planilha (a partir da linha 2 para preservar o cabeçalho)
    let currentAccessToken = accessToken

    // Função para tentar a requisição com renovação de token se necessário
    const clearWithTokenRefresh = (token) => {
      const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Lançamentos!A2:Z2000:clear`
      
      const clearResponse = $http.send({
        url: clearUrl,
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      return clearResponse
    }

    let clearResponse
    try {
      clearResponse = clearWithTokenRefresh(currentAccessToken)
    } catch (error) {
      // Se falhou, pode ser token expirado - tentar renovar
      if (error.toString().includes("401") && refreshToken) {
        console.log("Token expirado, tentando renovar...")
        
        const refreshResponse = $http.send({
          url: "https://oauth2.googleapis.com/token",
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${$os.getenv("GOOGLE_CLIENT_ID")}&client_secret=${$os.getenv("GOOGLE_CLIENT_SECRET")}`
        })

        if (refreshResponse.statusCode === 200) {
          const tokenData = refreshResponse.json
          currentAccessToken = tokenData.access_token
          
          // Atualizar access_token no banco
          googleInfo.set("access_token", currentAccessToken)
          $app.save(googleInfo)
          
          // Tentar novamente com o novo token
          clearResponse = clearWithTokenRefresh(currentAccessToken)
        } else {
          throw new Error("Erro ao renovar token de acesso")
        }
      } else {
        throw error
      }
    }

    if (clearResponse.statusCode >= 200 && clearResponse.statusCode < 300) {
      console.log(`Conteúdo da planilha ${sheetId} limpo com sucesso para usuário ${userId}`)
      
      return c.json(200, {
        "success": true,
        "message": "Conteúdo da planilha limpo com sucesso"
      })
    } else {
      console.log("Erro ao limpar planilha:", clearResponse.raw)
      return c.json(500, { "error": "Erro ao limpar conteúdo da planilha" })
    }

  } catch (error) {
    console.log("Erro ao limpar conteúdo da planilha:", error)
    return c.json(500, { "error": "Erro interno do servidor" })
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

    const missing = [];
    if (!googleInfo.get("access_token") || googleInfo.get("access_token").trim() === "") missing.push("access_token");
    if (!googleInfo.get("refresh_token") || googleInfo.get("refresh_token").trim() === "") missing.push("refresh_token");
    if (!googleInfo.get("sheet_id") || googleInfo.get("sheet_id").trim() === "") missing.push("sheet_id");
    if (!googleInfo.get("sheet_name") || googleInfo.get("sheet_name").trim() === "") missing.push("sheet_name");

    const validConfig = missing.length === 0;
    return c.json(200, { validConfig: validConfig, missing: missing });
  } catch (error) {
    console.log("Erro ao verificar configuração:", error);
    // Em caso de erro, considera configuração incompleta
    return c.json(200, { validConfig: false, missing: ["registro_nao_encontrado"] });
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

    // Limpa os campos da planilha
    googleInfo.set("sheet_id", "");
    googleInfo.set("sheet_name", "");

    $app.save(googleInfo);

    console.log(`Configuração de planilha desvinculada para o usuário ${userId}`);

    return c.json(200, {
      "success": true,
      "message": "Planilha desvinculada com sucesso."
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