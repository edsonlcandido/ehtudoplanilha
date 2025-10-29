import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  // estava: path.resolve(__dirname, 'pb_public') — causava pb_public/pb_public
  root: path.resolve(__dirname),
  server: {
    port: 5173
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: path.resolve(__dirname, 'dev'),
    emptyOutDir: true,
    rollupOptions: {
      // se quiser controlar entradas específicas por página, adicione aqui
    }
  }
})