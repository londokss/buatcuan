import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Crown,
  Flame,
  GraduationCap,
  Image,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
  User,
  Video,
  Wallet,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useApp, formatIDR } from "@/context/AppContext";
import { api, type DailyPlanDto, type LessonDto, type MemberToolDto } from "@/lib/api";
import { ManagedUsageVideoCard } from "@/components/ManagedUsageVideoCard";
import { contentColorTheme, gradientBackground } from "@/lib/content-colors";
import { getNextLesson } from "@/lib/learning";
import { cn } from "@/lib/utils";

const alatIcons: Record<string, typeof Video> = {
  VIDEO: Video,
  IMAGE: Image,
  TEXT: Lightbulb,
};

const menuUtama = [
  { to: "/app/daily-plan", icon: CalendarCheck2, label: "Rencana", color: "bg-primary/15 text-primary" },
  { to: "/app/materi", icon: BookOpen, label: "Belajar", color: "bg-primary/15 text-primary" },
  { to: "/app/tools", icon: Lightbulb, label: "Alat Bantu", color: "bg-accent/15 text-accent" },
  { to: "/app/affiliate", icon: Crown, label: "Komisi Saya", color: "bg-rose-500/15 text-rose-300" },
  { to: "/app/bimbingan", icon: GraduationCap, label: "Bimbingan", color: "bg-violet-500/15 text-violet-300" },
  { to: "/app/wallet", icon: Wallet, label: "Dompet", color: "bg-orange-500/15 text-orange-300" },
  { to: "/app/notifications", icon: Bell, label: "Notifikasi", color: "bg-sky-500/15 text-sky-300" },
  { to: "/app/payment", icon: Trophy, label: "Naik PRO", color: "bg-yellow-500/15 text-yellow-300" },
];

const Dashboard = () => {
  const { user } = useApp();
  const { data: lessons = [], isLoading } = useQuery({ queryKey: ["lessons"], queryFn: () => api.lessons.list() });
  const { data: tools = [] } = useQuery({ queryKey: ["tools"], queryFn: api.tools.list });
  const { data: affiliate } = useQuery({ queryKey: ["affiliate-summary"], queryFn: api.affiliate.summary });
  const { data: dailyPlan } = useQuery({ queryKey: ["daily-plan"], queryFn: api.dailyPlan.get });
  if (!user) return null;

  const selesai = user.completedLessons.length;
  const total = lessons.length;
  const persen = total ? Math.round((selesai / total) * 100) : 0;
  const aksesPro = Boolean(user.membershipActive);
  const pelajaranBerikutnya = getNextLesson(lessons, user.completedLessons, aksesPro);
  const pelajaranSaya = lessons.filter((lesson) => !lesson.isMembershipLocked).slice(0, 6);
  const komisiSekarang = Math.round(Number(affiliate?.commissionRate ?? (aksesPro ? 0.5 : 0.1)) * 100);
  const komisiPro = Math.round(Number(affiliate?.nextCommissionRate ?? 0.5) * 100);
  const daysLeft = daysUntil(user.membershipExpiry);

  return (
    <div className="space-y-5 text-foreground">
      <HomeUsageVideoCard />
      <NotificationBanner />
      <DailyPlanPreview data={dailyPlan} />
      {aksesPro && daysLeft <= 7 && <RenewalReminder daysLeft={daysLeft} />}
      <KartuKeanggotaan
        aktifPro={aksesPro}
        saldo={user.balance}
        komisiSekarang={komisiSekarang}
        komisiPro={komisiPro}
      />
      <AlatBantuCepat tools={tools} />
      <PelajaranSaya lessons={pelajaranSaya} nextLesson={pelajaranBerikutnya} loading={isLoading} />
      <MemberProofSection />
      <KemajuanBelajar selesai={selesai} total={total} persen={persen} aksesPro={aksesPro} />
      <MenuUtama />
      <RumusHarian selesai={dailyPlan?.summary.contentCompleted ?? 0} />
    </div>
  );
};

function HomeUsageVideoCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app"
      className="border-primary/25 shadow-[0_18px_48px_hsl(0_0%_0%_/_0.10)] dark:border-[#2a2a2a] dark:shadow-[0_18px_48px_rgba(0,0,0,0.35)]"
      fallback={{
        title: "Cara Pakai BuatCuan dari Awal",
        subtitle: "Tonton dulu biar tidak bingung",
        durationLabel: "3 menit",
        thumbnailGradient: "from-emerald-950 via-zinc-950 to-sky-950",
      }}
    />
  );
}

function NotificationBanner() {
  return (
    <Link to="/app/notifications" className="block rounded-2xl border border-primary/30 bg-primary/10 p-4">
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Bell className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-primary">Notifikasi Terbaru</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">
            Info materi, tools, pembayaran, dan komisi masuk ke inbox notifikasi.
          </p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
      </div>
    </Link>
  );
}

function DailyPlanPreview({ data }: { data?: DailyPlanDto }) {
  const next = data?.nextBestTask;
  return (
    <section className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Target className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-extrabold text-primary">Rencana Hari Ini</p>
            <span className="text-xs font-extrabold text-primary">{data?.summary.completionPercent ?? 0}%</span>
          </div>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">
            {next ? next.title : "Buka checklist harian untuk belajar, konten, dan mentor."}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background/80">
            <div className="h-full rounded-full bg-primary" style={{ width: `${data?.summary.completionPercent ?? 0}%` }} />
          </div>
          <Link to="/app/daily-plan" className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-primary">
            Buka daily plan
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function RenewalReminder({ daysLeft }: { daysLeft: number }) {
  return (
    <Link to="/app/payment" className="block rounded-2xl border border-yellow-500/35 bg-yellow-500/10 p-4">
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-yellow-500/15 text-yellow-300">
          <CalendarDays className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-yellow-300">PRO kamu tersisa {Math.max(daysLeft, 0)} hari</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">
            Perpanjang supaya tetap dapat update tools, bahan konten baru, dan bimbingan mentor.
          </p>
        </div>
      </div>
    </Link>
  );
}

function MemberProofSection() {
  return (
    <section className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-300">
          <Trophy className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-extrabold text-sky-300">Bukti Member Mulai Jalan</p>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
            "Rizky dapat Rp500rb komisi pertama minggu ini setelah konsisten pakai script promosi dan follow up mentor."
          </p>
          <Link to="/app/monthly-report" className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-sky-300">
            Lihat progress bulanan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function KartuKeanggotaan({ aktifPro, saldo, komisiSekarang, komisiPro }: { aktifPro: boolean; saldo: number; komisiSekarang: number; komisiPro: number }) {
  return (
    <section className="rounded-2xl border border-primary/35 bg-[radial-gradient(circle_at_12%_0%,hsl(var(--primary)/0.16),transparent_34%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--background))_58%,hsl(var(--primary)/0.08))] p-4 shadow-[0_24px_70px_hsl(142_100%_39%_/_0.10)] dark:border-[#006b35] dark:bg-[radial-gradient(circle_at_12%_0%,rgba(0,210,106,0.22),transparent_34%),linear-gradient(135deg,#092216,#07130d_58%,#052d18)] dark:shadow-[0_24px_70px_rgba(0,210,106,0.16)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00d26a]" />
            {aktifPro ? "PRO aktif" : "Gratis selamanya"}
          </span>
          <h2 className="mt-3 text-xl font-extrabold">{aktifPro ? "Keanggotaan PRO Aktif" : "Keanggotaan Gratis Aktif"}</h2>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{aktifPro ? "Semua akses utama sudah terbuka" : "Akses terbatas - buka PRO untuk akses penuh"}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className="text-xl font-extrabold text-[#ffd600]">{formatIDR(saldo)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-accent/35 bg-accent/10 p-3 dark:border-[#6d6400]/70 dark:bg-[#1d2b0c]/90">
        <div className="flex items-center justify-between gap-3 border-b border-[#6d6400]/45 pb-2 text-sm">
          <span className="text-muted-foreground">Komisi tiap penjualan sekarang</span>
          <strong>{komisiSekarang}% per penjualan</strong>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2 text-sm text-[#ffd600]">
          <span className="font-semibold">Naik ke PRO</span>
          <strong>{komisiPro}% per penjualan</strong>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-accent/35 bg-card/85 p-3 dark:border-[#6d6400]/70 dark:bg-[#17270d]/85">
        <p className="mb-3 text-xs font-extrabold text-[#ffd600]">Kelebihan PRO</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Komisi 50%", "Tiap penjualan langsung", Crown],
            ["31 Modul Penuh", "Dari pemula sampai jago", BookOpen],
            ["Alat Bantu Tanpa Batas", "Video, foto, ide konten", Lightbulb],
            ["Bimbingan Langsung", "Tanya dan kaji konten", MessageCircle],
            ["Pembaruan Mingguan", "Tren dan ide terbaru", Bell],
            ["Grup WA Eksklusif", "Komunitas PRO", GraduationCap],
          ].map(([judul, subjudul, Icon]) => (
            <div key={judul as string} className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#00d26a]/15 text-[#00d26a]">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold leading-tight">{judul}</span>
                <span className="block text-xs text-muted-foreground">{subjudul}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link to="/app/materi" className="rounded-xl border border-primary/35 bg-background/30 px-3 py-3 text-center text-sm font-extrabold dark:border-[#2b7654] dark:bg-black/10">Cara Cuan</Link>
        <Link to="/app/withdraw" className="rounded-xl border border-primary/35 bg-background/30 px-3 py-3 text-center text-sm font-extrabold dark:border-[#2b7654] dark:bg-black/10">Tarik Saldo</Link>
      </div>
      {!aktifPro && (
        <Link to="/app/payment" className="mt-2 flex rounded-xl border border-primary/35 bg-background/30 px-3 py-3 text-center text-sm font-extrabold dark:border-[#2b7654] dark:bg-black/10">
          <span className="mx-auto inline-flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Buka Akses PRO Sekarang
          </span>
        </Link>
      )}
    </section>
  );
}

function AlatBantuCepat({ tools }: { tools: MemberToolDto[] }) {
  return (
    <section className="space-y-3">
      <JudulBagian title="Alat Bantu Cepat" to="/app/tools" />
      <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar md:mx-0 md:overflow-visible md:px-0">
        <div className="flex w-max gap-3 md:grid md:w-full md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {tools.slice(0, 8).map((tool) => {
            const Icon = alatIcons[tool.contentType] ?? Lightbulb;
            const sisa = tool.freeDailyRemaining ?? tool.freeDailyLimit;
            const colors = contentColorTheme(tool.colorGradient);
            return (
              <Link
                key={tool.slug}
                to={`/app/tools/${tool.slug}`}
                className="w-[144px] shrink-0 rounded-xl border p-3 md:w-auto"
                style={{ borderColor: colors.border, background: colors.cardBg, boxShadow: colors.shadow }}
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ backgroundColor: colors.iconBg, color: colors.text }}>
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-3 line-clamp-2 text-sm font-extrabold">{teksIndonesia(namaAlat(tool.name))}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{tool.isLocked ? "Terkunci" : "Siap dipakai"}</p>
                <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: colors.progressTrack }}>
                  <div className="h-full rounded-full" style={{ width: tool.isLocked ? "24%" : "70%", background: tool.isLocked ? "#71717a" : colors.gradient }} />
                </div>
                <p className="mt-1.5 text-xs font-bold" style={{ color: tool.isLocked ? "#a1a1aa" : colors.text }}>{typeof sisa === "number" ? `${sisa} sisa hari ini` : tool.isLocked ? "Buka PRO" : "Tanpa batas"}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PelajaranSaya({ lessons, nextLesson, loading }: { lessons: LessonDto[]; nextLesson: LessonDto | null; loading: boolean }) {
  const items = nextLesson ? [nextLesson, ...lessons.filter((lesson) => lesson.id !== nextLesson.id)].slice(0, 6) : lessons.slice(0, 6);
  return (
    <section className="space-y-3">
      <JudulBagian title="Pelajaran Saya" to="/app/materi" />
      {loading && <div className="rounded-xl border border-white/10 bg-card/85 p-4 text-sm text-muted-foreground">Memuat pelajaran...</div>}
      {!loading && (
        <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar lg:mx-0 lg:overflow-visible lg:px-0">
          <div className="flex w-max gap-3 lg:grid lg:w-full lg:grid-cols-2 xl:grid-cols-3">
            {items.map((lesson, index) => {
              const colors = contentColorTheme(lesson.thumb);
              return (
                <Link
                  key={lesson.id}
                  to={`/app/materi/${lesson.id}`}
                  className="w-[360px] max-w-[calc(100vw-2rem)] shrink-0 rounded-2xl border p-4 lg:w-auto lg:max-w-none"
                  style={{ borderColor: colors.border, background: colors.cardBg, boxShadow: colors.shadow }}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: colors.iconBg, color: colors.text }}>
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-[11px] font-extrabold uppercase" style={{ color: colors.text }}>{levelIndonesia(lesson.level)} - {index === 0 ? "sedang berjalan" : "siap dipelajari"}</span>
                      <span className="block text-xs text-muted-foreground">Pelajaran {index + 1} dari {items.length}</span>
                    </span>
                  </div>
                  <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: colors.progressTrack }}>
                    <div className="h-full rounded-full" style={{ width: index === 0 ? "55%" : "18%", background: colors.gradient }} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-extrabold">{teksIndonesia(lesson.title)}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                    <span className="rounded-xl border px-4 py-2 text-sm font-extrabold" style={{ borderColor: colors.border }}>Lanjutkan →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function KemajuanBelajar({ selesai, total, persen, aksesPro }: { selesai: number; total: number; persen: number; aksesPro: boolean }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[0_18px_48px_hsl(0_0%_0%_/_0.10)] dark:border-[#2b2b2b] dark:bg-[#171717] dark:shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Kemajuan Belajar</p>
          <h2 className="mt-1 text-xl font-extrabold">{selesai} dari {total} pelajaran</h2>
          <p className="mt-2 text-sm font-bold text-[#00d26a]">{selesai === 0 ? "Kamu baru mulai - ini langkah terpenting" : "Teruskan sampai pelajaran berikutnya"}</p>
        </div>
        <Flame className="h-7 w-7 text-orange-400" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted dark:bg-[#2b2b2b]">
          <motion.div initial={{ width: 0 }} animate={{ width: `${persen}%` }} transition={{ duration: 0.8 }} className="h-full bg-[#00d26a]" />
        </div>
        <span className="text-xs font-extrabold text-[#00d26a]">{persen}%</span>
      </div>
      <Link to="/app/achievements" className="mt-4 flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-yellow-500/15 text-yellow-300">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold text-yellow-300">5 hari berturut-turut belajar</span>
          <span className="block text-xs font-semibold text-muted-foreground">Buka badge baru dan jaga streak kamu.</span>
        </span>
        <ArrowRight className="h-4 w-4 text-yellow-300" />
      </Link>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["Pemula", "Sedang di sini", true],
          ["Menengah", aksesPro ? "Terbuka" : "Terkunci", aksesPro],
          ["Jago Cuan", aksesPro ? "Terbuka" : "Terkunci", aksesPro],
        ].map(([judul, subjudul, aktif]) => (
          <div key={judul as string} className={cn("rounded-xl border p-3 text-center", aktif ? "border-[#008d47] bg-[#082719] text-[#00d26a]" : "border-[#2b2b2b] bg-[#202020] text-zinc-500")}>
            <p className="font-extrabold">{judul}</p>
            <p className="mt-1 text-xs">{subjudul}</p>
          </div>
        ))}
      </div>
      <Link to="/app/materi" className="mt-4 flex rounded-xl border border-border px-4 py-3 text-center font-extrabold dark:border-[#3b3b3b]">
        <span className="mx-auto inline-flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Lanjut Belajar Sekarang
        </span>
      </Link>
    </section>
  );
}

function MenuUtama() {
  return (
    <section className="space-y-3">
      <h2 className="font-extrabold">Menu Utama</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8">
        {menuUtama.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-2 text-center shadow-[0_14px_36px_hsl(0_0%_0%_/_0.08)] dark:border-[#2b2b2b] dark:bg-[#171717] dark:shadow-[0_14px_36px_rgba(0,0,0,0.28)]">
              <span className={cn("grid h-10 w-10 place-items-center rounded-xl", item.color)}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-bold leading-tight text-muted-foreground">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function RumusHarian({ selesai }: { selesai: number }) {
  return (
    <section className="rounded-2xl border border-accent/35 bg-[linear-gradient(135deg,hsl(var(--accent)/0.12),hsl(var(--card))_64%,hsl(var(--accent)/0.10))] p-4 shadow-[0_18px_52px_hsl(51_100%_50%_/_0.08)] dark:border-[#5b5100] dark:bg-[linear-gradient(135deg,#171700,#101000_64%,#221f00)] dark:shadow-[0_18px_52px_rgba(255,214,0,0.1)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-extrabold text-[#ffd600]">
          <Sparkles className="h-4 w-4" />
          Rumus 4+1 Harian
        </h2>
        <p className="text-xs font-bold text-zinc-400">{selesai} dari 5 selesai</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {["1", "2", "3", "4", "★"].map((item, index) => (
          <div key={item} className={cn("rounded-xl border px-2 py-3 text-center", index === 4 ? "border-[#7a6d00] bg-[#4a4100] text-[#ffd600]" : "border-[#007a3d] bg-[#082719] text-[#00d26a]")}>
            <p className="text-lg font-extrabold">{item}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{index === 4 ? "Jualan" : "Konten"}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-muted-foreground">4 konten tumbuh akun - 1 konten jualan komisi</p>
    </section>
  );
}

function JudulBagian({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-extrabold">{title}</h2>
      <Link to={to} className="inline-flex items-center gap-1 text-xs font-extrabold text-[#00d26a]">
        Lihat semua
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function levelIndonesia(level: LessonDto["level"]) {
  if (level === "Beginner") return "Pemula";
  if (level === "Intermediate") return "Menengah";
  return "Jago";
}

function namaAlat(name: string) {
  return name
    .replace(/\bVideo Footage\b/gi, "Bahan Video")
    .replace(/\bFoto Footage\b/gi, "Bahan Foto")
    .replace(/\bIde Hook\b/gi, "Ide Pembuka")
    .replace(/\bIde Caption & Hashtag\b/gi, "Ide Takarir dan Tagar")
    .replace(/\bIde Teks Tutorial\b/gi, "Ide Teks Panduan")
    .replace(/\bScript Promosi BuatCuan\b/gi, "Naskah Promosi BuatCuan")
    .replace(/\bScript Closing DM & WA\b/gi, "Naskah Penutup Pesan")
    .replace(/\bBank Bio & Nama Akun\b/gi, "Kumpulan Bio dan Nama Akun")
    .replace(/\bTools\b/gi, "Alat Bantu");
}

function teksIndonesia(value: string) {
  return value
    .replace(/\bContent\b/gi, "Konten")
    .replace(/\bAds\b/gi, "Iklan")
    .replace(/\bStory Selling\b/gi, "Jualan Lewat Cerita")
    .replace(/\bSoft\b/gi, "Halus")
    .replace(/\bAffiliate\b/gi, "Afiliasi")
    .replace(/\bChannel\b/gi, "Kanal")
    .replace(/\bLong Form\b/gi, "Video Panjang")
    .replace(/\bRecurring Income\b/gi, "Penghasilan Berulang")
    .replace(/\bShorts Funnel\b/gi, "Alur Video Pendek")
    .replace(/\bHook\b/gi, "Pembuka")
    .replace(/\bCaption\b/gi, "Takarir")
    .replace(/\bHashtag\b/gi, "Tagar")
    .replace(/\bScript\b/gi, "Naskah")
    .replace(/\bClosing\b/gi, "Penutup")
    .replace(/\bTools\b/gi, "Alat Bantu")
    .replace(/\bUpdate\b/gi, "Pembaruan")
    .replace(/\bMember\b/gi, "Anggota");
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export default Dashboard;
