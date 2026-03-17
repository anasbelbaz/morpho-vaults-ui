"use client";

import type { VaultV2Detail } from "@/lib/schemas/vault-v2-detail";
import { networkImages, tokenImages } from "@/lib/logos";
import { formatPct } from "@/lib/format";
import { FlipValue } from "@/components/ui/flip-value";

function formatUsd(value: number) {
  if (value > 0 && value < 0.01) return "$< 0.01";
  return `$${value.toFixed(2)}`;
}

interface DepositInfoCardProps {
  vault: VaultV2Detail;
  symbol: string;
  formattedVaultBalance: number;
  numericAmount: number;
  isDeposit: boolean;
  hasValue: boolean;
  projectedMonthly: number;
  projectedYearly: number;
}

export function DepositInfoCard({
  vault,
  symbol,
  formattedVaultBalance,
  numericAmount,
  isDeposit,
  hasValue,
  projectedMonthly,
  projectedYearly,
}: DepositInfoCardProps) {
  const depositedAfter = hasValue
    ? isDeposit
      ? (formattedVaultBalance + numericAmount).toFixed(2)
      : Math.max(formattedVaultBalance - numericAmount, 0).toFixed(2)
    : formattedVaultBalance.toFixed(2);

  const depositedDefault = formattedVaultBalance.toFixed(2);

  return (
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
          <FlipValue value={depositedAfter} defaultValue={depositedDefault} />
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
  );
}
