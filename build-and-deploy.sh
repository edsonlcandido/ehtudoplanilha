#!/bin/bash
# Script para buildar o código TypeScript/Vite e copiar para pb_public

set -e  # Para o script se algum comando falhar

echo "🔨 Buildando o projeto TypeScript/Vite..."

# Navega para o diretório src
cd "$(dirname "$0")/src"

# Verifica se node_modules existe, senão instala dependências
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependências..."
  npm install
fi

# Executa o build
echo "⚙️ Executando build..."
npm run build

# Volta para o diretório raiz
cd ..

# Backup do pb_public antigo (opcional)
if [ -d "pb_public_backup" ]; then
  echo "🗑️ Removendo backup antigo..."
  rm -rf pb_public_backup
fi

echo "💾 Fazendo backup do pb_public atual..."
cp -r pb_public pb_public_backup

# Remove conteúdo antigo de pb_public (exceto js e pwa)
echo "🧹 Limpando pb_public..."
find pb_public -mindepth 1 -maxdepth 1 ! -name 'js' ! -name 'pwa' -exec rm -rf {} +
# Limpa dentro de js mantendo apenas pocketbase.umd.js e o zip
if [ -d "pb_public/js" ]; then
  find pb_public/js -mindepth 1 -maxdepth 1 ! -name 'pocketbase.umd.js' ! -name 'js-sdk-master.zip' -exec rm -rf {} +
fi
# PWA é preservado completamente

# Copia o build para pb_public
echo "📋 Copiando arquivos buildados para pb_public..."
cp -r src/dist/* pb_public/

echo "✅ Build e deploy concluídos com sucesso!"
echo ""
echo "📂 Estrutura de pb_public:"
ls -lh pb_public/
echo ""
echo "🚀 Para iniciar o PocketBase, execute:"
echo "   ./iniciar-pb.sh"
