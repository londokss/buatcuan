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
type RecipeTemplate = {
  key: string;
  title: string;
  description: string;
  iconClass: string;
  preview: Array<{ label: string; text: string }>;
  tags: string[];
};

type RecipeResult = {
  id: string;
  title: string;
  category: string;
  template: string;
  portion: string;
  ingredients: string[];
  steps: Array<{ title: string; body: string }>;
  secretTip: string;
};

const recipeCategories = [
  "Masakan Rumahan",
  "Camilan & Jajanan",
  "Minuman Viral",
  "Masakan Diet",
  "Masakan Anak",
  "Kue & Dessert",
  "Masakan Mewah",
] as const;

const recipeTemplates: RecipeTemplate[] = [
  {
    key: "complete",
    title: "Resep Lengkap",
    description: "Bahan + cara masak + tips, paling detail",
    iconClass: "from-red-500 to-rose-400",
    preview: [
      { label: "Bahan", text: "[daftar bahan lengkap]" },
      { label: "Cara masak", text: "[langkah demi langkah]" },
      { label: "Tips rahasia", text: "[trik agar lebih enak]" },
    ],
    tags: ["Paling lengkap", "Watch time tinggi"],
  },
  {
    key: "quick",
    title: "Resep Cepat 15 Menit",
    description: "Simple, cepat, bahan mudah dicari",
    iconClass: "from-amber-500 to-yellow-400",
    preview: [
      { label: "Bahan (5 bahan saja)", text: "[bahan minimal]" },
      { label: "Cara", text: "[maks 3 langkah simpel]" },
      { label: "Selesai dalam", text: "±15 menit" },
    ],
    tags: ["Simpel & cepat", "Cocok pemula"],
  },
  {
    key: "budget",
    title: "Resep Hemat & Bergizi",
    description: "Budget-friendly, cocok untuk keluarga",
    iconClass: "from-emerald-500 to-green-400",
    preview: [
      { label: "Budget", text: "[estimasi harga bahan]" },
      { label: "Bahan", text: "[bahan murah & mudah]" },
      { label: "Nilai gizi", text: "[kandungan nutrisi]" },
    ],
    tags: ["Hemat", "Keluarga"],
  },
  {
    key: "viral",
    title: "Resep Viral Kekinian",
    description: "Tren masakan yang lagi rame di TikTok",
    iconClass: "from-yellow-500 to-lime-400",
    preview: [
      { label: "Viral karena", text: "[kenapa resep ini trending]" },
      { label: "Bahan", text: "[bahan unik/kekinian]" },
      { label: "Cara", text: "[langkah yang aesthetic]" },
    ],
    tags: ["Trending", "Paling banyak dicari"],
  },
];

const recipePortions = ["1-2", "3-4", "5-6", "Banyak"] as const;
const recipeDifficulties = ["Mudah", "Sedang", "Sulit"] as const;
const recipeStyles = ["Santai & ramah (paling viral)", "Detail seperti chef", "Singkat untuk caption", "Hangat untuk keluarga"] as const;

const RecipeTextTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<(typeof recipeCategories)[number]>("Masakan Rumahan");
  const [template, setTemplate] = useState(recipeTemplates[0]);
  const [dishName, setDishName] = useState("Ayam Geprek Sambal Bawang");
  const [portion, setPortion] = useState<(typeof recipePortions)[number]>("3-4");
  const [difficulty, setDifficulty] = useState<(typeof recipeDifficulties)[number]>("Mudah");
  const [style, setStyle] = useState<(typeof recipeStyles)[number]>("Santai & ramah (paling viral)");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<RecipeResult>(() => buildRecipeResult("Masakan Rumahan", recipeTemplates[0], "Ayam Geprek Sambal Bawang", "3-4", "Mudah"));
  const [savedRecipes, setSavedRecipes] = useState<RecipeResult[]>(() => readSavedRecipes());
  const { data } = useQuery({
    queryKey: ["tool", slug, "ide-teks-resep-masakan"],
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
      setResult(buildRecipeResult(category, template, dishName, portion, difficulty));
      toast.success("Resep baru dibuat");
      void queryClient.invalidateQueries({ queryKey: ["tool", slug, "ide-teks-resep-masakan"] });
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal generate resep"));
    } finally {
      setGenerating(false);
    }
  };

  const copyRecipe = async () => {
    await navigator.clipboard.writeText(formatRecipeResult(result));
    toast.success("Resep disalin");
  };

  const saveRecipe = () => {
    const next = [result, ...savedRecipes.filter((item) => item.title !== result.title || item.template !== result.template)].slice(0, 30);
    setSavedRecipes(next);
    localStorage.setItem("buatcuan:saved-recipe-texts", JSON.stringify(next));
    toast.success("Resep disimpan");
  };

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Teks Resep</h1>
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-extrabold text-accent">
              <Crown className="h-3.5 w-3.5" /> PRO
            </span>
          </div>
        </div>
      </div>

      <RecipeUsageCard />
      <RecipeProBanner locked={locked} />
      <RecipeExplainer />

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-red-400">
          <Utensils className="h-4 w-4" />
          <h2 className="font-extrabold text-foreground">Kategori Masakan</h2>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar">
          <div className="flex w-max gap-2">
            {recipeCategories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`h-10 shrink-0 rounded-full border px-4 text-xs font-extrabold transition-colors ${
                  category === item ? "border-red-500 bg-red-500 text-white" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Pilih Template Resep</h2>
          <p className="text-xs font-semibold text-muted-foreground">{recipeTemplates.length} template</p>
        </div>
        <div className="space-y-3">
          {recipeTemplates.map((item) => (
            <RecipeTemplateCard key={item.key} template={item} active={template.key === item.key} onClick={() => setTemplate(item)} />
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-red-400">
          <Wand2 className="h-4 w-4" />
          <h2 className="font-extrabold text-foreground">Kustomisasi Resep</h2>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-muted-foreground">Nama Masakan</span>
          <Input
            value={dishName}
            onChange={(event) => setDishName(event.target.value)}
            className="h-12 rounded-xl border-border bg-secondary text-sm font-bold"
            placeholder="Contoh: Ayam Geprek Sambal Bawang"
          />
        </label>
        <div>
          <p className="mb-2 text-sm font-bold text-muted-foreground">Jumlah Porsi</p>
          <div className="grid grid-cols-4 gap-2">
            {recipePortions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPortion(item)}
                className={`h-10 rounded-xl border text-xs font-extrabold transition-colors ${
                  portion === item ? "border-red-500/50 bg-red-500/20 text-red-400" : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold text-muted-foreground">Tingkat Kesulitan</p>
          <div className="grid grid-cols-3 gap-2">
            {recipeDifficulties.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDifficulty(item)}
                className={`h-10 rounded-xl border text-xs font-extrabold transition-colors ${
                  difficulty === item ? "border-red-500/50 bg-red-500/20 text-red-400" : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <RecipeSelect label="Gaya Bahasa" value={style} values={recipeStyles} onChange={(value) => setStyle(value as typeof style)} />
        <Button type="button" onClick={generate} disabled={generating || locked} variant="outline" className="h-12 w-full rounded-xl font-extrabold disabled:opacity-50">
          <Wand2 className="mr-2 h-4 w-4" />
          {generating ? "Membuat Resep..." : "Generate Resep Sekarang"}
        </Button>
        {locked && (
          <Link to="/app/payment" className="block rounded-xl bg-accent/10 px-4 py-3 text-center text-sm font-extrabold text-accent">
            Buka PRO untuk generate resep unlimited
          </Link>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Hasil Resep</h2>
          <button type="button" onClick={generate} disabled={generating || locked} className="text-xs font-extrabold text-red-400 disabled:text-muted-foreground">Generate ulang</button>
        </div>
        <RecipeResultCard result={result} onCopy={copyRecipe} onSave={saveRecipe} onRegenerate={generate} generating={generating} locked={locked} />
      </section>

      <section className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-400">
            <Bookmark className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold">Resep Tersimpan</h2>
            <p className="text-xs font-semibold text-muted-foreground">Koleksi resep favorit kamu</p>
          </div>
          <span className="rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-extrabold text-sky-400">{savedRecipes.length} resep</span>
        </div>
        {savedRecipes.length > 0 && (
          <div className="mt-3 space-y-2">
            {savedRecipes.slice(0, 3).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(formatRecipeResult(item));
                  toast.success("Resep disalin");
                }}
                className="block w-full rounded-xl bg-background/55 p-3 text-left text-xs font-semibold text-muted-foreground"
              >
                <span className="font-extrabold text-sky-400">{item.title}</span> · {item.portion} porsi
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

function RecipeUsageCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app/tools/ide-teks-resep-masakan"
      className="border-red-500/25"
      accentClassName="border-red-400/50 bg-red-500/15 text-red-300"
      fallback={{
        title: "Cara Pakai Teks Resep BuatCuan",
        subtitle: "Pilih template resep, isi nama masakan, langsung pakai",
        durationLabel: "2 menit",
        thumbnailGradient: "from-red-950 via-orange-950 to-zinc-950",
      }}
    />
  );
}

function RecipeProBanner({ locked }: { locked: boolean }) {
  return (
    <section className="rounded-2xl border border-red-500/35 bg-red-500/10 p-4 text-red-400">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500/15">
          <Utensils className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold">Resep Viral dari AI + Web</h2>
          <p className="text-xs font-semibold text-muted-foreground">Bahan · cara masak · tips rahasia · siap pakai</p>
        </div>
        <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl border border-accent/35 bg-accent/10 text-center text-xs font-black leading-tight text-accent">
          ∞<br />Tanpa batas
        </span>
      </div>
      {locked && <p className="mt-3 text-xs font-extrabold">Akun FREE perlu upgrade untuk memakai generator ini.</p>}
    </section>
  );
}

function RecipeExplainer() {
  return (
    <section className="rounded-2xl border border-red-500/35 bg-red-500/10 p-4">
      <div className="mb-3 flex items-center gap-2 text-red-400">
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Kenapa konten resep selalu viral?</h2>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
        Resep adalah konten yang selalu dicari. Ibu rumah tangga, anak kos, sampai chef amatir semua nonton.
        Konten resep punya watch time tinggi karena orang nonton sampai selesai buat nyimak caranya.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          ["1", "Pilih template"],
          ["2", "Isi nama masakan"],
          ["3", "Generate & pakai"],
        ].map(([number, label]) => (
          <div key={number} className="rounded-xl bg-background/45 p-3 text-center">
            <p className="text-lg font-black text-red-400">{number}</p>
            <p className="mt-1 text-[10px] font-bold text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecipeTemplateCard({ template, active, onClick }: { template: RecipeTemplate; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-2xl border bg-card p-4 text-left transition ${
        active ? "border-red-500/60 bg-red-500/10" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${template.iconClass} text-white`}>
          <Utensils className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold">{template.title}</h3>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{template.description}</p>
        </div>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${active ? "border-red-500 bg-red-500 text-white" : "border-border"}`}>
          {active ? <ClipboardCheck className="h-3.5 w-3.5" /> : null}
        </span>
      </div>
      <div className="mt-4 rounded-xl bg-background/55 p-3">
        {template.preview.map((item) => (
          <p key={item.label} className="text-xs font-semibold leading-relaxed text-muted-foreground">
            <span className="font-extrabold text-red-400">{item.label}:</span> {item.text}
          </p>
        ))}
        <div className="mt-3 flex flex-wrap gap-2">
          {template.tags.map((tag, index) => (
            <span key={tag} className={`rounded-md px-2.5 py-1 text-[10px] font-extrabold ${index % 2 ? "bg-sky-500/15 text-sky-400" : "bg-red-500/15 text-red-400"}`}>{tag}</span>
          ))}
        </div>
      </div>
    </button>
  );
}

function RecipeSelect({ label, value, values, onChange }: { label: string; value: string; values: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-muted-foreground">{label}</span>
      <PremiumSearchSelect
        value={value}
        onChange={onChange}
        placeholder={`Pilih ${label}`}
        options={values.map((item) => ({ label: item, value: item }))}
        triggerClassName="focus-visible:ring-red-500/30"
      />
    </label>
  );
}

function RecipeResultCard({
  result,
  onCopy,
  onSave,
  onRegenerate,
  generating,
  locked,
}: {
  result: RecipeResult;
  onCopy: () => void;
  onSave: () => void;
  onRegenerate: () => void;
  generating: boolean;
  locked: boolean;
}) {
  return (
    <article className={`rounded-2xl border border-red-500/45 bg-red-500/10 p-4 ${locked ? "opacity-60" : ""}`}>
      <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-extrabold text-red-400">
        <Utensils className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{result.title} · {result.template} · {result.portion} Porsi</span>
      </div>

      <div className="space-y-5">
        <section>
          <div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
            <ClipboardList className="h-3.5 w-3.5" /> Bahan-bahan
          </div>
          <ul className="space-y-1.5 rounded-xl bg-background/55 p-3">
            {result.ingredients.map((ingredient) => (
              <li key={ingredient} className="flex gap-2 text-sm font-semibold leading-relaxed">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {ingredient}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
            <ListChecks className="h-3.5 w-3.5" /> Cara Masak
          </div>
          <div className="space-y-3">
            {result.steps.map((step, index) => (
              <div key={`${step.title}-${index}`} className="grid grid-cols-[28px_1fr] gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-500/20 text-sm font-black text-red-400">{index + 1}</span>
                <p className="text-sm font-semibold leading-relaxed">
                  <span className="font-extrabold text-red-400">{step.title}:</span> {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-accent/35 bg-accent/10 p-3">
          <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
            <span className="font-extrabold text-accent">Tips rahasia:</span> {result.secretTip}
          </p>
        </section>
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

function buildRecipeResult(category: string, template: RecipeTemplate, dishName: string, portion: string, difficulty: string): RecipeResult {
  const title = titleCase(dishName.trim() || "Ayam Geprek Sambal Bawang");
  const isDrink = category === "Minuman Viral";
  const isDessert = category === "Kue & Dessert";
  const isDiet = category === "Masakan Diet";
  const baseIngredients = isDrink
    ? ["Susu cair 250ml", "Es batu secukupnya", "Gula aren 2 sdm", "Creamer 1 sdm", "Topping sesuai selera"]
    : isDessert
      ? ["Tepung terigu 200gr", "Gula pasir 100gr", "Telur 2 butir", "Mentega cair 80gr", "Vanila secukupnya"]
      : isDiet
        ? ["Dada ayam 250gr", "Sayuran hijau 1 mangkuk", "Bawang putih 2 siung", "Olive oil 1 sdt", "Garam dan lada secukupnya"]
        : ["Ayam potong 1/2 ekor, cuci bersih", "Tepung bumbu serbaguna 150gr", "Bawang putih 6 siung", "Cabai rawit merah 20 buah (sesuai selera)", "Minyak goreng secukupnya"];

  const quickSteps = [
    { title: "Siapkan", body: `Siapkan semua bahan untuk ${title.toLowerCase()} agar proses masak tidak putus di tengah.` },
    { title: "Masak cepat", body: isDrink ? "Campur bahan utama, blender sampai halus, lalu koreksi manisnya." : "Masak bahan utama dengan api sedang sampai matang dan aromanya keluar." },
    { title: "Sajikan", body: "Pindahkan ke piring atau gelas saji, tambah topping, lalu sajikan selagi fresh." },
  ];
  const fullSteps = [
    { title: "Marinasi", body: isDrink ? "Dinginkan bahan cair terlebih dahulu supaya rasa akhirnya lebih segar." : "Bumbui bahan utama, diamkan 10-15 menit biar rasa lebih meresap." },
    { title: "Masak bahan", body: isDrink ? "Campur bahan dasar dan aduk sampai gula larut merata." : "Masak bahan utama sampai matang, harum, dan teksturnya sesuai." },
    { title: "Buat rasa utama", body: isDrink ? "Tambahkan topping atau sirup, lalu aduk perlahan agar lapisannya tetap cantik." : "Ulek atau tumis bumbu utama sampai wangi, lalu koreksi garam dan gula." },
    { title: "Finishing", body: isDrink ? "Tuang ke gelas berisi es, beri topping, dan langsung sajikan." : "Campurkan semua bagian, aduk rata, lalu sajikan hangat biar rasanya maksimal." },
  ];
  const budgetSteps = [
    { title: "Pilih bahan", body: "Gunakan bahan yang mudah dicari dan bisa dibeli di warung sekitar rumah." },
    { title: "Masak hemat", body: "Masak dengan api sedang supaya bahan matang merata tanpa boros minyak atau gas." },
    { title: "Tambah nutrisi", body: "Tambahkan sayur, telur, atau protein sederhana agar tetap bergizi." },
    { title: "Sajikan", body: "Bagi sesuai porsi supaya lebih hemat dan tetap mengenyangkan." },
  ];
  const viralSteps = [
    { title: "Bikin opening", body: `Tampilkan hasil akhir ${title.toLowerCase()} dulu supaya penonton langsung penasaran.` },
    { title: "Close up bahan", body: "Ambil shot bahan utama dari dekat, terutama bagian warna dan teksturnya." },
    { title: "Masak aesthetic", body: "Rekam proses yang paling satisfying seperti tuang saus, goreng kriuk, atau aduk creamy." },
    { title: "Final shot", body: "Sajikan dengan angle dekat dan tambah teks singkat yang bikin orang ingin coba." },
  ];

  const steps = template.key === "quick" ? quickSteps : template.key === "budget" ? budgetSteps : template.key === "viral" ? viralSteps : fullSteps;
  const secretTip = difficulty === "Sulit"
    ? "Masak dengan api stabil dan jangan buru-buru di tahap finishing. Bagian ini yang paling menentukan tekstur akhir."
    : template.key === "viral"
      ? "Ambil video final sebelum makanan disentuh. Shot pertama yang menggoda biasanya paling kuat buat retention."
      : "Tambahkan 1 sdm air jeruk nipis atau sedikit gula di akhir untuk bikin rasa lebih hidup tanpa terasa berlebihan.";

  return {
    id: crypto.randomUUID(),
    title,
    category,
    template: template.title,
    portion,
    ingredients: baseIngredients,
    steps,
    secretTip,
  };
}

function formatRecipeResult(result: RecipeResult) {
  return [
    `${result.title} - ${result.template} - ${result.portion} porsi`,
    "",
    "Bahan-bahan:",
    ...result.ingredients.map((item) => `- ${item}`),
    "",
    "Cara Masak:",
    ...result.steps.map((step, index) => `${index + 1}. ${step.title}: ${step.body}`),
    "",
    `Tips rahasia: ${result.secretTip}`,
  ].join("\n");
}

function readSavedRecipes(): RecipeResult[] {
  const raw = localStorage.getItem("buatcuan:saved-recipe-texts");
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

export { RecipeTextTool };

