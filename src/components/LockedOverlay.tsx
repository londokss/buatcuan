import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const LockedOverlay = ({ reason = "Membership kamu belum aktif" }: { reason?: string }) => (
  <div className="absolute inset-0 z-20 backdrop-blur-md bg-background/70 rounded-3xl grid place-items-center p-6 text-center">
    <div className="space-y-3">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 border border-primary/30 grid place-items-center">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <p className="font-semibold">{reason}</p>
      <p className="text-xs text-muted-foreground">Unlock semua materi & fitur cuan sekarang.</p>
      <Link to="/app/payment">
        <Button className="rounded-2xl gradient-primary text-primary-foreground shadow-glow-sm hover:scale-105 transition-transform">
          Aktifkan Membership
        </Button>
      </Link>
    </div>
  </div>
);
