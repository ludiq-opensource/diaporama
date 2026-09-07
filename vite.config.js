import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths: the static build works at the domain root or in any sub-folder
  base: './',
  plugins: [react()],
})
