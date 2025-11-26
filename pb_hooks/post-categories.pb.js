/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para atualizar as categorias na planilha do usuário
 * Endpoint: POST /post-categories
 * Recebe um array de categorias e sobrescreve a aba CATEGORIAS da planilha
 * Formato esperado: { categories: [{ categoria: string, tipo: string }] }
 */

routerAdd("POST", "/post-categories", (c) => {
    const auth = c.auth;
    if (!auth || !auth.id) {
        return c.json(401, { "error": "Usuário não autenticado" });
    }

    const userId = auth.id;
    const requestData = c.requestInfo().body;
    
    // Validação básica dos dados
    if (!requestData.categories || !Array.isArray(requestData.categories)) {
        return c.json(400, { "error": "Campo 'categories' é obrigatório e deve ser um array" });
    }

    // Valida estrutura de cada categoria
    for (let i = 0; i < requestData.categories.length; i++) {
        const cat = requestData.categories[i];
        if (!cat.categoria || typeof cat.categoria !== 'string') {
            return c.json(400, { "error": `Categoria na posição ${i} deve ter o campo 'categoria' como string` });
        }
        if (cat.tipo !== undefined && typeof cat.tipo !== 'string') {
            return c.json(400, { "error": `Categoria na posição ${i}: campo 'tipo' deve ser string` });
        }
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
        let accessToken = googleInfo.get("access_token");
        const refreshToken = googleInfo.get("refresh_token");

        if (!sheetId) {
            return c.json(400, { "error": "Nenhuma planilha configurada" });
        }

        if (!accessToken) {
            return c.json(400, { "error": "Token de acesso não encontrado" });
        }

        // Preparar as linhas para inserir na planilha
        // Ordem: categoria, tipo (colunas A e B)
        const rows = requestData.categories.map(cat => [
            cat.categoria || '',
            (cat.tipo || '').toUpperCase()
        ]);

        console.log('📝 Categorias recebidas para atualizar:', JSON.stringify(requestData.categories, null, 2));
        console.log('📊 Linhas montadas:', JSON.stringify(rows, null, 2));

        // Função auxiliar para fazer requisições com token
        const makeRequest = (url, method, token, body) => {
            const config = {
                url: url,
                method: method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            };
            if (body) {
                config.body = JSON.stringify(body);
            }
            return $http.send(config);
        };

        // Função para renovar token
        const refreshAccessToken = () => {
            if (!refreshToken) {
                return null;
            }

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
                
                googleInfo.set("access_token", newAccessToken);
                $app.save(googleInfo);

                return newAccessToken;
            }

            return null;
        };

        // PASSO 1: Limpar o range atual de categorias (A2:B para preservar cabeçalho)
        const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/CATEGORIAS!A2:B:clear`;
        let clearResponse = makeRequest(clearUrl, "POST", accessToken, {});

        // Se token expirado, tenta renovar
        if (clearResponse.statusCode === 401) {
            console.log("Token expirado ao limpar, tentando renovar...");
            const newToken = refreshAccessToken();
            if (!newToken) {
                return c.json(401, { "error": "Token expirado e refresh token não disponível" });
            }
            accessToken = newToken;
            clearResponse = makeRequest(clearUrl, "POST", accessToken, {});
        }

        if (clearResponse.statusCode < 200 || clearResponse.statusCode >= 300) {
            console.log("❌ Erro ao limpar categorias:", clearResponse.raw);
            return c.json(500, { "error": "Erro ao limpar categorias existentes" });
        }

        console.log('✅ Categorias existentes limpas');

        // PASSO 2: Inserir as novas categorias (se houver)
        if (rows.length > 0) {
            const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/CATEGORIAS!A2:B?valueInputOption=USER_ENTERED`;
            const updateResponse = makeRequest(updateUrl, "PUT", accessToken, { values: rows });

            if (updateResponse.statusCode < 200 || updateResponse.statusCode >= 300) {
                console.log("❌ Erro ao inserir categorias:", updateResponse.raw);
                return c.json(500, { "error": "Erro ao inserir categorias na planilha" });
            }

            console.log('✅ Categorias atualizadas com sucesso');
            console.log('✅ Resposta da API do Google:', JSON.stringify(updateResponse.json, null, 2));
        }

        return c.json(200, {
            "success": true,
            "message": "Categorias atualizadas com sucesso na planilha",
            "count": rows.length
        });
    } catch (error) {
        console.log("Erro interno ao atualizar categorias:", error);
        return c.json(500, { "error": "Erro interno do servidor" });
    }
}, $apis.requireAuth());
