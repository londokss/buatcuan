import {
  AlertCircle,
  Building2,
  Check,
  Clock3,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  Landmark,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Store,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useApp, formatDate, formatIDR } from "@/context/AppContext";
import { api, getErrorMessage, type PaymentDto, type PaymentInstructionDto } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { ShowMoreList } from "@/components/ShowMoreList";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusLabel: Record<PaymentDto["status"], string> = {
  PENDING: "Menunggu",
  PAID: "Berhasil",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
};

const statusClass: Record<PaymentDto["status"], string> = {
  PENDING: "bg-accent/15 text-accent",
  PAID: "bg-primary/15 text-primary",
  FAILED: "bg-destructive/15 text-destructive",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
};

const paymentMethods = [
  {
    id: "virtual_account",
    label: "Virtual Account",
    icon: Landmark,
    color: "bg-teal-500",
    channels: ["BCA", "BNI", "BRI", "Mandiri", "BSI"],
  },
  {
    id: "credit_card",
    label: "Kartu Kredit",
    icon: CreditCard,
    color: "bg-violet-500",
    channels: ["Visa", "Mastercard", "JCB", "Amex"],
  },
  {
    id: "ewallet",
    label: "E-Wallet",
    icon: Wallet,
    color: "bg-orange-500",
    channels: ["GoPay", "DANA", "OVO", "ShopeePay"],
  },
  {
    id: "qr",
    label: "QR",
    icon: QrCode,
    color: "bg-zinc-500",
    channels: ["QRIS"],
  },
  {
    id: "retail_outlet",
    label: "Retail Outlet",
    icon: Store,
    color: "bg-pink-500",
    channels: ["Alfamart", "Indomaret"],
  },
  {
    id: "direct_debit",
    label: "Direct Debit",
    icon: Building2,
    color: "bg-cyan-500",
    channels: ["BRI", "Mandiri"],
  },
  {
    id: "paylater",
    label: "PayLater",
    icon: ReceiptText,
    color: "bg-sky-500",
    channels: ["Kredivo", "Atome", "Indodana", "Akulaku"],
  },
];

const methodsRequiringProvider = new Set(["virtual_account", "ewallet", "retail_outlet", "direct_debit", "paylater"]);

const walletPaymentMethod = {
  id: "saldo_cuan",
  label: "Saldo Cuan",
  icon: Wallet,
  color: "bg-amber-500",
  channels: ["Wallet"],
};

const getMethod = (methodId?: string) => {
  if (methodId === walletPaymentMethod.id) return walletPaymentMethod;
  return paymentMethods.find((method) => method.id === methodId) ?? paymentMethods[0];
};

const formatRemaining = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const remainingMs = (payment?: PaymentDto | null, now = Date.now()) => {
  if (!payment?.expiresAt) return 0;
  return Math.max(0, new Date(payment.expiresAt).getTime() - now);
};

const copyToClipboard = async (value: string) => {
  await navigator.clipboard.writeText(value);
  toast.success("Disalin ke clipboard.");
};

