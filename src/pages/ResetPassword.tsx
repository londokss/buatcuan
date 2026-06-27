import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BackButton } from "@/components/BackButton";
import { ThemeModeToggle } from "@/components/ThemeModeToggle";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { api, authStorage, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

const fieldErrorClass = "border-destructive focus-visible:ring-destructive";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get("token")?.trim() ?? "", [params]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!token) {
      setError("Token reset password tidak ditemukan.");
      return;
    }
    if (password.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password baru belum sama.");
      return;
    }

    setSubmitting(true);
    try {
      await api.auth.completePasswordReset({ token, password });
      authStorage.clear();
      toast.success("Password berhasil diganti. Silakan login.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal mengganti password"));
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
          <h1 className="text-3xl font-extrabold">Set Password Baru</h1>
          <p className="mt-1 text-muted-foreground">Link hanya bisa dipakai sekali dan berlaku singkat.</p>
        </div>

        {!token ? (
          <div className="mt-8 rounded-3xl border border-destructive/20 bg-destructive/10 p-5">
            <p className="text-sm font-semibold text-destructive">Token reset tidak ditemukan di URL.</p>
            <Button asChild className="mt-4 h-12 w-full rounded-2xl gradient-primary font-bold text-primary-foreground">
              <Link to="/forgot-password">Buat Request Baru</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl glass-card p-5">
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <PasswordInput
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
                className={`h-12 rounded-2xl bg-secondary ${error ? fieldErrorClass : "border-white/10"}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Ulangi Password Baru</Label>
              <PasswordInput
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                }}
                autoComplete="new-password"
                placeholder="Ulangi password"
                className={`h-12 rounded-2xl bg-secondary ${error ? fieldErrorClass : "border-white/10"}`}
              />
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
            <Button type="submit" disabled={submitting} className="h-12 w-full rounded-2xl gradient-primary font-bold text-primary-foreground shadow-glow-sm">
              {submitting ? "Menyimpan..." : "Simpan Password Baru"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
