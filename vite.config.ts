import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multi-page build: real documents for CSP isolation
// / -> landing, /app -> scanner, /feedback, /verify
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
        en: path.resolve(__dirname, "en.html"),
        ru: path.resolve(__dirname, "ru.html"),
        app: path.resolve(__dirname, "app.html"),
        feedback: path.resolve(__dirname, "feedback.html"),
        verify: path.resolve(__dirname, "verify.html"),
      },
    },
  },
  worker: {
    format: "es",
  },
});
