import { useReadContract } from "wagmi";
import type { Address } from "viem";

import { erc4626Abi, erc20Abi } from "@/lib/abis";

const VAULT_REFETCH = 30_000;
const USER_REFETCH = 10_000;

export function useVaultOnchain(vaultAddress: Address, chainId: number) {
  const totalAssets = useReadContract({
    address: vaultAddress,
    abi: erc4626Abi,
    functionName: "totalAssets",
    chainId,
    query: { staleTime: 15_000, refetchInterval: VAULT_REFETCH },
  });

  const totalSupply = useReadContract({
    address: vaultAddress,
    abi: erc4626Abi,
    functionName: "totalSupply",
    chainId,
    query: { staleTime: 15_000, refetchInterval: VAULT_REFETCH },
  });

  return { totalAssets, totalSupply };
}

export function useUserBalance(
  tokenAddress: Address | undefined,
  userAddress: Address | undefined,
  chainId: number,
) {
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    chainId,
    query: {
      enabled: !!tokenAddress && !!userAddress,
      staleTime: USER_REFETCH,
      refetchInterval: USER_REFETCH,
    },
  });
}

export function useUserVaultPosition(
  vaultAddress: Address | undefined,
  userAddress: Address | undefined,
  chainId: number,
) {
  const shares = useReadContract({
    address: vaultAddress,
    abi: erc4626Abi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    chainId,
    query: {
      enabled: !!vaultAddress && !!userAddress,
      staleTime: USER_REFETCH,
      refetchInterval: USER_REFETCH,
    },
  });

  const assetsEquivalent = useReadContract({
    address: vaultAddress,
    abi: erc4626Abi,
    functionName: "convertToAssets",
    args: shares.data != null ? [shares.data] : undefined,
    chainId,
    query: {
      enabled: !!vaultAddress && shares.data != null && shares.data > BigInt(0),
      staleTime: USER_REFETCH,
      refetchInterval: USER_REFETCH,
    },
  });

  return { shares, assetsEquivalent };
}
