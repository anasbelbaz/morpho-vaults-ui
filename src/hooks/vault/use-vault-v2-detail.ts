import { useQuery } from "@tanstack/react-query";

import { vaultV2DetailResponseSchema } from "@/lib/schemas/vault-v2-detail";

const MORPHO_API = "https://api.morpho.org/graphql";

function buildDetailQuery(address: string, chainId: number) {
  return `
    query {
      vaultV2ByAddress(address: "${address}", chainId: ${chainId}) {
        address
        name
        symbol
        listed
        asset {
          address
          symbol
          decimals
          yield { apr }
        }
        chain { id network }
        totalAssets
        totalAssetsUsd
        totalSupply
        liquidity
        liquidityUsd
        avgApy
        avgNetApy
        performanceFee
        managementFee
        rewards {
          asset {
            address
            chain { id }
          }
          supplyApr
          yearlySupplyTokens
        }
        curators {
          items {
            addresses { address }
          }
        }
        metadata {
          description
          image
        }
      }
    }
  `;
}

async function fetchVaultV2Detail(address: string, chainId: number) {
  const res = await fetch(MORPHO_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: buildDetailQuery(address, chainId) }),
  });

  if (!res.ok) {
    throw new Error(`morpho api error: ${res.status}`);
  }

  const json = await res.json();
  const parsed = vaultV2DetailResponseSchema.parse(json);

  return parsed.data.vaultV2ByAddress;
}

export function useVaultV2Detail(address: string, chainId = 1) {
  return useQuery({
    queryKey: ["vault-v2-detail", address, chainId],
    queryFn: () => fetchVaultV2Detail(address, chainId),
    refetchInterval: 10_000,
    enabled: !!address,
  });
}
