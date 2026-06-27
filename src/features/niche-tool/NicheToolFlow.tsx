import { useMemo, useState } from "react";
import type { NicheCandidateV1Dto, NichePersonalAnswers, NicheResultResponseV1Dto, NicheScoreRequestV1 } from "@/lib/api";
import { useNicheScoreV1 } from "@/hooks/useNicheScoreV1";
import { useSaveNicheResultV1 } from "@/hooks/useSaveNicheResultV1";
import { DEFAULT_JALUR, NICHE_TOOL_STEP_LABELS, NICHE_TOOL_STEPS, type NicheToolStep } from "./niche-tool-constants";
import type { NicheToolProfil, NicheToolState } from "./types";
import { StepHasil } from "./steps/StepHasil";
import { StepJalur } from "./steps/StepJalur";
import { StepKandidat } from "./steps/StepKandidat";
import { StepProfil } from "./steps/StepProfil";
import { StepSaringan } from "./steps/StepSaringan";
import { StepSkor } from "./steps/StepSkor";

const EMPTY_PROFIL: NicheToolProfil = { modal: null, waktu: null, tampilMuka: null, minat: "", aksesBarang: null };

const INITIAL_STATE: NicheToolState = {
  jalur: DEFAULT_JALUR,
  profil: EMPTY_PROFIL,
  candidatesById: {},
  selectedCandidateIds: [],
  answersByCandidateId: {},
};

export function NicheToolFlow() {
  const [step, setStep] = useState<NicheToolStep>("jalur");
  const [state, setState] = useState<NicheToolState>(INITIAL_STATE);
  const [savedResult, setSavedResult] = useState<NicheResultResponseV1Dto | null>(null);

  const selectedCandidates = useMemo(
    () => state.selectedCandidateIds.map((id) => state.candidatesById[id]).filter((c): c is NicheCandidateV1Dto => Boolean(c)),
    [state.selectedCandidateIds, state.candidatesById],
  );

  const scoreRequest: NicheScoreRequestV1 = useMemo(
    () => ({
      jalur: state.jalur,
      profil: {
        tampilMuka: state.profil.tampilMuka ?? undefined,
        modal: state.profil.modal ?? undefined,
        waktu: state.profil.waktu ?? undefined,
        aksesBarang: state.profil.aksesBarang ?? undefined,
        minat: state.profil.minat || undefined,
      },
      entries: state.selectedCandidateIds.map((candidateId) => ({
        candidateId,
        answers: state.answersByCandidateId[candidateId] ?? {},
      })),
    }),
    [
      state.jalur,
      state.profil.tampilMuka,
      state.profil.modal,
      state.profil.waktu,
      state.profil.aksesBarang,
      state.profil.minat,
      state.selectedCandidateIds,
      state.answersByCandidateId,
    ],
  );

  const scoreQuery = useNicheScoreV1(scoreRequest, step === "skor" || step === "hasil");
  const saveResultMutation = useSaveNicheResultV1();

  const goTo = (next: NicheToolStep) => setStep(next);

  const handleToggleCandidate = (candidate: NicheCandidateV1Dto) => {
    setState((prev) => {
      const alreadySelected = prev.selectedCandidateIds.includes(candidate.id);
      const selectedCandidateIds = alreadySelected
        ? prev.selectedCandidateIds.filter((id) => id !== candidate.id)
        : [...prev.selectedCandidateIds, candidate.id];
      return {
        ...prev,
        selectedCandidateIds,
        candidatesById: { ...prev.candidatesById, [candidate.id]: candidate },
      };
    });
  };

  const handleAnswerChange = (candidateId: string, answers: NichePersonalAnswers) => {
    setState((prev) => ({ ...prev, answersByCandidateId: { ...prev.answersByCandidateId, [candidateId]: answers } }));
  };

  const handleSave = () => {
    saveResultMutation.mutate(scoreRequest, {
      onSuccess: (data) => setSavedResult(data),
    });
  };

  const handleRestart = () => {
    setState(INITIAL_STATE);
    setSavedResult(null);
    saveResultMutation.reset();
    setStep("jalur");
  };

  const stepIndex = NICHE_TOOL_STEPS.indexOf(step);

  return (
    <div className="space-y-5" data-testid="niche-tool-flow">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>{NICHE_TOOL_STEP_LABELS[step]}</span>
          <span>
            Langkah {stepIndex + 1}/{NICHE_TOOL_STEPS.length}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((stepIndex + 1) / NICHE_TOOL_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {step === "jalur" && (
        <StepJalur jalur={state.jalur} onChange={(jalur) => setState((prev) => ({ ...prev, jalur }))} onNext={() => goTo("profil")} />
      )}

      {step === "profil" && (
        <StepProfil profil={state.profil} onChange={(profil) => setState((prev) => ({ ...prev, profil }))} onNext={() => goTo("kandidat")} />
      )}

      {step === "kandidat" && (
        <StepKandidat
          jalur={state.jalur}
          tampilMuka={state.profil.tampilMuka}
          modal={state.profil.modal}
          waktu={state.profil.waktu}
          aksesBarang={state.profil.aksesBarang}
          minat={state.profil.minat}
          selectedCandidateIds={state.selectedCandidateIds}
          onToggle={handleToggleCandidate}
          onNext={() => goTo("saringan")}
        />
      )}

      {step === "saringan" && <StepSaringan candidates={selectedCandidates} onNext={() => goTo("skor")} />}

      {step === "skor" && (
        <StepSkor
          candidates={selectedCandidates}
          answersByCandidateId={state.answersByCandidateId}
          onAnswerChange={handleAnswerChange}
          scoreQuery={scoreQuery}
          onNext={() => goTo("hasil")}
        />
      )}

      {step === "hasil" && (
        <StepHasil
          scoreQuery={scoreQuery}
          savedResult={savedResult}
          isSaving={saveResultMutation.isPending}
          saveError={saveResultMutation.error}
          onSave={handleSave}
          onRestart={handleRestart}
        />
      )}

      {step !== "jalur" && !savedResult && (
        <button
          type="button"
          data-testid="niche-tool-back"
          onClick={() => goTo(NICHE_TOOL_STEPS[Math.max(0, stepIndex - 1)])}
          className="w-full text-center text-xs font-bold text-muted-foreground"
        >
          ← Kembali
        </button>
      )}
    </div>
  );
}
