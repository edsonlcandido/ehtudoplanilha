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
            
            //console.log(`Total de linhas encontradas: ${data.values.length}`);
            
            // ==== PARSING DO QUERY PARAM 'orcamento' (mês base) ====
            // Aceita:
            //  - Serial Excel (ex: 45870)
            //  - AAAA-MM (ex: 2025-08) -> assume dia 01
            //  - AAAA-MM-DD (ex: 2025-08-01)
            const query = c.requestInfo().query || {};
            const orcamentoParam = query['orcamento'];
            const includeEntries = query['include_entries'] === 'true';
            const entriesLimit = parseInt(query['entries_limit']) || 50;

            const excelEpochUTC = Date.UTC(1899, 11, 30); // 1899-12-30
            const toExcelSerial = (msUTC) => Math.floor((msUTC - excelEpochUTC) / 86400000);
            const fromYearMonth = (year, monthZeroIdx) => Date.UTC(year, monthZeroIdx, 1);

            const agora = new Date();

            let baseFirstDayUTC; // ms UTC do primeiro dia do mês selecionado
            let mesAtualFormatado; // AAAA-MM do mês base selecionado

            if (orcamentoParam) {
                const trimmed = String(orcamentoParam).trim();
                if (/^\d+$/.test(trimmed)) {
                    // Número puro -> tratamos como serial Excel diretamente (1º dia do mês)
                    const serial = parseInt(trimmed, 10);
                    if (serial < 10000 || serial > 100000) { // faixa simples para validar
                        return c.json(400, { error: "Parâmetro 'orcamento' serial Excel fora da faixa esperada" });
                    }
                    // Converter serial para msUTC
                    baseFirstDayUTC = excelEpochUTC + serial * 86400000;
                    const tmp = new Date(baseFirstDayUTC);
                    mesAtualFormatado = `${tmp.getUTCFullYear()}-${String(tmp.getUTCMonth() + 1).padStart(2, '0')}`;
                } else if (/^\d{4}-\d{2}$/.test(trimmed)) {
                    // AAAA-MM
                    const [anoStr, mesStr] = trimmed.split('-');
                    const year = parseInt(anoStr, 10);
                    const month = parseInt(mesStr, 10) - 1; // zero-based
                    baseFirstDayUTC = fromYearMonth(year, month);
                    mesAtualFormatado = `${year}-${mesStr}`;
                } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                    // AAAA-MM-DD -> pegamos ano e mês, ignorando dia
                    const [anoStr, mesStr] = trimmed.split('-');
                    const year = parseInt(anoStr, 10);
                    const month = parseInt(mesStr, 10) - 1;
                    baseFirstDayUTC = fromYearMonth(year, month);
                    mesAtualFormatado = `${year}-${mesStr}`;
                } else {
                    return c.json(400, { error: "Formato inválido para 'orcamento'. Use serial Excel ou AAAA-MM." });
                }
            } else {
                // Default: mês atual
                baseFirstDayUTC = fromYearMonth(agora.getUTCFullYear(), agora.getUTCMonth());
                mesAtualFormatado = `${agora.getUTCFullYear()}-${String(agora.getUTCMonth() + 1).padStart(2, '0')}`;
            }

            // Mês anterior ao base
            const baseDateObj = new Date(baseFirstDayUTC);
            const firstDayAnteriorUTC = fromYearMonth(baseDateObj.getUTCFullYear(), baseDateObj.getUTCMonth() - 1);

            const mesAtualOrcamento = toExcelSerial(baseFirstDayUTC);
            const mesAnteriorOrcamento = toExcelSerial(firstDayAnteriorUTC);

            const dataAnterior = new Date(firstDayAnteriorUTC);
            const mesAnteriorFormatado = `${dataAnterior.getUTCFullYear()}-${String(dataAnterior.getUTCMonth() + 1).padStart(2, '0')}`;
            
            //console.log(`Mês atual orçamento: ${mesAtualOrcamento}, Mês anterior orçamento: ${mesAnteriorOrcamento}`);
            //console.log(`Mês atual formatado: ${mesAtualFormatado}, Mês anterior formatado: ${mesAnteriorFormatado}`);
            
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
                "mesAtualSerial": mesAtualOrcamento,
                "mesAnteriorSerial": mesAnteriorOrcamento,
                "orcamentoParam": orcamentoParam || null,
                "totalLancamentosAtual": data.values.filter(row => 
                    row.length >= 6 && row[5] === mesAtualOrcamento
                ).length,
                "totalLancamentosAnterior": data.values.filter(row => 
                    row.length >= 6 && row[5] === mesAnteriorOrcamento
                ).length
            };
            
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
            
            // Incluir entradas recentes se solicitado
            if (includeEntries) {
                // Pular a primeira linha (cabeçalho) se existir
                const rows = data.values.slice(1);
                
                // Formatar entradas para exibição
                const entries = rows.map((row, index) => {
                    // Estrutura: [data, conta, valor, descrição, categoria, orçamento, obs]
                    return {
                        rowIndex: index + 2, // +2 porque skipamos cabeçalho e arrays são 0-based
                        data: row[0] || "",
                        conta: row[1] || "",
                        valor: row[2] || 0,
                        descricao: row[3] || "",
                        categoria: row[4] || "",
                        orcamento: row[5] || "",
                        obs: row[6] || ""
                    };
                });

                // Reverter para mostrar as mais recentes primeiro e limitar
                const recentEntries = entries.reverse().slice(0, entriesLimit);
                resultado.entries = recentEntries;
                resultado.totalEntries = rows.length;
                resultado.entriesLimit = entriesLimit;
            }
            
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