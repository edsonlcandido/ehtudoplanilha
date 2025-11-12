/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para buscar as categorias completas da planilha do usuário
 * Endpoint: GET /get-sheet-categories-complete
 * Retorna categoria, tipo e orcamento da aba "CATEGORIAS" (colunas A, B, C)
 */

routerAdd("GET", "/get-sheet-categories-complete", (c) => {
    const auth = c.auth;
    if (!auth || !auth.id) {
        return c.json(401, { "error": "Usuário não autenticado" });
    }

    const userId = auth.id;

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

        // Função para buscar categorias completas (colunas A, B e C)
        const getCategoriesCompleteWithTokenRefresh = (token) => {
            return $http.send({
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/CATEGORIAS!A2:C?majorDimension=ROWS`,
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        };

        // Tenta buscar com token atual
        let categoriesResponse = getCategoriesCompleteWithTokenRefresh(accessToken);

        // Se token expirado, tenta renovar
        if (categoriesResponse.statusCode === 401) {
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
                categoriesResponse = getCategoriesCompleteWithTokenRefresh(newAccessToken);
            } else {
                return c.json(401, { "error": "Falha ao renovar token de acesso" });
            }
        }

        if (categoriesResponse.statusCode >= 200 && categoriesResponse.statusCode < 300) {
            // Processar resposta
            const data = categoriesResponse.json;
            
            // Se a planilha não tiver a aba "CATEGORIAS" ou não tiver dados
            if (!data.values || data.values.length === 0) {
                return c.json(200, { 
                    "success": true, 
                    "categoriesComplete": [],
                    "message": "Nenhuma categoria encontrada na planilha"
                });
            }
            
            // Processar cada linha retornada (cada linha é um array [categoria, tipo, orcamento])
            const categoriesComplete = [];
            
            for (let i = 0; i < data.values.length; i++) {
                const row = data.values[i];
                
                // Ignora linhas vazias ou sem categoria
                if (!row || !row[0] || row[0].trim() === "") {
                    continue;
                }
                
                const categoria = row[0].trim();
                const tipo = row[1] ? row[1].trim().toUpperCase() : "";
                const orcamentoStr = row[2] ? row[2].trim() : "0";
                
                // Converte orçamento para número, tratando vírgula e ponto
                let orcamento = 0;
                if (orcamentoStr) {
                    // Remove espaços e converte vírgula para ponto
                    const normalized = orcamentoStr.replace(/\s/g, '').replace(',', '.');
                    orcamento = parseFloat(normalized) || 0;
                }
                
                categoriesComplete.push({
                    categoria: categoria,
                    tipo: tipo,
                    orcamento: orcamento
                });
            }
            
            return c.json(200, {
                "success": true,
                "categoriesComplete": categoriesComplete
            });
        } else {
            console.log("Erro ao buscar categorias completas:", categoriesResponse.raw);
            return c.json(500, { "error": "Erro ao buscar categorias completas" });
        }
    } catch (error) {
        console.log("Erro interno ao buscar categorias completas:", error);
        return c.json(500, { "error": "Erro interno do servidor" });
    }
}, $apis.requireAuth());
