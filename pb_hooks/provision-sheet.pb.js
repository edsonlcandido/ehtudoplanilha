/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para criar planilha programaticamente no Drive do usuário
 * Usando escopo drive.file (sem necessidade de validação do Google)
 */

routerAdd("POST", "/provision-sheet", (c) => {
    // Estrutura de categorias padrão
    const CATEGORIAS_PADRAO = [
        ["Categoria", "Tipo"], // Header
        ["Salário", "RENDA"],
        ["13º salário", "RENDA"],
        ["Férias", "RENDA"],
        ["Horas extras", "RENDA"],
        ["Pensão", "RENDA"],
        ["Aluguel recebido", "RENDA"],
        ["Outros rendimentos", "RENDA"],
        ["Aluguel", "PRECISO"],
        ["Prestação da casa", "PRECISO"],
        ["Condomínio", "PRECISO"],
        ["Seguro da casa", "PRECISO"],
        ["IPTU", "PRECISO"],
        ["Luz", "PRECISO"],
        ["Água", "PRECISO"],
        ["Gás", "PRECISO"],
        ["Internet", "PRECISO"],
        ["Telefone celular", "PRECISO"],
        ["Supermercado", "PRECISO"],
        ["Plano de saúde", "PRECISO"],
        ["Medicamentos", "PRECISO"],
        ["Médico / Dentista / Hospital", "PRECISO"],
        ["Transporte", "PRECISO"],
        ["Prestação do carro", "PRECISO"],
        ["Seguro do carro", "PRECISO"],
        ["Seguro de vida", "PRECISO"],
        ["Empréstimos", "PRECISO"],
        ["Diarista", "PRECISO"],
        ["Colégio / Faculdade / Curso", "PRECISO"],
        ["Material escolar", "PRECISO"],
        ["Roupas / Calçados / Acessórios", "QUERO"],
        ["Cabeleireiro / Manicure / Esteticista", "QUERO"],
        ["Delivery", "QUERO"],
        ["Restaurantes / Bares", "QUERO"],
        ["Lazer (Cinema, Teatro, Shows, Clube)", "QUERO"],
        ["Academia", "QUERO"],
        ["Presentes", "QUERO"],
        ["TV e Streaming", "QUERO"],
        ["Doações", "QUERO"],
        ["Serviços diversos", "QUERO"],
        ["Viagens", "QUERO"],
        ["Imprevistos", "QUERO"],
        ["Outras", "QUERO"],
        ["Aposentadoria", "INVESTIMENTOS"],
        ["Fundo de emergência", "INVESTIMENTOS"],
        ["Investimentos", "INVESTIMENTOS"],
        ["Patrimônio", "INVESTIMENTOS"],
        ["Transferência", "TRANSFERÊNCIA"],
        ["Saldo", "SALDO"]
    ];

    /**
     * Cria planilha programaticamente usando Sheets API v4
     */
    const createSpreadsheet = (accessToken) => {
        const spreadsheetTitle = `Planilha Eh Tudo`;
        
        const requestBody = {
            properties: {
                title: spreadsheetTitle,
                locale: "pt_BR",
                timeZone: "America/Sao_Paulo"
            },
            sheets: [
                {
                    properties: {
                        title: "Lançamentos"
                    }
                },
                {
                    properties: {
                        title: "Categorias"
                    }
                }
            ]
        };

        const createResponse = $http.send({
            url: "https://sheets.googleapis.com/v4/spreadsheets",
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        return createResponse;
    };

    /**
     * Popula aba Lançamentos com cabeçalho
     */
    const populateLancamentos = (spreadsheetId, accessToken) => {
        const requestBody = {
            values: [["data", "conta", "valor", "descrição", "categoria", "orçamento", "observação"]]
        };

        const populateResponse = $http.send({
            url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Lançamentos!A1:G1?valueInputOption=RAW`,
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        return populateResponse;
    };

    /**
     * Popula aba Categorias com dados padrão
     */
    const populateCategorias = (spreadsheetId, accessToken) => {
        const requestBody = {
            values: CATEGORIAS_PADRAO
        };

        const populateResponse = $http.send({
            url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Categorias!A1:B${CATEGORIAS_PADRAO.length}?valueInputOption=RAW`,
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        return populateResponse;
    };

    /**
     * Renova access token usando refresh token
     */
    const refreshAccessToken = (refreshToken) => {
        const clientId = $os.getenv("GOOGLE_CLIENT_ID");
        const clientSecret = $os.getenv("GOOGLE_CLIENT_SECRET");

        const refreshRequestBody = [
            `refresh_token=${encodeURIComponent(refreshToken)}`,
            `client_id=${encodeURIComponent(clientId)}`,
            `client_secret=${encodeURIComponent(clientSecret)}`,
            `grant_type=refresh_token`
        ].join('&');

        const tokenResponse = $http.send({
            url: "https://oauth2.googleapis.com/token",
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: refreshRequestBody
        });

        return tokenResponse;
    };

    const authUser = c.auth;
    if (!authUser || !authUser.id) {
        return c.json(401, { "error": "Usuário não autenticado" });
    }

    const userId = authUser.id;

    try {
        // Buscar informações do Google para o usuário
        const googleInfo = $app.findFirstRecordByFilter(
            "google_infos",
            "user_id = {:userId}",
            { userId: userId }
        );

        if (!googleInfo) {
            console.log(`❌ [provision-sheet] Google Info não encontrado para usuário ${userId}`);
            return c.json(404, { 
                "error": "Informações do Google não encontradas. Execute primeiro a autorização OAuth." 
            });
        }

        console.log(`📋 [provision-sheet] Google Info encontrado para usuário ${userId}`);
        console.log(`📋 [provision-sheet] Tem access_token: ${!!googleInfo.get("access_token")}`);
        console.log(`📋 [provision-sheet] Tem refresh_token: ${!!googleInfo.get("refresh_token")}`);
        console.log(`📋 [provision-sheet] Tem sheet_id: ${!!googleInfo.get("sheet_id")}`);

        let accessToken = googleInfo.get("access_token");
        if (!accessToken) {
            console.log(`❌ [provision-sheet] Access token não encontrado para usuário ${userId}`);
            return c.json(404, { 
                "error": "Token de acesso não encontrado. Execute novamente a autorização OAuth." 
            });
        }

        // Verificar se já existe uma planilha configurada
        const existingSheetId = googleInfo.get("sheet_id");
        if (existingSheetId && existingSheetId.trim() !== "") {
            console.log(`ℹ️ [provision-sheet] Usuário ${userId} já possui planilha: ${existingSheetId}`);
            return c.json(200, {
                "success": true,
                "message": "Usuário já possui uma planilha configurada",
                "sheet_id": existingSheetId,
                "action": "existing"
            });
        }

        console.log(`🔄 [provision-sheet] Criando nova planilha para usuário ${userId}`);

        // Criar planilha
        let createResponse = createSpreadsheet(accessToken);

        console.log(`📊 [provision-sheet] Resposta da criação: status ${createResponse.statusCode}`);

        // Se token expirado, renovar e tentar novamente
        if (createResponse.statusCode === 401) {
            console.log(`⚠️ [provision-sheet] Token expirado (401), tentando renovar...`);
            
            const refreshToken = googleInfo.get("refresh_token");
            console.log(`📋 [provision-sheet] Refresh token disponível: ${!!refreshToken}`);
            
            if (!refreshToken) {
                console.log(`❌ [provision-sheet] Refresh token não disponível para usuário ${userId}`);
                return c.json(401, { 
                    "error": "Token expirado e refresh token não disponível. Execute novamente a autorização OAuth." 
                });
            }

            console.log(`🔄 [provision-sheet] Chamando refreshAccessToken...`);
            const tokenResponse = refreshAccessToken(refreshToken);
            console.log(`📊 [provision-sheet] Resposta do refresh: status ${tokenResponse.statusCode}`);
            
            if (tokenResponse.statusCode !== 200) {
                console.log(`❌ [provision-sheet] Erro ao renovar token:`, tokenResponse.json);
                return c.json(400, { 
                    "error": "Falha ao renovar token de acesso. Execute novamente a autorização OAuth." 
                });
            }

            // Atualizar token no banco
            const newTokenData = tokenResponse.json;
            accessToken = newTokenData.access_token;
            googleInfo.set("access_token", accessToken);
            $app.save(googleInfo);

            console.log(`✅ [provision-sheet] Token renovado com sucesso, tentando criar planilha novamente...`);

            // Tentar criar planilha novamente
            createResponse = createSpreadsheet(accessToken);
            console.log(`📊 [provision-sheet] Resposta da segunda tentativa: status ${createResponse.statusCode}`);
        }

        // Verificar se criação foi bem-sucedida
        if (createResponse.statusCode !== 200) {
            console.log(`❌ [provision-sheet] Erro ao criar planilha. Status: ${createResponse.statusCode}`);
            console.log(`❌ [provision-sheet] Resposta completa:`, createResponse.json);
            const errorData = createResponse.json;
            return c.json(createResponse.statusCode, { 
                "error": `Falha ao criar planilha: ${errorData.error?.message || 'Erro desconhecido'}` 
            });
        }

        const createData = createResponse.json;
        const newSheetId = createData.spreadsheetId;
        const sheetUrl = createData.spreadsheetUrl;

        console.log(`✅ [provision-sheet] Planilha criada com sucesso: ${newSheetId}`);

        // Popula aba Lançamentos com cabeçalho
        console.log(`📋 [provision-sheet] Populando cabeçalho de Lançamentos...`);
        const populateLancamentosResponse = populateLancamentos(newSheetId, accessToken);
        if (populateLancamentosResponse.statusCode !== 200) {
            console.log(`⚠️ [provision-sheet] Aviso: Falha ao popular Lançamentos. Status: ${populateLancamentosResponse.statusCode}`);
            console.log(`⚠️ [provision-sheet] Resposta:`, populateLancamentosResponse.json);
        } else {
            console.log(`✅ [provision-sheet] Cabeçalho de Lançamentos populado com sucesso`);
        }

        // Popula aba Categorias
        console.log(`📋 [provision-sheet] Populando categorias...`);
        const populateResponse = populateCategorias(newSheetId, accessToken);
        if (populateResponse.statusCode !== 200) {
            console.log(`⚠️ [provision-sheet] Aviso: Falha ao popular categorias. Status: ${populateResponse.statusCode}`);
            console.log(`⚠️ [provision-sheet] Planilha criada mas categorias devem ser adicionadas manualmente:`, populateResponse.json);
        } else {
            console.log(`✅ [provision-sheet] Categorias populadas com sucesso`);
        }

        // Salvar informações da planilha
        googleInfo.set("sheet_id", newSheetId);
        googleInfo.set("sheet_name", createData.properties?.title || `Planilha Eh Tudo`);
        $app.save(googleInfo);

        console.log(`✅ [provision-sheet] Planilha provisionada com sucesso para usuário ${userId}`);
        console.log(`📋 [provision-sheet] Sheet ID: ${newSheetId}`);
        console.log(`📋 [provision-sheet] Sheet Name: ${createData.properties?.title}`);

        return c.json(200, {
            "success": true,
            "message": "Planilha criada com sucesso no seu Google Drive!",
            "sheet_id": newSheetId,
            "sheet_name": createData.properties?.title || `Planilha Eh Tudo`,
            "sheet_url": sheetUrl,
            "action": "created"
        });

    } catch (error) {
        console.log(`❌ [provision-sheet] Erro interno ao provisionar planilha para usuário ${userId}:`, error);
        console.log(`❌ [provision-sheet] Stack trace:`, error.stack || "N/A");
        return c.json(500, { 
            "error": "Erro interno do servidor ao criar planilha",
            "details": error.message || String(error)
        });
    }
}, $apis.requireAuth());