import { Award, Copy, CreditCard, MessageCircle, MousePointerClick, TrendingUp, UserCheck, UserPlus, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api, type MentorDashboardDto } from "@/lib/api";
import { formatDate, formatIDR, useApp } from "@/context/AppContext";
import { PremiumSearchSelect } from "@/components/PremiumFormControls";
import { ShowMoreList } from "@/components/ShowMoreList";

const memberStatusLabel: Record<MentorDashboardDto["members"][number]["status"], string> = {
  REGISTERED_UNPAID: "Belum Bayar",
  PAID_INACTIVE: "Sudah Bayar",
  ACTIVE: "Sudah Aktif",
};

const memberStatusClass: Record<MentorDashboardDto["members"][number]["status"], string> = {
  REGISTERED_UNPAID: "bg-accent/15 text-accent",
  PAID_INACTIVE: "bg-primary/15 text-primary",
  ACTIVE: "bg-primary/15 text-primary",
};

const commissionStatusLabel: Record<MentorDashboardDto["commissions"][number]["status"], string> = {
  PENDING: "Belum Dicairkan",
  PAID: "Sudah Dicairkan",
  CANCELLED: "Dibatalkan",
};

function normalizeWhatsAppUrl(wa: string) {
  const digits = wa.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

function isExpiringSoon(iso?: string) {
  if (!iso) return false;
  const diffMs = new Date(iso).getTime() - Date.now();
  return diffMs > 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
}

function followUpMessage(member: MentorDashboardDto["members"][number]) {
  if (member.status === "REGISTERED_UNPAID") {
    return `Halo ${member.name}, saya lihat kamu sudah daftar di BuatCuan tapi belum menyelesaikan pembayaran. Kalau ada kendala saat checkout, kabari saya ya.`;
  }

  if (isExpiringSoon(member.membershipExpiresAt)) {
    return `Halo ${member.name}, membership BuatCuan kamu sebentar lagi berakhir. Yuk perpanjang supaya akses materi dan bimbingan tetap aktif.`;
  }

  if (!member.membershipActive) {
    return `Halo ${member.name}, pembayaran kamu sudah tercatat tapi akun belum aktif. Saya bantu cek status aktivasinya ya.`;
  }

  return `Halo ${member.name}, semoga progress BuatCuan-nya lancar. Kalau butuh arahan materi atau strategi berikutnya, kabari saya ya.`;
}

function followUpUrl(member: MentorDashboardDto["members"][number]) {
  return `https://wa.me/${normalizeWhatsAppUrl(member.whatsapp)}?text=${encodeURIComponent(followUpMessage(member))}`;
}

const Mentor = () => {
  const { user } = useApp();
  const mentorEnabled = Boolean(user);
  const { data, isLoading } = useQuery({ queryKey: ["mentor-dashboard"], queryFn: api.affiliate.mentor, enabled: mentorEnabled });
  const { data: landingPages = [] } = useQuery({ queryKey: ["mentor-landing-pages"], queryFn: api.affiliate.landingPages, enabled: mentorEnabled });
  const [selectedLandingId, setSelectedLandingId] = useState("");
  const selectedLanding = useMemo(
    () => landingPages.find((page) => page.id === selectedLandingId) ?? landingPages.find((page) => page.isDefault) ?? landingPages[0],
    [landingPages, selectedLandingId],
  );

  if (!user) return null;

  const copy = async () => {
    const link = selectedLanding?.shareUrl ?? data?.mentor.referralLink;
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Link landing referral disalin");
  };

  const stats = [
    { icon: Users, label: "Terdaftar", value: data?.stats.totalRegistered ?? 0, color: "from-emerald-500 to-teal-400" },
    { icon: UserCheck, label: "Aktif", value: data?.stats.active ?? 0, color: "from-pink-500 to-rose-400" },
    { icon: CreditCard, label: "Belum Bayar", value: data?.stats.unpaid ?? 0, color: "from-amber-500 to-orange-400" },
  ];
  const referralStats = [
    { icon: MousePointerClick, label: "Klik Link", value: data?.stats.clicks ?? 0 },
    { icon: UserPlus, label: "Daftar dari Link", value: data?.stats.registered ?? 0 },
    { icon: CreditCard, label: "Berhasil Bayar", value: data?.stats.paid ?? 0 },
    { icon: Users, label: "Daftar Belum Bayar", value: data?.stats.registeredUnpaid ?? 0 },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Mentor <span className="text-gradient-primary">Center</span></h1>
        <p className="text-sm text-muted-foreground">Pantau member referral, pembayaran, dan estimasi komisi.</p>
      </div>

      {isLoading && <div className="glass-card rounded-3xl p-5 text-sm text-muted-foreground">Memuat data mentor...</div>}

      {data && (
        <>
          <div className="glass-card rounded-3xl p-5">
            <p className="text-xs text-muted-foreground">Nomor Referral Default</p>
            <p className="mt-1 text-2xl font-extrabold">{user.wa}</p>
            <p className="mt-1 text-xs text-muted-foreground">Kode lama tetap aktif: {data.mentor.referralCode}</p>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Landing yang dishare</p>
              <PremiumSearchSelect
                value={selectedLanding?.id ?? ""}
                onChange={setSelectedLandingId}
                placeholder="Pilih landing"
                options={landingPages.map((page) => ({
                  label: `${page.name}${page.campaign ? ` - ${page.campaign}` : ""}`,
                  value: page.id,
                }))}
                triggerClassName="h-11 rounded-2xl"
              />
              {selectedLanding?.description && <p className="text-xs text-muted-foreground">{selectedLanding.description}</p>}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-secondary p-3">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{selectedLanding?.shareUrl ?? data.mentor.referralLink}</span>
              <button onClick={copy} className="rounded-xl p-2 hover:bg-white/10">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-3 text-center">
                <div className={`mx-auto mb-2 grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
                <p className="font-extrabold">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-3xl p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Estimasi Komisi</p>
                <p className="text-2xl font-extrabold text-primary">{formatIDR(data.stats.totalEstimatedCommission)}</p>
                <p className="text-xs text-muted-foreground">Dari total pembayaran member {formatIDR(data.stats.totalPaidAmount)}</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5">
            <p className="mb-3 font-bold">Statistik Referral Dasar</p>
            <div className="grid grid-cols-2 gap-3">
              {referralStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-secondary/60 p-3">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <stat.icon className="h-4 w-4" />
                    <p className="text-[10px] uppercase tracking-wider">{stat.label}</p>
                  </div>
                  <p className="text-2xl font-extrabold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 font-bold">Daftar Member Referral</p>
            <ShowMoreList
              items={data.members}
              initial={5}
              step={5}
              empty={<div className="glass-card rounded-2xl p-4 text-sm text-muted-foreground">Belum ada member referral.</div>}
              renderItem={(member) => (
                <div key={member.id} className="glass-card rounded-2xl p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.wa} • Daftar {formatDate(member.joinedAt)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${memberStatusClass[member.status]}`}>
                      {memberStatusLabel[member.status]}
                    </span>
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-secondary/60 p-3">
                    <p className="text-xs text-muted-foreground">Pembayaran Member</p>
                    {member.paymentSummary.latestPayment ? (
                      <div className="mt-1 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold">{member.paymentSummary.latestPayment.plan}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.paymentSummary.paidCount} sukses • Total {formatIDR(member.paymentSummary.totalPaid)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold">{formatIDR(member.paymentSummary.latestPayment.amount)}</p>
                          <p className="text-[10px] uppercase text-muted-foreground">{member.paymentSummary.latestPayment.status}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-accent">Belum ada pembayaran</p>
                    )}
                  </div>
                  <a
                    href={followUpUrl(member)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary/15 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
                  >
                    <MessageCircle className="h-4 w-4" /> Follow-up WhatsApp
                  </a>
                </div>
              )}
            />
          </div>

          <div>
            <p className="mb-3 font-bold">Komisi Tercatat</p>
            <ShowMoreList
              items={data.commissions}
              initial={5}
              step={5}
              empty={<div className="glass-card rounded-2xl p-4 text-sm text-muted-foreground">Belum ada komisi tercatat.</div>}
              renderItem={(commission) => (
                <div key={commission.id} className="glass-card rounded-2xl p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{commission.memberName}</p>
                      <p className="text-xs text-muted-foreground">{commission.memberWa} • {commission.plan} • {formatDate(commission.paidAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-primary">{formatIDR(commission.commissionAmount)}</p>
                      <p className="text-[10px] text-muted-foreground">50% dari {formatIDR(commission.paymentAmount)}</p>
                    </div>
                  </div>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-[10px] font-bold text-accent">
                    <Award className="h-3 w-3" /> {commissionStatusLabel[commission.status]}
                  </span>
                </div>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Mentor;
