import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Ban, Calculator, CheckCircle2, Copy, Crown, HelpCircle, History, Link2, MessageCircle, MinusCircle, Play, Repeat2, Share2, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { ManagedUsageVideoCard } from "@/components/ManagedUsageVideoCard";
import { Button } from "@/components/ui/button";
import { ShowMoreList } from "@/components/ShowMoreList";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";

const memberOptions = [3, 5, 10, 20] as const;
const durationOptions = [
  { label: "3 bln", months: 3 },
  { label: "6 bln", months: 6 },
  { label: "1 thn", months: 12 },
] as const;

const workSteps = [
  {
    title: "Daftar & input nomor WA aktif",
    body: "Nomor WA kamu adalah kontak utama bagi member yang kamu referensikan. Wajib aktif dan responsif.",
    chip: "Nomor WA = identitas mentor kamu",
  },
  {
    title: "Sebar link affiliate kamu",
    body: "Taruh di bio, caption konten, atau kirim lewat DM & WA. Setiap orang yang daftar lewat linkmu otomatis terhubung ke kamu sebagai mentornya.",
    chip: "Link ada di bawah, siap disalin",
  },
  {
    title: "Mereka daftar & upgrade PRO",
    body: "Komisi langsung masuk ke saldo kamu otomatis. Tracking real-time 24 jam, tidak perlu laporan manual.",
    chip: "Komisi masuk otomatis",
  },
  {
    title: "Mereka perpanjang, komisi masuk lagi",
    body: "Setiap 3 bulan mereka perpanjang PRO, komisi 50% masuk lagi ke saldo kamu. Terus berulang selama mereka aktif.",
    chip: "Cuan pasif berulang selamanya",
  },
] as const;

const mentorDuties = [
  {
    title: "Nomor WA aktif & bisa dihubungi",
    body: "Nomor WA kamu adalah kontak utama member. Wajib aktif selama kamu terdaftar sebagai mentor.",
    tone: "primary",
  },
  {
    title: "Balas pesan member dalam 24 jam",
    body: "Jika member menghubungi kamu lewat WA, wajib dibalas maksimal 24 jam. Tidak ada alasan kecuali kondisi darurat.",
    tone: "accent",
  },
  {
    title: "Jaga reputasi sebagai mentor",
    body: "Member yang kamu bawa adalah tanggung jawabmu. Bantu mereka berkembang. Semakin mereka aktif, semakin lama mereka perpanjang, semakin besar cuan kamu.",
    tone: "destructive",
  },
] as const;

const sanctionStages = [
  {
    icon: AlertTriangle,
    title: "Peringatan 1 - Teguran Resmi",
    body: "Member lapor dan lampirkan screenshot WA sebagai bukti. Tim BuatCuan verifikasi. Jika terbukti, mentor dapat teguran resmi. Komisi tetap jalan.",
    tags: ["Butuh bukti screenshot WA", "Komisi tetap jalan"],
    className: "border-accent/35 bg-accent/10 text-accent",
  },
  {
    icon: MinusCircle,
    title: "Peringatan 2 - Komisi Ditahan",
    body: "Laporan kedua terbukti. Komisi mentor ditahan sementara selama investigasi. Komisi yang sudah masuk tetap milik mentor tapi belum bisa dicairkan.",
    tags: ["Komisi tetap tercatat", "Dana tertahan"],
    className: "border-orange-500/35 bg-orange-500/10 text-orange-400",
  },
  {
    icon: Ban,
    title: "Peringatan 3 - Akun Diblokir",
    body: "Pelanggaran fatal atau 3x laporan terbukti. Akun diblokir. Member otomatis pindah ke Tim BuatCuan. Mentor bisa ajukan banding. Jika pelanggaran fatal, blokir permanen.",
    tags: ["Mentor pindah ke Tim BuatCuan", "Bisa banding non-fatal"],
    className: "border-destructive/35 bg-destructive/10 text-destructive",
  },
] as const;

const faqItems = [
  {
    question: "Kapan komisi masuk ke saldo?",
    answer: "Komisi masuk otomatis dalam 1x24 jam setelah member menyelesaikan pembayaran PRO atau perpanjangan. Berlaku juga untuk setiap renewal berikutnya.",
  },
  {
    question: "Apakah komisi juga masuk saat member perpanjang?",
    answer: "Ya, selalu. Setiap member yang kamu referensikan perpanjang PRO, komisi 50% tetap masuk ke saldo kamu. Ini yang disebut cuan pasif berulang.",
  },
  {
    question: "Komisi saya aman jika akun dapat peringatan?",
    answer: "Komisi yang sudah masuk sebelum penahanan tetap milik kamu. Jika akun ditahan, saldo bisa tetap tercatat tapi belum bisa dicairkan sampai proses review selesai.",
  },
  {
    question: "Apa yang terjadi ke member saya jika akun diblokir?",
    answer: "Member yang kamu bawa tidak terdampak sama sekali. Mereka otomatis dipindahkan ke Tim BuatCuan yang akan menggantikan peran mentormu.",
  },
  {
    question: "Bisakah akun yang diblokir dibuka kembali?",
    answer: "Bisa, melalui proses banding resmi ke tim BuatCuan. Jika pelanggaran tidak fatal dan ada perbaikan yang terbukti, akun bisa diaktifkan kembali. Pelanggaran fatal bisa berakhir blokir permanen.",
  },
] as const;

