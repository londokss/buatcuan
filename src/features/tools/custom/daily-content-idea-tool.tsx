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
import { PremiumSearchSelect } from "@/components/PremiumFormControls";
import { ShowMoreList } from "@/components/ShowMoreList";
import { api, assetUrl, getErrorMessage, type MemberToolItemDto } from "@/lib/api";
import { slugify } from "../utils";
type DailyIdeaBadge = "Paling Viral" | "Viral" | "Naik Cepat" | null;

type DailyContentIdea = {
  id: string;
  title: string;
  reason: string;
  tags: string[];
  format: string;
  badge: DailyIdeaBadge;
};

const dailyIdeaPlatforms = ["TikTok", "Instagram", "YouTube Shorts", "Facebook"] as const;
const dailyIdeaNiches = ["Jualan Online", "Masak & Resep", "Motivasi", "Kecantikan", "Parenting", "Affiliate", "Lifestyle"] as const;
const dailyIdeaTopics = ["Semua topik · sesuai niche saya", "Konten edukasi", "Konten promosi halus", "Konten relatable", "Konten Q&A", "Konten behind the scene"] as const;
const dailyIdeaFormats = ["Semua format", "Video footage + teks", "Foto + teks overlay", "List format", "Q&A format", "Tutorial step-by-step"] as const;
const dailyIdeaCounts = [5, 10, 15, 20] as const;

const DailyContentIdeaTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState<(typeof dailyIdeaPlatforms)[number]>("TikTok");
  const [niche, setNiche] = useState<(typeof dailyIdeaNiches)[number]>("Jualan Online");
  const [topic, setTopic] = useState<(typeof dailyIdeaTopics)[number]>("Semua topik · sesuai niche saya");
  const [formatFocus, setFormatFocus] = useState<(typeof dailyIdeaFormats)[number]>("Semua format");
  const [count, setCount] = useState<(typeof dailyIdeaCounts)[number]>(10);
  const [generating, setGenerating] = useState(false);
  const [extraIdeas, setExtraIdeas] = useState<DailyContentIdea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<DailyContentIdea[]>(() => readSavedDailyIdeas());
  const { data } = useQuery({
    queryKey: ["tool", slug, "ide-konten-harian"],
    queryFn: () => api.tools.detail(slug, { category: "ALL" }),
  });

  const locked = Boolean(data?.tool.isLocked);
  const ideas = useMemo(() => [...buildDailyIdeas(platform, niche), ...extraIdeas], [platform, niche, extraIdeas]);

  const copyIdea = async (idea: DailyContentIdea) => {
    if (locked) {
      toast.error("Tool ini khusus PRO member");
      return;
    }
    await navigator.clipboard.writeText(idea.title);
    toast.success("Ide disalin");
  };

  const saveIdea = (idea: DailyContentIdea) => {
    const next = [idea, ...savedIdeas.filter((item) => item.title !== idea.title)].slice(0, 40);
    setSavedIdeas(next);
    localStorage.setItem("buatcuan:saved-daily-ideas", JSON.stringify(next));
    toast.success("Ide disimpan");
  };

  const generateMore = async () => {
    if (locked) {
      toast.error("Tool ini khusus PRO member");
      return;
    }
    try {
      setGenerating(true);
      await api.tools.use(slug);
      setExtraIdeas(buildExtraDailyIdeas(platform, niche, topic, formatFocus, count));
      toast.success("Ide tambahan dibuat");
      void queryClient.invalidateQueries({ queryKey: ["tool", slug, "ide-konten-harian"] });
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal generate ide"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Ide Konten Harian</h1>
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-extrabold text-accent">
              <Crown className="h-3.5 w-3.5" /> PRO
            </span>
          </div>
        </div>
      </div>

      <DailyIdeaUsageCard />
      <DailyIdeaProBanner locked={locked} />
      <DailyIdeaExplainer />

      <section className="space-y-3">
        <div>
          <p className="mb-2 text-sm font-bold text-muted-foreground">Platform</p>
          <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar">
            <div className="flex w-max gap-2">
              {dailyIdeaPlatforms.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPlatform(item)}
                className={`h-10 shrink-0 rounded-full border px-4 text-xs font-extrabold transition-colors ${
                  platform === item ? "border-pink-500 bg-pink-500 text-white" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {item}
              </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold text-muted-foreground">Niche</p>
          <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar">
            <div className="flex w-max gap-2">
              {dailyIdeaNiches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setNiche(item)}
                  className={`h-10 shrink-0 rounded-full border px-4 text-xs font-extrabold transition-colors ${
                    niche === item ? "border-pink-500/60 bg-pink-500/15 text-pink-400" : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <DailyIdeaUpdateBar platform={platform} niche={niche} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Ide Konten Minggu Ini</h2>
          <p className="text-xs font-semibold text-muted-foreground">{ideas.length} ide tersedia</p>
        </div>
        <ShowMoreList
          items={ideas}
          initial={4}
          step={4}
          className="space-y-3"
          renderItem={(idea, index) => (
            <DailyIdeaCard
              key={idea.id}
              idea={idea}
              index={index}
              onCopy={() => copyIdea(idea)}
              onSave={() => saveIdea(idea)}
              locked={locked}
            />
          )}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-pink-400">
          <Wand2 className="h-4 w-4" />
          <h2 className="font-extrabold text-foreground">Generate Ide Lebih Banyak</h2>
        </div>
        <DailyIdeaSelect label="Topik spesifik (opsional)" value={topic} values={dailyIdeaTopics} onChange={(value) => setTopic(value as typeof topic)} />
        <DailyIdeaSelect label="Format konten yang mau difokuskan" value={formatFocus} values={dailyIdeaFormats} onChange={(value) => setFormatFocus(value as typeof formatFocus)} />
        <div>
          <p className="mb-2 text-sm font-bold text-muted-foreground">Jumlah ide yang mau digenerate</p>
          <div className="grid grid-cols-4 gap-2">
            {dailyIdeaCounts.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCount(item)}
                className={`h-10 rounded-xl border text-xs font-extrabold transition-colors ${
                  count === item ? "border-pink-500/50 bg-pink-500/20 text-pink-400" : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <Button type="button" onClick={generateMore} disabled={generating || locked} variant="outline" className="h-12 w-full rounded-xl font-extrabold disabled:opacity-50">
          <Wand2 className="mr-2 h-4 w-4" />
          {generating ? "Membuat Ide..." : "Generate Ide Tambahan"}
        </Button>
        {locked && (
          <Link to="/app/payment" className="block rounded-xl bg-accent/10 px-4 py-3 text-center text-sm font-extrabold text-accent">
            Buka PRO untuk ide konten harian unlimited
          </Link>
        )}
      </section>

      <section className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-400">
            <Bookmark className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold">Ide Tersimpan</h2>
            <p className="text-xs font-semibold text-muted-foreground">Koleksi ide konten favorit kamu</p>
          </div>
          <span className="rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-extrabold text-sky-400">{savedIdeas.length} ide</span>
        </div>
      </section>
    </div>
  );
};

function DailyIdeaUsageCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app/tools/ide-konten-harian"
      className="border-pink-500/25"
      accentClassName="border-pink-400/50 bg-pink-500/15 text-pink-300"
      fallback={{
        title: "Cara Pakai Ide Konten Harian BuatCuan",
        subtitle: "Cara pilih ide yang cocok & eksekusi cepat",
        durationLabel: "3 menit",
        thumbnailGradient: "from-sky-950 via-zinc-950 to-pink-950",
      }}
    />
  );
}

function DailyIdeaProBanner({ locked }: { locked: boolean }) {
  return (
    <section className="rounded-2xl border border-pink-500/35 bg-pink-500/10 p-4 text-pink-400">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-pink-500/15">
          <Lightbulb className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold">Ide Konten Sesuai Tren + Niche Kamu</h2>
          <p className="text-xs font-semibold text-muted-foreground">Diperbarui tiap minggu · sesuai platform & niche</p>
        </div>
        <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl border border-accent/35 bg-accent/10 text-center text-xs font-black leading-tight text-accent">
          Update rutin
        </span>
      </div>
      {locked && <p className="mt-3 text-xs font-extrabold">Akun FREE perlu upgrade untuk memakai generator ini.</p>}
    </section>
  );
}

function DailyIdeaExplainer() {
  return (
    <section className="rounded-2xl border border-pink-500/35 bg-pink-500/10 p-4">
      <div className="mb-3 flex items-center gap-2 text-pink-400">
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Cara pakai yang benar</h2>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
        Pilih platform dan niche kamu dulu, lalu ide yang muncul akan disesuaikan. Setiap ide sudah dilengkapi format konten, alasan kenapa viral, dan strategi harian yang bisa langsung dieksekusi.
      </p>
    </section>
  );
}

function DailyIdeaUpdateBar({ platform, niche }: { platform: string; niche: string }) {
  return (
    <section className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4">
      <div className="flex items-center gap-2 text-accent">
        <CalendarDays className="h-4 w-4" />
        <p className="text-sm font-extrabold">Diperbarui Senin, 5 Mei 2026 · {platform} · {niche}</p>
      </div>
      <p className="text-xs font-semibold text-muted-foreground">Update: 5 hari lagi</p>
    </section>
  );
}

function DailyIdeaCard({ idea, index, onCopy, onSave, locked }: { idea: DailyContentIdea; index: number; onCopy: () => void; onSave: () => void; locked: boolean }) {
  const featured = idea.badge === "Paling Viral" || idea.badge === "Viral";
  const fast = idea.badge === "Naik Cepat";
  return (
    <article className={`relative rounded-2xl border bg-card p-4 ${featured ? "border-pink-500/50 bg-pink-500/10" : fast ? "border-accent/50 bg-accent/10" : "border-border"} ${locked ? "opacity-60" : ""}`}>
      {idea.badge && (
        <span className={`absolute -top-3 left-4 rounded-md px-3 py-1 text-[11px] font-extrabold ${fast ? "bg-accent text-accent-foreground" : "bg-pink-500 text-white"}`}>
          {idea.badge}
        </span>
      )}
      <div className="grid grid-cols-[34px_1fr] gap-3">
        <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-black ${featured ? "bg-pink-500/20 text-pink-400" : fast ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"}`}>
          {index + 1}
        </span>
        <div className="min-w-0">
          <h3 className="font-extrabold leading-tight">{idea.title}</h3>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">{idea.reason}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {idea.tags.map((tag, tagIndex) => (
              <span key={tag} className={`rounded-md px-2.5 py-1 text-[10px] font-extrabold ${tagIndex % 3 === 0 ? "bg-pink-500/15 text-pink-400" : tagIndex % 3 === 1 ? "bg-primary/15 text-primary" : "bg-sky-500/15 text-sky-400"}`}>{tag}</span>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="rounded-md bg-secondary px-3 py-1.5 text-[11px] font-bold text-muted-foreground">{idea.format}</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCopy} disabled={locked} className="h-10 rounded-xl px-4 font-extrabold disabled:opacity-50">
                <Copy className="mr-2 h-4 w-4" /> Salin Ide
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onSave} disabled={locked} className="h-10 w-10 rounded-xl p-0" title="Simpan ide">
                <Bookmark className="h-4 w-4 text-sky-400" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function DailyIdeaSelect({ label, value, values, onChange }: { label: string; value: string; values: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-muted-foreground">{label}</span>
      <PremiumSearchSelect
        value={value}
        onChange={onChange}
        placeholder={`Pilih ${label}`}
        options={values.map((item) => ({ label: item, value: item }))}
        triggerClassName="focus-visible:ring-pink-500/30"
      />
    </label>
  );
}

function buildDailyIdeas(platform: string, niche: string): DailyContentIdea[] {
  const nicheLower = niche.toLowerCase();
  const base = niche === "Masak & Resep"
    ? [
        ["Resep lauk murah 15 menit yang tetap enak buat keluarga", "Konten hemat + cepat punya watch time tinggi karena langsung menjawab kebutuhan harian.", "Video footage + teks"],
        ["3 kesalahan kecil yang bikin masakan rumahan terasa hambar", "Konten mistake format bikin orang penasaran dan mudah dikomentari.", "Foto + teks list"],
        ["Menu bekal anak anti ribet untuk 3 hari", "Parenting dan masak punya kombinasi relatable yang kuat.", "Carousel / list format"],
      ]
    : niche === "Motivasi"
      ? [
          ["Kalimat yang perlu kamu dengar saat merasa tertinggal", "Konten validasi emosi tinggi share dan save rate.", "Foto + teks overlay"],
          ["3 hal kecil yang bikin hidup terasa lebih terarah", "List format mudah diikuti dan cocok untuk konten harian.", "Video montage harian"],
          ["POV: kamu mulai lagi walau kemarin sempat berhenti", "POV progress sangat relatable untuk audience pemula.", "Video footage + teks"],
        ]
      : [
          ["POV: Gue dapat Rp[X] pertama dari TikTok tanpa tampil muka", "Format POV + milestone pertama selalu viral. Orang penasaran dan relate dengan perjuangan awal.", "Video footage + teks"],
          ["3 hal yang gue pelajari setelah [X] hari bikin konten setiap hari", "Learning content punya watch time tinggi karena orang mau tahu apa yang kamu pelajari.", "Foto + teks overlay"],
          ["Cara gue cari uang tambahan dari HP tanpa modal, step by step", `Tutorial step-by-step di ${platform} selalu menarik, cocok untuk promosi soft selling ${nicheLower}.`, "Video footage + caption"],
        ];

  const common: DailyContentIdea[] = [
    ...base.map((item, index) => ({
      id: crypto.randomUUID(),
      title: item[0],
      reason: item[1],
      format: item[2],
      badge: index === 0 ? "Paling Viral" as const : index === 1 ? "Viral" as const : "Naik Cepat" as const,
      tags: index === 0 ? ["POV Format", "Cocok pemula", "No face", "Rumus 4:1"] : index === 1 ? ["List Format", "Watch time tinggi", "Personal story"] : ["Tutorial", "Soft selling", "Bisa pakai skrip promosi"],
    })),
    {
      id: crypto.randomUUID(),
      title: `Jawab pertanyaan: "Emang bisa mulai ${nicheLower} dari nol?"`,
      reason: "Format tanya-jawab selalu tinggi engagement karena menjawab keraguan yang banyak orang rasakan.",
      tags: ["Q&A Format", "Tinggi komentar"],
      format: "Foto + hook pertanyaan",
      badge: null,
    },
    {
      id: crypto.randomUUID(),
      title: `Sehari dalam hidup gue sebagai kreator ${nicheLower} dari rumah`,
      reason: "Day-in-the-life content relatable untuk audience rumahan. Tunjukkan proses, bukan hasil.",
      tags: ["Day in life", "Relatable IRT", "Watch time tinggi"],
      format: "Video montage harian",
      badge: null,
    },
    {
      id: crypto.randomUUID(),
      title: `Kesalahan yang gue buat di bulan pertama bikin konten ${nicheLower}`,
      reason: "Konten kesalahan tinggi views karena orang takut melakukan kesalahan yang sama.",
      tags: ["Mistake Format", "Hook kuat"],
      format: "Foto + teks list",
      badge: null,
    },
  ];
  return common;
}

function buildExtraDailyIdeas(platform: string, niche: string, topic: string, format: string, count: number): DailyContentIdea[] {
  const topicLabel = topic.startsWith("Semua") ? niche : topic.replace("Konten ", "");
  const formatLabel = format.startsWith("Semua") ? "format bebas" : format;
  return Array.from({ length: count }, (_, index) => ({
    id: crypto.randomUUID(),
    title: `${index + 1}. Ide ${topicLabel.toLowerCase()} untuk ${platform}: contoh nyata yang bisa dicoba hari ini`,
    reason: `Ide ini dibuat untuk niche ${niche} dengan fokus ${formatLabel}, sehingga lebih relevan dan mudah dieksekusi.`,
    tags: index % 2 === 0 ? ["No face", "Cocok Rumus 4:1", "Eksekusi cepat"] : ["Relatable", "Bisa pakai skrip promosi", "Saveable"],
    format: formatLabel,
    badge: index === 0 ? "Naik Cepat" : null,
  }));
}

function readSavedDailyIdeas(): DailyContentIdea[] {
  const raw = localStorage.getItem("buatcuan:saved-daily-ideas");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 40) : [];
  } catch {
    return [];
  }
}

export { DailyContentIdeaTool };

