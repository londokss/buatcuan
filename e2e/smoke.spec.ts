import { test, expect } from "@playwright/test";

test.describe("landing page", () => {
  test("loads and shows the hero headline", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("BUATCUAN");
    await expect(page.getByRole("link", { name: /masuk/i }).first()).toBeVisible();
  });
});

test.describe("login page", () => {
  test("renders the login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /masuk ke/i })).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /^masuk$/i })).toBeVisible();
  });

  test("shows a validation error when submitting an empty form", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: /^masuk$/i }).click();

    await expect(page.locator("#login-form").getByText(/nomor telepon wajib diisi/i)).toBeVisible();
  });
});
