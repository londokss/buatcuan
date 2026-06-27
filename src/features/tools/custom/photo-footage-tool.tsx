import { ExternalLink, Image, Lock } from "lucide-react";
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
type PhotoMetadata = {
  access?: "FREE" | "PRO";
  resolution?: string;
  dimensions?: string;
  orientation?: string;
  aiGenerated?: boolean;
  badge?: string;
  gradient?: string;
};

const photoCategoryTabs = [
  { key: "Terbaru", label: "Terbaru", access: "FREE" },
  { key: "Jalanan", label: "Jalanan", access: "FREE" },
  { key: "Pagi Hari", label: "Pagi Hari", access: "FREE" },
  { key: "Motivasi", label: "Motivasi", access: "FREE" },
  { key: "Malam", label: "Malam", access: "PRO" },
  { key: "Sore", label: "Sore", access: "PRO" },
  { key: "Alam & Pantai", label: "Alam & Pantai", access: "PRO" },
  { key: "Makanan", label: "Makanan", access: "PRO" },
  { key: "Kafe & Indoor", label: "Kafe & Indoor", access: "PRO" },
  { key: "Hujan", label: "Hujan", access: "PRO" },
  { key: "Quotes", label: "Quotes", access: "PRO" },
  { key: "Aesthetic", label: "Aesthetic", access: "PRO" },
] as const;

const PhotoFootageTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("Terbaru");
  const [categoryShuffleSeed, setCategoryShuffleSeed] = useState(() => Math.random());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["tool", slug, "foto-footage"],
    queryFn: () => api.tools.detail(slug, { category: "ALL" }),
  });

  const tool = data?.tool;
  const theme = contentColorTheme(tool?.colorGradient);
  const isFreeAccess = Boolean(tool?.freeDailyLimit);
  const limit = tool?.freeDailyLimit ?? null;
  const remaining = tool?.freeDailyRemaining ?? limit;
  const used = tool?.freeDailyUsed ?? (limit && typeof remaining === "number" ? Math.max(0, limit - remaining) : 0);
  const usagePercent = limit ? Math.min(100, Math.max(0, Math.round(((remaining ?? 0) / limit) * 100))) : 100;
  const allItems = useMemo(() => data?.items ?? [], [data?.items]);
  const visibleItems = useMemo(() => {
    const source = activeCategory === "Terbaru"
      ? allItems
      : allItems.filter((item) => item.category === activeCategory || item.theme === activeCategory);
    return orderToolItemsForCategory(source, activeCategory, categoryShuffleSeed);
  }, [activeCategory, allItems, categoryShuffleSeed]);
  const canAccessPhoto = (item: MemberToolItemDto) => !isFreeAccess || photoAccess(item) !== "PRO";
  const canOpenPhoto = (item: MemberToolItemDto) => canAccessPhoto(item) && Boolean(item.mediaUrl);

  const downloadToolItem = async (item: MemberToolItemDto) => {
    if (!item.mediaUrl && item.sourceUrl) {
      window.open(item.sourceUrl, "_blank", "noopener,noreferrer");
      toast.info("File original belum diupload di admin. Dibuka ke sumber referensi.");
      return;
    }
    if (!item.mediaUrl) {
      toast.error("File foto original belum tersedia");
      return;
    }
    try {
      const blob = await api.tools.downloadItem(slug, item.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = item.mediaOriginalName || `${slugify(item.title)}.jpg`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Unduhan dimulai");
      void queryClient.invalidateQueries({ queryKey: ["tool", slug, "foto-footage"] });
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal mengunduh foto"));
    }
  };
  const viewerItems = useMemo<VerticalMediaItem[]>(() => visibleItems.filter(canOpenPhoto).map((item) => {
    const metadata = photoMetadata(item);
    return {
      id: item.id,
      type: "image",
      title: item.title,
      subtitle: `${metadata.resolution ?? "4K"} · ${metadata.orientation ?? "Landscape"}`,
      description: item.content,
      url: item.mediaUrl,
      downloadName: item.mediaOriginalName || `${slugify(item.title)}.jpg`,
      downloadLabel: "Foto",
      onDownload: () => downloadToolItem(item),
      terms: [
        "Foto hanya boleh digunakan oleh member aktif BuatCuan.",
        "Foto wajib diberi teks/edit sebelum diunggah.",
        "Dilarang menyebarkan atau membagikan file mentah.",
      ],
    };
  }), [isFreeAccess, slug, visibleItems]);
  const openViewerFor = (item: MemberToolItemDto) => {
    if (!canOpenPhoto(item)) return;
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
          <h1 className="text-lg font-extrabold">Bahan Foto</h1>
          <div className="flex justify-end">
            <span className="rounded-full border px-3 py-1.5 text-xs font-extrabold leading-tight" style={{ borderColor: theme.border, background: theme.iconBg, color: theme.text }}>
              {limit ? `${remaining ?? 0}/${limit} sisa` : "Tanpa batas"}
            </span>
          </div>
        </div>
      </div>

      <UsagePhotoCard />
      <PhotoTermsCard theme={theme} />
      <PhotoUsageLimitBar limit={limit} remaining={remaining} used={used} percent={usagePercent} theme={theme} />

      <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar">
        <div className="flex w-max gap-2">
          {photoCategoryTabs.map((tab) => {
            const locked = isFreeAccess && tab.access === "PRO";
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
          <h2 className="font-extrabold">Foto {activeCategory} · AI Quality</h2>
          <p className="text-xs font-semibold text-muted-foreground">{visibleItems.length} foto tersedia</p>
        </div>
        {isLoading && <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">Memuat foto...</div>}
        {!isLoading && visibleItems.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">Belum ada foto di kategori ini.</div>
        )}
        <ShowMoreList
          key={`photos-${activeCategory}-${categoryShuffleSeed}`}
          items={visibleItems}
          initial={9}
          step={6}
          className="grid grid-cols-3 gap-2.5"
          buttonClassName="col-span-3 h-11 rounded-2xl border-border bg-secondary font-extrabold"
          renderItem={(item) => (
            <PhotoFootageCard
              key={item.id}
              item={item}
              active={selectedId === item.id}
              locked={isFreeAccess && photoAccess(item) === "PRO"}
              onClick={item.mediaUrl ? () => openViewerFor(item) : undefined}
              theme={theme}
            />
          )}
        />
      </section>

      {isFreeAccess && (
        <Link to="/app/payment" className="flex items-center gap-3 rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg, color: theme.text }}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: theme.iconBg }}>
            <Lock className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold">Buka 8 Kategori Foto Lainnya</span>
            <span className="mt-0.5 block text-xs font-semibold text-muted-foreground">Makanan, Aesthetic, Quotes, Alam + unduhan tanpa batas</span>
          </span>
          <ExternalLink className="h-4 w-4 shrink-0" />
        </Link>
      )}
      <VerticalMediaViewer open={viewerOpen} items={viewerItems} index={viewerIndex} onOpenChange={setViewerOpen} onIndexChange={setViewerIndex} />
    </div>
  );
};

function UsagePhotoCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app/tools/foto-footage"
      className="border-accent/20"
      accentClassName="border-accent/50 bg-accent/15 text-accent"
      fallback={{
        title: "Cara Pakai Bahan Foto BuatCuan",
        subtitle: "Tonton dulu sebelum unduh",
        durationLabel: "2 menit",
        thumbnailGradient: "from-violet-950 via-slate-950 to-sky-950",
      }}
    />
  );
}

function PhotoTermsCard({ theme }: { theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg }}>
      <div className="mb-3 flex items-center gap-2" style={{ color: theme.text }}>
        <Lock className="h-4 w-4" />
        <h2 className="font-extrabold">Syarat & Ketentuan Penggunaan</h2>
      </div>
      <ul className="space-y-2 text-sm font-semibold leading-relaxed text-muted-foreground">
        <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />Foto adalah milik BuatCuan dan hanya boleh digunakan oleh member aktif</li>
        <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />Foto hanya sebagai bahan, wajib ditambahkan teks/edit sebelum diunggah</li>
        <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />Dilarang menyebarkan atau membagikan foto ke pihak luar</li>
        <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />Pelanggaran dapat menyebabkan akun dinonaktifkan</li>
      </ul>
    </section>
  );
}

