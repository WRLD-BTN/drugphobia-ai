import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Bundle budget target: <1.5MB gzipped total, per the AI4I proposal's
// low-bandwidth requirement (2G, entry-level Android). Keep dependencies
// deliberately minimal — this is why there's no big UI kit here.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "DrugPhobia AI",
        short_name: "DrugPhobia AI",
        description: "Anonymous, multilingual harm-reduction support for Zimbabwean youth.",
        theme_color: "#12253f",
        background_color: "#f6f4ee",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // Cache the app shell + educational content (quiz, drug info, Did You
        // Know cards) so the platform is usable with zero connectivity —
        // only live chat and resource lookups need a live connection.
        globPatterns: ["**/*.{js,css,html,svg,png,json}"],
        runtimeCaching: [
          {
            urlPattern: /\/api\/(quiz|resources)/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "drugphobia-content-cache" },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:4000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: { chunkSizeWarningLimit: 500 },
});
