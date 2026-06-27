import { test, expect } from "@playwright/test";

const API_BASE_URL = "http://localhost:4001/api";

// Programmatic registration gives every run a fresh member with zero history, so the v1
// ledger/commission sections are guaranteed to render their empty states deterministically.
async function registerFreshMember(request: import("@playwright/test").APIRequestContext) {
  const wa = `08${Date.now()}`.slice(0, 13);
  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: { name: "E2E Wallet Tester", wa, password: "TestPass123!", termsAccepted: true },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data as { token: string; user: { id: string; name: string } };
}

test.describe("Wallet v1 source-of-truth — happy path", () => {
  test("hero balance, v1 summary stats, and Ledger/Komisi tabs render for a fresh member", async ({ page, request }) => {
    const { token, user } = await registerFreshMember(request);

    await page.addInitScript(
      ([sessionToken, sessionUser]) => {
        localStorage.setItem("buatcuan:token", sessionToken);
        localStorage.setItem("buatcuan:user", sessionUser);
      },
      [token, JSON.stringify(user)],
    );

    await page.goto("/app/wallet");

    // Hero card — still legacy-sourced, unaffected by the v1 migration.
    await expect(page.getByText("Saldo tersedia")).toBeVisible();
    await expect(page.getByTestId("wallet-balance")).toBeVisible();

    // v1 history card replacing the old "Transaksi" feed.
    await expect(page.getByText("Riwayat (v1)")).toBeVisible();
    await expect(page.getByTestId("wallet-v1-summary-data")).toBeVisible({ timeout: 10_000 });

    // Default tab: Ledger, empty for a brand-new member.
    await expect(page.getByTestId("wallet-v1-ledger-empty")).toBeVisible({ timeout: 10_000 });

    // Switch to Komisi tab — also empty for a brand-new member.
    await page.getByTestId("wallet-v1-tab-komisi").click();
    await expect(page.getByTestId("wallet-v1-komisi-empty")).toBeVisible({ timeout: 10_000 });
  });
});
