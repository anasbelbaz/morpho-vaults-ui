import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { graphqlQuery } from "@/lib/graphql-api";

const historyPointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const historyResponseSchema = z.object({
  data: z.object({
    vaultV2ByAddress: z
      .object({
        historicalState: z.object({
          sharePrice: z.array(historyPointSchema),
        }),
      })
      .nullable(),
  }),
});

export type HistoryPoint = z.infer<typeof historyPointSchema>;

function buildHistoryQuery(
  address: string,
  chainId: number,
  startTimestamp: number,
  endTimestamp: number,
  interval: "HOUR" | "DAY",
) {
  return `
    query {
      vaultV2ByAddress(address: "${address}", chainId: ${chainId}) {
        historicalState {
          sharePrice(options: {
            startTimestamp: ${startTimestamp},
            endTimestamp: ${endTimestamp},
            interval: ${interval}
          }) {
            x
            y
          }
        }
      }
    }
  `;
}

async function fetchHistory(address: string, chainId: number, days: number) {
  const now = Math.floor(Date.now() / 1000);
  const start = now - days * 86400;
  const interval = days <= 7 ? "HOUR" : "DAY";

  const res = await graphqlQuery(
    buildHistoryQuery(address, chainId, start, now, interval),
    historyResponseSchema,
  );

  const points = res.data.vaultV2ByAddress?.historicalState.sharePrice ?? [];
  return points.sort((a, b) => a.x - b.x);
}

export function useVaultHistory(address: string, chainId = 1, days = 30) {
  return useQuery({
    queryKey: ["vault-history", address, chainId, days],
    queryFn: () => fetchHistory(address, chainId, days),
    // staleTime: 120_000,
    refetchInterval: 120_000,
    enabled: !!address,
  });
}
