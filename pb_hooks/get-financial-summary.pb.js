/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para buscar resumo financeiro da planilha do usuário
 * Endpoint: GET /get-financial-summary
 * Retorna receitas, despesas e saldo do mês atual e anterior para calcular variações
 */

routerAdd("GET", "/get-financial-summary", (c) => {
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
            //console.log("Dados da planilha recebidos:", JSON.stringify(data, null, 2));
            // Se não tiver dados
            if (!data.values || data.values.length === 0) {
                console.log("Nenhum dado encontrado na planilha");
                return c.json(200, { 
                    "success": true, 
                    "receitas": 0,
                    "despesas": 0,
                    "saldo": 0,
                    "receitasAnterior": 0,
                    "despesasAnterior": 0,
                    "saldoAnterior": 0,
                    "variacaoDespesas": 0,
                    "message": "Nenhum lançamento encontrado na planilha"
                });
            }
            
            console.log(`Total de linhas encontradas: ${data.values.length}`);
            
            // Códigos de orçamento para os meses (conforme indicado nos dados)
            const mesAtualOrcamento = 45870;  // Agosto/2025
            const mesAnteriorOrcamento = 45839;  // Julho/2025
            
            // Formatação para exibição
            const mesAtualFormatado = '2025-08';
            const mesAnteriorFormatado = '2025-07';
            
            console.log(`Mês atual orçamento: ${mesAtualOrcamento}, Mês anterior orçamento: ${mesAnteriorOrcamento}`);
            console.log(`Mês atual formatado: ${mesAtualFormatado}, Mês anterior formatado: ${mesAnteriorFormatado}`);
            
            // Resumos financeiros
            let receitasAtual = 0;
            let despesasAtual = 0;
            let receitasAnterior = 0;
            let despesasAnterior = 0;
            
            // Processar cada linha de dados
            data.values.forEach(row => {
                if (row.length >= 6) {
                    // Com valueRenderOption=UNFORMATTED_VALUE, valores vêm como números
                    const valor = typeof row[2] === 'number' ? row[2] : parseFloat(String(row[2]).replace(',', '.')) || 0;
                    const orcamento = row[5]; // Valor numérico no formato Excel
                    
                    // Mês atual
                    if (orcamento === mesAtualOrcamento) {
                        if (valor > 0) {
                            receitasAtual += valor;
                        } else if (valor < 0) {
                            despesasAtual += Math.abs(valor);
                        }
                    }
                    // Mês anterior
                    else if (orcamento === mesAnteriorOrcamento) {
                        if (valor > 0) {
                            receitasAnterior += valor;
                        } else if (valor < 0) {
                            despesasAnterior += Math.abs(valor);
                        }
                    }
                }
            });
            
            // Calcular saldos
            const saldoAtual = receitasAtual - despesasAtual;
            const saldoAnterior = receitasAnterior - despesasAnterior;
            
            // Calcular variação percentual das despesas
            const variacaoDespesas = despesasAnterior === 0 
                ? (despesasAtual > 0 ? 100 : 0) 
                : ((despesasAtual - despesasAnterior) / despesasAnterior) * 100;
            
            const resultado = {
                "success": true,
                "receitas": receitasAtual,
                "despesas": despesasAtual,
                "saldo": saldoAtual,
                "receitasAnterior": receitasAnterior,
                "despesasAnterior": despesasAnterior,
                "saldoAnterior": saldoAnterior,
                "variacaoDespesas": parseFloat(variacaoDespesas.toFixed(1)),
                "mesAtual": mesAtualFormatado,
                "mesAnterior": mesAnteriorFormatado,
                "totalLancamentosAtual": data.values.filter(row => 
                    row.length >= 6 && row[5] === mesAtualOrcamento
                ).length,
                "totalLancamentosAnterior": data.values.filter(row => 
                    row.length >= 6 && row[5] === mesAnteriorOrcamento
                ).length
            };
            
            console.log("Resultado do resumo financeiro:", JSON.stringify(resultado, null, 2));
            
            return c.json(200, resultado);
        } else {
            console.log("Erro ao buscar dados da planilha:", dataResponse.raw);
            return c.json(500, { "error": "Erro ao buscar dados da planilha" });
        }
    } catch (error) {
        console.log("Erro interno ao buscar resumo financeiro:", error);
        return c.json(500, { "error": "Erro interno do servidor" });
    }
}, $apis.requireAuth());