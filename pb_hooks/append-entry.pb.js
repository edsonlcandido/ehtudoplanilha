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
    // data e conta são opcionais (para lançamentos futuros)
    if (requestData.valor === undefined || requestData.descricao === undefined) {
        return c.json(400, { "error": "Campos obrigatórios faltando (valor e descrição)" });
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
        // Ordem: data, conta, valor, descrição, categoria, orçamento, observação
        const newRow = [
            requestData.data || '',
            requestData.conta || '',
            requestData.valor,
            requestData.descricao,
            requestData.categoria || '',
            requestData.orcamento || '',
            requestData.obs || ''
        ];
        
        console.log('📝 Dados recebidos para inserir:', JSON.stringify(requestData, null, 2));
        console.log('📊 Linha montada:', JSON.stringify(newRow, null, 2));

        // Função auxiliar para fazer requisições com token
        const makeRequest = (url, method, token, body) => {
            return $http.send({
                url: url,
                method: method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: body ? JSON.stringify(body) : undefined
            });
        };

        // PASSO 1: Buscar todas as linhas para encontrar a última linha com dados
        let getResponse = makeRequest(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Lan%C3%A7amentos!A:G?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`,
            "GET",
            accessToken
        );

        // Se token expirado na busca, tenta renovar
        if (getResponse.statusCode === 401) {
            console.log("Token expirado ao buscar dados, tentando renovar...");
            
            if (!refreshToken) {
                return c.json(401, { "error": "Token expirado e refresh token não disponível" });
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

                // Tentar novamente com novo token
                getResponse = makeRequest(
                    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Lan%C3%A7amentos!A:G?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`,
                    "GET",
                    newAccessToken
                );
                accessToken = newAccessToken;
            } else {
                return c.json(401, { "error": "Falha ao renovar token de acesso" });
            }
        }

        if (getResponse.statusCode < 200 || getResponse.statusCode >= 300) {
            console.log("❌ Erro ao buscar dados da planilha:", getResponse.raw);
            return c.json(500, { "error": "Erro ao buscar dados da planilha" });
        }

        // PASSO 2: Encontrar a última linha com dados
        const data = getResponse.json;
        const rows = data.values || [];
        let lastRowWithData = rows.length; // Começa do final
        
        console.log(`📊 Total de linhas na planilha: ${rows.length}`);

        // PASSO 3: Inserir na próxima linha (última + 1)
        const nextRow = lastRowWithData + 1;
        const range = `Lan%C3%A7amentos!A${nextRow}:G${nextRow}`;
        
        console.log(`📍 Inserindo na linha: ${nextRow}`);

        const updateResponse = makeRequest(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=USER_ENTERED`,
            "PUT",
            accessToken,
            { values: [newRow] }
        );

        // Verifica resposta da inserção
        if (updateResponse.statusCode >= 200 && updateResponse.statusCode < 300) {
            console.log('✅ Lançamento inserido na linha:', nextRow);
            console.log('✅ Resposta da API do Google:', JSON.stringify(updateResponse.json, null, 2));
            return c.json(200, {
                "success": true,
                "message": "Lançamento adicionado com sucesso na planilha",
                "rowIndex": nextRow
            });
        } else {
            console.log("❌ Erro ao adicionar entrada na planilha:", updateResponse.raw);
            return c.json(500, { "error": "Erro ao adicionar entrada na planilha" });
        }
    } catch (error) {
        console.log("Erro interno ao adicionar entrada:", error);
        return c.json(500, { "error": "Erro interno do servidor" });
    }
}, $apis.requireAuth());