function PhotoUsageLimitBar({ limit, remaining, used, percent, theme }: { limit: number | null; remaining?: number | null; used: number; percent: number; theme: ReturnType<typeof contentColorTheme> }) {
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

function PhotoFootageCard({ item, active, locked, onClick, theme }: { item: MemberToolItemDto; active: boolean; locked: boolean; onClick?: () => void; theme: ReturnType<typeof contentColorTheme> }) {
  const metadata = photoMetadata(item);
  const canOpen = Boolean(item.mediaUrl && !locked && onClick);
  const content = (
    <div className={`relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br ${metadata.gradient ?? "from-sky-950 via-zinc-950 to-black"} ${locked ? "opacity-55" : ""}`}>
      {item.mediaUrl && !locked ? (
        <img src={assetUrl(item.mediaUrl)} alt={item.title} className="h-full w-full bg-black object-cover" />
      ) : null}
      {item.mediaUrl && !locked ? <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" /> : null}
      {locked ? (
        <div className="absolute inset-0 grid place-items-center" style={{ color: theme.text }}>
          <span className="text-center text-[11px] font-black">
            <Lock className="mx-auto mb-1 h-4 w-4" />
            PRO
          </span>
        </div>
      ) : (
        <>
          {metadata.badge && (
            <span className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[9px] font-extrabold text-white" style={{ background: theme.gradient }}>{metadata.badge}</span>
          )}
          <span className="absolute bottom-2 left-2 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-black text-white">{metadata.resolution ?? "4K"}</span>
          <span className="absolute bottom-2 right-2 z-20 grid h-7 w-7 place-items-center rounded-full bg-white/15 text-white backdrop-blur">
            <Image className="h-3.5 w-3.5" />
          </span>
        </>
      )}
    </div>
  );

  if (locked) return <Link to="/app/payment">{content}</Link>;
  if (!canOpen) return <div className="block rounded-xl text-left transition" style={active ? { boxShadow: `0 0 0 2px ${theme.border}` } : undefined}>{content}</div>;
  return (
    <button type="button" onClick={onClick} className="block w-full cursor-pointer rounded-xl text-left transition hover:scale-[0.98]" style={active ? { boxShadow: `0 0 0 2px ${theme.border}` } : undefined} aria-label={`Buka preview ${item.title}`}>
      {content}
    </button>
  );
}

function photoMetadata(item: MemberToolItemDto): PhotoMetadata {
  return (item.metadata ?? {}) as PhotoMetadata;
}

function photoAccess(item: MemberToolItemDto) {
  return photoMetadata(item).access === "PRO" ? "PRO" : "FREE";
}

export { PhotoFootageTool };

