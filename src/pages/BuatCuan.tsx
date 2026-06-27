import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Award,
  Copy,
  Crown,
  Flame,
  MousePointerClick,
  PlayCircle,
  Share2,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShowMoreList } from "@/components/ShowMoreList";
import { formatIDR, useApp } from "@/context/AppContext";
import { api, type MentorDashboardDto } from "@/lib/api";

const memberOptions = [10, 20, 50, 100, 1000] as const;
const renewalOptions = [1, 2, 4, 8] as const;
const proPlanPrice = 297_000;
const proCommission = Math.round(proPlanPrice * 0.5);

const fallbackMembers: DisplayMember[] = [
  { id: "demo-1", name: "Dewi Kartika", status: "PRO", joinedAt: "2024-02-12", commission: 297_000, renewalCount: 2, whatsapp: "628123000001" },
  { id: "demo-2", name: "Budi Santoso", status: "PRO", joinedAt: "2024-03-03", commission: 148_500, renewalCount: 1, whatsapp: "628123000002" },
  { id: "demo-3", name: "Rina Marlina", status: "PRO", joinedAt: "2024-03-20", commission: 148_500, renewalCount: 1, whatsapp: "628123000003" },
  { id: "demo-4", name: "Siti Rahayu", status: "FREE", joinedAt: "2024-04-01", commission: 0, renewalCount: 0, whatsapp: "628123000004" },
];

const fallbackCommissions: DisplayCommission[] = [
  { id: "demo-c-1", memberName: "Dewi Kartika", title: "Perpanjang ke-2", amount: 148_500, type: "Komisi berulang", date: "2 hari yang lalu", renewalNumber: 2 },
  { id: "demo-c-2", memberName: "Budi Santoso", title: "Perpanjang ke-1", amount: 148_500, type: "Komisi berulang", date: "5 hari yang lalu", renewalNumber: 1 },
  { id: "demo-c-3", memberName: "Rina Marlina", title: "Upgrade PRO", amount: 148_500, type: "Komisi pertama", date: "20 Mar 2024", renewalNumber: 0 },
];

