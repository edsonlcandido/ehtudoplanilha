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

    // -------- 2. Chamar Google tokeninfo --------
    // $http.send e' SINCRONO no JSVM do PB - retorna direto
    // { statusCode, headers, body, raw }. NAO precisa de await/Promise.
    // timeout em segundos (10 era curto pra chamadas cross-region).
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

    // Log do response pra debug (sai no console do PB)
    const respBody = (resp && resp.body) ? resp.body : "";
    console.log("[google-signin] Google respondeu status=" + (resp ? resp.statusCode : "null")
        + " body_len=" + respBody.length);

    if (!resp || resp.statusCode !== 200) {
        throw new BadRequestError(
            "Google tokeninfo retornou status " + (resp ? resp.statusCode : "null")
            + ": " + respBody.substring(0, 200),
            { code: 502 }
        );
    }
    if (!respBody) {
        throw new BadRequestError("Google retornou body vazio", { code: 502 });
    }

    // -------- 3. Parsear JSON --------
    let googleInfo;
    try {
        googleInfo = JSON.parse(respBody);
    } catch (err) {
        console.log("[google-signin] JSON.parse falhou: " + err.message
            + ". body=" + respBody.substring(0, 300));
        throw new BadRequestError("Resposta do Google nao e JSON: " + err.message, { code: 502 });
    }

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
    const usersCol = $app.dao().findCollectionByNameOrId("users");
    let user;
    try {
        user = $app.dao().findFirstRecordByFilter(
            usersCol,
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
            $app.dao().saveRecord(user);
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
    let token;
    try {
        // generateAuthToken retorna o token JWT-like do PB. O user fica
        // logado no PB ate o token expirar (configuravel no Admin).
        token = $tokens.generateAuthToken(user);
        console.log("[google-signin] Token gerado (len=" + token.length + ")");
    } catch (err) {
        console.log("[google-signin] FALHA ao gerar token: " + err.message);
        throw new BadRequestError(
            "PB nao conseguiu gerar token: " + err.message,
            { code: 500 }
        );
    }

    return e.json(200, {
        token: token,
        record: user.publicExport(),
    });
});
