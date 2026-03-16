import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        timeout: 600000, // 10분으로 대폭 연장 (대용량 파일 분석 대응)
        proxyTimeout: 600000,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('[Proxy Error]', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // console.log('[Proxy Request]', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // console.log('[Proxy Response]', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
})
