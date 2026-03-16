"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useReadContract,
  useSendCalls,
  useWaitForCallsStatus,
} from "wagmi";
import {
  encodeFunctionData,
  formatUnits,
  parseUnits,
  type Address,
} from "viem";
import { AnimatePresence, motion } from "motion/react";

import { toast } from "sonner";
import { useModal } from "connectkit";

import type { VaultV2Detail } from "@/lib/schemas/vault-v2-detail";
import { erc20Abi, erc4626Abi } from "@/lib/abis";
import {
  useUserBalance,
  useUserVaultPosition,
} from "@/hooks/vault/use-vault-onchain-data";
import { Button } from "@/components/ui/button";
import { networkImages, tokenImages } from "@/lib/logos";
import { Loader2 } from "lucide-react";

type Mode = "deposit" | "withdraw";

function formatPct(value: number | null | undefined) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(2)}%`;
}

function formatUsd(value: number) {
  if (value > 0 && value < 0.01) return "$< 0.01";
  return `$${value.toFixed(2)}`;
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

function FlipValue({
  value,
  defaultValue,
}: {
  value: string;
  defaultValue: string;
}) {
  const hasAnimated = useRef(false);
  const isDefault = value === defaultValue;

  if (!isDefault) hasAnimated.current = true;
  const shouldAnimate = hasAnimated.current;

  if (!shouldAnimate) return <span className="font-medium">{value}</span>;

  return (
    <span
      className="relative inline-block overflow-hidden font-medium"
      style={{ minWidth: "3ch" }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={isDefault ? "default" : "active"}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", duration: 0.35, bounce: 0 }}
          className="block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function DepositForm({ vault }: { vault: VaultV2Detail }) {
  const [mode, setMode] = useState<Mode>("deposit");
  const [amount, setAmount] = useState("");
  const { address: userAddress, isConnected } = useAccount();
  const { setOpen: openConnectModal } = useModal();

  const assetAddress = vault.asset.address as Address;
  const vaultAddress = vault.address as Address;
  const decimals = vault.asset.decimals;
  const chainId = vault.chain.id;
  const symbol = vault.asset.symbol ?? "";

  const { data: assetBalance, refetch: refetchAssetBalance } = useUserBalance(
    assetAddress,
    userAddress,
    chainId,
  );

  const { shares, assetsEquivalent } = useUserVaultPosition(
    vaultAddress,
    userAddress,
    chainId,
  );

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

  const formattedAssetBalance =
    assetBalance != null ? Number(formatUnits(assetBalance, decimals)) : 0;

  const formattedVaultBalance =
    assetsEquivalent.data != null
      ? Number(formatUnits(assetsEquivalent.data, decimals))
      : 0;

  const isDeposit = mode === "deposit";
  const relevantBalance = isDeposit
    ? formattedAssetBalance
    : formattedVaultBalance;

  const relevantRawBalance = isDeposit ? assetBalance : assetsEquivalent.data;

  const parsedAmount = useMemo(() => {
    try {
      const n = Number.parseFloat(amount);
      if (Number.isNaN(n) || n <= 0) return null;
      const floored = Math.floor(n * 10 ** decimals) / 10 ** decimals;
      return parseUnits(floored.toString(), decimals);
    } catch {
      return null;
    }
  }, [amount, decimals]);

  const numericAmount = parsedAmount
    ? Number(formatUnits(parsedAmount, decimals))
    : 0;

  const needsApproval =
    isDeposit &&
    parsedAmount != null &&
    (allowance == null || allowance < parsedAmount);

  const usdPerUnit = useMemo(() => {
    if (!vault.totalAssetsUsd || !vault.totalAssets) return 0;
    const totalFormatted = Number(
      formatUnits(BigInt(String(vault.totalAssets)), decimals),
    );
    if (totalFormatted === 0) return 0;
    return vault.totalAssetsUsd / totalFormatted;
  }, [vault.totalAssetsUsd, vault.totalAssets, decimals]);

  const usdEstimate = numericAmount * usdPerUnit;

  const totalPositionAfter = isDeposit
    ? formattedVaultBalance + numericAmount
    : Math.max(formattedVaultBalance - numericAmount, 0);

  const projectedYearly =
    isDeposit && vault.avgNetApy
      ? totalPositionAfter * usdPerUnit * vault.avgNetApy
      : 0;

  const projectedMonthly = projectedYearly / 12;

  const isMaxWithdraw =
    !isDeposit &&
    parsedAmount != null &&
    relevantRawBalance != null &&
    parsedAmount >= relevantRawBalance;

  const sendCalls = useSendCalls();
  const bundleId = sendCalls.data?.id;
  const callsStatus = useWaitForCallsStatus({
    id: bundleId as string,
    query: { enabled: !!bundleId },
  });

  const hasHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!callsStatus.isSuccess || !callsStatus.data) return;

    if (!bundleId) return;
    if (hasHandledRef.current === bundleId) return;
    hasHandledRef.current = bundleId;

    const receipts = callsStatus.data.receipts;
    const lastReceipt = receipts?.[receipts.length - 1];
    const txHash = lastReceipt?.transactionHash;

    const action = isDeposit ? "deposited" : "withdrawn";

    if (txHash) {
      toast.success(`${symbol} successfully ${action}`, {
        description: truncateHash(txHash),
        action: {
          label: "view tx",
          onClick: () =>
            window.open(`https://etherscan.io/tx/${txHash}`, "_blank"),
        },
      });
    } else {
      toast.success(`${symbol} successfully ${action}`);
    }

    setAmount("");
    sendCalls.reset();

    refetchAssetBalance();
    refetchAllowance();
    shares.refetch();
    assetsEquivalent.refetch();
  }, [
    callsStatus.isSuccess,
    callsStatus.data,
    bundleId,
    isDeposit,
    symbol,
    sendCalls,
    refetchAssetBalance,
    refetchAllowance,
    shares.data,
    assetsEquivalent.data,
  ]);

  useEffect(() => {
    if (!callsStatus.isError) return;
    toast.error("An error occurred");
    sendCalls.reset();
  }, [callsStatus.isError, sendCalls]);

  const handleSubmit = () => {
    if (!parsedAmount || !userAddress) return;

    if (isDeposit) {
      const depositData = encodeFunctionData({
        abi: erc4626Abi,
        functionName: "deposit",
        args: [parsedAmount, userAddress],
      });

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

      calls.push({ to: vaultAddress, data: depositData });

      sendCalls.mutate(
        { calls, experimental_fallback: true },
        { onError: () => toast.error("An error occurred") },
      );
    } else {
      const withdrawData =
        isMaxWithdraw && shares.data
          ? encodeFunctionData({
              abi: erc4626Abi,
              functionName: "redeem",
              args: [shares.data, userAddress, userAddress],
            })
          : encodeFunctionData({
              abi: erc4626Abi,
              functionName: "withdraw",
              args: [parsedAmount, userAddress, userAddress],
            });

      sendCalls.mutate(
        {
          calls: [{ to: vaultAddress, data: withdrawData }],
          experimental_fallback: true,
        },
        {
          onError: () => toast.error("An error occurred"),
        },
      );
    }
  };

  const isWaiting = sendCalls.isSuccess && callsStatus.isPending;

  const isDisabled =
    isConnected &&
    (!parsedAmount ||
      sendCalls.isPending ||
      isWaiting ||
      (relevantRawBalance != null && parsedAmount > relevantRawBalance));

  const buttonLabel = !isConnected
    ? "Connect wallet"
    : !parsedAmount
      ? "Enter an amount"
      : relevantRawBalance != null && parsedAmount > relevantRawBalance
        ? "Insufficient balance"
        : sendCalls.isPending
          ? "Confirming…"
          : isWaiting
            ? "Waiting for confirmation…"
            : isDeposit
              ? needsApproval
                ? "Approve & Deposit"
                : "Deposit"
              : "Withdraw";

  const hasValue = numericAmount > 0;

  function switchMode(next: Mode) {
    setMode(next);
    setAmount("");
    sendCalls.reset();
  }

  return (
    <div className="space-y-3">
      {/* mode tabs */}
      <div className="flex rounded-xl border bg-background p-1">
        {(["deposit", "withdraw"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => switchMode(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
              mode === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* input card */}
      <div className="group/input rounded-2xl border bg-background px-5 pb-4 pt-5 transition-colors has-focus:border-primary">
        <p className="mb-3 text-sm text-muted-foreground">
          {isDeposit ? "Deposit" : "Withdraw"} {symbol}
        </p>
        <input
          disabled={sendCalls.isPending}
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || /^\d*[.,]?\d*$/.test(v))
              setAmount(v.replace(",", "."));
          }}
          className="mb-2 w-full bg-transparent text-4xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/30 disabled:opacity-50"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatUsd(usdEstimate)}</span>
          <div className="flex items-center gap-2">
            <span>
              {relevantBalance.toFixed(2)} {symbol}
            </span>
            <button
              type="button"
              className="rounded-md border px-2 py-0.5 text-xs font-medium text-foreground hover:bg-muted"
              onClick={() => setAmount(relevantBalance.toString())}
            >
              MAX
            </button>
          </div>
        </div>
      </div>

      {/* info card */}
      <div className="rounded-2xl border bg-background px-5 py-4">
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Network</span>
            <span className="font-medium flex items-center gap-2">
              <img
                src={networkImages[vault.chain.id]}
                alt={vault.chain.network}
                className="size-4 rounded-full"
              />{" "}
              {vault.chain.network}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              {tokenImages[symbol.toLowerCase()] && (
                <img
                  src={tokenImages[symbol.toLowerCase()]}
                  alt={symbol}
                  className="size-4 rounded-full"
                />
              )}
              Deposited ({symbol})
            </span>
            <FlipValue
              value={
                hasValue
                  ? isDeposit
                    ? (formattedVaultBalance + numericAmount).toFixed(2)
                    : Math.max(
                        formattedVaultBalance - numericAmount,
                        0,
                      ).toFixed(2)
                  : formattedVaultBalance.toFixed(2)
              }
              defaultValue={formattedVaultBalance.toFixed(2)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">APY</span>
            <span className="font-medium">{formatPct(vault.avgNetApy)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Projected monthly earnings
            </span>
            <FlipValue
              value={
                hasValue && isDeposit
                  ? formatUsd(projectedMonthly)
                  : formatUsd(0)
              }
              defaultValue={formatUsd(0)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Projected yearly earnings
            </span>
            <FlipValue
              value={
                hasValue && isDeposit
                  ? formatUsd(projectedYearly)
                  : formatUsd(0)
              }
              defaultValue={formatUsd(0)}
            />
          </div>
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={isDisabled}
        onClick={isConnected ? handleSubmit : () => openConnectModal(true)}
      >
        {buttonLabel}{" "}
        {sendCalls.isPending || isWaiting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : null}
      </Button>
    </div>
  );
}
