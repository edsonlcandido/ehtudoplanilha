#!/bin/bash
# Script para iniciar PocketBase carregando variáveis do .env

# Carrega variáveis do arquivo .env
if [ -f "$(dirname "$0")/.env" ]; then
  set -o allexport
  source "$(dirname "$0")/.env"
  set +o allexport
  echo "✅ Variáveis de ambiente carregadas de .env"
else
  echo "⚠️ Arquivo .env não encontrado"
fi

# Inicia o PocketBase
echo "🚀 Iniciando PocketBase..."
./pocketbase serve --dev