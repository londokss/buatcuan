import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronRight, Lock, Play, Sparkles } from "lucide-react";
import type { LessonDto } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getLearningStatus, getLessonsByLevel, learningLevels, type LearningLevel } from "@/lib/learning";

type LearningPathProps = {
  lessons: LessonDto[];
  completedLessonIds: string[];
  proAccess?: boolean;
  compact?: boolean;
  isLoading?: boolean;
};

export function LearningPath({ lessons, completedLessonIds, proAccess = true, compact = false, isLoading = false }: LearningPathProps) {
  const [activeLevel, setActiveLevel] = useState<LearningLevel>("Beginner");
  const levelLessons = getLessonsByLevel(lessons, activeLevel);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-bold">Semua Materi</h2>
        <p className="text-xs text-muted-foreground">Level khusus dipin, lanjut modul sesuai urutan.</p>
      </div>

      <Link
        to="/app/affiliate"
        className="group flex min-h-[64px] items-center gap-3 rounded-lg border border-accent/45 bg-accent/10 px-3 py-3 shadow-[0_12px_28px_hsl(51_100%_50%_/_0.08)] transition-colors hover:bg-accent/15"
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/20 text-accent ring-1 ring-accent/35">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-extrabold">Level Khusus: Mulai Cuan</p>
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-black uppercase text-accent">Pin</span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">Affiliate 10% untuk FREE, naik 50% saat PRO.</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
      </Link>

      <div className="-mx-1 overflow-x-auto px-1 hide-scrollbar">
        <div className="flex w-max gap-2">
          {learningLevels.map((level) => (
            <button
              key={level.key}
              type="button"
              onClick={() => setActiveLevel(level.key)}
              className={cn(
                "h-8 rounded-full px-3 text-[11px] font-extrabold transition-colors",
                activeLevel === level.key
                  ? "bg-primary text-primary-foreground shadow-glow-sm"
                  : "bg-secondary/80 text-muted-foreground hover:text-foreground",
              )}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {isLoading && <div className="rounded-lg border border-border bg-card/70 p-4 text-sm text-muted-foreground">Memuat materi...</div>}
        {!isLoading && levelLessons.length === 0 && (
          <div className="rounded-lg border border-border bg-card/70 p-4 text-sm text-muted-foreground">Belum ada materi di level ini.</div>
        )}
        {levelLessons.slice(0, compact ? 5 : undefined).map((lesson, index) => {
          const status = getLearningStatus(lessons, lesson, completedLessonIds, proAccess);
          const clickable = !status.locked || status.membershipLocked;
          return (
            <Link
              key={lesson.id}
              to={status.membershipLocked ? "/app/payment" : clickable ? `/app/materi/${lesson.id}` : "#"}
              aria-disabled={!clickable}
              className={cn("block", !clickable && "pointer-events-none")}
            >
              <div
                className={cn(
                  "flex min-h-[58px] items-center gap-3 rounded-lg border bg-card/70 px-3 py-2 transition-colors",
                  status.completed && "border-primary/30 bg-primary/5",
                  !status.completed && !status.locked && "border-primary/45 bg-primary/10",
                  status.locked && "border-border opacity-75",
                  status.membershipLocked && "grayscale",
                )}
              >
                <div
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black",
                    status.completed && "bg-primary text-primary-foreground",
                    !status.completed && !status.locked && status.pointLocked && "bg-secondary text-muted-foreground",
                    !status.completed && !status.locked && !status.pointLocked && "bg-accent/20 text-accent ring-1 ring-accent/40",
                    status.locked && "bg-secondary text-muted-foreground",
                  )}
                >
                  {status.completed ? <Check className="h-4 w-4" /> : status.locked || status.pointLocked ? <Lock className="h-3.5 w-3.5" /> : index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{lesson.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{lesson.desc}</p>
                </div>
                {status.membershipLocked ? (
                  <span className="shrink-0 rounded-full bg-primary px-2 py-1 text-[9px] font-black text-primary-foreground">
                    Upgrade
                  </span>
                ) : (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-1 text-[9px] font-black",
                      status.completed && "bg-primary/15 text-primary",
                      !status.completed && !status.locked && status.pointLocked && "bg-secondary text-muted-foreground",
                      !status.completed && !status.locked && !status.pointLocked && "bg-accent/20 text-accent",
                      status.locked && "bg-secondary text-muted-foreground",
                    )}
                  >
                    {status.completed ? "Selesai" : status.locked ? "Terkunci" : status.pointLocked ? `${lesson.pointCost} poin` : "Lanjutkan"}
                  </span>
                )}
                {!status.locked && <Play className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
