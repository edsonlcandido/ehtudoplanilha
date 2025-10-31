/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para adicionar entradas na planilha do usuário
 * Endpoint: POST /append-entry
 * Insere uma nova linha na aba "Lançamentos" da planilha do usuário
 * Formato esperado: data, conta, valor, descrição, categoria, orçamento, observação
 */

routerAdd("POST", "/append-entry", (c) => {
    const auth = c.auth;
    if (!auth || !auth.id) {
        return c.json(401, { "error": "Usuário não autenticado" });
    }

    const userId = auth.id;
    const requestData = c.requestInfo().body;
    
    // Validação básica dos dados
    if (!requestData.data || !requestData.conta || requestData.valor === undefined || requestData.descricao === undefined) {
        return c.json(400, { "error": "Campos obrigatórios faltando" });
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

        // Preparar linha para inserir na planilha
        const values = [
            [
                requestData.data,
                requestData.conta,
                requestData.valor,
                requestData.descricao,
                requestData.categoria || '',
                requestData.orcamento || '', // aceita string ou número
                ''
            ]
        ];

        // Função para tentar inserir com refresh de token se necessário
        const appendWithTokenRefresh = (token) => {
            // Usando o nome da aba "Lançamentos" e colunas A:G (para todas as colunas)
            return $http.send({
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Lançamentos!A:G:append?valueInputOption=USER_ENTERED`,
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    values: values
                })
            });
        };

        // Tenta inserir com token atual
        let appendResponse = appendWithTokenRefresh(accessToken);

        // Se token expirado, tenta renovar
        if (appendResponse.statusCode === 401) {
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
                appendResponse = appendWithTokenRefresh(newAccessToken);
            } else {
                return c.json(401, { "error": "Falha ao renovar token de acesso" });
            }
        }

        if (appendResponse.statusCode >= 200 && appendResponse.statusCode < 300) {
            return c.json(200, {
                "success": true,
                "message": "Lançamento adicionado com sucesso na planilha"
            });
        } else {
            console.log("Erro ao adicionar entrada na planilha:", appendResponse.raw);
            return c.json(500, { "error": "Erro ao adicionar entrada na planilha" });
        }
    } catch (error) {
        console.log("Erro interno ao adicionar entrada:", error);
        return c.json(500, { "error": "Erro interno do servidor" });
    }
}, $apis.requireAuth());
