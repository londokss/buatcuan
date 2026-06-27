import { FormEvent, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, HelpCircle, KeyRound, MessageCircle, Phone, ShieldCheck, type LucideIcon } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { ThemeModeToggle } from "@/components/ThemeModeToggle";
import { ManagedUsageVideoCard } from "@/components/ManagedUsageVideoCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { api, getErrorMessage } from "@/lib/api";
import { normalizeIndonesianPhoneNumber } from "@/lib/phone";
import { toast } from "sonner";

const phoneErrorClass = "border-destructive focus-within:ring-destructive";

const ForgotPassword = () => {
  const [wa, setWa] = useState("");
  const [error, setError] = useState("");
  const [guideOpen, setGuideOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof api.auth.requestPasswordReset>> | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const phone = normalizeIndonesianPhoneNumber(wa);
    if (!phone || phone.length < 9) {
      setError("Nomor telepon wajib diisi dengan format yang benar.");
      toast.error("Nomor telepon wajib diisi dengan format yang benar.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.auth.requestPasswordReset({ wa: phone });
      setResult(response);
      toast.success("Request reset password dibuat.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal membuat request reset password"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-hero pointer-events-none" />
      <div className="relative mx-auto max-w-md px-5 py-8">
        <div className="flex items-center justify-between gap-3">
          <BackButton to="/login" />
          <ThemeModeToggle />
        </div>
        <div className="mt-8">
          <h1 className="text-3xl font-extrabold">Lupa Password</h1>
          <p className="mt-1 text-muted-foreground">Masukkan nomor WhatsApp akun, lalu verifikasi ke admin.</p>
        </div>

        <ManagedUsageVideoCard
          targetPath="/forgot-password"
          fallback={{
            label: "Panduan reset",
            title: "Cara Aman Minta Password Baru",
            subtitle: "Ikuti langkah reset supaya admin bisa verifikasi nomor akun kamu",
            durationLabel: "1:20",
            thumbnailGradient: "from-sky-950 via-zinc-950 to-blue-950",
          }}
          accentClassName="border-sky-400/70 bg-sky-500/15 text-sky-300"
          className="mt-8"
        />

        <Button type="button" variant="outline" onClick={() => setGuideOpen(true)} className="mt-4 h-11 w-full rounded-2xl border-white/10 bg-secondary/70 font-bold">
          <HelpCircle className="mr-2 h-4 w-4" />
          Lihat panduan lupa password
        </Button>

        <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl glass-card p-5">
          <div className="space-y-2">
            <Label>Nomor Telepon</Label>
            <PhoneInput
              value={wa}
              onValueChange={(value) => {
                setWa(value);
                setError("");
              }}
              aria-invalid={Boolean(error)}
              className={error ? phoneErrorClass : undefined}
            />
            <p className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {error || "Gunakan nomor WhatsApp yang terdaftar di akun."}
            </p>
          </div>
          <Button type="submit" disabled={submitting} className="h-12 w-full rounded-2xl gradient-primary font-bold text-primary-foreground shadow-glow-sm">
            {submitting ? "Memproses..." : "Buat Request Reset"}
          </Button>
        </form>

        {result ? (
          <div className="mt-5 space-y-4 rounded-3xl border border-primary/20 bg-primary/10 p-5">
            <div>
              <p className="text-sm font-bold">Kode request</p>
              <p className="mt-2 rounded-2xl border border-white/10 bg-background/80 px-4 py-3 text-center font-mono text-2xl font-black tracking-wider">
                {result.requestCode}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Chat admin dari nomor WhatsApp akun dan kirim kode ini. Admin akan mengirim link reset setelah nomor pengirim cocok dengan akun.
            </p>
            {result.adminWhatsappUrl ? (
              <Button asChild className="h-12 w-full rounded-2xl bg-[#25D366] font-bold text-black hover:bg-[#1ebe5d]">
                <a href={result.adminWhatsappUrl} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat Admin WhatsApp
                </a>
              </Button>
            ) : (
              <p className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs font-semibold text-yellow-200">
                Nomor admin belum tersedia di database. Hubungi support melalui kanal yang tersedia.
              </p>
            )}
          </div>
        ) : null}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ingat password? <Link to="/login" className="font-semibold text-primary">Masuk</Link>
        </p>
      </div>
      <ForgotPasswordGuideModal open={guideOpen} onUnderstand={() => setGuideOpen(false)} />
    </div>
  );
};

function ForgotPasswordGuideModal({ open, onUnderstand }: { open: boolean; onUnderstand: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-guide-title"
        className="max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-3xl border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-7"
      >
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 id="forgot-password-guide-title" className="mt-4 text-xl font-black text-white">Lupa password?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Password baru hanya diproses untuk nomor WhatsApp yang sudah terdaftar di BuatCuan. Ikuti langkah berikut supaya admin bisa memverifikasi akun kamu.
          </p>
        </div>

        <div className="mt-7 divide-y divide-white/10">
          <GuideStep number="1" title="Masukkan nomor WhatsApp akun" description="Isi nomor HP yang dipakai saat daftar, lalu klik tombol Buat Request Reset." />
          <GuideStep number="2" title="Salin dan kirim kode request" description="Setelah request dibuat, sistem menampilkan kode request dan tombol chat admin WhatsApp. Kirim kode itu ke admin dari nomor akun yang sama.">
            <div className="mt-3 flex flex-wrap gap-2">
              <InfoPill icon={Phone}>Nomor HP terdaftar</InfoPill>
              <InfoPill icon={ShieldCheck}>Kode request reset</InfoPill>
            </div>
          </GuideStep>
          <GuideStep number="3" title="Tunggu link reset dari admin" description="Admin akan mencocokkan nomor pengirim WhatsApp dengan akun kamu. Jika cocok, admin akan mengirim link reset password." >
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Link hanya dikirim ke nomor yang terdaftar
            </div>
          </GuideStep>
        </div>

        <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-black/40 p-4 text-sm text-yellow-200">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
            <p><span className="font-black text-yellow-400">Penting:</span> Jangan minta reset memakai nomor lain. Ini untuk menjaga keamanan akun kamu.</p>
          </div>
        </div>

        <Button type="button" onClick={onUnderstand} className="mt-6 h-12 w-full rounded-2xl gradient-primary font-black text-primary-foreground">
          Mengerti
        </Button>
      </div>
    </div>
  );
}

function GuideStep({ number, title, description, children }: { number: string; title: string; description: string; children?: ReactNode }) {
  return (
    <div className="flex gap-4 py-4 text-left">
      <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/20 text-xs font-black text-emerald-300">
        {number}
      </div>
      <div className="min-w-0">
        <p className="font-black text-white">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {children}
      </div>
    </div>
  );
}

function InfoPill({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

export default ForgotPassword;
