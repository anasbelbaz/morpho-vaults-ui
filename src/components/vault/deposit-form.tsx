"use client";

import { useCallback, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { formatUnits, parseUnits, type Address } from "viem";
import { useModal } from "connectkit";
import { Loader2 } from "lucide-react";

import type { VaultV2Detail } from "@/lib/schemas/vault-v2-detail";
import {
  useUserBalance,
  useUserVaultPosition,
} from "@/hooks/vault/use-vault-onchain-data";
import { useVaultTransaction } from "@/hooks/vault/use-vault-transaction";
import { Button } from "@/components/ui/button";
import { DepositInfoCard } from "@/components/vault/deposit-info-card";

type Mode = "deposit" | "withdraw";

function formatUsd(value: number) {
  if (value > 0 && value < 0.01) return "$< 0.01";
  return `$${value.toFixed(2)}`;
}

export function DepositForm({
  vault,
  onTransactionComplete,
}: {
  vault: VaultV2Detail;
  onTransactionComplete?: () => void;
}) {
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

  const isMaxWithdraw =
    !isDeposit &&
    parsedAmount != null &&
    relevantRawBalance != null &&
    parsedAmount >= relevantRawBalance;

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
  const hasValue = numericAmount > 0;

  const handleTxSuccess = useCallback(() => {
    setAmount("");
    refetchAssetBalance();
    shares.refetch();
    assetsEquivalent.refetch();
    onTransactionComplete?.();
  }, [refetchAssetBalance, shares, assetsEquivalent, onTransactionComplete]);

  const tx = useVaultTransaction({
    mode,
    parsedAmount,
    userAddress,
    assetAddress,
    vaultAddress,
    chainId,
    symbol,
    shares: shares.data ?? undefined,
    isMaxWithdraw,
    onSuccess: handleTxSuccess,
  });

  const isDisabled =
    isConnected &&
    (!parsedAmount ||
      tx.isPending ||
      tx.isWaiting ||
      (relevantRawBalance != null && parsedAmount > relevantRawBalance));

  const buttonLabel = !isConnected
    ? "Connect wallet"
    : !parsedAmount
      ? "Enter an amount"
      : relevantRawBalance != null && parsedAmount > relevantRawBalance
        ? "Insufficient balance"
        : tx.isPending
          ? "Confirming…"
          : tx.isWaiting
            ? "Waiting for confirmation…"
            : isDeposit
              ? tx.needsApproval
                ? "Approve & Deposit"
                : "Deposit"
              : "Withdraw";

  function switchMode(next: Mode) {
    setMode(next);
    setAmount("");
    tx.reset();
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-xl border bg-background p-1">
        {(["deposit", "withdraw"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => switchMode(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors cursor-pointer ${
              mode === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="group/input rounded-2xl border bg-background px-5 pb-4 pt-5 transition-colors has-focus:border-primary">
        <p className="mb-3 text-sm text-muted-foreground">
          {isDeposit ? "Deposit" : "Withdraw"} {symbol}
        </p>
        <input
          disabled={tx.isPending}
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
              className="rounded-md border px-2 py-0.5 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
              onClick={() => setAmount(relevantBalance.toString())}
            >
              MAX
            </button>
          </div>
        </div>
      </div>

      <DepositInfoCard
        vault={vault}
        symbol={symbol}
        formattedVaultBalance={formattedVaultBalance}
        numericAmount={numericAmount}
        isDeposit={isDeposit}
        hasValue={hasValue}
        projectedMonthly={projectedMonthly}
        projectedYearly={projectedYearly}
      />

      <Button
        className="w-full"
        size="lg"
        disabled={isDisabled}
        onClick={isConnected ? tx.submit : () => openConnectModal(true)}
      >
        {buttonLabel}{" "}
        {tx.isPending || tx.isWaiting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : null}
      </Button>
    </div>
  );
}
