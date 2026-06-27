import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Camera,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  MessageCircle,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { api, getErrorMessage } from "@/lib/api";
import { useApp } from "@/context/AppContext";

export function ProfileEditPage() {
  const { user, refreshUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(() => makeGeneratedAvatar(user?.name ?? "Member", user?.id ?? "buatcuan"));
  const [pendingAvatar, setPendingAvatar] = useState<{ url: string; label: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [avatarConfirmOpen, setAvatarConfirmOpen] = useState(false);

  const persistedAvatar = useMemo(() => {
    if (!user) return "";
    return user.avatarUrl ?? makeGeneratedAvatar(user.name, user.id);
  }, [user]);

  const avatarChoices = useMemo(() => {
    if (!user) return [];
    return Array.from({ length: 6 }, (_, index) => makeGeneratedAvatar(user.name, `${user.id}-${user.myRefCode}-${index}`));
  }, [user]);

  useEffect(() => {
    setName(user?.name ?? "");
    if (user) setAvatarUrl(user.avatarUrl ?? makeGeneratedAvatar(user.name, user.id));
  }, [user]);

  if (!user) return null;

  const nameChanged = name.trim() !== user.name;
  const avatarChanged = avatarUrl !== persistedAvatar;
  const hasChanges = nameChanged || avatarChanged;
  const canChangeName = !user.nameCanChangeAt || new Date(user.nameCanChangeAt) <= new Date();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!hasChanges) return toast.error("Belum ada perubahan profil.");
    if (!canChangeName) return toast.error(`Nama baru bisa diubah lagi pada ${formatDate(user.nameCanChangeAt)}.`);
    setSaveOpen(true);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      await api.auth.updateAccount({
        ...(nameChanged ? { name: name.trim(), currentPassword: currentPassword || undefined } : {}),
        ...(avatarChanged ? { avatarUrl } : {}),
      });
      await refreshUser();
      setCurrentPassword("");
      setSaveOpen(false);
      toast.success("Profil berhasil diperbarui");
    } catch (error) {
      toast.error(getErrorMessage(error, "Profil gagal diperbarui."));
    } finally {
      setSaving(false);
    }
  };

  const requestAvatarChange = (url: string, label: string) => {
    setPendingAvatar({ url, label });
    setAvatarConfirmOpen(true);
  };

  const applyPendingAvatar = () => {
    if (!pendingAvatar) return;
    setAvatarUrl(pendingAvatar.url);
    setPendingAvatar(null);
    setAvatarConfirmOpen(false);
    toast.success("Preview foto profil diganti. Tekan Simpan Profil untuk menyimpan.");
  };

  const generateAvatar = () => {
    setAvatarUrl(makeGeneratedAvatar(user.name, `${user.id}-${Date.now()}`));
    setGenerateOpen(false);
    toast.success("Avatar otomatis baru dibuat. Tekan Simpan Profil untuk menyimpan.");
  };

  const openFilePicker = () => {
    setUploadOpen(false);
    window.setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const nextAvatar = await imageFileToAvatarDataUrl(file);
      requestAvatarChange(nextAvatar, "foto yang kamu pilih dari perangkat");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Foto profil gagal dibaca.");
    }
  };

  const saveCopy = profileSaveCopy(nameChanged, avatarChanged);

  return (
    <ProfilePageShell title="Edit Profil" subtitle="Ubah nama tampilan dan cek identitas akun." icon={UserRound} tone="primary">
      <form onSubmit={submit} className="space-y-4">
        <Panel>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleFileChange} />
          <div className="rounded-[28px] border border-primary/25 bg-primary/5 p-4">
            <div className="flex items-center gap-4">
              <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-primary/35 bg-secondary">
                <span className="grid h-full w-full place-items-center overflow-hidden rounded-full">
                  {avatarUrl ? <img src={avatarUrl} alt="Preview foto profil" className="h-full w-full object-cover" /> : <UserRound className="h-10 w-10 text-primary" />}
                </span>
                <span className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground">
                  <Camera className="h-4 w-4" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black">Foto Member</p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">
                  Kalau belum upload foto, sistem membuat avatar otomatis dan menyimpannya agar tidak berubah-ubah.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="h-10 rounded-2xl bg-card text-xs font-black" onClick={() => setGenerateOpen(true)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Baru
                  </Button>
                  <Button type="button" variant="outline" className="h-10 rounded-2xl bg-card text-xs font-black" onClick={() => setUploadOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Unggah Foto
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Pilihan avatar cepat</p>
              <div className="grid grid-cols-6 gap-2">
                {avatarChoices.map((avatar, index) => (
                  <button
                    key={avatar}
                    type="button"
                    className={`aspect-square overflow-hidden rounded-2xl border bg-secondary ${avatarUrl === avatar ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                    onClick={() => requestAvatarChange(avatar, `avatar otomatis pilihan ${index + 1}`)}
                    aria-label={`Pilih avatar ${index + 1}`}
                  >
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Field label="Nama">
            <Input value={name} onChange={(event) => setName(event.target.value)} disabled={!canChangeName} className="h-12 rounded-2xl bg-secondary" />
            <p className="mt-2 text-xs font-semibold text-muted-foreground">{nameChangeStatus(user.nameCanChangeAt)}</p>
          </Field>
          <Field label="Nomor WhatsApp Login">
            <p className="rounded-2xl bg-secondary px-4 py-3 text-sm font-bold">{user.wa}</p>
            <p className="mt-2 text-xs font-semibold text-muted-foreground">Nomor WA mentor bisa diubah di halaman khusus nomor WA.</p>
          </Field>
          <Field label="Password Saat Ini">
            <PasswordInput value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="h-12 rounded-2xl bg-secondary" />
            <p className="mt-2 text-xs font-semibold text-muted-foreground">Opsional untuk ganti nama. Wajib jika mengubah nomor WA atau password.</p>
          </Field>
        </Panel>
        <Button type="submit" disabled={saving || !hasChanges} className="h-14 w-full rounded-2xl font-black">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Profil"}
        </Button>
      </form>
      <ConfirmActionDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        title={saveCopy.title}
        description={saveCopy.description}
        confirmLabel="Ya, simpan profil"
        loading={saving}
        onConfirm={saveChanges}
      />
      <ConfirmActionDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        title="Buat avatar otomatis baru?"
        description="Preview foto profil akan diganti dengan avatar baru. Perubahan belum permanen sampai kamu menekan Simpan Profil."
        confirmLabel="Generate avatar"
        onConfirm={generateAvatar}
      />
      <ConfirmActionDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Pilih foto dari perangkat?"
        description="Gunakan foto yang jelas dan sopan. Foto akan dipotong otomatis menjadi kotak 1:1 sebelum disimpan."
        confirmLabel="Pilih foto"
        onConfirm={openFilePicker}
      />
      <ConfirmActionDialog
        open={avatarConfirmOpen}
        onOpenChange={setAvatarConfirmOpen}
        title="Gunakan foto profil ini?"
        description={`Preview foto profil akan diganti ke ${pendingAvatar?.label ?? "pilihan ini"}. Kamu masih bisa membatalkan sebelum menekan Simpan Profil.`}
        confirmLabel="Gunakan foto ini"
        onConfirm={applyPendingAvatar}
      />
    </ProfilePageShell>
  );
}

export function PersonalBrandingPage() {
  const { user, refreshUser } = useApp();
  const [handle, setHandle] = useState(user?.personalBrandHandle ?? creatorHandle(user?.name));
  const [tagline, setTagline] = useState(user?.personalBrandTagline ?? "");
  const [status, setStatus] = useState(user?.personalBrandStatus ?? "Creator Lv. 1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHandle(user?.personalBrandHandle ?? creatorHandle(user?.name));
    setTagline(user?.personalBrandTagline ?? "");
    setStatus(user?.personalBrandStatus ?? "Creator Lv. 1");
  }, [user]);

  if (!user) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.auth.updatePersonalBranding({
        handle,
        tagline,
        status,
      });
      await refreshUser();
      toast.success("Personal branding disimpan");
    } catch (error) {
      toast.error(getErrorMessage(error, "Personal branding gagal disimpan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfilePageShell title="Personal Branding" subtitle="Atur identitas kreator yang tampil di Catatan Kreator." icon={Sparkles} tone="primary">
      <form onSubmit={submit} className="space-y-4">
        <Panel>
          <div className="rounded-[28px] border border-primary/25 bg-primary/5 p-4">
            <p className="text-sm font-black" style={{ color: "hsl(var(--primary))" }}>{normalizeHandle(handle) || creatorHandle(user.name)}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{tagline || "Contoh: No-face · IRT & Keluarga · Video+Teks"}</p>
            <span className="mt-3 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
              {status || "Creator Lv. 1"}
            </span>
          </div>
          <Field label="Handle Kreator">
            <Input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@nama_kreator" className="h-12 rounded-2xl bg-secondary" />
          </Field>
          <Field label="Tag Personal Branding">
            <Input value={tagline} onChange={(event) => setTagline(event.target.value)} placeholder="No-face · Niche · Format konten" className="h-12 rounded-2xl bg-secondary" />
          </Field>
          <Field label="Status RPG">
            <Input value={status} onChange={(event) => setStatus(event.target.value)} placeholder="Creator Lv. 1" className="h-12 rounded-2xl bg-secondary" />
          </Field>
          <Button disabled={saving} className="h-12 w-full rounded-2xl font-black">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Menyimpan..." : "Simpan Personal Branding"}
          </Button>
        </Panel>
      </form>
    </ProfilePageShell>
  );
}

export function MentorWhatsappPage() {
  const { user, refreshUser } = useApp();
  const [wa, setWa] = useState(user?.wa ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => setWa(user?.wa ?? ""), [user?.wa]);
  if (!user) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (wa.trim() === user.wa) return toast.error("Nomor WA belum berubah.");
    if (!currentPassword) return toast.error("Password saat ini wajib diisi untuk mengubah nomor WA.");
    setConfirmOpen(true);
  };

  const saveWhatsapp = async () => {
    setSaving(true);
    try {
      await api.auth.updateAccount({ wa: wa.trim(), currentPassword });
      await refreshUser();
      setCurrentPassword("");
      setConfirmOpen(false);
      toast.success("Nomor WA mentor berhasil diperbarui");
    } catch (error) {
      toast.error(getErrorMessage(error, "Nomor WA gagal diperbarui."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfilePageShell title="Nomor WA Mentor" subtitle="Nomor ini dipakai member untuk menghubungi kamu." icon={MessageCircle} tone="orange">
      <form onSubmit={submit} className="space-y-4">
        <Panel>
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-xs font-semibold leading-relaxed text-muted-foreground">
            Mentor wajib memakai nomor WA aktif. Kalau member tidak dibalas lebih dari 24 jam, mereka bisa membuat laporan dengan screenshot.
          </div>
          <Field label="Nomor WA Aktif">
            <Input value={wa} onChange={(event) => setWa(event.target.value)} className="h-12 rounded-2xl bg-secondary" placeholder="0812xxxx" />
          </Field>
          <Field label="Password Saat Ini">
            <PasswordInput value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="h-12 rounded-2xl bg-secondary" />
          </Field>
        </Panel>
        <Button type="submit" disabled={saving} className="h-14 w-full rounded-2xl font-black">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Nomor WA"}
        </Button>
      </form>
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Ubah nomor WA mentor?"
        description="Nomor ini akan menjadi kontak utama member yang kamu referensikan. Pastikan nomor aktif dan bisa dibalas maksimal 24 jam."
        confirmLabel="Ya, simpan nomor"
        loading={saving}
        onConfirm={saveWhatsapp}
      />
    </ProfilePageShell>
  );
}

export function NotificationSettingsPage() {
  const [settings, setSettings] = useState(() => ({
    daily: readBool("daily", true),
    content: readBool("content", true),
    commission: readBool("commission", true),
    renewal: readBool("renewal", true),
  }));
  const [pendingSetting, setPendingSetting] = useState<{ key: keyof typeof settings; value: boolean; title: string } | null>(null);

  const requestSetItem = (key: keyof typeof settings, value: boolean, title: string) => {
    setPendingSetting({ key, value, title });
  };

  const applyPendingSetting = () => {
    if (!pendingSetting) return;
    const { key, value } = pendingSetting;
    const next = { ...settings, [key]: value };
    setSettings(next);
    localStorage.setItem(`buatcuan:notif:${key}`, String(value));
    setPendingSetting(null);
    toast.success("Preferensi notifikasi disimpan");
  };

  return (
    <ProfilePageShell title="Notifikasi" subtitle="Atur pengingat yang paling penting untuk progres kamu." icon={Bell} tone="sky">
      <Panel>
        <ToggleRow title="Pengingat belajar harian" desc="Dorongan untuk lanjut modul dan jaga streak." checked={settings.daily} onChange={(value) => requestSetItem("daily", value, "pengingat belajar harian")} />
        <ToggleRow title="Materi & tools baru" desc="Info saat ada bahan video, foto, atau strategi baru." checked={settings.content} onChange={(value) => requestSetItem("content", value, "materi & tools baru")} />
        <ToggleRow title="Komisi masuk" desc="Notifikasi saat member upgrade atau perpanjang." checked={settings.commission} onChange={(value) => requestSetItem("commission", value, "notifikasi komisi masuk")} />
        <ToggleRow title="Reminder perpanjangan" desc="H-7 sebelum PRO berakhir, agar akses tidak putus." checked={settings.renewal} onChange={(value) => requestSetItem("renewal", value, "reminder perpanjangan")} />
      </Panel>
      <ConfirmActionDialog
        open={Boolean(pendingSetting)}
        onOpenChange={(open) => !open && setPendingSetting(null)}
        title={`${pendingSetting?.value ? "Aktifkan" : "Matikan"} notifikasi ini?`}
        description={`${pendingSetting?.title ?? "Notifikasi"} akan ${pendingSetting?.value ? "diaktifkan" : "dimatikan"} di perangkat ini.`}
        confirmLabel={pendingSetting?.value ? "Ya, aktifkan" : "Ya, matikan"}
        onConfirm={applyPendingSetting}
      />
    </ProfilePageShell>
  );
}

export function SecuritySettingsPage() {
  const { refreshUser } = useApp();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!currentPassword || !newPassword) return toast.error("Password saat ini dan password baru wajib diisi.");
    if (newPassword !== confirmPassword) return toast.error("Konfirmasi password baru belum sama.");
    setConfirmOpen(true);
  };

  const savePassword = async () => {
    setSaving(true);
    try {
      await api.auth.updateAccount({ currentPassword, newPassword });
      await refreshUser();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setConfirmOpen(false);
      toast.success("Password berhasil diperbarui");
    } catch (error) {
      toast.error(getErrorMessage(error, "Password gagal diperbarui."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfilePageShell title="Keamanan Akun" subtitle="Ubah password dan jaga akses akun tetap aman." icon={KeyRound} tone="yellow">
      <form onSubmit={submit} className="space-y-4">
        <Panel>
          <Field label="Password Saat Ini">
            <PasswordInput value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="h-12 rounded-2xl bg-secondary" />
          </Field>
          <Field label="Password Baru">
            <PasswordInput value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="h-12 rounded-2xl bg-secondary" />
          </Field>
          <Field label="Konfirmasi Password Baru">
            <PasswordInput value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12 rounded-2xl bg-secondary" />
          </Field>
        </Panel>
        <Button type="submit" disabled={saving} className="h-14 w-full rounded-2xl font-black">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Menyimpan..." : "Ubah Password"}
        </Button>
      </form>
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Ubah password akun?"
        description="Setelah password diganti, gunakan password baru untuk login berikutnya. Jangan bagikan password ke siapa pun."
        confirmLabel="Ya, ubah password"
        loading={saving}
        onConfirm={savePassword}
      />
    </ProfilePageShell>
  );
}

export function HelpCenterPage() {
  return (
    <ProfilePageShell title="Pusat Bantuan" subtitle="Cari bantuan paling cepat sesuai masalah kamu." icon={HelpCircle} tone="violet">
      <div className="space-y-3">
        <HelpCard title="Bimbingan langsung" desc="Hubungi mentor, AI 24 jam, atau tim BuatCuan." to="/app/bimbingan" />
        <HelpCard title="Panduan alat bantu" desc="Cara pakai tools, download bahan, dan generate ide." to="/app/tools" />
        <HelpCard title="Masalah pembayaran" desc="Cek status pembayaran, perpanjangan, dan wallet." to="/app/wallet" />
        <HelpCard title="Notifikasi" desc="Lihat info fitur, materi, pembayaran, dan komisi." to="/app/notifications" />
      </div>
    </ProfilePageShell>
  );
}

export function MentorTermsPage() {
  return (
    <ProfilePageShell title="Syarat & Ketentuan Mentor" subtitle="Aturan dasar agar sistem mentor tetap sehat." icon={ShieldAlert} tone="rose">
      <Panel>
        {[
          ["WA aktif", "Mentor wajib memakai nomor WhatsApp aktif dan bisa dihubungi member."],
          ["Balas maksimal 24 jam", "Jika ada pertanyaan/member butuh bantuan, mentor wajib merespons dalam 24 jam."],
          ["Laporan wajib bukti", "Member yang melapor wajib melampirkan screenshot percakapan WA."],
          ["Sanksi bertahap", "Peringatan 1, komisi ditahan, lalu akun mentor bisa diblokir jika terbukti fatal."],
          ["Member tetap aman", "Jika mentor diblokir, member otomatis dialihkan ke tim BuatCuan."],
        ].map(([title, desc]) => (
          <div key={title} className="flex gap-3 rounded-2xl bg-secondary p-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-black">{title}</p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </Panel>
    </ProfilePageShell>
  );
}

export function DeleteAccountPage() {
  const { logout } = useApp();
  const nav = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!currentPassword) return toast.error("Password saat ini wajib diisi.");
    if (confirmation.toUpperCase() !== "HAPUS") return toast.error("Ketik HAPUS untuk konfirmasi.");
    setOpen(true);
  };

  const remove = async () => {
    setSaving(true);
    try {
      await api.auth.deleteAccount({ currentPassword, confirmation });
      logout();
      nav("/", { replace: true });
      toast.success("Akun berhasil dihapus");
    } catch (error) {
      toast.error(getErrorMessage(error, "Akun gagal dihapus."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfilePageShell title="Hapus Akun" subtitle="Tindakan permanen dan tidak bisa dipulihkan." icon={Trash2} tone="red">
      <form onSubmit={submit} className="space-y-4">
        <Panel>
          <div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-4 text-sm font-semibold leading-relaxed text-muted-foreground">
            Setelah dihapus, kamu tidak bisa login lagi. Komisi/riwayat yang sudah tercatat akan tetap disimpan untuk kebutuhan audit sistem.
          </div>
          <Field label="Password Saat Ini">
            <PasswordInput value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="h-12 rounded-2xl bg-secondary" />
          </Field>
          <Field label="Ketik HAPUS">
            <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-12 rounded-2xl bg-secondary" />
          </Field>
        </Panel>
        <Button type="submit" variant="destructive" disabled={saving} className="h-14 w-full rounded-2xl font-black">
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus Akun Permanen
        </Button>
      </form>
      <ConfirmActionDialog
        open={open}
        onOpenChange={setOpen}
        title="Hapus akun permanen?"
        description="Akun akan dinonaktifkan dan kamu akan keluar dari aplikasi."
        confirmLabel="Ya, hapus akun"
        destructive
        loading={saving}
        onConfirm={remove}
      />
    </ProfilePageShell>
  );
}

function ProfilePageShell({ title, subtitle, icon: Icon, tone, children }: { title: string; subtitle: string; icon: LucideIcon; tone: Tone; children: ReactNode }) {
  return (
    <div className="space-y-5 pb-3">
      <BackButton to="/app/profile" label="Akun" />
      <section className={`rounded-[28px] border p-5 ${toneShell(tone)}`}>
        <span className={`grid h-12 w-12 place-items-center rounded-2xl ${toneIcon(tone)}`}>
          <Icon className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-black">{title}</h1>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">{subtitle}</p>
      </section>
      {children}
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <section className="space-y-4 rounded-3xl border border-border bg-card p-5">{children}</section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({ title, desc, checked, onChange }: { title: string; desc: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-secondary p-3">
      <div className="min-w-0 flex-1">
        <p className="font-black">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function HelpCard({ title, desc, to }: { title: string; desc: string; to: string }) {
  return (
    <Link to={to} className="block rounded-3xl border border-border bg-card p-4">
      <p className="font-black">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-relaxed text-muted-foreground">{desc}</p>
    </Link>
  );
}

type Tone = "primary" | "sky" | "orange" | "yellow" | "violet" | "rose" | "red";

function toneShell(tone: Tone) {
  return {
    primary: "border-primary/35 bg-primary/10",
    sky: "border-sky-500/35 bg-sky-500/10",
    orange: "border-orange-500/35 bg-orange-500/10",
    yellow: "border-yellow-500/35 bg-yellow-500/10",
    violet: "border-violet-500/35 bg-violet-500/10",
    rose: "border-rose-500/35 bg-rose-500/10",
    red: "border-red-500/35 bg-red-500/10",
  }[tone];
}

function toneIcon(tone: Tone) {
  return {
    primary: "bg-primary/15 text-primary",
    sky: "bg-sky-500/15 text-sky-300",
    orange: "bg-orange-500/15 text-orange-300",
    yellow: "bg-yellow-500/15 text-yellow-300",
    violet: "bg-violet-500/15 text-violet-300",
    rose: "bg-rose-500/15 text-rose-300",
    red: "bg-red-500/15 text-red-300",
  }[tone];
}

function readBool(key: string, fallback: boolean) {
  const raw = localStorage.getItem(`buatcuan:notif:${key}`);
  return raw === null ? fallback : raw === "true";
}

function profileSaveCopy(nameChanged: boolean, avatarChanged: boolean) {
  if (nameChanged && avatarChanged) {
    return {
      title: "Simpan nama dan foto profil?",
      description: "Nama profil akan terkunci 90 hari setelah disimpan. Foto profil tetap bisa diganti kapan saja dari halaman ini.",
    };
  }
  if (nameChanged) {
    return {
      title: "Ganti nama profil?",
      description: "Pastikan nama sudah benar. Setelah disimpan, nama baru bisa diubah lagi setelah 90 hari.",
    };
  }
  if (avatarChanged) {
    return {
      title: "Simpan foto profil baru?",
      description: "Foto ini akan tersimpan di akun kamu dan tidak berubah otomatis. Kamu tetap bisa menggantinya kapan saja.",
    };
  }
  return {
    title: "Simpan profil?",
    description: "Perubahan profil akan diterapkan ke akun kamu.",
  };
}

function creatorHandle(name?: string | null) {
  const base = (name || "creator").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `@${base || "creator"}`;
}

function normalizeHandle(value: string) {
  const base = value.trim().replace(/^@+/, "");
  return base ? `@${base}` : "";
}

function makeGeneratedAvatar(name: string, seed: string) {
  const palettes = [
    ["#00d66b", "#003d2a", "#d7ffe9"],
    ["#ffd400", "#3b3200", "#fff7b0"],
    ["#22c3ff", "#08253a", "#d8f5ff"],
    ["#ff4d7d", "#3a0818", "#ffe1ea"],
    ["#8b5cf6", "#24103f", "#efe7ff"],
    ["#f59e0b", "#3b2100", "#fff0c2"],
  ];
  const hash = hashSeed(`${seed}:${name}`);
  const [start, end, text] = palettes[hash % palettes.length];
  const initials = escapeSvgText(
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "BC",
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient></defs><rect width="160" height="160" rx="80" fill="url(#g)"/><circle cx="122" cy="38" r="22" fill="rgba(255,255,255,.14)"/><circle cx="37" cy="122" r="30" fill="rgba(255,255,255,.1)"/><text x="80" y="94" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="800" fill="${text}">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function hashSeed(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function escapeSvgText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function imageFileToAvatarDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Ukuran foto maksimal 5MB.");
  }

  const image = await loadImage(file);
  const size = 360;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Browser tidak bisa memproses foto ini.");

  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
  const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
  return canvas.toDataURL("image/webp", 0.82);
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Foto gagal dibaca. Coba gunakan JPG, PNG, atau WEBP."));
    };
    image.src = url;
  });
}

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function nameChangeStatus(iso?: string | null) {
  if (!iso || new Date(iso) <= new Date()) return "Nama bisa diubah sekarang. Setelah disimpan, nama terkunci selama 90 hari.";
  return `Nama bisa diubah lagi pada ${formatDate(iso)}.`;
}
