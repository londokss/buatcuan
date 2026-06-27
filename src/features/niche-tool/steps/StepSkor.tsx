import type { NicheCandidateV1Dto, NichePersonalAnswers, NicheScoreResponseV1Dto } from "@/lib/api";
import { getErrorMessage } from "@/lib/api";
import { LAMP_META, PERSONAL_CINTA_OPTIONS, PERSONAL_MODAL_WAKTU_OPTIONS, PERSONAL_OKE_DIKUASAI_OPTIONS } from "../niche-tool-constants";

interface StepSkorProps {
  candidates: NicheCandidateV1Dto[];
  answersByCandidateId: Record<string, NichePersonalAnswers>;
  onAnswerChange: (candidateId: string, answers: NichePersonalAnswers) => void;
  scoreQuery: {
    data?: NicheScoreResponseV1Dto;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
  };
  onNext: () => void;
}

function TapGroup<T extends string>({
  label,
  options,
  value,
  onSelect,
  testIdPrefix,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T | undefined;
  onSelect: (value: T) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              data-testid={`${testIdPrefix}-${option.value}`}
              onClick={() => onSelect(option.value)}
              className={`h-12 rounded-xl border px-1 text-[11px] font-bold transition-colors ${
                active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StepSkor({ candidates, answersByCandidateId, onAnswerChange, scoreQuery, onNext }: StepSkorProps) {
  const scoreById = new Map((scoreQuery.data?.ranked ?? []).map((entry) => [entry.candidateId, entry]));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold">Skor Personal</h2>
        <p className="mt-1 text-sm text-muted-foreground">3 tap per niche. Boleh dilewati — sistem pakai nilai tengah kalau di-skip.</p>
      </div>

      <div className="space-y-4">
        {candidates.map((candidate) => {
          const answers = answersByCandidateId[candidate.id] ?? {};
          const scored = scoreById.get(candidate.id);
          return (
            <div key={candidate.id} className="space-y-3 rounded-3xl border border-border bg-card p-4" data-testid={`niche-skor-card-${candidate.slug}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-extrabold">{candidate.name}</p>
                {scored && (
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${LAMP_META[scored.lamp].badgeClass}`} data-testid={`niche-skor-lamp-${candidate.slug}`}>
                    {scored.finalScore}/100 · {LAMP_META[scored.lamp].label}
                  </span>
                )}
              </div>

              <TapGroup
                label="Cinta (suka topik ini?)"
                options={PERSONAL_CINTA_OPTIONS}
                value={answers.cinta}
                onSelect={(cinta) => onAnswerChange(candidate.id, { ...answers, cinta })}
                testIdPrefix={`niche-skor-${candidate.slug}-cinta`}
              />
              <TapGroup
                label="Oke Dikuasai?"
                options={PERSONAL_OKE_DIKUASAI_OPTIONS}
                value={answers.okeDikuasai}
                onSelect={(okeDikuasai) => onAnswerChange(candidate.id, { ...answers, okeDikuasai })}
                testIdPrefix={`niche-skor-${candidate.slug}-oke-dikuasai`}
              />
              <TapGroup
                label="Modal & Waktu?"
                options={PERSONAL_MODAL_WAKTU_OPTIONS}
                value={answers.modalWaktu}
                onSelect={(modalWaktu) => onAnswerChange(candidate.id, { ...answers, modalWaktu })}
                testIdPrefix={`niche-skor-${candidate.slug}-modal-waktu`}
              />
            </div>
          );
        })}
      </div>

      {scoreQuery.isLoading && <p className="text-center text-xs text-muted-foreground" data-testid="niche-skor-loading">Menghitung skor...</p>}
      {scoreQuery.isError && (
        <p className="text-center text-xs font-semibold text-destructive" data-testid="niche-skor-error">
          {getErrorMessage(scoreQuery.error, "Skor belum bisa dihitung.")}
        </p>
      )}

      <button
        type="button"
        data-testid="niche-skor-next"
        onClick={onNext}
        disabled={!scoreQuery.data}
        className="h-14 w-full rounded-3xl bg-primary text-base font-extrabold text-primary-foreground shadow-glow transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Lihat Hasil
      </button>
    </div>
  );
}
