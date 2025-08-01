/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para provisionar (copiar) planilha template para o Drive do usuário
 * Este endpoint é chamado automaticamente após autorização OAuth ou manualmente
 */

routerAdd("POST", "/provision-sheet", (c) => {
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
            return c.json(404, { 
                "error": "Informações do Google não encontradas. Execute primeiro a autorização OAuth." 
            });
        }

        const accessToken = googleInfo.get("access_token");
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

        // Obter o ID do template das variáveis de ambiente
        const templateId = $os.getenv("SHEET_TEMPLATE_ID");
        if (!templateId) {
            console.log("SHEET_TEMPLATE_ID não configurado");
            return c.json(500, { 
                "error": "Template de planilha não configurado no sistema" 
            });
        }

        console.log(`Copiando template ${templateId} para usuário ${userId}`);

        // Preparar o corpo da requisição para copiar a planilha
        const copyRequestBody = JSON.stringify({
            "name": `Planilha Eh Tudo`
        });

        // Fazer requisição para copiar a planilha template
        const copyResponse = $http.send({
            url: `https://www.googleapis.com/drive/v3/files/${templateId}/copy`,
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: copyRequestBody
        });

        if (copyResponse.statusCode === 401) {
            // Token expirado, tentar renovar
            console.log("Token expirado, tentando renovar...");
            
            const refreshToken = googleInfo.get("refresh_token");
            if (!refreshToken) {
                return c.json(401, { 
                    "error": "Token expirado e refresh token não disponível. Execute novamente a autorização OAuth." 
                });
            }

            // Renovar token
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

            if (tokenResponse.statusCode !== 200) {
                console.log("Erro ao renovar token:", tokenResponse.json);
                return c.json(400, { 
                    "error": "Falha ao renovar token de acesso. Execute novamente a autorização OAuth." 
                });
            }

            // Atualizar token no banco
            const newTokenData = tokenResponse.json;
            const newAccessToken = newTokenData.access_token;
            googleInfo.set("access_token", newAccessToken);
            $app.save(googleInfo);

            // Tentar novamente com o novo token
            const retryResponse = $http.send({
                url: `https://www.googleapis.com/drive/v3/files/${templateId}/copy`,
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${newAccessToken}`,
                    "Content-Type": "application/json"
                },
                body: copyRequestBody
            });

            if (retryResponse.statusCode !== 200) {
                console.log("Erro ao copiar planilha após renovação de token:", retryResponse.json);
                return c.json(400, { 
                    "error": "Falha ao copiar planilha template. Verifique as permissões do Google Drive." 
                });
            }

            const copyData = retryResponse.json;
            const newSheetId = copyData.id;


            // Salvar o ID e o nome da nova planilha
            googleInfo.set("sheet_id", newSheetId);
            googleInfo.set("sheet_name", copyData.name || "Planilha Eh Tudo");
            $app.save(googleInfo);

            console.log(`Planilha copiada com sucesso: ${newSheetId} para usuário ${userId}`);

            return c.json(200, {
                "success": true,
                "message": "Planilha template copiada com sucesso para seu Google Drive!",
                "sheet_id": newSheetId,
                "sheet_name": copyData.name || `Planilha Eh Tudo`,
                "action": "created"
            });

        } else if (copyResponse.statusCode !== 200) {
            console.log("Erro ao copiar planilha:", copyResponse.json);
            const errorData = copyResponse.json;
            return c.json(copyResponse.statusCode, { 
                "error": `Falha ao copiar planilha template: ${errorData.error?.message || 'Erro desconhecido'}` 
            });
        }

        // Sucesso na primeira tentativa
        const copyData = copyResponse.json;
        const newSheetId = copyData.id;


        // Salvar o ID e o nome da nova planilha
        googleInfo.set("sheet_id", newSheetId);
        googleInfo.set("sheet_name", copyData.name || "Planilha Eh Tudo");
        $app.save(googleInfo);

        console.log(`Planilha copiada com sucesso: ${newSheetId} para usuário ${userId}`);

        // Corrigir mensagem para garantir nome válido
        const nomePlanilha = (copyData.name && copyData.name.trim()) ? copyData.name : 'Planilha Eh Tudo';
        return c.json(200, {
            "success": true,
            "message": `Planilha template copiada com sucesso para seu Google Drive! Planilha "${nomePlanilha}" criada.`,
            "sheet_id": newSheetId,
            "sheet_name": nomePlanilha,
            "action": "created"
        });

    } catch (error) {
        console.log("Erro interno ao provisionar planilha:", error);
        return c.json(500, { 
            "error": "Erro interno do servidor ao copiar planilha template" 
        });
    }
}, $apis.requireAuth());