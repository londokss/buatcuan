import { useEffect, useMemo, useRef, useState, type MouseEvent, type MutableRefObject, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Gauge, Pause, Play, RotateCcw, RotateCw, ShieldAlert, Volume2, VolumeX, X } from "lucide-react";
import { assetUrl, authStorage } from "@/lib/api";
import { cn } from "@/lib/utils";

export type VerticalMediaItem = {
  id: string;
  type: "video" | "image" | "pdf";
  title: string;
  subtitle?: string;
  description?: string;
  url?: string | null;
  downloadName?: string | null;
  downloadLabel?: string;
  terms?: string[];
  onDownload?: () => Promise<void> | void;
  ctaLabel?: string;
  ctaUrl?: string | null;
};

type VerticalMediaViewerProps = {
  open: boolean;
  items: VerticalMediaItem[];
  index: number;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
  downloadDelaySeconds?: number;
};

const defaultTerms = [
  "File hanya boleh dipakai oleh akun aktif BuatCuan.",
  "Edit dahulu sebelum dipublikasikan ulang.",
  "Dilarang membagikan file mentah ke pihak luar.",
];

const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function VerticalMediaViewer({ open, items, index, onOpenChange, onIndexChange, downloadDelaySeconds = 59 }: VerticalMediaViewerProps) {
  const safeIndex = items.length ? Math.min(Math.max(index, 0), items.length - 1) : 0;
  const item = items[safeIndex];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const singleClickTimerRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [termsOpen, setTermsOpen] = useState(true);
  const [downloadCountdown, setDownloadCountdown] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [tapFeedback, setTapFeedback] = useState<string | null>(null);

  const mediaUrl = useMemo(() => assetUrl(item?.url), [item?.url]);
  const terms = item?.terms?.length ? item.terms : defaultTerms;
  const hasPrevious = safeIndex > 0;
  const hasNext = safeIndex < items.length - 1;
  const canDownload = Boolean(item?.onDownload || item?.url || item?.ctaUrl);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") goPrevious();
      if (event.key === "ArrowDown" || event.key === "ArrowRight") goNext();
      if (event.key === " ") {
        event.preventDefault();
        void togglePlayback();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, safeIndex, items.length]);

  useEffect(() => {
    if (!open) return;
    setTermsOpen(true);
    setDownloadCountdown(null);
    setProgress(0);
    setPlaying(false);
    setTapFeedback(null);
    setSpeedMenuOpen(false);
  }, [item?.id, open]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate, item?.id]);

  useEffect(() => {
    if (!tapFeedback) return;
    const timer = window.setTimeout(() => setTapFeedback(null), 650);
    return () => window.clearTimeout(timer);
  }, [tapFeedback]);

  useEffect(() => {
    return () => {
      if (singleClickTimerRef.current !== null) {
        window.clearTimeout(singleClickTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (downloadCountdown === null) return;
    if (downloadCountdown <= 0) {
      setDownloadCountdown(null);
      return;
    }
    const timer = window.setTimeout(() => setDownloadCountdown((value) => Math.max(0, (value ?? 0) - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [downloadCountdown]);

  if (!open || !item) return null;

  const goPrevious = () => {
    if (hasPrevious) onIndexChange(safeIndex - 1);
  };

  const goNext = () => {
    if (hasNext) onIndexChange(safeIndex + 1);
  };

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      await video.play().catch(() => undefined);
      setPlaying(!video.paused);
      return;
    }
    video.pause();
    setPlaying(false);
  }

  const seekVideo = (seconds: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(0, video.currentTime + seconds), video.duration);
    setProgress(video.duration ? Math.min(100, (video.currentTime / video.duration) * 100) : 0);
    setTapFeedback(seconds > 0 ? "+10s" : "-10s");
  };

  const handleMediaClick = () => {
    if (item.type !== "video") return;
    if (singleClickTimerRef.current !== null) {
      window.clearTimeout(singleClickTimerRef.current);
    }
    singleClickTimerRef.current = window.setTimeout(() => {
      void togglePlayback();
      singleClickTimerRef.current = null;
    }, 220);
  };

  const handleMediaDoubleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (item.type !== "video") return;
    if (singleClickTimerRef.current !== null) {
      window.clearTimeout(singleClickTimerRef.current);
      singleClickTimerRef.current = null;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    if (ratio < 0.45) seekVideo(-10);
    if (ratio > 0.55) seekVideo(10);
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    setSpeedMenuOpen(false);
    setTapFeedback(`${rate}x`);
  };

  const startDownload = () => {
    if (!canDownload || downloading) return;
    if (downloadCountdown !== null) return;
    void executeDownload();
  };

  const executeDownload = async () => {
    if (!canDownload || downloading) return;
    setDownloading(true);
    try {
      if (item.onDownload) {
        await item.onDownload();
      } else if (item.url) {
        await downloadFromUrl(mediaUrl, item.downloadName || item.title);
      } else if (item.ctaUrl) {
        window.open(item.ctaUrl, "_blank", "noopener,noreferrer");
      }
      setDownloadCountdown(downloadDelaySeconds);
    } catch (error) {
      console.error("Media download failed", error);
    } finally {
      setDownloading(false);
    }
  };

  const overlay = (
    <div className="fixed inset-0 z-[100] bg-black text-white">
      <div className="absolute inset-x-0 top-0 z-30 h-1 bg-white/10">
        <div className="h-full bg-primary transition-[width]" style={{ width: `${item.type === "video" ? progress : 100}%` }} />
      </div>

      <button type="button" onClick={() => onOpenChange(false)} className="absolute right-4 top-4 z-40 grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white backdrop-blur" aria-label="Tutup preview">
        <X className="h-5 w-5" />
      </button>

      <div className="grid h-full grid-cols-1 place-items-center px-4 py-5 md:grid-cols-[1fr_minmax(300px,420px)_1fr] md:px-6">
        {item.type !== "image" ? <ViewerNavButton direction="previous" disabled={!hasPrevious} onClick={goPrevious} /> : <div />}

        <div className="relative flex h-full max-h-[calc(100vh-40px)] w-full max-w-[430px] items-center justify-center">
          <div className="relative aspect-[9/16] max-h-full w-full overflow-hidden rounded-[28px] border border-white/15 bg-zinc-950 shadow-2xl">
            <MediaFrame item={item} mediaUrl={mediaUrl} videoRef={videoRef} muted={muted} setPlaying={setPlaying} setProgress={setProgress} />

            {item.type === "video" ? (
              <button
                type="button"
                onClick={handleMediaClick}
                onDoubleClick={handleMediaDoubleClick}
                className="absolute inset-0 z-10 cursor-pointer"
                aria-label="Klik untuk play/pause, klik dua kali kiri atau kanan untuk maju/mundur 10 detik"
              />
            ) : null}

            {tapFeedback ? (
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/65 px-4 py-2 text-sm font-black text-white shadow-2xl backdrop-blur">
                {tapFeedback === "-10s" ? <RotateCcw className="h-4 w-4" /> : tapFeedback === "+10s" ? <RotateCw className="h-4 w-4" /> : <Gauge className="h-4 w-4" />}
                {tapFeedback}
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 pt-20">
              <p className="text-lg font-black leading-tight">{item.title}</p>
              {item.subtitle ? <p className="mt-1 text-xs font-bold text-white/70">{item.subtitle}</p> : null}
              {item.description ? <p className="mt-2 line-clamp-3 text-xs font-semibold leading-relaxed text-white/55">{item.description}</p> : null}
            </div>

            {termsOpen && (
              <div className="absolute inset-x-3 top-14 z-30 rounded-2xl border border-orange-400/35 bg-black/75 p-3 backdrop-blur">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-orange-200">Syarat penggunaan</p>
                    <ul className="mt-1 space-y-1 text-[11px] font-semibold leading-relaxed text-white/70">
                      {terms.slice(0, 3).map((term) => <li key={term}>- {term}</li>)}
                    </ul>
                  </div>
                  <button type="button" onClick={() => setTermsOpen(false)} className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {item.type !== "image" || canDownload ? (
              <div className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2">
                {item.type === "video" && (
                  <>
                    <RoundAction onClick={() => void togglePlayback()} label={playing ? "Pause" : "Play"}>
                      {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
                    </RoundAction>
                    <RoundAction onClick={() => setMuted((value) => !value)} label={muted ? "Unmute" : "Mute"}>
                      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </RoundAction>
                    <div className="relative flex flex-col items-center">
                      <RoundAction onClick={() => setSpeedMenuOpen((value) => !value)} label={`${playbackRate}x`}>
                        <Gauge className="h-5 w-5" />
                      </RoundAction>
                      {speedMenuOpen ? (
                        <div className="absolute right-full top-0 mr-2 grid w-20 gap-1 rounded-2xl border border-white/10 bg-black/80 p-1.5 shadow-2xl backdrop-blur">
                          {playbackRates.map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => changePlaybackRate(rate)}
                              className={cn(
                                "h-8 rounded-xl px-2 text-xs font-black text-white/70 transition hover:bg-white/15 hover:text-white",
                                playbackRate === rate && "bg-white text-black hover:bg-white hover:text-black",
                              )}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </>
                )}
                {item.type !== "image" ? (
                  <>
                    <RoundAction onClick={goPrevious} disabled={!hasPrevious} label="Sebelumnya">
                      <ChevronLeft className="h-5 w-5" />
                    </RoundAction>
                    <RoundAction onClick={goNext} disabled={!hasNext} label="Berikutnya">
                      <ChevronRight className="h-5 w-5" />
                    </RoundAction>
                  </>
                ) : null}
                <RoundAction onClick={startDownload} disabled={!canDownload || downloading || downloadCountdown !== null} label={downloadCountdown !== null ? `${downloadCountdown}s` : downloading ? "..." : item.downloadLabel ?? "Download"}>
                  {downloadCountdown !== null ? <span className="text-xs font-black">{downloadCountdown}</span> : <Download className="h-5 w-5" />}
                </RoundAction>
                {item.type !== "image" && item.ctaUrl ? (
                  <RoundAction onClick={() => window.open(item.ctaUrl ?? "", "_blank", "noopener,noreferrer")} label={item.ctaLabel ?? "Buka"}>
                    <ExternalLink className="h-5 w-5" />
                  </RoundAction>
                ) : null}
              </div>
            ) : null}

          </div>
        </div>

        {item.type !== "image" ? <ViewerNavButton direction="next" disabled={!hasNext} onClick={goNext} /> : <div />}
      </div>

      <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-[11px] font-bold text-white/70 backdrop-blur">
        <span>{safeIndex + 1}/{items.length}</span>
        <span className="h-1 w-1 rounded-full bg-white/35" />
        <span>{item.downloadLabel ?? "Preview"}</span>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

function MediaFrame({ item, mediaUrl, videoRef, muted, setPlaying, setProgress }: {
  item: VerticalMediaItem;
  mediaUrl: string;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  muted: boolean;
  setPlaying: (value: boolean) => void;
  setProgress: (value: number) => void;
}) {
  if (item.type === "video" && mediaUrl) {
    return (
      <video
        ref={videoRef}
        src={mediaUrl}
        controls={false}
        playsInline
        muted={muted}
        preload="metadata"
        className="h-full w-full bg-black object-contain"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          setProgress(video.duration ? Math.min(100, (video.currentTime / video.duration) * 100) : 0);
        }}
      />
    );
  }

  if (item.type === "image" && mediaUrl) {
    return <img src={mediaUrl} alt={item.title} className="h-full w-full bg-black object-contain" />;
  }

  return (
    <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.12),transparent_34%),#09090b] px-6 text-center">
      <div>
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-white/10 text-white">
          <FileText className="h-9 w-9" />
        </span>
        <p className="mt-4 text-lg font-black">{item.type === "pdf" ? "Preview PDF" : "File belum tersedia"}</p>
        <p className="mt-2 text-sm font-semibold text-white/55">{item.description ?? "Gunakan tombol download untuk membuka file."}</p>
      </div>
    </div>
  );
}

async function downloadFromUrl(url: string, fileName: string) {
  const headers = new Headers();
  const token = authStorage.getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerDownload(objectUrl, fileName);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    console.error("Blob download failed, falling back to direct link", error);
    triggerDownload(url, fileName, true);
  }
}

function triggerDownload(url: string, fileName: string, openInNewTab = false) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = sanitizeFileName(fileName);
  if (openInNewTab) anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function sanitizeFileName(fileName: string) {
  const cleanName = fileName.trim().replace(/[\\/:*?"<>|]+/g, "-");
  return cleanName || "download";
}

function ViewerNavButton({ direction, disabled, onClick }: { direction: "previous" | "next"; disabled: boolean; onClick: () => void }) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn("hidden h-14 w-14 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-20 md:grid", direction === "previous" ? "justify-self-end" : "justify-self-start")}
      aria-label={direction === "previous" ? "Sebelumnya" : "Berikutnya"}
    >
      <Icon className="h-7 w-7" />
    </button>
  );
}

function RoundAction({ children, label, onClick, disabled = false }: { children: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="group flex flex-col items-center gap-1 disabled:cursor-not-allowed disabled:opacity-35">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur transition group-hover:bg-white/20">
        {children}
      </span>
      <span className="max-w-14 truncate text-[9px] font-black text-white/80">{label}</span>
    </button>
  );
}
