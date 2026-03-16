"use client";

import { useEffect, useMemo, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { formatUnits } from "viem";

import { useVaultTransactions } from "@/hooks/vault/use-vault-transactions";
import { tokenImages } from "@/lib/logos";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function truncateHash(hash: string) {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatShares(shares: string | number | null | undefined) {
  if (shares == null) return "—";
  const raw = typeof shares === "string" ? shares : String(shares);
  const value = Number(formatUnits(BigInt(raw), 18));
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
}

function formatUsd(shares: string | number | null | undefined) {
  if (shares == null) return "";
  const raw = typeof shares === "string" ? shares : String(shares);
  const value = Number(formatUnits(BigInt(raw), 18));
  if (value > 0 && value < 0.01) return "$< 0.01";
  return `$${value.toFixed(2)}`;
}

const ETHERSCAN_TX = "https://etherscan.io/tx/";

export function VaultTransactions({
  address,
  assetSymbol,
}: {
  address: string;
  assetSymbol: string;
}) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVaultTransactions(address);

  const txs = useMemo(() => data?.pages.flat() ?? [], [data]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const symbolKey = assetSymbol.toLowerCase();
  const tokenIcon = tokenImages[symbolKey];

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold">All transactions</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          loading transactions…
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16 text-sm text-destructive">
          failed to load transactions
        </div>
      ) : !txs.length ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          no transactions found
        </div>
      ) : (
        <div className="max-h-[500px] overflow-y-auto rounded-xl border bg-background">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Transaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txs.map((tx) => (
                <TableRow key={`${tx.txHash}-${tx.txIndex}`}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(tx.timestamp)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm font-medium ${
                        tx.type === "Deposit"
                          ? "text-green-500"
                          : "text-foreground"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tokenIcon && (
                        <img
                          src={tokenIcon}
                          alt={assetSymbol}
                          className="size-4 rounded-full"
                        />
                      )}
                      <span className="text-sm font-medium">
                        {formatShares(tx.shares)} {assetSymbol}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {formatUsd(tx.shares)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`${ETHERSCAN_TX}${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-sm text-muted-foreground hover:text-foreground"
                    >
                      {truncateHash(tx.txHash)}
                      <ExternalLink className="size-3" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div ref={sentinelRef} className="h-1" />

          {isFetchingNextPage && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              loading more…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
