import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8080',
      '/accounts': 'http://localhost:8081',
      '/category': 'http://localhost:8083',
      '/categories': 'http://localhost:8083',
      '/transactions': 'http://localhost:8082',
    },
  },
})
