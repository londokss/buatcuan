import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CalendarCheck2,
  CheckCircle2,
  Crown,
  Flame,
  GraduationCap,
  Lock,
  Medal,
  Minus,
  NotebookPen,
  Plus,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, type GamificationAchievementDto, type GamificationMissionDto, type GamificationTone } from "@/lib/api";
import { cn } from "@/lib/utils";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  BookOpenCheck,
  CalendarCheck2,
  CheckCircle2,
  Crown,
  Flame,
  GraduationCap,
  NotebookPen,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  Zap,
};

const toneClass: Record<GamificationTone, { border: string; bg: string; text: string; icon: string; progress: string }> = {
  primary: { border: "border-primary/35", bg: "bg-primary/10", text: "text-primary", icon: "bg-primary/15 text-primary", progress: "bg-primary" },
  yellow: { border: "border-yellow-500/35", bg: "bg-yellow-500/10", text: "text-yellow-300", icon: "bg-yellow-500/15 text-yellow-300", progress: "bg-yellow-400" },
  sky: { border: "border-sky-500/35", bg: "bg-sky-500/10", text: "text-sky-300", icon: "bg-sky-500/15 text-sky-300", progress: "bg-sky-400" },
  rose: { border: "border-rose-500/35", bg: "bg-rose-500/10", text: "text-rose-300", icon: "bg-rose-500/15 text-rose-300", progress: "bg-rose-400" },
  violet: { border: "border-violet-500/35", bg: "bg-violet-500/10", text: "text-violet-300", icon: "bg-violet-500/15 text-violet-300", progress: "bg-violet-400" },
  orange: { border: "border-orange-500/35", bg: "bg-orange-500/10", text: "text-orange-300", icon: "bg-orange-500/15 text-orange-300", progress: "bg-orange-400" },
};

