import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Download, Plus, Wallet as WalletIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatDate, formatIDR, useApp } from "@/context/AppContext";
import { useAffiliateWalletSummaryV1 } from "@/hooks/useAffiliateWalletSummaryV1";
import { useAffiliateWalletLedgerV1 } from "@/hooks/useAffiliateWalletLedgerV1";
import { useAffiliateCommissionsV1 } from "@/hooks/useAffiliateCommissionsV1";
import {
  api,
  getErrorMessage,
  type AffiliateCommissionStatusV1,
  type AffiliateCommissionV1Dto,
  type AffiliateWalletLedgerEntryV1Dto,
  type AffiliateWalletLedgerTypeV1,
} from "@/lib/api";

const ledgerTypeLabel: Record<AffiliateWalletLedgerTypeV1, string> = {
  COMMISSION_CREDIT: "Komisi masuk",
  REVERSAL_DEBIT: "Reversal komisi",
  WITHDRAWAL_DEBIT: "Penarikan",
  ADJUSTMENT: "Penyesuaian",
};

const commissionStatusLabel: Record<AffiliateCommissionStatusV1, string> = {
  PENDING: "Pending",
  PAID: "Dibayar",
  CANCELLED: "Dibatalkan",
};

const commissionStatusClass: Record<AffiliateCommissionStatusV1, string> = {
  PENDING: "bg-amber-500/15 text-amber-600",
  PAID: "bg-primary/15 text-primary",
  CANCELLED: "bg-destructive/15 text-destructive",
};

