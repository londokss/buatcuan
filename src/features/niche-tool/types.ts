import type { NicheCandidateV1Dto, NicheJalurCuan, NicheLevel, NichePersonalAnswers, NicheTampilMuka } from "@/lib/api";

export type NicheToolProfil = {
  modal: NicheLevel | null;
  waktu: NicheLevel | null;
  tampilMuka: NicheTampilMuka | null;
  minat: string;
  aksesBarang: boolean | null;
};

export type NicheToolState = {
  jalur: NicheJalurCuan;
  profil: NicheToolProfil;
  candidatesById: Record<string, NicheCandidateV1Dto>;
  selectedCandidateIds: string[];
  answersByCandidateId: Record<string, NichePersonalAnswers>;
};

export const isProfilWajibComplete = (profil: NicheToolProfil) =>
  profil.modal !== null && profil.waktu !== null && profil.tampilMuka !== null;
