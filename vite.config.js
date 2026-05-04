import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget =
    env.VITE_PROXY_TARGET?.trim() ||
    env.VITE_API_URL?.trim() ||
    'http://127.0.0.1:3001'

  const apiProxy = {
    '/auth': { target: apiTarget, changeOrigin: true },
    '/cart': { target: apiTarget, changeOrigin: true },
    '/products': { target: apiTarget, changeOrigin: true },
    '/health': { target: apiTarget, changeOrigin: true },
  }

  return {
    plugins: [react()],
    server: {
      port: Number(process.env.E2E_WEB_PORT || 5173),
      strictPort: Boolean(process.env.E2E_WEB_PORT),
      proxy: apiProxy,
    },
    preview: {
      proxy: apiProxy,
    },
  }
})
