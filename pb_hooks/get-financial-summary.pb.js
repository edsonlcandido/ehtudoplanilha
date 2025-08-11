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
    
    // Obter parâmetro de orçamento da query string
    const budgetParam = c.request.url.query["budget"];

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
            
            //console.log(`Total de linhas encontradas: ${data.values.length}`);
            
            // Determinar códigos de orçamento para os meses
            let mesAtualOrcamento, mesAnteriorOrcamento;
            let mesAtualFormatado, mesAnteriorFormatado;
            
            if (budgetParam) {
                // Usar parâmetro fornecido
                mesAtualOrcamento = parseInt(budgetParam);
                console.log(`Recebido parâmetro budget: ${budgetParam}, convertido para: ${mesAtualOrcamento}`);
                
                // Converter código Excel para data corretamente
                // Excel serial date: número de dias desde 1/1/1900
                const baseExcelDate = new Date(1900, 0, 1); // 1º janeiro de 1900
                const excelDate = new Date(baseExcelDate.getTime() + (mesAtualOrcamento - 2) * 24 * 60 * 60 * 1000);
                console.log(`Data convertida do código Excel ${mesAtualOrcamento}:`, excelDate);
                
                // Primeiro dia do mês da data convertida
                const primeiroDiaAtual = new Date(excelDate.getFullYear(), excelDate.getMonth(), 1);
                
                // Mês anterior (primeiro dia)
                const dataAnterior = new Date(primeiroDiaAtual.getFullYear(), primeiroDiaAtual.getMonth() - 1, 1);
                
                // Formatação para exibição
                mesAtualFormatado = `${primeiroDiaAtual.getFullYear()}-${String(primeiroDiaAtual.getMonth() + 1).padStart(2, '0')}`;
                mesAnteriorFormatado = `${dataAnterior.getFullYear()}-${String(dataAnterior.getMonth() + 1).padStart(2, '0')}`;
                
                // Calcular código Excel para mês anterior
                const excelDateAnterior = Math.floor((dataAnterior - baseExcelDate) / (1000 * 60 * 60 * 24)) + 2;
                mesAnteriorOrcamento = excelDateAnterior;
                
                console.log(`CONVERSÃO CORRIGIDA:`);
                console.log(`- Budget atual: ${mesAtualOrcamento} -> ${mesAtualFormatado} (data: ${primeiroDiaAtual.toISOString().split('T')[0]})`);
                console.log(`- Budget anterior: ${mesAnteriorOrcamento} -> ${mesAnteriorFormatado} (data: ${dataAnterior.toISOString().split('T')[0]})`);
            } else {
                // Códigos de orçamento padrão (mantém compatibilidade)
                mesAtualOrcamento = 45870;  // Agosto/2025
                mesAnteriorOrcamento = 45839;  // Julho/2025
                
                // Formatação para exibição
                mesAtualFormatado = '2025-08';
                mesAnteriorFormatado = '2025-07';
                
                console.log('Usando códigos padrão para compatibilidade');
            }
            
            //console.log(`Mês atual orçamento: ${mesAtualOrcamento}, Mês anterior orçamento: ${mesAnteriorOrcamento}`);
            //console.log(`Mês atual formatado: ${mesAtualFormatado}, Mês anterior formatado: ${mesAnteriorFormatado}`);
            
            // Resumos financeiros
            let receitasAtual = 0;
            let despesasAtual = 0;
            let receitasAnterior = 0;
            let despesasAnterior = 0;
            
            // Contadores para debug
            let lancamentosAtual = 0;
            let lancamentosAnterior = 0;
            let totalLinhasProcessadas = 0;
            
            // Processar cada linha de dados
            data.values.forEach((row, index) => {
                if (row.length >= 6) {
                    totalLinhasProcessadas++;
                    // Com valueRenderOption=UNFORMATTED_VALUE, valores vêm como números
                    const valor = typeof row[2] === 'number' ? row[2] : parseFloat(String(row[2]).replace(',', '.')) || 0;
                    const orcamento = row[5]; // Valor numérico no formato Excel
                    
                    // Log para debug das primeiras 10 linhas
                    if (index < 10) {
                        console.log(`Linha ${index}: valor=${valor}, orcamento=${orcamento}, mesAtual=${mesAtualOrcamento}, mesAnterior=${mesAnteriorOrcamento}, match: ${orcamento === mesAtualOrcamento ? 'ATUAL' : orcamento === mesAnteriorOrcamento ? 'ANTERIOR' : 'NENHUM'}`);
                    }
                    
                    // Mês atual
                    if (orcamento === mesAtualOrcamento) {
                        lancamentosAtual++;
                        if (valor > 0) {
                            receitasAtual += valor;
                        } else if (valor < 0) {
                            despesasAtual += Math.abs(valor);
                        }
                    }
                    // Mês anterior
                    else if (orcamento === mesAnteriorOrcamento) {
                        lancamentosAnterior++;
                        if (valor > 0) {
                            receitasAnterior += valor;
                        } else if (valor < 0) {
                            despesasAnterior += Math.abs(valor);
                        }
                    }
                }
            });
            
            console.log(`RESUMO DO PROCESSAMENTO:`);
            console.log(`- Total de linhas processadas: ${totalLinhasProcessadas}`);
            console.log(`- Lançamentos do mês atual (${mesAtualOrcamento}): ${lancamentosAtual}`);
            console.log(`- Lançamentos do mês anterior (${mesAnteriorOrcamento}): ${lancamentosAnterior}`);
            console.log(`- Receitas atual: ${receitasAtual}, Despesas atual: ${despesasAtual}`);
            console.log(`- Receitas anterior: ${receitasAnterior}, Despesas anterior: ${despesasAnterior}`);
            
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
            
            console.log(`Resultado financeiro: receitas=${receitasAtual}, despesas=${despesasAtual}, saldo=${saldoAtual}, periodo=${mesAtualFormatado}`);
            
            // Montar histórico único de descrição e categoria (colunas D e E)
            const historicoMap = {};
            data.values.forEach(row => {
                if (row.length >= 5) {
                    const descricao = String(row[3]).trim();
                    const categoria = String(row[4]).trim();
                    if (descricao) historicoMap[descricao] = categoria;
                }
            });
            const historicoLancamentos = Object.entries(historicoMap).map(([descricao, categoria]) => ({ descricao, categoria }));
            resultado.historicoLancamentos = historicoLancamentos;
            // Montar lista única de contas (coluna C, índice 2)
            const contasSet = new Set();
            data.values.forEach(row => {
                if (row.length > 2 && row[1] != null) {
                    contasSet.add(String(row[1]));
                }
            });
            resultado.contasSugeridas = Array.from(contasSet);
            // Calcula categorias mais gastas do mês atual
            const categoriasPorMes = {};
            data.values.forEach(row => {
                if (row.length >= 6) {
                    const valor = typeof row[2] === 'number' ? row[2] : parseFloat(String(row[2]).replace(',', '.')) || 0;
                    const categoria = String(row[4]).trim();
                    const orcamento = row[5];
                    if (valor < 0 && orcamento === mesAtualOrcamento && categoria) {
                        categoriasPorMes[categoria] = (categoriasPorMes[categoria] || 0) + Math.abs(valor);
                    }
                }
            });
            // Converte em array de objetos
            resultado.categorias = Object.entries(categoriasPorMes).map(([categoria, valor]) => ({ categoria, valor }));
            //console.log("Resultado do resumo financeiro com histórico e contas:", JSON.stringify(resultado, null, 2));
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