import { BellRing, ShieldCheck, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ManagedUsageVideoCard } from "@/components/ManagedUsageVideoCard";

type NotificationPermissionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NotificationPermissionModal({ open, onOpenChange }: NotificationPermissionModalProps) {
  const supported = typeof window !== "undefined" && "Notification" in window;
  const permission = supported ? Notification.permission : "denied";

  const requestPermission = async () => {
    if (!supported) {
      toast.error("Browser ini belum mendukung notifikasi.");
      return;
    }
    const result = await Notification.requestPermission();
    if (result === "granted") {
      new Notification("Notifikasi BuatCuan aktif", {
        body: "Update penting, komisi, dan progres akan muncul real time.",
        icon: "/buatcuan-mark.svg",
      });
      localStorage.setItem("buatcuan:notification-permission-dismissed", "1");
      toast.success("Notifikasi berhasil diaktifkan.");
      onOpenChange(false);
      return;
    }
    toast.error(result === "denied" ? "Izin notifikasi ditolak dari browser." : "Izin notifikasi belum diberikan.");
  };

  const close = () => {
    localStorage.setItem("buatcuan:notification-permission-dismissed", "1");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border-white/10 bg-card p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 border-b border-white/10 px-5 pt-5 pb-3 text-left">
          <DialogTitle>Aktifkan Notifikasi</DialogTitle>
          <DialogDescription>Dapatkan update penting tanpa perlu cek manual.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <ManagedUsageVideoCard
            targetPath="/app/notifications"
            fallback={{
              label: "Panduan",
              title: "Cara Mengaktifkan Notifikasi BuatCuan",
              subtitle: "Izinkan browser agar update, komisi, dan pengingat masuk real time.",
              durationLabel: "1 menit",
              thumbnailGradient: "from-emerald-950 via-sky-950 to-zinc-950",
            }}
          />

          <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <BellRing className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold">Real time, hanya yang penting</p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">
                  BuatCuan akan mengirim notifikasi untuk update baru, pembayaran, komisi, dan pengumuman yang perlu segera kamu lihat.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-2 rounded-xl bg-background/60 p-3">
                <ShieldCheck className="h-4 w-4 text-primary" /> Bisa dimatikan
              </span>
              <span className="flex items-center gap-2 rounded-xl bg-background/60 p-3">
                <Smartphone className="h-4 w-4 text-primary" /> Cocok untuk HP
              </span>
            </div>
          </div>

          {permission === "denied" && (
            <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
              Izin notifikasi sudah diblokir. Ubah dari pengaturan browser untuk mengaktifkannya kembali.
            </div>
          )}
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-white/10 bg-card/95 px-5 py-4">
          <Button type="button" variant="outline" onClick={close} className="rounded-2xl border-white/10 bg-secondary">
            <X className="mr-1 h-4 w-4" /> Tutup
          </Button>
          <Button type="button" onClick={requestPermission} disabled={!supported || permission === "denied"} className="rounded-2xl gradient-primary font-bold text-primary-foreground">
            Izinkan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
