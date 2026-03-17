import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { z } from "zod";
import { formatUnits } from "viem";

import { graphqlQuery } from "@/lib/graphql-api";

const PAGE_SIZE = 30;

const txDataSchema = z
  .object({ assets: z.union([z.string(), z.number()]).transform(String) })
  .nullable();

const transactionSchema = z.object({
  type: z.string(),
  timestamp: z.number(),
  data: txDataSchema,
});

const responseSchema = z.object({
  data: z.object({
    vaultV2transactions: z.object({
      items: z.array(transactionSchema),
      pageInfo: z.object({
        countTotal: z.number(),
        count: z.number(),
      }),
    }),
  }),
});

type Transaction = z.infer<typeof transactionSchema>;

function buildQuery(
  vaultAddress: string,
  userAddress: string,
  first: number,
  skip: number,
) {
  return `
    query {
      vaultV2transactions(
        first: ${first},
        skip: ${skip},
        orderBy: Time,
        orderDirection: Desc,
        where: {
          vaultAddress_in: "${vaultAddress}",
          userAddress_in: "${userAddress}",
          type_in: [Deposit, Withdraw]
        }
      ) {
        items {
          type
          timestamp
          data {
            ... on VaultV2DepositData { assets }
            ... on VaultV2WithdrawData { assets }
          }
        }
        pageInfo {
          countTotal
          count
        }
      }
    }
  `;
}

async function fetchPage(
  vaultAddress: string,
  userAddress: string,
  skip: number,
) {
  const res = await graphqlQuery(
    buildQuery(vaultAddress, userAddress, PAGE_SIZE, skip),
    responseSchema,
  );
  return res.data.vaultV2transactions;
}

export type DepositHistoryPoint = { x: number; y: number };

function buildCumulativeBalance(
  txs: Transaction[],
  decimals: number,
): DepositHistoryPoint[] {
  const sorted = [...txs].sort((a, b) => a.timestamp - b.timestamp);

  let cumulative = 0;
  const points: DepositHistoryPoint[] = [];

  for (const tx of sorted) {
    const assets = tx.data?.assets;
    if (!assets) continue;
    const value = Number(formatUnits(BigInt(assets), decimals));

    if (tx.type === "Deposit") {
      cumulative += value;
    } else {
      cumulative = Math.max(cumulative - value, 0);
    }

    points.push({ x: tx.timestamp, y: cumulative });
  }

  if (points.length > 0) {
    points.push({ x: Math.floor(Date.now() / 1000), y: cumulative });
  }

  return points;
}

export function useUserDepositHistory(
  vaultAddress: string,
  userAddress: string | undefined,
  decimals: number,
) {
  const query = useInfiniteQuery({
    queryKey: ["user-deposit-history", vaultAddress, userAddress],
    queryFn: ({ pageParam = 0 }) =>
      fetchPage(vaultAddress, userAddress!, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((n, p) => n + p.items.length, 0);
      if (fetched >= lastPage.pageInfo.countTotal) return undefined;
      return fetched;
    },
    enabled: !!vaultAddress && !!userAddress,
    // staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const points = useMemo(() => {
    const allTxs = query.data?.pages.flatMap((p) => p.items) ?? [];
    if (allTxs.length === 0) return [];
    return buildCumulativeBalance(allTxs, decimals);
  }, [query.data, decimals]);

  return {
    points,
    isLoading: query.isLoading,
    hasMore: query.hasNextPage ?? false,
    loadMore: query.fetchNextPage,
    isFetchingMore: query.isFetchingNextPage,
  };
}
