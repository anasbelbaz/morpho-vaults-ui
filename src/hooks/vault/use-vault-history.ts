import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const MORPHO_API = "https://api.morpho.org/graphql";

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

  const res = await fetch(MORPHO_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: buildHistoryQuery(address, chainId, start, now, interval),
    }),
  });

  if (!res.ok) throw new Error(`morpho api error: ${res.status}`);

  const json = await res.json();
  const parsed = historyResponseSchema.parse(json);

  const points = parsed.data.vaultV2ByAddress?.historicalState.sharePrice ?? [];

  return points.sort((a, b) => a.x - b.x);
}

export function useVaultHistory(address: string, chainId = 1, days = 30) {
  return useQuery({
    queryKey: ["vault-history", address, chainId, days],
    queryFn: () => fetchHistory(address, chainId, days),
    refetchInterval: 10_000,
    enabled: !!address,
  });
}
