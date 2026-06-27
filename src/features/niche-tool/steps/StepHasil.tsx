import { Sparkles } from "lucide-react";
import type { NicheResultResponseV1Dto, NicheScoreResponseV1Dto } from "@/lib/api";
import { getErrorMessage } from "@/lib/api";
import { LAMP_META, NICHE_COMMISSION_GUARDRAIL, NICHE_RESULT_DISCLAIMER } from "../niche-tool-constants";

interface StepHasilProps {
  scoreQuery: { data?: NicheScoreResponseV1Dto; isLoading: boolean; isError: boolean; error: unknown };
  savedResult: NicheResultResponseV1Dto | null;
  isSaving: boolean;
  saveError: unknown;
  onSave: () => void;
  onRestart: () => void;
}

export function StepHasil({ scoreQuery, savedResult, isSaving, saveError, onSave, onRestart }: StepHasilProps) {
  const preview = scoreQuery.data;

  if (savedResult) {
    return (
      <div className="space-y-5" data-testid="niche-hasil-saved">
        <div className="rounded-3xl border border-primary/30 bg-primary/10 p-5 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-lg font-extrabold">Hasil tersimpan!</p>
          <p className="mt-1 text-sm text-muted-foreground">Niche utama kamu:</p>
          <p className="mt-2 text-2xl font-black">{savedResult.primaryNicheName}</p>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-extrabold ${LAMP_META[savedResult.primaryLamp].badgeClass}`}>
            {savedResult.primaryScore}/100 · {LAMP_META[savedResult.primaryLamp].label}
          </span>
          {savedResult.fallbackApplied && (
            <p className="mt-3 text-xs font-semibold text-muted-foreground">
              Niche lain belum cukup kuat, jadi sistem mengarahkan kamu ke Affiliate BuatCuan dulu.
            </p>
          )}
        </div>

        <DisclaimerBlock />

        <button
          type="button"
          data-testid="niche-hasil-restart"
          onClick={onRestart}
          className="h-14 w-full rounded-3xl border border-border bg-card text-base font-extrabold transition-transform active:scale-[0.98]"
        >
          Mulai Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="niche-hasil-preview">
      <div>
        <h2 className="text-xl font-extrabold">Hasil</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ini ranking niche kamu. Tap "Simpan" untuk menyimpan hasil ini.</p>
      </div>

      {scoreQuery.isLoading && <p className="text-sm text-muted-foreground" data-testid="niche-hasil-loading">Memuat hasil...</p>}

      {!scoreQuery.isLoading && preview && (
        <div className="space-y-2">
          {preview.ranked.map((entry) => (
            <div
              key={entry.candidateId}
              data-testid={`niche-hasil-item-${entry.candidateId}`}
              className={`flex items-center gap-3 rounded-2xl border p-3.5 ${entry.isPrimary ? "border-primary bg-primary/10" : "border-border bg-card"}`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-extrabold">#{entry.rank}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">
                  {entry.candidateName} {entry.isPrimary && <span className="text-primary">· Utama</span>}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {entry.isDefault && "Single-level, NO MLM. "}
                  {LAMP_META[entry.lamp].description}
                </span>
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${LAMP_META[entry.lamp].badgeClass}`}>
                {entry.finalScore}/100
              </span>
            </div>
          ))}

          {preview.fallbackApplied && (
            <p className="rounded-2xl bg-amber-500/10 p-3 text-xs font-semibold text-amber-600">
              Niche lain belum cukup kuat (di bawah ambang), jadi Affiliate BuatCuan dipakai sebagai niche utama.
            </p>
          )}
        </div>
      )}

      <DisclaimerBlock />

      {saveError !== undefined && saveError !== null && (
        <p className="text-center text-xs font-semibold text-destructive" data-testid="niche-hasil-save-error">
          {getErrorMessage(saveError, "Gagal menyimpan hasil. Coba lagi.")}
        </p>
      )}

      <button
        type="button"
        data-testid="niche-hasil-save"
        onClick={onSave}
        disabled={!preview || isSaving}
        className="h-14 w-full rounded-3xl bg-primary text-base font-extrabold text-primary-foreground shadow-glow transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSaving ? "Menyimpan..." : "Simpan"}
      </button>
    </div>
  );
}

function DisclaimerBlock() {
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-secondary/50 p-4" data-testid="niche-hasil-disclaimer">
      <p className="text-xs leading-relaxed text-muted-foreground">{NICHE_RESULT_DISCLAIMER}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{NICHE_COMMISSION_GUARDRAIL}</p>
    </div>
  );
}
