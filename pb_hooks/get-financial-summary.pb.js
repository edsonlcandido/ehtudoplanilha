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
            // Busca todos os lançamentos (colunas A:G) da aba "Lançamentos"
            return $http.send({
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Lançamentos!A2:G?majorDimension=ROWS`,
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
                return c.json(200, { 
                    "success": true, 
                    "receitas": 0,
                    "despesas": 0,
                    "saldo": 0,
                    "receitasAnterior": 0,
                    "despesasAnterior": 0,
                    "saldoAnterior": 0,
                    "variacaoReceitas": 0,
                    "variacaoDespesas": 0,
                    "variacaoSaldo": 0,
                    "message": "Nenhum lançamento encontrado na planilha"
                });
            }
            
            // Processar dados financeiros
            const agora = new Date();
            const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
            
            // Mês anterior
            const dataAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
            const mesAnterior = `${dataAnterior.getFullYear()}-${String(dataAnterior.getMonth() + 1).padStart(2, '0')}`;
            
            let receitasAtual = 0;
            let despesasAtual = 0;
            let receitasAnterior = 0;
            let despesasAnterior = 0;
            
            // Processar cada linha de dados
            data.values.forEach(row => {
                if (row.length >= 6) {
                    const dataLancamento = row[0]; // Formato DD/MM/YYYY
                    const valorString = row[2]; // Valor
                    const orcamento = row[5]; // Orçamento no formato YYYY-MM
                    
                    // Converter valor - pode vir com vírgula como decimal
                    let valor = 0;
                    if (valorString && valorString.toString().trim() !== '') {
                        const valorFormatado = valorString.toString().replace(',', '.');
                        valor = parseFloat(valorFormatado) || 0;
                    }
                    
                    // Verificar se o lançamento é do mês atual ou anterior baseado no orçamento
                    if (orcamento === mesAtual) {
                        if (valor > 0) {
                            receitasAtual += valor;
                        } else {
                            despesasAtual += Math.abs(valor);
                        }
                    } else if (orcamento === mesAnterior) {
                        if (valor > 0) {
                            receitasAnterior += valor;
                        } else {
                            despesasAnterior += Math.abs(valor);
                        }
                    }
                }
            });
            
            // Calcular saldos
            const saldoAtual = receitasAtual - despesasAtual;
            const saldoAnterior = receitasAnterior - despesasAnterior;
            
            // Calcular variações percentuais
            const calcularVariacao = (atual, anterior) => {
                if (anterior === 0) {
                    return atual > 0 ? 100 : 0;
                }
                return ((atual - anterior) / anterior) * 100;
            };
            
            const variacaoReceitas = calcularVariacao(receitasAtual, receitasAnterior);
            const variacaoDespesas = calcularVariacao(despesasAtual, despesasAnterior);
            const variacaoSaldo = calcularVariacao(saldoAtual, saldoAnterior);
            
            return c.json(200, {
                "success": true,
                "receitas": receitasAtual,
                "despesas": despesasAtual,
                "saldo": saldoAtual,
                "receitasAnterior": receitasAnterior,
                "despesasAnterior": despesasAnterior,
                "saldoAnterior": saldoAnterior,
                "variacaoReceitas": parseFloat(variacaoReceitas.toFixed(1)),
                "variacaoDespesas": parseFloat(variacaoDespesas.toFixed(1)),
                "variacaoSaldo": parseFloat(variacaoSaldo.toFixed(1)),
                "mesAtual": mesAtual,
                "mesAnterior": mesAnterior
            });
        } else {
            console.log("Erro ao buscar dados da planilha:", dataResponse.raw);
            return c.json(500, { "error": "Erro ao buscar dados da planilha" });
        }
    } catch (error) {
        console.log("Erro interno ao buscar resumo financeiro:", error);
        return c.json(500, { "error": "Erro interno do servidor" });
    }
}, $apis.requireAuth());