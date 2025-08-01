/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para buscar as categorias da planilha do usuário
 * Endpoint: GET /get-sheet-categories
 * Retorna as categorias da aba "Categorias" da planilha
 */

routerAdd("GET", "/get-sheet-categories", (c) => {
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

        // Função para buscar categorias
        const getCategoriesWithTokenRefresh = (token) => {
            return $http.send({
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Categorias!A2:A?majorDimension=COLUMNS`,
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        };

        // Tenta buscar com token atual
        let categoriesResponse = getCategoriesWithTokenRefresh(accessToken);

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
                categoriesResponse = getCategoriesWithTokenRefresh(newAccessToken);
            } else {
                return c.json(401, { "error": "Falha ao renovar token de acesso" });
            }
        }

        if (categoriesResponse.statusCode >= 200 && categoriesResponse.statusCode < 300) {
            // Processar resposta
            const data = categoriesResponse.json;
            
            // Se a planilha não tiver a aba "Categorias" ou não tiver dados
            if (!data.values || data.values.length === 0) {
                return c.json(200, { 
                    "success": true, 
                    "categories": [],
                    "message": "Nenhuma categoria encontrada na planilha"
                });
            }
            
            // Pega o primeiro array (pois estamos solicitando uma coluna)
            // Remove valores vazios e filtra duplicados
            const categories = data.values[0]
                .filter(cat => cat && cat.trim() !== "")
                .filter((cat, index, self) => self.indexOf(cat) === index);
            
            return c.json(200, {
                "success": true,
                "categories": categories
            });
        } else {
            console.log("Erro ao buscar categorias:", categoriesResponse.raw);
            return c.json(500, { "error": "Erro ao buscar categorias" });
        }
    } catch (error) {
        console.log("Erro interno ao buscar categorias:", error);
        return c.json(500, { "error": "Erro interno do servidor" });
    }
}, $apis.requireAuth());
