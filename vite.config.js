import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/messages": {
        target: "https://api.anthropic.com",
        changeOrigin: true,
        rewrite: () => "/v1/messages",
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const apiKey = req.headers["x-api-key"];
            const anthropicVersion = req.headers["anthropic-version"];

            if (apiKey) {
              proxyReq.setHeader("x-api-key", apiKey);
            }

            proxyReq.setHeader(
              "anthropic-version",
              anthropicVersion || "2023-06-01"
            );
          });
        }
      }
    }
  }
});
