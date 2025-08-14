/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para buscar meses únicos disponíveis na coluna "orcamento" da planilha
 * Endpoint: GET /get-available-months
 * Retorna lista de meses únicos formatados para seleção no frontend
 */

routerAdd("GET", "/get-available-months", (c) => {
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

        // Função para buscar dados da planilha
        const getSheetDataWithTokenRefresh = (token) => {
            // Busca apenas a coluna F (orçamento) da aba "Lançamentos" com valores não formatados
            return $http.send({
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Lançamentos!F:F?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`,
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        };

        // Tenta buscar com token atual
        let dataResponse = getSheetDataWithTokenRefresh(accessToken);

        // Se falhar com 401, tenta renovar o token
        if (dataResponse.statusCode === 401 && refreshToken) {
            console.log("Token expirado, tentando renovar...");
            const refreshResponse = $http.send({
                url: "https://oauth2.googleapis.com/token",
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${process.env.GOOGLE_CLIENT_ID}&client_secret=${process.env.GOOGLE_CLIENT_SECRET}`
            });

            if (refreshResponse.statusCode === 200) {
                const refreshData = refreshResponse.json;
                const newAccessToken = refreshData.access_token;
                
                // Atualiza o token no banco
                googleInfo.set("access_token", newAccessToken);
                $app.save(googleInfo);

                // Tenta novamente com o novo token
                dataResponse = getSheetDataWithTokenRefresh(newAccessToken);
            } else {
                return c.json(401, { "error": "Não foi possível renovar o token de acesso" });
            }
        }

        if (dataResponse.statusCode !== 200) {
            console.error("Erro ao buscar dados da planilha:", dataResponse.raw);
            return c.json(500, { "error": "Erro ao acessar planilha do Google Sheets" });
        }

        const data = dataResponse.json;
        
        if (!data.values || data.values.length === 0) {
            return c.json(200, {
                "success": true,
                "meses": [],
                "message": "Nenhum lançamento encontrado na planilha"
            });
        }

        // Extrair valores únicos da coluna orçamento (excluindo cabeçalho)
        const mesesUnicos = new Set();
        const excelEpochUTC = Date.UTC(1899, 11, 30); // 1899-12-30
        
        data.values.forEach((row, index) => {
            // Pula a primeira linha (cabeçalho)
            if (index === 0 || !row[0]) return;
            
            const valorOrcamento = row[0];
            if (valorOrcamento && typeof valorOrcamento === 'number') {
                // Converter serial Excel para data
                const msUTC = excelEpochUTC + valorOrcamento * 86400000;
                const date = new Date(msUTC);
                
                // Formatar como AAAA-MM
                const ano = date.getUTCFullYear();
                const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
                const mesFormatado = `${ano}-${mes}`;
                
                mesesUnicos.add(mesFormatado);
            }
        });

        // Converter Set para array e ordenar por data (mais recente primeiro)
        const mesesArray = Array.from(mesesUnicos).sort((a, b) => b.localeCompare(a));
        
        // Formatar para exibição em português
        const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
        const mesesFormatados = mesesArray.map(mesAno => {
            const [ano, mesNum] = mesAno.split('-');
            const mesNome = meses[parseInt(mesNum) - 1];
            const anoCurto = ano.slice(-2);
            
            return {
                valor: mesAno, // AAAA-MM para enviar para o backend
                texto: `${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}/${anoCurto}`, // Janeiro/25
                completo: `${mesNome} de ${ano}` // Janeiro de 2025
            };
        });

        return c.json(200, {
            "success": true,
            "meses": mesesFormatados,
            "total": mesesFormatados.length
        });

    } catch (error) {
        console.error("Erro interno no hook get-available-months:", error);
        return c.json(500, { "error": "Erro interno do servidor" });
    }
});