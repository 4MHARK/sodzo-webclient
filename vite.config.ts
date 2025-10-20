import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      // Proxy /v1 requests to the staging API during local development to avoid CORS
      '/v1': {
        target: 'https://api-staging.saby.ai',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/v1/, '/v1'),
      },
    },
  },
});
