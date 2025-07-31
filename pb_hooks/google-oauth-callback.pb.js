/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para lidar com o callback do Google OAuth
 * Recebe o código de autorização e troca por tokens de acesso
 */

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