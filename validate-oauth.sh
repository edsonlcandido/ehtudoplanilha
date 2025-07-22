#!/bin/bash

# Script de validação para a implementação do Google OAuth

echo "🔍 Validando implementação do Google OAuth..."

# Verificar se os arquivos necessários existem
echo "📁 Verificando arquivos..."

required_files=(
    "pb_hooks/google-redirect.pb.js"
    "pb_hooks/README.md"
    ".env.example"
    "pb_public/oauth-test.html"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        missing_files+=("$file")
    else
        echo "  ✓ $file"
    fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo "❌ Arquivos faltando:"
    for file in "${missing_files[@]}"; do
        echo "  ✗ $file"
    done
    exit 1
fi

# Verificar sintaxe JavaScript
echo "📝 Verificando sintaxe JavaScript..."
if node -c pb_hooks/google-redirect.pb.js 2>/dev/null; then
    echo "  ✓ Sintaxe JavaScript válida"
else
    echo "  ❌ Erro de sintaxe JavaScript"
    exit 1
fi

# Verificar se Dockerfile foi atualizado
echo "🐳 Verificando Dockerfile..."
if grep -q "COPY ./pb_hooks" Dockerfile; then
    echo "  ✓ Dockerfile atualizado para incluir pb_hooks"
else
    echo "  ❌ Dockerfile não foi atualizado"
    exit 1
fi

# Verificar variáveis de ambiente no .env.example
echo "🔧 Verificando variáveis de ambiente..."
required_env_vars=(
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "GOOGLE_REDIRECT_URI"
)

for var in "${required_env_vars[@]}"; do
    if grep -q "$var" .env.example; then
        echo "  ✓ $var definido em .env.example"
    else
        echo "  ❌ $var não encontrado em .env.example"
        exit 1
    fi
done

# Verificar endpoints no hook
echo "🔗 Verificando endpoints..."
if grep -q "routerAdd.*google-oauth-callback" pb_hooks/google-redirect.pb.js; then
    echo "  ✓ Endpoint /google-oauth-callback definido"
else
    echo "  ❌ Endpoint /google-oauth-callback não encontrado"
    exit 1
fi

if grep -q "routerAdd.*google-refresh-token" pb_hooks/google-redirect.pb.js; then
    echo "  ✓ Endpoint /google-refresh-token definido"
else
    echo "  ❌ Endpoint /google-refresh-token não encontrado"
    exit 1
fi

# Verificar se usa APIs corretas do PocketBase
echo "🔌 Verificando APIs do PocketBase..."
pb_apis=(
    "\$app\.dao\(\)"
    "\$http\.send"
    "\$os\.getenv"
    "google_infos"
)

for api in "${pb_apis[@]}"; do
    if grep -q "$api" pb_hooks/google-redirect.pb.js; then
        echo "  ✓ Usando $api"
    else
        echo "  ❌ API $api não encontrada"
        exit 1
    fi
done

echo ""
echo "✅ Todas as validações passaram!"
echo "🚀 A implementação do Google OAuth está pronta para uso."
echo ""
echo "📋 Próximos passos:"
echo "  1. Configure as variáveis de ambiente baseadas em .env.example"
echo "  2. Configure o projeto no Google Cloud Console"
echo "  3. Teste usando oauth-test.html"
echo "  4. Integre com o frontend existente"