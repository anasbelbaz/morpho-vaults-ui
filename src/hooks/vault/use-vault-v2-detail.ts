import { useQuery } from "@tanstack/react-query";

import { vaultV2DetailResponseSchema } from "@/lib/schemas/vault-v2-detail";
import { graphqlQuery } from "@/lib/graphql-api";

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
  const res = await graphqlQuery(
    buildDetailQuery(address, chainId),
    vaultV2DetailResponseSchema,
  );
  return res.data.vaultV2ByAddress;
}

export function useVaultV2Detail(address: string, chainId = 1) {
  return useQuery({
    queryKey: ["vault-v2-detail", address, chainId],
    queryFn: () => fetchVaultV2Detail(address, chainId),
    // staleTime: 30_000,
    refetchInterval: 30_000,
    enabled: !!address,
  });
}
