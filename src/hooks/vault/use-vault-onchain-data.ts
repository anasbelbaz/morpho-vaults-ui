import { useReadContract } from "wagmi";
import type { Address } from "viem";

import { erc4626Abi, erc20Abi } from "@/lib/abis";

const REFETCH_INTERVAL = 10_000;

export function useVaultOnchain(vaultAddress: Address, chainId: number) {
  const totalAssets = useReadContract({
    address: vaultAddress,
    abi: erc4626Abi,
    functionName: "totalAssets",
    chainId,
    query: { refetchInterval: REFETCH_INTERVAL },
  });

  const totalSupply = useReadContract({
    address: vaultAddress,
    abi: erc4626Abi,
    functionName: "totalSupply",
    chainId,
    query: { refetchInterval: REFETCH_INTERVAL },
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
      refetchInterval: REFETCH_INTERVAL,
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
      refetchInterval: REFETCH_INTERVAL,
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
      refetchInterval: REFETCH_INTERVAL,
    },
  });

  return { shares, assetsEquivalent };
}
