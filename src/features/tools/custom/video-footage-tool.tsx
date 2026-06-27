import {
  BadgeInfo, BarChart3, Bookmark, Bot, CalendarDays, ClipboardCheck, ClipboardList, Copy, Crown, Eye, ExternalLink, Hash, Headphones, Heart, Image, LifeBuoy, Lightbulb, ListChecks, Lock, Megaphone, MessageCircle, MessagesSquare, Music, Play, Search, Sparkles, Trophy, Type, Utensils, Users, Video, VolumeX, Wand2, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { ManagedUsageVideoCard } from "@/components/ManagedUsageVideoCard";
import { VerticalMediaViewer, type VerticalMediaItem } from "@/components/VerticalMediaViewer";
import { Input } from "@/components/ui/input";
import { ShowMoreList } from "@/components/ShowMoreList";
import { api, assetUrl, getErrorMessage, type MemberToolItemDto } from "@/lib/api";
import { contentColorTheme } from "@/lib/content-colors";
import { orderToolItemsForCategory, slugify } from "../utils";
type VideoMetadata = {
  access?: "FREE" | "PRO";
  resolution?: string;
  duration?: string;
  durationSeconds?: number;
  noAudio?: boolean;
  badge?: string;
  gradient?: string;
};

const videoCategoryTabs = [
  { key: "Terbaru", label: "Terbaru", access: "FREE" },
  { key: "Jalanan", label: "Jalanan", access: "FREE" },
  { key: "Pagi Hari", label: "Pagi Hari", access: "FREE" },
  { key: "Malam Hari", label: "Malam Hari", access: "PRO" },
  { key: "Sore Hari", label: "Sore Hari", access: "PRO" },
  { key: "Drone View", label: "Drone View", access: "PRO" },
  { key: "Alam & Pantai", label: "Alam & Pantai", access: "PRO" },
  { key: "Hujan", label: "Hujan", access: "PRO" },
  { key: "Kafe & Indoor", label: "Kafe & Indoor", access: "PRO" },
  { key: "Motivasi", label: "Motivasi", access: "PRO" },
  { key: "Produk & Detail", label: "Produk & Detail", access: "PRO" },
] as const;

const VideoFootageTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("Terbaru");
  const [categoryShuffleSeed, setCategoryShuffleSeed] = useState(() => Math.random());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["tool", slug, "video-footage"],
    queryFn: () => api.tools.detail(slug, { category: "ALL" }),
  });

  const tool = data?.tool;
  const theme = contentColorTheme(tool?.colorGradient);
  const isFreeMember = Boolean(tool?.freeDailyLimit);
  const limit = tool?.freeDailyLimit ?? null;
  const remaining = tool?.freeDailyRemaining ?? limit;
  const used = tool?.freeDailyUsed ?? (limit && typeof remaining === "number" ? Math.max(0, limit - remaining) : 0);
  const usagePercent = limit ? Math.min(100, Math.max(0, Math.round(((remaining ?? 0) / limit) * 100))) : 100;
  const accessibleItems = useMemo(
    () => (data?.items ?? []).filter((item) => !isFreeMember || videoAccess(item) !== "PRO"),
    [data?.items, isFreeMember],
  );
  const visibleItems = useMemo(() => {
    const source = activeCategory === "Terbaru"
      ? accessibleItems
      : accessibleItems.filter((item) => item.category === activeCategory || item.theme === activeCategory);
    return orderToolItemsForCategory(source, activeCategory, categoryShuffleSeed);
  }, [accessibleItems, activeCategory, categoryShuffleSeed]);
  const downloadToolItem = async (item: MemberToolItemDto) => {
    if (!item.mediaUrl && item.sourceUrl) {
      window.open(item.sourceUrl, "_blank", "noopener,noreferrer");
      toast.info("File original belum diupload di admin. Dibuka ke sumber referensi.");
      return;
    }
    if (!item.mediaUrl) {
      toast.error("File video original belum tersedia");
      return;
    }
    try {
      const blob = await api.tools.downloadItem(slug, item.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = item.mediaOriginalName || `${slugify(item.title)}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Unduhan dimulai");
      void queryClient.invalidateQueries({ queryKey: ["tool", slug, "video-footage"] });
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal mengunduh video"));
    }
  };
  const canOpenVideo = (item: MemberToolItemDto) => Boolean(item.mediaUrl);
  const viewerItems = useMemo<VerticalMediaItem[]>(() => visibleItems.filter(canOpenVideo).map((item) => {
    const metadata = videoMetadata(item);
    return {
      id: item.id,
      type: "video",
      title: item.title,
      subtitle: `${metadata.resolution ?? "1080p"} · ${metadata.duration ?? `${metadata.durationSeconds ?? 15} detik`}`,
      description: item.content,
      url: item.mediaUrl,
      downloadName: item.mediaOriginalName || `${slugify(item.title)}.mp4`,
      downloadLabel: "Video",
      onDownload: () => downloadToolItem(item),
      terms: [
        "Video hanya boleh digunakan oleh member aktif BuatCuan.",
        "Video wajib diedit sebelum diunggah ke media sosial.",
        "Dilarang menyebarkan, menjual, atau membagikan file mentah.",
      ],
    };
  }), [slug, visibleItems]);
  const openViewerFor = (item: MemberToolItemDto) => {
    if (!canOpenVideo(item)) return;
    setSelectedId(item.id);
    const nextIndex = viewerItems.findIndex((viewerItem) => viewerItem.id === item.id);
    if (nextIndex < 0) return;
    setViewerIndex(nextIndex);
    setViewerOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Bahan Video</h1>
          <div className="flex justify-end">
            <span className="rounded-full border px-3 py-1.5 text-xs font-extrabold" style={{ borderColor: theme.border, background: theme.iconBg, color: theme.text }}>
              {limit ? `${remaining ?? 0}/${limit} sisa` : "Tanpa batas"}
            </span>
          </div>
        </div>
      </div>

      <UsageVideoCard />
      <VideoTermsCard theme={theme} />
      <UsageLimitBar limit={limit} remaining={remaining} used={used} percent={usagePercent} theme={theme} />

      <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar">
        <div className="flex w-max gap-2">
          {videoCategoryTabs.map((tab) => {
            const locked = isFreeMember && tab.access === "PRO";
            const active = activeCategory === tab.key;
            if (locked) {
              return (
                <Link
                  key={tab.key}
                  to="/app/payment"
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border bg-card px-4 text-xs font-extrabold"
                  style={{ borderColor: theme.border, color: theme.text }}
                >
                  <Lock className="h-3 w-3" />
                  {tab.label}
                </Link>
              );
            }
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveCategory(tab.key);
                  setCategoryShuffleSeed(Math.random());
                }}
                className="h-10 shrink-0 rounded-full border bg-card px-5 text-xs font-extrabold text-muted-foreground transition-colors hover:text-foreground"
                style={active ? { borderColor: theme.accent, background: theme.gradient, color: "#fff" } : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Video {activeCategory}</h2>
          <p className="text-xs font-semibold text-muted-foreground">{visibleItems.length} video tersedia</p>
        </div>
        {isLoading && <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">Memuat video...</div>}
        {!isLoading && visibleItems.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">Belum ada video di kategori ini.</div>
        )}
        <ShowMoreList
          key={`videos-${activeCategory}-${categoryShuffleSeed}`}
          items={visibleItems}
          initial={4}
          step={4}
          className="grid grid-cols-2 gap-3"
          buttonClassName="col-span-2 h-11 rounded-2xl border-border bg-secondary font-extrabold"
          renderItem={(item) => (
            <VideoFootageCard
              key={item.id}
              item={item}
              active={selectedId === item.id}
              onClick={item.mediaUrl ? () => openViewerFor(item) : undefined}
              theme={theme}
            />
          )}
        />
      </section>

      {isFreeMember && (
        <Link to="/app/payment" className="flex items-center gap-3 rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg, color: theme.text }}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: theme.iconBg }}>
            <Lock className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold">Buka 8 Kategori Lainnya</span>
            <span className="mt-0.5 block text-xs font-semibold text-muted-foreground">Malam, Drone, Alam, Hujan, Kafe + unduhan tanpa batas</span>
          </span>
          <ExternalLink className="h-4 w-4 shrink-0" />
        </Link>
      )}
      <VerticalMediaViewer open={viewerOpen} items={viewerItems} index={viewerIndex} onOpenChange={setViewerOpen} onIndexChange={setViewerIndex} />
    </div>
  );
};

function UsageVideoCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app/tools/video-footage"
      className="border-primary/20"
      fallback={{
        title: "Cara Pakai Bahan Video BuatCuan",
        subtitle: "Tonton dulu sebelum download",
        durationLabel: "2 menit",
        thumbnailGradient: "from-sky-950 via-emerald-950 to-zinc-950",
      }}
    />
  );
}

function VideoTermsCard({ theme }: { theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg }}>
      <div className="mb-3 flex items-center gap-2" style={{ color: theme.text }}>
        <Lock className="h-4 w-4" />
        <h2 className="font-extrabold">Syarat & Ketentuan Penggunaan</h2>
      </div>
      <ul className="space-y-2 text-sm font-semibold leading-relaxed text-muted-foreground">
        <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />Video adalah milik BuatCuan dan hanya boleh digunakan oleh member aktif BuatCuan</li>
        <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />Video hanya sebagai bahan, wajib diedit dahulu sebelum diunggah ke media sosial</li>
        <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />Dilarang menyebarkan, menjual, atau membagikan video ke pihak luar</li>
        <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />Pelanggaran dapat menyebabkan akun dinonaktifkan</li>
      </ul>
    </section>
  );
}

function UsageLimitBar({ limit, remaining, used, percent, theme }: { limit: number | null; remaining?: number | null; used: number; percent: number; theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <section className="rounded-2xl border bg-card p-4" style={{ borderColor: theme.border }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">Sisa unduhan hari ini</p>
        <p className="text-sm font-extrabold" style={{ color: theme.text }}>{limit ? `${remaining ?? 0} dari ${limit}` : "Tanpa batas"}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: theme.progressTrack }}>
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: theme.gradient }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">
        Reset setiap hari pukul 00.00 · {limit ? `${used} sudah dipakai` : <span className="text-accent">PRO member: Tanpa batas</span>}
      </p>
    </section>
  );
}

function VideoFootageCard({ item, active, onClick, theme }: { item: MemberToolItemDto; active: boolean; onClick?: () => void; theme: ReturnType<typeof contentColorTheme> }) {
  const metadata = videoMetadata(item);
  const canOpen = Boolean(item.mediaUrl && onClick);
  const className = "group overflow-hidden rounded-2xl border bg-card text-left transition";
  const style = active ? { borderColor: theme.border, boxShadow: theme.shadow } : undefined;
  const content = (
    <>
      <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${metadata.gradient ?? "from-emerald-950 via-zinc-950 to-black"}`}>
        {item.mediaUrl ? (
          <video
            src={assetUrl(item.mediaUrl)}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full bg-black object-cover"
          />
        ) : null}
        {item.mediaUrl ? <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" /> : null}
        {metadata.badge && (
          <span className="absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-extrabold text-white" style={{ background: theme.gradient }}>{metadata.badge}</span>
        )}
        <div className={`absolute inset-0 z-20 grid place-items-center bg-black/15 ${item.mediaUrl ? "opacity-0 transition-opacity group-hover:opacity-100" : ""}`}>
          <span className="grid h-12 w-12 place-items-center rounded-full border border-white/35 bg-white/15 text-white backdrop-blur">
            {item.mediaUrl ? <Play className="ml-0.5 h-4 w-4 fill-current" /> : <Video className="h-4 w-4" />}
          </span>
        </div>
        <span className="absolute bottom-2 right-2 rounded-md bg-black/65 px-2 py-1 text-[11px] font-bold text-white">
          {metadata.durationSeconds ? `0:${String(metadata.durationSeconds).padStart(2, "0")}` : metadata.duration ?? "0:15"}
        </span>
      </div>
      <div className="p-3">
        <p className="line-clamp-1 text-sm font-extrabold">{item.title}</p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">
          <VolumeX className="mr-1 inline h-3 w-3" />
          {metadata.resolution ?? "1080p"} · {metadata.duration ?? "15 detik"}
        </p>
      </div>
    </>
  );
  if (!canOpen) return <div className={className} style={style}>{content}</div>;
  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {content}
    </button>
  );
}

function videoMetadata(item: MemberToolItemDto): VideoMetadata {
  return (item.metadata ?? {}) as VideoMetadata;
}

function videoAccess(item: MemberToolItemDto) {
  return videoMetadata(item).access === "PRO" ? "PRO" : "FREE";
}

export { VideoFootageTool };

