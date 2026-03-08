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
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
}));
