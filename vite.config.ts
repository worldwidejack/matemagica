import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'

/** Timbra il service worker con l'ora della build: ogni pubblicazione butta la cache della precedente. */
function timbraServiceWorker() {
  return {
    name: 'timbra-service-worker',
    apply: 'build' as const,
    closeBundle() {
      const file = fileURLToPath(new URL('./dist/sw.js', import.meta.url))
      const timbro = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
      writeFileSync(file, readFileSync(file, 'utf8').replace('matemagica-sviluppo', `matemagica-${timbro}`))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), timbraServiceWorker()],
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
