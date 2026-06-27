import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  MessageCircle,
  PartyPopper,
  Play,
  ShieldCheck,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, assetUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type RegisterSuccessState = {
  name: string;
  wa: string;
  password: string;
  mentor?: {
    name: string;
    wa: string;
  };
};

type CopyTarget = "wa" | "password" | null;

const RegisterSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as RegisterSuccessState | null;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [copied, setCopied] = useState<CopyTarget>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (!state?.wa || !state?.password) {
      navigate("/register", { replace: true });
    }
  }, [navigate, state?.password, state?.wa]);

  const mentor = state?.mentor ?? { name: "Tim BuatCuan", wa: "080000000000" };
  const displayName = state?.name?.trim().split(/\s+/)[0] || "Member";
  const wa = state?.wa ?? "";
  const password = state?.password ?? "";

  const copyValue = async (target: Exclude<CopyTarget, null>, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(target);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const goLogin = () => {
    setLoginLoading(true);
    window.setTimeout(() => {
      navigate("/login", { replace: true, state: { wa } });
    }, 650);
  };

  if (!state?.wa || !state?.password) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 bg-gradient-hero pointer-events-none" />
      <main className="relative mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-white/10 bg-card/80 p-5 shadow-[0_22px_80px_hsl(0_0%_0%_/_0.18)] backdrop-blur">
          <div className="border-b border-white/10 pb-7 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-primary bg-primary/15 text-primary">
              <PartyPopper className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-2xl font-black">
              Selamat, <span className="text-primary">{displayName}</span>
            </h1>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
              Akun BuatCuan kamu sudah aktif. Kamu sekarang resmi jadi bagian keluarga BuatCuan.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <StatusPill tone="green" icon={Check}>Member FREE Aktif</StatusPill>
              <StatusPill tone="yellow" icon={Sparkles}>Komisi 10% Aktif</StatusPill>
            </div>
          </div>

          <SectionLabel>Info Login Kamu - Simpan Baik-Baik</SectionLabel>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-background/55">
            <div className="flex items-center gap-3 border-b border-white/10 p-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-black">Kredensial masuk</p>
                <p className="text-xs text-muted-foreground">Gunakan ini setiap kali mau masuk ke BuatCuan</p>
              </div>
            </div>
            <CredentialRow
              label="Nomor HP (WhatsApp)"
              value={formatPhoneIntl(wa)}
              copyLabel="Salin nomor HP"
              copied={copied === "wa"}
              onCopy={() => copyValue("wa", wa)}
            />
            <CredentialRow
              label="Password"
              value={passwordVisible ? password : "•".repeat(Math.max(8, password.length))}
              copyLabel="Salin password"
              copied={copied === "password"}
              onCopy={() => copyValue("password", password)}
              action={
                <IconButton label={passwordVisible ? "Sembunyikan password" : "Lihat password"} onClick={() => setPasswordVisible((visible) => !visible)}>
                  {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </IconButton>
              }
            />
          </div>

          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-xs font-semibold leading-relaxed text-primary">
            <Sparkles className="mr-2 inline h-4 w-4" />
            Catat atau screenshot info di atas sebelum lanjut. Kamu akan butuh ini setiap kali mau masuk ke BuatCuan.
          </div>

          <SectionLabel>Tonton Dulu - Cara Bookmark & Simpan Login</SectionLabel>
          <BookmarkLoginVideo />

          <SectionLabel>Mentor Kamu</SectionLabel>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/55 p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/15 text-primary">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{formatPhoneLocal(mentor.wa)}</p>
              <p className="truncate text-xs text-muted-foreground">{mentor.name}. Ada pertanyaan? Hubungi langsung via WA</p>
            </div>
            <a
              href={mentorWhatsappUrl(mentor.wa, displayName)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-black hover:bg-secondary"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </a>
          </div>

          <Button type="button" variant="outline" onClick={goLogin} disabled={loginLoading} className="mt-5 h-14 w-full rounded-2xl border-white/15 bg-transparent text-base font-black">
            {loginLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
            {loginLoading ? "Mengalihkan..." : "Masuk Sekarang"}
          </Button>
          <p className="mt-3 text-center text-xs font-semibold text-muted-foreground">Kamu akan diarahkan ke halaman masuk</p>
        </section>
      </main>
    </div>
  );
};

function BookmarkLoginVideo() {
  const { data } = useQuery({
    queryKey: ["usage-videos", "/register/success"],
    queryFn: () => api.usageVideos("/register/success"),
    staleTime: 60_000,
  });
  const [progress, setProgress] = useState(12);
  const video = data?.items[0];
  const previewUrl = video?.videoUrl ? assetUrl(video.videoUrl) : "";
  const title = video?.title ?? "Cara bookmark & simpan info login di HP";
  const subtitle = video?.subtitle ?? "Simpan halaman login dan catat kredensial supaya mudah masuk lagi";
  const duration = video?.durationLabel ?? "1:30";

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => (current >= 96 ? 12 : current + 2));
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-blue-500/25 bg-[#071523]">
      <div className="relative grid min-h-[138px] place-items-center bg-blue-500/10">
        {previewUrl ? <video src={previewUrl} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover opacity-45" /> : null}
        <div className="relative z-10 text-center text-blue-300">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-blue-400 bg-blue-500/10">
            <Play className="ml-1 h-5 w-5 fill-current" />
          </span>
          <p className="mt-3 text-xs font-semibold">Tonton panduan - {duration}</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-950">
          <div className="h-full rounded-r-full bg-blue-400 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm font-black text-white">{title}</p>
        <p className="mt-1 text-xs font-semibold text-blue-200/70">{subtitle}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <BlueTag icon={Bookmark}>Bookmark</BlueTag>
          <BlueTag icon={Smartphone}>Simpan di catatan</BlueTag>
          <BlueTag icon={Smartphone}>Android & iPhone</BlueTag>
        </div>
      </div>
    </section>
  );
}

function CredentialRow({
  label,
  value,
  copyLabel,
  copied,
  onCopy,
  action,
}: {
  label: string;
  value: string;
  copyLabel: string;
  copied: boolean;
  onCopy: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 p-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 break-all text-base font-black">{value}</p>
      </div>
      {action}
      <IconButton label={copyLabel} onClick={onCopy} copied={copied}>
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
      </IconButton>
    </div>
  );
}

function IconButton({ label, onClick, copied, children }: { label: string; onClick: () => void; copied?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-background text-muted-foreground transition-colors hover:text-foreground",
        copied ? "border-primary/40 bg-primary/10 text-primary" : "",
      )}
    >
      {children}
    </button>
  );
}

