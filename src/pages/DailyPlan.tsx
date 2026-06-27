import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Flame,
  Loader2,
  MessageCircle,
  Radio,
  Sparkles,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { api, getErrorMessage, type DailyPlanPersona, type DailyPlanTaskDto } from "@/lib/api";
import { cn } from "@/lib/utils";

const personaMeta: Record<DailyPlanPersona, { label: string; icon: LucideIcon; className: string }> = {
  LEARNER: { label: "Belajar", icon: BookOpenCheck, className: "border-primary/30 bg-primary/10 text-primary" },
  CONTENT: { label: "Konten", icon: Flame, className: "border-orange-500/30 bg-orange-500/10 text-orange-300" },
  MENTOR: { label: "Mentor", icon: Users, className: "border-violet-500/30 bg-violet-500/10 text-violet-300" },
};

const filters: Array<{ value: "ALL" | DailyPlanPersona; label: string }> = [
  { value: "ALL", label: "Semua" },
  { value: "LEARNER", label: "Belajar" },
  { value: "CONTENT", label: "Konten" },
  { value: "MENTOR", label: "Mentor" },
];

const DailyPlan = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"ALL" | DailyPlanPersona>("ALL");
  const { data, isLoading, isError } = useQuery({ queryKey: ["daily-plan"], queryFn: api.dailyPlan.get });

  const completeLessonTask = useMutation({
    mutationFn: (code: string) => api.dailyPlan.updateTask(code, true),
    onSuccess: (next) => {
      queryClient.setQueryData(["daily-plan"], next);
      queryClient.invalidateQueries({ queryKey: ["gamification"] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Materi harian ditandai selesai");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Materi gagal ditandai selesai")),
  });

  const tasks = useMemo(() => {
    const items = data?.tasks ?? [];
    return filter === "ALL" ? items : items.filter((task) => task.persona === filter);
  }, [data?.tasks, filter]);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Memuat daily plan...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm font-semibold text-rose-200">
        Daily plan belum bisa dimuat. Coba refresh halaman.
      </section>
    );
  }

  return (
    <div className="space-y-5 pb-4 text-foreground">
      <section className="rounded-2xl border border-primary/30 bg-[radial-gradient(circle_at_12%_0%,hsl(var(--primary)/0.18),transparent_34%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--background))_58%,hsl(var(--primary)/0.08))] p-4 shadow-[0_24px_70px_hsl(142_100%_39%_/_0.10)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-extrabold uppercase text-primary">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Daily Action Plan
            </p>
            <h1 className="mt-3 text-2xl font-black">Rencana eksekusi hari ini</h1>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">{data.summary.focusText}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground">XP hari ini</p>
            <p className="text-2xl font-black text-[#ffd600]">{data.summary.earnedXp}</p>
            <p className="text-xs font-bold text-muted-foreground">dari {data.summary.totalXpAvailable}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span>{data.summary.completedTasks} dari {data.summary.totalTasks} selesai</span>
            <span className="text-primary">{data.summary.completionPercent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${data.summary.completionPercent}%` }} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric icon={BookOpenCheck} label="Belajar" value={data.summary.learnerCompleted} />
          <Metric icon={Flame} label="Konten" value={data.summary.contentCompleted} />
          <Metric icon={Users} label="Mentor" value={data.summary.mentorCompleted} />
        </div>
      </section>

      {data.nextBestTask && <NextBestTask task={data.nextBestTask} onComplete={() => completeLessonTask.mutate(data.nextBestTask!.code)} loading={completeLessonTask.isPending} />}

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-extrabold">
            <Trophy className="h-4 w-4 text-[#ffd600]" />
            Ritme 7 hari
          </h2>
          <Link to="/app/achievements" className="inline-flex items-center gap-1 text-xs font-extrabold text-primary">
            Badge
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {data.week.map((day) => (
            <div key={day.date} className="rounded-xl border border-border bg-background p-2 text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-black">
                {day.percent}%
              </div>
              <p className="mt-2 text-[10px] font-bold text-muted-foreground">{formatShortDate(day.date)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Checklist harian</h2>
          <span className="text-xs font-bold text-muted-foreground">{tasks.length} task</span>
        </div>
        <div className="grid grid-cols-4 gap-2 rounded-2xl border border-border bg-card p-1">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                "rounded-xl px-2 py-2 text-xs font-extrabold transition",
                filter === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.code}
              task={task}
              loading={completeLessonTask.isPending}
              onComplete={() => completeLessonTask.mutate(task.code)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background/70 p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-lg font-black">{value}</p>
      <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
    </div>
  );
}

function NextBestTask({ task, onComplete, loading }: { task: DailyPlanTaskDto; onComplete: () => void; loading: boolean }) {
  return (
    <section className="rounded-2xl border border-[#ffd600]/35 bg-[#ffd600]/10 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ffd600]/15 text-[#ffd600]">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase text-[#ffd600]">Next best action</p>
          <h2 className="mt-1 text-lg font-black">{task.title}</h2>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-muted-foreground">{task.description}</p>
          <TaskActions task={task} onComplete={onComplete} loading={loading} />
        </div>
      </div>
    </section>
  );
}

function TaskCard({ task, onComplete, loading }: { task: DailyPlanTaskDto; onComplete: () => void; loading: boolean }) {
  const meta = personaMeta[task.persona];
  const Icon = meta.icon;
  return (
    <article className={cn("rounded-2xl border bg-card p-4 transition", task.completed ? "border-primary/35" : "border-border")}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition",
            task.completed ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground",
          )}
          aria-label={task.completed ? "Selesai" : "Belum selesai"}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold", meta.className)}>
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ffd600]/10 px-2.5 py-1 text-[11px] font-extrabold text-[#ffd600]">
              <Radio className="h-3.5 w-3.5" />
              +{task.xp} XP
            </span>
          </div>
          <h3 className="mt-3 text-base font-black">{task.title}</h3>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-muted-foreground">{task.description}</p>
          <TaskActions task={task} onComplete={onComplete} loading={loading} />
        </div>
      </div>
    </article>
  );
}

function TaskActions({ task, onComplete, loading }: { task: DailyPlanTaskDto; onComplete: () => void; loading: boolean }) {
  const canCompleteLesson = task.code === "lesson_next" && !task.completed;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {task.href && (
        task.href.startsWith("http") ? (
          <a href={task.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground">
            <MessageCircle className="h-4 w-4" />
            {task.ctaLabel ?? "Buka"}
          </a>
        ) : (
          <Link to={task.href} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground">
            <ClipboardList className="h-4 w-4" />
            {task.ctaLabel ?? "Buka"}
          </Link>
        )
      )}
      {canCompleteLesson && (
        <button
          type="button"
          onClick={onComplete}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-extrabold text-foreground"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Tandai materi selesai
        </button>
      )}
      {task.completed && (
        <span className="inline-flex items-center gap-2 rounded-xl border border-primary/35 px-4 py-2 text-sm font-extrabold text-primary">
          <CheckCircle2 className="h-4 w-4" />
          Terdeteksi selesai
        </span>
      )}
      {!task.completed && task.code !== "lesson_next" && (
        <span className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground">
          Selesai otomatis setelah aktivitas terdeteksi
        </span>
      )}
    </div>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(new Date(`${value}T00:00:00`));
}

export default DailyPlan;
