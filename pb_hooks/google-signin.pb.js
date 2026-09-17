// =====================================================================
// Hook: POST /api/custom/google-signin
//
// Valida um idToken do Google Sign-In (do play-services-auth no app
// Android) e devolve um PB auth token. Ponte entre Google (auth) e
// collection `users` do PB (dados).
//
// Fluxo:
//   1. App Android pega idToken via GoogleSignIn.getSignedInAccountFromIntent
//   2. App chama POST /api/custom/google-signin com { idToken }
//   3. Hook valida o token com Google (tokeninfo endpoint)
//   4. Hook acha/cria user na collection `users` pelo email
//   5. Hook gera PB auth token e devolve { token, record }
//
// Collection `users` esperada (nao precisa de password):
//   - email (text, required, unique)              ✓ default no PB
//   - username (text, optional - deduzido do email)
//   - name (text, optional - vem do Google se disponivel)
//   - avatar (url, optional - vem do Google)
//
// Variavel de ambiente (opcional, no PB Admin > Settings > Env):
//   GOOGLE_CLIENT_ANDROID_ID = "112797749973-d88gnelprhbe2m4pr9fn1fq6iq6oteig.apps.googleusercontent.com"
//   Fallback: GOOGLE_CLIENT_ID (aceito por compatibilidade)
//   Se nenhuma setada, usa o client_id hardcoded abaixo.
//
// IMPORTANTE: o client_id hardcoded aqui e' o MESMO que esta no
// key.properties do Android (BuildConfig.GOOGLE_WEB_CLIENT_ID).
// =====================================================================