function StatusPill({ tone, icon: Icon, children }: { tone: "green" | "yellow"; icon: LucideIcon; children: ReactNode }) {
  const toneClass = tone === "green"
    ? "border-primary/35 bg-primary/15 text-primary"
    : "border-yellow-500/35 bg-yellow-500/15 text-yellow-300";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black", toneClass)}>
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="mb-3 mt-6 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">{children}</p>;
}

function BlueTag({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/25 bg-blue-500/10 px-2 py-1 text-[11px] font-bold text-blue-300">
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}

function formatPhoneIntl(wa: string) {
  const digits = wa.replace(/\D/g, "");
  const national = digits.startsWith("62") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits;
  return `+62 ${national.replace(/(\d{3})(\d{4})(\d+)/, "$1-$2-$3")}`;
}

function formatPhoneLocal(wa: string) {
  const digits = wa.replace(/\D/g, "");
  const local = digits.startsWith("62") ? `0${digits.slice(2)}` : digits.startsWith("8") ? `0${digits}` : digits;
  return local.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
}

function mentorWhatsappUrl(wa: string, name: string) {
  const digits = wa.replace(/\D/g, "");
  const number = digits.startsWith("0") ? `62${digits.slice(1)}` : digits.startsWith("8") ? `62${digits}` : digits;
  const message = `Halo, saya ${name}. Saya baru daftar BuatCuan dan mau tanya langkah berikutnya.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export default RegisterSuccess;
