import { Check, Sparkles } from "lucide-react";
import type { NicheCandidateV1Dto, NicheJalurCuan, NicheLevel, NicheTampilMuka } from "@/lib/api";
import { getErrorMessage } from "@/lib/api";
import { useNicheCandidatesV1 } from "@/hooks/useNicheCandidatesV1";
import { MAX_SELECTED_CANDIDATES } from "../niche-tool-constants";

interface StepKandidatProps {
  jalur: NicheJalurCuan;
  tampilMuka: NicheTampilMuka | null;
  modal: NicheLevel | null;
  waktu: NicheLevel | null;
  aksesBarang: boolean | null;
  minat: string;
  selectedCandidateIds: string[];
  onToggle: (candidate: NicheCandidateV1Dto) => void;
  onNext: () => void;
}

export function StepKandidat({ jalur, tampilMuka, modal, waktu, aksesBarang, minat, selectedCandidateIds, onToggle, onNext }: StepKandidatProps) {
  const { data: candidates, isLoading, isError, error, refetch, isFetching } = useNicheCandidatesV1({
    jalur,
    tampilMuka: tampilMuka ?? undefined,
    modal: modal ?? undefined,
    waktu: waktu ?? undefined,
    aksesBarang: aksesBarang ?? undefined,
    minat: minat || undefined,
  });

  const atMax = selectedCandidateIds.length >= MAX_SELECTED_CANDIDATES;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold">Saran Niche</h2>
        <p className="mt-1 text-sm text-muted-foreground">Centang 1–3 niche yang menarik buat kamu.</p>
      </div>

      {isLoading && (
        <div className="space-y-2" data-testid="niche-kandidat-loading">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4" data-testid="niche-kandidat-error">
          <p className="text-sm font-semibold text-destructive">{getErrorMessage(error, "Gagal memuat daftar niche.")}</p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-2 text-xs font-extrabold text-primary disabled:opacity-50"
          >
            Coba lagi
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-2" data-testid="niche-kandidat-list">
          {(candidates ?? []).map((candidate) => {
            const selected = selectedCandidateIds.includes(candidate.id);
            const disabled = !selected && atMax;
            return (
              <button
                key={candidate.id}
                type="button"
                data-testid={`niche-candidate-${candidate.slug}`}
                onClick={() => onToggle(candidate)}
                disabled={disabled}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                  selected ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-secondary/60"
                } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-extrabold">
                    {candidate.isDefault && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                    {candidate.name}
                  </span>
                  {candidate.pilarNiche && <span className="mt-0.5 block text-xs text-muted-foreground">{candidate.pilarNiche}</span>}
                </span>
                {selected && (
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        data-testid="niche-kandidat-next"
        onClick={onNext}
        disabled={selectedCandidateIds.length === 0}
        className="h-14 w-full rounded-3xl bg-primary text-base font-extrabold text-primary-foreground shadow-glow transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Lanjut ({selectedCandidateIds.length}/{MAX_SELECTED_CANDIDATES})
      </button>
    </div>
  );
}
