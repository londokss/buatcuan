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
type ClosingSituation = {
  key: string;
  title: string;
  description: string;
  icon: string;
  color: string;
};

type ChatLine = {
  from: "lead" | "you";
  text: string;
  note?: string;
};

type ClosingScript = {
  id: string;
  title: string;
  tags: string[];
  iconClass: string;
  chat: ChatLine[];
};

const closingSituations: ClosingSituation[] = [
  { key: "Tanya Info Dulu", title: "Tanya Info Dulu", description: "Mereka penasaran tapi belum yakin", icon: "🙋", color: "from-emerald-500 to-green-400" },
  { key: "Tanya Harga", title: "Tanya Harga", description: "Langsung tanya berapa harganya", icon: "💰", color: "from-amber-500 to-yellow-400" },
  { key: "Ragu-ragu", title: "Ragu-ragu", description: "Sudah tertarik tapi masih mikir", icon: "🤔", color: "from-orange-500 to-amber-400" },
  { key: "Tidak Balas", title: "Tidak Balas", description: "Sudah chat tapi tiba-tiba diam", icon: "😴", color: "from-sky-500 to-cyan-400" },
  { key: "Dibilang Mahal", title: "Dibilang Mahal", description: "Merasa harganya terlalu tinggi", icon: "❌", color: "from-rose-500 to-pink-400" },
  { key: "Hampir Jadi", title: "Hampir Jadi", description: "Tinggal satu dorongan kecil", icon: "✅", color: "from-teal-500 to-cyan-400" },
];

const closingPlatforms = ["WhatsApp", "DM TikTok", "DM Instagram"] as const;

const ClosingScriptTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [situation, setSituation] = useState<ClosingSituation>(closingSituations[0]);
  const [platform, setPlatform] = useState<(typeof closingPlatforms)[number]>("WhatsApp");
  const [savedScripts, setSavedScripts] = useState<ClosingScript[]>(() => readSavedClosingScripts());
  const { data } = useQuery({
    queryKey: ["tool", slug, "script-closing-dm-wa"],
    queryFn: () => api.tools.detail(slug, { category: "ALL" }),
  });

  const locked = Boolean(data?.tool.isLocked);
  const scripts = useMemo(() => buildClosingScripts(situation.key, platform), [situation.key, platform]);

  const copyScript = async (script: ClosingScript) => {
    if (locked) {
      toast.error("Tool ini khusus PRO member");
      return;
    }
    await api.tools.use(slug).catch(() => null);
    await navigator.clipboard.writeText(formatClosingScript(script));
    toast.success("Skrip closing disalin");
    void queryClient.invalidateQueries({ queryKey: ["tool", slug, "script-closing-dm-wa"] });
    void queryClient.invalidateQueries({ queryKey: ["tools"] });
  };

  const saveScript = (script: ClosingScript) => {
    const next = [script, ...savedScripts.filter((item) => item.id !== script.id)].slice(0, 30);
    setSavedScripts(next);
    localStorage.setItem("buatcuan:saved-closing-scripts", JSON.stringify(next));
    toast.success("Skrip disimpan");
  };

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Skrip Closing DM & WA</h1>
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-extrabold text-accent">
              <Crown className="h-3.5 w-3.5" /> PRO
            </span>
          </div>
        </div>
      </div>

      <ClosingUsageCard />
      <ClosingProBanner locked={locked} />
      <ClosingExplainer />

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <MessagesSquare className="h-4 w-4" />
          <h2 className="font-extrabold text-foreground">Pilih Situasi</h2>
        </div>
        <ShowMoreList
          items={closingSituations}
          initial={4}
          step={2}
          className="grid grid-cols-2 gap-3"
          buttonClassName="col-span-2 h-11 rounded-2xl border-border bg-secondary font-extrabold"
          renderItem={(item) => (
            <ClosingSituationCard key={item.key} situation={item} active={situation.key === item.key} onClick={() => setSituation(item)} />
          )}
        />
        <div>
          <p className="mb-2 text-sm font-bold text-muted-foreground">Platform</p>
          <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar">
            <div className="flex w-max gap-2">
              {closingPlatforms.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPlatform(item)}
                className={`h-9 shrink-0 rounded-full border px-4 text-xs font-extrabold transition-colors ${
                  platform === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"
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
          <h2 className="font-extrabold">Skrip · {situation.key} · {platform}</h2>
          <p className="text-xs font-semibold text-muted-foreground">{scripts.length} skrip</p>
        </div>
        <ShowMoreList
          items={scripts}
          initial={2}
          step={2}
          className="space-y-3"
          renderItem={(script) => (
            <ClosingScriptCard
              key={script.id}
              script={script}
              onCopy={() => copyScript(script)}
              onSave={() => saveScript(script)}
              locked={locked}
            />
          )}
        />
      </section>

      <ClosingTips />

      <section className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-400">
            <Bookmark className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold">Skrip Tersimpan</h2>
            <p className="text-xs font-semibold text-muted-foreground">Koleksi skrip closing favorit kamu</p>
          </div>
          <span className="rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-extrabold text-sky-400">{savedScripts.length} skrip</span>
        </div>
      </section>
    </div>
  );
};

function ClosingUsageCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app/tools/script-closing-dm-wa"
      className="border-primary/25"
      fallback={{
        title: "Cara Closing DM & WA yang Natural",
        subtitle: "Chat natural untuk member tertarik masuk",
        durationLabel: "5 menit",
        thumbnailGradient: "from-emerald-950 via-green-950 to-zinc-950",
      }}
    />
  );
}

function ClosingProBanner({ locked }: { locked: boolean }) {
  return (
    <section className="rounded-2xl border border-primary/35 bg-primary/10 p-4 text-primary">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15">
          <MessagesSquare className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold">Skrip Closing Berbagai Situasi</h2>
          <p className="text-xs font-semibold text-muted-foreground">Natural, tidak maksa, convert tanpa pressure</p>
        </div>
        <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl border border-accent/35 bg-accent/10 text-center text-xs font-black leading-tight text-accent">
          ∞<br />Tanpa batas
        </span>
      </div>
      {locked && <p className="mt-3 text-xs font-extrabold">Akun FREE perlu upgrade untuk memakai skrip ini.</p>}
    </section>
  );
}

function ClosingExplainer() {
  return (
    <section className="rounded-2xl border border-primary/35 bg-primary/10 p-4">
      <div className="mb-3 flex items-center gap-2 text-primary">
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Kunci closing yang berhasil</h2>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
        Closing yang bagus itu seperti ngobrol sama teman, bukan seperti sales yang ngejar-ngejar. Pahami situasi dulu, baru pilih skrip yang tepat.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["Mereka DM", "Tanya ringan"],
          ["Kamu jawab", "Langsung & ramah"],
          ["Kasih nilai", "Info manfaat"],
        ].map(([title, text]) => (
          <div key={title} className="rounded-xl bg-background/45 p-3 text-center">
            <p className="text-xs font-black text-primary">{title}</p>
            <p className="mt-1 text-[10px] font-bold text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 p-3">
        <p className="text-xs font-semibold leading-relaxed text-muted-foreground">
          <span className="font-extrabold text-red-400">Jangan langsung kasih link!</span> Sapaan dulu, tanya situasinya, baru arahkan. Langsung lempar link sering dianggap diabaikan.
        </p>
      </div>
    </section>
  );
}

function ClosingSituationCard({ situation, active, onClick }: { situation: ClosingSituation; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block min-h-[116px] w-full rounded-2xl border bg-card p-3 text-left transition ${
        active ? "border-primary/60 bg-primary/10" : "border-border"
      }`}
    >
      <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${situation.color} text-white text-lg`}>
        {situation.icon}
      </span>
      <p className="mt-3 text-sm font-extrabold leading-tight">{situation.title}</p>
      <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-muted-foreground">{situation.description}</p>
    </button>
  );
}

function ClosingScriptCard({ script, onCopy, onSave, locked }: { script: ClosingScript; onCopy: () => void; onSave: () => void; locked: boolean }) {
  return (
    <article className={`overflow-hidden rounded-2xl border border-primary/40 bg-primary/10 ${locked ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3 p-4">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${script.iconClass} text-white`}>
          <MessagesSquare className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold">{script.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {script.tags.map((tag, index) => (
              <span key={tag} className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${index % 2 ? "bg-sky-500/15 text-sky-400" : "bg-primary/15 text-primary"}`}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-primary/20 p-4">
        <div className="space-y-3">
          {script.chat.map((line, index) => (
            <div key={`${line.from}-${index}`} className={`max-w-[86%] rounded-xl p-3 text-sm font-semibold leading-relaxed ${line.from === "you" ? "ml-auto bg-primary/25 text-foreground" : "bg-card text-muted-foreground"}`}>
              {line.note && <p className="mb-1 text-[10px] font-bold uppercase text-primary">{line.note}</p>}
              <p>{line.text}</p>
            </div>
          ))}
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

function ClosingTips() {
  const tips = [
    ["Tanya dulu", "Kenali situasi mereka sebelum rekomendasikan apa pun."],
    ["Jangan follow up lebih dari 3x", "Kalau sudah 3x tidak balas, lepas dengan baik-baik."],
    ["Gunakan nama mereka", "Pakai nama panggilan bikin personal dan tidak seperti robot."],
    ["Ceritakan pengalaman nyata", "Aku dulu juga gitu lebih dipercaya dari klaim apa pun."],
  ];
  return (
    <section className="rounded-2xl border border-accent/35 bg-accent/10 p-4">
      <div className="mb-3 flex items-center gap-2 text-accent">
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Tips Closing yang Efektif</h2>
      </div>
      <ul className="space-y-2">
        {tips.map(([title, body]) => (
          <li key={title} className="grid grid-cols-[8px_1fr] gap-3 text-xs font-semibold leading-relaxed text-muted-foreground">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
            <span><span className="font-extrabold text-foreground">{title}:</span> {body}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function buildClosingScripts(situation: string, platform: string): ClosingScript[] {
  const base: ClosingScript[] = [
    {
      id: `opening-${situation}-${platform}`,
      title: "Opening Hangat + Nilai",
      tags: ["Warm up", "Tidak langsung jualan", "Convert halus"],
      iconClass: "from-emerald-500 to-green-400",
      chat: [
        { from: "lead", text: "Halo kak, boleh tanya soal BuatCuan?" },
        { from: "you", note: "Kamu", text: "Halo kak, boleh banget! Senang ada yang tanya. Kakak lagi pengen mulai bikin konten, atau udah jalan tapi pengen lebih maksimal nih?" },
        { from: "lead", text: "Belum mulai sama sekali kak, masih bingung dari mana." },
        { from: "you", note: "Kamu", text: "Nah pas banget kak. BuatCuan itu memang dirancang untuk yang mulai dari nol, step by step, gak perlu pengalaman sebelumnya. Yang paling banyak join justru ibu rumah tangga/karyawan yang pengen mulai dari rumah sambil ngurus aktivitas harian." },
      ],
    },
    {
      id: `price-${situation}-${platform}`,
      title: "Respon Tanya Harga",
      tags: ["Transparan", "Kasih nilai dulu"],
      iconClass: "from-yellow-500 to-lime-400",
      chat: [
        { from: "lead", text: "Berapa harganya kak?" },
        { from: "you", note: "Kamu", text: "Harga PRO-nya Rp297rb kak untuk 3 bulan penuh. Tapi sebelum itu, aku jelasin dulu ya kak: akses gratisnya dulu juga bisa dipakai selamanya, tapi kalau mau semua modul, tools, dan bimbingan lengkap baru cocok upgrade." },
        { from: "you", note: "Kamu", text: "Gue share linknya ya kak, nanti bisa cek detailnya pelan-pelan." },
      ],
    },
    {
      id: `doubt-${situation}-${platform}`,
      title: "Respon Ragu-ragu",
      tags: ["Empati dulu", "Hapus pressure"],
      iconClass: "from-rose-500 to-pink-400",
      chat: [
        { from: "lead", text: "Cuma masih pikir-pikir dulu kak, takut gak sempat." },
        { from: "you", note: "Kamu", text: "Wajar banget kak, aku dulu juga gitu. Tapi yang bikin tenang, materinya bisa diakses kapan aja. Jadi gak harus belajar 1 jam per hari. Banyak member mulai dari 15 menit sambil rebahan." },
        { from: "you", note: "Kamu", text: "Yang paling penting itu mulai dulu, nanti waktunya ketemu sendiri kak." },
      ],
    },
    {
      id: `followup-${situation}-${platform}`,
      title: "Follow Up yang Tidak Mengganggu",
      tags: ["Gentle reminder", "Tidak maksa"],
      iconClass: "from-orange-500 to-amber-400",
      chat: [
        { from: "you", note: "Kamu · follow up 1 hari setelah chat terakhir", text: "Halo kak, gak mau ganggu ya. Cuma mau kasih tahu, minggu ini ada beberapa yang baru join dan langsung praktek. Hasilnya masih mulai kelihatan pelan-pelan." },
        { from: "you", note: "Kamu", text: "Kalau kakak masih penasaran, aku siap bantu kapan aja. Gak ada pressure kok." },
      ],
    },
  ];

  if (situation === "Tanya Harga") return [base[1], base[0], base[2], base[3]];
  if (situation === "Ragu-ragu" || situation === "Dibilang Mahal") return [base[2], base[1], base[0], base[3]];
  if (situation === "Tidak Balas") return [base[3], base[0], base[2], base[1]];
  if (situation === "Hampir Jadi") return [base[1], base[2], base[0], base[3]];
  return base;
}

function formatClosingScript(script: ClosingScript) {
  return script.chat.map((line) => `${line.from === "you" ? "Kamu" : "Calon member"}: ${line.text}`).join("\n\n");
}

function readSavedClosingScripts(): ClosingScript[] {
  const raw = localStorage.getItem("buatcuan:saved-closing-scripts");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
  } catch {
    return [];
  }
}

export { ClosingScriptTool };

