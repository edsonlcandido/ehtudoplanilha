// pb_hooks/google_signin.pb.js
//
// Hook custom: valida o idToken do Google recebido do app Android e
// devolve um auth record do PocketBase (cria o user se nao existir).
//
// Rota: POST /api/custom/google-signin
// Body: { "idToken": "eyJhbGciOi..." }  (JWT do Google Identity Services)
//
// Pre-requisitos:
//  - No Google Cloud Console, OAuth client ID tipo "Web application"
//  - Variavel de ambiente GOOGLE_CLIENT_ID configurada no PB
//  - Collection "users" com o campo "email" unique

routerAdd("POST", "/custom/google-signin", async (c) => {
    const data = $apis.requestInfo(c).data || {};
    const idToken = data.idToken;
    if (!idToken) {
        throw new BadRequestError("idToken obrigatorio");
    }

    // 1) Valida o idToken direto com o Google via endpoint publico.
    //    Mais simples que incluir a lib google-auth-library no PB Go.
    const res = await $http.send({
        url: "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken),
        method: "GET",
        timeout: 10,
    });

    if (res.statusCode !== 200) {
        throw new BadRequestError("idToken invalido: " + res.statusCode);
    }

    const info = JSON.parse(res.raw);
    const email = (info.email || "").toLowerCase().trim();
    const emailVerified = info.email_verified === "true" || info.email_verified === true;
    const name = info.name || info.given_name || email.split("@")[0];
    const picture = info.picture || "";
    const googleSub = info.sub; // ID unico do Google

    if (!email || !emailVerified) {
        throw new BadRequestError("Email nao verificado pelo Google");
    }

    // 2) Verifica o audience (aud) - o token TEM que ser pro nosso client
    //    Isso evita alguem mandar um idToken de outro app nosso.
    const expectedAud = $os.getenv("GOOGLE_CLIENT_ID");
    if (expectedAud && info.aud !== expectedAud) {
        throw new BadRequestError("Token nao e deste app");
    }

    // 3) Procura user existente pelo email
    const usersCol = $app.dao().findCollectionByNameOrId("users");
    let user;
    try {
        user = $app.dao().findFirstRecordByData(usersCol, "email", email);
    } catch (e) {
        // Nao existe, vai criar
    }

    if (!user) {
        user = new Record(usersCol, {
            email: email,
            name: name,
            avatar: picture,
            emailVisibility: false,
            verified: true,
            // password random - nunca vai logar com isso, so via Google
            password: crypto.randomUUID() + crypto.randomUUID(),
        });
        $app.dao().saveRecord(user);
    } else {
        // Atualiza nome/avatar se mudou
        let changed = false;
        if (name && user.get("name") !== name) { user.set("name", name); changed = true; }
        if (picture && user.get("avatar") !== picture) { user.set("avatar", picture); changed = true; }
        if (changed) $app.dao().saveRecord(user);
    }

    // 4) Devolve o token de auth do PB
    return {
        token: user.tokenKey,
        record: user,
    };
}, $apis.requireGuestOnly());
