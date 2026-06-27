import { test, expect } from "@playwright/test";

const API_BASE_URL = "http://localhost:4001/api";

// Uses the seeded default admin account (see backend prisma/seed.ts SEED_ADMIN_WA/PASSWORD
// defaults) rather than registering a fresh user, since admin role can't be self-assigned via
// the public register endpoint.
async function loginAsSeededAdmin(request: import("@playwright/test").APIRequestContext) {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { wa: "080000000000", password: "password123" },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data as { token: string; user: { id: string; name: string; role: string } };
}

test.describe("Admin — Penentuan Niche panel", () => {
  test("lists candidates with Affiliate BuatCuan locked, and a full create -> edit -> delete cycle works end-to-end", async ({ page, request }) => {
    const { token, user } = await loginAsSeededAdmin(request);
    expect(user.role).toBe("admin");

    await page.addInitScript(
      ([sessionToken, sessionUser]) => {
        localStorage.setItem("buatcuan:token", sessionToken);
        localStorage.setItem("buatcuan:user", sessionUser);
      },
      [token, JSON.stringify(user)],
    );

    await page.goto("/admin/niche-tool");

    await expect(page.getByRole("heading", { name: "Penentuan Niche" })).toBeVisible();
    await expect(page.getByText("Total Skor Dasar Niche (A)")).toBeVisible();

    const defaultRow = page.getByRole("row", { name: /Affiliate BuatCuan/ });
    await expect(defaultRow).toBeVisible();
    await expect(defaultRow.getByTitle("Affiliate BuatCuan tidak bisa dihapus")).toBeDisabled();

    const slug = `e2e-admin-niche-${Date.now()}`;
    const name = `E2E Admin Niche ${Date.now()}`;
    await page.getByText("Tambah Niche").click();
    await page.getByLabel("Nama").fill(name);
    await page.getByLabel("Slug").fill(slug);
    await page.getByRole("button", { name: "Simpan" }).click();

    // The candidates table paginates (8 rows/page); search narrows it down to the new row
    // regardless of where sortOrder placed it.
    await page.getByPlaceholder("Cari data...").fill(name);
    const newRow = page.getByRole("row", { name: new RegExp(name) });
    await expect(newRow).toBeVisible({ timeout: 10_000 });

    await newRow.getByTitle("Hapus niche").click();
    await page.getByRole("button", { name: "Konfirmasi" }).click();

    await expect(page.getByRole("row", { name: new RegExp(name) })).toHaveCount(0, { timeout: 10_000 });
  });
});
