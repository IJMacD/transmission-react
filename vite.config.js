import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/transmission/web/',
  server: {
    proxy: {
      '/transmission/rpc': {
        target: 'http://192.168.64.117:9091',
        changeOrigin: true
      }
    }
  }
})
