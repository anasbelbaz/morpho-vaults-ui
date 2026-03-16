import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { formatUnits } from "viem";

const MORPHO_API = "https://api.morpho.org/graphql";

const transactionSchema = z.object({
  type: z.string(),
  shares: z.union([z.string(), z.number()]).nullable().optional(),
  timestamp: z.number(),
});

const responseSchema = z.object({
  data: z.object({
    vaultV2transactions: z.object({
      items: z.array(transactionSchema),
    }),
  }),
});

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
        where: { vaultAddress_in: "${vaultAddress}", userAddress_in: "${userAddress}" }
      ) {
        items {
          type
          shares
          timestamp
        }
      }
    }
  `;
}

async function fetchAllUserTransactions(
  vaultAddress: string,
  userAddress: string,
) {
  const PAGE = 100;
  let skip = 0;
  const allItems: z.infer<typeof transactionSchema>[] = [];

  while (true) {
    const res = await fetch(MORPHO_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: buildQuery(vaultAddress, userAddress, PAGE, skip),
      }),
    });

    if (!res.ok) throw new Error(`morpho api error: ${res.status}`);

    const json = await res.json();
    const parsed = responseSchema.parse(json);
    const items = parsed.data.vaultV2transactions.items;

    allItems.push(...items);
    if (items.length < PAGE) break;
    skip += PAGE;
  }

  return allItems;
}

export type DepositHistoryPoint = { x: number; y: number };

function buildCumulativeBalance(
  txs: z.infer<typeof transactionSchema>[],
  decimals: number,
): DepositHistoryPoint[] {
  const sorted = [...txs].sort((a, b) => a.timestamp - b.timestamp);

  let cumulative = 0;
  const points: DepositHistoryPoint[] = [];

  for (const tx of sorted) {
    if (tx.shares == null) continue;
    const raw = typeof tx.shares === "string" ? tx.shares : String(tx.shares);
    const value = Number(formatUnits(BigInt(raw), decimals));

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
  return useQuery({
    queryKey: ["user-deposit-history", vaultAddress, userAddress],
    queryFn: async () => {
      const txs = await fetchAllUserTransactions(vaultAddress, userAddress!);
      return buildCumulativeBalance(txs, 18);
    },
    refetchInterval: 10_000,
    enabled: !!vaultAddress && !!userAddress,
  });
}
