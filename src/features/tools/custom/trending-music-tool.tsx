import {
  BadgeInfo, BarChart3, Bookmark, Bot, CalendarDays, ClipboardCheck, ClipboardList, Copy, Crown, Download, Eye, ExternalLink, Hash, Headphones, Heart, Image, LifeBuoy, Lightbulb, ListChecks, Lock, Megaphone, MessageCircle, MessagesSquare, Maximize2, Music, Search, Sparkles, Trophy, Type, Utensils, Users, Video, VolumeX, Wand2, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { ManagedUsageVideoCard } from "@/components/ManagedUsageVideoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShowMoreList } from "@/components/ShowMoreList";
import { api, assetUrl, getErrorMessage, type MemberToolItemDto } from "@/lib/api";
import { contentColorTheme } from "@/lib/content-colors";
import { slugify } from "../utils";
type MusicTrack = {
  rank: number;
  title: string;
  artist: string;
  genre: string;
  duration: string;
  availability: string;
  videos: string;
  growth: number;
  moods: string[];
  color: string;
};

const musicPlatforms = ["TikTok", "Instagram Reels", "YouTube Shorts"] as const;
const musicMoods = ["Semua", "Semangat", "Santai", "Galau", "Lucu", "Motivasi", "Jualan"] as const;

const musicTracks: MusicTrack[] = [
  { rank: 1, title: "Aku Bukan Untukmu", artist: "Rossa", genre: "Pop Indonesia", duration: "2:45", availability: "Versi 15 & 30 detik tersedia", videos: "45.2M", growth: 280, moods: ["Galau", "Relatable", "Motivasi", "Santai"], color: "from-violet-500 to-purple-400" },
  { rank: 2, title: "Hati-Hati di Jalan", artist: "Tulus", genre: "Indie Pop", duration: "3:12", availability: "Versi 15 & 30 detik tersedia", videos: "28.7M", growth: 190, moods: ["Galau", "Perpisahan", "Hangat"], color: "from-red-500 to-rose-400" },
  { rank: 3, title: "Cinta Luar Biasa", artist: "Andmesh", genre: "Pop Romantis", duration: "3:28", availability: "Versi 30 detik tersedia", videos: "19.4M", growth: 95, moods: ["Romantis", "Keluarga", "Hangat"], color: "from-yellow-500 to-lime-400" },
  { rank: 4, title: "Sempurna", artist: "Andra & The Backbone", genre: "Rock", duration: "4:02", availability: "Versi 15 detik tersedia", videos: "14.1M", growth: 72, moods: ["Semangat", "Motivasi", "Jualan"], color: "from-sky-500 to-cyan-400" },
  { rank: 5, title: "Kamu yang Ku Tunggu", artist: "The Rain ft. Endah N Rhesa", genre: "Pop Akustik", duration: "3:55", availability: "Versi 30 detik tersedia", videos: "11.8M", growth: 61, moods: ["Santai", "Galau", "Relatable"], color: "from-emerald-500 to-green-400" },
  { rank: 6, title: "Komang", artist: "Raim Laode", genre: "Pop Folk", duration: "3:42", availability: "Versi 15 & 30 detik tersedia", videos: "10.9M", growth: 58, moods: ["Santai", "Keluarga", "Hangat"], color: "from-orange-500 to-amber-400" },
  { rank: 7, title: "Satu-Satu", artist: "Idgitaf", genre: "Pop", duration: "3:36", availability: "Versi 30 detik tersedia", videos: "9.6M", growth: 54, moods: ["Motivasi", "Semangat", "Relatable"], color: "from-teal-500 to-cyan-400" },
  { rank: 8, title: "Rayuan Perempuan Gila", artist: "Nadin Amizah", genre: "Indie", duration: "4:12", availability: "Versi 15 detik tersedia", videos: "8.9M", growth: 48, moods: ["Galau", "Santai", "Relatable"], color: "from-pink-500 to-rose-400" },
];

const TrendingMusicTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState<(typeof musicPlatforms)[number]>("TikTok");
  const [mood, setMood] = useState<string>("Semua");
  const { data } = useQuery({
    queryKey: ["tool", slug, "ide-sound-musik-trending"],
    queryFn: () => api.tools.detail(slug, { category: "ALL" }),
  });

  const locked = Boolean(data?.tool.isLocked);
  const theme = contentColorTheme(data?.tool.colorGradient);
  const tracks = useMemo(() => buildMusicTracks(data?.items), [data?.items]);
  const moodOptions = useMemo(() => {
    const values = new Set<string>(musicMoods);
    tracks.forEach((track) => track.moods.forEach((item) => values.add(item)));
    return Array.from(values);
  }, [tracks]);
  const visibleTracks = useMemo(() => {
    if (mood === "Semua") return tracks;
    return tracks.filter((track) => track.moods.some((item) => item.toLowerCase() === mood.toLowerCase()));
  }, [mood, tracks]);

  const copyTrack = async (track: MusicTrack) => {
    if (locked) {
      toast.error("Tool ini khusus PRO member");
      return;
    }
    await api.tools.use(slug).catch(() => null);
    await navigator.clipboard.writeText(`${track.title} - ${track.artist}`);
    toast.success("Judul musik disalin");
    void queryClient.invalidateQueries({ queryKey: ["tool", slug, "ide-sound-musik-trending"] });
    void queryClient.invalidateQueries({ queryKey: ["tools"] });
  };

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Musik Trending</h1>
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold" style={{ borderColor: theme.border, background: theme.iconBg, color: theme.text }}>
              <Crown className="h-3.5 w-3.5" /> PRO
            </span>
          </div>
        </div>
      </div>

      <MusicUsageCard />
      <MusicProBanner locked={locked} theme={theme} />
      <MusicHowToStrip theme={theme} />
      <MusicExplainer theme={theme} />

      <section className="space-y-3">
        <SegmentedButtons label="Platform" values={musicPlatforms} value={platform} onChange={(value) => setPlatform(value as typeof platform)} theme={theme} />
        <div>
          <p className="mb-2 text-sm font-bold text-muted-foreground">Mood Konten</p>
          <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar">
            <div className="flex w-max gap-2">
              {moodOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMood(item)}
                className="h-9 shrink-0 rounded-full border px-4 text-xs font-extrabold transition-colors"
                style={mood === item ? { borderColor: theme.accent, background: theme.gradient, color: "#fff" } : undefined}
              >
                {item}
              </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MusicUpdateBar platform={platform} theme={theme} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Top Musik FYP Minggu Ini</h2>
          <p className="text-xs font-semibold text-muted-foreground">{visibleTracks.length} dari 24 lagu</p>
        </div>
        <ShowMoreList
          items={visibleTracks}
          initial={3}
          step={3}
          className="space-y-3"
          renderItem={(track) => (
            <MusicTrackCard
              key={`${track.rank}-${track.title}`}
              track={track}
              onCopy={() => copyTrack(track)}
              locked={locked}
              theme={theme}
            />
          )}
        />
      </section>

      <MusicTips theme={theme} />
    </div>
  );
};

function MusicUsageCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app/tools/ide-sound-musik-trending"
      className="border-violet-500/25"
      accentClassName="border-violet-400/50 bg-violet-500/15 text-violet-300"
      fallback={{
        title: "Cara Pakai Musik Trending BuatCuan",
        subtitle: "Cara cari & pakai musik trending di TikTok/IG",
        durationLabel: "3 menit",
        thumbnailGradient: "from-violet-950 via-purple-950 to-zinc-950",
      }}
    />
  );
}

function SegmentedButtons({ label, values, value, onChange, theme }: { label: string; values: readonly string[]; value: string; onChange: (value: string) => void; theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className="h-9 rounded-xl border bg-secondary px-4 text-xs font-extrabold text-muted-foreground transition-colors"
            style={value === item ? { borderColor: theme.accent, background: theme.gradient, color: "#fff" } : undefined}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function MusicProBanner({ locked, theme }: { locked: boolean; theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg, color: theme.text }}>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: theme.iconBg }}>
          <Music className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold">Daftar Musik FYP Minggu Ini</h2>
          <p className="text-xs font-semibold text-muted-foreground">Diperbarui tiap minggu · data langsung dari platform</p>
        </div>
        <span className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-black" style={{ borderColor: theme.border, background: theme.iconBg, color: theme.text }}>
          <span className="h-2.5 w-2.5 animate-pulse rounded-full" style={{ background: theme.accent }} />
          Live update
        </span>
      </div>
      {locked && <p className="mt-3 text-xs font-extrabold">Akun FREE perlu upgrade untuk memakai daftar musik ini.</p>}
    </section>
  );
}

function MusicHowToStrip({ theme }: { theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg }}>
      <div className="mb-3 flex items-center gap-2" style={{ color: theme.text }}>
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Cara pakainya simpel</h2>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["1. Pilih", "Musik yang cocok sama konten kamu"],
          ["2. Salin", "Judul + nama penyanyi"],
          ["3. Cari", "Langsung di TikTok / IG / YouTube"],
        ].map(([title, text]) => (
          <div key={title} className="rounded-xl bg-background/45 p-3 text-center">
            <p className="text-sm font-black" style={{ color: theme.text }}>{title}</p>
            <p className="mt-1 text-[10px] font-bold text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MusicExplainer({ theme }: { theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg }}>
      <div className="mb-3 flex items-center gap-2" style={{ color: theme.text }}>
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Kenapa musik trending itu penting?</h2>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
        Algoritma TikTok & Instagram lebih sering merekomendasikan video yang pakai musik sedang trending.
        Musik yang tepat bisa naikkan jangkauan 2-3x lipat dibanding musik random.
      </p>
    </section>
  );
}

