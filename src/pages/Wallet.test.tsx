import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Wallet from "./Wallet";
import { formatIDR } from "@/context/AppContext";

const walletGetMock = vi.fn();
const walletSetAutoRenewMock = vi.fn();
const walletRecapPdfMock = vi.fn();
const walletSummaryMock = vi.fn();
const walletLedgerMock = vi.fn();
const commissionsMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    wallet: {
      get: (...args: unknown[]) => walletGetMock(...args),
      setAutoRenew: (...args: unknown[]) => walletSetAutoRenewMock(...args),
      recapPdf: (...args: unknown[]) => walletRecapPdfMock(...args),
    },
    affiliateV1: {
      walletSummary: (...args: unknown[]) => walletSummaryMock(...args),
      walletLedger: (...args: unknown[]) => walletLedgerMock(...args),
      commissions: (...args: unknown[]) => commissionsMock(...args),
    },
  },
  getErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

vi.mock("@/context/AppContext", async () => {
  const actual = await vi.importActual<typeof import("@/context/AppContext")>("@/context/AppContext");
  return {
    ...actual,
    useApp: () => ({
      user: {
        id: "user-1",
        name: "Tester",
        wa: "0800000000",
        membershipActive: true,
        autoRenewMembership: false,
        balance: 0,
      },
      refreshUser: vi.fn(),
    }),
  };
});

const LEGACY_WALLET = {
  summary: {
    totalCommission: 100_000,
    totalWithdrawnOrReserved: 20_000,
    totalWalletCredit: 0,
    totalWalletDebitOrReserved: 0,
    balance: 80_000,
  },
  autoRenew: { enabled: false, plan: null, canRenewWithBalance: false, nextRenewalAt: null },
  transactions: [],
};

function ledgerPage(items: unknown[], page = 1, totalPages = 1) {
  return { items, page, limit: 10, total: items.length, totalPages };
}

function commissionPage(items: unknown[], page = 1, totalPages = 1) {
  return { items, page, limit: 10, total: items.length, totalPages };
}