const BuatCuan = () => {
  const { user } = useApp();
  const [selectedMembers, setSelectedMembers] = useState<(typeof memberOptions)[number]>(20);
  const [selectedRenewals, setSelectedRenewals] = useState<(typeof renewalOptions)[number]>(2);

  const { data: affiliate } = useQuery({ queryKey: ["affiliate-summary"], queryFn: api.affiliate.summary });
  const { data: mentorDashboard } = useQuery({ queryKey: ["mentor-dashboard", "buatcuan"], queryFn: api.affiliate.mentor, enabled: Boolean(user) });
  const { data: landingPages = [] } = useQuery({ queryKey: ["mentor-landing-pages", "buatcuan"], queryFn: api.affiliate.landingPages, enabled: Boolean(user) });

  if (!user) return null;

  const referralLink = landingPages.find((page) => page.isDefault)?.shareUrl ?? landingPages[0]?.shareUrl ?? affiliate?.link ?? `${window.location.origin}/r/${encodeURIComponent(user.wa)}`;
  const realMembers = mapMembers(mentorDashboard?.members ?? []);
  const members = realMembers.length ? realMembers : fallbackMembers;
  const proMembers = members.filter((member) => member.status === "PRO").length;
  const freeMembers = members.filter((member) => member.status === "FREE").length;
  const activeMemberCount = members.length;
  const totalCommission = getTotalCommission(mentorDashboard, affiliate, user.balance, members);
  const recurringPerPeriod = Math.max(proMembers * proCommission, 0);
  const clicksToday = affiliate?.stats.clicks || mentorDashboard?.stats.clicks || 28;
  const warnings = affiliate?.mentorStatus === "WARNING" ? 1 : 0;
  const perRenewalTotal = selectedMembers * proCommission;
  const selectedRenewalTotal = perRenewalTotal * selectedRenewals;
  const longTermTotal = perRenewalTotal * 8;
  const commissions = mapCommissions(mentorDashboard?.commissions, affiliate?.commissions);
  const commissionRows = commissions.length ? commissions : fallbackCommissions;
  const withdrawable = commissionRows
    .filter((item) => item.status !== "CANCELLED")
    .reduce((sum, item) => sum + item.amount, 0) || totalCommission;
  const shareText = `Yuk gabung BuatCuan lewat link aku: ${referralLink}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    toast.success("Link +BuatCuan disalin");
  };

  return (
    <div className="space-y-5 pb-3">
      <MentorStatusCard
        name={user.name}
        activeMembers={activeMemberCount}
        totalCommission={totalCommission}
        warnings={warnings}
      />

      <SectionLabel>Statistik Real-time</SectionLabel>
      <VideoGuideCard
        title="Cara Baca Statistik Kamu"
        desc="Apa arti setiap angka & cara meningkatkannya"
        duration="3 mnt"
        tone="sky"
      />
      <section className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} value={String(activeMemberCount)} label="Member aktif saya" hint={`${proMembers} PRO · ${freeMembers} FREE`} tone="primary" />
        <StatCard icon={Wallet} value={formatShortIDR(totalCommission)} label="Total komisi" hint="+Rp148rb bulan ini" tone="yellow" />
        <StatCard icon={TrendingUp} value={formatShortIDR(recurringPerPeriod)} label="Komisi berulang/3bln" hint={`Dari ${proMembers} PRO member`} tone="rose" />
        <StatCard icon={MousePointerClick} value={String(clicksToday)} label="Klik link hari ini" hint="Ada yang tertarik!" tone="sky" />
      </section>

      <PassiveIncomeCalculator
        selectedMembers={selectedMembers}
        selectedRenewals={selectedRenewals}
        perRenewalTotal={perRenewalTotal}
        selectedRenewalTotal={selectedRenewalTotal}
        longTermTotal={longTermTotal}
        onMembersChange={setSelectedMembers}
        onRenewalsChange={setSelectedRenewals}
      />

      <SectionLabel>Link Affiliate Kamu</SectionLabel>
      <AffiliateLinkCard
        link={referralLink}
        clickCount={clicksToday}
        shareText={shareText}
        onCopy={copyLink}
      />
      <MentorClosingKit referralLink={referralLink} />

      <AttentionCard members={members} />
      <MentorProofCard />
      <WeeklyMentorChallenge />

      <SectionLabel>Member Aktif Saya</SectionLabel>
      <MembersList members={members} totalCommission={totalCommission} />

      <SectionLabel>Riwayat Komisi</SectionLabel>
      <CommissionHistory rows={commissionRows} withdrawable={withdrawable} />
    </div>
  );
};

function MentorStatusCard({ name, activeMembers, totalCommission, warnings }: { name: string; activeMembers: number; totalCommission: number; warnings: number }) {
  return (
    <section className="rounded-[28px] border border-yellow-500/45 bg-yellow-500/10 p-5">
      <VideoGuideCard
        title="Cara Kerja Program Mentor Cuan"
        desc="Pahami sistem sebelum mulai promosi"
        duration="4 mnt"
        tone="yellow"
        className="mb-5"
      />
      <div className="flex items-center gap-4">
        <span className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-yellow-500/50 bg-yellow-500/10 text-yellow-300">
          <UserCheck className="h-8 w-8" />
          <span className="absolute bottom-1 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-yellow-300">Status Mentor Kamu</p>
          <h1 className="truncate text-xl font-black">{name}</h1>
          <p className="text-xs font-semibold text-muted-foreground">Mentor sejak Maret 2024</p>
        </div>
      </div>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-xs font-black text-yellow-300">
        <Crown className="h-4 w-4" />
        Mentor Bintang
        <span className="inline-flex gap-0.5">
          {[1, 2, 3].map((item) => <Star key={item} className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <MiniStat value={String(activeMembers)} label="Member aktif" tone="primary" />
        <MiniStat value={formatShortIDR(totalCommission)} label="Total komisi" tone="yellow" />
        <MiniStat value="4.8" label="Rating" tone="primary" star />
        <MiniStat value={String(warnings)} label="Peringatan" tone="default" />
      </div>
    </section>
  );
}

function PassiveIncomeCalculator({
  selectedMembers,
  selectedRenewals,
  perRenewalTotal,
  selectedRenewalTotal,
  longTermTotal,
  onMembersChange,
  onRenewalsChange,
}: {
  selectedMembers: (typeof memberOptions)[number];
  selectedRenewals: (typeof renewalOptions)[number];
  perRenewalTotal: number;
  selectedRenewalTotal: number;
  longTermTotal: number;
  onMembersChange: (value: (typeof memberOptions)[number]) => void;
  onRenewalsChange: (value: (typeof renewalOptions)[number]) => void;
}) {
  return (
    <section className="rounded-[28px] border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-black">Kalkulator Passive Income</h2>
        <span className="text-xs font-bold text-muted-foreground">Geser & lihat potensimu</span>
      </div>

      <VideoGuideCard
        title="Cara Kerja Komisi Berulang"
        desc="Kenapa semakin lama semakin besar hasilnya"
        duration="5 mnt"
        tone="primary"
        className="mt-4"
      />

      <div className="mt-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs font-semibold leading-relaxed text-muted-foreground">
        <span className="font-black text-yellow-300">Komisi berulang</span> = tiap kali member perpanjang PRO, komisi masuk lagi ke kamu. Semakin lama mereka aktif, semakin besar cuan pasif kamu.
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-xs font-bold text-muted-foreground">Jumlah member aktif PRO</p>
        <div className="grid grid-cols-5 gap-2">
          {memberOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onMembersChange(item)}
              className={`h-11 rounded-xl border text-xs font-black transition ${selectedMembers === item ? "border-yellow-500 bg-yellow-500/15 text-yellow-300" : "border-border bg-secondary text-muted-foreground"}`}
            >
              {item === 1000 ? "1.000" : item}
            </button>
          ))}
        </div>

        <p className="pt-1 text-xs font-bold text-muted-foreground">Berapa kali mereka perpanjang?</p>
        <div className="grid grid-cols-4 gap-2">
          {renewalOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onRenewalsChange(item)}
              className={`h-11 rounded-xl border text-xs font-black transition ${selectedRenewals === item ? "border-yellow-500 bg-yellow-500/15 text-yellow-300" : "border-border bg-secondary text-muted-foreground"}`}
            >
              {item}x
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <IncomeResult
          label="Per 3 bulan / perpanjangan"
          value={perRenewalTotal}
          monthlyValue={perRenewalTotal / 3}
          desc={`${selectedMembers} member aktif x 1 siklus`}
          tone="yellow"
        />
        <IncomeResult
          label={`Total ${selectedRenewals}x perpanjang`}
          value={selectedRenewalTotal}
          monthlyValue={selectedRenewalTotal / (selectedRenewals * 3)}
          desc={`${selectedMembers} member x ${selectedRenewals}x`}
          tone="primary"
        />
        <IncomeResult
          label="Jika terus aktif"
          value={longTermTotal}
          monthlyValue={longTermTotal / 24}
          desc="Asumsi 8x perpanjang"
          tone="rose"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-secondary/60 p-3 text-xs font-semibold leading-relaxed text-muted-foreground">
        <span className="font-black text-yellow-300">Kunci cuan berulang: jaga member tetap aktif & semangat belajar.</span> Mentor yang progres membernya bagus punya peluang perpanjangan lebih tinggi.
      </div>

      <div className="mt-3 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs font-semibold leading-relaxed text-muted-foreground">
        Ini estimasi dari fasilitas dasar saat ini. Ke depannya akan ada webinar, pertemuan offline, paket member baru, dan lebih banyak fitur. Potensi komisi bisa makin besar.
      </div>
    </section>
  );
}

function AffiliateLinkCard({ link, clickCount, shareText, onCopy }: { link: string; clickCount: number; shareText: string; onCopy: () => void }) {
  const encoded = encodeURIComponent(shareText);
  return (
    <section className="rounded-3xl border border-border bg-card p-4">
      <VideoGuideCard
        title="Cara Sebar Link yang Efektif"
        desc="Platform mana yang paling banyak convert"
        duration="4 mnt"
        tone="orange"
        className="mb-4"
      />

      <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs font-black text-primary">
        {clickCount} orang klik linkmu hari ini - ada yang tertarik! <Flame className="ml-1 inline h-3.5 w-3.5 fill-orange-400 text-orange-400" />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-yellow-500/35 bg-yellow-500/10 p-3">
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-yellow-300">{link}</span>
        <Button type="button" onClick={onCopy} variant="outline" className="h-11 shrink-0 rounded-xl font-black">
          <Copy className="mr-2 h-4 w-4" />
          Salin
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <PlatformButton href={`https://wa.me/?text=${encoded}`}>WA</PlatformButton>
        <PlatformButton href="https://www.tiktok.com/">TikTok</PlatformButton>
        <PlatformButton href="https://www.instagram.com/">IG</PlatformButton>
        <PlatformButton href="https://www.facebook.com/">FB</PlatformButton>
      </div>
    </section>
  );
}

