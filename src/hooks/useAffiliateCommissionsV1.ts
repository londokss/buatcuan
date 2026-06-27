import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const PAGE_SIZE = 10;

// Affiliate v1 read path — paginated per-commission feed (rate, gross amount, status), replacing
// the legacy ReferralCommission rows that used to power the Wallet page's transaction list.
export function useAffiliateCommissionsV1() {
  return useInfiniteQuery({
    queryKey: ["affiliate-commissions-v1"],
    queryFn: ({ pageParam }) => api.affiliateV1.commissions({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    staleTime: 20_000,
  });
}
