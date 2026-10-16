import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      // Il gioco, più la pagina di prova delle animazioni (/prova.html), che non tocca l'app.
      input: {
        gioco: fileURLToPath(new URL('./index.html', import.meta.url)),
        prova: fileURLToPath(new URL('./prova.html', import.meta.url)),
      },
    },
  },
})
