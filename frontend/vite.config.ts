import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    /*
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
    }
    */
    proxy: {
      '/api': {
        target: 'https://hellool003.pythonanywhere.com/', // 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/static': {
        target: 'https://hellool003.pythonanywhere.com/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/static/, '/static')
      },
    }
  }
})
