import { test, expect } from "@playwright/test";

const API_BASE_URL = "http://localhost:4001/api";

// Programmatic registration (instead of filling the register form) gives every test run a fresh,
// real member session without depending on any pre-seeded demo account.
async function registerFreshMember(request: import("@playwright/test").APIRequestContext) {
  const wa = `08${Date.now()}`.slice(0, 13);
  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: { name: "E2E Niche Tester", wa, password: "TestPass123!", termsAccepted: true },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data as { token: string; user: { id: string; name: string } };
}

test.describe("Alat Penentuan Niche v1 — happy path", () => {
  test("6 layar sampai Simpan sukses", async ({ page, request }) => {
    const { token, user } = await registerFreshMember(request);

    await page.addInitScript(
      ([sessionToken, sessionUser]) => {
        localStorage.setItem("buatcuan:token", sessionToken);
        localStorage.setItem("buatcuan:user", sessionUser);
      },
      [token, JSON.stringify(user)],
    );

    await page.goto("/app/niche-tool");

    // Layar 1: Affiliate BuatCuan sudah ke-pilih duluan.
    await expect(page.getByTestId("niche-jalur-option-AFFILIATE_BUATCUAN")).toHaveClass(/border-primary/);
    await page.getByTestId("niche-jalur-next").click();

    // Layar 2: 3 wajib + 2 opsional (minat & akses barang) tetap diisi di sini agar dites end-to-end
    // lewat backend asli — jalur tercepat (skip opsional) sudah dites lebih ringan lewat RTL.
    await page.getByTestId("niche-profil-modal-SEDANG").click();
    await page.getByTestId("niche-profil-waktu-SEDANG").click();
    await page.getByTestId("niche-profil-tampil-muka-OPSIONAL").click();
    await page.getByTestId("niche-profil-minat").fill("skincare");
    await page.getByTestId("niche-profil-akses-barang").click();
    await expect(page.getByTestId("niche-profil-next")).toBeEnabled();
    await page.getByTestId("niche-profil-next").click();

    // Layar 3: centang minimal 1 kandidat (Affiliate BuatCuan selalu tersedia di daftar).
    await page.getByTestId("niche-kandidat-list").waitFor();
    const firstCandidate = page.getByTestId("niche-kandidat-list").locator("button").first();
    await firstCandidate.click();
    await page.getByTestId("niche-kandidat-next").click();

    // Layar 4: Saringan Aman otomatis — lanjut manual agar tidak menunggu auto-advance.
    await page.getByTestId("niche-saringan-screen").waitFor();
    await page.getByTestId("niche-saringan-next").click();

    // Layar 5: skor personal, tunggu preview lampu muncul lalu lanjut.
    await page.locator('[data-testid^="niche-skor-card-"]').first().waitFor();
    await expect(page.locator('[data-testid^="niche-skor-lamp-"]').first()).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("niche-skor-next").click();

    // Layar 6: disclaimer baku wajib tampil, lalu simpan.
    await page.getByTestId("niche-hasil-preview").waitFor();
    await expect(page.getByTestId("niche-hasil-disclaimer")).toContainText(
      "Bukan janji hasil instan. Hasil tiap orang beda tergantung praktik, konsistensi, kualitas konten, dan respons audiens.",
    );
    await page.getByTestId("niche-hasil-save").click();

    await expect(page.getByTestId("niche-hasil-saved")).toBeVisible({ timeout: 15_000 });
  });
});