routerAdd("POST", "/api/custom/google-signin", (e) => {
    // Try/catch GERAL envolve TUDO. Sem ele, qualquer exception vira
    // HTTP 500 generico e a mensagem real NAO aparece no console do
    // PB. Com ele, a gente ve exatamente onde e por que quebrou.
    try {
        // Declarado DENTRO do handler porque variaveis top-level NAO sao
        // visiveis no callback (cada handler cai num runtime separado do
        // pool do PB). Erro classico do JSVM do PB.
        const GOOGLE_CLIENT_ANDROID_ID = $os.getenv("GOOGLE_CLIENT_ANDROID_ID")
            || $os.getenv("GOOGLE_CLIENT_ID")
            || "112797749973-d88gnelprhbe2m4pr9fn1fq6iq6oteig.apps.googleusercontent.com";

        // -------- 1. Extrair idToken --------
        const body = e.requestInfo().body || {};
        const idToken = body.idToken;
        if (!idToken || typeof idToken !== "string") {
            throw new BadRequestError("idToken obrigatorio", { code: 400 });
        }
        console.log("[google-signin] Recebido idToken (len=" + idToken.length + ")");

        // -------- 2. Chamar Google tokeninfo --------
        // $http.send e' SINCRONO no JSVM do PB. NAO precisa de await/Promise.
        // timeout em segundos.
        //
        // DESDE A v0.27.0 (release notes + doc oficial):
        //   resp.body  = Uint8Array (BYTES, nao string) - e' SEMPRE assim
        //   resp.json  = objeto JS ja parseado (se Content-Type=application/json)
        //   toString(resp.body) = helper global pra converter bytes -> string
        //
        // ANTES (ate v0.26.x) existia resp.raw que ja era string. Foi soft-
        // deprecado justamente pq a conversao Go->JS string perdia bytes
        // binarios. Hoje o caminho certo e' SEMPRE via toString() ou .json.
        //
        // ERRO CLASSICO que eu jah cometi: concatenar resp.body direto
        // vira "123,10,32,32,..." (Array.toString()), ai JSON.parse falha
        // com "Unexpected token at the end: <nil>". Nao fazer isso.
        let resp;
        try {
            resp = $http.send({
                url: "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken),
                method: "GET",
                timeout: 30,
            });
        } catch (err) {
            console.log("[google-signin] $http.send EXCECAO: " + err.message);
            throw new BadRequestError("Falha HTTP ao chamar Google: " + err.message, { code: 502 });
        }
        console.log("[google-signin] Google respondeu status=" + (resp ? resp.statusCode : "null"));

        if (!resp || resp.statusCode !== 200) {
            // Loga o body como string pra debug (toString converte bytes)
            let bodyPreview = "";
            try { bodyPreview = toString(resp.body).substring(0, 300); } catch (e) {}
            throw new BadRequestError(
                "Google tokeninfo retornou status " + (resp ? resp.statusCode : "null")
                + ": " + bodyPreview,
                { code: 502 }
            );
        }

        // -------- 3. Parsear JSON --------
        // Caminho oficial: resp.json ja vem parseado (Content-Type do Google
        // e' application/json). Se nao vier objeto, fallback com toString
        // + JSON.parse pra mensagem de erro melhor.
        let googleInfo = null;
        if (resp.json && typeof resp.json === "object") {
            googleInfo = resp.json;
        } else {
            let bodyStr = "";
            try { bodyStr = toString(resp.body); } catch (e) {
                throw new BadRequestError("Google retornou body ilegivel: " + e.message, { code: 502 });
            }
            if (!bodyStr) {
                throw new BadRequestError("Google retornou body vazio", { code: 502 });
            }
            try {
                googleInfo = JSON.parse(bodyStr);
            } catch (err) {
                console.log("[google-signin] JSON.parse falhou: " + err.message
                    + ". body=" + bodyStr.substring(0, 300));
                throw new BadRequestError("Resposta do Google nao e JSON: " + err.message, { code: 502 });
            }
        }
        console.log("[google-signin] tokeninfo parseado. email=" + googleInfo.email
            + " aud=" + googleInfo.aud
            + " email_verified=" + googleInfo.email_verified);

        // -------- 4. Sanity checks do response do Google --------
        if (!googleInfo.email) {
            throw new BadRequestError("Token sem email", { code: 401 });
        }
        // email_verified vem como STRING "true" do Google, nao boolean
        if (googleInfo.email_verified !== "true") {
            throw new BadRequestError("Email nao verificado pelo Google", { code: 401 });
        }
        // aud: o client_id pra qual o token foi emitido. Se nao bater com
        // o nosso, e' token de outro app (phishing/replay attack)
        if (googleInfo.aud && googleInfo.aud !== GOOGLE_CLIENT_ANDROID_ID) {
            console.log("[google-signin] aud mismatch: " + googleInfo.aud + " vs " + GOOGLE_CLIENT_ANDROID_ID);
            throw new BadRequestError("Token emitido pra outro client_id", { code: 401 });
        }
        // exp: timestamp unix em segundos
        if (googleInfo.exp && parseInt(googleInfo.exp) * 1000 < Date.now()) {
            throw new BadRequestError("idToken expirado", { code: 401 });
        }

        // -------- 5. Achar/criar user na collection `users` --------
        // PB v0.23+ REMOVEU o `$app.dao()`: os metodos do Dao foram movidos
        // direto pro `$app`. A doc oficial (js-records) usa `$app.findXxx`:
        //   $app.dao().findCollectionByNameOrId("users")  -> $app.findCollectionByNameOrId("users")
        //   $app.dao().findFirstRecordByFilter(col, ...)  -> $app.findFirstRecordByFilter("users", ...)
        //   $app.dao().saveRecord(record)                 -> $app.save(record)
        // Alem disso, findFirstRecordByFilter recebe o NOME da collection
        // (string), nao o objeto collection, como primeiro argumento.
        // Erro classico: $app.dao().X() em PB >= 0.23 -> "Object has no member 'dao'".
        const usersCol = $app.findCollectionByNameOrId("users");
        let user;
        try {
            user = $app.findFirstRecordByFilter(
                "users",
                "email = {:email}",
                { email: googleInfo.email }
            );
            console.log("[google-signin] User encontrado por email: " + googleInfo.email);
        } catch (err) {
            // findFirstRecordByFilter lanca 404 se nao encontrar
            console.log("[google-signin] Nenhum user com esse email, vou criar");
            user = null;
        }

        if (!user) {
            try {
                // Cria novo user SEM password (auth so via Google)
                user = new Record(usersCol);
                user.set("email", googleInfo.email);
                // username = parte do email antes do @ (PB exige username unico
                // se o campo estiver marcado como required na collection)
                const username = googleInfo.email.split("@")[0].replace(/[^a-zA-Z0-9_.-]/g, "_");
                user.set("username", username);
                user.set("emailVisibility", true);
                user.set("verified", true);
                // name/avatar vem do Google se quiser setar (tokeninfo NAO
                // retorna mais; precisaria chamar userinfo endpoint)
                $app.save(user);
                console.log("[google-signin] User criado: " + googleInfo.email);
            } catch (err) {
                console.log("[google-signin] FALHA ao criar user: " + err.message);
                console.log("[google-signin] err.stack: " + (err.stack || "sem stack"));
                throw new BadRequestError(
                    "PB nao conseguiu criar user: " + err.message,
                    { code: 500 }
                );
            }
        }

        // -------- 6. Gerar PB auth token --------
        // PB v0.23+ REMOVEU o global `$tokens` junto com o `$app.dao()`. Os
        // metodos de geracao de token foram movidos pra dentro do proprio
        // Record. A doc oficial (js-records) diz:
        //   $tokens.recordAuthToken($app, record)  ->  record.newAuthToken()
        //   $tokens.recordVerifyToken($app, record) ->  record.newVerificationToken()
        //   $tokens.recordFileToken($app, record)   ->  record.newFileToken()
        //   $tokens.recordResetPasswordToken(...)   ->  record.newPasswordResetToken()
        //   $tokens.recordChangeEmailToken(rec,em)  ->  record.newEmailChangeToken(em)
        // Erro classico em PB >= 0.23: $tokens is not defined.
        let token;
        try {
            token = user.newAuthToken();
            console.log("[google-signin] Token gerado (len=" + token.length + ")");
        } catch (err) {
            console.log("[google-signin] FALHA ao gerar token: " + err.message);
            throw new BadRequestError(
                "PB nao conseguiu gerar token: " + err.message,
                { code: 500 }
            );
        }

        // -------- 7. Retornar resposta minimalista --------
        // O app Android ja tem email/avatar/name do Google (GoogleSignInAccount)
        // e o id do user vem embutido no JWT do PB (claim `sub`). O unico
        // dado que o app precisa do PB e' o proprio token. Resposta com
        // 1 campo = 0 problema de serializacao / emailVisibility / etc.
        console.log("[google-signin] SUCESSO total. Retornando 200 com token.");
        return e.json(200, { token: token });
    } catch (err) {
        // Catch GERAL - loga QUALQUER exception nao tratada, com stack.
        // Sem isso a gente fica cego quando quebra em lugar inesperado.
        console.log("[google-signin] EXCECAO NAO TRATADA: " + err.message);
        console.log("[google-signin] err.stack: " + (err.stack || "sem stack"));
        // Re-lanca como 500 pra nao esconder o erro do cliente
        throw new BadRequestError(
            "Erro no hook: " + err.message,
            { code: 500 }
        );
    }
});
