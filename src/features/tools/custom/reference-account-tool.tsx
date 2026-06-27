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
type ReferenceAccount = {
  id: string;
  platform: string;
  niche: string;
  name: string;
  username: string;
  avatar: string;
  followers: string;
  likes: string;
  engagementRate: string;
  description: string;
  learnings: string[];
  tags: string[];
  badge?: string;
};

const referencePlatforms = ["TikTok", "Instagram", "YouTube", "Facebook"] as const;
const referenceNiches = ["Jualan Online", "Masak", "Motivasi", "Kecantikan", "Parenting", "Affiliate", "Lifestyle"] as const;

const ReferenceAccountTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState<string>("TikTok");
  const [niche, setNiche] = useState<string>("Jualan Online");
  const [savedAccounts, setSavedAccounts] = useState<ReferenceAccount[]>(() => readSavedReferenceAccounts());
  const { data } = useQuery({
    queryKey: ["tool", slug, "inspirasi-akun-referensi"],
    queryFn: () => api.tools.detail(slug, { category: "ALL" }),
  });

  const locked = Boolean(data?.tool.isLocked);
  const theme = contentColorTheme(data?.tool.colorGradient);
  const adminAccounts = useMemo(() => buildReferenceAccountsFromItems(data?.items), [data?.items]);
  const platformOptions = useMemo(() => uniqueList([...referencePlatforms, ...adminAccounts.map((item) => item.platform)]), [adminAccounts]);
  const nicheOptions = useMemo(() => uniqueList([...referenceNiches, ...adminAccounts.map((item) => item.niche)]), [adminAccounts]);
  const accounts = useMemo(() => {
    const source = adminAccounts.length ? adminAccounts : buildReferenceAccounts(platform, niche);
    return source.filter((account) => account.platform === platform && account.niche === niche);
  }, [adminAccounts, platform, niche]);

  const copyUsername = async (account: ReferenceAccount) => {
    if (locked) {
      toast.error("Tool ini khusus PRO member");
      return;
    }
    await api.tools.use(slug).catch(() => null);
    await navigator.clipboard.writeText(account.username);
    toast.success("Username disalin");
    void queryClient.invalidateQueries({ queryKey: ["tool", slug, "inspirasi-akun-referensi"] });
    void queryClient.invalidateQueries({ queryKey: ["tools"] });
  };

  const saveAccount = (account: ReferenceAccount) => {
    if (locked) {
      toast.error("Tool ini khusus PRO member");
      return;
    }
    const next = [account, ...savedAccounts.filter((item) => item.id !== account.id)].slice(0, 40);
    setSavedAccounts(next);
    localStorage.setItem("buatcuan:saved-reference-accounts", JSON.stringify(next));
    toast.success("Referensi disimpan");
  };

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Inspirasi Akun Referensi</h1>
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold" style={{ borderColor: theme.border, background: theme.iconBg, color: theme.text }}>
              <Crown className="h-3.5 w-3.5" /> PRO
            </span>
          </div>
        </div>
      </div>

      <ReferenceUsageCard />
      <ReferenceProBanner locked={locked} theme={theme} />
      <ReferenceExplainer theme={theme} />

      <section className="space-y-3">
        <div>
          <p className="mb-2 text-sm font-bold text-muted-foreground">Platform</p>
          <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar">
            <div className="flex w-max gap-2">
              {platformOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPlatform(item)}
                className="h-10 shrink-0 rounded-full border bg-card px-4 text-xs font-extrabold text-muted-foreground transition-colors"
                style={platform === item ? { borderColor: theme.accent, background: theme.gradient, color: "#fff" } : undefined}
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
              {nicheOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setNiche(item)}
                  className="h-10 shrink-0 rounded-full border bg-card px-4 text-xs font-extrabold text-muted-foreground transition-colors"
                  style={niche === item ? { borderColor: theme.border, background: theme.iconBg, color: theme.text } : undefined}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ReferenceUpdateBar platform={platform} niche={niche} theme={theme} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Akun Referensi · {niche}</h2>
          <p className="text-xs font-semibold text-muted-foreground">{accounts.length} akun</p>
        </div>
        <ShowMoreList
          items={accounts}
          initial={2}
          step={2}
          className="space-y-3"
          renderItem={(account) => (
            <ReferenceAccountCard
              key={account.id}
              account={account}
              locked={locked}
              onCopy={() => copyUsername(account)}
              onSave={() => saveAccount(account)}
              theme={theme}
            />
          )}
        />
      </section>

      <ReferenceTips theme={theme} />

      <section className="rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg }}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: theme.iconBg, color: theme.text }}>
            <Bookmark className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold">Referensi Tersimpan</h2>
            <p className="text-xs font-semibold text-muted-foreground">Akun referensi pilihan kamu</p>
          </div>
          <span className="rounded-full px-3 py-1.5 text-xs font-extrabold" style={{ background: theme.iconBg, color: theme.text }}>{savedAccounts.length} akun</span>
        </div>
      </section>
    </div>
  );
};

function ReferenceUsageCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app/tools/inspirasi-akun-referensi"
      className="border-teal-500/25"
      accentClassName="border-teal-400/50 bg-teal-500/15 text-teal-300"
      fallback={{
        title: "Cara Pakai Inspirasi Akun Referensi",
        subtitle: "Cara belajar dari akun sukses tanpa nyontek",
        durationLabel: "3 menit",
        thumbnailGradient: "from-emerald-950 via-teal-950 to-yellow-950",
      }}
    />
  );
}

function ReferenceProBanner({ locked, theme }: { locked: boolean; theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg, color: theme.text }}>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: theme.iconBg }}>
          <Users className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold">Contoh Akun Sukses per Niche</h2>
          <p className="text-xs font-semibold text-muted-foreground">Diperbarui rutin · bisa ditiru strateginya</p>
        </div>
        <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl border text-center text-xs font-black leading-tight" style={{ borderColor: theme.border, background: theme.iconBg, color: theme.text }}>
          Update rutin
        </span>
      </div>
      {locked && <p className="mt-3 text-xs font-extrabold">Akun FREE perlu upgrade untuk membuka referensi lengkap.</p>}
    </section>
  );
}

function ReferenceExplainer({ theme }: { theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg }}>
      <div className="mb-3 flex items-center gap-2" style={{ color: theme.text }}>
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Cara belajar dari akun referensi</h2>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
        Lihat akun yang sudah berhasil di niche kamu, lalu pelajari pola kontennya, format videonya, cara bicaranya, dan komentar audiensnya. Kamu tidak perlu membuat ulang konten mereka, cukup ambil strateginya.
      </p>
      <div className="mt-4 rounded-xl border p-3" style={{ borderColor: theme.border, background: theme.iconBg }}>
        <div className="flex items-start gap-3">
          <BadgeInfo className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.text }} />
          <p className="text-xs font-semibold leading-relaxed text-muted-foreground">
            <span className="font-extrabold" style={{ color: theme.text }}>Jangan plagiat!</span> Pelajari gaya & strateginya, bukan copy kontennya. Buat versi kamu sendiri yang lebih personal.
          </p>
        </div>
      </div>
    </section>
  );
}

function ReferenceUpdateBar({ platform, niche, theme }: { platform: string; niche: string; theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <section className="flex items-center justify-between gap-3 rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg }}>
      <div className="flex items-center gap-2" style={{ color: theme.text }}>
        <CalendarDays className="h-4 w-4" />
        <p className="text-sm font-extrabold">Diperbarui Jumat, 8 Mei 2026 · {platform} · {niche}</p>
      </div>
      <p className="text-xs font-semibold text-muted-foreground">Update: 7 hari lagi</p>
    </section>
  );
}

