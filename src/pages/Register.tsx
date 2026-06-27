import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ManagedUsageVideoCard } from "@/components/ManagedUsageVideoCard";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { normalizeIndonesianPhoneNumber } from "@/lib/phone";
import { toast } from "sonner";
import { Building2, Link as LinkIcon, Loader2, Lock, PencilLine, ShieldCheck, UserRound } from "lucide-react";
import { ThemeModeToggle } from "@/components/ThemeModeToggle";
import { BackButton } from "@/components/BackButton";

type RegisterErrors = Partial<Record<"name" | "wa" | "password" | "confirmPassword" | "referral" | "terms", string>>;
type ReferralSource = "default" | "link" | "manual";
type ReferralMeta = {
  name: string;
  wa: string;
  referralCode: string;
  publicIdentifier: string;
  validReferral: boolean;
  fallbackUsed: boolean;
};

const fieldErrorClass = "border-destructive focus-visible:ring-destructive";
const phoneErrorClass = "border-destructive focus-within:ring-destructive";
const defaultReferral = "080000000000";

const normalizeReferral = (referral: string) => {
  const value = referral.trim();

  if (!value) return undefined;
  if (/^[+\d\s().-]+$/.test(value)) return normalizeIndonesianPhoneNumber(value);

  return value.toUpperCase();
};

const isPhoneReferral = (referral: string) => /^[+\d\s().-]+$/.test(referral.trim());

const formatReferralDisplay = (referral: string) => {
  const value = referral.trim();
  if (!isPhoneReferral(value)) return value.toUpperCase();

  const normalized = normalizeIndonesianPhoneNumber(value) || value.replace(/\D/g, "");
  return normalized.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
};

