import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    server: {
      port: 5173,
      proxy: {
        // Proxy /v1 requests to the staging API during local development to avoid CORS
        "/v1": {
          target: env.VITE_API_PROXY_TARGET || "https://api-dev.saby.ai",
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
