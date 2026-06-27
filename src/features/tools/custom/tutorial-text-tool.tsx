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
import { api, assetUrl, getErrorMessage, type MemberToolItemDto } from "@/lib/api";
import { slugify } from "../utils";
type TutorialCategory = {
  key: string;
  title: string;
};

type TutorialTemplate = {
  key: string;
  title: string;
  description: string;
  iconClass: string;
  preview: Array<{ label: string; text: string }>;
  tags: string[];
};

type TutorialResult = {
  id: string;
  title: string;
  category: string;
  template: string;
  steps: Array<{ title: string; body: string }>;
};

const tutorialCategories: TutorialCategory[] = [
  { key: "Masak & Resep", title: "Masak & Resep" },
  { key: "Kecantikan", title: "Kecantikan" },
  { key: "Produktivitas", title: "Produktivitas" },
  { key: "Bisnis Online", title: "Bisnis Online" },
  { key: "Konten TikTok", title: "Konten TikTok" },
  { key: "Keluarga", title: "Keluarga" },
];

const tutorialTemplates: TutorialTemplate[] = [
  {
    key: "step-by-step",
    title: "Langkah demi Langkah",
    description: "Format nomor urut, paling mudah diikuti",
    iconClass: "from-orange-500 to-amber-400",
    preview: [
      { label: "Langkah 1", text: "[Persiapan bahan]" },
      { label: "Langkah 2", text: "[Proses utama]" },
      { label: "Langkah 3", text: "[Finishing & hasil]" },
    ],
    tags: ["Mudah diikuti", "Cocok semua niche", "Paling viral"],
  },
  {
    key: "tips-singkat",
    title: "Tips & Trik Singkat",
    description: "3-5 poin cepat yang langsung bisa dipraktekkan",
    iconClass: "from-emerald-500 to-green-400",
    preview: [
      { label: "Tips #1", text: "[Hal pertama yang perlu tahu]" },
      { label: "Tips #2", text: "[Trik yang jarang orang tahu]" },
      { label: "Tips #3", text: "[Penutup yang actionable]" },
    ],
    tags: ["Cepat & padat", "Mudah diingat"],
  },
  {
    key: "problem-solution",
    title: "Masalah → Solusi",
    description: "Mulai dari masalah, akhiri dengan solusi",
    iconClass: "from-rose-500 to-pink-500",
    preview: [
      { label: "Masalah", text: "[Keluhan yang relatable]" },
      { label: "Kenapa", text: "[Penyebabnya]" },
      { label: "Solusi", text: "[Cara mengatasinya]" },
    ],
    tags: ["Engaging", "Bikin penasaran"],
  },
];

const tutorialAudiences = ["Ibu rumah tangga", "Pemula TikTok", "Karyawan sibuk", "Mahasiswa", "Owner kecil", "Creator pemula"] as const;
const tutorialStepLengths = ["Pendek · 1 kalimat (paling viral)", "Sedang · 2 kalimat", "Detail · 3 kalimat"] as const;

const TutorialTextTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(tutorialCategories[0].key);
  const [template, setTemplate] = useState(tutorialTemplates[0]);
  const [topic, setTopic] = useState("cara buat rendang ayam yang empuk");
  const [audience, setAudience] = useState<(typeof tutorialAudiences)[number]>("Ibu rumah tangga");
  const [stepCount, setStepCount] = useState(4);
  const [stepLength, setStepLength] = useState<(typeof tutorialStepLengths)[number]>("Pendek · 1 kalimat (paling viral)");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<TutorialResult>(() => buildTutorialResult("Masak & Resep", tutorialTemplates[0], "cara buat rendang ayam yang empuk", "Ibu rumah tangga", 4));
  const [savedTutorials, setSavedTutorials] = useState<TutorialResult[]>(() => readSavedTutorials());
  const { data } = useQuery({
    queryKey: ["tool", slug, "ide-teks-tutorial"],
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
      setResult(buildTutorialResult(category, template, topic, audience, stepCount));
      toast.success("Teks tutorial dibuat");
      void queryClient.invalidateQueries({ queryKey: ["tool", slug, "ide-teks-tutorial"] });
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal generate tutorial"));
    } finally {
      setGenerating(false);
    }
  };

  const copyTutorial = async () => {
    await navigator.clipboard.writeText(formatTutorialResult(result));
    toast.success("Tutorial disalin");
  };

  const saveTutorial = () => {
    const next = [result, ...savedTutorials.filter((item) => item.title !== result.title || item.template !== result.template)].slice(0, 30);
    setSavedTutorials(next);
    localStorage.setItem("buatcuan:saved-tutorial-texts", JSON.stringify(next));
    toast.success("Tutorial disimpan");
  };

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Teks Tutorial</h1>
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-extrabold text-accent">
              <Crown className="h-3.5 w-3.5" /> PRO
            </span>
          </div>
        </div>
      </div>

      <TutorialUsageCard />
      <TutorialProBanner locked={locked} />
      <TutorialExplainer />

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-orange-400">
          <ListChecks className="h-4 w-4" />
          <h2 className="font-extrabold text-foreground">Pilih Kategori</h2>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar">
          <div className="flex w-max gap-2">
            {tutorialCategories.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setCategory(item.key)}
                className={`h-10 shrink-0 rounded-full border px-4 text-xs font-extrabold transition-colors ${
                  category === item.key ? "border-orange-500 bg-orange-500 text-white" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Pilih Template</h2>
          <p className="text-xs font-semibold text-muted-foreground">{tutorialTemplates.length + 3} template tersedia</p>
        </div>
        <div className="space-y-3">
          {tutorialTemplates.map((item) => (
            <TutorialTemplateCard key={item.key} template={item} active={template.key === item.key} onClick={() => setTemplate(item)} />
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-orange-400">
          <Wand2 className="h-4 w-4" />
          <h2 className="font-extrabold text-foreground">Kustomisasi Template</h2>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-muted-foreground">Topik Tutorial</span>
          <Input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="h-12 rounded-xl border-border bg-secondary text-sm font-bold"
            placeholder="Contoh: cara buat rendang ayam yang empuk"
          />
        </label>
        <TutorialSelect label="Target Penonton" value={audience} values={tutorialAudiences} onChange={(value) => setAudience(value as typeof audience)} />
        <div>
          <p className="mb-2 text-sm font-bold text-muted-foreground">Jumlah Langkah</p>
          <div className="grid grid-cols-5 gap-2">
            {[3, 4, 5, 6, 7].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setStepCount(count)}
                className={`h-10 rounded-xl border text-sm font-extrabold transition-colors ${
                  stepCount === count ? "border-orange-500/50 bg-orange-500/20 text-orange-400" : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
        <TutorialSelect label="Panjang Teks per Langkah" value={stepLength} values={tutorialStepLengths} onChange={(value) => setStepLength(value as typeof stepLength)} />
        <Button type="button" onClick={generate} disabled={generating || locked} variant="outline" className="h-12 w-full rounded-xl font-extrabold disabled:opacity-50">
          <Wand2 className="mr-2 h-4 w-4" />
          {generating ? "Membuat Tutorial..." : "Generate Teks Tutorial"}
        </Button>
        {locked && (
          <Link to="/app/payment" className="block rounded-xl bg-accent/10 px-4 py-3 text-center text-sm font-extrabold text-accent">
            Buka PRO untuk generate unlimited
          </Link>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Hasil Teks Tutorial</h2>
          <button type="button" onClick={generate} disabled={generating || locked} className="text-xs font-extrabold text-orange-400 disabled:text-muted-foreground">Generate ulang</button>
        </div>
        <TutorialResultCard result={result} onCopy={copyTutorial} onSave={saveTutorial} onRegenerate={generate} generating={generating} locked={locked} />
      </section>

      <section className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-400">
            <Bookmark className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold">Tutorial Tersimpan</h2>
            <p className="text-xs font-semibold text-muted-foreground">Koleksi teks tutorial favorit kamu</p>
          </div>
          <span className="rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-extrabold text-sky-400">{savedTutorials.length} tutorial</span>
        </div>
        {savedTutorials.length > 0 && (
          <div className="mt-3 space-y-2">
            {savedTutorials.slice(0, 3).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(formatTutorialResult(item));
                  toast.success("Tutorial disalin");
                }}
                className="block w-full rounded-xl bg-background/55 p-3 text-left text-xs font-semibold text-muted-foreground"
              >
                <span className="font-extrabold text-sky-400">{item.title}</span> · {item.steps.length} langkah
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

function TutorialUsageCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app/tools/ide-teks-tutorial"
      className="border-orange-500/25"
      accentClassName="border-orange-400/50 bg-orange-500/15 text-orange-300"
      fallback={{
        title: "Cara Pakai Teks Tutorial BuatCuan",
        subtitle: "Pilih template, kustomisasi, langsung pakai",
        durationLabel: "2 menit",
        thumbnailGradient: "from-orange-950 via-stone-950 to-zinc-950",
      }}
    />
  );
}

function TutorialProBanner({ locked }: { locked: boolean }) {
  return (
    <section className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-accent">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15">
          <Crown className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold">Teks Tutorial Siap Pakai</h2>
          <p className="text-xs font-semibold text-muted-foreground">Pilih template · kustomisasi · langsung pakai</p>
        </div>
        <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl border border-accent/35 bg-background/30 text-center text-xs font-black leading-tight">
          ∞<br />Tanpa batas
        </span>
      </div>
      {locked && <p className="mt-3 text-xs font-extrabold">Akun FREE perlu upgrade untuk memakai generator ini.</p>}
    </section>
  );
}

function TutorialExplainer() {
  return (
    <section className="rounded-2xl border border-orange-500/35 bg-orange-500/10 p-4">
      <div className="mb-3 flex items-center gap-2 text-orange-400">
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Cara kerjanya simpel</h2>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
        Tutorial yang jelas & terstruktur bikin penonton tetap nonton sampai selesai. Semakin lama ditonton, semakin algoritma suka.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          ["1", "Pilih template"],
          ["2", "Isi topik & detail"],
          ["3", "Generate & pakai"],
        ].map(([number, label]) => (
          <div key={number} className="rounded-xl bg-background/45 p-3 text-center">
            <p className="text-lg font-black text-orange-400">{number}</p>
            <p className="mt-1 text-[10px] font-bold text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TutorialTemplateCard({ template, active, onClick }: { template: TutorialTemplate; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-2xl border bg-card p-4 text-left transition ${
        active ? "border-orange-500/60 bg-orange-500/10" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${template.iconClass} text-white`}>
          <ListChecks className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold">{template.title}</h3>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{template.description}</p>
        </div>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${active ? "border-orange-500 bg-orange-500 text-white" : "border-border"}`}>
          {active ? <ClipboardCheck className="h-3.5 w-3.5" /> : null}
        </span>
      </div>
      <div className="mt-4 rounded-xl bg-background/55 p-3">
        {template.preview.map((item) => (
          <p key={item.label} className="text-xs font-semibold leading-relaxed text-muted-foreground">
            <span className="font-extrabold text-orange-400">{item.label}:</span> {item.text}
          </p>
        ))}
        <div className="mt-3 flex flex-wrap gap-2">
          {template.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-orange-500/15 px-2.5 py-1 text-[10px] font-extrabold text-orange-400">{tag}</span>
          ))}
        </div>
      </div>
    </button>
  );
}

function TutorialSelect({ label, value, values, onChange }: { label: string; value: string; values: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-muted-foreground">{label}</span>
      <PremiumSearchSelect
        value={value}
        onChange={onChange}
        placeholder={`Pilih ${label}`}
        options={values.map((item) => ({ label: item, value: item }))}
        triggerClassName="focus-visible:ring-orange-500/30"
      />
    </label>
  );
}

function TutorialResultCard({
  result,
  onCopy,
  onSave,
  onRegenerate,
  generating,
  locked,
}: {
  result: TutorialResult;
  onCopy: () => void;
  onSave: () => void;
  onRegenerate: () => void;
  generating: boolean;
  locked: boolean;
}) {
  return (
    <article className={`rounded-2xl border border-orange-500/45 bg-orange-500/10 p-4 ${locked ? "opacity-60" : ""}`}>
      <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-lg bg-orange-500/15 px-3 py-1.5 text-xs font-extrabold text-orange-400">
        <ListChecks className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{result.title} · {result.template}</span>
      </div>
      <div className="space-y-3">
        {result.steps.map((step, index) => (
          <div key={`${step.title}-${index}`} className="grid grid-cols-[28px_1fr] gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-500/20 text-sm font-black text-orange-400">{index + 1}</span>
            <p className="text-sm font-semibold leading-relaxed">
              <span className="font-extrabold text-orange-400">{step.title}:</span> {step.body}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <Button type="button" variant="outline" onClick={onCopy} disabled={locked} className="h-11 rounded-xl font-extrabold disabled:opacity-50">
          <Copy className="mr-2 h-4 w-4" /> Salin
        </Button>
        <Button type="button" variant="outline" onClick={onSave} disabled={locked} className="h-11 rounded-xl font-extrabold disabled:opacity-50">
          <Bookmark className="mr-2 h-4 w-4" /> Simpan
        </Button>
        <Button type="button" variant="outline" onClick={onRegenerate} disabled={generating || locked} className="h-11 rounded-xl font-extrabold disabled:opacity-50">
          <Wand2 className="mr-2 h-4 w-4" /> {generating ? "..." : "Ulang"}
        </Button>
      </div>
    </article>
  );
}

function buildTutorialResult(category: string, template: TutorialTemplate, topic: string, audience: string, stepCount: number): TutorialResult {
  const cleanedTopic = topic.trim() || "cara bikin konten tutorial";
  const title = titleCase(cleanedTopic.replace(/^cara\s+/i, ""));
  const baseSteps = template.key === "problem-solution"
    ? [
        { title: "Masalah", body: `${audience} sering bingung mulai dari mana saat ingin ${cleanedTopic}.` },
        { title: "Penyebab", body: "Biasanya karena langkahnya terlalu banyak, alat belum siap, atau takut hasilnya kurang rapi." },
        { title: "Solusi Utama", body: "Pecah proses jadi langkah kecil, mulai dari bagian paling mudah, lalu cek hasilnya sebelum lanjut." },
        { title: "Praktek", body: "Coba satu versi sederhana dulu supaya kamu tahu bagian mana yang perlu diperbaiki." },
        { title: "Evaluasi", body: "Catat hasilnya, simpan yang berhasil, lalu ulangi pola yang paling mudah dikerjakan." },
        { title: "Konsisten", body: "Jangan ganti cara terlalu cepat sebelum kamu punya data dari beberapa percobaan." },
        { title: "Penutup", body: "Kalau mau hasilnya stabil, ulangi proses ini sampai jadi kebiasaan." },
      ]
    : template.key === "tips-singkat"
      ? [
          { title: "Mulai simpel", body: `Pilih satu bagian dari ${cleanedTopic} yang paling gampang dilakukan dulu.` },
          { title: "Siapkan bahan", body: "Taruh semua kebutuhan di depan supaya prosesnya tidak putus di tengah jalan." },
          { title: "Pakai patokan", body: "Gunakan ukuran, waktu, atau checklist kecil supaya hasilnya lebih konsisten." },
          { title: "Cek hasil", body: "Bandingkan hasil akhir dengan tujuan awal, lalu perbaiki satu hal saja." },
          { title: "Simpan pola", body: "Kalau sudah cocok, jadikan template untuk dipakai lagi nanti." },
          { title: "Bikin versi cepat", body: "Ubah proses panjang jadi ringkasan yang mudah diulang oleh penonton." },
          { title: "Ajak praktek", body: "Tutup dengan ajakan mencoba langkah paling mudah hari ini." },
        ]
      : [
          { title: "Siapkan bahan", body: `Untuk ${cleanedTopic}, siapkan kebutuhan utama dulu agar prosesnya lebih rapi.` },
          { title: "Mulai proses", body: "Kerjakan bagian inti pelan-pelan dan jangan lompat ke finishing sebelum tahap utama beres." },
          { title: "Masukkan detail", body: "Tambahkan detail penting sesuai kebutuhan supaya hasilnya lebih kuat dan tidak asal jadi." },
          { title: "Finishing", body: "Rapikan hasil akhir, cek bagian yang kurang, lalu sajikan dengan tampilan yang menarik." },
          { title: "Cek ulang", body: "Pastikan semua langkah sudah sesuai sebelum dibagikan atau dipakai ulang." },
          { title: "Buat variasi", body: "Kalau hasil pertama sudah bagus, bikin versi lain untuk kebutuhan konten berikutnya." },
          { title: "Simpan template", body: "Catat urutannya agar proses berikutnya lebih cepat dan konsisten." },
        ];

  return {
    id: crypto.randomUUID(),
    title,
    category,
    template: template.title,
    steps: baseSteps.slice(0, stepCount),
  };
}

function formatTutorialResult(result: TutorialResult) {
  return [
    `${result.title} - ${result.template}`,
    ...result.steps.map((step, index) => `${index + 1}. ${step.title}: ${step.body}`),
  ].join("\n");
}

function readSavedTutorials(): TutorialResult[] {
  const raw = localStorage.getItem("buatcuan:saved-tutorial-texts");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
  } catch {
    return [];
  }
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export { TutorialTextTool };

