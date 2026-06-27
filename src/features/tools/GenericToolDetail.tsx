import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, ExternalLink, Hash, Image, Lightbulb, Lock, MessageCircle, Play, Save, Search, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { ManagedUsageVideoCard } from "@/components/ManagedUsageVideoCard";
import { VerticalMediaViewer, type VerticalMediaItem } from "@/components/VerticalMediaViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShowMoreList } from "@/components/ShowMoreList";
import { api, assetUrl, getErrorMessage, type MemberToolItemDto } from "@/lib/api";
import { gradientBackground } from "@/lib/content-colors";
import { toolIcons } from "./tool-icons";
import { orderToolItemsForCategory, withAll } from "./utils";
export const GenericToolDetail = ({ slug }: { slug: string }) => {
  const [category, setCategory] = useState("ALL");
  const [categoryShuffleSeed, setCategoryShuffleSeed] = useState(() => Math.random());
  const [niche, setNiche] = useState("ALL");
  const [theme, setTheme] = useState("ALL");
  const [q, setQ] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["tool", slug, category, niche, theme, q],
    queryFn: () => api.tools.detail(slug, { category, niche, theme, q }),
  });

  const categories = useMemo(() => withAll(data?.filters.categories ?? []), [data?.filters.categories]);
  const niches = useMemo(() => withAll(data?.filters.niches ?? []), [data?.filters.niches]);
  const themes = useMemo(() => withAll(data?.filters.themes ?? []), [data?.filters.themes]);
  const visibleItems = useMemo(
    () => orderToolItemsForCategory(data?.items ?? [], category, categoryShuffleSeed),
    [data?.items, category, categoryShuffleSeed],
  );
  const Icon = data?.tool ? toolIcons[data.tool.icon as keyof typeof toolIcons] ?? Lightbulb : Lightbulb;
  const locked = Boolean(data?.tool.isLocked);

  const copyItem = async (item: MemberToolItemDto) => {
    await navigator.clipboard.writeText([
      item.openingHook ? `Hook: ${item.openingHook}` : null,
      `Judul: ${item.title}`,
      `Isi: ${item.content}`,
      item.caption ? `Caption: ${item.caption}` : null,
      item.hashtags ? `Hashtag: ${item.hashtags}` : null,
      item.sourceUrl ? `Referensi: ${item.sourceUrl}` : null,
    ].filter(Boolean).join("\n\n"));
    toast.success("Konten tools disalin");
  };
  const saveItem = async (item: MemberToolItemDto) => {
    try {
      await api.creatorNotes.create({
        title: item.title,
        content: textContentFromItem(item),
        sourceToolSlug: slug,
        sourceItemId: item.id,
        sourceLabel: data?.tool.name ?? "Tools",
        icon: data?.tool.icon ?? "FileText",
        accent: "emerald",
      });
      toast.success("Disimpan ke Catatan Kreator");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal menyimpan ke Catatan Kreator"));
    }
  };
  const downloadMediaItem = async (item: MemberToolItemDto) => {
    try {
      const blob = await api.tools.downloadItem(slug, item.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = item.mediaOriginalName || item.title;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Unduhan dimulai");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal mengunduh file"));
    }
  };
  const mediaItems = useMemo<VerticalMediaItem[]>(() => {
    const contentType = data?.tool.contentType;
    if (contentType !== "VIDEO" && contentType !== "IMAGE") return [];
    return visibleItems
      .filter((item) => item.mediaUrl)
      .map((item) => ({
        id: item.id,
        type: contentType === "VIDEO" ? "video" : "image",
        title: item.title,
        subtitle: [item.category, item.niche, item.theme].filter(Boolean).join(" · "),
        description: item.content,
        url: item.mediaUrl,
        downloadName: item.mediaOriginalName || item.title,
        downloadLabel: contentType === "VIDEO" ? "Video" : "Foto",
        onDownload: () => downloadMediaItem(item),
      }));
  }, [data?.tool.contentType, slug, visibleItems]);
  const openMediaViewer = (item: MemberToolItemDto) => {
    const nextIndex = mediaItems.findIndex((mediaItem) => mediaItem.id === item.id);
    if (nextIndex < 0) return;
    setViewerIndex(nextIndex);
    setViewerOpen(true);
  };

  return (
    <div className="space-y-5">
      <div>
        <BackButton to="/app/tools" label="Semua tools" />
        <div className="mt-3 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl" style={gradientBackground(data?.tool.colorGradient)}>
            <Icon className="h-5 w-5 text-white" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold leading-tight">{data?.tool.name ?? "Tools"}</h1>
            <p className="text-sm text-muted-foreground">{data?.tool.description ?? "Memuat tools..."}</p>
            {data?.tool.freeDailyLimit && (
              <p className="mt-1 text-xs font-bold text-primary">
                Akses FREE: {data.tool.freeDailyRemaining ?? data.tool.freeDailyLimit}/{data.tool.freeDailyLimit} hari ini
              </p>
            )}
          </div>
        </div>
      </div>

      {locked && (
        <div className="rounded-3xl border border-primary/25 bg-card/85 p-5 text-center shadow-card">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <p className="text-lg font-extrabold">Tools PRO terkunci</p>
          <p className="mt-1 text-sm text-muted-foreground">Upgrade untuk akses script, footage, caption, hook, dan template premium.</p>
          <Link to="/app/payment">
            <Button className="mt-4 w-full rounded-2xl gradient-primary font-bold text-primary-foreground">Upgrade</Button>
          </Link>
        </div>
      )}

      {!locked && data?.tool && (
        <ManagedUsageVideoCard
          targetPath={`/app/tools/${slug}`}
          className="border-primary/20"
          fallback={{
            title: `Cara Pakai ${data.tool.name}`,
            subtitle: "Tonton panduan singkat sebelum memakai alat bantu ini",
            durationLabel: "2 menit",
            thumbnailGradient: "from-emerald-950 via-zinc-950 to-sky-950",
          }}
        />
      )}

      <div className={`glass-card rounded-3xl p-4 space-y-3 ${locked ? "pointer-events-none grayscale blur-[1px]" : ""}`}>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Cari judul, isi, caption..." className="h-11 rounded-2xl bg-secondary pl-9" />
        </div>
        <FilterRow
          label="Kategori"
          value={category}
          values={categories}
          onChange={(nextCategory) => {
            setCategory(nextCategory);
            setCategoryShuffleSeed(Math.random());
          }}
        />
        <FilterRow label="Niche" value={niche} values={niches} onChange={setNiche} />
        <FilterRow label="Tema" value={theme} values={themes} onChange={setTheme} />
      </div>

      {isLoading && <div className="glass-card rounded-3xl p-5 text-sm text-muted-foreground">Memuat data tools...</div>}

      {!locked && <ShowMoreList
        key={`items-${category}-${categoryShuffleSeed}`}
        items={visibleItems}
        initial={6}
        step={6}
        className="space-y-3"
        empty={!isLoading ? <div className="glass-card rounded-3xl p-5 text-sm text-muted-foreground">Belum ada data yang cocok.</div> : null}
        renderItem={(item) => (
          <div key={item.id} className="glass-card rounded-3xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  {[item.category, item.niche, item.theme].filter(Boolean).map((label) => (
                    <span key={label} className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold text-muted-foreground">{label}</span>
                  ))}
                </div>
                <h2 className="mt-3 text-lg font-extrabold leading-tight">{item.title}</h2>
              </div>
              <div className="flex shrink-0 gap-2">
                {data?.tool.contentType === "TEXT" && (
                  <Button type="button" size="sm" variant="outline" onClick={() => void saveItem(item)} className="h-9 w-9 p-0" title="Simpan ke Catatan Kreator" aria-label="Simpan ke Catatan Kreator">
                    <Save className="h-4 w-4" />
                  </Button>
                )}
                <Button type="button" size="sm" variant="outline" onClick={() => copyItem(item)} className="h-9 w-9 p-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {item.mediaUrl && data?.tool.contentType === "VIDEO" && (
              <button type="button" onClick={() => openMediaViewer(item)} className="relative mt-4 block aspect-[9/16] max-h-[620px] w-full overflow-hidden rounded-2xl bg-black sm:mx-auto sm:max-w-sm" aria-label={`Buka preview ${item.title}`}>
                <video src={assetUrl(item.mediaUrl)} muted playsInline preload="metadata" className="h-full w-full object-contain" />
                <span className="absolute inset-0 z-20 grid place-items-center bg-black/25 text-white">
                  <span className="grid h-16 w-16 place-items-center rounded-full border border-white/35 bg-white/15 backdrop-blur">
                    <Play className="ml-1 h-7 w-7 fill-current" />
                  </span>
                </span>
              </button>
            )}
            {item.mediaUrl && data?.tool.contentType === "IMAGE" && (
              <button type="button" onClick={() => openMediaViewer(item)} className="relative mt-4 block max-h-[620px] w-full overflow-hidden rounded-2xl bg-black sm:mx-auto sm:max-w-sm" aria-label={`Buka preview ${item.title}`}>
                <img src={assetUrl(item.mediaUrl)} alt={item.title} className="aspect-[9/16] w-full object-contain" />
                <span className="absolute bottom-3 right-3 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/45 text-white backdrop-blur">
                  <Image className="h-5 w-5" />
                </span>
              </button>
            )}
            {item.openingHook && <Block icon={Lightbulb} label="Hook" text={item.openingHook} primary />}
            <Block icon={Sparkles} label="Isi" text={item.content} />
            {item.caption && <Block icon={MessageCircle} label="Caption" text={item.caption} />}
            {item.hashtags && <Block icon={Hash} label="Hashtag" text={item.hashtags} mono />}
            {item.sourceUrl && (
              <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Buka referensi <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
      />}
      <VerticalMediaViewer open={viewerOpen} items={mediaItems} index={viewerIndex} onOpenChange={setViewerOpen} onIndexChange={setViewerIndex} />
    </div>
  );
};

