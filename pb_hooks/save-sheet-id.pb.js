/// <reference path="../pb_data/types.d.ts" />

/**
 * Endpoint para salvar sheet_id selecionado pelo usuário
 * Usado na página de configuração quando um usuário seleciona uma planilha
 */
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