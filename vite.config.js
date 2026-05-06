import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "icons";
          }
          return undefined;
        }
      }
    }
  },
  server: {
    proxy: {
      "/api/messages": {
        target: "https://generativelanguage.googleapis.com",
        changeOrigin: true,
        rewrite: () => "/v1beta/models/gemini-2.5-flash:generateContent",
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const apiKey = req.headers["x-api-key"];

            if (apiKey) {
              proxyReq.setHeader("x-goog-api-key", apiKey);
            }

            proxyReq.removeHeader("x-api-key");
            proxyReq.removeHeader("x-gemini-model");
          });
        }
      }
    }
  }
});
