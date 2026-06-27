import { useQuery } from "@tanstack/react-query";
import { api, type NicheLevel, type NicheJalurCuan, type NicheTampilMuka } from "@/lib/api";

// Niche Tool v1 — Screen 3 "Saran Niche". Isolated query key, independent of every other feature.
export function useNicheCandidatesV1(
  params: { jalur: NicheJalurCuan; tampilMuka?: NicheTampilMuka; modal?: NicheLevel; waktu?: NicheLevel; aksesBarang?: boolean; minat?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: ["niche-candidates-v1", params],
    queryFn: () => api.nicheV1.candidates(params),
    staleTime: 60_000,
    enabled,
  });
}