const AffiliateGuideTool = ({ slug }: { slug: string }) => {
  const { user } = useApp();
  const [openFaq, setOpenFaq] = useState(0);
  const [selectedMembers, setSelectedMembers] = useState<number>(5);
  const [selectedMonths, setSelectedMonths] = useState<number>(6);
  const { data: toolData } = useQuery({
    queryKey: ["tool", slug, "panduan-affiliate-lengkap"],
    queryFn: () => api.tools.detail(slug, { category: "ALL" }),
  });
  const { data } = useQuery({ queryKey: ["affiliate-summary"], queryFn: api.affiliate.summary });

  const locked = Boolean(toolData?.tool.isLocked);
  const link = data?.link ?? `${window.location.origin}/r/${encodeURIComponent(user?.wa ?? "buatcuan")}`;
  const nextRate = data?.nextCommissionRate ?? 0.5;
  const proPrice = 297000;
  const freeCommission = Math.round(proPrice * 0.1);
  const proCommission = Math.round(proPrice * nextRate);
  const renewalCycles = Math.max(1, Math.ceil(selectedMonths / 3));
  const potentialCommission = selectedMembers * renewalCycles * proCommission;
  const commissions = data?.commissions ?? [];
  const totalCommission = data?.stats.commission ?? user?.balance ?? 0;

  const shareText = useMemo(() => `Mulai belajar bikin konten dan cuan dari HP bareng BuatCuan: ${link}`, [link]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    toast.success("Link affiliate disalin");
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
  };

  const openPlatformAfterCopy = async (url: string, label: string) => {
    await copyLink();
    toast.info(`Link disalin. Tempel di ${label}.`);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Panduan Komisi</h1>
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-extrabold text-accent">
              <Crown className="h-3.5 w-3.5" /> PRO
            </span>
          </div>
        </div>
      </div>

      <UsageCard />
      <MentorCommissionHero
        freeCommission={freeCommission}
        proCommission={proCommission}
        selectedMembers={selectedMembers}
        selectedMonths={selectedMonths}
        renewalCycles={renewalCycles}
        potentialCommission={potentialCommission}
        onMembersChange={setSelectedMembers}
        onMonthsChange={setSelectedMonths}
      />

      {locked && (
        <Link to="/app/payment" className="block rounded-2xl border border-accent/35 bg-accent/10 p-4 text-sm font-extrabold text-accent">
          Buka PRO untuk akses penuh panduan komisi dan semua alat bantu.
        </Link>
      )}

      <section className="space-y-4">
        <SectionTitle icon={<CheckCircle2 className="h-4 w-4" />} title="Cara Kerja Komisi" />
        <div className="relative space-y-0">
          {workSteps.map((step, index) => (
            <TimelineStep key={step.title} number={index + 1} step={step} last={index === workSteps.length - 1} />
          ))}
        </div>
      </section>

      <AffiliateLinkCard link={link} copyLink={copyLink} shareWhatsApp={shareWhatsApp} openPlatformAfterCopy={openPlatformAfterCopy} />
      <MentorDuties />
      <SanctionSystem />
      <CommissionHistory commissions={commissions} totalCommission={totalCommission} />
      <FaqSection openFaq={openFaq} setOpenFaq={setOpenFaq} />
    </div>
  );
};

function UsageCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app/tools/panduan-affiliate-lengkap"
      className="border-accent/25"
      accentClassName="border-accent/50 bg-accent/15 text-accent"
      fallback={{
        title: "Panduan Lengkap Sistem Mentor Cuan",
        subtitle: "Cara kerja komisi, kewajiban mentor, dan cuan berulang",
        durationLabel: "5 menit",
        thumbnailGradient: "from-yellow-950 via-lime-950 to-zinc-950",
      }}
    />
  );
}

