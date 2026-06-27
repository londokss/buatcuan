import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const PAGE_SIZE = 10;

// Affiliate v1 read path — paginated wallet ledger feed (signed amounts, running balanceAfter).
// This is the only place the Wallet page renders raw WalletLedgerEntry rows.
export function useAffiliateWalletLedgerV1() {
  return useInfiniteQuery({
    queryKey: ["affiliate-wallet-ledger-v1"],
    queryFn: ({ pageParam }) => api.affiliateV1.walletLedger({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    staleTime: 20_000,
  });
}
