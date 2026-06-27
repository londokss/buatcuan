import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Play, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, assetUrl, type UsageVideoDto } from "@/lib/api";
import { VerticalMediaViewer, type VerticalMediaItem } from "@/components/VerticalMediaViewer";
import { cn } from "@/lib/utils";

export type UsageVideoFallback = {
  label?: string;
  title: string;
  subtitle: string;
  durationLabel?: string;
  thumbnailGradient?: string;
  videoUrl?: string | null;
  ctaLabel?: string;
  ctaUrl?: string;
};

type ManagedUsageVideoCardProps = {
  targetPath: string;
  fallback: UsageVideoFallback;
  className?: string;
  accentClassName?: string;
};

export function ManagedUsageVideoCard({ targetPath, fallback, className, accentClassName = "text-primary border-primary/50 bg-primary/15" }: ManagedUsageVideoCardProps) {
  const { data } = useQuery({
    queryKey: ["usage-videos", targetPath],
    queryFn: () => api.usageVideos(targetPath),
    staleTime: 60_000,
  });

  const video = data?.items[0];
  const content: UsageVideoFallback & Partial<UsageVideoDto> = video ?? fallback;
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const viewerItems = useMemo<VerticalMediaItem[]>(() => {
    const source = data?.items.length ? data.items : content.videoUrl ? [content] : [];
    return source
      .filter((item) => item.videoUrl)
      .map((item, itemIndex) => ({
        id: item.id ?? `${targetPath}-${itemIndex}`,
        type: "video" as const,
        title: item.title,
        subtitle: item.subtitle,
        description: item.durationLabel,
        url: item.videoUrl,
        downloadName: fileNameFromUrl(item.videoUrl) || `${item.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "video-cara-pakai"}.mp4`,
        downloadLabel: "Download",
        ctaLabel: item.ctaLabel ?? undefined,
        ctaUrl: item.ctaUrl ?? undefined,
        terms: [
          "Video cara pakai hanya untuk panduan penggunaan platform.",
          "Jangan sebarkan file mentah ke luar member BuatCuan.",
          "Ikuti instruksi di video sebelum memakai fitur.",
        ],
      }));
  }, [content, data?.items, targetPath]);
  const canOpenViewer = viewerItems.length > 0;
  const previewVideoUrl = content.videoUrl ? assetUrl(content.videoUrl) : "";
  const openViewer = () => {
    if (!canOpenViewer) return;
    setViewerIndex(0);
    setViewerOpen(true);
  };

  if (data?.hasConfigured && data.items.length === 0) return null;

  return (
    <section className={cn("relative overflow-hidden rounded-2xl border border-border bg-card", className)}>
      {canOpenViewer ? (
        <div className={cn("relative block aspect-[16/7] min-h-[150px] w-full overflow-hidden bg-gradient-to-br text-left", content.thumbnailGradient ?? fallback.thumbnailGradient ?? "from-emerald-950 via-slate-950 to-zinc-950")}>
          {previewVideoUrl ? <video src={previewVideoUrl} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 bg-black/25" />
          <span className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">{content.label ?? "Cara Pakai"}</span>
          <button
            type="button"
            onClick={openViewer}
            className="absolute inset-0 z-20 grid place-items-center"
            aria-label={`Putar ${content.title}`}
          >
            <span className={cn("grid h-16 w-16 place-items-center rounded-full border backdrop-blur transition hover:scale-105", accentClassName)}>
              <Play className="ml-1 h-6 w-6 fill-current" />
            </span>
          </button>
        </div>
      ) : (
        <div className={cn("relative block aspect-[16/7] min-h-[150px] w-full overflow-hidden bg-gradient-to-br text-left", content.thumbnailGradient ?? fallback.thumbnailGradient ?? "from-emerald-950 via-slate-950 to-zinc-950")}>
          <span className="absolute left-4 top-4 z-10 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">{content.label ?? "Cara Pakai"}</span>
          <div className="absolute inset-0 grid place-items-center">
            <span className={cn("grid h-14 w-14 place-items-center rounded-full border", accentClassName)}>
              <Video className="h-5 w-5" />
            </span>
          </div>
        </div>
      )}
      <div className="space-y-3 p-4">
        <div>
          <p className="font-extrabold">{content.title}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {content.subtitle} · {content.durationLabel ?? "2 menit"}
          </p>
        </div>
        {content.ctaLabel && content.ctaUrl ? (
          <Link to={content.ctaUrl} className="inline-flex h-10 items-center rounded-xl border border-border px-3 text-xs font-extrabold hover:bg-secondary">
            {content.ctaLabel}
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <VerticalMediaViewer open={viewerOpen} items={viewerItems} index={viewerIndex} onOpenChange={setViewerOpen} onIndexChange={setViewerIndex} />
    </section>
  );
}

function fileNameFromUrl(url?: string | null) {
  if (!url) return "";
  try {
    const pathname = /^https?:\/\//i.test(url) ? new URL(url).pathname : url;
    return decodeURIComponent(pathname.split("/").filter(Boolean).pop() ?? "");
  } catch {
    return url.split("/").filter(Boolean).pop() ?? "";
  }
}
