/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para criar planilha programaticamente no Drive do usuário
 * Usando escopo drive.file (sem necessidade de validação do Google)
 */

// Estrutura de categorias padrão
const CATEGORIAS_PADRAO = [
    ["Categoria", "Tipo"], // Header
    ["ALIMENTAÇÃO", "PRECISO"],
    ["SUPERMERCADO", "PRECISO"],
    ["MERCADO", "PRECISO"],
    ["RESTAURANTE", "QUERO"],
    ["DELIVERY", "QUERO"],
    ["PADARIA", "PRECISO"],
    ["AÇOUGUE", "PRECISO"],
    ["FEIRA", "PRECISO"],
    ["SAÚDE", "PRECISO"],
    ["FARMÁCIA", "PRECISO"],
    ["MÉDICO", "PRECISO"],
    ["DENTISTA", "PRECISO"],
    ["ACADEMIA", "QUERO"],
    ["TERAPIA", "PRECISO"],
    ["TRANSPORTE", "PRECISO"],
    ["COMBUSTÍVEL", "PRECISO"],
    ["ESTACIONAMENTO", "PRECISO"],
    ["PEDÁGIO", "PRECISO"],
    ["TRANSPORTE PÚBLICO", "PRECISO"],
    ["APLICATIVO", "PRECISO"],
    ["MORADIA", "PRECISO"],
    ["ALUGUEL", "PRECISO"],
    ["CONDOMÍNIO", "PRECISO"],
    ["ÁGUA", "PRECISO"],
    ["LUZ", "PRECISO"],
    ["GÁS", "PRECISO"],
    ["INTERNET", "PRECISO"],
    ["TELEFONE", "PRECISO"],
    ["EDUCAÇÃO", "PRECISO"],
    ["ESCOLA", "PRECISO"],
    ["CURSO", "QUERO"],
    ["LIVROS", "QUERO"],
    ["MATERIAL ESCOLAR", "PRECISO"],
    ["LAZER", "QUERO"],
    ["CINEMA", "QUERO"],
    ["STREAMING", "QUERO"],
    ["VIAGEM", "QUERO"],
    ["PRESENTE", "QUERO"],
    ["VESTUÁRIO", "QUERO"],
    ["ROUPAS", "QUERO"],
    ["CALÇADOS", "QUERO"],
    ["BELEZA", "QUERO"],
    ["INVESTIMENTOS", "INVESTIMENTOS"],
    ["POUPANÇA", "INVESTIMENTOS"],
    ["PREVIDÊNCIA", "INVESTIMENTOS"],
    ["RENDA", "RENDA"],
    ["SALÁRIO", "RENDA"],
    ["FREELANCE", "RENDA"],
    ["OUTROS", "QUERO"],
    ["TRANSFERÊNCIA", "TRANSFERÊNCIA"],
    ["SALDO INICIAL", "SALDO"]
];

/**
 * Cria planilha programaticamente usando Sheets API v4
 * @param {string} accessToken - Token de acesso do Google OAuth
 * @param {string} userName - Nome do usuário para personalizar o título da planilha
 * @returns {Object} Resposta HTTP do Google Sheets API contendo spreadsheetId, spreadsheetUrl e properties
 *                   Status 200: Sucesso, 401: Token inválido/expirado, 403: Sem permissões
 */