function MentorCommissionHero({
  freeCommission,
  proCommission,
  selectedMembers,
  selectedMonths,
  renewalCycles,
  potentialCommission,
  onMembersChange,
  onMonthsChange,
}: {
  freeCommission: number;
  proCommission: number;
  selectedMembers: number;
  selectedMonths: number;
  renewalCycles: number;
  potentialCommission: number;
  onMembersChange: (value: number) => void;
  onMonthsChange: (value: number) => void;
}) {
  return (
    <section className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-black text-accent">
        <ShieldCheck className="h-3.5 w-3.5" />
        PROGRAM MENTOR CUAN
      </span>
      <h2 className="mt-4 text-xl font-extrabold leading-tight">Setiap Member adalah <span className="text-accent">Mentor</span></h2>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
        Referensikan orang, dibayar komisi tiap mereka upgrade PRO. Bukan kerja sekali dapat sekali, tapi{" "}
        <span className="font-black text-accent">cuan pasif berulang selamanya.</span>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <RateCard label="FREE MEMBER" rate="10%" desc="per penjualan" example={`Rp297rb -> ${formatRupiah(freeCommission)}`} muted />
        <RateCard label="+ PRO MEMBER" rate="50%" desc="per penjualan" example={`Rp297rb -> ${formatRupiah(proCommission)}`} />
      </div>

      <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3">
        <p className="flex items-center gap-2 text-sm font-extrabold text-primary">
          <Repeat2 className="h-4 w-4" />
          Komisi Berulang, Tiap Kali Mereka Perpanjang
        </p>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">
          Referensikan 1 orang, mereka perpanjang tiap 3 bulan, komisi terus masuk ke kamu selamanya selama mereka aktif.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-accent/25 bg-background/55 p-3">
        <p className="flex items-center gap-2 text-sm font-extrabold">
          <Calculator className="h-4 w-4 text-accent" />
          Kalkulator Potensi Cuan Pasif
        </p>
        <ControlRow label="Jumlah member aktif kamu" options={memberOptions.map((value) => ({ label: String(value), value }))} selected={selectedMembers} onSelect={onMembersChange} />
        <ControlRow label="Aktif selama" options={durationOptions.map((item) => ({ label: item.label, value: item.months }))} selected={selectedMonths} onSelect={onMonthsChange} />
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground">Estimasi komisi kamu</p>
            <p className="text-2xl font-black text-accent">{formatRupiah(potentialCommission)}</p>
          </div>
          <p className="max-w-[150px] text-right text-[11px] font-bold text-accent">
            {selectedMembers} member × {renewalCycles} perpanjangan × {formatRupiah(proCommission)}
          </p>
        </div>
      </div>
    </section>
  );
}

