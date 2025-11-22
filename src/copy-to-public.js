/**
 * Script para copiar arquivos do dist para pb_public
 * Preserva a pasta pwa existente
 */

import { cpSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = resolve(__dirname, 'dist');
const pbPublicDir = resolve(__dirname, '..', 'pb_public');

console.log('📦 Copiando arquivos para pb_public...');
console.log(`   Origem: ${distDir}`);
console.log(`   Destino: ${pbPublicDir}`);

try {
  // Verifica se a pasta dist existe
  if (!existsSync(distDir)) {
    console.error('❌ Pasta dist não encontrada. Execute npm run build primeiro.');
    process.exit(1);
  }

  // Lista todos os itens em dist
  const items = readdirSync(distDir);

  // Copia cada item, exceto pwa
  items.forEach(item => {
    if (item === 'pwa') {
      console.log(`⏭️  Pulando pasta pwa (será preservada no destino)`);
      return;
    }

    const srcPath = join(distDir, item);
    const destPath = join(pbPublicDir, item);

    console.log(`   Copiando ${item}...`);
    cpSync(srcPath, destPath, { recursive: true, force: true });
  });

  // Se existir dist/pwa, copia conteúdo para dentro de pb_public/pwa
  const distPwaDir = join(distDir, 'pwa');
  const pbPublicPwaDir = join(pbPublicDir, 'pwa');

  if (existsSync(distPwaDir)) {
    console.log(`   Atualizando conteúdo em pwa/...`);
    cpSync(distPwaDir, pbPublicPwaDir, { recursive: true, force: true });
  }

  console.log('✅ Arquivos copiados com sucesso!');
} catch (error) {
  console.error('❌ Erro ao copiar arquivos:', error.message);
  process.exit(1);
}
