/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para buscar as últimas entradas da planilha do usuário
 * Endpoint: GET /get-sheet-entries
 * Retorna as últimas linhas da aba "Lançamentos" formatadas para exibição
 * Query params opcionais: limit (padrão: 50)
 */

routerAdd("GET", "/get-sheet-entries", (c) => {
    const auth = c.auth;
    if (!auth || !auth.id) {
        return c.json(401, { "error": "Usuário não autenticado" });
    }

    const userId = auth.id;
    const query = c.requestInfo().query || {};
    // Interpreta limit com as seguintes regras:
    // - ausente -> default 100
    // - >0 -> retorna esse número
    // - 0 -> retorna todas as linhas (sem limite)
    // - inválido/negativo -> fallback 100
    let limit = 100;
    if (query.limit !== undefined) {
        const parsed = parseInt(query.limit, 10);
        if (!Number.isNaN(parsed)) {
            if (parsed === 0) {
                limit = 0; // sinaliza "sem limite"
            } else if (parsed > 0) {
                limit = parsed;
            }
            // valores negativos ou NaN manterão o padrão
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
            // Busca todos os lançamentos (colunas A:G) da aba "Lançamentos" com valores não formatados
            return $http.send({
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Lançamentos!A1:G?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`,
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        };

        // Tenta buscar com token atual
        let dataResponse = getSheetDataWithTokenRefresh(accessToken);

        // Se token expirado, tenta renovar
        if (dataResponse.statusCode === 401) {
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
                dataResponse = getSheetDataWithTokenRefresh(newAccessToken);
            } else {
                return c.json(401, { "error": "Falha ao renovar token de acesso" });
            }
        }

        if (dataResponse.statusCode >= 200 && dataResponse.statusCode < 300) {
            // Processar resposta
            const data = dataResponse.json;
            
            // Se não tiver dados
            if (!data.values || data.values.length === 0) {
                console.log("Nenhum dado encontrado na planilha");
                return c.json(200, { 
                    "success": true, 
                    "entries": [],
                    "total": 0,
                    "message": "Nenhum lançamento encontrado na planilha"
                });
            }

            // Pular a primeira linha (cabeçalho) se existir
            const rows = data.values.slice(1);
            
            // Formatar entradas para exibição e filtrar linhas totalmente em branco
            const entries = rows
                .map((row, index) => ({
                    rowIndex: index + 2,
                    data: row[0] || "",
                    conta: row[1] || "",
                    valor: (row[2] !== undefined && row[2] !== null && row[2] !== '') ? row[2] : 0,
                    descricao: row[3] || "",
                    categoria: row[4] || "",
                    orcamento: row[5] || "",
                    obs: row[6] || ""
                }))
                .filter(e => {
                    // Todas as colunas vazias? remove
                    const campos = [e.data, e.conta, e.valor, e.descricao, e.categoria, e.orcamento, e.obs];
                    // Se valor é numérico diferente de 0, já não é branco
                    const temValorNumerico = typeof e.valor === 'number' && e.valor !== 0;
                    if (temValorNumerico) return true;
                    return !campos.every(v => {
                        if (v === null || v === undefined) return true;
                        if (typeof v === 'number') return v === 0; // considera 0 como vazio nesse contexto
                        return String(v).trim() === '';
                    });
                });

            // Mais recentes primeiro (linhas maiores) sem precisar reverse depois de limitar: ordenar por rowIndex desc
            let recentEntries = entries.sort((a,b) => b.rowIndex - a.rowIndex);
            // se limit > 0 aplica slice; se limit === 0 retorna todas as linhas
            if (limit > 0) recentEntries = recentEntries.slice(0, limit);

            return c.json(200, {
                "success": true,
                "entries": recentEntries,
                "total": rows.length,
                "limit": limit
            });

        } else {
            console.log("Erro ao buscar dados da planilha:", dataResponse.raw);
            return c.json(500, { "error": "Erro ao buscar dados da planilha" });
        }

    } catch (error) {
        console.log("Erro interno ao buscar entradas:", error);
        return c.json(500, { "error": "Erro interno do servidor" });
    }
}, $apis.requireAuth());