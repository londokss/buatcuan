import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/context/AppContext";
import { normalizeIndonesianPhoneNumber } from "@/lib/phone";
import { toast } from "sonner";
import { ThemeModeToggle } from "@/components/ThemeModeToggle";
import { BackButton } from "@/components/BackButton";
import { api, assetUrl, authStorage, type UsageVideoDto } from "@/lib/api";
import { VerticalMediaViewer, type VerticalMediaItem } from "@/components/VerticalMediaViewer";
import { cn } from "@/lib/utils";

type LoginErrors = Partial<Record<"wa" | "pw", string>>;

const fieldErrorClass = "border-destructive focus-visible:ring-destructive";
const phoneErrorClass = "border-destructive focus-within:ring-destructive";

const Login = () => {
  const { login } = useApp();
  const nav = useNavigate();
  const location = useLocation();
  const initialWa = (location.state as { wa?: string } | null)?.wa ?? "";
  const [wa, setWa] = useState(initialWa);
  const [pw, setPw] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: LoginErrors = {};
    const phone = normalizeIndonesianPhoneNumber(wa);

    if (!phone) {
      nextErrors.wa = "Nomor telepon wajib diisi";
    } else if (phone.length < 9) {
      nextErrors.wa = "Nomor telepon minimal 8 digit setelah +62";
    }

    if (!pw) {
      nextErrors.pw = "Password wajib diisi";
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const nextErrors = validate();
    const firstError = Object.values(nextErrors)[0];
    if (firstError) {
      toast.error(firstError);
      return;
    }

    setSubmitting(true);
    const result = await login(normalizeIndonesianPhoneNumber(wa), pw, remember);
    setSubmitting(false);
    if (result.success) {
      toast.success("Selamat datang kembali!");
      const role = authStorage.getUser()?.role ?? "member";
      nav(role === "admin" ? "/admin" : "/app");
    } else toast.error(result.message ?? "Cek lagi data kamu ya");
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 bg-gradient-hero pointer-events-none" />
      <div className="max-w-md mx-auto px-5 py-8 relative">
        <div className="flex items-center justify-between gap-3">
          <BackButton to="/" />
          <ThemeModeToggle />
        </div>
        <div className="mt-8">
          <h1 className="text-3xl font-extrabold">Masuk ke <span className="text-gradient-primary">BuatCuan</span></h1>
          <p className="text-muted-foreground mt-1">Lanjut perjalanan cuan kamu.</p>
        </div>

        <LoginMotivationVideo className="mt-8" />

        <form id="login-form" onSubmit={submit} className="mt-5 space-y-4 glass-card p-5 rounded-3xl">
          <div className="space-y-2">
            <Label>Nomor Telepon</Label>
            <PhoneInput
              value={wa}
              onValueChange={(value) => {
                setWa(value);
                setErrors((current) => ({ ...current, wa: undefined }));
              }}
              aria-invalid={Boolean(errors.wa)}
              className={errors.wa ? phoneErrorClass : undefined}
            />
            <p className={errors.wa ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {errors.wa ?? "Gunakan nomor telepon aktif yang terdaftar WhatsApp."}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <PasswordInput
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setErrors((current) => ({ ...current, pw: undefined }));
              }}
              placeholder="••••••••"
              aria-invalid={Boolean(errors.pw)}
              className={`h-12 rounded-2xl bg-secondary ${errors.pw ? fieldErrorClass : "border-white/10"}`}
            />
            {errors.pw ? <p className="text-xs text-destructive">{errors.pw}</p> : null}
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs font-semibold text-primary">Lupa password?</Link>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-secondary/60 px-4 py-3">
            <div className="min-w-0">
              <Label htmlFor="remember-login" className="text-sm font-extrabold">Tetap masuk</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">Aktif supaya tidak perlu login ulang di HP ini.</p>
            </div>
            <Switch
              id="remember-login"
              checked={remember}
              onCheckedChange={setRemember}
              aria-label="Tetap masuk"
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-glow-sm disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : "Masuk"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Belum punya akun? <Link to="/register" className="text-primary font-semibold">Daftar gratis sekarang</Link>
        </p>
      </div>
    </div>
  );
};

function LoginMotivationVideo({ className }: { className?: string }) {
  const { data } = useQuery({
    queryKey: ["usage-videos", "/login"],
    queryFn: () => api.usageVideos("/login"),
    staleTime: 60_000,
  });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const fallback = {
    title: "Satu langkah kecil hari ini lebih baik dari nol",
    subtitle: "Motivasi singkat sebelum lanjut masuk",
    label: "Motivasi hari ini",
    durationLabel: "0:58",
    thumbnailGradient: "from-violet-950 via-zinc-950 to-fuchsia-950",
  };
  const video = data?.items[0];
  const content = video ?? fallback;
  const previewVideoUrl = "videoUrl" in content && content.videoUrl ? assetUrl(content.videoUrl) : "";
  const viewerItems = useMemo<VerticalMediaItem[]>(() => {
    const source: Array<Partial<UsageVideoDto> & typeof fallback> = data?.items.length
      ? data.items.map((item) => ({ ...fallback, ...item }))
      : [];
    return source
      .filter((item) => item.videoUrl)
      .map((item, index) => ({
        id: item.id ?? `/login-${index}`,
        type: "video" as const,
        title: item.title,
        subtitle: item.subtitle,
        description: item.durationLabel,
        url: item.videoUrl,
        downloadName: `${item.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "motivasi-login"}.mp4`,
        downloadLabel: "Download",
        terms: [
          "Tonton motivasi singkat ini untuk mulai dengan fokus.",
          "Gunakan panduan BuatCuan sesuai kebutuhan akun kamu.",
        ],
      }));
  }, [data?.items]);
  const canOpenViewer = viewerItems.length > 0;

  const openViewer = () => {
    if (!canOpenViewer) return;
    setViewerIndex(0);
    setViewerOpen(true);
  };

  if (data?.hasConfigured && data.items.length === 0) return null;

  return (
    <section className={cn("overflow-hidden rounded-2xl border border-white/10 bg-card", className)}>
      <button
        type="button"
        onClick={openViewer}
        className={cn("relative grid h-28 w-full place-items-center overflow-hidden bg-gradient-to-br", content.thumbnailGradient ?? fallback.thumbnailGradient)}
        aria-label={`Putar ${content.title}`}
      >
        {previewVideoUrl ? <video src={previewVideoUrl} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 flex flex-col items-center gap-2 text-violet-300">
          <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-violet-400/80 bg-violet-500/10">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
          <span className="text-xs font-semibold">{content.label ?? "Motivasi hari ini"} - {content.durationLabel ?? "0:58"}</span>
        </div>
      </button>
      <div className="flex items-center gap-2 p-4">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-violet-300" />
          <p className="truncate text-sm font-extrabold">{content.title}</p>
        </div>
      </div>
      <VerticalMediaViewer open={viewerOpen} items={viewerItems} index={viewerIndex} onOpenChange={setViewerOpen} onIndexChange={setViewerIndex} />
    </section>
  );
}

export default Login;
