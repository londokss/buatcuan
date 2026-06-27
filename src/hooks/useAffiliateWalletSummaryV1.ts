import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Affiliate v1 read-path pilot. Isolated query key so it can fail/retry independently of the
// legacy ["wallet"] query that still powers the rest of the Wallet page.
export function useAffiliateWalletSummaryV1(enabled = true) {
  return useQuery({
    queryKey: ["affiliate-wallet-summary-v1"],
    queryFn: () => api.affiliateV1.walletSummary(),
    staleTime: 20_000,
    enabled,
  });
}
