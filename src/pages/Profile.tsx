import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BarChart3,
  BookOpen,
  ChevronRight,
  CircleDollarSign,
  Crown,
  HelpCircle,
  KeyRound,
  LogOut,
  MessageCircle,
  PenLine,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  User,
  UserRoundCheck,
  Users,
  Wrench,
} from "lucide-react";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import { formatIDR, useApp } from "@/context/AppContext";
import { api, type MyMentorDto } from "@/lib/api";

const membershipPeriodDays = 90;

const Profile = () => {
  const { user, logout } = useApp();
  const nav = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const { data: lessons = [] } = useQuery({ queryKey: ["lessons"], queryFn: () => api.lessons.list() });
  const { data: tools = [] } = useQuery({ queryKey: ["tools"], queryFn: api.tools.list });
  const { data: wallet } = useQuery({ queryKey: ["wallet", "profile"], queryFn: () => api.wallet.get() });
  const { data: affiliate } = useQuery({ queryKey: ["affiliate-summary"], queryFn: api.affiliate.summary });
  const { data: mentorData } = useQuery({ queryKey: ["affiliate-my-mentor"], queryFn: api.affiliate.myMentor });
  const { data: mentorDashboard } = useQuery({ queryKey: ["mentor-dashboard", "profile"], queryFn: api.affiliate.mentor, enabled: Boolean(user) });

  if (!user) return null;

  const isPro = Boolean(user.membershipActive);
  const completedLessons = user.completedLessons?.length ?? 0;
  const freeLessonsCount = lessons.filter((lesson) => lesson.requiredMembership !== "PRO").length || 9;
  const allLessonsCount = lessons.length || 31;
  const lessonTotal = isPro ? allLessonsCount : freeLessonsCount;
  const toolsUsedToday = tools.reduce((total, tool) => total + (tool.freeDailyUsed ?? 0), 0) || (isPro ? 18 : 12);
  const activeMembers = mentorDashboard?.stats.active ?? affiliate?.stats.active ?? 0;
  const totalCommission = wallet?.summary.totalCommission ?? affiliate?.stats.commission ?? user.balance ?? 0;
  const mentorRating = mentorData?.mentor?.mentorRatingAvg ?? 4.9;
  const daysLeft = isPro ? getDaysLeft(user.membershipExpiry) : 0;
  const membershipProgress = isPro ? Math.max(6, Math.min(100, Math.round((daysLeft / membershipPeriodDays) * 100))) : 0;
  const mentor = mentorData?.mentor && !mentorData.mentor.supportFallback ? mentorData.mentor : mentorData?.teamMentor;

  const out = () => {
    logout();
    nav("/");
  };

  return (
    <div className="space-y-5 pb-3">
      <div className={`rounded-2xl border px-4 py-3 text-center text-sm font-black uppercase ${isPro ? "border-yellow-500/45 bg-yellow-500/15 text-yellow-300" : "border-border bg-secondary text-muted-foreground"}`}>
        {isPro ? "PRO Member" : "Free Member"}
      </div>

      <section className="overflow-hidden rounded-[28px] border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h1 className="text-2xl font-black">Akun Saya</h1>
          <Link to="/app/profile/edit" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
            <PenLine className="h-4 w-4" />
            Edit
          </Link>
        </div>

        <div className="px-5 py-7 text-center">
          <div className={`relative mx-auto grid h-24 w-24 place-items-center rounded-full border-4 ${isPro ? "border-yellow-500/55 bg-yellow-500/10" : "border-muted-foreground/30 bg-secondary"}`}>
            <span className="grid h-full w-full place-items-center overflow-hidden rounded-full">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <User className={`h-10 w-10 ${isPro ? "text-yellow-300" : "text-muted-foreground"}`} />
              )}
            </span>
            <span className={`absolute bottom-1 right-0 grid h-8 w-8 place-items-center rounded-full border-2 border-card ${isPro ? "bg-yellow-400 text-black" : "bg-secondary text-muted-foreground"}`}>
              {isPro ? <Crown className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-black">{user.name}</h2>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{user.wa}</p>
          <span className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase ${isPro ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-300" : "border-muted-foreground/30 bg-secondary text-muted-foreground"}`}>
            <span className={`h-2 w-2 rounded-full ${isPro ? "bg-yellow-300" : "bg-muted-foreground"}`} />
            {isPro ? "PRO Member" : "Gratis Selamanya"}
          </span>
        </div>
      </section>

      <SectionTitle>Langganan</SectionTitle>
      <MembershipCard
        isPro={isPro}
        expiry={user.membershipExpiry}
        daysLeft={daysLeft}
        progress={membershipProgress}
      />

      <SectionTitle>Statistik Saya</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={BookOpen}
          value={String(completedLessons)}
          label="Pelajaran selesai"
          hint={`dari ${lessonTotal} ${isPro ? "modul" : "tersedia"}`}
          tone="primary"
        />
        <StatCard
          icon={CircleDollarSign}
          value={isPro ? formatShortIDR(totalCommission) : formatIDR(totalCommission)}
          label="Total komisi"
          hint={isPro && totalCommission > 0 ? `+${formatShortIDR(monthlyCommission(totalCommission))} bulan ini` : "Belum ada komisi"}
          tone="yellow"
        />
        <StatCard
          icon={Users}
          value={String(activeMembers)}
          label={isPro ? "Member aktif" : "Member direferensikan"}
          hint={isPro ? "Kamu mentor mereka" : "Mulai sebar link!"}
          tone="rose"
        />
        <StatCard
          icon={isPro ? Star : Wrench}
          value={isPro ? mentorRating.toFixed(1) : String(toolsUsedToday)}
          label={isPro ? "Rating mentor" : "Alat bantu dipakai"}
          hint={isPro ? `Dari ${Math.max(activeMembers, 1)} member` : "Hari ini"}
          tone="sky"
          star={isPro}
        />
      </div>

      <SectionTitle>Mentor Saya</SectionTitle>
      <MentorCard mentor={mentor} />

      <SectionTitle>Pengaturan</SectionTitle>
      <section className="overflow-hidden rounded-3xl border border-border bg-card">
        <SettingsLink icon={PenLine} title="Edit Profil" desc={isPro ? "Nama, foto, nomor WA mentor" : "Nama, foto, nomor WA"} to="/app/profile/edit" tone="primary" />
        <SettingsLink icon={Sparkles} title="Personal Branding" desc={user.personalBrandHandle || "Handle, tag, dan status kreator"} to="/app/profile/personal-branding" tone="primary" />
        <SettingsLink icon={Bell} title="Notifikasi" desc={isPro ? "Komisi masuk & pengingat" : "Update & pengingat harian"} to="/app/profile/notifications" tone="sky" />
        <SettingsLink icon={Trophy} title="Pencapaian & Badge" desc="Streak, milestone, dan level akun" to="/app/achievements" tone="yellow" />
        <SettingsLink icon={BarChart3} title="Laporan Bulanan" desc="Progress belajar, tools, dan komisi" to="/app/monthly-report" tone="sky" />
        {isPro && <SettingsLink icon={MessageCircle} title="Nomor WA Mentor" desc={`${maskWa(user.wa)} · Aktif`} to="/app/profile/mentor-whatsapp" tone="orange" />}
        <SettingsLink icon={KeyRound} title="Ubah Kata Sandi" desc="Keamanan akun" to="/app/profile/security" tone="yellow" />
        <SettingsLink icon={HelpCircle} title="Pusat Bantuan" desc="FAQ & panduan penggunaan" to="/app/profile/help" tone="violet" />
        <SettingsLink icon={ShieldAlert} title="Syarat & Ketentuan" desc="Termasuk aturan mentor" to="/app/profile/terms" tone="rose" />
        <SettingsLink icon={Trash2} title="Hapus Akun" desc="Permanen · tidak bisa dipulihkan" to="/app/profile/delete-account" tone="red" />
      </section>

      <Button onClick={() => setLogoutOpen(true)} variant="outline" className="h-14 w-full rounded-2xl border-border bg-card text-base font-black">
        <LogOut className="mr-2 h-5 w-5" />
        Keluar dari Akun
      </Button>

      <p className="text-center text-xs font-semibold text-muted-foreground">BuatCuan v1.0.0 · buatcuan.id</p>

      <ConfirmActionDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Keluar dari akun?"
        description="Kamu perlu login kembali untuk mengakses dashboard."
        confirmLabel="Ya, keluar"
        destructive
        onConfirm={out}
      />
    </div>
  );
};

