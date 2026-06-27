import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Ban,
  Bot,
  Building2,
  CheckCircle2,
  Clock,
  MessageCircle,
  MinusCircle,
  ShieldAlert,
  Star,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, getErrorMessage, type MyMentorDto } from "@/lib/api";

function normalizeWa(wa?: string | null) {
  const digits = String(wa ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

function waUrl(wa?: string | null, message = "Halo kak, saya member BuatCuan dan mau tanya bimbingan.") {
  const number = normalizeWa(wa);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : "";
}

const aiUrl = "https://chat.openai.com/";
const defaultReportReason = "Mentor tidak merespons lebih dari 24 jam. Screenshot WhatsApp sudah dilampirkan sebagai bukti laporan.";

const Bimbingan = () => {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const { data: mentorData } = useQuery({ queryKey: ["affiliate-my-mentor"], queryFn: api.affiliate.myMentor });
  const { data: guidance = [] } = useQuery({ queryKey: ["guidance"], queryFn: api.guidance });

  const reportMentor = useMutation({
    mutationFn: () =>
      api.affiliate.reportMentor({
        reason: reason.trim() || defaultReportReason,
        evidence: evidence as File,
      }),
    onSuccess: () => {
      toast.success("Laporan dikirim ke admin BuatCuan");
      setReason("");
      setEvidence(null);
      void qc.invalidateQueries({ queryKey: ["affiliate-my-mentor"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal mengirim laporan")),
  });

  const mentor = mentorData?.mentor;
  const teamMentor = mentorData?.teamMentor;
  const activeMentor = mentor && !mentor.supportFallback ? mentor : null;
  const teamGuidance = useMemo(() => guidance.find((item) => /tim|team|support/i.test(item.title)), [guidance]);
  const teamUrl = teamGuidance?.targetUrl || waUrl(teamMentor?.wa, "Halo Tim BuatCuan, saya butuh bantuan bimbingan.");
  const mentorUrl = activeMentor
    ? waUrl(activeMentor.wa)
    : teamUrl;
  const latestReport = mentorData?.reports?.[0];
  const mentorStats = getMentorStats(activeMentor);

  return (
    <div className="space-y-5 pb-3">
      <section className="space-y-1">
        <h1 className="text-3xl font-black tracking-normal">
          Butuh <span className="text-violet-400">Bantuan?</span>
        </h1>
        <p className="text-sm font-semibold text-muted-foreground">Hubungi mentor kamu dulu - mereka siap bantu.</p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Hubungi dulu</p>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
            Prioritas Utama
          </span>
        </div>

        <MentorPriorityCard
          mentor={activeMentor}
          teamMentor={teamMentor}
          stats={mentorStats}
          mentorUrl={mentorUrl}
          onReportClick={() => document.getElementById("mentor-report")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        />
      </section>

      <section className="space-y-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Bantuan lainnya</p>
        <SupportCard
          number="02"
          icon={Bot}
          title="Tanya AI BuatCuan"
          desc="Jawab otomatis kapan saja untuk pertanyaan umum dan teknis website."
          badge="24 Jam"
          tone="violet"
          action={aiUrl}
        />
        <SupportCard
          number="03"
          icon={Building2}
          title="Tim BuatCuan"
          desc="Masalah serius, laporan mentor, atau pertanyaan yang butuh penanganan langsung."
          badge="Online"
          tone="sky"
          action={teamUrl}
        />
      </section>

      <ReportMentorCard
        canReport={Boolean(activeMentor)}
        evidence={evidence}
        latestReport={latestReport}
        reason={reason}
        isPending={reportMentor.isPending}
        onEvidenceChange={setEvidence}
        onReasonChange={setReason}
        onSubmit={() => {
          if (!activeMentor) {
            toast.error("Mentor kamu sedang dialihkan ke Tim BuatCuan");
            return;
          }
          if (!evidence) {
            toast.error("Screenshot WA wajib dilampirkan");
            return;
          }
          reportMentor.mutate();
        }}
      />

      <SanctionFlowCard />
    </div>
  );
};

function MentorPriorityCard({
  mentor,
  teamMentor,
  stats,
  mentorUrl,
  onReportClick,
}: {
  mentor?: MyMentorDto["mentor"] | null;
  teamMentor?: MyMentorDto["teamMentor"] | null;
  stats: ReturnType<typeof getMentorStats>;
  mentorUrl: string;
  onReportClick: () => void;
}) {
  const mentorName = mentor?.name ?? teamMentor?.name ?? "Tim BuatCuan";
  const joinedText = mentor ? "Bergabung sejak Maret 2024" : "Mentor kamu ditangani langsung oleh perusahaan";

  return (
    <div className="rounded-[28px] border border-violet-500/45 bg-gradient-to-b from-violet-500/15 via-card to-card p-5 shadow-[0_0_0_1px_rgba(139,92,246,0.08)]">
      <div className="flex items-center gap-4">
        <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-violet-500/45 bg-violet-500/15 text-3xl">
          <Users className="h-8 w-8 text-violet-300" />
          <span className="absolute bottom-1 right-0 h-4 w-4 rounded-full border-2 border-card bg-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">Mentor kamu</p>
          <h2 className="truncate text-2xl font-black">{mentorName}</h2>
          <p className="text-sm font-semibold text-muted-foreground">{joinedText}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <MetricBox value={`${stats.responsiveRate}%`} label="Responsif" tone="primary" />
        <MetricBox value={String(stats.activeMembers)} label="Member aktif" />
        <MetricBox value={stats.rating.toFixed(1)} label="Rating" tone="yellow" icon={<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />} />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-black text-muted-foreground">
        <Clock className="h-4 w-4 shrink-0 text-primary" />
        <span>
          Rata-rata balas dalam <span className="text-primary">{stats.averageReply}</span> - wajib balas maks 24 jam
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <Button
          type="button"
          disabled={!mentorUrl}
          onClick={() => mentorUrl && window.open(mentorUrl, "_blank", "noopener,noreferrer")}
          className="h-14 w-full rounded-2xl bg-primary text-base font-black text-primary-foreground hover:bg-primary/90"
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Hubungi Mentor via WhatsApp
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!mentor}
          onClick={onReportClick}
          className="h-12 w-full rounded-2xl border-destructive/35 bg-destructive/5 font-black text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <ShieldAlert className="mr-2 h-4 w-4" />
          Laporkan Mentor Tidak Responsif
        </Button>
      </div>
    </div>
  );
}

function MetricBox({ value, label, tone = "default", icon }: { value: string; label: string; tone?: "default" | "primary" | "yellow"; icon?: React.ReactNode }) {
  const valueClass = tone === "primary" ? "text-primary" : tone === "yellow" ? "text-yellow-400" : "text-foreground";
  return (
    <div className="min-w-0 rounded-2xl bg-white/[0.04] px-2 py-4 text-center">
      <p className={`flex items-center justify-center gap-1 text-xl font-black ${valueClass}`}>
        {value}
        {icon}
      </p>
      <p className="mt-1 text-xs font-bold text-muted-foreground">{label}</p>
    </div>
  );
}

function SupportCard({
  number,
  icon: Icon,
  title,
  desc,
  badge,
  tone,
  action,
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  badge: string;
  tone: "violet" | "sky";
  action: string;
}) {
  const toneClass = tone === "violet"
    ? "bg-violet-500/15 text-violet-300"
    : "bg-sky-500/15 text-sky-300";
  const badgeClass = tone === "violet"
    ? "bg-violet-500/15 text-violet-300"
    : "bg-primary/15 text-primary";

  return (
    <button
      type="button"
      disabled={!action}
      onClick={() => action && window.open(action, "_blank", "noopener,noreferrer")}
      className="flex w-full items-center gap-4 rounded-3xl border border-border bg-card p-4 text-left transition hover:border-primary/30 hover:bg-secondary"
    >
      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${toneClass}`}>
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-xs font-black text-muted-foreground">{number} - {badge === "Online" ? "Darurat" : "Alternatif"}</span>
        <span className="mt-1 block text-lg font-black">{title}</span>
        <span className="mt-1 block text-sm font-semibold leading-relaxed text-muted-foreground">{desc}</span>
      </span>
      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${badgeClass}`}>{badge}</span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function ReportMentorCard({
  canReport,
  evidence,
  latestReport,
  reason,
  isPending,
  onEvidenceChange,
  onReasonChange,
  onSubmit,
}: {
  canReport: boolean;
  evidence: File | null;
  latestReport?: MyMentorDto["reports"][number];
  reason: string;
  isPending: boolean;
  onEvidenceChange: (file: File | null) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section id="mentor-report" className="overflow-hidden rounded-[28px] border border-destructive/35 bg-destructive/10">
      <div className="border-b border-destructive/20 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <h2 className="text-xl font-black text-destructive">Laporan Mentor Tidak Responsif</h2>
            <p className="text-sm font-semibold text-destructive/75">Gunakan jika mentor tidak balas lebih dari 24 jam.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-3">
          {[
            ["1", "Pastikan sudah 24 jam sejak pesan pertama kamu dikirim tanpa balasan dari mentor."],
            ["2", "Siapkan screenshot percakapan WA yang menunjukkan pesan kamu dan mentor tidak balas."],
            ["3", "Lampirkan screenshot di bawah dan kirim laporan. Tim BuatCuan verifikasi dalam 1x24 jam."],
          ].map(([step, text]) => (
            <div key={step} className="grid grid-cols-[36px_1fr] gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-destructive/20 text-sm font-black text-destructive">{step}</span>
              <p className="pt-1 text-sm font-bold leading-relaxed text-foreground/85">{text}</p>
            </div>
          ))}
        </div>

        <label className="grid min-h-[124px] cursor-pointer place-items-center rounded-3xl border border-dashed border-destructive/45 bg-destructive/5 px-4 py-6 text-center transition hover:bg-destructive/10">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => onEvidenceChange(event.target.files?.[0] ?? null)}
            className="hidden"
          />
          <span className="space-y-2">
            <Upload className="mx-auto h-6 w-6 text-destructive/75" />
            <span className="block text-sm font-black text-muted-foreground">
              {evidence ? evidence.name : "Lampirkan screenshot percakapan WA"}
            </span>
            <span className="block text-xs font-black text-destructive/70">Format JPG / PNG / WEBP - maks 5MB</span>
          </span>
        </label>

        <Textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="Catatan singkat opsional, contoh: saya chat kemarin jam 19.00 tapi belum dibalas sampai sekarang."
          className="min-h-[92px] resize-none rounded-2xl border-destructive/20 bg-background/70"
        />

        <Button
          type="button"
          disabled={!canReport || !evidence || isPending}
          onClick={onSubmit}
          className="h-14 w-full rounded-2xl bg-destructive text-base font-black text-destructive-foreground hover:bg-destructive/90"
        >
          {isPending ? "Mengirim Laporan..." : "Kirim Laporan Sekarang"}
        </Button>

        {latestReport && (
          <p className="rounded-2xl bg-background/50 px-4 py-3 text-xs font-bold text-muted-foreground">
            Laporan terakhir: <span className="font-black text-foreground">{latestReport.status}</span>
          </p>
        )}
      </div>
    </section>
  );
}

function SanctionFlowCard() {
  const items = [
    { icon: ShieldAlert, title: "Laporan 1", desc: "Teguran", tone: "text-yellow-400 bg-yellow-400/10" },
    { icon: MinusCircle, title: "Laporan 2", desc: "Komisi ditahan", tone: "text-rose-400 bg-rose-400/10" },
    { icon: Ban, title: "Laporan 3", desc: "Akun diblokir", tone: "text-red-400 bg-red-400/10" },
    { icon: Building2, title: "Kamu", desc: "Ke Tim BC", tone: "text-sky-300 bg-sky-400/10" },
  ] as const;

  return (
    <section className="rounded-[28px] border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-black text-muted-foreground">Apa yang terjadi setelah laporan?</h2>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_18px_1fr_18px_1fr_18px_1fr] items-center gap-2">
        {items.map((item, index) => (
          <FragmentItem key={item.title} item={item} showArrow={index < items.length - 1} />
        ))}
      </div>
    </section>
  );
}

function FragmentItem({
  item,
  showArrow,
}: {
  item: { icon: LucideIcon; title: string; desc: string; tone: string };
  showArrow: boolean;
}) {
  const Icon = item.icon;
  return (
    <>
      <div className="min-h-[96px] rounded-2xl bg-secondary p-3 text-center">
        <span className={`mx-auto grid h-10 w-10 place-items-center rounded-xl ${item.tone}`}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="mt-2 text-xs font-black text-muted-foreground">{item.title}</p>
        <p className="text-xs font-black text-muted-foreground">{item.desc}</p>
      </div>
      {showArrow && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
    </>
  );
}

function getMentorStats(mentor?: MyMentorDto["mentor"] | null) {
  const rating = Number(mentor?.mentorRatingAvg ?? 4.9);
  if (!mentor) {
    return { responsiveRate: 100, activeMembers: 0, rating: 5, averageReply: "langsung" };
  }
  if (mentor.mentorStatus === "WARNING") {
    return { responsiveRate: 82, activeMembers: 18, rating, averageReply: "6 jam" };
  }
  if (mentor.mentorStatus === "COMMISSION_HELD") {
    return { responsiveRate: 64, activeMembers: 12, rating, averageReply: "12 jam" };
  }
  return { responsiveRate: 98, activeMembers: 47, rating, averageReply: "2 jam" };
}

export default Bimbingan;
