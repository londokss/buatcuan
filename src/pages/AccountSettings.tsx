import { FormEvent, ReactNode, useEffect, useState } from "react";
import { KeyRound, Save, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";

const AccountSettings = () => {
  const { user, refreshUser } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  if (!user) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (nameChanged && !canChangeName) {
      toast.error(`Nama baru bisa diubah lagi pada ${formatDateTime(user.nameCanChangeAt)}.`);
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Konfirmasi password baru belum sama.");
      return;
    }
    if (passwordChanged && !currentPassword) {
      toast.error("Password saat ini wajib diisi untuk mengganti password.");
      return;
    }

    if (!nameChanged && !passwordChanged) {
      toast.error("Belum ada perubahan yang perlu disimpan.");
      return;
    }

    setConfirmOpen(true);
  };

  const sensitiveChange = Boolean(newPassword);
  const nameChanged = name.trim() !== user.name;
  const passwordChanged = Boolean(newPassword);
  const canChangeName = !user.nameCanChangeAt || new Date(user.nameCanChangeAt) <= new Date();
  const nameStatus = nameChangeStatus(user.nameCanChangeAt);

  const saveChanges = async () => {
    setSaving(true);
    try {
      await api.auth.updateAccount({
        ...(nameChanged ? { name: name.trim() } : {}),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      await refreshUser();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setConfirmOpen(false);
      toast.success("Pengaturan akun disimpan");
    } catch (error) {
      toast.error(getErrorMessage(error, "Pengaturan akun gagal disimpan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Akun Client</p>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight">Pengaturan Akun</h1>
        <p className="mt-1 text-sm text-muted-foreground">Kelola identitas login dan keamanan akun member.</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <section className="glass-card rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <p className="font-extrabold">Profil</p>
              <p className="text-xs text-muted-foreground">Nama bisa diubah setiap 90 hari. Nomor WhatsApp menjadi data utama akun.</p>
            </div>
          </div>
          <div className="space-y-4">
            <Field label="Nama">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!canChangeName}
                className="h-12 rounded-2xl bg-secondary disabled:cursor-not-allowed disabled:opacity-70"
              />
              {!canChangeName && (
                <p className="mt-2 text-xs font-semibold text-muted-foreground">
                  Nama bisa diubah lagi pada {formatDateTime(user.nameCanChangeAt)}.
                </p>
              )}
              <p className="mt-2 text-xs font-semibold text-muted-foreground">{nameStatus}</p>
            </Field>
            <Field label="Nomor WhatsApp">
              <p className="break-words text-sm font-semibold text-foreground">{user.wa}</p>
            </Field>
          </div>
        </section>

        <section className="glass-card rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent/15 text-accent">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <p className="font-extrabold">Password</p>
              <p className="text-xs text-muted-foreground">Isi hanya jika ingin mengganti password.</p>
            </div>
          </div>
          <div className="space-y-4">
            <Field label={sensitiveChange ? "Password Saat Ini" : "Password Saat Ini (opsional)"}>
              <PasswordInput value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" className="h-12 rounded-2xl bg-secondary" />
            </Field>
            <Field label="Password Baru">
              <PasswordInput value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" className="h-12 rounded-2xl bg-secondary" />
            </Field>
            <Field label="Konfirmasi Password Baru">
              <PasswordInput value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" className="h-12 rounded-2xl bg-secondary" />
            </Field>
          </div>
        </section>

        <div className="rounded-3xl border border-primary/20 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Perubahan password wajib dikonfirmasi dengan password saat ini.
            </p>
          </div>
        </div>

        <Button type="submit" disabled={saving} className="h-14 w-full rounded-2xl gradient-primary font-extrabold text-primary-foreground">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </form>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Simpan perubahan akun?"
        description={
          <div className="space-y-2 text-left">
            {nameChanged && (
              <p>
                Nama akan diganti menjadi <span className="font-semibold text-foreground">{name.trim()}</span>. Setelah disimpan,
                nama baru bisa diganti lagi setelah 90 hari.
              </p>
            )}
            {passwordChanged && <p>Password akun akan diganti. Pastikan password baru sudah benar.</p>}
          </div>
        }
        confirmLabel="Ya, simpan"
        loading={saving}
        onConfirm={saveChanges}
      />
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
};

const nameChangeStatus = (iso?: string | null) => {
  if (!iso) return "Nama bisa diubah sekarang. Setelah disimpan, nama terkunci selama 90 hari.";
  const target = new Date(iso);
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return "Nama bisa diubah sekarang. Setelah disimpan, nama terkunci selama 90 hari.";
  const totalHours = Math.ceil(diffMs / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const dayText = days > 0 ? `${days} hari` : "";
  const hourText = hours > 0 ? `${hours} jam` : "";
  return `Sisa waktu edit nama: ${[dayText, hourText].filter(Boolean).join(" ")}.`;
};

export default AccountSettings;