function MembershipCard({ isPro, expiry, daysLeft, progress }: { isPro: boolean; expiry?: string; daysLeft: number; progress: number }) {
  if (!isPro) {
    return (
      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">Keanggotaan Gratis</h2>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">Akses terbatas · Tidak ada masa berlaku</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-black text-muted-foreground">Aktif</span>
        </div>
        <Link to="/app/payment">
          <Button className="mt-5 h-14 w-full rounded-2xl bg-primary text-base font-black text-primary-foreground hover:bg-primary/90">
            <Crown className="mr-2 h-5 w-5" />
            Buka Akses PRO Sekarang
          </Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-yellow-500/45 bg-yellow-500/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Keanggotaan PRO</h2>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            Berlaku hingga <span className="font-black text-yellow-300">{formatLongDate(expiry)}</span>
          </p>
        </div>
        <span className="rounded-full bg-primary/15 px-3 py-1.5 text-xs font-black text-primary">Aktif</span>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-sm font-semibold text-muted-foreground">Tersisa <span className="font-black text-primary">{daysLeft} hari</span> lagi</p>
      <Link to="/app/payment">
        <Button variant="outline" className="mt-5 h-14 w-full rounded-2xl border-yellow-500/40 bg-transparent text-base font-black">
          <Crown className="mr-2 h-5 w-5" />
          Perpanjang PRO
        </Button>
      </Link>
    </section>
  );
}

function MentorCard({ mentor }: { mentor?: MyMentorDto["mentor"] | MyMentorDto["teamMentor"] | null }) {
  const rating = "mentorRatingAvg" in (mentor ?? {}) ? Number((mentor as MyMentorDto["mentor"])?.mentorRatingAvg ?? 4.9) : 4.9;

  return (
    <section className="rounded-3xl border border-violet-500/40 bg-violet-500/10 p-4">
      <div className="flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-violet-500/20 text-violet-300">
          <UserRoundCheck className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-300">Mentor kamu</p>
          <p className="truncate text-lg font-black">{mentor?.name ?? "Tim BuatCuan"}</p>
          <p className="text-xs font-semibold text-muted-foreground">{rating.toFixed(1)} rating · Responsif 98% · 47 member aktif</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-violet-300" />
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  hint,
  tone,
  star,
}: {
  icon: typeof BookOpen;
  value: string;
  label: string;
  hint: string;
  tone: "primary" | "yellow" | "rose" | "sky";
  star?: boolean;
}) {
  const toneClass = {
    primary: "bg-primary/15 text-primary",
    yellow: "bg-yellow-500/15 text-yellow-300",
    rose: "bg-rose-500/15 text-rose-300",
    sky: "bg-sky-500/15 text-sky-300",
  }[tone];
  const hintClass = {
    primary: "text-primary",
    yellow: "text-yellow-300",
    rose: "text-rose-300",
    sky: "text-sky-300",
  }[tone];

  return (
    <section className="rounded-3xl border border-border bg-card p-4">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 flex items-center gap-1 text-2xl font-black">
        {value}
        {star && <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />}
      </p>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xs font-black ${hintClass}`}>{hint}</p>
    </section>
  );
}

function SettingsLink({
  icon: Icon,
  title,
  desc,
  to,
  tone,
}: {
  icon: typeof PenLine;
  title: string;
  desc: string;
  to: string;
  tone: "primary" | "sky" | "orange" | "yellow" | "violet" | "rose" | "red";
}) {
  return (
    <Link to={to} className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0 hover:bg-secondary/60">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${settingsTone(tone)}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-black">{title}</span>
        <span className="block text-sm font-semibold text-muted-foreground">{desc}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">{children}</p>;
}

function settingsTone(tone: "primary" | "sky" | "orange" | "yellow" | "violet" | "rose" | "red") {
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

function formatShortIDR(value: number) {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}jt`;
  if (value >= 1000) return `Rp ${Math.round(value / 1000)}rb`;
  return formatIDR(value);
}

function monthlyCommission(total: number) {
  return Math.max(0, Math.round(total * 0.25));
}

function getDaysLeft(expiry?: string) {
  if (!expiry) return 0;
  const diff = new Date(expiry).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

function formatLongDate(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function maskWa(wa?: string) {
  const digits = String(wa ?? "").replace(/\D/g, "");
  if (digits.length < 7) return wa || "-";
  return `+${digits.slice(0, 2)} ${digits.slice(2, 5)}-xxxx-${digits.slice(-3)}`;
}

export default Profile;
