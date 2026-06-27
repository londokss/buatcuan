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
import { slugify } from "../utils";
type PromotionScript = {
  id: string;
  title: string;
  badge?: string;
  tags: string[];
  iconClass: string;
  hook: string;
  body: string[];
  cta: string;
  link: string;
};

const promotionFormats = ["Caption Video", "Teks di Video", "Story / Status", "Testimoni", "Soft Selling"] as const;
const promotionPlatforms = ["TikTok", "Instagram", "Facebook", "WhatsApp", "YouTube"] as const;

const PromotionScriptTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [format, setFormat] = useState<(typeof promotionFormats)[number]>("Caption Video");
  const [platform, setPlatform] = useState<(typeof promotionPlatforms)[number]>("TikTok");
  const [savedScripts, setSavedScripts] = useState<PromotionScript[]>(() => readSavedPromotionScripts());
  const { data } = useQuery({
    queryKey: ["tool", slug, "script-promosi-buatcuan"],
    queryFn: () => api.tools.detail(slug, { category: "ALL" }),
  });

  const locked = Boolean(data?.tool.isLocked);
  const scripts = useMemo(() => buildPromotionScripts(format, platform), [format, platform]);

  const copyScript = async (script: PromotionScript) => {
    if (locked) {
      toast.error("Tool ini khusus PRO member");
      return;
    }
    await api.tools.use(slug).catch(() => null);
    await navigator.clipboard.writeText(formatPromotionScript(script));
    toast.success("Skrip promosi disalin");
    void queryClient.invalidateQueries({ queryKey: ["tool", slug, "script-promosi-buatcuan"] });
    void queryClient.invalidateQueries({ queryKey: ["tools"] });
  };

  const saveScript = (script: PromotionScript) => {
    const next = [script, ...savedScripts.filter((item) => item.id !== script.id)].slice(0, 30);
    setSavedScripts(next);
    localStorage.setItem("buatcuan:saved-promotion-scripts", JSON.stringify(next));
    toast.success("Skrip disimpan");
  };

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Skrip Promosi BuatCuan</h1>
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-extrabold text-accent">
              <Crown className="h-3.5 w-3.5" /> PRO
            </span>
          </div>
        </div>
      </div>

      <PromotionUsageCard />
      <PromotionProBanner locked={locked} />
      <PromotionExplainer />

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-accent">
          <Megaphone className="h-4 w-4" />
          <h2 className="font-extrabold text-foreground">Format Skrip</h2>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar">
          <div className="flex w-max gap-2">
            {promotionFormats.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFormat(item)}
                className={`h-10 shrink-0 rounded-full border px-4 text-xs font-extrabold transition-colors ${
                  format === item ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold text-muted-foreground">Platform</p>
          <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar">
            <div className="flex w-max gap-2">
              {promotionPlatforms.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPlatform(item)}
                className={`h-9 shrink-0 rounded-full border px-4 text-xs font-extrabold transition-colors ${
                  platform === item ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {item}
              </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Skrip {format} · {platform}</h2>
          <p className="text-xs font-semibold text-muted-foreground">{scripts.length * 2} skrip</p>
        </div>
        <ShowMoreList
          items={scripts}
          initial={2}
          step={2}
          className="space-y-3"
          renderItem={(script) => (
            <PromotionScriptCard
              key={script.id}
              script={script}
              onCopy={() => copyScript(script)}
              onSave={() => saveScript(script)}
              locked={locked}
            />
          )}
        />
      </section>

      <PromotionTips />

      <section className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-400">
            <Bookmark className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold">Skrip Tersimpan</h2>
            <p className="text-xs font-semibold text-muted-foreground">Koleksi skrip favorit kamu</p>
          </div>
          <span className="rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-extrabold text-sky-400">{savedScripts.length} skrip</span>
        </div>
      </section>

      <Link to="/app/tools/script-closing-dm-wa" className="block rounded-2xl border border-primary/35 bg-primary/10 p-4 text-center text-sm font-extrabold text-primary">
        Lanjut ke Skrip Closing DM & WA
      </Link>
    </div>
  );
};

function PromotionUsageCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app/tools/script-promosi-buatcuan"
      className="border-accent/25"
      accentClassName="border-accent/50 bg-accent/15 text-accent"
      fallback={{
        title: "Cara Pakai Skrip Promosi BuatCuan",
        subtitle: "Cara promosi yang natural & tidak terkesan jualan",
        durationLabel: "4 menit",
        thumbnailGradient: "from-yellow-950 via-amber-950 to-zinc-950",
      }}
    />
  );
}

function PromotionProBanner({ locked }: { locked: boolean }) {
  return (
    <section className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-accent">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15">
          <Megaphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold">Skrip Affiliate Siap Pakai</h2>
          <p className="text-xs font-semibold text-muted-foreground">Berbagai format · caption · video · DM · story</p>
        </div>
        <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl border border-accent/35 bg-background/30 text-center text-xs font-black leading-tight">
          ∞<br />Tanpa batas
        </span>
      </div>
      {locked && <p className="mt-3 text-xs font-extrabold">Akun FREE perlu upgrade untuk memakai skrip ini.</p>}
    </section>
  );
}

function PromotionExplainer() {
  return (
    <section className="rounded-2xl border border-accent/35 bg-accent/10 p-4">
      <div className="mb-3 flex items-center gap-2 text-accent">
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Kunci promosi yang convert</h2>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
        Promosi yang bagus itu tidak terasa seperti iklan. Orang harus merasa kamu berbagi pengalaman, bukan menjual sesuatu.
        Skrip ini sudah dirancang agar terasa natural, jujur, dan tidak maksa.
      </p>
      <div className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 p-3">
        <p className="text-xs font-semibold leading-relaxed text-muted-foreground">
          <span className="font-extrabold text-red-400">Jangan copy-paste persis!</span> Ganti bagian yang di-[kurung] dengan informasi kamu sendiri agar terasa lebih personal dan tidak terdeteksi sebagai spam.
        </p>
      </div>
    </section>
  );
}

function PromotionScriptCard({ script, onCopy, onSave, locked }: { script: PromotionScript; onCopy: () => void; onSave: () => void; locked: boolean }) {
  const featured = Boolean(script.badge);
  return (
    <article className={`overflow-hidden rounded-2xl border bg-card ${featured ? "border-accent/60 bg-accent/10" : "border-border"} ${locked ? "opacity-60" : ""}`}>
      {featured && <div className="px-4 pt-3"><span className="rounded-md bg-accent px-3 py-1 text-[11px] font-extrabold text-accent-foreground">{script.badge}</span></div>}
      <div className="flex items-start gap-3 p-4">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${script.iconClass} text-white`}>
          <Megaphone className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold">{script.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {script.tags.map((tag, index) => (
              <span key={tag} className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${index % 2 ? "bg-sky-500/15 text-sky-400" : "bg-accent/15 text-accent"}`}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border p-4">
        <div className="rounded-xl bg-background/55 p-4 text-sm font-semibold leading-relaxed">
          <p className="font-extrabold text-accent">{script.hook}</p>
          {script.body.map((line) => <p key={line} className="mt-4 text-muted-foreground">{line}</p>)}
          <p className="mt-4 font-extrabold text-primary">{script.cta}</p>
          <p className="mt-2 font-bold text-sky-400">{script.link}</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={onCopy} disabled={locked} className="h-11 rounded-xl font-extrabold disabled:opacity-50">
            <Copy className="mr-2 h-4 w-4" /> Salin Skrip Ini
          </Button>
          <Button type="button" variant="outline" onClick={onSave} disabled={locked} className="h-11 rounded-xl font-extrabold disabled:opacity-50">
            <Bookmark className="mr-2 h-4 w-4" /> Simpan
          </Button>
        </div>
      </div>
    </article>
  );
}

