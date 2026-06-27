import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Check, FileText, Gift, Handshake, Lock, Play, RefreshCw, ShoppingBag, Sprout, Trophy, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { api, assetUrl, type LessonDto } from "@/lib/api";
import { cn } from "@/lib/utils";

const learningLevels = [
  { key: "pemula", label: "Pemula", subtitle: "Fondasi dasar", sectionSlugs: ["fondasi-dasar"], icon: Sprout },
  { key: "menengah", label: "Menengah", subtitle: "Fondasi lanjut", sectionSlugs: ["menengah-fondasi-lanjut"], icon: Zap },
  { key: "jago-cuan", label: "Jago Cuan", subtitle: "Mastery & sistem", sectionSlugs: ["strategi-cuan"], icon: Trophy },
  { key: "langsung-cuan", label: "Langsung Buat Cuan", subtitle: "Promosi BuatCuan etis", sectionSlugs: ["bab-4-pembukaan", "bab-4-fase-1", "bab-4-fase-2", "bab-4-fase-3", "bab-4-fase-4", "bab-4-bonus", "bab-4-penutup"], icon: Handshake },
  { key: "tiktok-shop", label: "Cuan dari TikTok Shop", subtitle: "Affiliate TikTok Shop", sectionSlugs: ["bab-5-pembukaan", "bab-5-fase-1", "bab-5-fase-2", "bab-5-fase-3", "bab-5-fase-4", "bab-5-bonus", "bab-5-penutup"], icon: ShoppingBag },
  { key: "level-khusus", label: "Level Khusus (Bonus)", subtitle: "Strategi bonus", sectionSlugs: ["level-khusus-bonus"], icon: Gift },
] as const;
const socialCategories = ["TikTok", "Instagram", "YouTube", "Facebook"] as const;

type LearningLevelKey = (typeof learningLevels)[number]["key"];
type SocialCategory = (typeof socialCategories)[number];

type LessonGroup = {
  slug: string;
  title: string;
  description: string;
  badgeLabel?: string | null;
  lessons: LessonDto[];
};

