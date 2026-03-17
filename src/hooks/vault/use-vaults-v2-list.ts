import { useInfiniteQuery } from "@tanstack/react-query";

import { vaultV2ResponseSchema } from "@/lib/schemas/vault-v2-list";
import { graphqlQuery } from "@/lib/graphql-api";

const PAGE_SIZE = 10;

export const THREE_F_VAULTS = ["0xBEEf3f3A04e28895f3D5163d910474901981183D"];

function buildQuery(skip: number, addressIn: string[]) {
  const addressFilter =
    addressIn.length > 0
      ? `, address_in: [${addressIn.map((a) => `"${a}"`).join(", ")}]`
      : "";

  const orderDir = addressIn.length > 0 ? "" : ", orderDirection: Desc";

  return `
    query {
      vaultV2s(first: ${PAGE_SIZE}, skip: ${skip}${orderDir}, where: { chainId_in: [1], listed: true${addressFilter} }) {
        items {
          address
          symbol
          name
          listed
          asset {
            id
            address
            decimals
          }
          chain {
            id
            network
          }
        }
      }
    }
  `;
}

async function fetchVaultsV2Page(pageParam: number, addressIn: string[]) {
  const res = await graphqlQuery(
    buildQuery(pageParam, addressIn),
    vaultV2ResponseSchema,
  );
  return res.data.vaultV2s.items;
}

export function useVaultsV2(addressIn: string[] = []) {
  return useInfiniteQuery({
    queryKey: ["vaults-v2", addressIn],
    queryFn: ({ pageParam }) => fetchVaultsV2Page(pageParam, addressIn),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    // staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
