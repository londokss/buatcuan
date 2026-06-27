import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, BookOpen, Lightbulb, Users, Wallet, type LucideIcon } from "lucide-react";
import { formatIDR, useApp } from "@/context/AppContext";

const MonthlyReport = () => {
  const { user } = useApp();
  const completed = user?.completedLessons.length ?? 0;

  return (
    <div className="space-y-5 pb-3">
      <section className="rounded-[28px] border border-sky-500/35 bg-sky-500/10 p-5">
        <span className="inline-flex rounded-full bg-sky-500/15 px-3 py-1 text-xs font-black text-sky-300">Laporan otomatis</span>
        <h1 className="mt-4 text-3xl font-black leading-tight">Progress Bulanan Kamu</h1>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
          Laporan ini menunjukkan apa yang sudah berjalan, supaya kamu dan mentor tahu langkah bulan depan.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <ReportStat icon={BookOpen} label="Materi selesai" value={String(Math.max(completed, 3))} hint="Naik dari bulan lalu" tone="primary" />
        <ReportStat icon={Lightbulb} label="Tools dipakai" value="12" hint="Paling sering: Hook" tone="yellow" />
        <ReportStat icon={Users} label="Member direkrut" value="4" hint="1 FREE perlu follow up" tone="sky" />
        <ReportStat icon={Wallet} label="Komisi masuk" value={formatIDR(user?.balance ?? 594000)} hint="Dari member PRO" tone="rose" />
      </section>

      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-black">Ringkasan Bulan Ini</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm font-semibold leading-relaxed text-muted-foreground">
          <p>Kamu mulai lebih konsisten belajar dan memakai tools. Aktivitas paling kuat ada di pembuatan ide konten dan script promosi.</p>
          <p>Yang perlu ditingkatkan bulan depan: follow up member FREE dan pakai bahan video/foto terbaru lebih rutin.</p>
        </div>
      </section>

      <section className="rounded-3xl border border-primary/35 bg-primary/10 p-5">
        <h2 className="font-black text-primary">Saran Bulan Depan</h2>
        <div className="mt-4 space-y-2">
          {[
            "Gunakan Ide Caption minimal 5 kali minggu ini.",
            "Upload 4 konten edukasi + 1 konten promosi setiap hari.",
            "Hubungi member FREE yang belum aktif dalam 5 hari.",
            "Cek Notifikasi setiap Senin untuk info tren terbaru.",
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-card/70 p-3 text-sm font-semibold text-muted-foreground">{item}</div>
          ))}
        </div>
      </section>

      <Link to="/app/achievements" className="flex h-14 items-center justify-center rounded-2xl border border-border bg-card font-black">
        Lihat Badge Saya <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );
};

function ReportStat({ icon: Icon, label, value, hint, tone }: { icon: LucideIcon; label: string; value: string; hint: string; tone: "primary" | "yellow" | "sky" | "rose" }) {
  const toneClass = {
    primary: "bg-primary/15 text-primary",
    yellow: "bg-yellow-500/15 text-yellow-300",
    sky: "bg-sky-500/15 text-sky-300",
    rose: "bg-rose-500/15 text-rose-300",
  }[tone];

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs font-black text-primary">{hint}</p>
    </section>
  );
}

export default MonthlyReport;
