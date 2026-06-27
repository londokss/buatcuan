import { useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Play } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";

const VideoShareRedirect = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref") ?? "";
  const { user } = useApp();
  const navigate = useNavigate();

  const {
    data: trackingResult,
    mutate: trackClick,
  } = useMutation({
    mutationFn: () => api.videoLinks.trackClick(id ?? "", ref),
  });

  useEffect(() => {
    if (!id || !ref) return;
    trackClick();
  }, [id, ref, trackClick]);

  const target = user ? `/app/materi/${id}` : `/register?ref=${encodeURIComponent(ref)}`;

  return (
    <div className="min-h-screen bg-background relative grid place-items-center px-5">
      <div className="fixed inset-0 bg-gradient-hero pointer-events-none" />
      <div className="glass-card relative w-full max-w-sm rounded-3xl p-6 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Play className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-extrabold">Link Video BuatCuan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {trackingResult?.pointsAwarded ? `Pemilik link mendapat ${trackingResult.pointsAwarded} poin dari klik ini.` : "Klik link video sudah dicatat."}
        </p>
        <Link to={target} className="mt-5 block">
          <Button className="h-12 w-full rounded-2xl gradient-primary text-primary-foreground">
            {user ? "Buka Video" : "Daftar & Buka Video"}
          </Button>
        </Link>
        {user && (
          <Button type="button" variant="outline" onClick={() => navigate("/app/materi")} className="mt-3 h-11 w-full rounded-2xl">
            Lihat Materi Lain
          </Button>
        )}
      </div>
    </div>
  );
};

export default VideoShareRedirect;