function AttentionCard({ members }: { members: DisplayMember[] }) {
  const freeMember = members.find((member) => member.status === "FREE") ?? fallbackMembers[3];
  const proMember = members.find((member) => member.status === "PRO") ?? fallbackMembers[0];
  const items = [
    { member: freeMember, desc: "Tidak buka app selama 5 hari · FREE member", action: "Hubungi" },
    { member: proMember, desc: "PRO habis 7 hari lagi · Ingatkan untuk perpanjang!", action: "Ingatkan" },
  ];

  return (
    <section className="rounded-3xl border border-orange-500/35 bg-orange-500/10 p-4">
      <VideoGuideCard
        title="Cara Follow Up Member yang Tidak Aktif"
        desc="Skrip & strategi agar mereka mau perpanjang"
        duration="6 mnt"
        tone="orange"
        className="mb-4"
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-orange-300">
          <AlertTriangle className="h-4 w-4" />
          <h2 className="font-black">Member Butuh Perhatianmu</h2>
        </div>
        <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-black text-orange-300">{items.length} member</span>
      </div>
      <div className="mt-4 space-y-2">
        {items.map(({ member, desc, action }) => (
          <div key={`${member.id}-${action}`} className="flex items-center gap-3 rounded-2xl bg-card/70 p-3">
            <AvatarInitial name={member.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{member.name}</p>
              <p className="text-xs font-semibold leading-tight text-muted-foreground">{desc}</p>
            </div>
            <a href={waFollowUp(member, action)} target="_blank" rel="noreferrer" className="rounded-xl border border-orange-500/40 px-3 py-2 text-xs font-black text-orange-300">
              {action}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function MentorClosingKit({ referralLink }: { referralLink: string }) {
  const comparisonLink = `${window.location.origin}/app/pro-comparison?ref=${encodeURIComponent(referralLink)}`;

  const copyComparison = async () => {
    await navigator.clipboard.writeText(comparisonLink);
    toast.success("Link perbandingan FREE vs PRO disalin");
  };

  return (
    <section className="rounded-3xl border border-purple-500/35 bg-purple-500/10 p-4">
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-purple-500/15 text-purple-300">
          <Share2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-black text-purple-300">Bagikan ke Calon Member</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">
            Kirim halaman perbandingan FREE vs PRO supaya calon member paham kenapa upgrade lebih cepat membantu mereka jalan.
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" onClick={copyComparison} variant="outline" className="h-12 rounded-2xl font-black">
          <Copy className="mr-2 h-4 w-4" />
          Salin Link
        </Button>
        <Link to="/app/pro-comparison" className="grid h-12 place-items-center rounded-2xl border border-purple-500/35 font-black text-purple-300">
          Preview
        </Link>
      </div>
    </section>
  );
}

function MentorProofCard() {
  return (
    <section className="rounded-3xl border border-primary/35 bg-primary/10 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Testimoni mentor</p>
      <p className="mt-3 text-sm font-semibold leading-relaxed text-muted-foreground">
        "Ibu Sari dapat Rp1,2jt komisi bulan pertama dari 8 member karena rutin kirim link perbandingan PRO dan follow up H-7."
      </p>
      <p className="mt-3 text-xs font-black text-primary">Social proof ini bisa dipakai saat menjelaskan value PRO.</p>
    </section>
  );
}

function WeeklyMentorChallenge() {
  return (
    <Link to="/app/achievements" className="flex items-center gap-3 rounded-3xl border border-yellow-500/35 bg-yellow-500/10 p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-yellow-500/15 text-yellow-300">
        <Award className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-black text-yellow-300">Tantangan Mentor Minggu Ini</span>
        <span className="mt-1 block text-xs font-semibold leading-relaxed text-muted-foreground">Referensikan 2 member baru minggu ini dan masuk badge mentor aktif.</span>
      </span>
    </Link>
  );
}

function MembersList({ members, totalCommission }: { members: DisplayMember[]; totalCommission: number }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">{members.length} member terhubung ke kamu</h2>
        </div>
        <p className="text-xs font-semibold text-muted-foreground">Total: {formatShortIDR(totalCommission)} komisi</p>
      </div>
      <ShowMoreList
        items={members}
        initial={4}
        step={4}
        buttonLabel="Lihat semua member"
        buttonClassName="h-12 w-full rounded-2xl border-border bg-card font-black"
        renderItem={(member) => <MemberRow key={member.id} member={member} />}
      />
    </section>
  );
}

function CommissionHistory({ rows, withdrawable }: { rows: DisplayCommission[]; withdrawable: number }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-yellow-300" />
          <h2 className="font-black">Saldo Saya</h2>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-muted-foreground">Siap dicairkan</p>
          <p className="text-xl font-black text-yellow-300">{formatIDR(withdrawable)}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {rows.slice(0, 4).map((row) => (
          <div key={row.id} className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
            <AvatarInitial name={row.memberName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{row.memberName} · {row.title}</p>
              <p className="text-xs font-semibold text-muted-foreground">{row.date}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-black text-primary">+{formatIDR(row.amount)}</p>
              <p className="text-[10px] font-bold text-primary/80">{row.type}</p>
            </div>
          </div>
        ))}
      </div>

      <Link to="/app/withdraw">
        <Button variant="outline" className="mt-4 h-14 w-full rounded-2xl border-border bg-transparent text-base font-black">
          Tarik Saldo {formatIDR(withdrawable)}
        </Button>
      </Link>
    </section>
  );
}

function StatCard({ icon: Icon, value, label, hint, tone }: { icon: LucideIcon; value: string; label: string; hint: string; tone: "primary" | "yellow" | "rose" | "sky" }) {
  const toneClass = {
    primary: "bg-primary/15 text-primary",
    yellow: "bg-yellow-500/15 text-yellow-300",
    rose: "bg-rose-500/15 text-rose-300",
    sky: "bg-sky-500/15 text-sky-300",
  }[tone];
  const hintClass = tone === "primary" ? "text-primary" : tone === "yellow" ? "text-yellow-300" : tone === "rose" ? "text-rose-300" : "text-sky-300";

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xs font-black ${hintClass}`}>{hint}</p>
    </section>
  );
}

function VideoGuideCard({
  title,
  desc,
  duration,
  tone,
  className = "",
}: {
  title: string;
  desc: string;
  duration: string;
  tone: "primary" | "yellow" | "sky" | "orange";
  className?: string;
}) {
  const toneClass = {
    primary: "border-primary/30 bg-primary/10 text-primary",
    yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    sky: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    orange: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  }[tone];

  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition hover:bg-secondary/70 ${toneClass} ${className}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-current/10">
        <PlayCircle className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-black text-foreground">{title}</span>
        <span className="mt-0.5 block truncate text-[11px] font-semibold text-muted-foreground">{desc}</span>
      </span>
      <span className="shrink-0 text-[10px] font-black text-muted-foreground">{duration}</span>
    </button>
  );
}

function IncomeResult({
  label,
  value,
  monthlyValue,
  desc,
  tone,
}: {
  label: string;
  value: number;
  monthlyValue: number;
  desc: string;
  tone: "yellow" | "primary" | "rose";
}) {
  const toneClass = {
    yellow: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
    primary: "border-primary/40 bg-primary/10 text-primary",
    rose: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 text-center ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-1 text-2xl font-black">{formatShortIDR(value)}</p>
      <p className="mt-1 text-xs font-black">~{formatShortIDR(monthlyValue)}/bulan</p>
      <p className="mt-2 text-[11px] font-semibold text-muted-foreground">{desc}</p>
    </div>
  );
}

function MiniStat({ value, label, tone, star }: { value: string; label: string; tone: "primary" | "yellow" | "default"; star?: boolean }) {
  const valueClass = tone === "primary" ? "text-primary" : tone === "yellow" ? "text-yellow-300" : "text-foreground";
  return (
    <div className="rounded-2xl bg-card/65 px-2 py-3 text-center">
      <p className={`flex items-center justify-center gap-1 text-sm font-black ${valueClass}`}>
        {value}
        {star && <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />}
      </p>
      <p className="mt-1 text-[10px] font-semibold leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function MemberRow({ member }: { member: DisplayMember }) {
  const renewalLabel = member.status === "FREE"
    ? "Belum upgrade"
    : member.renewalCount > 0
      ? `${member.renewalCount}x perpanjang`
      : "Komisi pertama";

  return (
    <div className="mb-2 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <AvatarInitial name={member.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{member.name}</p>
        <p className="text-xs font-semibold text-muted-foreground">Bergabung {formatDateShort(member.joinedAt)}</p>
      </div>
      <div className="shrink-0 text-right">
        <span className={`rounded-lg px-2 py-1 text-[10px] font-black ${member.status === "PRO" ? "bg-yellow-500/15 text-yellow-300" : "bg-secondary text-muted-foreground"}`}>
          {member.status}
        </span>
        <p className={`mt-1 text-xs font-black ${member.commission > 0 ? "text-primary" : "text-muted-foreground"}`}>
          {member.commission > 0 ? `+${formatIDR(member.commission)}` : "Rp0"}
        </p>
        <p className="mt-0.5 text-[10px] font-bold text-muted-foreground">{renewalLabel}</p>
      </div>
    </div>
  );
}

function AvatarInitial({ name }: { name: string }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-yellow-500/15 text-sm font-black text-yellow-300">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">{children}</p>;
}

function PlatformButton({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="grid h-11 place-items-center rounded-xl border border-border bg-card text-xs font-black">
      {children}
    </a>
  );
}

type DisplayMember = {
  id: string;
  name: string;
  status: "FREE" | "PRO";
  joinedAt: string;
  commission: number;
  renewalCount: number;
  whatsapp?: string;
};

type DisplayCommission = {
  id: string;
  memberName: string;
  title: string;
  amount: number;
  type: "Komisi berulang" | "Komisi pertama";
  date: string;
  renewalNumber?: number;
  status?: "PENDING" | "PAID" | "CANCELLED";
};

type AffiliateCommission = {
  id: string;
  memberName: string;
  plan: string;
  commissionAmount: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  paidAt: string;
};

function mapMembers(members: MentorDashboardDto["members"]): DisplayMember[] {
  return members.map((member) => ({
    id: member.id,
    name: member.name,
    status: member.membershipActive || member.paymentSummary.paidCount > 0 ? "PRO" : "FREE",
    joinedAt: member.joinedAt,
    commission: Math.round(Number(member.paymentSummary.totalPaid ?? 0) * 0.5),
    renewalCount: Math.max(Number(member.paymentSummary.paidCount ?? 0) - 1, 0),
    whatsapp: member.whatsapp,
  }));
}

function mapCommissions(mentorCommissions?: MentorDashboardDto["commissions"], affiliateCommissions?: AffiliateCommission[]): DisplayCommission[] {
  const source = mentorCommissions?.length ? mentorCommissions : affiliateCommissions ?? [];
  return source.map((item) => ({
    id: item.id,
    memberName: item.memberName,
    title: /perpanjang|renew/i.test(item.plan) ? "Perpanjang ke-1" : "Upgrade PRO",
    amount: Number(item.commissionAmount ?? 0),
    type: /perpanjang|renew/i.test(item.plan) ? "Komisi berulang" : "Komisi pertama",
    date: relativeDate(item.paidAt),
    renewalNumber: /perpanjang|renew/i.test(item.plan) ? 1 : 0,
    status: item.status,
  }));
}

function getTotalCommission(
  mentorDashboard: MentorDashboardDto | undefined,
  affiliate: { stats: { commission: number } } | undefined,
  userBalance: number,
  members: DisplayMember[],
) {
  const realValue = mentorDashboard?.stats.totalEstimatedCommission ?? affiliate?.stats.commission ?? userBalance;
  if (realValue > 0) return realValue;
  return members.reduce((sum, member) => sum + member.commission, 0);
}

function waFollowUp(member: DisplayMember, action: string) {
  const digits = String(member.whatsapp ?? "").replace(/\D/g, "");
  const number = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  const message = action === "Ingatkan"
    ? `Halo ${member.name}, masa akses PRO kamu hampir habis. Kalau mau lanjut belajar dan akses tools penuh, aku bantu arahkan ya.`
    : `Halo ${member.name}, aku cek kamu belum aktif lagi di BuatCuan. Ada yang bisa aku bantu?`;
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : "#";
}

function formatShortIDR(value: number) {
  if (value >= 1_000_000_000) return `Rp${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}jt`;
  if (value >= 1000) return `Rp${Math.round(value / 1000)}rb`;
  return formatIDR(value);
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function relativeDate(iso: string) {
  const diffDays = Math.round((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays <= 7) return `${diffDays} hari yang lalu`;
  return formatDateShort(iso);
}

export default BuatCuan;