function RateCard({ label, rate, desc, example, muted = false }: { label: string; rate: string; desc: string; example: string; muted?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${muted ? "border-border bg-background/45 text-muted-foreground" : "border-accent/50 bg-accent/10 text-accent"}`}>
      <p className="text-[10px] font-black">{label}</p>
      <p className="mt-1 text-4xl font-black">{rate}</p>
      <p className="text-xs font-bold">{desc}</p>
      <p className="mt-3 border-t border-current/15 pt-2 text-[10px] font-semibold">{example}</p>
    </div>
  );
}

function ControlRow({ label, options, selected, onSelect }: { label: string; options: Array<{ label: string; value: number }>; selected: number; onSelect: (value: number) => void }) {
  return (
    <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="flex gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`min-w-9 rounded-lg px-2 py-1.5 text-[11px] font-black transition-colors ${
              selected === option.value ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AffiliateLinkCard({
  link,
  copyLink,
  shareWhatsApp,
  openPlatformAfterCopy,
}: {
  link: string;
  copyLink: () => Promise<void>;
  shareWhatsApp: () => void;
  openPlatformAfterCopy: (url: string, label: string) => Promise<void>;
}) {
  return (
    <section className="space-y-3">
      <SectionTitle icon={<Link2 className="h-4 w-4" />} title="Link Affiliate Kamu" />
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 rounded-xl border border-accent/35 bg-accent/10 p-2">
          <span className="min-w-0 flex-1 truncate px-2 font-mono text-xs font-bold text-accent">{link}</span>
          <Button type="button" onClick={copyLink} variant="outline" className="h-11 shrink-0 rounded-xl font-extrabold">
            <Copy className="mr-2 h-4 w-4" /> Salin
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button type="button" onClick={shareWhatsApp} variant="outline" className="h-10 rounded-xl text-xs font-extrabold">
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WA
          </Button>
          <Button type="button" onClick={() => openPlatformAfterCopy("https://www.tiktok.com/upload", "TikTok")} variant="outline" className="h-10 rounded-xl text-xs font-extrabold">
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> TikTok
          </Button>
          <Button type="button" onClick={() => openPlatformAfterCopy("https://www.instagram.com/", "Instagram")} variant="outline" className="h-10 rounded-xl text-xs font-extrabold">
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> Instagram
          </Button>
        </div>
      </div>
    </section>
  );
}

function MentorDuties() {
  return (
    <section className="space-y-3">
      <SectionTitle icon={<ShieldCheck className="h-4 w-4" />} title="Kewajiban Sebagai Mentor" />
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="space-y-3">
          {mentorDuties.map((item) => (
            <div key={item.title} className="flex gap-3 rounded-xl bg-secondary p-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.tone === "primary" ? "bg-primary/15 text-primary" : item.tone === "accent" ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"}`}>
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-extrabold">{item.title}</p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SanctionSystem() {
  return (
    <section className="space-y-3">
      <SectionTitle icon={<AlertTriangle className="h-4 w-4" />} title="Sistem Sanksi Mentor" />
      <div className="space-y-3">
        {sanctionStages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div key={stage.title} className={`rounded-2xl border p-4 ${stage.className}`}>
              <p className="flex items-start gap-3 text-sm font-extrabold">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                {stage.title}
              </p>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-muted-foreground">{stage.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {stage.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-current/10 px-2 py-1 text-[10px] font-black">{tag}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CommissionHistory({
  commissions,
  totalCommission,
}: {
  commissions: Array<{ id: string; memberName: string; plan: string; commissionAmount: number }>;
  totalCommission: number;
}) {
  return (
    <section className="space-y-3">
      <SectionTitle icon={<History className="h-4 w-4" />} title="Riwayat Komisi" />
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 font-extrabold">
            <Wallet className="h-4 w-4 text-accent" />
            Komisi Bulan Ini
          </p>
          <div className="text-right">
            <p className="text-[11px] font-semibold text-muted-foreground">Total diterima</p>
            <p className="text-xl font-black text-accent">{formatRupiah(totalCommission)}</p>
          </div>
        </div>
        {commissions.length === 0 ? (
          <div className="grid min-h-[140px] place-items-center text-center">
            <div>
              <Wallet className="mx-auto h-8 w-8 text-muted-foreground/45" />
              <p className="mt-3 text-sm font-semibold text-muted-foreground">Belum ada komisi bulan ini.</p>
              <p className="text-sm font-bold text-muted-foreground">Mulai sebar link & cuan pertamamu.</p>
            </div>
          </div>
        ) : (
          <ShowMoreList
            items={commissions}
            initial={3}
            step={3}
            className="mt-4 space-y-2"
            renderItem={(commission) => (
              <div key={commission.id} className="rounded-xl bg-secondary p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">{commission.memberName}</p>
                    <p className="text-xs font-semibold text-muted-foreground">{commission.plan}</p>
                  </div>
                  <p className="shrink-0 text-sm font-black text-accent">{formatRupiah(commission.commissionAmount)}</p>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </section>
  );
}

function FaqSection({ openFaq, setOpenFaq }: { openFaq: number; setOpenFaq: (value: number) => void }) {
  return (
    <section className="space-y-3">
      <SectionTitle icon={<HelpCircle className="h-4 w-4" />} title="Pertanyaan Umum" />
      <div className="space-y-3">
        {faqItems.map((item, index) => {
          const active = openFaq === index;
          return (
            <button
              key={item.question}
              type="button"
              onClick={() => setOpenFaq(active ? -1 : index)}
              className={`w-full rounded-2xl border p-4 text-left transition-colors ${active ? "border-accent/45 bg-accent/10" : "border-border bg-card"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className={`text-sm font-extrabold ${active ? "text-accent" : "text-foreground"}`}>{item.question}</p>
                <HelpCircle className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-accent" : "text-muted-foreground"}`} />
              </div>
              {active && <p className="mt-3 text-xs font-semibold leading-relaxed text-muted-foreground">{item.answer}</p>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TimelineStep({ number, step, last }: { number: number; step: (typeof workSteps)[number]; last: boolean }) {
  return (
    <div className="relative grid grid-cols-[36px_1fr] gap-3 pb-5 last:pb-0">
      {!last && <span className="absolute left-[17px] top-9 h-[calc(100%-30px)] w-px bg-accent/35" />}
      <span className="relative z-10 grid h-9 w-9 place-items-center rounded-full border border-accent/50 bg-accent/15 text-sm font-black text-accent">
        {number}
      </span>
      <div className="pt-1">
        <h3 className="font-extrabold">{step.title}</h3>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">{step.body}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-accent/35 bg-accent/10 px-3 py-1.5 text-[11px] font-black text-accent">
          <ArrowRight className="h-3 w-3" />
          {step.chip}
        </span>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-accent">
      {icon}
      <h2 className="font-extrabold text-foreground">{title}</h2>
    </div>
  );
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export { AffiliateGuideTool };
