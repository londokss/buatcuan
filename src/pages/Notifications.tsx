import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, CheckCheck, Clock3, Crown, Megaphone, RefreshCw, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { api, type NotificationDto } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { NotificationPermissionModal } from "@/components/NotificationPermissionModal";
import { gradientBackground } from "@/lib/content-colors";
import { cn } from "@/lib/utils";

const iconByType = {
  UPDATE: Megaphone,
  PAYMENT: Crown,
  COMMISSION: Wallet,
  SYSTEM: Bell,
} as const;

const toneByType: Record<string, string> = {
  UPDATE: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  PAYMENT: "border-primary/30 bg-primary/10 text-primary",
  COMMISSION: "border-accent/35 bg-accent/10 text-accent",
  SYSTEM: "border-white/10 bg-secondary text-muted-foreground",
};

export default function Notifications() {
  const qc = useQueryClient();
  const [permissionOpen, setPermissionOpen] = useState(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    return Notification.permission === "default" && localStorage.getItem("buatcuan:notification-permission-dismissed") !== "1";
  });
  const { data, isLoading, isFetching } = useQuery({ queryKey: ["notifications"], queryFn: api.notifications.list });
  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const unreadItems = useMemo(() => items.filter((item) => !item.read), [items]);

  const markRead = useMutation({
    mutationFn: api.notifications.markRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
  const markAll = useMutation({
    mutationFn: api.notifications.markAllRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const browserPermission = typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported";

  return (
    <div className="space-y-4">
      <header className="overflow-hidden rounded-3xl border border-primary/25 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.20),transparent_45%),hsl(var(--card)/0.92)] p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Pusat Notifikasi</p>
            <h1 className="mt-2 text-2xl font-black leading-tight">Yang perlu kamu tahu</h1>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-muted-foreground">
              Update penting, komisi, pembayaran, dan pengumuman masuk real time di sini.
            </p>
          </div>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/15 text-primary">
            <BellRing className="h-6 w-6" />
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Belum dibaca" value={unreadCount} tone="primary" />
          <Stat label="Hari ini" value={countToday(items)} tone="sky" />
          <Stat label="Status" value={browserPermission === "granted" ? "Aktif" : "Off"} tone="accent" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => setPermissionOpen(true)} className="h-11 rounded-2xl border-white/10 bg-card font-bold">
          <ShieldCheck className="mr-1 h-4 w-4" /> Izin Browser
        </Button>
        <Button type="button" onClick={() => markAll.mutate()} disabled={!unreadCount || markAll.isPending} className="h-11 rounded-2xl gradient-primary font-bold text-primary-foreground disabled:opacity-60">
          <CheckCheck className="mr-1 h-4 w-4" /> Tandai Semua
        </Button>
      </div>

      <section className="rounded-3xl border border-white/10 bg-card/80 p-3 shadow-card">
        <div className="flex items-center justify-between px-2 py-2">
          <div>
            <p className="text-sm font-black">Inbox</p>
            <p className="text-xs font-semibold text-muted-foreground">{isFetching ? "Sinkronisasi..." : `${items.length} notifikasi`}</p>
          </div>
          <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isFetching && "animate-spin")} />
        </div>

        {isLoading ? (
          <div className="rounded-2xl bg-secondary/60 p-4 text-sm font-semibold text-muted-foreground">Memuat notifikasi...</div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <NotificationRow key={item.id} item={item} onRead={() => !item.read && markRead.mutate(item.id)} />
            ))}
          </div>
        )}
      </section>

      {unreadItems.length > 0 && (
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
              Ada {unreadItems.length} hal baru. Buka notifikasi yang relevan supaya progres dan peluang komisi tidak kelewat.
            </p>
          </div>
        </div>
      )}

      <NotificationPermissionModal open={permissionOpen} onOpenChange={setPermissionOpen} />
    </div>
  );
}

function NotificationRow({ item, onRead }: { item: NotificationDto; onRead: () => void }) {
  const Icon = iconByType[item.type as keyof typeof iconByType] ?? Bell;
  const content = (
    <div
      onClick={onRead}
      className={cn(
        "group flex items-start gap-3 rounded-2xl border p-3 transition hover:border-primary/35 hover:bg-secondary/60",
        item.read ? "border-white/10 bg-secondary/35" : "border-primary/25 bg-primary/10",
      )}
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl border",
          item.color ? "border-white/10 text-white shadow-sm" : (toneByType[item.type] ?? toneByType.SYSTEM),
        )}
        style={item.color ? gradientBackground(item.color) : undefined}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-black">{item.title}</span>
          {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-glow-sm" />}
        </span>
        <span className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-muted-foreground">{item.body}</span>
        <span className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <Clock3 className="h-3 w-3" /> {relativeTime(item.createdAt)}
        </span>
      </span>
    </div>
  );

  return item.href ? <Link to={item.href}>{content}</Link> : content;
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: "primary" | "sky" | "accent" }) {
  const toneClass = tone === "primary" ? "text-primary" : tone === "sky" ? "text-sky-300" : "text-accent";
  return (
    <div className="rounded-2xl border border-white/10 bg-background/55 p-3">
      <p className={cn("text-lg font-black leading-none", toneClass)}>{value}</p>
      <p className="mt-1 text-[10px] font-bold text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-secondary/40 p-5 text-center">
      <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-sm font-black">Belum ada notifikasi</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">Saat ada update penting, semuanya akan muncul di sini.</p>
    </div>
  );
}

function countToday(items: NotificationDto[]) {
  const today = new Date().toDateString();
  return items.filter((item) => new Date(item.createdAt).toDateString() === today).length;
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60_000));
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.round(hours / 24)} hari lalu`;
}
