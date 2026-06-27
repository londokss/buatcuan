import { useEffect } from "react";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import type { NicheCandidateV1Dto } from "@/lib/api";

interface StepSaringanProps {
  candidates: NicheCandidateV1Dto[];
  onNext: () => void;
}

// Saringan Aman runs automatically — no tap required. Flagged niches are never removed, only
// marked "simpan dulu". We auto-advance shortly after mount, with a manual button as an escape
// hatch for anyone who wants to read the flags first.
export function StepSaringan({ candidates, onNext }: StepSaringanProps) {
  useEffect(() => {
    const timer = setTimeout(onNext, 1500);
    return () => clearTimeout(timer);
  }, [onNext]);

  const flagged = candidates.filter((candidate) => candidate.isFlaggedSensitive);

  return (
    <div className="space-y-4" data-testid="niche-saringan-screen">
      <div>
        <h2 className="text-xl font-extrabold">Saringan Aman</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sistem otomatis mengecek niche yang kamu pilih. Tidak ada yang dihapus.</p>
      </div>

      <div className="space-y-2">
        {candidates.map((candidate) => {
          const isFlagged = candidate.isFlaggedSensitive;
          return (
            <div
              key={candidate.id}
              data-testid={`niche-saringan-item-${candidate.slug}`}
              className={`flex items-center gap-3 rounded-2xl border p-3.5 ${isFlagged ? "border-amber-500/40 bg-amber-500/10" : "border-border bg-card"}`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${isFlagged ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600"}`}>
                {isFlagged ? <TriangleAlert className="h-4.5 w-4.5" /> : <ShieldCheck className="h-4.5 w-4.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">{candidate.name}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {isFlagged ? "Simpan dulu — perlu modal/perhatian ekstra." : "Aman dilanjutkan."}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {flagged.length > 0 && (
        <p className="rounded-2xl bg-amber-500/10 p-3 text-xs font-semibold text-amber-600">
          {flagged.length} niche ditandai "simpan dulu" — tetap ikut dinilai di langkah berikutnya, bukan dihapus.
        </p>
      )}

      <button
        type="button"
        data-testid="niche-saringan-next"
        onClick={onNext}
        className="h-14 w-full rounded-3xl bg-primary text-base font-extrabold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
      >
        Lanjut sekarang
      </button>
    </div>
  );
}
