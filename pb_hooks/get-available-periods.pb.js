/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para buscar períodos disponíveis na planilha do usuário
 * Endpoint: GET /get-available-periods
 * Retorna lista de períodos (meses/orçamentos) com dados na planilha
 */

routerAdd("GET", "/get-available-periods", (c) => {
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
            // Busca apenas a coluna F (orçamento) da aba "Lançamentos"
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
            
            // Se não tiver dados, retorna períodos padrão
            if (!data.values || data.values.length === 0) {
                console.log("Nenhum dado encontrado na planilha, retornando períodos padrão");
                return c.json(200, { 
                    "success": true, 
                    "periods": criarPeriodosPadrao(),
                    "message": "Nenhum lançamento encontrado, usando períodos padrão"
                });
            }
            
            // Extrair códigos de orçamento únicos
            const codigosOrcamento = new Set();
            data.values.forEach(row => {
                if (row.length > 0 && typeof row[0] === 'number') {
                    codigosOrcamento.add(row[0]);
                }
            });
            
            // Converter códigos Excel para datas e criar períodos
            const periods = Array.from(codigosOrcamento).map(codigo => {
                const excelDate = new Date(1900, 0, codigo - 1); // Converter de Excel serial date
                const mesNome = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][excelDate.getMonth()];
                const anoCurto = String(excelDate.getFullYear()).slice(-2);
                const nomeDisplay = `${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}/${anoCurto}`;
                const monthCode = `${excelDate.getFullYear()}-${String(excelDate.getMonth() + 1).padStart(2, '0')}`;
                
                // Verificar se é mês atual
                const now = new Date();
                const isCurrent = excelDate.getFullYear() === now.getFullYear() && 
                                excelDate.getMonth() === now.getMonth();
                
                return {
                    budgetCode: codigo,
                    monthCode: monthCode,
                    displayName: nomeDisplay,
                    isCurrent: isCurrent
                };
            }).sort((a, b) => b.budgetCode - a.budgetCode); // Ordenar por data (mais recente primeiro)
            
            return c.json(200, {
                "success": true,
                "periods": periods,
                "message": `${periods.length} períodos encontrados na planilha`
            });
        } else {
            console.log("Erro ao buscar dados da planilha:", dataResponse.raw);
            // Em caso de erro, retorna períodos padrão
            return c.json(200, { 
                "success": true, 
                "periods": criarPeriodosPadrao(),
                "message": "Erro ao acessar planilha, usando períodos padrão"
            });
        }
    } catch (error) {
        console.log("Erro interno ao buscar períodos:", error);
        // Em caso de erro, retorna períodos padrão
        return c.json(200, { 
            "success": true, 
            "periods": criarPeriodosPadrao(),
            "message": "Erro interno, usando períodos padrão"
        });
    }
}, $apis.requireAuth());

// Função auxiliar para criar períodos padrão
function criarPeriodosPadrao() {
    const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const now = new Date();
    const atual = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const periods = [];
    for (let i = -6; i <= 6; i++) {
        const d = new Date(atual.getFullYear(), atual.getMonth() + i, 1);
        const mesNome = meses[d.getMonth()];
        const anoCurto = String(d.getFullYear()).slice(-2);
        const nomeDisplay = `${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}/${anoCurto}`;
        
        // Calcular código do orçamento (Excel serial date)
        const excelDate = Math.floor((d - new Date(1900, 0, 1)) / (1000 * 60 * 60 * 24)) + 2;
        
        periods.push({
            budgetCode: excelDate,
            monthCode: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            displayName: nomeDisplay,
            isCurrent: i === 0
        });
    }
    
    return periods;
}