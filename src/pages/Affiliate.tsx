import { useApp } from "@/context/AppContext";
import { Copy, Share2, Users, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ShowMoreList } from "@/components/ShowMoreList";

const commissionStatusLabel = {
  PENDING: "Belum Dicairkan",
  PAID: "Sudah Dicairkan",
  CANCELLED: "Dibatalkan",
} as const;

const Affiliate = () => {
  const { user } = useApp();
  const { data } = useQuery({ queryKey: ["affiliate-summary"], queryFn: api.affiliate.summary });
  if (!user) return null;
  const link = data?.link ?? `${window.location.origin}/r/${encodeURIComponent(user.wa)}`;
  const referralHistory = data?.referrals ?? [];
  const chartData = data?.chartData ?? [];
  const commissions = data?.commissions ?? [];
  const commissionRate = data?.commissionRate ?? (user.membershipActive ? 0.5 : 0.1);

  const copy = () => {
    navigator.clipboard.writeText(link);
    toast.success("Link disalin!");
  };
  const share = () => {
    if (navigator.share) navigator.share({ title: "BuatCuan", text: "Yuk gabung BuatCuan, mulai cuan dari 0!", url: link });
    else copy();
  };

  const stats = [
    { icon: Users, label: "Total Joins", value: data?.stats.totalJoins ?? referralHistory.length, color: "from-emerald-500 to-teal-400" },
    { icon: TrendingUp, label: "Valid", value: data?.stats.validReferrals ?? referralHistory.filter(r => r.valid).length, color: "from-pink-500 to-rose-400" },
    { icon: Award, label: "Komisi", value: new Intl.NumberFormat("id-ID", { notation: "compact", style: "currency", currency: "IDR", maximumFractionDigits: 1 }).format(data?.stats.commission ?? user.balance), color: "from-amber-500 to-orange-400" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Affiliate <span className="text-gradient-gold">Cuan</span></h1>
        <p className="text-sm text-muted-foreground">
          Komisi kamu {Math.round(commissionRate * 100)}%. Upgrade PRO untuk ngejar 50%.
        </p>
      </div>

      {/* Referral link */}
      <div className="glass-card rounded-3xl p-5">
        <p className="text-xs text-muted-foreground">Link Referral Kamu</p>
        <div className="mt-2 flex items-center gap-2 p-3 rounded-2xl bg-secondary border border-white/10">
          <span className="text-sm font-mono truncate flex-1">{link}</span>
          <button onClick={copy} className="p-2 rounded-xl hover:bg-white/10"><Copy className="w-4 h-4" /></button>
        </div>
        <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/10 p-3 text-xs text-muted-foreground">
          FREE tetap bisa promosi dan dapat 10%. PRO membuka komisi affiliate 50%.
        </div>
        <Button onClick={share} className="w-full mt-3 h-12 rounded-2xl gradient-primary text-primary-foreground font-bold">
          <Share2 className="w-4 h-4 mr-2" /> Bagikan Sekarang
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-3 text-center">
            <div className={`w-9 h-9 mx-auto rounded-xl bg-gradient-to-br ${s.color} grid place-items-center mb-2`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <p className="font-extrabold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card rounded-3xl p-5">
        <p className="font-bold mb-2">Joins 7 Hari Terakhir</p>
        <p className="text-xs text-muted-foreground mb-2">Grafik hanya menghitung referral yang sudah aktif.</p>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="g" x1="0" x2="1">
                  <stop offset="0%" stopColor="hsl(142 100% 39%)" />
                  <stop offset="100%" stopColor="hsl(142 100% 55%)" />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Line type="monotone" dataKey="joins" stroke="url(#g)" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History */}
      <div>
        <p className="font-bold mb-3">Riwayat Referral</p>
        <ShowMoreList
          items={referralHistory}
          initial={5}
          step={5}
          empty={<div className="glass-card rounded-2xl p-4 text-sm text-muted-foreground">Belum ada referral tercatat.</div>}
          renderItem={(r, i) => (
            <div key={i} className="glass-card rounded-2xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full gradient-primary grid place-items-center font-bold text-primary-foreground text-sm">{r.name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.wa} • {new Date(r.date).toLocaleDateString("id-ID")}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${r.valid ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
                {r.status}
              </span>
            </div>
          )}
        />
      </div>

      <div>
        <p className="font-bold mb-3">Riwayat Komisi</p>
        <ShowMoreList
          items={commissions}
          initial={5}
          step={5}
          empty={<div className="glass-card rounded-2xl p-4 text-sm text-muted-foreground">Belum ada komisi tercatat.</div>}
          renderItem={(commission) => (
            <div key={commission.id} className="glass-card rounded-2xl p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{commission.memberName}</p>
                  <p className="text-xs text-muted-foreground">
                    {commission.memberWa} • {commission.plan} • {new Date(commission.paidAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-sm text-primary">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(commission.commissionAmount)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    dari {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(commission.paymentAmount)}
                  </p>
                </div>
              </div>
              <span className="mt-2 inline-block rounded-full bg-accent/15 px-2 py-1 text-[10px] font-bold text-accent">
                {commissionStatusLabel[commission.status]}
              </span>
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default Affiliate;
