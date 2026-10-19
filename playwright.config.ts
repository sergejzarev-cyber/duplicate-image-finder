import { defineConfig } from "@playwright/test";

/**
 * E2E: npx playwright install chromium (один раз), затем:
 *   npm run build && npx playwright test
 * Против задеплоенного Vercel (там действуют заголовки из vercel.json):
 *   E2E_BASE_URL=https://xxx.vercel.app npx playwright test
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:4173",
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npx vite preview --port 4173 --strictPort",
        port: 4173,
        reuseExistingServer: !process.env.CI,
      },
  projects: [{ name: "chromium", use: {} }],
});