function PromotionTips() {
  const tips = [
    ["Pakai Rumus 4:1", "4 konten nilai dulu, baru 1 konten promosi. Jangan promosi terus."],
    ["Variasi kata", "Jangan pakai skrip yang sama persis tiap hari, variasikan agar tidak terlihat bot."],
    ["Ceritakan pengalaman nyata", "Tambahkan detail personal yang benar kamu rasakan agar lebih dipercaya."],
    ["CTA yang jelas tapi tidak maksa", "Link di bio atau komen INFO lebih natural dari beli sekarang."],
  ];
  return (
    <section className="rounded-2xl border border-primary/35 bg-primary/10 p-4">
      <div className="mb-3 flex items-center gap-2 text-primary">
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Tips Promosi yang Efektif</h2>
      </div>
      <ul className="space-y-2">
        {tips.map(([title, body]) => (
          <li key={title} className="grid grid-cols-[8px_1fr] gap-3 text-xs font-semibold leading-relaxed text-muted-foreground">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
            <span><span className="font-extrabold text-foreground">{title}:</span> {body}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function buildPromotionScripts(format: string, platform: string): PromotionScript[] {
  const context = `${format} · ${platform}`;
  return [
    {
      id: `personal-${format}-${platform}`,
      title: "Skrip Pengalaman Pribadi",
      badge: "Paling Convert",
      tags: ["Paling natural", "Cocok pemula", "Convert tinggi"],
      iconClass: "from-yellow-500 to-lime-400",
      hook: "Gue gak nyangka dari HP doang bisa dapat penghasilan tambahan.",
      body: [
        "Jujur awalnya gue skeptis, tapi setelah coba ikut [nama platform] selama [X minggu], hasilnya bikin gue takjub sendiri.",
        "Yang gue pelajari: bikin konten itu gak harus sempurna. Yang penting konsisten dan tahu strateginya.",
      ],
      cta: "Kalau kamu mau mulai tapi bingung dari mana, link di bio ya.",
      link: "[link affiliate kamu]",
    },
    {
      id: `question-${format}-${platform}`,
      title: "Skrip Pertanyaan Pemancing",
      tags: ["Tinggi komentar", "Engagement bagus"],
      iconClass: "from-amber-500 to-orange-400",
      hook: "Kamu tahu gak, berapa banyak orang yang udah cuan dari TikTok tanpa tampil di kamera?",
      body: [
        "Ternyata banyak banget. Dan mereka pakai strategi yang sama: belajar format konten, upload rutin, lalu promosikan dengan halus.",
      ],
      cta: "Mau tahu caranya? Komen INFO di bawah, gue kirimin lewat DM.",
      link: "[siapkan link atau template DM kamu]",
    },
    {
      id: `story-${format}-${platform}`,
      title: "Skrip Cerita Orang Lain",
      tags: ["Relatable", "Tidak terkesan jualan"],
      iconClass: "from-emerald-500 to-green-400",
      hook: "Teman gue, ibu 2 anak, bisa dapat Rp[X] per bulan dari HP-nya.",
      body: [
        "Dia kerja dari rumah, gak harus keluar, gak perlu modal besar. Rahasianya? Dia konsisten belajar dari platform yang tepat.",
        "Gue ceritain karena gue sendiri juga lagi jalanin hal yang sama sekarang, dan hasilnya mulai kelihatan.",
      ],
      cta: "Info lengkapnya ada di link bio.",
      link: "[link affiliate kamu]",
    },
    {
      id: `soft-${format}-${platform}`,
      title: "Skrip Soft Selling Terselip",
      tags: ["Paling halus", "Tidak terkesan iklan"],
      iconClass: "from-rose-500 to-pink-400",
      hook: "Tips buat yang mau mulai bikin konten tapi takut gagal.",
      body: [
        "1. Gak perlu alat mahal, HP cukup.\n2. Gak perlu tampil, ada konten tanpa muka.\n3. Gak perlu viral dulu, yang penting konsisten.",
        "Kalau butuh panduan lengkapnya, gue lagi belajar di [nama platform], worth it banget buat pemula.",
      ],
      cta: "Link di bio kalau mau join bareng.",
      link: "[link affiliate kamu]",
    },
  ].map((script) => ({ ...script, tags: [context, ...script.tags].slice(0, 4) }));
}

function formatPromotionScript(script: PromotionScript) {
  return [script.hook, ...script.body, script.cta, script.link].join("\n\n");
}

function readSavedPromotionScripts(): PromotionScript[] {
  const raw = localStorage.getItem("buatcuan:saved-promotion-scripts");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
  } catch {
    return [];
  }
}

export { PromotionScriptTool };

