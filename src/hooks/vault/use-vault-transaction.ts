import { useEffect, useRef } from "react";
import { useReadContract, useSendCalls, useWaitForCallsStatus } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { encodeFunctionData, type Address } from "viem";
import { toast } from "sonner";

import { erc20Abi, erc4626Abi } from "@/lib/abis";
import { truncateHash } from "@/lib/format";

type Mode = "deposit" | "withdraw";

interface UseVaultTransactionArgs {
  mode: Mode;
  parsedAmount: bigint | null;
  userAddress: Address | undefined;
  assetAddress: Address;
  vaultAddress: Address;
  chainId: number;
  symbol: string;
  shares: bigint | undefined;
  isMaxWithdraw: boolean;
  onSuccess: () => void;
}

export function useVaultTransaction({
  mode,
  parsedAmount,
  userAddress,
  assetAddress,
  vaultAddress,
  chainId,
  symbol,
  shares,
  isMaxWithdraw,
  onSuccess,
}: UseVaultTransactionArgs) {
  const isDeposit = mode === "deposit";
  const queryClient = useQueryClient();

  const refetchRelatedQueries = () => {
    queryClient.refetchQueries({ queryKey: ["vault-v2-detail", vaultAddress] });
    queryClient.refetchQueries({ queryKey: ["vault-v2-transactions", vaultAddress] });
    queryClient.refetchQueries({ queryKey: ["user-deposit-history", vaultAddress] });
  };

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: assetAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: userAddress ? [userAddress, vaultAddress] : undefined,
    chainId,
    query: {
      enabled: !!userAddress,
      refetchInterval: 10_000,
    },
  });

  const needsApproval =
    isDeposit &&
    parsedAmount != null &&
    (allowance == null || allowance < parsedAmount);

  const sendCalls = useSendCalls();
  const bundleId = sendCalls.data?.id;
  const callsStatus = useWaitForCallsStatus({
    id: bundleId ?? "",
    query: { enabled: !!bundleId },
  });

  const hasHandledRef = useRef<string | null>(null);
  const expectedCallCountRef = useRef(0);

  useEffect(() => {
    if (!callsStatus.isSuccess || !callsStatus.data) return;
    if (!bundleId || hasHandledRef.current === bundleId) return;
    hasHandledRef.current = bundleId;

    const receipts = callsStatus.data.receipts;

    // partial completion: e.g. approve went through but deposit was cancelled
    if (!receipts || receipts.length < expectedCallCountRef.current) {
      toast.error("Transaction was partially completed, please try again");
      sendCalls.reset();
      refetchAllowance();
      refetchRelatedQueries();
      onSuccess();
      return;
    }

    const lastReceipt = receipts[receipts.length - 1];
    const txHash = lastReceipt?.transactionHash;
    const action = isDeposit ? "deposited" : "withdrawn";

    if (txHash) {
      toast.success(`${symbol} successfully ${action}`, {
        action: {
          label: "view tx",
          onClick: () =>
            window.open(`https://etherscan.io/tx/${txHash}`, "_blank"),
        },
      });
    } else {
      toast.success(`${symbol} successfully ${action}`);
    }

    sendCalls.reset();
    refetchAllowance();
    refetchRelatedQueries();
    onSuccess();
  }, [
    callsStatus.isSuccess,
    callsStatus.data,
    bundleId,
    isDeposit,
    symbol,
    sendCalls,
    refetchAllowance,
    onSuccess,
  ]);

  useEffect(() => {
    if (!callsStatus.isError) return;
    toast.error("An error occurred while submitting the transaction");
    sendCalls.reset();
  }, [callsStatus.isError, sendCalls]);

  const submit = () => {
    if (!parsedAmount || !userAddress) return;

    if (isDeposit) {
      const calls: { to: Address; data: `0x${string}` }[] = [];

      if (needsApproval) {
        calls.push({
          to: assetAddress,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [vaultAddress, parsedAmount],
          }),
        });
      }

      calls.push({
        to: vaultAddress,
        data: encodeFunctionData({
          abi: erc4626Abi,
          functionName: "deposit",
          args: [parsedAmount, userAddress],
        }),
      });

      expectedCallCountRef.current = calls.length;
      sendCalls.mutate(
        { calls, experimental_fallback: true },
        { onError: () => toast.error("An error occurred while depositing") },
      );
    } else {
      const data =
        isMaxWithdraw && shares
          ? encodeFunctionData({
              abi: erc4626Abi,
              functionName: "redeem",
              args: [shares, userAddress, userAddress],
            })
          : encodeFunctionData({
              abi: erc4626Abi,
              functionName: "withdraw",
              args: [parsedAmount, userAddress, userAddress],
            });

      expectedCallCountRef.current = 1;
      sendCalls.mutate(
        { calls: [{ to: vaultAddress, data }], experimental_fallback: true },
        { onError: () => toast.error("An error occurred while withdrawing") },
      );
    }
  };

  const isWaiting = sendCalls.isSuccess && callsStatus.isPending;

  return {
    submit,
    reset: sendCalls.reset,
    needsApproval,
    isPending: sendCalls.isPending,
    isWaiting,
  };
}
