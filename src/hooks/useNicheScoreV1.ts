import { useQuery } from "@tanstack/react-query";
import { api, type NicheScoreRequestV1 } from "@/lib/api";

// Niche Tool v1 — Screen 5 "Skor" live preview. Re-fetches whenever entries/profil change so the
// score on screen always matches what /result would save (same backend computation, no caching
// across different inputs).
export function useNicheScoreV1(request: NicheScoreRequestV1, enabled: boolean) {
  return useQuery({
    queryKey: ["niche-score-v1", request],
    queryFn: () => api.nicheV1.score(request),
    enabled: enabled && request.entries.length > 0,
    retry: false,
  });
}