const mockInstructionFor = (payment: PaymentDto, methodId?: string): PaymentInstructionDto => {
  const seed = Array.from(payment.id).map((char) => String(char.charCodeAt(0) % 10)).join("").padEnd(16, "0");
  const method = methodId ?? "virtual_account";
  const provider = payment.paymentProvider;

  if (method === "qr") {
    return {
      type: "qr",
      title: "Scan QRIS",
      description: "Scan QR menggunakan aplikasi bank atau e-wallet yang mendukung QRIS.",
      qrPayload: `BUATCUAN|${payment.id}|${payment.amount}`,
      steps: ["Buka aplikasi bank atau e-wallet.", "Pilih menu Scan QR / QRIS.", "Scan QR yang tampil di layar ini.", "Selesaikan pembayaran."],
    };
  }

  if (method === "virtual_account") {
    return {
      type: "copy_code",
      title: `Nomor Virtual Account${provider ? ` ${provider}` : ""}`,
      description: provider ? `Gunakan nomor ini melalui kanal ${provider}.` : "Gunakan nomor ini di ATM, mobile banking, atau internet banking.",
      codeLabel: "Nomor Virtual Account",
      code: `8808${seed.slice(0, 12)}`,
      steps: ["Pilih transfer Virtual Account.", "Masukkan nomor Virtual Account.", "Pastikan nominal sesuai.", "Selesaikan pembayaran."],
    };
  }

  if (method === "retail_outlet") {
    return {
      type: "copy_code",
      title: `Kode Pembayaran${provider ? ` ${provider}` : " Retail"}`,
      description: provider ? `Tunjukkan kode ini ke kasir ${provider}.` : "Tunjukkan kode ini ke kasir retail yang dipilih.",
      codeLabel: "Kode Pembayaran",
      code: `BC${seed.slice(0, 10)}`,
      steps: ["Datang ke gerai retail.", "Berikan kode ke kasir.", "Bayar sesuai nominal.", "Simpan struk pembayaran."],
    };
  }

  const labels: Record<string, { title: string; actionLabel: string; description: string }> = {
    ewallet: {
      title: `Bayar dengan ${provider ?? "E-Wallet"}`,
      actionLabel: provider ? `Buka ${provider}` : "Buka E-Wallet",
      description: provider ? `Lanjutkan ke aplikasi ${provider} untuk menyelesaikan pembayaran.` : "Lanjutkan ke aplikasi e-wallet untuk menyelesaikan pembayaran.",
    },
    direct_debit: {
      title: `Autorisasi Direct Debit${provider ? ` ${provider}` : ""}`,
      actionLabel: provider ? `Hubungkan ${provider}` : "Hubungkan Rekening",
      description: provider ? `Hubungkan rekening ${provider} dan setujui debit sesuai nominal transaksi.` : "Hubungkan rekening dan setujui debit sesuai nominal transaksi.",
    },
    paylater: {
      title: provider ? `Ajukan ${provider}` : "Ajukan PayLater",
      actionLabel: provider ? `Lanjut ke ${provider}` : "Lanjut ke PayLater",
      description: provider ? `Lanjutkan ke ${provider} untuk menyelesaikan pengajuan pembayaran.` : "Lanjutkan ke penyedia PayLater untuk menyelesaikan pengajuan pembayaran.",
    },
    credit_card: {
      title: "Pembayaran Kartu Kredit",
      actionLabel: "Buka Form Kartu",
      description: "Masukkan data kartu di halaman pembayaran aman yang disediakan gateway.",
    },
  };
  const label = labels[method] ?? labels.credit_card;

  return {
    type: "redirect",
    title: label.title,
    description: label.description,
    actionLabel: label.actionLabel,
    actionUrl: payment.checkoutUrl,
    steps: ["Tekan tombol lanjut.", "Ikuti instruksi di kanal pembayaran.", "Pastikan nominal sesuai.", "Tunggu pembayaran terkonfirmasi."],
  };
};

const MockQrImage = ({ payload }: { payload: string }) => {
  const size = 13;
  const chars = Array.from(payload || "BUATCUAN");
  const active = (row: number, col: number) => {
    const finder =
      (row < 4 && col < 4) ||
      (row < 4 && col > size - 5) ||
      (row > size - 5 && col < 4);
    if (finder) return row === 0 || col === 0 || row === 3 || col === 3 || (row === 1 && col === 1);
    const code = chars[(row * size + col) % chars.length]?.charCodeAt(0) ?? 0;
    return (code + row * 7 + col * 11) % 3 !== 0;
  };

  return (
    <div className="mx-auto grid w-48 max-w-full grid-cols-[repeat(13,minmax(0,1fr))] gap-1 rounded-2xl bg-white p-4">
      {Array.from({ length: size * size }).map((_, index) => {
        const row = Math.floor(index / size);
        const col = index % size;
        return <span key={index} className={`aspect-square rounded-[2px] ${active(row, col) ? "bg-zinc-950" : "bg-white"}`} />;
      })}
    </div>
  );
};

