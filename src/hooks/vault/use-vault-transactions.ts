import { useInfiniteQuery } from "@tanstack/react-query";
import { z } from "zod";

import { graphqlQuery } from "@/lib/graphql-api";

const PAGE_SIZE = 15;

const transactionSchema = z.object({
  vault: z.object({ address: z.string() }),
  type: z.string(),
  shares: z.union([z.string(), z.number()]).nullable().optional(),
  blockNumber: z.number(),
  timestamp: z.number(),
  txHash: z.string(),
  txIndex: z.number(),
});

const responseSchema = z.object({
  data: z.object({
    vaultV2transactions: z.object({
      items: z.array(transactionSchema),
    }),
  }),
});

export type VaultTransaction = z.infer<typeof transactionSchema>;

function buildQuery(
  vaultAddress: string,
  first: number,
  skip: number,
  userAddress?: string,
) {
  const userFilter = userAddress ? `, userAddress_in: "${userAddress}"` : "";
  return `
    query {
      vaultV2transactions(
        first: ${first},
        skip: ${skip},
        where: { vaultAddress_in: "${vaultAddress}"${userFilter} }
      ) {
        items {
          vault { address }
          type
          shares
          blockNumber
          timestamp
          txHash
          txIndex
        }
      }
    }
  `;
}

async function fetchTransactions(
  vaultAddress: string,
  first: number,
  skip: number,
  userAddress?: string,
) {
  const res = await graphqlQuery(
    buildQuery(vaultAddress, first, skip, userAddress),
    responseSchema,
  );
  return res.data.vaultV2transactions.items;
}

export function useVaultTransactions(
  vaultAddress: string,
  userAddress?: string,
) {
  return useInfiniteQuery({
    queryKey: ["vault-v2-transactions", vaultAddress, userAddress ?? "all"],
    queryFn: ({ pageParam = 0 }) =>
      fetchTransactions(vaultAddress, PAGE_SIZE, pageParam, userAddress),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.flat().length,
    // staleTime: 30_000,
    refetchInterval: 30_000,
    enabled: !!vaultAddress,
  });
}
