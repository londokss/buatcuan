import { FormEvent, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  Banknote,
  Clock3,
  Landmark,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { ShowMoreList } from "@/components/ShowMoreList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIDR, useApp } from "@/context/AppContext";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const MIN_WITHDRAW = 100_000;
const presetAmounts = [100_000, 250_000, 500_000];
const popularBanks = ["BCA", "Mandiri", "BRI", "BNI", "BSI", "CIMB"];

const statusLabel: Record<string, string> = {
  PENDING: "Menunggu",
  PROCESSING: "Diproses",
  SUCCESS: "Sukses",
  PAID: "Selesai",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

const statusClass: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  PROCESSING: "bg-sky-500/15 text-sky-600 border-sky-500/20",
  SUCCESS: "bg-primary/15 text-primary border-primary/20",
  PAID: "bg-primary/15 text-primary border-primary/20",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

const Withdraw = () => {
  const { user, refreshUser } = useApp();
  const queryClient = useQueryClient();
  const { data: withdrawHistory = [] } = useQuery({ queryKey: ["withdrawals"], queryFn: api.withdrawals.list });
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const amountNumber = Number(amount);
  const isAmountValid = Number.isFinite(amountNumber) && amountNumber >= MIN_WITHDRAW;
  const exceedsBalance = Number.isFinite(amountNumber) && amountNumber > (user?.balance ?? 0);
  const canSubmit = Boolean(bank.trim() && account.trim() && isAmountValid && !exceedsBalance);

  const pendingTotal = useMemo(
    () =>
      withdrawHistory
        .filter((item) => ["PENDING", "PROCESSING"].includes(item.status))
        .reduce((sum, item) => sum + item.amount, 0),
    [withdrawHistory],
  );

  const latestAccount = withdrawHistory[0];

  if (!user) return null;

  const chooseAmount = (value: number) => {
    setAmount(String(Math.min(value, user.balance)));
  };

  const useLatestAccount = () => {
    if (!latestAccount) return;
    setBank(latestAccount.bankName || latestAccount.bank);
    setAccount(latestAccount.accountNumber);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!bank.trim()) return toast.error("Pilih atau isi nama bank.");
    if (!account.trim()) return toast.error("Isi nomor rekening tujuan.");
    if (!isAmountValid) return toast.error(`Minimal penarikan ${formatIDR(MIN_WITHDRAW)}.`);
    if (exceedsBalance) return toast.error("Nominal melebihi saldo tersedia.");
    setConfirmOpen(true);
  };

  const confirmWithdraw = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.withdrawals.create({
        bankName: bank.trim(),
        accountNumber: account.trim(),
        amount: amountNumber,
      });
      await queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      await refreshUser();
      toast.success(`Penarikan ${formatIDR(amountNumber)} sedang diproses.`);
      setConfirmOpen(false);
      setBank("");
      setAccount("");
      setAmount("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Withdraw gagal diproses."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Pencairan saldo</p>
          <h1 className="text-2xl font-extrabold leading-tight">Tarik Saldo</h1>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-accent/25 bg-accent/15 text-accent shadow-gold">
          <ArrowDownToLine className="h-5 w-5" />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-card p-6 shadow-[0_24px_55px_hsl(0_0%_0%_/_0.12)]">
        <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary/70 px-3 py-2 text-xs font-extrabold">
            <Wallet className="h-4 w-4 text-primary" />
            Saldo Tersedia
          </span>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase text-primary">
            Aktif
          </span>
        </div>
        <p className="relative mt-7 break-words text-[2rem] font-black leading-none tracking-tight text-foreground">
          {formatIDR(user.balance)}
        </p>
        <div className="relative mt-6 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-2xl bg-background/65 p-3">
            <p className="text-muted-foreground">Minimal tarik</p>
            <p className="mt-1 font-extrabold">{formatIDR(MIN_WITHDRAW)}</p>
          </div>
          <div className="rounded-2xl bg-background/65 p-3">
            <p className="text-muted-foreground">Sedang proses</p>
            <p className="mt-1 font-extrabold">{formatIDR(pendingTotal)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-[2rem] border border-white/15 bg-card p-5 shadow-[0_24px_55px_hsl(0_0%_0%_/_0.10)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xl font-extrabold">Ajukan Penarikan</p>
            <p className="text-xs text-muted-foreground">Isi rekening tujuan dan nominal cair.</p>
          </div>
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>

        <div className="space-y-5">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">1</span>
              <Label className="font-extrabold">Pilih Bank</Label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {popularBanks.map((item) => {
                const active = bank.toLowerCase() === item.toLowerCase();
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setBank(item)}
                    className={cn(
                      "h-11 rounded-2xl border px-2 text-xs font-extrabold transition-all",
                      active
                        ? "border-primary/40 bg-primary/15 text-primary shadow-[0_10px_20px_hsl(142_100%_39%_/_0.14)]"
                        : "border-white/10 bg-secondary/70 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            <Input
              value={bank}
              onChange={(event) => setBank(event.target.value)}
              placeholder="Atau isi bank/e-wallet lain"
              className="h-12 rounded-2xl border-white/10 bg-secondary"
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">2</span>
                <Label className="font-extrabold">Rekening Tujuan</Label>
              </div>
              {latestAccount && (
                <button type="button" onClick={useLatestAccount} className="text-xs font-bold text-primary">
                  Pakai terakhir
                </button>
              )}
            </div>
            <div className="relative">
              <Landmark className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                inputMode="numeric"
                placeholder="Nomor rekening / e-wallet"
                className="h-12 rounded-2xl border-white/10 bg-secondary pl-9"
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">3</span>
              <Label className="font-extrabold">Nominal Penarikan</Label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {presetAmounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={user.balance < value}
                  onClick={() => chooseAmount(value)}
                  className={cn(
                    "h-11 rounded-2xl border px-1 text-[11px] font-extrabold transition-all disabled:cursor-not-allowed disabled:opacity-40",
                    amountNumber === value
                      ? "border-accent/40 bg-accent/20 text-accent"
                      : "border-white/10 bg-secondary/70 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 0 }).format(value)}
                </button>
              ))}
              <button
                type="button"
                disabled={user.balance < MIN_WITHDRAW}
                onClick={() => chooseAmount(user.balance)}
                className="h-11 rounded-2xl border border-white/10 bg-secondary/70 px-1 text-[11px] font-extrabold text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                Semua
              </button>
            </div>
            <div className="relative">
              <Banknote className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min={MIN_WITHDRAW}
                max={user.balance}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder={`Min ${formatIDR(MIN_WITHDRAW)}`}
                className="h-12 rounded-2xl border-white/10 bg-secondary pl-9"
              />
            </div>
            {amount && (
              <p className={cn("text-xs font-semibold", exceedsBalance || !isAmountValid ? "text-destructive" : "text-muted-foreground")}>
                {exceedsBalance
                  ? "Nominal melebihi saldo tersedia."
                  : !isAmountValid
                    ? `Minimal penarikan ${formatIDR(MIN_WITHDRAW)}.`
                    : `Saldo setelah penarikan sekitar ${formatIDR(user.balance - amountNumber)}.`}
              </p>
            )}
          </section>

          <div className="rounded-2xl bg-secondary/65 p-4">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold">Estimasi proses 1-2 hari kerja</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Admin akan cek data rekening dan saldo sebelum dana dikirim. Pastikan bank dan nomor rekening benar.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting || !canSubmit}
            className="h-14 w-full rounded-2xl gradient-primary font-extrabold text-primary-foreground shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" /> {submitting ? "Memproses..." : "Review & Ajukan"}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-extrabold">Riwayat Penarikan</p>
          <span className="text-xs font-bold text-muted-foreground">{withdrawHistory.length} pengajuan</span>
        </div>
        <ShowMoreList
          items={withdrawHistory}
          initial={5}
          step={5}
          empty={<div className="glass-card rounded-2xl p-4 text-sm text-muted-foreground">Belum ada riwayat penarikan.</div>}
          renderItem={(withdrawal) => {
            const displayBank = withdrawal.bankName || withdrawal.bank;
            return (
              <div key={withdrawal.id} className="rounded-2xl border border-white/10 bg-card p-4 shadow-[0_12px_28px_hsl(0_0%_0%_/_0.07)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-600">
                      <ArrowDownToLine className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold">{formatIDR(withdrawal.amount)}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {displayBank} • {withdrawal.accountNumber}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(withdrawal.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className={cn("shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold", statusClass[withdrawal.status] ?? "border-border bg-muted text-muted-foreground")}>
                    {statusLabel[withdrawal.status] ?? withdrawal.status}
                  </span>
                </div>
              </div>
            );
          }}
        />
      </div>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Ajukan penarikan?"
        description={
          <div className="space-y-3 text-left">
            <p>Pastikan data tujuan sudah benar sebelum penarikan diproses.</p>
            <div className="rounded-2xl bg-secondary/70 p-3 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Nominal</span>
                <span className="font-extrabold text-foreground">{amount ? formatIDR(amountNumber) : "-"}</span>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-extrabold text-foreground">{bank || "-"}</span>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-muted-foreground">Rekening</span>
                <span className="font-extrabold text-foreground">{account || "-"}</span>
              </div>
            </div>
          </div>
        }
        confirmLabel="Ya, ajukan"
        loading={submitting}
        onConfirm={confirmWithdraw}
      />
    </div>
  );
};

export default Withdraw;
