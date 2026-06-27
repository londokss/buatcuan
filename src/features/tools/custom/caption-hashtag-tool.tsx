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
import { api, assetUrl, getErrorMessage, type MemberToolItemDto } from "@/lib/api";
import { slugify } from "../utils";
type CaptionHashtagResult = {
  id: string;
  topic: string;
  platform: string;
  tone: string;
  hook: string;
  body: string;
  cta: string;
  readTime: string;
  hashtags: HashtagItem[];
};

type HashtagKind = "viral" | "trending" | "niche";

type HashtagItem = {
  text: string;
  kind: HashtagKind;
};

const captionPlatforms = ["TikTok", "Instagram", "YouTube", "Facebook"] as const;
const captionTones = ["Santai", "Lucu", "Serius", "Motivasi", "Jualan"] as const;
const hashtagCounts = [5, 10, 15, 20, 30] as const;

const CaptionHashtagTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState("video resep ayam geprek, tips hemat beli makan");
  const [platform, setPlatform] = useState<(typeof captionPlatforms)[number]>("TikTok");
  const [tone, setTone] = useState<(typeof captionTones)[number]>("Santai");
  const [count, setCount] = useState<(typeof hashtagCounts)[number]>(10);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<CaptionHashtagResult>(() => buildCaptionHashtagResult("video resep ayam geprek, tips hemat beli makan", "TikTok", "Santai", 10));
  const [savedCaptions, setSavedCaptions] = useState<CaptionHashtagResult[]>(() => readSavedCaptions());
  const { data } = useQuery({
    queryKey: ["tool", slug, "ide-caption-hashtag"],
    queryFn: () => api.tools.detail(slug, { category: "ALL" }),
  });

  const locked = Boolean(data?.tool.isLocked);

  const generate = async () => {
    if (locked) {
      toast.error("Tool ini khusus PRO member");
      return;
    }
    try {
      setGenerating(true);
      await api.tools.use(slug);
      setResult(buildCaptionHashtagResult(topic, platform, tone, count));
      toast.success("Caption & tagar dibuat");
      void queryClient.invalidateQueries({ queryKey: ["tool", slug, "ide-caption-hashtag"] });
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal generate caption"));
    } finally {
      setGenerating(false);
    }
  };

  const copyCaption = async () => {
    await navigator.clipboard.writeText(formatCaption(result));
    toast.success("Caption disalin");
  };

  const copyHashtags = async () => {
    await navigator.clipboard.writeText(result.hashtags.map((item) => item.text).join(" "));
    toast.success("Tagar disalin");
  };

  const saveCaption = () => {
    const next = [result, ...savedCaptions.filter((item) => item.topic !== result.topic || item.platform !== result.platform)].slice(0, 30);
    setSavedCaptions(next);
    localStorage.setItem("buatcuan:saved-caption-hashtags", JSON.stringify(next));
    toast.success("Caption & tagar disimpan");
  };

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Caption & Tagar</h1>
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-extrabold text-accent">
              <Crown className="h-3.5 w-3.5" /> PRO
            </span>
          </div>
        </div>
      </div>

      <CaptionUsageCard />
      <CaptionProBanner locked={locked} />
      <CaptionExplainer />

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-violet-400">
          <Hash className="h-4 w-4" />
          <h2 className="font-extrabold text-foreground">Generate Caption & Tagar</h2>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-muted-foreground">Tentang konten apa?</span>
          <Input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="h-12 rounded-xl border-border bg-secondary text-sm font-bold"
            placeholder="Contoh: video resep ayam geprek, tips hemat"
          />
        </label>
        <SegmentedButtons label="Platform" values={captionPlatforms} value={platform} onChange={(value) => setPlatform(value as typeof platform)} color="violet" />
        <SegmentedButtons label="Nada Caption" values={captionTones} value={tone} onChange={(value) => setTone(value as typeof tone)} color="violet" />
        <div>
          <p className="mb-2 text-sm font-bold text-muted-foreground">Jumlah Tagar</p>
          <div className="grid grid-cols-5 gap-2">
            {hashtagCounts.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCount(item)}
                className={`h-10 rounded-xl border text-xs font-extrabold transition-colors ${
                  count === item ? "border-violet-500/50 bg-violet-500/20 text-violet-400" : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <Button type="button" onClick={generate} disabled={generating || locked} variant="outline" className="h-12 w-full rounded-xl font-extrabold disabled:opacity-50">
          <Wand2 className="mr-2 h-4 w-4" />
          {generating ? "Membuat Caption..." : "Generate Sekarang"}
        </Button>
        {locked && (
          <Link to="/app/payment" className="block rounded-xl bg-accent/10 px-4 py-3 text-center text-sm font-extrabold text-accent">
            Buka PRO untuk caption & tagar unlimited
          </Link>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Hasil Caption & Tagar</h2>
          <button type="button" onClick={generate} disabled={generating || locked} className="text-xs font-extrabold text-violet-400 disabled:text-muted-foreground">Generate ulang</button>
        </div>
        <CaptionResultCard result={result} onCopyCaption={copyCaption} onCopyHashtags={copyHashtags} onSave={saveCaption} locked={locked} />
      </section>

      <TrendingHashtagSection />

      <section className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-400">
            <Bookmark className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold">Caption & Tagar Tersimpan</h2>
            <p className="text-xs font-semibold text-muted-foreground">Koleksi caption & tagar favorit kamu</p>
          </div>
          <span className="rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-extrabold text-sky-400">{savedCaptions.length} caption</span>
        </div>
        {savedCaptions.length > 0 && (
          <div className="mt-3 space-y-2">
            {savedCaptions.slice(0, 3).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(`${formatCaption(item)}\n\n${item.hashtags.map((tag) => tag.text).join(" ")}`);
                  toast.success("Caption & tagar disalin");
                }}
                className="block w-full rounded-xl bg-background/55 p-3 text-left text-xs font-semibold text-muted-foreground"
              >
                <span className="font-extrabold text-sky-400">{item.topic}</span> · {item.platform} · {item.hashtags.length} tagar
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

function CaptionUsageCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app/tools/ide-caption-hashtag"
      className="border-violet-500/25"
      accentClassName="border-violet-400/50 bg-violet-500/15 text-violet-300"
      fallback={{
        title: "Cara Pakai Caption & Tagar BuatCuan",
        subtitle: "Cara pilih tagar yang tepat & caption yang convert",
        durationLabel: "3 menit",
        thumbnailGradient: "from-emerald-950 via-zinc-950 to-violet-950",
      }}
    />
  );
}

function CaptionProBanner({ locked }: { locked: boolean }) {
  return (
    <section className="rounded-2xl border border-violet-500/35 bg-violet-500/10 p-4 text-violet-400">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/15">
          <Hash className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold">Caption + Tagar dari Data Terbaru</h2>
          <p className="text-xs font-semibold text-muted-foreground">Diperbarui tiap hari · sesuai tren platform</p>
        </div>
        <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl border border-accent/35 bg-accent/10 text-center text-xs font-black leading-tight text-accent">
          ∞<br />Tanpa batas
        </span>
      </div>
      {locked && <p className="mt-3 text-xs font-extrabold">Akun FREE perlu upgrade untuk memakai generator ini.</p>}
    </section>
  );
}

function CaptionExplainer() {
  return (
    <section className="rounded-2xl border border-violet-500/35 bg-violet-500/10 p-4">
      <div className="mb-3 flex items-center gap-2 text-violet-400">
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Caption & Tagar itu beda fungsinya</h2>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
        Caption = teks di bawah video, fungsinya bikin orang mau komentar & simpan.
        Tagar = bantu algoritma temukan videomu ke orang yang tepat.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          ["✍", "Caption bagus", "+Komentar"],
          ["#", "Tagar tepat", "+Jangkauan"],
          ["🚀", "Keduanya", "Masuk FYP"],
        ].map(([icon, title, text]) => (
          <div key={title} className="rounded-xl bg-background/45 p-3 text-center">
            <p className="text-xl">{icon}</p>
            <p className="mt-1 text-[10px] font-bold text-muted-foreground">{title}</p>
            <p className="text-xs font-black text-violet-400">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SegmentedButtons({ label, values, value, onChange, color }: { label: string; values: readonly string[]; value: string; onChange: (value: string) => void; color: "violet" }) {
  const activeClass = color === "violet" ? "border-violet-500/50 bg-violet-500/20 text-violet-400" : "";
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`h-9 rounded-xl border px-4 text-xs font-extrabold transition-colors ${
              value === item ? activeClass : "border-border bg-secondary text-muted-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function CaptionResultCard({ result, onCopyCaption, onCopyHashtags, onSave, locked }: { result: CaptionHashtagResult; onCopyCaption: () => void; onCopyHashtags: () => void; onSave: () => void; locked: boolean }) {
  return (
    <article className={`rounded-2xl border border-violet-500/45 bg-violet-500/10 p-4 ${locked ? "opacity-60" : ""}`}>
      <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-lg bg-violet-500/15 px-3 py-1.5 text-xs font-extrabold text-violet-400">
        <Hash className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{result.topic} · {result.platform} · {result.tone}</span>
      </div>

      <section>
        <div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <MessageCircle className="h-3.5 w-3.5" /> Caption
        </div>
        <div className="rounded-xl bg-background/55 p-4 text-sm font-semibold leading-relaxed">
          <p className="font-extrabold text-violet-400">{result.hook}</p>
          <p className="mt-4">{result.body}</p>
          <p className="mt-4 font-extrabold text-accent">{result.cta}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-md bg-secondary px-2.5 py-1 text-[11px] font-bold text-muted-foreground">{result.readTime}</span>
          <span className="rounded-md bg-secondary px-2.5 py-1 text-[11px] font-bold text-muted-foreground">Trigger komentar</span>
          <span className="rounded-md bg-secondary px-2.5 py-1 text-[11px] font-bold text-muted-foreground">Trigger simpan</span>
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex flex-wrap gap-3 text-[11px] font-semibold text-muted-foreground">
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-red-500" />Viral jutaan</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-accent" />Trending minggu ini</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-primary" />Niche spesifik</span>
        </div>
        <p className="mb-3 text-xs font-extrabold text-muted-foreground">{result.hashtags.length} Tagar Pilihan</p>
        <div className="flex flex-wrap gap-2">
          {result.hashtags.map((item) => (
            <span key={item.text} className={`rounded-full border px-3 py-1.5 text-xs font-extrabold ${hashtagColorClass(item.kind)}`}>
              {item.text}
            </span>
          ))}
        </div>
      </section>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Button type="button" variant="outline" onClick={onCopyCaption} disabled={locked} className="h-14 rounded-xl font-extrabold disabled:opacity-50">
          <Copy className="mr-2 h-4 w-4" /> Salin Caption
        </Button>
        <Button type="button" variant="outline" onClick={onCopyHashtags} disabled={locked} className="h-14 rounded-xl font-extrabold disabled:opacity-50">
          <Hash className="mr-2 h-4 w-4" /> Salin Tagar
        </Button>
        <Button type="button" variant="outline" onClick={onSave} disabled={locked} className="h-14 rounded-xl font-extrabold disabled:opacity-50">
          <Bookmark className="mr-2 h-4 w-4" /> Simpan
        </Button>
      </div>
    </article>
  );
}

function TrendingHashtagSection() {
  const trending = [
    { rank: "#1 Trending", tag: "#resepviraltiktok", views: "2.4M views hari ini", hot: true },
    { rank: "#2 Trending", tag: "#masakanharian", views: "1.8M views hari ini", hot: true },
    { rank: "#3 Naik cepat", tag: "#tipshemat2025", views: "980K views hari ini", hot: false },
    { rank: "#4 Naik cepat", tag: "#jualanonline", views: "760K views hari ini", hot: false },
  ];
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-accent">
          <Hash className="h-4 w-4" />
          <h2 className="font-extrabold text-foreground">Tagar Trending Hari Ini</h2>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">Update tadi pagi</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {trending.map((item) => (
          <div key={item.tag} className={`rounded-xl border p-3 ${item.hot ? "border-red-500/35 bg-red-500/10" : "border-border bg-background/45"}`}>
            <p className="text-[10px] font-bold text-muted-foreground">{item.rank}</p>
            <p className={`mt-1 text-sm font-extrabold ${item.hot ? "text-red-400" : "text-foreground"}`}>{item.tag}</p>
            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{item.views}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildCaptionHashtagResult(topic: string, platform: string, tone: string, count: number): CaptionHashtagResult {
  const cleanTopic = topic.trim() || "konten harian";
  const topicShort = titleCase(cleanTopic.split(",")[0] ?? cleanTopic);
  const hook = tone === "Lucu"
    ? `Siapa yang pernah begini juga? Jangan ngakak sendirian dulu.`
    : tone === "Jualan"
      ? `Kalau kamu sering butuh solusi praktis, ini wajib disimpan.`
      : tone === "Motivasi"
        ? `Mulai dari hal kecil ini bisa bikin proses kamu lebih gampang.`
        : `Siapa yang relate sama ${cleanTopic.toLowerCase()}?`;
  const body = tone === "Serius"
    ? `Konten ini membahas ${cleanTopic.toLowerCase()} dengan cara yang simpel, jelas, dan mudah dipraktekkan. Simpan agar bisa kamu cek lagi saat butuh.`
    : `Ini dia versi simpel tentang ${cleanTopic.toLowerCase()} yang bisa langsung kamu pakai. Cocok buat kamu yang pengen hasilnya lebih rapi tanpa ribet.`;
  const cta = tone === "Jualan" ? "Cek sekarang sebelum lupa, simpan dulu biar gampang balik lagi." : "Simpan dulu biar gak lupa ya!";
  const base: HashtagItem[] = [
    { text: "#reseptiktok", kind: "viral" },
    { text: "#fyp", kind: "viral" },
    { text: "#masakanharian", kind: "trending" },
    { text: "#resepviraltiktok", kind: "trending" },
    { text: "#tipsmasak", kind: "niche" },
    { text: "#masakdirumah", kind: "niche" },
    { text: "#kontenharian", kind: "trending" },
    { text: "#belajarkonten", kind: "niche" },
    { text: "#jualanonline", kind: "trending" },
    { text: "#rekomendasiresep", kind: "niche" },
    { text: "#videotiktok", kind: "viral" },
    { text: "#captionviral", kind: "viral" },
    { text: "#kontenkreator", kind: "niche" },
    { text: "#tipshemat", kind: "trending" },
    { text: "#inspirasiharian", kind: "niche" },
    { text: "#tiktokindonesia", kind: "viral" },
    { text: "#bisnisonline", kind: "niche" },
    { text: "#kontenpemula", kind: "niche" },
    { text: "#trendmingguini", kind: "trending" },
    { text: `#${slugify(topicShort).replace(/-/g, "")}`, kind: "niche" },
    { text: "#viralhariini", kind: "viral" },
    { text: "#tipsbermanfaat", kind: "trending" },
    { text: "#kontenfyp", kind: "viral" },
    { text: "#idekonten", kind: "niche" },
    { text: "#kreatorindonesia", kind: "niche" },
    { text: "#carapraktis", kind: "trending" },
    { text: "#pemula", kind: "niche" },
    { text: "#harusdicoba", kind: "trending" },
    { text: "#kontenviral", kind: "viral" },
    { text: "#algoritmatiktok", kind: "niche" },
  ];
  return {
    id: crypto.randomUUID(),
    topic: topicShort,
    platform,
    tone,
    hook,
    body,
    cta,
    readTime: "Waktu baca 8 detik",
    hashtags: base.slice(0, count),
  };
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function hashtagColorClass(kind: HashtagKind) {
  if (kind === "viral") return "border-red-500/40 bg-red-500/10 text-red-400";
  if (kind === "trending") return "border-accent/45 bg-accent/10 text-accent";
  return "border-primary/40 bg-primary/10 text-primary";
}

function formatCaption(result: CaptionHashtagResult) {
  return [result.hook, result.body, result.cta].join("\n\n");
}

function readSavedCaptions(): CaptionHashtagResult[] {
  const raw = localStorage.getItem("buatcuan:saved-caption-hashtags");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
  } catch {
    return [];
  }
}

export { CaptionHashtagTool };

