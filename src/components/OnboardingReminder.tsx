import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/context/AppContext";
import { api, assetUrl } from "@/lib/api";

const storageKey = "buatcuan:onboarding-reminder-date";

function todayKey() {
  return new Date().toLocaleDateString("sv-SE");
}

export function OnboardingReminder() {
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const { data: lessons = [] } = useQuery({
    queryKey: ["lessons"],
    queryFn: () => api.lessons.list(),
    enabled: Boolean(user),
  });
  const onboardingLesson = useMemo(
    () => lessons.find((lesson) => lesson.video?.url) ?? lessons.find((lesson) => lesson.requiredMembership === "FREE") ?? lessons[0],
    [lessons],
  );

  useEffect(() => {
    if (!user) return;
    const key = todayKey();
    if (localStorage.getItem(storageKey) === key) return;
    setOpen(true);
  }, [user]);

  const close = () => {
    localStorage.setItem(storageKey, todayKey());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : close())}>
      <DialogContent className="max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border-white/10 bg-card p-0 sm:max-w-md">
        <DialogTitle className="sr-only">Onboarding BuatCuan</DialogTitle>
        <DialogDescription className="sr-only">Video pengingat harian untuk mulai belajar dan praktik.</DialogDescription>
        <div className="relative aspect-[9/13] bg-black">
          {onboardingLesson?.video?.url ? (
            <video src={assetUrl(onboardingLesson.video.url)} controls autoPlay playsInline preload="metadata" className="h-full w-full object-cover" />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${onboardingLesson?.thumb ?? "from-emerald-500 via-teal-500 to-cyan-400"}`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="grid h-16 w-16 place-items-center rounded-full border border-white/35 bg-white/15 text-white backdrop-blur-md">
                  <Play className="ml-1 h-7 w-7 fill-current" />
                </span>
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent p-5 pt-20 text-white">
            <p className="text-xs font-black uppercase tracking-wider text-primary">Mulai hari ini</p>
            <p className="mt-1 text-2xl font-extrabold leading-tight">{onboardingLesson?.title ?? "Gas praktek satu modul"}</p>
            <p className="mt-2 text-sm text-white/75">
              Satu video, satu aksi kecil, satu progres nyata.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={close} className="rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15">
                Tutup
              </Button>
              <Link to={onboardingLesson ? `/app/materi/${onboardingLesson.id}` : "/app/materi"} onClick={close}>
                <Button className="w-full rounded-2xl gradient-primary font-bold text-primary-foreground">Buka Materi</Button>
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
