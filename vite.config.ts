import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteSourceLocator } from "@metagptx/vite-plugin-source-locator";
import { atoms } from "@metagptx/web-sdk/plugins";
import fs from "node:fs";

const DEV_TLS_KEY_PATH =
  "C:/Users/phelipp/Projetos/azzo-agenda/backend/azzo-agenda-pro/key.pem";
const DEV_TLS_CERT_PATH =
  "C:/Users/phelipp/Projetos/azzo-agenda/backend/azzo-agenda-pro/cert.pem";
// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: (() => {
    const atomPlugins = atoms();
    return [
      viteSourceLocator({
        prefix: "mgx",
      }),
      react(),
      ...(Array.isArray(atomPlugins) ? atomPlugins : [atomPlugins]),
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
