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
type BioNameTab = "bio" | "name";

type BioProfileItem = {
  id: string;
  niche: string;
  persona: string;
  tags: string[];
  icon: string;
  bio: string[];
  badge?: string;
};

type AccountNameItem = {
  id: string;
  niche: string;
  style: string;
  names: string[];
  tags: string[];
  badge?: string;
};

const bioNameNiches = ["Jualan Online", "Masak", "Motivasi", "Kecantikan", "Parenting", "Lifestyle", "Affiliate"] as const;
const bioStyles = ["Hangat & personal (paling cocok IRT)", "Profesional & singkat", "Semangat & motivatif", "Relatable & santai"] as const;
const bioPlatforms = ["TikTok", "Instagram", "YouTube", "Facebook"] as const;

const BioNameBankTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<BioNameTab>("bio");
  const [niche, setNiche] = useState<(typeof bioNameNiches)[number]>("Jualan Online");
  const [about, setAbout] = useState("ibu 2 anak, suka masak, mau mulai cuan dari rumah");
  const [style, setStyle] = useState<(typeof bioStyles)[number]>("Hangat & personal (paling cocok IRT)");
  const [platform, setPlatform] = useState<(typeof bioPlatforms)[number]>("TikTok");
  const [generating, setGenerating] = useState(false);
  const [customBio, setCustomBio] = useState<BioProfileItem | null>(null);
  const [savedItems, setSavedItems] = useState<Array<BioProfileItem | AccountNameItem>>(() => readSavedBioNames());
  const { data } = useQuery({
    queryKey: ["tool", slug, "bank-bio-nama-akun"],
    queryFn: () => api.tools.detail(slug, { category: "ALL" }),
  });

  const locked = Boolean(data?.tool.isLocked);
  const bioItems = useMemo(() => {
    const items = buildBioItems(niche);
    return customBio && customBio.niche === niche ? [customBio, ...items] : items;
  }, [niche, customBio]);
  const nameItems = useMemo(() => buildAccountNameItems(niche), [niche]);

  const copyBio = async (item: BioProfileItem) => {
    if (locked) {
      toast.error("Tool ini khusus PRO member");
      return;
    }
    await navigator.clipboard.writeText(item.bio.join("\n"));
    toast.success("Bio disalin");
  };

  const copyNames = async (item: AccountNameItem) => {
    if (locked) {
      toast.error("Tool ini khusus PRO member");
      return;
    }
    await navigator.clipboard.writeText(item.names.join("\n"));
    toast.success("Nama akun disalin");
  };

  const saveItem = (item: BioProfileItem | AccountNameItem) => {
    const next = [item, ...savedItems.filter((saved) => saved.id !== item.id)].slice(0, 40);
    setSavedItems(next);
    localStorage.setItem("buatcuan:saved-bio-names", JSON.stringify(next));
    toast.success("Bio & nama disimpan");
  };

  const generateCustom = async () => {
    if (locked) {
      toast.error("Tool ini khusus PRO member");
      return;
    }
    try {
      setGenerating(true);
      await api.tools.use(slug);
      setCustomBio(buildCustomBio(niche, about, style, platform));
      setTab("bio");
      toast.success("Bio custom dibuat");
      void queryClient.invalidateQueries({ queryKey: ["tool", slug, "bank-bio-nama-akun"] });
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal generate bio"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Bank Bio & Nama Akun</h1>
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-extrabold text-accent">
              <Crown className="h-3.5 w-3.5" /> PRO
            </span>
          </div>
        </div>
      </div>

      <BioNameUsageCard />
      <BioNameProBanner locked={locked} />
      <BioNameExplainer />

      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card">
        <button type="button" onClick={() => setTab("bio")} className={`h-12 text-sm font-extrabold ${tab === "bio" ? "bg-violet-500/20 text-violet-400 ring-2 ring-inset ring-violet-500/45" : "text-muted-foreground"}`}>
          Bio Profil
        </button>
        <button type="button" onClick={() => setTab("name")} className={`h-12 text-sm font-extrabold ${tab === "name" ? "bg-violet-500/20 text-violet-400 ring-2 ring-inset ring-violet-500/45" : "text-muted-foreground"}`}>
          Nama Akun
        </button>
      </div>

      <section className="space-y-3">
        <p className="text-sm font-bold text-muted-foreground">Pilih Niche</p>
        <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar">
          <div className="flex w-max gap-2">
            {bioNameNiches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setNiche(item)}
                className={`h-10 shrink-0 rounded-full border px-4 text-xs font-extrabold transition-colors ${
                  niche === item ? "border-violet-500/60 bg-violet-500/15 text-violet-400" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {tab === "bio" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-extrabold">Bio Profil · {niche}</h2>
            <p className="text-xs font-semibold text-muted-foreground">{bioItems.length * 4} bio tersedia</p>
          </div>
          <ShowMoreList
            items={bioItems}
            initial={3}
            step={3}
            className="space-y-3"
            renderItem={(item) => (
              <BioProfileCard key={item.id} item={item} onCopy={() => copyBio(item)} onSave={() => saveItem(item)} locked={locked} />
            )}
          />
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-extrabold">Nama Akun · {niche}</h2>
            <p className="text-xs font-semibold text-muted-foreground">{nameItems.length * 4} nama tersedia</p>
          </div>
          <ShowMoreList
            items={nameItems}
            initial={2}
            step={2}
            className="space-y-3"
            renderItem={(item) => (
              <AccountNameCard key={item.id} item={item} onCopy={() => copyNames(item)} onSave={() => saveItem(item)} locked={locked} />
            )}
          />
        </section>
      )}

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-violet-400">
          <Wand2 className="h-4 w-4" />
          <h2 className="font-extrabold text-foreground">Generate Bio & Nama Custom</h2>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-muted-foreground">Ceritakan sedikit tentang dirimu</span>
          <Input
            value={about}
            onChange={(event) => setAbout(event.target.value)}
            className="h-12 rounded-xl border-border bg-secondary text-sm font-bold"
            placeholder="Contoh: ibu 2 anak, suka masak, mau mulai cuan"
          />
        </label>
        <BioNameSelect label="Gaya bio yang diinginkan" value={style} values={bioStyles} onChange={(value) => setStyle(value as typeof style)} />
        <BioNameSelect label="Platform tujuan" value={platform} values={bioPlatforms} onChange={(value) => setPlatform(value as typeof platform)} />
        <Button type="button" onClick={generateCustom} disabled={generating || locked} variant="outline" className="h-12 w-full rounded-xl font-extrabold disabled:opacity-50">
          <Wand2 className="mr-2 h-4 w-4" />
          {generating ? "Membuat Bio..." : "Generate Bio & Nama Untukku"}
        </Button>
        {locked && (
          <Link to="/app/payment" className="block rounded-xl bg-accent/10 px-4 py-3 text-center text-sm font-extrabold text-accent">
            Buka PRO untuk bank bio & nama akun
          </Link>
        )}
      </section>

      <section className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-400">
            <Bookmark className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold">Bio & Nama Tersimpan</h2>
            <p className="text-xs font-semibold text-muted-foreground">Koleksi bio & nama favorit kamu</p>
          </div>
          <span className="rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-extrabold text-sky-400">{savedItems.length} bio</span>
        </div>
      </section>
    </div>
  );
};

function BioNameUsageCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app/tools/bank-bio-nama-akun"
      className="border-violet-500/25"
      accentClassName="border-violet-400/50 bg-violet-500/15 text-violet-300"
      fallback={{
        title: "Cara Pakai Bank Bio & Nama Akun BuatCuan",
        subtitle: "Cara pilih bio & nama yang bikin orang langsung follow",
        durationLabel: "3 menit",
        thumbnailGradient: "from-indigo-950 via-violet-950 to-rose-950",
      }}
    />
  );
}

function BioNameProBanner({ locked }: { locked: boolean }) {
  return (
    <section className="rounded-2xl border border-violet-500/35 bg-violet-500/10 p-4 text-violet-400">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/15">
          <Type className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold">Bio & Nama Akun Siap Pakai per Niche</h2>
          <p className="text-xs font-semibold text-muted-foreground">Sudah terbukti menarik · tinggal pilih & pakai</p>
        </div>
        <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl border border-accent/35 bg-accent/10 text-center text-xs font-black leading-tight text-accent">
          ∞<br />Tanpa batas
        </span>
      </div>
      {locked && <p className="mt-3 text-xs font-extrabold">Akun FREE perlu upgrade untuk memakai bank bio ini.</p>}
    </section>
  );
}

function BioNameExplainer() {
  return (
    <section className="rounded-2xl border border-violet-500/35 bg-violet-500/10 p-4">
      <div className="mb-3 flex items-center gap-2 text-violet-400">
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Kenapa bio & nama itu penting?</h2>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
        Bio & nama akun adalah kesan pertama. Orang memutuskan follow atau tidak dalam 3 detik.
        Bio yang bagus langsung bilang siapa kamu, untuk siapa, dan apa manfaatnya.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          ["⏱", "Keputusan follow", "3 detik"],
          ["📝", "Maks karakter bio", "80 karakter"],
          ["🎯", "Formula bio", "Siapa+Untuk+Manfaat"],
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

function BioProfileCard({ item, onCopy, onSave, locked }: { item: BioProfileItem; onCopy: () => void; onSave: () => void; locked: boolean }) {
  return (
    <article className={`relative rounded-2xl border bg-card p-4 ${item.badge ? "border-violet-500/50 bg-violet-500/10" : "border-border"} ${locked ? "opacity-60" : ""}`}>
      {item.badge && <span className="absolute -top-3 left-4 rounded-md bg-violet-500 px-3 py-1 text-[11px] font-extrabold text-white">{item.badge}</span>}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
          <span>{item.icon}</span> {item.niche} · {item.persona}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {item.tags.slice(0, 2).map((tag, index) => (
            <span key={tag} className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${index % 2 ? "bg-primary/15 text-primary" : "bg-violet-500/15 text-violet-400"}`}>{tag}</span>
          ))}
        </div>
      </div>
      <MockProfile bio={item.bio} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={onCopy} disabled={locked} className="h-11 rounded-xl font-extrabold disabled:opacity-50">
          <Copy className="mr-2 h-4 w-4" /> Salin Bio Ini
        </Button>
        <Button type="button" variant="outline" onClick={onSave} disabled={locked} className="h-11 rounded-xl font-extrabold disabled:opacity-50">
          <Bookmark className="mr-2 h-4 w-4" /> Simpan
        </Button>
      </div>
    </article>
  );
}

