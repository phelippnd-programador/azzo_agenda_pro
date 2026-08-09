import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { viteSourceLocator } from "@metagptx/vite-plugin-source-locator";
import { atoms } from "@metagptx/web-sdk/plugins";
import fs from "node:fs";

// Grava public/version.json com o timestamp do build atual
function viteVersionPlugin() {
  return {
    name: "vite-version-plugin",
    buildStart() {
      const version = { buildTime: Date.now() };
      fs.writeFileSync(
        path.resolve(__dirname, "public/version.json"),
        JSON.stringify(version),
      );
    },
  };
}

const DEV_TLS_KEY_PATH =
  "C:/Users/phelipp/Projetos/azzo-agenda/backend/azzo-agenda-pro/key.pem";
const DEV_TLS_CERT_PATH =
  "C:/Users/phelipp/Projetos/azzo-agenda/backend/azzo-agenda-pro/cert.pem";
// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: (() => {
    const isDev = command === "serve";
    // SEC-006/SEC-009: as ferramentas de editor visual do MetaGPT/Lovable
    // (viteSourceLocator + atoms) arrastam uma cadeia de build vulneravel
    // (rollup-plugin-terser -> serialize-javascript). Sao apenas dev tooling,
    // entao so entram no dev-server; o build de producao nunca as inclui.
    const devOnlyPlugins = isDev
      ? (() => {
          const atomPlugins = atoms();
          return [
            viteSourceLocator({ prefix: "mgx" }),
            ...(Array.isArray(atomPlugins) ? atomPlugins : [atomPlugins]),
          ];
        })()
      : [];
    return [
      react(),
      VitePWA({
        registerType: "prompt",
        includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png"],
        manifest: false,
        workbox: {
          // navigateFallback é o "app shell" servido para navegações (F5, URL
          // direta) quando não há match direto no precache — TEM que ser o
          // index.html real, nunca a offline.html. Apontar para offline.html
          // faz o service worker responder toda navegação com a tela de
          // "sem conexão", mesmo com internet normal.
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,json}"],
          globIgnores: ["images/**"],
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) => {
                if (request.method !== "GET") return false;
                if (!url.pathname.startsWith("/api/")) return false;
                return !/^\/api\/v1\/(auth|billing|finance|users|salon\/profile|admin|auditoria|lgpd)/.test(url.pathname);
              },
              handler: "NetworkFirst",
              options: {
                cacheName: "azzo-api-readonly",
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 60 * 60,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
      viteVersionPlugin(),
      ...devOnlyPlugins,
    ];
  })(),
  server: {
    watch: { usePolling: true, interval: 800 /* 300~1500 */ },
    https:
      command === "serve" &&
      fs.existsSync(DEV_TLS_KEY_PATH) &&
      fs.existsSync(DEV_TLS_CERT_PATH)
        ? {
            key: fs.readFileSync(DEV_TLS_KEY_PATH),
            cert: fs.readFileSync(DEV_TLS_CERT_PATH),
          }
        : undefined,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("react-router-dom")) return "vendor-router";
          if (id.includes("@tanstack/react-query") || id.includes("zustand")) {
            return "vendor-data";
          }
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (
            id.includes("framer-motion") ||
            id.includes("embla-carousel-react") ||
            id.includes("vaul")
          ) {
            return "vendor-motion";
          }
          if (
            id.includes("react-hook-form") ||
            id.includes("@hookform/resolvers") ||
            id.includes("zod")
          ) {
            return "vendor-forms";
          }
          if (id.includes("react-day-picker") || id.includes("date-fns")) {
            return "vendor-calendar";
          }
          if (id.includes("sonner")) return "vendor-feedback";
          if (id.includes("axios")) return "vendor-network";
          if (id.includes("@supabase/supabase-js")) return "vendor-supabase";

          if (id.includes("recharts")) return "vendor-charts";
          if (id.includes("qrcode")) return "vendor-qrcode";
          if (
            id.includes("react-markdown") ||
            id.includes("remark-gfm") ||
            id.includes("rehype-sanitize") ||
            id.includes("prismjs")
          ) {
            return "vendor-markdown";
          }
          return undefined;
        },
      },
    },
  },
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
}));