function createSpreadsheet(accessToken, userName) {
    const spreadsheetTitle = `Planilha Eh Tudo - ${userName}`;
    
    const requestBody = {
        properties: {
            title: spreadsheetTitle,
            locale: "pt_BR",
            timeZone: "America/Sao_Paulo"
        },
        sheets: [
            {
                properties: {
                    title: "Lançamentos",
                    gridProperties: {
                        rowCount: 1000,
                        columnCount: 7,
                        frozenRowCount: 1
                    }
                },
                data: [{
                    startRow: 0,
                    startColumn: 0,
                    rowData: [{
                        values: [
                            { userEnteredValue: { stringValue: "Data" }, userEnteredFormat: { textFormat: { bold: true } } },
                            { userEnteredValue: { stringValue: "Conta" }, userEnteredFormat: { textFormat: { bold: true } } },
                            { userEnteredValue: { stringValue: "Valor" }, userEnteredFormat: { textFormat: { bold: true } } },
                            { userEnteredValue: { stringValue: "Descrição" }, userEnteredFormat: { textFormat: { bold: true } } },
                            { userEnteredValue: { stringValue: "Categoria" }, userEnteredFormat: { textFormat: { bold: true } } },
                            { userEnteredValue: { stringValue: "Orçamento" }, userEnteredFormat: { textFormat: { bold: true } } },
                            { userEnteredValue: { stringValue: "Observação" }, userEnteredFormat: { textFormat: { bold: true } } }
                        ]
                    }]
                }]
            },
            {
                properties: {
                    title: "Categorias",
                    gridProperties: {
                        rowCount: 100,
                        columnCount: 2,
                        frozenRowCount: 1
                    }
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
}

/**
 * Popula aba Categorias com dados padrão
 * @param {string} spreadsheetId - ID da planilha criada
 * @param {string} accessToken - Token de acesso do Google OAuth
 * @returns {Object} Resposta HTTP do Google Sheets API
 *                   Status 200: Sucesso, 401: Token inválido/expirado, 400: ID inválido
 */
function populateCategorias(spreadsheetId, accessToken) {
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
}

/**
 * Renova access token usando refresh token
 * @param {string} refreshToken - Refresh token do Google OAuth
 * @returns {Object} Resposta HTTP contendo novo access_token, expires_in e token_type
 *                   Status 200: Sucesso com novo token, 400: Refresh token inválido/expirado
 */
function refreshAccessToken(refreshToken) {
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
}

routerAdd("POST", "/provision-sheet", (c) => {
    const authUser = c.auth;
    if (!authUser || !authUser.id) {
        return c.json(401, { "error": "Usuário não autenticado" });
    }

    const userId = authUser.id;
    const userName = authUser.get("name") || "Usuário";

    try {
        // Buscar informações do Google para o usuário
        const googleInfo = $app.findFirstRecordByFilter(
            "google_infos",
            "user_id = {:userId}",
            { userId: userId }
        );

        if (!googleInfo) {
            return c.json(404, { 
                "error": "Informações do Google não encontradas. Execute primeiro a autorização OAuth." 
            });
        }

        let accessToken = googleInfo.get("access_token");
        if (!accessToken) {
            return c.json(404, { 
                "error": "Token de acesso não encontrado. Execute novamente a autorização OAuth." 
            });
        }

        // Verificar se já existe uma planilha configurada
        const existingSheetId = googleInfo.get("sheet_id");
        if (existingSheetId && existingSheetId.trim() !== "") {
            return c.json(200, {
                "success": true,
                "message": "Usuário já possui uma planilha configurada",
                "sheet_id": existingSheetId,
                "action": "existing"
            });
        }

        console.log(`Criando nova planilha para usuário ${userId}`);

        // Criar planilha
        let createResponse = createSpreadsheet(accessToken, userName);

        // Se token expirado, renovar e tentar novamente
        if (createResponse.statusCode === 401) {
            console.log("Token expirado, renovando...");
            
            const refreshToken = googleInfo.get("refresh_token");
            if (!refreshToken) {
                return c.json(401, { 
                    "error": "Token expirado e refresh token não disponível. Execute novamente a autorização OAuth." 
                });
            }

            const tokenResponse = refreshAccessToken(refreshToken);
            if (tokenResponse.statusCode !== 200) {
                console.log("Erro ao renovar token:", tokenResponse.json);
                return c.json(400, { 
                    "error": "Falha ao renovar token de acesso. Execute novamente a autorização OAuth." 
                });
            }

            // Atualizar token no banco
            const newTokenData = tokenResponse.json;
            accessToken = newTokenData.access_token;
            googleInfo.set("access_token", accessToken);
            $app.save(googleInfo);

            // Tentar criar planilha novamente
            createResponse = createSpreadsheet(accessToken, userName);
        }

        // Verificar se criação foi bem-sucedida
        if (createResponse.statusCode !== 200) {
            console.log("Erro ao criar planilha:", createResponse.json);
            const errorData = createResponse.json;
            return c.json(createResponse.statusCode, { 
                "error": `Falha ao criar planilha: ${errorData.error?.message || 'Erro desconhecido'}` 
            });
        }

        const createData = createResponse.json;
        const newSheetId = createData.spreadsheetId;
        const sheetUrl = createData.spreadsheetUrl;

        console.log(`Planilha criada: ${newSheetId}`);

        // Popula aba Categorias
        const populateResponse = populateCategorias(newSheetId, accessToken);
        if (populateResponse.statusCode !== 200) {
            console.log("Aviso: Falha ao popular categorias padrão. Planilha criada mas categorias devem ser adicionadas manualmente:", populateResponse.json);
        }

        // Salvar informações da planilha
        googleInfo.set("sheet_id", newSheetId);
        googleInfo.set("sheet_name", createData.properties?.title || `Planilha Eh Tudo - ${userName}`);
        $app.save(googleInfo);

        console.log(`Planilha provisionada com sucesso para usuário ${userId}`);

        return c.json(200, {
            "success": true,
            "message": "Planilha criada com sucesso no seu Google Drive!",
            "sheet_id": newSheetId,
            "sheet_name": createData.properties?.title || `Planilha Eh Tudo - ${userName}`,
            "sheet_url": sheetUrl,
            "action": "created"
        });

    } catch (error) {
        console.log("Erro interno ao provisionar planilha:", error);
        return c.json(500, { 
            "error": "Erro interno do servidor ao criar planilha",
            "details": error.message || String(error)
        });
    }
}, $apis.requireAuth());