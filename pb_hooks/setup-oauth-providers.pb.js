/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para configurar provedores OAuth no PocketBase
 * Este hook é executado na inicialização do PocketBase
 */

onAfterBootstrap((e) => {
  const clientId = $os.getenv("GOOGLE_CLIENT_ID");
  const clientSecret = $os.getenv("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    console.log("[OAuth Setup] ⚠️  Variáveis de ambiente GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET não configuradas");
    console.log("[OAuth Setup] ℹ️  OAuth do Google não será habilitado. Configure as variáveis para habilitar.");
    return;
  }

  try {
    // Obtém a coleção de usuários
    const usersCollection = $app.findCollectionByNameOrId("users");
    
    if (!usersCollection) {
      console.log("[OAuth Setup] ❌ Coleção 'users' não encontrada");
      return;
    }

    // Configuração do provedor OAuth Google
    const googleProvider = {
      name: "google",
      clientId: clientId,
      clientSecret: clientSecret,
      authUrl: "https://accounts.google.com/o/oauth2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userApiUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
      displayName: "Google",
      enabled: true,
      pkce: false,
    };

    // Verifica se já existe configuração OAuth
    let authProviders = usersCollection.get("authProviders");
    
    if (!authProviders) {
      authProviders = {};
    }

    // Atualiza ou adiciona o provedor Google
    authProviders.google = googleProvider;
    
    // Salva a configuração
    usersCollection.set("authProviders", authProviders);
    $app.save(usersCollection);

    console.log("[OAuth Setup] ✅ Provedor OAuth Google configurado com sucesso");
    console.log("[OAuth Setup] 📋 Client ID:", clientId.substring(0, 20) + "...");
    
  } catch (error) {
    console.log("[OAuth Setup] ❌ Erro ao configurar OAuth:", error);
  }
});