function ReferenceAccountCard({ account, locked, onCopy, onSave, theme }: { account: ReferenceAccount; locked: boolean; onCopy: () => void; onSave: () => void; theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <article className={`relative rounded-2xl border bg-card p-4 ${locked ? "opacity-60" : ""}`} style={account.badge ? { borderColor: theme.border, background: theme.cardBg, boxShadow: theme.shadow } : undefined}>
      {account.badge && (
        <span className="absolute -top-3 left-4 rounded-md px-3 py-1 text-[11px] font-extrabold text-white" style={{ background: theme.gradient }}>{account.badge}</span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-black" style={{ background: theme.iconBg, color: theme.text }}>{account.avatar}</span>
          <div className="min-w-0">
            <h3 className="truncate font-extrabold">{account.name}</h3>
            <p className="truncate text-xs font-semibold text-muted-foreground">{account.username}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-md bg-secondary px-2.5 py-1 text-[10px] font-extrabold text-muted-foreground">{account.platform}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <ReferenceStat label="Pengikut" value={account.followers} />
        <ReferenceStat label="Suka" value={account.likes} />
        <ReferenceStat label="Engagement" value={account.engagementRate} highlight />
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-2 flex items-center gap-2" style={{ color: theme.text }}>
            <BadgeInfo className="h-3.5 w-3.5" />
            <p className="text-xs font-extrabold">Tentang akun ini</p>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-muted-foreground">{account.description}</p>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2" style={{ color: theme.text }}>
            <ListChecks className="h-3.5 w-3.5" />
            <p className="text-xs font-extrabold">Yang bisa dipelajari</p>
          </div>
          <ul className="space-y-2">
            {account.learnings.map((learning) => (
              <li key={learning} className="flex gap-2 text-xs font-semibold leading-relaxed text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />
                <span>{learning}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {account.tags.map((tag, index) => (
          <span key={tag} className="rounded-md px-2.5 py-1 text-[10px] font-extrabold" style={{ background: theme.iconBg, color: theme.text }}>{tag}</span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={onCopy} disabled={locked} className="h-12 rounded-xl font-extrabold disabled:opacity-50">
          <Copy className="mr-2 h-4 w-4" /> Salin Username
        </Button>
        <Button type="button" variant="outline" onClick={onSave} disabled={locked} className="h-12 rounded-xl font-extrabold disabled:opacity-50">
          <Bookmark className="mr-2 h-4 w-4" /> Simpan Referensi
        </Button>
      </div>
    </article>
  );
}

function ReferenceStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 text-center ${highlight ? "bg-teal-500/10" : "bg-background/50"}`}>
      <p className={`text-sm font-black ${highlight ? "text-teal-400" : "text-foreground"}`}>{value}</p>
      <p className="mt-0.5 text-[10px] font-bold text-muted-foreground">{label}</p>
    </div>
  );
}

function ReferenceTips({ theme }: { theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg }}>
      <div className="mb-3 flex items-center gap-2" style={{ color: theme.text }}>
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Tips Belajar dari Akun Referensi</h2>
      </div>
      <div className="space-y-3">
        {[
          ["Analisa 5-10 video terbaru", "Cari pola: format yang sering dipakai, hook pembuka, musik, dan visualnya."],
          ["Perhatikan komentar", "Komentar yang banyak muncul adalah sinyal konten apa yang paling connect."],
          ["Jangan tiru persis", "Ambil strateginya, lalu buat dengan gaya dan cerita kamu sendiri."],
          ["Pilih 1-2 referensi saja", "Terlalu banyak referensi malah bikin bingung dan tidak konsisten."],
        ].map(([title, text]) => (
          <div key={title} className="grid grid-cols-[8px_120px_1fr] gap-3 text-xs font-semibold leading-relaxed text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
            <span className="font-extrabold text-foreground">{title}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildReferenceAccounts(platform: string, niche: string): ReferenceAccount[] {
  const platformPrefix = platform === "Instagram" ? "ig" : platform === "YouTube" ? "yt" : platform === "Facebook" ? "fb" : "tt";
  const base = niche === "Masak"
    ? [
        ["Dapur Rumahan Viral", "Resep harian dengan format sederhana, close-up makanan jelas, dan caption yang gampang disimpan.", "Format resep pendek di bawah 30 detik", "Thumbnail makanan selalu terang dan dekat", "CTA minta komentar menu berikutnya"],
        ["Bekal Mama Hemat", "Akun masak hemat untuk keluarga kecil dengan konten belanja, masak, dan hasil jadi.", "Konten budget sangat tinggi save rate", "List bahan muncul di 3 detik pertama", "Komentar dijawab jadi ide konten baru"],
        ["Jajan Dapur Mini", "Fokus camilan viral dan jajanan rumahan, cocok untuk ide jualan kecil-kecilan.", "Hook pakai hasil akhir dulu", "Teks tutorial singkat dan mudah ditiru", "Musik ringan menjaga mood konten"],
      ]
    : niche === "Motivasi"
      ? [
          ["Ruang Semangat Harian", "Konten motivasi pendek dengan kalimat validasi emosi dan visual tenang.", "Hook menyentuh masalah audience", "Teks pendek lebih mudah dishare", "Warna visual konsisten dan mudah dikenali"],
          ["Mulai Lagi Hari Ini", "Akun progress dan self-improvement yang terasa personal, bukan menggurui.", "Storytelling dari pengalaman sendiri", "CTA ajak simpan untuk dibaca ulang", "Format carousel cocok untuk topik berat"],
          ["Catatan Pejuang Rumah", "Konten motivasi untuk ibu rumah tangga dan pemula yang ingin produktif dari rumah.", "Bahasa relatable untuk IRT", "Banyak konten validasi proses", "Komentar dibalas dengan empati"],
        ]
      : niche === "Parenting"
        ? [
            ["Mama Belajar Bareng", "Konten parenting praktis dari pengalaman harian, ringan dan tidak menghakimi.", "Cerita personal bikin trust cepat", "Opening pakai masalah sehari-hari", "Tips kecil lebih mudah dipraktikkan"],
            ["Ruang Anak Ceria", "Akun ide aktivitas anak di rumah dengan visual bersih dan instruksi singkat.", "Konten activity punya save rate tinggi", "Checklist bahan membuat orang betah", "Caption ajak share umur anak"],
            ["Cerita Ibu Produktif", "Blend parenting, rumah, dan penghasilan online dengan nada hangat.", "Relatable IRT sangat kuat", "Promosi disisipkan halus", "Story harian membuat akun terasa manusia"],
          ]
        : [
            ["Ibu Cuan Official", "Akun IRT yang mulai dari nol, konten tanpa tampil muka, fokus di niche jualan online dan penghasilan tambahan. Konsisten posting 1-2 video per hari.", "Hook selalu pakai angka spesifik", "Format video sederhana: footage + teks overlay + musik slow", "CTA di setiap video: link di bio atau komen INFO"],
            ["Cuan dari HP", "Akun edukatif tentang penghasilan online, konten berupa tips dan tutorial pendek, sering pakai format Day 1, Day 2 untuk menunjukkan progress.", "Format progress membuat orang penasaran", "Teks besar di tengah video mudah dibaca", "Musik selalu upbeat sesuai mood konten"],
            ["Mama Produktif", "Akun IRT dengan konten life and income, blend keseharian sebagai ibu dan perjalanan membangun penghasilan online.", "Cerita personal sebelum masuk ke tips", "Moral di akhir video membuat orang nonton sampai selesai", "Promosi terasa natural karena masuk ke cerita"],
          ];

  return base.map((item, index) => {
    const usernameBase = slugify(`${item[0]} ${platformPrefix}`).replace(/-/g, ".");
    return {
      id: `${platformPrefix}-${slugify(niche)}-${index}`,
      platform,
      niche,
      name: item[0],
      username: `@${usernameBase}`,
      avatar: index === 0 ? "👩" : index === 1 ? "🧑" : "👱",
      followers: index === 0 ? "2.4M" : index === 1 ? "890K" : "445K",
      likes: index === 0 ? "18.5M" : index === 1 ? "7.2M" : "3.1M",
      engagementRate: index === 0 ? "4.2%" : index === 1 ? "5.8%" : "6.1%",
      description: item[1],
      learnings: [item[2], item[3], item[4]],
      tags: index === 0 ? ["No face", "Footage + teks", "Konsisten harian", "Soft selling"] : index === 1 ? ["Day series", "Tutorial", "Engagement tinggi"] : ["Lifestyle", "Relatable IRT", "Storytelling"],
      badge: index === 0 ? "Paling Direkomendasikan" : undefined,
    };
  });
}

function buildReferenceAccountsFromItems(items?: MemberToolItemDto[]): ReferenceAccount[] {
  if (!items?.length) return [];
  return items.map((item, index) => {
    const metadata = item.metadata ?? {};
    const platform = asString(metadata.platform, item.category || "TikTok");
    const niche = asString(metadata.niche, item.niche || "Jualan Online");
    const username = asString(metadata.username, `@${slugify(`${item.title} ${platform}`).replace(/-/g, ".")}`);
    return {
      id: item.id,
      platform,
      niche,
      name: item.title,
      username,
      avatar: asString(metadata.avatar, initials(item.title)),
      followers: asString(metadata.followers, "-"),
      likes: asString(metadata.likes, "-"),
      engagementRate: asString(metadata.engagementRate, "-"),
      description: item.content,
      learnings: parseStringList(metadata.learnings, [item.openingHook, item.caption].filter(Boolean) as string[]),
      tags: parseStringList(metadata.tags, [item.theme, item.niche, item.category].filter(Boolean) as string[]),
      badge: asString(metadata.badge, index === 0 ? "Paling Direkomendasikan" : ""),
    };
  });
}

function uniqueList(values: readonly string[]) {
  return Array.from(new Set(values.filter((item) => item.trim().length > 0)));
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function parseStringList(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    const values = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    if (values.length) return values;
  }
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return fallback.length ? fallback : ["Pelajari pola konten yang paling sering dipakai"];
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "BC";
}

function readSavedReferenceAccounts(): ReferenceAccount[] {
  const raw = localStorage.getItem("buatcuan:saved-reference-accounts");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 40) : [];
  } catch {
    return [];
  }
}

export { ReferenceAccountTool };