const Achievements = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["gamification"], queryFn: api.gamification.dashboard });
  const [contentCount, setContentCount] = useState(0);
  const [promoCount, setPromoCount] = useState(0);

  useEffect(() => {
    if (!data) return;
    setContentCount(data.today.action.contentCount);
    setPromoCount(data.today.action.promoCount);
  }, [data]);

  const saveDailyAction = useMutation({
    mutationFn: () => api.gamification.updateDailyAction({ contentCount, promoCount }),
    onSuccess: () => {
      toast.success("Progress 4+1 tersimpan");
      void qc.invalidateQueries({ queryKey: ["gamification"] });
    },
    onError: () => toast.error("Gagal menyimpan progress"),
  });

  const groupedAchievements = useMemo(() => {
    const groups = new Map<string, GamificationAchievementDto[]>();
    for (const achievement of data?.achievements ?? []) {
      const items = groups.get(achievement.category) ?? [];
      items.push(achievement);
      groups.set(achievement.category, items);
    }
    return [...groups.entries()];
  }, [data?.achievements]);

  if (isLoading) {
    return <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">Memuat gamification...</div>;
  }
  if (!data) return null;

  const nextPercent = data.summary.nextLevel
    ? Math.min(100, Math.round((data.summary.totalXp / data.summary.nextLevel.requiredXp) * 100))
    : 100;
  const missionDone = data.today.missions.filter((mission) => mission.done).length;

  return (
    <div className="space-y-5 pb-3">
      <section className="rounded-[28px] border border-yellow-500/35 bg-[radial-gradient(circle_at_16%_0%,rgba(250,204,21,.20),transparent_38%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--background))_62%,rgba(34,197,94,.08))] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-500/35 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
              <Sparkles className="h-3.5 w-3.5" />
              Real Gamification
            </span>
            <h1 className="mt-4 text-3xl font-black leading-tight">{data.summary.levelTitle}</h1>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              Level {data.summary.level} · {data.summary.totalXp.toLocaleString("id-ID")} XP · Rank #{data.leaderboard.myRank}
            </p>
          </div>
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-yellow-500/35 bg-yellow-500/15 text-yellow-300">
            <Trophy className="h-8 w-8" />
          </span>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-yellow-400" style={{ width: `${nextPercent}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold text-muted-foreground">
          <span>{data.summary.unlockedAchievements}/{data.summary.totalAchievements} badge terbuka</span>
          <span>{data.summary.nextLevel ? `${data.summary.nextLevel.remainingXp} XP ke ${data.summary.nextLevel.title}` : "Level maksimal"}</span>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Metric icon={Flame} label="Streak" value={`${data.summary.currentStreak} hari`} tone="orange" />
        <Metric icon={CalendarCheck2} label="Terpanjang" value={`${data.summary.longestStreak} hari`} tone="yellow" />
        <Metric icon={Award} label="Misi hari ini" value={`${missionDone}/${data.today.missions.length}`} tone="primary" />
      </section>

      <DailyActionCard
        contentCount={contentCount}
        promoCount={promoCount}
        saving={saveDailyAction.isPending}
        onContentChange={setContentCount}
        onPromoChange={setPromoCount}
        onSave={() => saveDailyAction.mutate()}
      />

      <section className="space-y-3">
        <SectionTitle title="Misi Hari Ini" subtitle="Aktivitas real yang dihitung ke streak dan XP." />
        <div className="space-y-2">
          {data.today.missions.map((mission) => <MissionRow key={mission.code} mission={mission} />)}
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Badge Saya" subtitle="Badge akan otomatis terbuka saat syarat tercapai." />
        {groupedAchievements.map(([category, items]) => (
          <div key={category} className="space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">{category}</p>
            <div className="grid grid-cols-2 gap-3">
              {items.map((achievement) => <AchievementCard key={achievement.code} achievement={achievement} />)}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-black">Leaderboard XP</h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">Top member yang sudah tersinkron gamification.</p>
          </div>
          <Medal className="h-5 w-5 text-yellow-300" />
        </div>
        <div className="space-y-2">
          {data.leaderboard.items.length === 0 && (
            <p className="rounded-2xl bg-secondary p-3 text-sm font-semibold text-muted-foreground">Belum ada data leaderboard.</p>
          )}
          {data.leaderboard.items.map((item) => (
            <div key={item.userId} className={cn("flex items-center gap-3 rounded-2xl border p-3", item.isCurrentUser ? "border-primary/35 bg-primary/10" : "border-border bg-secondary/60")}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-yellow-500/15 text-xs font-black text-yellow-300">#{item.rank}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{item.name}</p>
                <p className="text-xs font-semibold text-muted-foreground">{item.levelTitle} · {item.currentStreak} hari streak</p>
              </div>
              <p className="shrink-0 text-sm font-black text-primary">{item.totalXp.toLocaleString("id-ID")} XP</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

function DailyActionCard({
  contentCount,
  promoCount,
  saving,
  onContentChange,
  onPromoChange,
  onSave,
}: {
  contentCount: number;
  promoCount: number;
  saving: boolean;
  onContentChange: (value: number) => void;
  onPromoChange: (value: number) => void;
  onSave: () => void;
}) {
  const done = contentCount >= 4 && promoCount >= 1;
  const progress = Math.min(4, contentCount) + Math.min(1, promoCount);
  return (
    <section className={cn("rounded-[28px] border p-5", done ? "border-primary/35 bg-primary/10" : "border-orange-500/35 bg-orange-500/10")}>
      <div className="flex items-start gap-3">
        <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", done ? "bg-primary/15 text-primary" : "bg-orange-500/15 text-orange-300")}>
          <Flame className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black">Rumus 4+1 Hari Ini</h2>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{progress}/5 selesai · 4 konten nilai + 1 konten promosi</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Counter label="Konten nilai" value={contentCount} target={4} onChange={onContentChange} />
        <Counter label="Konten promosi" value={promoCount} target={1} onChange={onPromoChange} />
      </div>
      <Button type="button" disabled={saving} onClick={onSave} className="mt-4 h-12 w-full rounded-2xl font-black">
        {saving ? "Menyimpan..." : done ? "Simpan Badge 4+1" : "Simpan Progress Hari Ini"}
      </Button>
    </section>
  );
}

function Counter({ label, value, target, onChange }: { label: string; value: number; target: number; onChange: (value: number) => void }) {
  const done = value >= target;
  return (
    <div className={cn("rounded-2xl border bg-card/75 p-3", done ? "border-primary/35" : "border-border")}>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background">
          <Minus className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className={cn("text-2xl font-black", done ? "text-primary" : "text-foreground")}>{value}</p>
          <p className="text-[10px] font-black text-muted-foreground">target {target}</p>
        </div>
        <button type="button" onClick={() => onChange(Math.min(20, value + 1))} className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MissionRow({ mission }: { mission: GamificationMissionDto }) {
  const percent = Math.min(100, Math.round((mission.progress.value / mission.progress.target) * 100));
  return (
    <Link to={mission.href} className={cn("block rounded-2xl border p-4", mission.done ? "border-primary/35 bg-primary/10" : "border-border bg-card")}>
      <div className="flex items-center gap-3">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", mission.done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
          {mission.done ? <CheckCircle2 className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black">{mission.title}</span>
          <span className="mt-0.5 block text-xs font-semibold leading-relaxed text-muted-foreground">{mission.description}</span>
        </span>
        <span className="shrink-0 text-xs font-black text-primary">+{mission.xp} XP</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </Link>
  );
}

function AchievementCard({ achievement }: { achievement: GamificationAchievementDto }) {
  const Icon = achievement.earned ? iconMap[achievement.icon] ?? Award : Lock;
  const tone = toneClass[achievement.tone];
  return (
    <div className={cn("rounded-2xl border p-4", achievement.earned ? `${tone.border} ${tone.bg}` : "border-border bg-card opacity-75")}>
      <span className={cn("grid h-11 w-11 place-items-center rounded-xl", achievement.earned ? tone.icon : "bg-muted text-muted-foreground")}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-black">{achievement.title}</p>
      <p className="mt-1 line-clamp-2 min-h-8 text-xs font-semibold leading-relaxed text-muted-foreground">{achievement.description}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", achievement.earned ? tone.progress : "bg-muted-foreground/40")} style={{ width: `${achievement.progress.percent}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-black">
        <span className={achievement.earned ? tone.text : "text-muted-foreground"}>{achievement.earned ? "Terbuka" : `${achievement.progress.value}/${achievement.progress.target}`}</span>
        <span className="text-muted-foreground">+{achievement.xp} XP</span>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: ComponentType<{ className?: string }>; label: string; value: string; tone: GamificationTone }) {
  const colors = toneClass[tone];
  return (
    <section className="rounded-2xl border border-border bg-card p-3 text-center">
      <span className={cn("mx-auto grid h-10 w-10 place-items-center rounded-xl", colors.icon)}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
    </section>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="font-black">{title}</h2>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export default Achievements;
