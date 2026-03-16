import { useInfiniteQuery } from "@tanstack/react-query";
import { z } from "zod";

const MORPHO_API = "https://api.morpho.org/graphql";
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
  const res = await fetch(MORPHO_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: buildQuery(vaultAddress, first, skip, userAddress),
    }),
  });

  if (!res.ok) throw new Error(`morpho api error: ${res.status}`);

  const json = await res.json();
  const parsed = responseSchema.parse(json);

  return parsed.data.vaultV2transactions.items;
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
    refetchInterval: 10_000,
    enabled: !!vaultAddress,
  });
}