function renderWallet() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Wallet />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Wallet page", () => {
  beforeEach(() => {
    walletGetMock.mockReset();
    walletSetAutoRenewMock.mockReset();
    walletRecapPdfMock.mockReset();
    walletSummaryMock.mockReset();
    walletLedgerMock.mockReset();
    commissionsMock.mockReset();

    walletGetMock.mockResolvedValue(LEGACY_WALLET);
    walletLedgerMock.mockResolvedValue(ledgerPage([]));
    commissionsMock.mockResolvedValue(commissionPage([]));
  });

  it("uses the legacy balance as the headline, not the v1 ledger balance", async () => {
    // v1 balance (120000) intentionally differs from legacy (80000) here to prove the headline
    // stays legacy-sourced even when v1 reports a different number.
    walletSummaryMock.mockResolvedValue({ balance: 120_000, totalEarned: 130_000, totalReversed: 10_000, totalPaidOut: 0, currency: "IDR" });

    renderWallet();

    const balanceEl = await screen.findByTestId("wallet-balance");
    expect(balanceEl).toHaveTextContent(formatIDR(80_000).replace(/\s+/g, " "));
    expect(balanceEl).not.toHaveTextContent(formatIDR(120_000).replace(/\s+/g, " "));
  });

  it("renders v1 summary stats once resolved", async () => {
    walletSummaryMock.mockResolvedValue({ balance: 0, totalEarned: 130_000, totalReversed: 10_000, totalPaidOut: 5_000, currency: "IDR" });

    renderWallet();

    const summaryBlock = await screen.findByTestId("wallet-v1-summary-data");
    expect(summaryBlock).toHaveTextContent(formatIDR(130_000).replace(/\s+/g, " "));
    expect(summaryBlock).toHaveTextContent(formatIDR(10_000).replace(/\s+/g, " "));
    expect(summaryBlock).toHaveTextContent(formatIDR(5_000).replace(/\s+/g, " "));
  });

  it("shows loading skeletons for the v1 summary and ledger before data resolves", async () => {
    walletSummaryMock.mockReturnValue(new Promise(() => {}));
    walletLedgerMock.mockReturnValue(new Promise(() => {}));

    renderWallet();

    expect(await screen.findByTestId("wallet-v1-summary-loading")).toBeInTheDocument();
    expect(screen.getByTestId("wallet-v1-ledger-loading")).toBeInTheDocument();
  });

  it("shows an error state with a working retry button when the v1 ledger fails", async () => {
    walletSummaryMock.mockResolvedValue({ balance: 0, totalEarned: 0, totalReversed: 0, totalPaidOut: 0, currency: "IDR" });
    walletLedgerMock.mockRejectedValueOnce(new Error("down"));

    renderWallet();

    await screen.findByTestId("wallet-v1-ledger-error");
    expect(walletLedgerMock).toHaveBeenCalledTimes(1);

    walletLedgerMock.mockResolvedValueOnce(ledgerPage([
      { id: "l1", type: "COMMISSION_CREDIT", amount: 25_000, balanceAfter: 25_000, commissionId: "c1", withdrawRequestId: null, sourceType: "Payment", sourceId: "p1", note: null, createdAt: new Date().toISOString() },
    ]));
    fireEvent.click(screen.getByText("Coba lagi"));

    await screen.findByTestId("wallet-v1-ledger-list");
    expect(walletLedgerMock).toHaveBeenCalledTimes(2);
  });

  it("shows an empty state when the v1 ledger has no entries", async () => {
    walletSummaryMock.mockResolvedValue({ balance: 0, totalEarned: 0, totalReversed: 0, totalPaidOut: 0, currency: "IDR" });

    renderWallet();

    await screen.findByTestId("wallet-v1-ledger-empty");
  });

  it("displays a negative ledger balanceAfter without clamping or hiding the sign", async () => {
    walletSummaryMock.mockResolvedValue({ balance: -15_000, totalEarned: 10_000, totalReversed: 25_000, totalPaidOut: 0, currency: "IDR" });
    walletLedgerMock.mockResolvedValue(ledgerPage([
      {
        id: "l-neg",
        type: "REVERSAL_DEBIT",
        amount: -25_000,
        balanceAfter: -15_000,
        commissionId: "c1",
        withdrawRequestId: null,
        sourceType: "Payment",
        sourceId: "p1",
        note: "reversal",
        createdAt: new Date().toISOString(),
      },
    ]));

    renderWallet();

    const item = await screen.findByTestId("wallet-v1-ledger-item-l-neg");
    expect(item).toHaveTextContent(formatIDR(-25_000).replace(/\s+/g, " "));
    expect(item).toHaveTextContent(formatIDR(-15_000).replace(/\s+/g, " "));
  });

  it("paginates the v1 ledger via Muat lebih banyak, appending rather than replacing items", async () => {
    walletSummaryMock.mockResolvedValue({ balance: 0, totalEarned: 0, totalReversed: 0, totalPaidOut: 0, currency: "IDR" });
    walletLedgerMock.mockResolvedValueOnce(
      ledgerPage(
        [{ id: "l1", type: "COMMISSION_CREDIT", amount: 1000, balanceAfter: 1000, commissionId: null, withdrawRequestId: null, sourceType: null, sourceId: null, note: null, createdAt: new Date().toISOString() }],
        1,
        2,
      ),
    );

    renderWallet();

    await screen.findByTestId("wallet-v1-ledger-item-l1");
    const loadMoreButton = screen.getByTestId("wallet-v1-ledger-load-more");

    walletLedgerMock.mockResolvedValueOnce(
      ledgerPage(
        [{ id: "l2", type: "WITHDRAWAL_DEBIT", amount: -500, balanceAfter: 500, commissionId: null, withdrawRequestId: "w1", sourceType: null, sourceId: null, note: null, createdAt: new Date().toISOString() }],
        2,
        2,
      ),
    );
    fireEvent.click(loadMoreButton);

    await screen.findByTestId("wallet-v1-ledger-item-l2");
    expect(screen.getByTestId("wallet-v1-ledger-item-l1")).toBeInTheDocument();
    expect(walletLedgerMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("wallet-v1-ledger-load-more")).not.toBeInTheDocument();
  });

  it("switches to the Komisi tab and renders v1 commission data", async () => {
    walletSummaryMock.mockResolvedValue({ balance: 0, totalEarned: 0, totalReversed: 0, totalPaidOut: 0, currency: "IDR" });
    commissionsMock.mockResolvedValue(
      commissionPage([
        {
          id: "comm-1",
          paymentId: "pay-1",
          memberId: "member-1",
          orderType: "NEW",
          ratePercent: 10,
          grossAmount: 200_000,
          commissionAmount: 20_000,
          status: "PAID",
          availableAt: null,
          reversedAt: null,
          reversedReason: null,
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ]),
    );

    renderWallet();
    await screen.findByTestId("wallet-v1-ledger-empty");

    fireEvent.click(screen.getByTestId("wallet-v1-tab-komisi"));

    const item = await screen.findByTestId("wallet-v1-komisi-item-comm-1");
    expect(item).toHaveTextContent(formatIDR(20_000).replace(/\s+/g, " "));
    expect(item).toHaveTextContent("Dibayar");
  });

  it("never reads the legacy ReferralCommission-shaped transaction feed in the page source", () => {
    const source = readFileSync("src/pages/Wallet.tsx", "utf-8");
    expect(source).not.toContain("wallet?.transactions");
    expect(source).not.toContain("groupedTransactions");
    expect(source).not.toContain("WalletTransactionDto");
    expect(source).not.toContain("AffiliateWalletSummaryV1Card");
  });
});