const Register = () => {
  const { register } = useApp();
  const nav = useNavigate();
  const { ref } = useParams();
  const [searchParams] = useSearchParams();
  const urlReferral = useMemo(
    () => ref ?? searchParams.get("ref") ?? searchParams.get("referral") ?? searchParams.get("kode") ?? searchParams.get("wa") ?? "",
    [ref, searchParams],
  );
  const initialReferral = urlReferral || defaultReferral;
  const [form, setForm] = useState({ name: "", wa: "", password: "", confirmPassword: "", referral: initialReferral });
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [referralEditing, setReferralEditing] = useState(false);
  const [referralSource, setReferralSource] = useState<ReferralSource>(urlReferral ? "link" : "default");
  const [referralMeta, setReferralMeta] = useState<ReferralMeta | null>(null);
  const [referralNotice, setReferralNotice] = useState("");
  const [referralResolving, setReferralResolving] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const applyReferral = useCallback(async (rawReferral: string, source: ReferralSource) => {
    const requestedReferral = rawReferral.trim() || defaultReferral;
    setReferralResolving(true);
    try {
      const result = await api.affiliate.resolveReferral(requestedReferral);
      const resolvedReferral = result.referral?.publicIdentifier ?? defaultReferral;
      setForm((current) => ({ ...current, referral: resolvedReferral }));
      setReferralSource(result.validReferral ? source : "default");
      setReferralMeta(result.referral ? { ...result.referral, validReferral: result.validReferral, fallbackUsed: result.fallbackUsed } : null);
      setReferralEditing(false);
      setErrors((current) => ({ ...current, referral: undefined }));

      if (!result.validReferral && requestedReferral !== defaultReferral) {
        const message = "Referral tidak terdaftar.";
        setReferralNotice(message);
        toast.error(message);
        return;
      }

      setReferralNotice("");
      if (source === "link" && result.validReferral) {
        const key = `buatcuan:ref-click:${requestedReferral.toUpperCase()}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          void api.affiliate.trackClick(requestedReferral).catch(() => {
            sessionStorage.removeItem(key);
          });
        }
      }
    } catch {
      const message = "Referral belum bisa dicek.";
      setForm((current) => ({ ...current, referral: defaultReferral }));
      setReferralSource("default");
      setReferralMeta(null);
      setReferralNotice(message);
      toast.error(message);
    } finally {
      setReferralResolving(false);
    }
  }, []);

  useEffect(() => {
    void applyReferral(urlReferral || defaultReferral, urlReferral ? "link" : "default");
  }, [applyReferral, urlReferral]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || referralResolving || !termsAccepted) return;
    const nextErrors: RegisterErrors = {};
    const name = form.name.trim();
    const phone = normalizeIndonesianPhoneNumber(form.wa);
    const referral = form.referral.trim();

    if (!name) nextErrors.name = "Nama lengkap wajib diisi";
    else if (name.length < 2) nextErrors.name = "Nama lengkap minimal 2 karakter";

    if (!phone) nextErrors.wa = "Nomor telepon wajib diisi";
    else if (phone.length < 9) nextErrors.wa = "Nomor telepon minimal 8 digit setelah +62";

    if (!form.password) nextErrors.password = "Password wajib diisi";
    else if (form.password.length < 8) nextErrors.password = "Password minimal 8 karakter";

    if (!form.confirmPassword) nextErrors.confirmPassword = "Ulangi password wajib diisi";
    else if (form.password && form.password !== form.confirmPassword) nextErrors.confirmPassword = "Ulangi password belum sama";

    if (referral && referral.length < 3) nextErrors.referral = "Referral minimal 3 karakter";
    else if (referral && referral.length > 32) nextErrors.referral = "Referral maksimal 32 karakter";

    if (!termsAccepted) nextErrors.terms = "Setujui Syarat dan Ketentuan dulu";

    setErrors(nextErrors);
    const firstError = Object.values(nextErrors)[0];
    if (firstError) {
      if (nextErrors.terms) setTermsOpen(true);
      toast.error(firstError);
      return;
    }

    setSubmitting(true);
    try {
      const result = await register({
        ...form,
        wa: normalizeIndonesianPhoneNumber(form.wa),
        referral: normalizeReferral(form.referral),
        termsAccepted,
      });
      if (result.success) {
        toast.success("Akun dibuat. Simpan info login kamu.");
        nav("/register/success", {
          replace: true,
          state: {
            name,
            wa: phone,
            password: form.password,
            mentor: referralMeta
              ? {
                  name: referralMeta.name,
                  wa: referralMeta.wa,
                }
              : {
                  name: "Tim BuatCuan",
                  wa: defaultReferral,
                },
          },
        });
      } else {
        toast.error(result.message ?? "Pendaftaran gagal. Cek referral dan data kamu.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const referralIsFromLink = referralSource === "link" && Boolean(referralMeta?.validReferral);
  const referralIsDefault = referralSource === "default";
  const referralSubtitle = referralResolving
    ? "Mengecek referral..."
    : referralMeta
      ? `${referralMeta.name}${referralIsDefault ? " (default)" : ""}`
      : referralIsDefault
        ? "Tim BuatCuan (default)"
        : "Kode referral manual";

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 bg-gradient-hero pointer-events-none" />
      <div className="max-w-md mx-auto px-5 py-8 relative">
        <div className="flex items-center justify-between gap-3">
          <BackButton to="/" />
          <ThemeModeToggle />
        </div>
        <div className="mt-8">
          <h1 className="text-3xl font-extrabold">Daftar <span className="text-gradient-primary">Sekarang</span></h1>
          <p className="text-muted-foreground mt-1">Gas mulai dari 0 ke hasil.</p>
        </div>

        <ManagedUsageVideoCard
          targetPath="/register"
          fallback={{
            label: "Cara Daftar",
            title: "Tata Cara Daftar BuatCuan",
            subtitle: "Ikuti urutan isi data, cek referral mentor, lalu lanjut aktivasi membership",
            durationLabel: "2 menit",
            thumbnailGradient: "from-emerald-950 via-zinc-950 to-lime-950",
          }}
          className="mt-5"
        />

        <form onSubmit={submit} className="mt-5 space-y-4 glass-card p-5 rounded-3xl">
          <div className="space-y-2">
            <Label>Nama Lengkap</Label>
            <Input
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setErrors((current) => ({ ...current, name: undefined }));
              }}
              placeholder="Nama kamu"
              aria-invalid={Boolean(errors.name)}
              className={`h-12 rounded-2xl bg-secondary ${errors.name ? fieldErrorClass : "border-white/10"}`}
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Nomor Telepon</Label>
            <PhoneInput
              value={form.wa}
              onValueChange={(value) => {
                setForm({ ...form, wa: value });
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
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                setErrors((current) => ({ ...current, password: undefined, confirmPassword: undefined }));
              }}
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              className={`h-12 rounded-2xl bg-secondary ${errors.password ? fieldErrorClass : "border-white/10"}`}
            />
            {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Ulangi Password</Label>
            <PasswordInput
              value={form.confirmPassword}
              onChange={(e) => {
                setForm({ ...form, confirmPassword: e.target.value });
                setErrors((current) => ({ ...current, confirmPassword: undefined }));
              }}
              placeholder="Ulangi password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              className={`h-12 rounded-2xl bg-secondary ${errors.confirmPassword ? fieldErrorClass : "border-white/10"}`}
            />
            {errors.confirmPassword ? <p className="text-xs text-destructive">{errors.confirmPassword}</p> : null}
          </div>
          <div className={`rounded-2xl border bg-secondary/50 p-4 ${errors.referral ? "border-destructive" : "border-white/10"}`}>
            <div className="space-y-3">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground">Referral mentor</p>
                {referralIsFromLink ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/35 bg-primary/15 px-2 py-1 text-[10px] font-bold text-primary">
                    <LinkIcon className="h-3 w-3" /> Dari link
                  </span>
                ) : referralIsDefault ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-background/50 px-2 py-1 text-[10px] font-bold text-muted-foreground">
                    <Lock className="h-3 w-3" /> Default
                  </span>
                ) : null}
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${referralIsFromLink ? "border-primary/40 bg-primary/15 text-primary" : "border-white/10 bg-background/60 text-muted-foreground"}`}>
                  {referralResolving ? <Loader2 className="h-4 w-4 animate-spin" /> : referralIsFromLink ? <UserRound className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-foreground">{formatReferralDisplay(form.referral)}</p>
                  <p className="truncate text-xs text-muted-foreground">{referralSubtitle}</p>
                </div>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={referralResolving}
                        onClick={() => setReferralEditing((open) => !open)}
                        aria-label="Ganti kode referral"
                        className="h-10 w-10 shrink-0 rounded-xl border-white/10 bg-background"
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="end">Ganti kode referral</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            {referralEditing ? (
              <div className="mt-3 space-y-2">
                <Input
                  value={form.referral}
                  onChange={(e) => {
                    setForm({ ...form, referral: e.target.value.toUpperCase() });
                    setReferralSource("manual");
                    setReferralNotice("");
                    setErrors((current) => ({ ...current, referral: undefined }));
                  }}
                  placeholder="Contoh: BUATCUAN atau 08xxxxxxxxxx"
                  aria-invalid={Boolean(errors.referral)}
                  className={`h-12 rounded-2xl bg-background uppercase ${errors.referral ? fieldErrorClass : "border-white/10"}`}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" disabled={referralResolving} onClick={() => void applyReferral(defaultReferral, "default")} className="h-9 rounded-xl px-3 text-xs font-bold">
                    Reset
                  </Button>
                  <Button type="button" disabled={referralResolving} onClick={() => void applyReferral(form.referral, "manual")} className="h-9 rounded-xl px-3 text-xs font-bold">
                    {referralResolving ? "Mengecek..." : "Pakai kode"}
                  </Button>
                </div>
              </div>
            ) : null}
            {referralNotice ? <p className="mt-2 text-xs font-semibold text-yellow-500">{referralNotice}</p> : null}
            {errors.referral ? <p className="mt-2 text-xs text-destructive">{errors.referral}</p> : null}
          </div>
          <div className={`flex items-start gap-3 rounded-2xl border bg-secondary/60 p-3 ${errors.terms ? "border-destructive" : "border-white/10"}`}>
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => {
                if (checked) {
                  setErrors((current) => ({ ...current, terms: undefined }));
                  setTermsOpen(true);
                  return;
                }
                setTermsAccepted(false);
              }}
              className="mt-0.5"
            />
            <Label htmlFor="terms" className="cursor-pointer text-xs leading-relaxed text-muted-foreground">
              {errors.terms ? <span className="text-destructive">{errors.terms}. </span> : null}
              Saya setuju dengan <span className="font-semibold text-primary">Syarat dan Ketentuan</span> dan <Link to="/privacy" className="font-semibold text-primary">Kebijakan Privasi</Link> BuatCuan.
            </Label>
          </div>
          <Button type="submit" disabled={!termsAccepted || referralResolving || submitting} className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-glow-sm disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Memproses..." : referralResolving ? "Mengecek referral..." : "Buat Akun & Lanjut"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Sudah punya akun? <Link to="/login" className="text-primary font-semibold">Masuk</Link>
        </p>
      </div>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl border-white/10 bg-card p-0 sm:max-w-md">
          <DialogHeader className="px-5 pt-5 text-left">
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-2xl border border-primary/30 bg-primary/15">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Syarat dan Ketentuan</DialogTitle>
            <DialogDescription>Baca dan setujui sebelum membuat akun BuatCuan.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[52vh] space-y-3 overflow-y-auto px-5 text-sm leading-relaxed text-muted-foreground">
            <p>
              Dengan mendaftar, kamu menyatakan data yang diberikan benar, termasuk nama dan nomor telepon aktif yang
              terdaftar WhatsApp untuk akun, komunikasi, referral, dan proses pembayaran.
            </p>
            <p>
              Akun baru berstatus belum aktif sampai pembayaran membership berhasil diproses. Akses materi, bimbingan,
              affiliate, dan fitur lain mengikuti status membership akun.
            </p>
            <p>
              Referral yang dimasukkan saat pendaftaran akan digunakan untuk menentukan hubungan member dan komisi sesuai
              ketentuan program. Kesalahan input referral menjadi tanggung jawab pendaftar sebelum akun dibuat.
            </p>
            <p>
              Pengguna wajib memakai platform secara wajar, tidak menyalahgunakan sistem, tidak membuat akun palsu, dan
              tidak melakukan aktivitas yang merugikan pengguna lain atau BuatCuan.
            </p>
          </div>
          <DialogFooter className="gap-2 px-5 pb-5 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => setTermsOpen(false)} className="rounded-2xl border-white/10 bg-secondary">
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => {
                setTermsAccepted(true);
                setErrors((current) => ({ ...current, terms: undefined }));
                setTermsOpen(false);
              }}
              className="rounded-2xl gradient-primary text-primary-foreground font-bold"
            >
              Setuju
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Register;
