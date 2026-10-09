import { test, expect } from "@playwright/test";

const isLocalhost = (baseURL: string | undefined) =>
  !baseURL || baseURL.includes("localhost") || baseURL.includes("127.0.0.1");

test("GET /app returns strict CSP with connect-src 'none' (Vercel only)", async ({
  request,
  baseURL,
}) => {
  test.skip(
    isLocalhost(baseURL),
    "CSP-заголовки задаёт Vercel (vercel.json) — локальный preview их не отдаёт. Запуск: E2E_BASE_URL=https://xxx.vercel.app npx playwright test"
  );
  const res = await request.get("/app");
  expect(res.ok()).toBeTruthy();
  const csp = res.headers()["content-security-policy"] ?? "";
  expect(csp).toContain("connect-src 'none'");
  expect(csp).toContain("default-src 'none'");
});

test("demo scan: meter shows 0, no CSP violations", async ({ page }) => {
  const cspErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && /Content-Security-Policy|CSP/i.test(msg.text())) {
      cspErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    if (/Content-Security-Policy|CSP/i.test(String(err))) cspErrors.push(String(err));
  });
  await page.goto("/app?demo=1");
  await expect(page.getByText("0 Netzwerkanfragen seit Scan-Start")).toBeVisible({
    timeout: 30000,
  });
  expect(cspErrors).toEqual([]);
});

test("negative: fetch('https://example.com') is blocked (proves policy is active)", async ({
  page,
  baseURL,
}) => {
  test.skip(
    isLocalhost(baseURL),
    "Без CSP-заголовков Vercel fetch не блокируется — негативный тест только против деплоя"
  );
  await page.goto("/app");
  const result = await page.evaluate(async () => {
    try {
      await fetch("https://example.com/");
      return "allowed";
    } catch (e) {
      return e instanceof TypeError ? "blocked" : `error:${String(e)}`;
    }
  });
  expect(result).toBe("blocked");
});

test("offline: demo scan still completes", async ({ page, context }) => {
  await page.goto("/app");
  await context.setOffline(true);
  try {
    // Кнопка демо на стартовом экране (in-page, без навигации — навигация офлайн невозможна)
    await page.getByRole("button", { name: /Demo ausprobieren/ }).click();
    await expect(page.getByText("0 Netzwerkanfragen seit Scan-Start")).toBeVisible({
      timeout: 30000,
    });
  } finally {
    await context.setOffline(false);
  }
});
