import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function apiProxy() {
  return {
    target: 'http://localhost:3000',
    bypass(req) {
      if (req.headers.accept?.includes('text/html')) {
        return '/index.html'
      }

      return null
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': apiProxy(),
      '/health': apiProxy(),
      '/products': apiProxy(),
      '/cart': apiProxy(),
      '/addresses': apiProxy(),
      '/orders': apiProxy(),
      '/admin': apiProxy(),
      '/stripe': apiProxy(),
      '/uploads': apiProxy(),
    },
  },
})