function MusicUpdateBar({ platform, theme }: { platform: string; theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <section className="flex items-center justify-between gap-3 rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg }}>
      <div className="flex items-center gap-2" style={{ color: theme.text }}>
        <CalendarDays className="h-4 w-4" />
        <p className="text-sm font-extrabold">Diperbarui Senin, 5 Mei 2026</p>
      </div>
      <p className="text-xs font-semibold text-muted-foreground">{platform} · update: 3 hari lagi</p>
    </section>
  );
}

function MusicTrackCard({ track, onCopy, locked, theme }: { track: MusicTrack; onCopy: () => void; locked: boolean; theme: ReturnType<typeof contentColorTheme> }) {
  const featured = track.rank === 1;
  const fast = track.rank === 2;
  return (
    <article className={`relative rounded-2xl border bg-card p-4 ${locked ? "opacity-60" : ""}`} style={featured || fast ? { borderColor: theme.border, background: theme.cardBg, boxShadow: theme.shadow } : undefined}>
      {featured && <span className="absolute -top-3 left-4 rounded-md px-3 py-1 text-[11px] font-extrabold text-white" style={{ background: theme.gradient }}>#1 Trending</span>}
      {fast && <span className="absolute -top-3 left-4 rounded-md px-3 py-1 text-[11px] font-extrabold text-white" style={{ background: theme.gradient }}>Naik Cepat</span>}
      <div className="grid grid-cols-[34px_52px_1fr] gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl text-sm font-black" style={featured || fast ? { background: theme.iconBg, color: theme.text } : undefined}>
          {track.rank}
        </span>
        <span className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${track.color} text-white`}>
          <Music className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-extrabold">{track.title}</h3>
          <p className="text-xs font-semibold text-muted-foreground">{track.artist} · {track.genre}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{track.duration} · {track.availability}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-md px-2.5 py-1 text-[11px] font-extrabold" style={{ background: theme.iconBg, color: theme.text }}>{track.videos} video pakai</span>
        <span className="rounded-md px-2.5 py-1 text-[11px] font-extrabold" style={{ background: theme.iconBg, color: theme.text }}>+{track.growth}% minggu ini</span>
        {featured && <span className="rounded-md px-2.5 py-1 text-[11px] font-extrabold" style={{ background: theme.iconBg, color: theme.text }}>Cocok semua niche</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {track.moods.map((mood) => (
          <span key={mood} className="rounded-md bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground">{mood}</span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-background/55 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold">{track.title}</p>
          <p className="truncate text-xs font-semibold text-muted-foreground">{track.artist}</p>
        </div>
        <Button type="button" variant="outline" onClick={onCopy} disabled={locked} className="h-10 shrink-0 rounded-xl px-5 font-extrabold disabled:opacity-50">
          <Copy className="mr-2 h-4 w-4" /> Salin
        </Button>
      </div>
      <p className="mt-2 text-center text-[11px] font-semibold text-muted-foreground">Setelah disalin → cari di kolom musik TikTok / IG / YouTube</p>
    </article>
  );
}

function MusicTips({ theme }: { theme: ReturnType<typeof contentColorTheme> }) {
  const tips = [
    ["Mood matching", "Pilih musik yang mood-nya sesuai konten. Motivasi pakai musik semangat, galau pakai musik slow."],
    ["Timing trending", "Musik baru 1-2 minggu lebih baik dari yang sudah sebulan karena masih fresh."],
    ["Durasi optimal", "Saat cari di TikTok/IG, pilih versi yang banyak dipakai dan cocok dengan durasi video."],
    ["Volume mixing", "Kalau ada teks di video, musik cukup jadi latar belakang dan jangan terlalu keras."],
  ];
  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg }}>
      <div className="mb-3 flex items-center gap-2" style={{ color: theme.text }}>
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Tips Pilih Musik yang Tepat</h2>
      </div>
      <ul className="space-y-2">
        {tips.map(([title, body]) => (
          <li key={title} className="grid grid-cols-[8px_1fr] gap-3 text-xs font-semibold leading-relaxed text-muted-foreground">
            <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
            <span><span className="font-extrabold text-foreground">{title}:</span> {body}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function buildMusicTracks(items?: MemberToolItemDto[]): MusicTrack[] {
  if (!items?.length) return musicTracks;
  return items.map((item, index) => {
    const metadata = item.metadata ?? {};
    return {
      rank: toNumber(metadata.rank, index + 1),
      title: item.title,
      artist: asString(metadata.artist, item.niche || "BuatCuan"),
      genre: asString(metadata.genre, item.category || "Trending"),
      duration: asString(metadata.duration, "0:30"),
      availability: asString(metadata.availability, "Versi pendek tersedia"),
      videos: asString(metadata.videos, "Update admin"),
      growth: toNumber(metadata.growth, 0),
      moods: parseStringList(metadata.moods, [item.theme, item.niche, item.category].filter(Boolean) as string[]),
      color: asString(metadata.color ?? metadata.gradient, "from-yellow-500 to-amber-400"),
    };
  }).sort((a, b) => a.rank - b.rank);
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function toNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseStringList(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    const values = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    if (values.length) return values;
  }
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return fallback.length ? fallback : ["Trending"];
}

export { TrendingMusicTool };