const FilterRow = ({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) => (
  <div>
    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    <div className="flex gap-2 overflow-x-auto pb-1">
      {values.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            value === item ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {item === "ALL" ? "Semua" : item}
        </button>
      ))}
    </div>
  </div>
);

function textContentFromItem(item: MemberToolItemDto) {
  return [
    item.openingHook ? `Hook: ${item.openingHook}` : null,
    `Isi: ${item.content}`,
    item.caption ? `Caption: ${item.caption}` : null,
    item.hashtags ? `Hashtag: ${item.hashtags}` : null,
    item.sourceUrl ? `Referensi: ${item.sourceUrl}` : null,
  ].filter(Boolean).join("\n\n");
}

const Block = ({ icon: Icon, label, text, mono = false, primary = false }: { icon: typeof Sparkles; label: string; text: string; mono?: boolean; primary?: boolean }) => (
  <div className={`mt-3 rounded-2xl p-3 ${primary ? "border border-primary/20 bg-primary/10" : "bg-secondary/60"}`}>
    <div className={`mb-1 flex items-center gap-2 ${primary ? "text-primary" : "text-muted-foreground"}`}>
      <Icon className="h-4 w-4" />
      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
    </div>
    <p className={`whitespace-pre-line leading-relaxed ${mono ? "font-mono text-xs" : "text-sm"}`}>{text}</p>
  </div>
);
