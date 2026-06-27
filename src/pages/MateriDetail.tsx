import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowRight, Check, Download, Lock, MoreVertical, Play } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { VerticalMediaViewer, type VerticalMediaItem } from "@/components/VerticalMediaViewer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, assetUrl, type LessonDto } from "@/lib/api";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { isSequentiallyAvailable, sortLearningPath } from "@/lib/learning";

const MateriDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, toggleLesson } = useApp();
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const qc = useQueryClient();
  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", id],
    queryFn: () => api.lessons.detail(id!),
    enabled: Boolean(id),
  });
  const { data: lessons = [] } = useQuery({ queryKey: ["lessons"], queryFn: () => api.lessons.list() });
  const sortedLessons = useMemo(() => sortLearningPath(lessons), [lessons]);
  const unlock = useMutation({
    mutationFn: () => api.lessons.unlock(id!),
    onSuccess: () => {
      toast.success("Video terbuka");
      void qc.invalidateQueries({ queryKey: ["lesson", id] });
      void qc.invalidateQueries({ queryKey: ["lessons"] });
      void qc.invalidateQueries({ queryKey: ["points-summary"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Gagal membuka video"),
  });

  const downloadLessonPdf = async (lessonId: string, fileName: string) => {
    const blob = await api.lessons.downloadPdf(lessonId);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const currentLessonVideos = useMemo(() => getLessonVideos(lesson), [lesson]);
  const viewerItems = useMemo<VerticalMediaItem[]>(() => {
    const source = lessons.length ? lessons : lesson ? [lesson] : [];
    return source.flatMap((item) => {
      const entries: VerticalMediaItem[] = [];
      getLessonVideos(item).forEach((video, index) => {
        entries.push({
          id: `${item.id}-video-${video.id}`,
          type: "video",
          title: video.title || item.title,
          subtitle: `${item.category} · ${video.duration || item.duration}`,
          description: video.description || item.desc,
          url: video.url,
          downloadName: video.originalName,
          terms: [
            "Video materi hanya untuk pembelajaran member aktif.",
            "Jangan membagikan rekaman atau file mentah ke pihak luar.",
            "Tonton dan praktekkan checklist sesuai urutan.",
          ],
        });
      });
      if (item.pdf) {
        entries.push({
          id: `${item.id}-pdf`,
          type: "pdf",
          title: item.pdf.originalName,
          subtitle: item.title,
          description: item.pdf.requiredPlanId ? "Akses sesuai paket subscribe" : "Akses untuk akun aktif",
          downloadName: item.pdf.originalName,
          downloadLabel: "PDF",
          onDownload: () => downloadLessonPdf(item.id, item.pdf!.originalName),
          terms: [
            "PDF materi hanya untuk pembelajaran member aktif.",
            "Dilarang menyebarkan ulang file ke pihak luar.",
            "Gunakan file sebagai panduan praktek pribadi.",
          ],
        });
      }
      return entries;
    });
  }, [lesson, lessons]);

  if (isLoading) return <div className="p-6">Memuat materi...</div>;
  if (!lesson) {
    return (
      <div className="space-y-4 p-6">
        <BackButton to="/app/materi" />
        <p>Materi tidak ditemukan.</p>
      </div>
    );
  }

  const completedLessons = user?.completedLessons ?? [];

  const done = completedLessons.includes(lesson.id);
  const membershipBlocked = Boolean(lesson.isMembershipLocked ?? (!user?.membershipActive && lesson.requiredMembership === "PRO"));
  const nextLesson = getNextLessonAfterCurrent(sortedLessons, lesson.id);
  const sequentialBlocked =
    Boolean(user?.membershipActive && !membershipBlocked && !done && lessons.length > 0 && !isSequentiallyAvailable(lessons, lesson.id, completedLessons));
  const copyShare = async () => {
    if (!lesson.shareUrl) return;
    await navigator.clipboard.writeText(lesson.shareUrl);
    toast.success("Link video disalin");
  };

  const toggleProgress = async () => {
    if (updatingProgress) return;
    setUpdatingProgress(true);
    try {
      await toggleLesson(lesson.id);
    } finally {
      setUpdatingProgress(false);
    }
  };

  const openViewerFor = (itemId: string) => {
    const nextIndex = viewerItems.findIndex((item) => item.id === itemId);
    setViewerIndex(nextIndex >= 0 ? nextIndex : 0);
    setViewerOpen(true);
  };

  return (
    <div className="space-y-5">
      <BackButton onClick={() => nav(-1)} />

      {membershipBlocked ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-card/85 p-5 text-center shadow-card">
          <div className={`absolute inset-0 bg-gradient-to-br ${lesson.thumb} opacity-20 grayscale`} />
          <div className="relative">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-lg bg-primary/15 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <p className="text-lg font-extrabold">Materi PRO terkunci</p>
            <p className="mt-1 text-sm text-muted-foreground">Upgrade untuk buka video, PDF, checklist, dan tools premium selama 3 bulan.</p>
            <Link to="/app/payment">
              <Button className="mt-4 w-full rounded-lg gradient-primary font-bold text-primary-foreground">Upgrade</Button>
            </Link>
          </div>
        </div>
      ) : sequentialBlocked ? (
        <div className="rounded-lg border border-border bg-card/85 p-5 text-center shadow-card">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-lg bg-secondary text-muted-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <p className="text-lg font-extrabold">Modul masih terkunci</p>
          <p className="mt-1 text-sm text-muted-foreground">Selesaikan modul sebelumnya dulu supaya urutan belajarnya tetap ringan.</p>
          <Link to="/app/materi">
            <Button className="mt-4 w-full rounded-lg gradient-primary font-bold text-primary-foreground">Lihat Urutan Materi</Button>
          </Link>
        </div>
      ) : currentLessonVideos.length ? (
        <div className="overflow-hidden rounded-3xl border border-border bg-black text-white shadow-card">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">Sub Materi</p>
            <p className="mt-1 text-sm font-bold text-white/85">{currentLessonVideos.length} video tersedia</p>
          </div>
          <div className="divide-y divide-white/10">
            {currentLessonVideos.map((video, index) => (
              <button
                key={video.id}
                type="button"
                onClick={() => openViewerFor(`${lesson.id}-video-${video.id}`)}
                className="grid w-full grid-cols-[128px_minmax(0,1fr)_24px] gap-3 p-3 text-left transition hover:bg-white/5 sm:grid-cols-[180px_minmax(0,1fr)_28px]"
              >
                <span className="relative aspect-video overflow-hidden rounded-xl bg-zinc-900">
                  <video src={assetUrl(video.url)} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 grid place-items-center bg-black/10">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white">
                      <Play className="ml-0.5 h-4 w-4 fill-white" />
                    </span>
                  </span>
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-black leading-none text-white">
                    {video.duration || lesson.duration}
                  </span>
                </span>
                <span className="min-w-0 self-start">
                  <span className="line-clamp-2 text-sm font-black leading-tight text-white">{video.title || `${index + 1}. ${lesson.title}`}</span>
                  <span className="mt-1 block truncate text-xs font-semibold text-white/55">BuatCuan · {lesson.category} · Sub materi {index + 1}</span>
                  <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-white/45">{video.description || lesson.desc}</span>
                </span>
                <span className="mt-1 text-white/55">
                  <MoreVertical className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : lesson.isLocked ? (
        <div className="glass-card rounded-3xl p-5 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Play className="h-6 w-6" />
          </div>
          <p className="text-lg font-extrabold">Video terkunci</p>
          <p className="mt-1 text-sm text-muted-foreground">Buka video ini menggunakan {lesson.pointCost} poin.</p>
          <Button onClick={() => unlock.mutate()} disabled={unlock.isPending} className="mt-4 w-full rounded-2xl gradient-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
            {unlock.isPending ? "Membuka..." : `Buka dengan ${lesson.pointCost} poin`}
          </Button>
        </div>
      ) : (
        <div className={`relative aspect-video rounded-3xl overflow-hidden bg-gradient-to-br ${lesson.thumb}`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </span>
          </div>
        </div>
      )}

      <div>
        <div className="flex gap-2 mb-2">
          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-primary/15 border border-primary/30 text-primary">{lesson.category}</span>
          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-secondary">{lesson.level}</span>
          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-secondary">{lesson.duration}</span>
        </div>
        <h1 className="text-2xl font-extrabold leading-tight">{lesson.title}</h1>
        <p className="text-muted-foreground text-sm mt-2">{lesson.desc}</p>
        {lesson.id === "f1" && (
          <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/10 p-3 text-xs font-semibold text-muted-foreground">
            Versi FREE fokus ke 2 tipe konten paling basic: Video+Teks dan Foto+Teks. Format lanjutan dibuka di PRO.
          </div>
        )}
      </div>

      {lesson.shareUrl && !membershipBlocked && (
        <div className="glass-card rounded-3xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link Video Kamu</p>
          <p className="mt-2 truncate rounded-2xl bg-secondary p-3 font-mono text-xs">{lesson.shareUrl}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Dapat {lesson.pointReward} poin dari klik unik per 24 jam.</p>
            <Button type="button" size="sm" variant="outline" onClick={copyShare} className="shrink-0 rounded-xl">Copy</Button>
          </div>
        </div>
      )}

      {lesson.pdf && (
        <div className="glass-card rounded-3xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PDF Materi</p>
              <p className="truncate text-sm font-semibold">{lesson.pdf.originalName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {lesson.pdf.requiredPlanId ? "Akses sesuai paket subscribe" : "Akses untuk akun aktif"}
              </p>
            </div>
            <Button type="button" onClick={() => openViewerFor(`${lesson.id}-pdf`)} className="shrink-0 rounded-2xl gradient-primary text-primary-foreground">
              <Download className="mr-1 h-4 w-4" /> Preview PDF
            </Button>
          </div>
        </div>
      )}

      <div className={`glass-card rounded-3xl p-5 ${membershipBlocked ? "grayscale blur-[1px]" : ""}`}>
        <p className="font-bold mb-3">Checklist Praktek</p>
        <div className="space-y-2">
          {lesson.steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/60">
              <div className="w-5 h-5 rounded-md border border-primary/40 grid place-items-center mt-0.5">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <p className="text-sm">{s}</p>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={() => void toggleProgress()}
        disabled={updatingProgress || sequentialBlocked || membershipBlocked}
        className={`w-full h-14 rounded-2xl font-bold ${done ? "bg-secondary text-foreground" : "gradient-primary text-primary-foreground shadow-glow-sm"}`}
      >
        {updatingProgress ? "Memproses..." : done ? "✓ Sudah Selesai (klik untuk batal)" : "Tandai Selesai"}
      </Button>

      {nextLesson && (
        <Link
          to={`/app/materi/${nextLesson.id}`}
          className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 transition hover:border-primary/55 hover:bg-primary/15"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <ArrowRight className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-extrabold uppercase text-primary">Materi Selanjutnya</span>
            <span className="mt-1 block truncate text-sm font-extrabold text-foreground">{nextLesson.title}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
        </Link>
      )}
      <VerticalMediaViewer open={viewerOpen} items={viewerItems} index={viewerIndex} onOpenChange={setViewerOpen} onIndexChange={setViewerIndex} />
    </div>
  );
};

function getNextLessonAfterCurrent(lessons: ReturnType<typeof sortLearningPath>, currentId: string) {
  const currentIndex = lessons.findIndex((item) => item.id === currentId);
  if (currentIndex < 0) return null;
  return lessons[currentIndex + 1] ?? null;
}

function getLessonVideos(lesson?: LessonDto | null) {
  if (!lesson) return [];
  if (lesson.videos?.length) return [...lesson.videos].sort((a, b) => a.sortOrder - b.sortOrder);
  return lesson.video ? [{
    ...lesson.video,
    title: lesson.video.title || lesson.title,
    description: lesson.video.description || lesson.desc,
    duration: lesson.video.duration || lesson.duration,
    sortOrder: lesson.video.sortOrder ?? 1,
  }] : [];
}

export default MateriDetail;
