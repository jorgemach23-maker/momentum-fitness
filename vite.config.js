import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Forzando un reinicio final del servidor de Vite.
export default defineConfig({
  plugins: [react()],
})
