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
          target: env.VITE_API_PROXY_TARGET || "https://api.saby.ai",
          changeOrigin: true,
          secure: true, // Use true for HTTPS
          ws: false, // Disable WebSocket proxying
          timeout: 30000, // 30 second timeout
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.error("[Vite Proxy] Error:", err.message);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log(
                "[Vite Proxy]",
                req.method,
                req.url,
                "→",
                proxyReq.path
              );
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log(
                "[Vite Proxy] Response:",
                proxyRes.statusCode,
                "for",
                req.url
              );
            });
          },
        },
      },
    },
  };
});
