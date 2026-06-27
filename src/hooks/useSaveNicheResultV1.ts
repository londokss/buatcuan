import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Niche Tool v1 — Screen 6 "Simpan". Recomputes + persists server-side from the same raw inputs
// the score preview used, so the saved result can never diverge from what was shown on screen.
export function useSaveNicheResultV1() {
  return useMutation({
    mutationFn: (payload) => api.nicheV1.saveResult(payload),
  });
}
