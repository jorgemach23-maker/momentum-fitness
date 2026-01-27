import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Forzando un reinicio para limpiar la caché de los archivos de traducción (JSON).
export default defineConfig({
  plugins: [react()],
})
