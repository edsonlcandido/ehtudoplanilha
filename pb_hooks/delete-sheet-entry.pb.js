/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para deletar uma entrada específica na planilha do usuário
 * Endpoint: DELETE /delete-sheet-entry
 * Remove uma linha específica na aba "Lançamentos" da planilha (limpa o conteúdo)
 * Body: { rowIndex: number }
 */

routerAdd("DELETE", "/delete-sheet-entry", (c) => {
    const auth = c.auth;
    if (!auth || !auth.id) {
        return c.json(401, { "error": "Usuário não autenticado" });
    }

    const userId = auth.id;
    const requestData = c.requestInfo().body;
    
    // Validação básica dos dados
    if (!requestData.rowIndex) {
        return c.json(400, { "error": "rowIndex é obrigatório" });
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

        // Função para tentar limpar linha com refresh de token se necessário
        const clearWithTokenRefresh = (token) => {
            // Limpar linha específica na planilha (rowIndex é a linha real na planilha)
            const range = `Lançamentos!A${requestData.rowIndex}:G${requestData.rowIndex}`;
            return $http.send({
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:clear`,
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        };

        // Tenta limpar com token atual
        let clearResponse = clearWithTokenRefresh(accessToken);

        // Se token expirado, tenta renovar
        if (clearResponse.statusCode === 401) {
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
                clearResponse = clearWithTokenRefresh(newAccessToken);
            } else {
                return c.json(401, { "error": "Falha ao renovar token de acesso" });
            }
        }

        if (clearResponse.statusCode >= 200 && clearResponse.statusCode < 300) {
            return c.json(200, {
                "success": true,
                "message": "Lançamento removido com sucesso da planilha"
            });
        } else {
            console.log("Erro ao deletar entrada na planilha:", clearResponse.raw);
            return c.json(500, { "error": "Erro ao deletar entrada da planilha" });
        }
    } catch (error) {
        console.log("Erro interno ao deletar entrada:", error);
        return c.json(500, { "error": "Erro interno do servidor" });
    }
}, $apis.requireAuth());