const Materi = () => {
  const { user } = useApp();
  const [cat, setCat] = useState<SocialCategory>("TikTok");
  const [level, setLevel] = useState<LearningLevelKey>("pemula");
  const levelManuallySelected = useRef(false);
  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["lessons"],
    queryFn: () => api.lessons.list(),
  });

  const proAccess = Boolean(user?.membershipActive);
  const completedLessons = user?.completedLessons ?? [];
  const suggestedLevel = useMemo(
    () => resolveSuggestedLearningLevel(lessons, completedLessons, proAccess, cat),
    [cat, completedLessons, lessons, proAccess],
  );
  useEffect(() => {
    if (!levelManuallySelected.current && suggestedLevel !== level) {
      setLevel(suggestedLevel);
    }
  }, [level, suggestedLevel]);
  const activeLevel = learningLevels.find((item) => item.key === level) ?? learningLevels[0];
  const filtered = useMemo(
    () => sortLessons(lessons.filter((lesson) => lesson.category === cat && activeLevel.sectionSlugs.includes(lesson.sectionSlug ?? ""))),
    [activeLevel, cat, lessons],
  );
  const groups = useMemo(() => groupLessons(filtered), [filtered]);
  const completedInLevel = filtered.filter((lesson) => completedLessons.includes(lesson.id)).length;
  const totalInLevel = filtered.length;
  const freeLevelLocked = !proAccess && level !== "pemula";

  return (
    <div className="relative space-y-4 pb-2">
      <header className="space-y-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-normal">
            Materi <span className="text-primary">Belajar</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Pilih platform, gas praktek.</p>
        </div>

        <div className="overflow-x-auto hide-scrollbar md:overflow-visible">
          <div className="flex w-max gap-2 md:w-full md:flex-wrap">
          {socialCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCat(category)}
                className={cn(
                  "h-9 min-w-20 rounded-full border px-4 text-xs font-semibold transition",
                  cat === category
                    ? "border-primary bg-primary text-primary-foreground shadow-glow-sm"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </header>

      <ProgressPanel
        platform={cat}
        activeKey={level}
        completed={completedInLevel}
        total={totalInLevel}
        proAccess={proAccess}
        onChange={(nextLevel) => {
          levelManuallySelected.current = true;
          setLevel(nextLevel);
        }}
      />
      <LearningUpdateStrip />

      {isLoading && <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">Memuat materi...</div>}
      {!isLoading && freeLevelLocked && (
        <LevelLockedCard level={activeLevel.label} />
      )}
      {!isLoading && filtered.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-base font-extrabold text-foreground">Akan datang</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Materi untuk level ini sedang disiapkan.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {!freeLevelLocked && groups
          .map((group) => (
            <LessonSection key={group.slug} group={group} completedLessons={completedLessons} proAccess={proAccess} />
          ))}

        {!freeLevelLocked && !isLoading && filtered.length > 0 && (
          <>
            {!proAccess && <CaseStudySection />}
            <AchievementHint />
            {!proAccess && <UpgradeCard subtitle={upgradeSubtitle(level)} />}
          </>
        )}
      </div>
    </div>
  );
};

function LearningUpdateStrip() {
  return (
    <Link to="/app/notifications" className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
        <RefreshCw className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-primary">Materi baru masuk notifikasi</span>
        <span className="mt-1 block text-xs font-semibold leading-relaxed text-muted-foreground">
          Update strategi sosial media, cara pakai fitur baru, dan contoh konten terbaru akan muncul di modul terkait.
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
    </Link>
  );
}

function LevelLockedCard({ level }: { level: string }) {
  return (
    <section className="rounded-2xl border border-accent/35 bg-accent/10 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
          <Lock className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-accent">{level} khusus PRO</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">Member FREE bisa belajar sampai level Pemula. Upgrade untuk membuka semua level.</p>
        </div>
        <Link to="/app/payment" className="shrink-0 rounded-xl border border-accent/35 px-3 py-2 text-xs font-extrabold text-accent">
          Upgrade
        </Link>
      </div>
    </section>
  );
}

function ProgressPanel({
  platform,
  activeKey,
  completed,
  total,
  proAccess,
  onChange,
}: {
  platform: SocialCategory;
  activeKey: LearningLevelKey;
  completed: number;
  total: number;
  proAccess: boolean;
  onChange: (value: LearningLevelKey) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const activeLevel = learningLevels.find((item) => item.key === activeKey) ?? learningLevels[0];
  const ActiveIcon = activeLevel.icon;
  const activeLocked = !proAccess && activeKey !== "pemula";

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">Kemajuan Belajar - {platform}</p>
        <p className="text-xs font-extrabold text-primary">{completed} dari {total} modul</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="mt-3 flex w-full items-center gap-3 rounded-xl border border-primary/25 bg-background/70 p-3 text-left shadow-glow-sm transition hover:border-primary/50"
      >
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", activeLocked ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary")}>
          {activeLocked ? <Lock className="h-5 w-5" /> : <ActiveIcon className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold text-foreground">{activeLevel.label}</span>
          <span className="mt-0.5 block truncate text-[11px] font-semibold text-muted-foreground">
            {activeLocked ? "Khusus PRO" : activeLevel.subtitle}
          </span>
        </span>
        <span className="shrink-0 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[11px] font-extrabold text-primary">
          Pilih
        </span>
      </button>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border-white/10 bg-card p-0 shadow-2xl sm:max-w-lg">
          <DialogTitle className="sr-only">Pilih Materi Belajar</DialogTitle>
          <DialogDescription className="sr-only">Daftar level dan bab materi belajar.</DialogDescription>
          <div className="relative overflow-hidden border-b border-white/10 bg-primary/10 px-5 pb-4 pt-5">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-rose-400" />
            <p className="text-xs font-extrabold uppercase text-primary">Jalur Materi</p>
            <h2 className="mt-1 text-xl font-extrabold leading-tight">Pilih Bab Belajar</h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">Kemajuan {platform}: {completed} dari {total} modul</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-background/60">
              <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
            </div>
          </div>

          <div className="max-h-[68dvh] space-y-2 overflow-y-auto p-3">
            {learningLevels.map((item) => {
              const Icon = item.icon;
              const active = item.key === activeKey;
              const locked = !proAccess && item.key !== "pemula";
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onChange(item.key);
                    setPickerOpen(false);
                  }}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
                    active
                      ? "border-primary/60 bg-primary/12 shadow-glow-sm"
                      : "border-border bg-background/55 hover:border-primary/35 hover:bg-primary/5",
                  )}
                >
                  <span className={cn(
                    "grid h-12 w-12 shrink-0 place-items-center rounded-2xl border",
                    active
                      ? "border-primary/35 bg-primary text-primary-foreground"
                      : locked
                        ? "border-border bg-muted text-muted-foreground"
                        : "border-primary/20 bg-primary/10 text-primary",
                  )}>
                    {locked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm font-extrabold leading-tight", locked && !active && "text-muted-foreground")}>
                      {item.label}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-muted-foreground">{item.subtitle}</span>
                  </span>
                  <span className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold",
                    active
                      ? "bg-primary text-primary-foreground"
                      : locked
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary",
                  )}>
                    {active ? "Aktif" : locked ? "PRO" : "Buka"}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function LessonSection({ group, completedLessons, proAccess }: { group: LessonGroup; completedLessons: string[]; proAccess: boolean }) {
  const lessons = group.lessons;
  const currentId = lessons.find((lesson) => !completedLessons.includes(lesson.id) && !isMembershipLocked(lesson, proAccess))?.id;

  return (
    <section className={cn("space-y-3", group.slug !== "modul-cepat" && "border-t border-border/70 pt-4")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-extrabold">{group.title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>
        </div>
        {group.badgeLabel && (
          <span className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-[11px] font-extrabold",
            group.slug === "modul-cepat"
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-accent/40 bg-accent/10 text-accent",
          )}>
            {group.badgeLabel}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {lessons.map((lesson) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            completed={completedLessons.includes(lesson.id)}
            current={lesson.id === currentId}
            proAccess={proAccess}
            sectionSlug={group.slug}
          />
        ))}
      </div>
    </section>
  );
}

function LessonRow({
  lesson,
  completed,
  current,
  proAccess,
  sectionSlug,
}: {
  lesson: LessonDto;
  completed: boolean;
  current: boolean;
  proAccess: boolean;
  sectionSlug: string;
}) {
  const locked = isMembershipLocked(lesson, proAccess);
  const code = lesson.displayCode ?? String(lesson.sortOrder ?? "");
  const target = locked ? "/app/payment" : `/app/materi/${lesson.id}`;
  const badge = completed ? "Selesai" : current ? "Lanjutkan" : locked ? (sectionSlug === "strategi-cuan" ? "PRO" : "Terkunci") : "";
  const detail = locked ? (sectionSlug === "modul-cepat" ? "Khusus PRO Member" : lesson.desc) : lesson.desc;
  const updated = Boolean(lesson.isUpdated);

  return (
    <Link
      to={target}
      className={cn(
        "group block rounded-xl border bg-card p-3 transition",
        current ? "border-primary/55 bg-primary/10 shadow-glow-sm" : "border-border hover:border-primary/35",
        locked && "opacity-55 hover:opacity-80",
      )}
    >
      <div className="flex items-center gap-3">
        <LessonThumbnail lesson={lesson} completed={completed} current={current} locked={locked} code={code} />
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-bold", locked && "text-muted-foreground")}>
            {formatLessonTitle(lesson)}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {updated && (
            <span className="rounded-md bg-sky-500/15 px-2 py-1 text-[10px] font-extrabold text-sky-300">
              {lesson.updateLabel || "Diperbarui"}
            </span>
          )}
          {badge && (
            <span className={cn(
              "rounded-md px-2 py-1 text-[10px] font-extrabold",
              completed
                ? "bg-primary/12 text-primary"
                : current
                  ? "bg-accent/15 text-accent"
                  : locked
                    ? "bg-muted text-muted-foreground"
                    : "bg-accent/12 text-accent",
            )}>
              {badge}
            </span>
          )}
          {!locked && !completed && <Play className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-primary" />}
        </div>
      </div>
    </Link>
  );
}

function LessonThumbnail({ lesson, completed, current, locked, code }: { lesson: LessonDto; completed: boolean; current: boolean; locked: boolean; code: string }) {
  const lessonCode = lessonNumberBadge(code);
  const statusIcon = completed
    ? <Check className="h-3.5 w-3.5" />
    : locked
      ? <Lock className="h-3.5 w-3.5" />
      : lessonCode ?? <FileText className="h-3.5 w-3.5" />;
  const badgeClass = completed || current ? "bg-primary text-primary-foreground" : locked ? "bg-accent text-accent-foreground" : "bg-black/70 text-white";

  if (lesson.video?.url) {
    return (
      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-black">
        <video src={assetUrl(lesson.video.url)} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
        <span className={cn("absolute left-1.5 top-1.5 grid min-h-6 min-w-6 place-items-center rounded-md px-1.5 text-[10px] font-extrabold", badgeClass)}>
          {statusIcon}
        </span>
        <Play className="absolute bottom-1.5 right-1.5 h-3.5 w-3.5 fill-white text-white" />
      </div>
    );
  }

  if (lesson.pdf) {
    return (
      <div className="relative grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-secondary text-muted-foreground">
        <FileText className="h-5 w-5" />
        <span className="absolute bottom-1.5 rounded bg-background/80 px-1.5 py-0.5 text-[9px] font-extrabold text-foreground">PDF</span>
        <span className={cn("absolute left-1.5 top-1.5 grid min-h-6 min-w-6 place-items-center rounded-md px-1.5 text-[10px] font-extrabold", completed || current ? "bg-primary text-primary-foreground" : locked ? "bg-accent/12 text-accent" : "bg-background/80 text-foreground")}>
          {statusIcon}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xs font-extrabold",
      completed || current ? "bg-primary text-primary-foreground" : locked ? "bg-accent/12 text-accent" : "bg-primary/10 text-primary",
    )}>
      {statusIcon}
    </div>
  );
}

function lessonNumberBadge(code: string) {
  const normalized = code.trim();
  const directNumber = normalized.match(/^\d+(?:\.\d+)?$/);
  if (directNumber) return directNumber[0];

  const moduleNumber = normalized.match(/^Modul\s+(\d+(?:\.\d+)?)$/i);
  if (moduleNumber) return moduleNumber[1];

  const bonusNumber = normalized.match(/^Bonus\s+(\d+(?:\.\d+)?)$/i);
  if (bonusNumber) return bonusNumber[1];

  return null;
}

function CaseStudySection() {
  return (
    <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
      <p className="text-sm font-extrabold text-rose-300">Case Study PRO</p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
        Akun ini dari 0 ke 10rb followers dalam 80 hari. Kuncinya: 4 konten harian, hook kuat, dan review mingguan dari mentor.
      </p>
      <Link to="/app/payment" className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-rose-300">
        Buka studi lengkap <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

function AchievementHint() {
  return (
    <Link to="/app/achievements" className="flex items-center gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-yellow-500/15 text-yellow-300">
        <Award className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-yellow-300">Badge pencapaian tersedia</span>
        <span className="mt-1 block text-xs font-semibold text-muted-foreground">Selesaikan modul untuk naik level dan buka badge baru.</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-yellow-300" />
    </Link>
  );
}

function UpgradeCard({ subtitle }: { subtitle: string }) {
  return (
    <Link to="/app/payment" className="block rounded-2xl border border-accent/35 bg-accent/10 p-4 transition hover:border-accent/60">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
          <Lock className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-accent">Buka Akses PRO Sekarang</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-accent" />
      </div>
    </Link>
  );
}

function upgradeSubtitle(level: LearningLevelKey) {
  if (level === "pemula") return "Akses penuh semua modul Pemula";
  if (level === "menengah") return "Akses penuh semua modul Menengah";
  if (level === "jago-cuan") return "Akses strategi Jago Cuan dan materi lanjutan";
  if (level === "langsung-cuan") return "Akses praktek promosi BuatCuan yang etis";
  if (level === "tiktok-shop") return "Akses affiliate TikTok Shop untuk pemula";
  return "Akses materi bonus saat sudah tersedia";
}

function groupLessons(lessons: LessonDto[]): LessonGroup[] {
  const map = new Map<string, LessonGroup>();
  for (const lesson of lessons) {
    const slug = lesson.section?.slug ?? "lainnya";
    if (!map.has(slug)) {
      map.set(slug, {
        slug,
        title: lesson.section?.title ?? "Materi Lainnya",
        description: lesson.section?.description ?? "Materi tambahan untuk praktek.",
        badgeLabel: lesson.section?.badgeLabel,
        lessons: [],
      });
    }
    map.get(slug)?.lessons.push(lesson);
  }
  return [...map.values()].sort((a, b) => {
    const aOrder = a.lessons[0]?.section?.sortOrder ?? 99;
    const bOrder = b.lessons[0]?.section?.sortOrder ?? 99;
    return aOrder - bOrder;
  });
}

function sortLessons(lessons: LessonDto[]) {
  return [...lessons].sort((a, b) => {
    const bySection = (a.section?.sortOrder ?? 99) - (b.section?.sortOrder ?? 99);
    if (bySection) return bySection;
    const bySort = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (bySort) return bySort;
    return a.title.localeCompare(b.title);
  });
}

function resolveSuggestedLearningLevel(
  lessons: LessonDto[],
  completedLessonIds: string[],
  proAccess: boolean,
  category: SocialCategory,
): LearningLevelKey {
  if (!proAccess) return "pemula";

  const completed = new Set(completedLessonIds);
  const lessonsByLevel = learningLevels.map((level) => ({
    level,
    lessons: sortLessons(lessons.filter((lesson) => lesson.category === category && level.sectionSlugs.includes(lesson.sectionSlug ?? ""))),
  }));
  const firstLevelWithLessons = lessonsByLevel.find((item) => item.lessons.length > 0)?.level.key ?? "pemula";
  const learningPath = sortLessons(lessonsByLevel.flatMap((item) => item.lessons));
  const lastCompletedLesson = [...learningPath].reverse().find((lesson) => completed.has(lesson.id));

  if (!lastCompletedLesson) return firstLevelWithLessons;

  const currentLevelIndex = learningLevels.findIndex((level) => level.sectionSlugs.includes(lastCompletedLesson.sectionSlug ?? ""));
  if (currentLevelIndex < 0) return firstLevelWithLessons;

  const currentLevelLessons = lessonsByLevel[currentLevelIndex]?.lessons ?? [];
  const hasIncompleteInCurrentLevel = currentLevelLessons.some((lesson) => !completed.has(lesson.id));
  if (hasIncompleteInCurrentLevel) return learningLevels[currentLevelIndex].key;

  const nextLevel = lessonsByLevel.slice(currentLevelIndex + 1).find((item) => item.lessons.length > 0);
  return nextLevel?.level.key ?? learningLevels[currentLevelIndex].key;
}

function formatLessonTitle(lesson: LessonDto) {
  if (!lesson.displayCode || /^\d+$/.test(lesson.displayCode)) return lesson.title;
  return `${lesson.displayCode} – ${lesson.title}`;
}

function isMembershipLocked(lesson: LessonDto, proAccess: boolean) {
  return Boolean(lesson.isMembershipLocked ?? (!proAccess && lesson.requiredMembership === "PRO"));
}

export default Materi;
