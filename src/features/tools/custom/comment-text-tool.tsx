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
type CommentType = {
  key: string;
  title: string;
  description: string;
  color: string;
};

type GeneratedComment = {
  id: string;
  type: string;
  mood: string;
  text: string;
};

const commentTypes: CommentType[] = [
  { key: "Apresiasi", title: "Apresiasi", description: "Pujian yang tulus & natural", color: "from-cyan-500 to-teal-400" },
  { key: "Pertanyaan", title: "Pertanyaan", description: "Bikin orang mau balas", color: "from-emerald-500 to-green-400" },
  { key: "Relatable", title: "Relatable", description: "Ngerasain hal yang sama", color: "from-rose-500 to-pink-400" },
  { key: "Tambah Info", title: "Tambah Info", description: "Tambahkan nilai ke konten", color: "from-yellow-500 to-lime-400" },
  { key: "Humor Ringan", title: "Humor Ringan", description: "Lucu tapi tetap sopan", color: "from-orange-500 to-amber-400" },
  { key: "Dukungan", title: "Dukungan", description: "Semangat & suportif", color: "from-violet-500 to-purple-400" },
];

const commentPlatforms = ["TikTok", "Instagram", "YouTube", "Facebook"] as const;
const commentCounts = [3, 5, 10, 15] as const;

const CommentTextTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [type, setType] = useState<CommentType>(commentTypes[0]);
  const [topic, setTopic] = useState("video resep masakan, tips makeup");
  const [platform, setPlatform] = useState<(typeof commentPlatforms)[number]>("TikTok");
  const [niche, setNiche] = useState("Jualan online / BuatCuan");
  const [count, setCount] = useState<(typeof commentCounts)[number]>(5);
  const [generating, setGenerating] = useState(false);
  const [comments, setComments] = useState<GeneratedComment[]>(() => buildComments("Apresiasi", "video resep masakan, tips makeup", "Jualan online / BuatCuan", 5));
  const [savedComments, setSavedComments] = useState<GeneratedComment[]>(() => readSavedComments());
  const { data } = useQuery({
    queryKey: ["tool", slug, "ide-teks-komentar"],
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
      setComments(buildComments(type.key, topic, niche, count));
      toast.success("Komentar baru dibuat");
      void queryClient.invalidateQueries({ queryKey: ["tool", slug, "ide-teks-komentar"] });
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal generate komentar"));
    } finally {
      setGenerating(false);
    }
  };

  const copyComment = async (comment: GeneratedComment) => {
    await navigator.clipboard.writeText(comment.text);
    toast.success("Komentar disalin");
  };

  const saveComment = (comment: GeneratedComment) => {
    const next = [comment, ...savedComments.filter((item) => item.text !== comment.text)].slice(0, 40);
    setSavedComments(next);
    localStorage.setItem("buatcuan:saved-comments", JSON.stringify(next));
    toast.success("Komentar disimpan");
  };

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Ide Teks Komentar</h1>
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-extrabold text-accent">
              <Crown className="h-3.5 w-3.5" /> PRO
            </span>
          </div>
        </div>
      </div>

      <CommentUsageCard />
      <CommentProBanner locked={locked} />
      <CommentExplainer />

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-cyan-400">
          <MessageCircle className="h-4 w-4" />
          <h2 className="font-extrabold text-foreground">Pilih Tipe Komentar</h2>
        </div>
        <ShowMoreList
          items={commentTypes}
          initial={4}
          step={2}
          className="grid grid-cols-2 gap-3"
          buttonClassName="col-span-2 h-11 rounded-2xl border-border bg-secondary font-extrabold"
          renderItem={(item) => (
            <CommentTypeCard key={item.key} type={item} active={type.key === item.key} onClick={() => setType(item)} />
          )}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Wand2 className="h-4 w-4" />
          <h2 className="font-extrabold text-foreground">Generate Komentar</h2>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-muted-foreground">Konten yang mau dikomentari tentang apa?</span>
          <Input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="h-12 rounded-xl border-border bg-secondary text-sm font-bold"
            placeholder="Contoh: video resep masakan, tips makeup"
          />
        </label>
        <CommentSelect label="Platform" value={platform} values={commentPlatforms} onChange={(value) => setPlatform(value as typeof platform)} />
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-muted-foreground">Niche akun kamu</span>
          <Input
            value={niche}
            onChange={(event) => setNiche(event.target.value)}
            className="h-12 rounded-xl border-border bg-secondary text-sm font-bold"
            placeholder="Contoh: jualan online, masak, parenting"
          />
        </label>
        <div>
          <p className="mb-2 text-sm font-bold text-muted-foreground">Jumlah variasi komentar</p>
          <div className="grid grid-cols-4 gap-2">
            {commentCounts.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCount(item)}
                className={`h-10 rounded-xl border text-xs font-extrabold transition-colors ${
                  count === item ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-400" : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <Button type="button" onClick={generate} disabled={generating || locked} variant="outline" className="h-12 w-full rounded-xl font-extrabold disabled:opacity-50">
          <Wand2 className="mr-2 h-4 w-4" />
          {generating ? "Membuat Komentar..." : "Generate Komentar"}
        </Button>
        {locked && (
          <Link to="/app/payment" className="block rounded-xl bg-accent/10 px-4 py-3 text-center text-sm font-extrabold text-accent">
            Buka PRO untuk komentar natural unlimited
          </Link>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Hasil Komentar</h2>
          <button type="button" onClick={generate} disabled={generating || locked} className="text-xs font-extrabold text-cyan-400 disabled:text-muted-foreground">Generate ulang</button>
        </div>
        <ShowMoreList
          items={comments}
          initial={3}
          step={3}
          className="space-y-3"
          renderItem={(comment, index) => (
            <CommentResultCard
              key={comment.id}
              comment={comment}
              index={index}
              featured={index === 0}
              onCopy={() => copyComment(comment)}
              onSave={() => saveComment(comment)}
              locked={locked}
            />
          )}
        />
      </section>

      <CommentTips />

      <section className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-400">
            <Bookmark className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold">Komentar Tersimpan</h2>
            <p className="text-xs font-semibold text-muted-foreground">Koleksi komentar favorit kamu</p>
          </div>
          <span className="rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-extrabold text-sky-400">{savedComments.length} komentar</span>
        </div>
        {savedComments.length > 0 && (
          <div className="mt-3 space-y-2">
            {savedComments.slice(0, 3).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => copyComment(item)}
                className="block w-full rounded-xl bg-background/55 p-3 text-left text-xs font-semibold text-muted-foreground"
              >
                <span className="font-extrabold text-sky-400">{item.type}</span> · {item.text}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

function CommentUsageCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app/tools/ide-teks-komentar"
      className="border-cyan-500/25"
      accentClassName="border-cyan-400/50 bg-cyan-500/15 text-cyan-300"
      fallback={{
        title: "Cara Pakai Ide Teks Komentar BuatCuan",
        subtitle: "Cara komen yang bikin orang balik ke akun kamu",
        durationLabel: "2 menit",
        thumbnailGradient: "from-emerald-950 via-zinc-950 to-indigo-950",
      }}
    />
  );
}

function CommentProBanner({ locked }: { locked: boolean }) {
  return (
    <section className="rounded-2xl border border-cyan-500/35 bg-cyan-500/10 p-4 text-cyan-400">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-500/15">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold">Komentar Natural & Human Friendly</h2>
          <p className="text-xs font-semibold text-muted-foreground">Manual + AI, tidak terkesan bot, bikin orang penasaran</p>
        </div>
        <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl border border-accent/35 bg-accent/10 text-center text-xs font-black leading-tight text-accent">
          ∞<br />Tanpa batas
        </span>
      </div>
      {locked && <p className="mt-3 text-xs font-extrabold">Akun FREE perlu upgrade untuk memakai generator ini.</p>}
    </section>
  );
}

function CommentExplainer() {
  return (
    <section className="rounded-2xl border border-cyan-500/35 bg-cyan-500/10 p-4">
      <div className="mb-3 flex items-center gap-2 text-cyan-400">
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Kenapa komentar itu penting?</h2>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
        Komentar di akun lain adalah cara tercepat dapat pengikut baru tanpa biaya. Komentar yang menarik bikin orang penasaran klik profil kamu.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          ["💬", "Komen menarik", "Diklik profil"],
          ["👁", "Profil bagus", "Di-follow"],
          ["📈", "Followers naik", "Organik"],
        ].map(([icon, title, text]) => (
          <div key={title} className="rounded-xl bg-background/45 p-3 text-center">
            <p className="text-xl">{icon}</p>
            <p className="mt-1 text-[10px] font-bold text-muted-foreground">{title}</p>
            <p className="text-xs font-black text-cyan-400">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CommentTypeCard({ type, active, onClick }: { type: CommentType; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block min-h-[120px] w-full rounded-2xl border bg-card p-3 text-left transition ${
        active ? "border-cyan-500/60 bg-cyan-500/10" : "border-border"
      }`}
    >
      <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${type.color} text-white`}>
        <MessageCircle className="h-4 w-4" />
      </span>
      <p className="mt-3 text-sm font-extrabold leading-tight">{type.title}</p>
      <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-muted-foreground">{type.description}</p>
    </button>
  );
}

function CommentSelect({ label, value, values, onChange }: { label: string; value: string; values: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-muted-foreground">{label}</span>
      <PremiumSearchSelect
        value={value}
        onChange={onChange}
        placeholder={`Pilih ${label}`}
        options={values.map((item) => ({ label: item, value: item }))}
        triggerClassName="focus-visible:ring-cyan-500/30"
      />
    </label>
  );
}

function CommentResultCard({ comment, index, featured, onCopy, onSave, locked }: { comment: GeneratedComment; index: number; featured: boolean; onCopy: () => void; onSave: () => void; locked: boolean }) {
  return (
    <article className={`relative rounded-2xl border bg-card p-4 ${featured ? "border-cyan-500/50 bg-cyan-500/10" : "border-border"} ${locked ? "opacity-60" : ""}`}>
      {featured && <span className="absolute -top-3 left-4 rounded-md bg-cyan-500 px-3 py-1 text-[11px] font-extrabold text-white">Paling Natural</span>}
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold text-muted-foreground">Komentar #{index + 1}</p>
        <span className="rounded-md bg-cyan-500/15 px-2 py-1 text-[10px] font-bold text-cyan-400">{comment.type}</span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-relaxed">
        {highlightCommentText(comment.text)}
      </p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-cyan-500/15 px-2.5 py-1 text-[11px] font-extrabold text-cyan-400">{comment.mood}</span>
          <span className="rounded-md bg-primary/15 px-2.5 py-1 text-[11px] font-extrabold text-primary">Terasa manusia</span>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCopy} disabled={locked} className="h-10 w-10 rounded-xl p-0" title="Salin komentar">
            <Copy className="h-4 w-4 text-primary" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onSave} disabled={locked} className="h-10 w-10 rounded-xl p-0" title="Simpan komentar">
            <Bookmark className="h-4 w-4 text-sky-400" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function CommentTips() {
  const tips = [
    ["Waktu terbaik", "Komen dalam 30-60 menit pertama setelah video upload, biasanya paling ramai dilihat."],
    ["Akun target", "Pilih akun seniche tapi bukan pesaing langsung agar komentarmu lebih aman."],
    ["Variasi komentar", "Jangan pakai kalimat yang sama terus supaya tidak terlihat seperti spam."],
    ["Ukuran akun", "Target akun 10rb-100rb followers karena engagement rate biasanya lebih tinggi."],
  ];
  return (
    <section className="rounded-2xl border border-accent/35 bg-accent/10 p-4">
      <div className="mb-3 flex items-center gap-2 text-accent">
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Tips Komentar yang Efektif</h2>
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

function buildComments(type: string, topic: string, niche: string, count: number): GeneratedComment[] {
  const topicText = topic.trim() || "konten harian";
  const nicheText = niche.trim() || "akun pemula";
  const bank: GeneratedComment[] = [
    { id: crypto.randomUUID(), type: "Apresiasi", mood: "Hangat", text: `Masya Allah, ini ${topicText} simpel banget tapi hasilnya kayak niat banget. Udah lama nyari yang gini, langsung save!` },
    { id: crypto.randomUUID(), type: "Pertanyaan", mood: "Penasaran", text: `Wah ini bisa dipakai buat pemula juga gak kak? Biasanya beda niche kayak ${nicheText.toLowerCase()} perlu penyesuaian apa?` },
    { id: crypto.randomUUID(), type: "Relatable", mood: "Lucu", text: `Ini gue banget, tiap mau mulai malah bingung bagian awalnya. Langsung screenshot dulu deh buat besok.` },
    { id: crypto.randomUUID(), type: "Tambah Info", mood: "Bermanfaat", text: `Tips tambahan kak, kalau mau hasilnya lebih natural coba variasiin kalimat pembukanya sedikit. Biasanya lebih enak dibaca.` },
    { id: crypto.randomUUID(), type: "Dukungan", mood: "Suportif", text: `Kontennya selalu bikin semangat buat mulai lagi. Keep posting ya, banyak yang butuh konten kayak gini!` },
    { id: crypto.randomUUID(), type: "Humor Ringan", mood: "Receh", text: `Niatnya cuma lewat, tapi kok malah belajar hal baru. Algoritma hari ini ngerti kebutuhan aku.` },
    { id: crypto.randomUUID(), type: "Apresiasi", mood: "Natural", text: `Suka banget cara jelasinnya, gak muter-muter dan langsung bisa dipraktekkan.` },
    { id: crypto.randomUUID(), type: "Pertanyaan", mood: "Engaging", text: `Kalau diterapin konsisten seminggu, biasanya yang paling kelihatan efeknya bagian mana kak?` },
    { id: crypto.randomUUID(), type: "Relatable", mood: "Dekat", text: `Aku kira cuma aku yang sering stuck di bagian ini. Ternyata banyak yang ngalamin juga ya.` },
    { id: crypto.randomUUID(), type: "Tambah Info", mood: "Helpful", text: `Boleh juga ditambah checklist kecil di akhir kak, biar yang baru mulai lebih gampang ngikutinnya.` },
    { id: crypto.randomUUID(), type: "Dukungan", mood: "Positif", text: `Lanjut terus kak, konten kayak gini beneran bantu pemula yang masih takut mulai.` },
    { id: crypto.randomUUID(), type: "Humor Ringan", mood: "Santai", text: `Baru sadar selama ini ribetnya aku sendiri yang bikin. Makasih sudah menyederhanakan hidup.` },
    { id: crypto.randomUUID(), type: "Apresiasi", mood: "Tulus", text: `Penjelasannya enak banget diikuti, kayak dikasih tahu teman sendiri.` },
    { id: crypto.randomUUID(), type: "Pertanyaan", mood: "Diskusi", text: `Menurut kakak, buat akun kecil lebih baik fokus kualitas dulu atau frekuensi upload dulu?` },
    { id: crypto.randomUUID(), type: "Relatable", mood: "Jujur", text: `Bagian ini sering banget aku skip, padahal ternyata pengaruhnya besar juga ya.` },
  ];
  const preferred = bank.filter((item) => item.type === type);
  const rest = bank.filter((item) => item.type !== type);
  return [...preferred, ...rest].slice(0, count);
}

function highlightCommentText(text: string) {
  const words = ["simpel banget", "bisa dipakai", "tiap mau mulai", "variasiin", "Keep posting", "belajar hal baru", "gak muter-muter", "konsisten", "stuck", "checklist kecil"];
  const match = words.find((word) => text.toLowerCase().includes(word.toLowerCase()));
  if (!match) return text;
  const [before, after] = text.split(new RegExp(match, "i"));
  return (
    <>
      {before}
      <span className="font-extrabold text-cyan-400">{match}</span>
      {after}
    </>
  );
}

function readSavedComments(): GeneratedComment[] {
  const raw = localStorage.getItem("buatcuan:saved-comments");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 40) : [];
  } catch {
    return [];
  }
}

type HashtagKind = "viral" | "trending" | "niche";

type HashtagItem = {
  text: string;
  kind: HashtagKind;
};

export { CommentTextTool };