const PaymentInstructionPanel = ({ instruction }: { instruction: PaymentInstructionDto }) => {
  const openAction = () => {
    if (!instruction.actionUrl) {
      toast.info("Kanal pembayaran mock sudah disiapkan. Integrasi aktif setelah credential gateway diisi.");
      return;
    }
    window.location.assign(instruction.actionUrl);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-secondary/60 p-4">
      <p className="font-bold">{instruction.title}</p>
      {instruction.description && <p className="mt-1 text-xs text-muted-foreground">{instruction.description}</p>}

      {instruction.type === "copy_code" && instruction.code && (
        <div className="mt-4 rounded-2xl bg-background/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{instruction.codeLabel ?? "Kode Pembayaran"}</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="min-w-0 flex-1 break-all font-mono text-lg font-extrabold tracking-wide">{instruction.code}</p>
            <Button type="button" size="sm" onClick={() => void copyToClipboard(instruction.code!)} className="rounded-xl">
              <Copy className="mr-1 h-3.5 w-3.5" /> Copy
            </Button>
          </div>
        </div>
      )}

      {instruction.type === "qr" && (
        <div className="mt-4 rounded-2xl bg-background/70 p-4 text-center">
          <MockQrImage payload={instruction.qrPayload ?? instruction.title} />
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">QRIS Demo</p>
        </div>
      )}

      {instruction.type === "redirect" && (
        <Button type="button" onClick={openAction} className="mt-4 h-11 w-full rounded-2xl gradient-primary font-bold text-primary-foreground">
          <ExternalLink className="mr-2 h-4 w-4" /> {instruction.actionLabel ?? "Lanjutkan Pembayaran"}
        </Button>
      )}

      <div className="mt-4 space-y-2">
        {instruction.steps.map((step, index) => (
          <div key={`${step}-${index}`} className="flex gap-2 text-xs text-muted-foreground">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">{index + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Payment = () => {
  const { activateMembership, refreshUser, user } = useApp();
  const [selected, setSelected] = useState("3m");
  const [selectedMethod, setSelectedMethod] = useState("virtual_account");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [methodStep, setMethodStep] = useState<"method" | "provider">("method");
  const [methodDialogOpen, setMethodDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [methodMode, setMethodMode] = useState<"create" | "continue">("create");
  const [activePayment, setActivePayment] = useState<PaymentDto | null>(null);
  const [createdPayment, setCreatedPayment] = useState<PaymentDto | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [expiring, setExpiring] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const mockPaymentId = searchParams.get("mockPayment");
  const redirectStatus = searchParams.get("status");
  const { data: plans = [], isLoading } = useQuery({ queryKey: ["plans"], queryFn: api.plans });
  const { data: history = [], isLoading: isHistoryLoading } = useQuery({ queryKey: ["payment-history"], queryFn: api.payments.history });
  const pendingPayment = createdPayment?.status === "PENDING" ? createdPayment : history.find((payment) => payment.status === "PENDING");
  const isLockedByPending = Boolean(pendingPayment);
  const isPaymentLocked = isLockedByPending || isHistoryLoading;
  const selectedPlan = plans.find((plan) => plan.id === selected);
  const activeMethod = getMethod(activePayment?.paymentMethod ?? selectedMethod);
  const ActiveMethodIcon = activeMethod.icon;
  const methodNeedsProvider = methodsRequiringProvider.has(selectedMethod);
  const selectedMethodMeta = getMethod(selectedMethod);
  const timeLeft = useMemo(() => remainingMs(activePayment, now), [activePayment, now]);
  const activePaymentIsMock = activePayment?.provider?.includes("mock");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mockPaymentId || !history.length || activePayment) return;
    const payment = history.find((item) => item.id === mockPaymentId);
    if (!payment) return;
    setActivePayment(payment);
    setSelectedMethod(payment.paymentMethod ?? "virtual_account");
    setSelectedProvider(payment.paymentProvider ?? "");
    setPaymentDialogOpen(payment.status === "PENDING");
  }, [activePayment, history, mockPaymentId]);

  useEffect(() => {
    if (!activePayment || activePayment.status !== "PENDING" || !paymentDialogOpen || timeLeft > 0 || expiring) return;

    setExpiring(true);
    api.payments
      .expire(activePayment.id)
      .then(async ({ payment }) => {
        setActivePayment(payment);
        setCreatedPayment(null);
        await qc.invalidateQueries({ queryKey: ["payment-history"] });
        toast.error("Waktu pembayaran habis. Transaksi kedaluwarsa.");
      })
      .catch(() => undefined)
      .finally(() => setExpiring(false));
  }, [activePayment, expiring, paymentDialogOpen, qc, timeLeft]);

  const openCreateMethods = () => {
    if (processing || isPaymentLocked) {
      if (isLockedByPending) toast.error("Selesaikan atau batalkan pembayaran pending terlebih dahulu.");
      return;
    }
    if (!selectedPlan) {
      toast.error("Pilih paket dulu");
      return;
    }

    setMethodMode("create");
    setSelectedMethod("virtual_account");
    setSelectedProvider("");
    setMethodStep("method");
    setMethodDialogOpen(true);
  };

  const openContinueMethods = () => {
    if (!pendingPayment) return;
    setActivePayment(pendingPayment);
    setPaymentDialogOpen(true);
  };

  const confirmMethod = async () => {
    if (methodStep === "method" && methodNeedsProvider) {
      setMethodStep("provider");
      return;
    }

    if (methodNeedsProvider && !selectedProvider) {
      toast.error("Pilih provider pembayaran terlebih dahulu.");
      return;
    }

    if (!selectedPlan || processing) return;

    setProcessing(true);
    const result = await activateMembership(selectedPlan.id, selectedMethod, methodNeedsProvider ? selectedProvider : undefined);
    setProcessing(false);

    if (!result.success || !result.payment) {
      toast.error(result.message ?? "Pembayaran gagal dibuat");
      return;
    }

    setCreatedPayment(result.payment);
    setActivePayment(result.payment);
    setMethodDialogOpen(false);
    setPaymentDialogOpen(true);
    await qc.invalidateQueries({ queryKey: ["payment-history"] });
    toast.success("Pembayaran dibuat. Selesaikan sebelum waktu habis.");
  };

  const cancelPendingPayment = async () => {
    if (!pendingPayment || cancelling) return;
    setCancelling(true);
    try {
      await api.payments.cancel(pendingPayment.id);
      setCreatedPayment(null);
      if (activePayment?.id === pendingPayment.id) setActivePayment(null);
      setCancelOpen(false);
      await qc.invalidateQueries({ queryKey: ["payment-history"] });
      toast.success("Pembayaran pending dibatalkan.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Pembayaran pending gagal dibatalkan."));
    } finally {
      setCancelling(false);
    }
  };

  const simulatePaid = async () => {
    const paymentId = activePayment?.id ?? mockPaymentId;
    if (processing || !paymentId) return;
    setProcessing(true);
    try {
      await api.payments.simulatePaid(paymentId);
      await refreshUser();
      await qc.invalidateQueries({ queryKey: ["payment-history"] });
      toast.success("Pembayaran berhasil dikonfirmasi. Akun aktif.");
      setPaymentDialogOpen(false);
      nav("/app/payment?status=success", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Simulasi pembayaran gagal"));
    } finally {
      setProcessing(false);
    }
  };

  const features = selectedPlan?.features?.length ? selectedPlan.features : [
    "Akses semua modul Level 1-3",
    "Semua tools premium tanpa limit FREE",
    "Bimbingan & review konten",
    "Update viral tiap minggu",
    "Komisi affiliate 50%",
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Aktifkan <span className="text-gradient-primary">Membership</span></h1>
        <p className="text-sm text-muted-foreground">Pilih paket, pilih metode pembayaran, lalu selesaikan sebelum waktu habis.</p>
      </div>

      {!user?.membershipActive && (
        <div className="glass-card rounded-3xl p-4 flex items-start gap-3 border border-accent/30">
          <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Akun belum aktif</p>
            <p className="text-xs text-muted-foreground">
              Selesaikan pembayaran membership untuk membuka semua materi dan tools PRO.
            </p>
          </div>
        </div>
      )}

      {redirectStatus === "success" && (
        <div className="glass-card rounded-3xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Pembayaran berhasil diproses</p>
            <p className="text-xs text-muted-foreground">
              Status akun: <span className="font-semibold text-foreground">{user?.membershipActive ? "Aktif" : "Menunggu konfirmasi pembayaran"}</span>
            </p>
          </div>
        </div>
      )}

      {pendingPayment && (
        <div className="glass-card rounded-3xl p-5 space-y-4 border border-accent/30">
          <div className="flex items-start gap-3">
            <Clock3 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Pembayaran masih pending</p>
              <p className="text-xs text-muted-foreground">
                Selesaikan atau batalkan pembayaran ini sebelum memilih paket lain.
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${statusClass[pendingPayment.status]}`}>
              {statusLabel[pendingPayment.status]}
            </span>
          </div>

          <div className="rounded-2xl bg-secondary/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Paket</p>
                <p className="font-extrabold">{pendingPayment.plan}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-extrabold text-gradient-primary">{formatIDR(pendingPayment.amount)}</p>
              </div>
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
              Dibuat {formatDate(pendingPayment.createdAt)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
            <Button
              type="button"
              onClick={openContinueMethods}
              disabled={processing || cancelling}
              className="h-12 rounded-2xl gradient-primary text-primary-foreground font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ReceiptText className="w-4 h-4 mr-2" /> Lanjutkan
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelOpen(true)}
              disabled={processing || cancelling}
              className="h-12 rounded-2xl border-white/10 bg-secondary font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle className="w-4 h-4 mr-2" /> {cancelling ? "Membatalkan..." : "Batalkan"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoading && <div className="glass-card rounded-3xl p-5 text-sm text-muted-foreground">Memuat paket...</div>}
        {plans.map((plan) => {
          const active = selected === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => !processing && !isPaymentLocked && setSelected(plan.id)}
              disabled={processing || isPaymentLocked}
              className={`w-full text-left rounded-3xl p-5 border-2 transition-all relative ${
                active ? "border-primary bg-primary/10 glow-primary-sm" : "border-white/10 bg-card/60"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {plan.best && (
                <span className="absolute -top-3 left-5 px-3 py-1 rounded-full text-[10px] font-extrabold gradient-gold text-accent-foreground shadow-gold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> PALING POPULER
                </span>
              )}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold text-lg">{plan.label}</p>
                  <p className="text-xs text-muted-foreground">{plan.desc}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-xl text-gradient-primary">{formatIDR(plan.price)}</p>
                  {plan.save && <p className="text-[10px] font-bold text-accent">{plan.save}</p>}
                </div>
              </div>
              <div className={`mt-3 w-5 h-5 rounded-full border-2 grid place-items-center ${active ? "bg-primary border-primary" : "border-white/20"}`}>
                {active && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="glass-card rounded-3xl p-5">
        <p className="font-bold mb-3">Yang kamu dapet:</p>
        <div className="space-y-2">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary shrink-0" /> {feature}
            </div>
          ))}
        </div>
      </div>

      <Button onClick={openCreateMethods} disabled={processing || isLoading || !selected || isPaymentLocked} className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold text-base shadow-glow disabled:cursor-not-allowed disabled:opacity-60">
        <ReceiptText className="w-4 h-4 mr-2" /> {processing ? "Memproses..." : isLockedByPending ? "Ada Pembayaran Pending" : "Buat Pembayaran"}
      </Button>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <ReceiptText className="w-4 h-4 text-primary" />
          <p className="font-bold">Riwayat Pembayaran</p>
        </div>
        <div className="space-y-2">
          <ShowMoreList
            items={history}
            initial={5}
            step={5}
            empty={<div className="glass-card rounded-2xl p-4 text-sm text-muted-foreground">Belum ada riwayat pembayaran.</div>}
            renderItem={(payment) => {
            const method = getMethod(payment.paymentMethod);
            return (
              <div key={payment.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{payment.plan}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.paidAt ?? payment.createdAt)} • {method.label}
                      {payment.paymentProvider ? ` • ${payment.paymentProvider}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-sm">{formatIDR(payment.amount)}</p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-[10px] font-bold ${statusClass[payment.status]}`}>
                      {statusLabel[payment.status]}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                  Akun: {payment.accountStatus === "active" ? "Aktif" : "Belum Aktif"}
                </p>
              </div>
            );
            }}
          />
        </div>
      </div>

      <Dialog open={methodDialogOpen} onOpenChange={setMethodDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl border-white/10 bg-card p-0 sm:max-w-md">
          <DialogHeader className="px-5 pt-5 text-left">
            <DialogTitle>{methodStep === "provider" ? (selectedMethod === "virtual_account" || selectedMethod === "direct_debit" ? "Pilih Bank" : "Pilih Provider") : "Pilih Metode Pembayaran"}</DialogTitle>
            <DialogDescription>
              {methodStep === "provider"
                ? `${selectedMethodMeta.label} • ${selectedPlan ? formatIDR(selectedPlan.price) : ""}`
                : methodMode === "create" && selectedPlan
                  ? `${selectedPlan.label} • ${formatIDR(selectedPlan.price)}`
                  : "Pilih metode pembayaran."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto px-5">
            {methodStep === "method" ? (
              paymentMethods.map((method) => {
                const Icon = method.icon;
                const active = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(method.id);
                      setSelectedProvider("");
                    }}
                    className={`w-full rounded-2xl border p-3 text-left transition-all ${
                      active ? "border-primary bg-primary/10" : "border-white/10 bg-secondary/60 hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white ${method.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{method.label}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {method.channels.map((channel) => (
                            <span key={channel} className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={`grid h-5 w-5 place-items-center rounded-full border ${active ? "border-primary bg-primary" : "border-white/20"}`}>
                        {active && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {selectedMethodMeta.channels.map((provider) => {
                  const active = selectedProvider === provider;
                  return (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => setSelectedProvider(provider)}
                      className={`min-h-14 rounded-2xl border px-3 py-3 text-sm font-bold transition-all ${
                        active ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-secondary/60 text-foreground hover:bg-secondary"
                      }`}
                    >
                      {provider}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 px-5 pb-5 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (methodStep === "provider") {
                  setMethodStep("method");
                  setSelectedProvider("");
                  return;
                }
                setMethodDialogOpen(false);
              }}
              className="rounded-2xl border-white/10 bg-secondary"
            >
              {methodStep === "provider" ? "Kembali" : "Batal"}
            </Button>
            <Button type="button" onClick={confirmMethod} disabled={processing || (methodStep === "provider" && methodNeedsProvider && !selectedProvider)} className="rounded-2xl gradient-primary text-primary-foreground font-bold disabled:cursor-not-allowed disabled:opacity-60">
              {processing ? "Memproses..." : methodStep === "method" && methodNeedsProvider ? "Pilih Provider" : "Lanjutkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border-white/10 bg-card p-0 sm:max-h-[calc(100dvh-2rem)] sm:max-w-md">
          <DialogHeader className="shrink-0 border-b border-white/10 px-5 pt-5 pb-3 text-left">
            <DialogTitle>Menunggu Pembayaran</DialogTitle>
            <DialogDescription>Selesaikan pembayaran sebelum countdown habis.</DialogDescription>
          </DialogHeader>

          {activePayment && (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 overscroll-contain">
              <div className="rounded-3xl border border-primary/30 bg-primary/10 p-4 text-center sm:p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sisa Waktu</p>
                <p className="mt-1 text-4xl font-extrabold text-gradient-primary">{formatRemaining(timeLeft)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activePayment.expiresAt ? `Kedaluwarsa ${new Date(activePayment.expiresAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "Menunggu konfirmasi"}
                </p>
              </div>

              <div className="rounded-2xl bg-secondary/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Paket</p>
                    <p className="font-extrabold">{activePayment.plan}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-extrabold text-gradient-primary">{formatIDR(activePayment.amount)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-secondary/60 p-4">
                <div className="flex items-center gap-3">
                  <div className={`grid h-11 w-11 place-items-center rounded-2xl text-white ${activeMethod.color}`}>
                    <ActiveMethodIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">{activeMethod.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {activePayment.paymentProvider ?? activeMethod.channels.join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              <PaymentInstructionPanel instruction={activePayment.paymentInstructions ?? mockInstructionFor(activePayment, activePayment.paymentMethod ?? selectedMethod)} />

              {activePayment.status !== "PENDING" && (
                <div className={`rounded-2xl p-3 text-sm font-semibold ${statusClass[activePayment.status]}`}>
                  Status pembayaran: {statusLabel[activePayment.status]}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="shrink-0 gap-2 border-t border-white/10 bg-card/95 px-5 py-4 sm:space-x-0">
            {activePaymentIsMock && activePayment?.status === "PENDING" && (
              <Button type="button" onClick={simulatePaid} disabled={processing || expiring || timeLeft <= 0} className="rounded-2xl gradient-primary text-primary-foreground font-bold disabled:cursor-not-allowed disabled:opacity-60">
                {processing ? "Memproses..." : "Saya Sudah Bayar"}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)} className="rounded-2xl border-white/10 bg-secondary">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Batalkan pembayaran?"
        description="Transaksi pending ini akan dibatalkan. Setelah itu kamu bisa membuat pembayaran baru."
        confirmLabel="Ya, batalkan"
        destructive
        loading={cancelling}
        onConfirm={cancelPendingPayment}
      />
    </div>
  );
};

export default Payment;