function MockProfile({ bio }: { bio: string[] }) {
  return (
    <div className="rounded-2xl bg-background/55 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-500/20 text-violet-400">
          <Type className="h-5 w-5" />
        </span>
        <div>
          <p className="font-extrabold">Nama Akun Kamu</p>
          <p className="text-sm font-semibold text-muted-foreground">@usernamekamu</p>
        </div>
      </div>
      <div className="mt-4 space-y-1 text-sm font-semibold leading-relaxed">
        {bio.map((line) => <p key={line}>{line}</p>)}
      </div>
    </div>
  );
}

function AccountNameCard({ item, onCopy, onSave, locked }: { item: AccountNameItem; onCopy: () => void; onSave: () => void; locked: boolean }) {
  return (
    <article className={`rounded-2xl border bg-card p-4 ${item.badge ? "border-violet-500/50 bg-violet-500/10" : "border-border"} ${locked ? "opacity-60" : ""}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold">{item.style}</h3>
          <p className="text-xs font-semibold text-muted-foreground">{item.niche}</p>
        </div>
        {item.badge && <span className="rounded-md bg-violet-500 px-2.5 py-1 text-[10px] font-extrabold text-white">{item.badge}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {item.names.map((name) => (
          <div key={name} className="rounded-xl bg-background/55 p-3">
            <p className="text-sm font-extrabold">{name}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">@{slugify(name).replace(/-/g, "")}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={onCopy} disabled={locked} className="h-11 rounded-xl font-extrabold disabled:opacity-50">
          <Copy className="mr-2 h-4 w-4" /> Salin Nama
        </Button>
        <Button type="button" variant="outline" onClick={onSave} disabled={locked} className="h-11 rounded-xl font-extrabold disabled:opacity-50">
          <Bookmark className="mr-2 h-4 w-4" /> Simpan
        </Button>
      </div>
    </article>
  );
}

function BioNameSelect({ label, value, values, onChange }: { label: string; value: string; values: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-muted-foreground">{label}</span>
      <PremiumSearchSelect
        value={value}
        onChange={onChange}
        placeholder={`Pilih ${label}`}
        options={values.map((item) => ({ label: item, value: item }))}
        triggerClassName="focus-visible:ring-violet-500/30"
      />
    </label>
  );
}

function buildBioItems(niche: string): BioProfileItem[] {
  const topic = niche === "Jualan Online" ? "cuan dari HP" : niche === "Masak" ? "masak simpel di rumah" : niche === "Parenting" ? "cerita ibu & anak" : `${niche.toLowerCase()} harian`;
  return [
    {
      id: `bio-natural-${niche}`,
      niche,
      persona: "Pemula",
      tags: ["Singkat", "Convert tinggi"],
      icon: "💰",
      badge: "Paling Banyak Dipakai",
      bio: [`💸 Ibu rumah tangga yang ${topic}`, "🏙 Berbagi cara dapat penghasilan dari rumah", "👇 Info lengkap di link bawah"],
    },
    {
      id: `bio-spirit-${niche}`,
      niche,
      persona: "Semangat",
      tags: ["Motivatif", "Hook kuat"],
      icon: "🚀",
      bio: [`⚡ Mulai dari nol, sekarang belajar ${topic}`, "🎯 Bantu kamu mulai perjalanan yang sama", "🔗 Gabung gratis di link bio"],
    },
    {
      id: `bio-irt-${niche}`,
      niche,
      persona: "Work from Home",
      tags: ["Relatable IRT", "Personal"],
      icon: "🏠",
      bio: [`🏠 Mama [X] anak, kerja dari rumah lewat HP`, "✨ Berbagi tips & pengalaman online", "👇 Mau mulai? Klik link di bawah"],
    },
  ];
}

function buildAccountNameItems(niche: string): AccountNameItem[] {
  const clean = niche.replace(/&/g, "").replace(/\s+/g, " ").trim();
  return [
    { id: `name-simple-${niche}`, niche, style: "Simple & mudah diingat", badge: "Aman dipakai", tags: ["Simple"], names: [`Ruang ${clean}`, `${clean} Harian`, `Cerita ${clean}`, `${clean} Mudah`] },
    { id: `name-personal-${niche}`, niche, style: "Personal brand", tags: ["Personal"], names: [`Mama ${clean}`, `Belajar ${clean}`, `Teman ${clean}`, `${clean} Bareng`] },
    { id: `name-soft-${niche}`, niche, style: "Soft selling", tags: ["Halus"], names: [`Jalan ${clean}`, `Mulai ${clean}`, `Tips ${clean}`, `${clean} Dari Rumah`] },
  ];
}

function buildCustomBio(niche: string, about: string, style: string, platform: string): BioProfileItem {
  const cleanAbout = about.trim() || "pemula yang mau mulai dari rumah";
  const personal = cleanAbout.length > 42 ? `${cleanAbout.slice(0, 42)}...` : cleanAbout;
  return {
    id: `custom-${crypto.randomUUID()}`,
    niche,
    persona: "Custom",
    tags: [style.split(" ")[0], platform],
    icon: "✨",
    badge: "Custom",
    bio: [`✨ ${personal}`, `📌 Berbagi perjalanan ${niche.toLowerCase()}`, "👇 Mulai bareng lewat link bio"],
  };
}

function readSavedBioNames(): Array<BioProfileItem | AccountNameItem> {
  const raw = localStorage.getItem("buatcuan:saved-bio-names");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 40) : [];
  } catch {
    return [];
  }
}

export { BioNameBankTool };

