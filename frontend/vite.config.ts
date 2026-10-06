import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      '.keenetic.link', // разрешает любые поддомены keenetic.link
      '.keenetic.pro',  // добавьте вашу доменную зону, если выбрали другую
      'all'             // или можно просто написать 'all', чтобы разрешить всё для теста
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/backend': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})