const Wallet = () => {
  const { user, refreshUser } = useApp();
  const queryClient = useQueryClient();
  const [confirmAutoRenew, setConfirmAutoRenew] = useState(false);
  const [updatingAutoRenew, setUpdatingAutoRenew] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [historyTab, setHistoryTab] = useState<"ledger" | "komisi">("ledger");

  // Headline balance intentionally stays on the legacy endpoint: legacy withdrawals (still the
  // only live withdraw flow) and auto-renew-from-balance debit the legacy WalletTransaction /
  // Withdrawal models only, never the v1 WalletLedgerEntry. Showing v1's unclamped ledger balance
  // here would overstate real spendable funds for any user who has used either flow. Everything
  // below the hero card (ledger history, commission history, v1 totals) reads exclusively from
  // v1 endpoints — see AffiliateWalletSummaryV1Dto in src/lib/api.ts for the full rationale.
  const walletQuery = {};
  const { data: wallet, isLoading } = useQuery({
    queryKey: ["wallet", walletQuery],
    queryFn: () => api.wallet.get(walletQuery),
  });

  const balance = wallet?.summary.balance ?? user?.balance ?? 0;
  const autoRenew = wallet?.autoRenew;
  const autoRenewPlan = autoRenew?.plan;
  const autoRenewEnabled = autoRenew?.enabled ?? user?.autoRenewMembership ?? false;

  const summaryV1 = useAffiliateWalletSummaryV1();
  const ledgerV1 = useAffiliateWalletLedgerV1();
  const commissionsV1 = useAffiliateCommissionsV1();

  const ledgerItems = useMemo(
    () => ledgerV1.data?.pages.flatMap((page) => page.items) ?? [],
    [ledgerV1.data],
  );
  const commissionItems = useMemo(
    () => commissionsV1.data?.pages.flatMap((page) => page.items) ?? [],
    [commissionsV1.data],
  );

  const setAutoRenew = async (enabled: boolean) => {
    if (updatingAutoRenew) return;
    setUpdatingAutoRenew(true);
    try {
      await api.wallet.setAutoRenew(enabled);
      toast.success(enabled ? "Perpanjang otomatis aktif." : "Perpanjang otomatis dimatikan.");
      setConfirmAutoRenew(false);
      await Promise.all([
        refreshUser(),
        queryClient.invalidateQueries({ queryKey: ["wallet"] }),
      ]);
    } catch (error) {
      toast.error(getErrorMessage(error, "Pengaturan perpanjang otomatis gagal disimpan."));
    } finally {
      setUpdatingAutoRenew(false);
    }
  };

  const exportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const blob = await api.wallet.recapPdf(walletQuery);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "rekap-wallet-buatcuan.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getErrorMessage(error, "Rekap PDF gagal dibuat."));
    } finally {
      setExporting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Welcome back,</p>
          <h1 className="text-2xl font-extrabold leading-tight">Dompet Cuan</h1>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-glow-sm">
          <WalletIcon className="h-5 w-5" />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-card p-6 shadow-[0_24px_55px_hsl(0_0%_0%_/_0.12)]">
        <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary/70 px-3 py-2 text-xs font-extrabold">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-primary">
              <WalletIcon className="h-3.5 w-3.5" />
            </span>
            Saldo Cuan
          </span>
          <span className="text-lg font-black tracking-tight text-foreground">BCH</span>
        </div>
        <div className="relative mt-7">
          <p className="text-xs text-muted-foreground">Saldo tersedia</p>
          {isLoading ? (
            <div className="mt-2 h-10 w-40 animate-pulse rounded-xl bg-muted" />
          ) : (
            <p data-testid="wallet-balance" className="mt-1 break-words text-[2rem] font-black leading-none tracking-tight text-foreground">{formatIDR(balance)}</p>
          )}
        </div>
        <div className="relative mt-7 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Total komisi</p>
            <p className="mt-1 font-extrabold">{formatIDR(wallet?.summary.totalCommission ?? 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Keluar/reserved</p>
            <p className="mt-1 font-extrabold">{formatIDR((wallet?.summary.totalWithdrawnOrReserved ?? 0) + (wallet?.summary.totalWalletDebitOrReserved ?? 0))}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1fr_64px] gap-2.5">
        <Link to={user.membershipActive ? "/app/withdraw" : "/app/payment"} className="min-w-0">
          <Button type="button" variant="outline" className="h-14 w-full rounded-3xl border-white/15 bg-card font-extrabold shadow-[0_14px_30px_hsl(0_0%_0%_/_0.08)]">
            <ArrowDownLeft className="mr-2 h-4 w-4" /> {user.membershipActive ? "Tarik" : "Aktifkan"}
          </Button>
        </Link>
        <Button type="button" variant="outline" onClick={exportPdf} disabled={exporting} className="h-14 rounded-3xl border-white/15 bg-card font-extrabold shadow-[0_14px_30px_hsl(0_0%_0%_/_0.08)] disabled:cursor-not-allowed disabled:opacity-60">
          <Download className="mr-2 h-4 w-4" /> {exporting ? "PDF..." : "Rekap"}
        </Button>
        <Link to="/app/payment" aria-label="Tambah saldo atau upgrade" title="Upgrade" className="grid h-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-[1.03]">
          <Plus className="h-6 w-6" />
        </Link>
      </div>

      <div className="glass-card space-y-4 rounded-3xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold">Perpanjang Otomatis</p>
            <p className="text-xs text-muted-foreground">Sistem memakai paket aktif atau paket terakhir yang pernah aktif.</p>
          </div>
          <Switch
            checked={autoRenewEnabled}
            disabled={updatingAutoRenew || !autoRenewPlan}
            onCheckedChange={(checked) => {
              if (checked) {
                setConfirmAutoRenew(true);
                return;
              }
              void setAutoRenew(false);
            }}
          />
        </div>
        {autoRenewPlan ? (
          <div className="rounded-2xl bg-secondary/70 p-4">
            <p className="text-xs text-muted-foreground">Paket otomatis</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="font-extrabold">{autoRenewPlan.label}</p>
              <p className="text-sm font-extrabold text-gradient-gold">{formatIDR(autoRenewPlan.price)}</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {autoRenew?.nextRenewalAt
                ? `Akan dicek saat masa aktif berakhir. Jika saldo cukup, sistem memperpanjang otomatis.`
                : "Paket ini dipilih dari pembayaran berhasil terakhir."}
            </p>
          </div>
        ) : (
          <p className="rounded-2xl bg-secondary/70 p-4 text-xs font-semibold text-muted-foreground">
            Belum ada paket aktif atau pembayaran berhasil terakhir. Aktifkan membership dulu agar fitur ini tersedia.
          </p>
        )}
        {autoRenewPlan && !autoRenew?.canRenewWithBalance && (
          <p className="rounded-2xl bg-amber-500/10 p-3 text-xs font-semibold text-amber-600">
            Saldo saat ini belum cukup untuk paket ini. Tetap bisa diaktifkan, tapi perpanjangan hanya berjalan kalau saldo cukup saat jatuh tempo.
          </p>
        )}
      </div>

      <div className="rounded-[2rem] border border-white/15 bg-card p-5 shadow-[0_24px_55px_hsl(0_0%_0%_/_0.10)]" data-testid="wallet-v1-history">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
        <div className="mb-4">
          <p className="text-xl font-extrabold">Riwayat (v1)</p>
          <p className="text-xs text-muted-foreground">Ledger dan komisi afiliasi, sumber data terbaru. Saldo final tetap di kartu Saldo Cuan di atas.</p>
        </div>

        {summaryV1.isLoading && (
          <div className="grid grid-cols-3 gap-2" data-testid="wallet-v1-summary-loading">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-14 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        )}
        {!summaryV1.isLoading && summaryV1.isError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3" data-testid="wallet-v1-summary-error">
            <p className="text-xs font-semibold text-destructive">{getErrorMessage(summaryV1.error, "Ringkasan ledger v1 belum bisa dimuat.")}</p>
            <button
              type="button"
              onClick={() => summaryV1.refetch()}
              disabled={summaryV1.isFetching}
              className="mt-1 text-xs font-extrabold text-primary disabled:opacity-50"
            >
              Coba lagi
            </button>
          </div>
        )}
        {!summaryV1.isLoading && !summaryV1.isError && summaryV1.data && (
          <div className="grid grid-cols-3 gap-2 text-xs" data-testid="wallet-v1-summary-data">
            <div className="rounded-2xl bg-secondary/70 p-3">
              <p className="text-muted-foreground">Total komisi diterima</p>
              <p className="mt-1 font-extrabold">{formatIDR(summaryV1.data.totalEarned)}</p>
            </div>
            <div className="rounded-2xl bg-secondary/70 p-3">
              <p className="text-muted-foreground">Total reversal</p>
              <p className="mt-1 font-extrabold">{formatIDR(summaryV1.data.totalReversed)}</p>
            </div>
            <div className="rounded-2xl bg-secondary/70 p-3">
              <p className="text-muted-foreground">Total ditarik (v1)</p>
              <p className="mt-1 font-extrabold">{formatIDR(summaryV1.data.totalPaidOut)}</p>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            data-testid="wallet-v1-tab-ledger"
            onClick={() => setHistoryTab("ledger")}
            className={`h-10 rounded-2xl text-xs font-extrabold transition-colors ${
              historyTab === "ledger" ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-muted-foreground"
            }`}
          >
            Ledger
          </button>
          <button
            type="button"
            data-testid="wallet-v1-tab-komisi"
            onClick={() => setHistoryTab("komisi")}
            className={`h-10 rounded-2xl text-xs font-extrabold transition-colors ${
              historyTab === "komisi" ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-muted-foreground"
            }`}
          >
            Komisi
          </button>
        </div>

        <div className="mt-4">
          {historyTab === "ledger" ? (
            <LedgerListV1 items={ledgerItems} query={ledgerV1} />
          ) : (
            <CommissionListV1 items={commissionItems} query={commissionsV1} />
          )}
        </div>
      </div>

      <ConfirmActionDialog
        open={confirmAutoRenew}
        onOpenChange={setConfirmAutoRenew}
        title="Aktifkan perpanjang otomatis?"
        description={autoRenewPlan ? `Saat membership berakhir, sistem akan mencoba memperpanjang paket ${autoRenewPlan.label} menggunakan saldo cuan. Jika saldo tidak cukup, membership tidak diperpanjang otomatis.` : ""}
        confirmLabel="Mengerti"
        loading={updatingAutoRenew}
        onConfirm={() => void setAutoRenew(true)}
      />
    </div>
  );
};

interface LedgerListV1Props {
  items: AffiliateWalletLedgerEntryV1Dto[];
  query: ReturnType<typeof useAffiliateWalletLedgerV1>;
}

function LedgerListV1({ items, query }: LedgerListV1Props) {
  const { isLoading, isError, error, refetch, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage } = query;

  if (isLoading) {
    return (
      <div className="space-y-2" data-testid="wallet-v1-ledger-loading">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-16 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4" data-testid="wallet-v1-ledger-error">
        <p className="text-sm font-semibold text-destructive">{getErrorMessage(error, "Ledger v1 belum bisa dimuat.")}</p>
        <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-2 text-xs font-extrabold text-primary disabled:opacity-50">
          Coba lagi
        </button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl bg-secondary/70 p-4 text-sm text-muted-foreground" data-testid="wallet-v1-ledger-empty">
        Belum ada mutasi ledger.
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="wallet-v1-ledger-list">
      {items.map((entry) => {
        const isCredit = entry.amount >= 0;
        const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
        const reference = entry.commissionId ?? entry.withdrawRequestId ?? entry.sourceId ?? null;
        return (
          <div key={entry.id} className="rounded-2xl bg-background/70 p-4" data-testid={`wallet-v1-ledger-item-${entry.id}`}>
            <div className="flex items-start gap-3">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${isCredit ? "bg-primary/15 text-primary" : "bg-amber-500/15 text-amber-600"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{ledgerTypeLabel[entry.type]}</p>
                    {reference && <p className="truncate text-xs text-muted-foreground">Ref: {reference}</p>}
                  </div>
                  <p className={`shrink-0 text-sm font-extrabold ${isCredit ? "text-primary" : "text-amber-600"}`}>
                    {isCredit ? "+" : ""}
                    {formatIDR(entry.amount)}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground">Saldo setelah: {formatIDR(entry.balanceAfter)}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(entry.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {hasNextPage && (
        <button
          type="button"
          data-testid="wallet-v1-ledger-load-more"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="h-11 w-full rounded-2xl bg-secondary/70 text-xs font-extrabold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isFetchingNextPage ? "Memuat..." : "Muat lebih banyak"}
        </button>
      )}
    </div>
  );
}

interface CommissionListV1Props {
  items: AffiliateCommissionV1Dto[];
  query: ReturnType<typeof useAffiliateCommissionsV1>;
}

function CommissionListV1({ items, query }: CommissionListV1Props) {
  const { isLoading, isError, error, refetch, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage } = query;

  if (isLoading) {
    return (
      <div className="space-y-2" data-testid="wallet-v1-komisi-loading">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-16 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4" data-testid="wallet-v1-komisi-error">
        <p className="text-sm font-semibold text-destructive">{getErrorMessage(error, "Komisi v1 belum bisa dimuat.")}</p>
        <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-2 text-xs font-extrabold text-primary disabled:opacity-50">
          Coba lagi
        </button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl bg-secondary/70 p-4 text-sm text-muted-foreground" data-testid="wallet-v1-komisi-empty">
        Belum ada komisi.
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="wallet-v1-komisi-list">
      {items.map((commission) => (
        <div key={commission.id} className="rounded-2xl bg-background/70 p-4" data-testid={`wallet-v1-komisi-item-${commission.id}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Komisi {commission.ratePercent}%</p>
              <p className="truncate text-xs text-muted-foreground">Ref pembayaran: {commission.paymentId}</p>
            </div>
            <p className="shrink-0 text-sm font-extrabold text-primary">+{formatIDR(commission.commissionAmount)}</p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${commissionStatusClass[commission.status]}`}>
              {commissionStatusLabel[commission.status]}
            </span>
            <span className="text-[10px] text-muted-foreground">{formatDate(commission.createdAt)}</span>
          </div>
        </div>
      ))}
      {hasNextPage && (
        <button
          type="button"
          data-testid="wallet-v1-komisi-load-more"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="h-11 w-full rounded-2xl bg-secondary/70 text-xs font-extrabold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isFetchingNextPage ? "Memuat..." : "Muat lebih banyak"}
        </button>
      )}
    </div>
  );
}

export default Wallet;
