import { formatUnits } from "viem";

export function formatUsd(value: number | null | undefined) {
  if (value == null) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatPct(value: number | null | undefined) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(2)}%`;
}

export function formatTokenAmount(raw: bigint | undefined, decimals: number) {
  if (raw == null) return "—";
  const formatted = Number(formatUnits(raw, decimals));
  if (formatted >= 1_000_000) return `${(formatted / 1_000_000).toFixed(2)}M`;
  if (formatted >= 1_000) return `${(formatted / 1_000).toFixed(2)}K`;
  return formatted.toFixed(2);
}
