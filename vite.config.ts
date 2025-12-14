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
      host: "0.0.0.0", // Listen on all network interfaces
      port: 5173,
      strictPort: false, // Allow port to be changed if 5173 is busy
      proxy: {
        // Proxy /v1 requests to the staging API during local development to avoid CORS
        "/v1": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:4000",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/v1/, "/v1"),
        },
      },
    },
  };
});
