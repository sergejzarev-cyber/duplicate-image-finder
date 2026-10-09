import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MPA: / (index.html), /app, /feedback, /verify — отдельные документы.
// Без vite-plugin-singlefile: у /app строгий CSP (script-src 'self'),
// поэтому JS/CSS грузятся отдельными файлами, а не инлайнятся.
// Картинки (демо-набор) инлайнятся как data-URI через assetsInlineLimit,
// т.к. у /app img-src разрешает только blob: и data:.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        app: path.resolve(__dirname, "app.html"),
        feedback: path.resolve(__dirname, "feedback.html"),
        verify: path.resolve(__dirname, "verify.html"),
      },
    },
    assetsInlineLimit: 15 * 1024 * 1024,
  },
  define: {
    __COMMIT__: JSON.stringify(
      process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "dev"
    ),
  },
});
