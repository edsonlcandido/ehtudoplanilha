/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para editar uma entrada específica na planilha do usuário
 * Endpoint: PUT /edit-sheet-entry
 * Edita uma linha específica na aba "Lançamentos" da planilha
 * Body: { rowIndex: number, data?: string, conta?: string, valor: number, descricao?: string, categoria: string, orcamento: string, obs?: string }
 * Campos obrigatórios: rowIndex, valor, categoria, orcamento
 */

routerAdd("PUT", "/edit-sheet-entry", (c) => {
    const auth = c.auth;
    if (!auth || !auth.id) {
        return c.json(401, { "error": "Usuário não autenticado" });
    }

    const userId = auth.id;
    const requestData = c.requestInfo().body;
    
    // Validação básica dos dados - apenas valor, categoria e orçamento são obrigatórios
    if (requestData.rowIndex === undefined || requestData.rowIndex === null) {
        return c.json(400, { "error": "rowIndex é obrigatório" });
    }
    if (!Number.isInteger(requestData.rowIndex) || requestData.rowIndex < 2) {
        return c.json(400, { "error": "rowIndex deve ser inteiro >= 2" });
    }
    if (requestData.valor === undefined || requestData.valor === null) {
        return c.json(400, { "error": "Campo valor é obrigatório" });
    }
    if (!requestData.categoria || requestData.categoria.trim() === '') {
        return c.json(400, { "error": "Campo categoria é obrigatório" });
    }
    if (!requestData.orcamento || requestData.orcamento === '') {
        return c.json(400, { "error": "Campo orçamento (data-chave) é obrigatório" });
    }

    try {
        // Buscar informações do Google para o usuário
        const googleInfo = $app.findFirstRecordByFilter(
            "google_infos",
            "user_id = {:userId}",
            { userId: userId }
        );

        if (!googleInfo) {
            return c.json(404, { "error": "Informações do Google não encontradas. Execute a autorização OAuth." });
        }

        const sheetId = googleInfo.get("sheet_id");
        const accessToken = googleInfo.get("access_token");
        const refreshToken = googleInfo.get("refresh_token");

        if (!sheetId) {
            return c.json(400, { "error": "Nenhuma planilha configurada" });
        }

        if (!accessToken) {
            return c.json(400, { "error": "Token de acesso não encontrado" });
        }


        // Preparar os valores para atualização
        const values = [[
            requestData.data || "",
            requestData.conta || "",
            requestData.valor ?? 0,
            requestData.descricao || "",
            requestData.categoria || "",
            requestData.orcamento || "",
            requestData.obs || ""
        ]];

        // Função para tentar atualizar com refresh de token se necessário
        const updateWithTokenRefresh = (token) => {
            // Atualizar linha específica na planilha (rowIndex é a linha real na planilha)
            const range = `Lançamentos!A${requestData.rowIndex}:G${requestData.rowIndex}`;
            return $http.send({
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=USER_ENTERED`,
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    values: values
                })
            });
        };

        // Tenta atualizar com token atual
        let updateResponse = updateWithTokenRefresh(accessToken);

        // Se token expirado, tenta renovar
        if (updateResponse.statusCode === 401) {
            console.log("Token expirado, tentando renovar...");
            
            if (!refreshToken) {
                return c.json(401, { "error": "Token expirado e refresh token não disponível" });
            }

            // Renovar token
            const refreshResponse = $http.send({
                url: "https://oauth2.googleapis.com/token",
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${$os.getenv("GOOGLE_CLIENT_ID")}&client_secret=${$os.getenv("GOOGLE_CLIENT_SECRET")}`
            });

            if (refreshResponse.statusCode === 200) {
                const tokenData = refreshResponse.json;
                const newAccessToken = tokenData.access_token;
                
                // Atualizar token no banco
                googleInfo.set("access_token", newAccessToken);
                $app.save(googleInfo);

                // Tentar novamente com novo token
                updateResponse = updateWithTokenRefresh(newAccessToken);
            } else {
                return c.json(401, { "error": "Falha ao renovar token de acesso" });
            }
        }

        if (updateResponse.statusCode >= 200 && updateResponse.statusCode < 300) {
            return c.json(200, {
                success: true,
                message: "Lançamento editado com sucesso na planilha",
                rowIndex: requestData.rowIndex,
                updated: {
                    data: requestData.data || "",
                    conta: requestData.conta || "",
                    valor: requestData.valor,
                    descricao: requestData.descricao || "",
                    categoria: requestData.categoria,
                    orcamento: requestData.orcamento,
                    obs: requestData.obs || ""
                }
            });
        } else {
            console.log("Erro ao editar entrada na planilha:", updateResponse.raw);
            return c.json(500, { "error": "Erro ao editar entrada na planilha" });
        }
    } catch (error) {
        console.log("Erro interno ao editar entrada:", error);
        return c.json(500, { "error": "Erro interno do servidor" });
    }
}, $apis.requireAuth());