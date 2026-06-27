import { test, expect } from "@playwright/test";

const overclaimBlacklist = [
  "pasti cuan",
  "pasti viral",
  "pasti fyp",
  "dijamin berhasil",
  "cepat kaya",
  "langsung kaya",
  "balik modal pasti",
  "passive income otomatis",
  "100% aman",
  "saldo masuk tiap hari",
  "komisi pasti cair",
  "langsung cuan",
];

test.describe("landing page compliance + hero polish (v3)", () => {
  test("closing CTA reads 'Mulai GRATIS Sekarang' and points at the free registration route", async ({ page }) => {
    await page.goto("/");

    const closingCta = page.getByRole("link", { name: "Mulai GRATIS Sekarang" }).last();
    await expect(closingCta).toBeVisible();
    await expect(closingCta).toHaveAttribute("href", /^\/register/);
  });

  test("does not contain any blacklisted overclaim phrase anywhere on the page", async ({ page }) => {
    await page.goto("/");

    const bodyText = (await page.locator("body").innerText()).toLowerCase();
    for (const phrase of overclaimBlacklist) {
      expect(bodyText).not.toContain(phrase);
    }
  });

  test("footer legal links resolve to real pages, not 404", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");

    for (const [name, path] of [
      ["Syarat & Ketentuan", "/terms"],
      ["Kebijakan Privasi", "/privacy"],
      ["Kebijakan Refund", "/refund-policy"],
      ["Aturan Affiliate/Komisi", "/affiliate-rules"],
      ["FAQ", "/faq"],
    ] as const) {
      await expect(footer.getByRole("link", { name })).toHaveAttribute("href", path);
    }

    await footer.getByRole("link", { name: "Aturan Affiliate/Komisi" }).click();
    await expect(page).toHaveURL(/\/affiliate-rules$/);
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("404");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Affiliate/i);
  });

  test("renders responsively on a small mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /Mulai PRO/i }).first()).toBeVisible();
    const heroBox = await page.getByRole("heading", { level: 1 }).boundingBox();
    expect(heroBox?.width ?? 0).toBeLessThanOrEqual(360);
  });

  test("hero background falls back to a static, non-video element when no video is configured", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("video[data-testid='hero-bg-video']")).toHaveCount(0);
    const fallback = page.locator("[data-testid='hero-bg-fallback-gradient'], [data-testid='hero-bg-fallback-image']");
    await expect(fallback.first()).toBeAttached();
  });

  test("hero animation is disabled when the user prefers reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const glowRing = page.locator(".motion-safe\\:animate-pulse-glow-brand");
    if (await glowRing.count()) {
      await expect(glowRing.first()).toHaveCSS("animation-name", "none");
    }
  });
});
