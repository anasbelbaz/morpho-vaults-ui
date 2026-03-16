"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowDownToLine, ChartCandlestick } from "lucide-react";
import type { Address } from "viem";
import { formatUnits } from "viem";

import { useVaultV2Detail } from "@/hooks/vault/use-vault-v2-detail";
import { useVaultOnchain } from "@/hooks/vault/use-vault-onchain-data";
import { DepositForm } from "@/components/vault/deposit-form";
import { SharePriceChart } from "@/components/vault/share-price-chart";
import { VaultTransactions } from "@/components/vault/vault-transactions-table";
import { UserTransactions } from "@/components/vault/user-transactions-table";
import { UserDepositChart } from "@/components/vault/user-deposit-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useParams } from "next/navigation";
import { networkImages, tokenImages } from "@/lib/logos";

function formatUsd(value: number | null | undefined) {
  if (value == null) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPct(value: number | null | undefined) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(2)}%`;
}

function formatTokenAmount(raw: bigint | undefined, decimals: number) {
  if (raw == null) return "—";
  const formatted = Number(formatUnits(raw, decimals));
  if (formatted >= 1_000_000) return `${(formatted / 1_000_000).toFixed(2)}M`;
  if (formatted >= 1_000) return `${(formatted / 1_000).toFixed(2)}K`;
  return formatted.toFixed(2);
}

const sections = [
  { id: "share-price", label: "Share price" },
  { id: "transactions", label: "Transactions" },
  { id: "my-deposits", label: "My deposits" },
  { id: "my-transactions", label: "My transactions" },
] as const;

export default function VaultPage() {
  const params = useParams();
  const address = params.id as string;
  const { data: vault, isLoading, error } = useVaultV2Detail(address);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);
  const isScrollingRef = useRef(false);

  const vaultAddr = address as Address;
  const chainId = vault?.chain.id ?? 1;

  const { totalAssets, totalSupply } = useVaultOnchain(vaultAddr, chainId);

  useEffect(() => {
    const els = Object.entries(sectionRefs.current).reduce<
      Record<string, HTMLDivElement>
    >((acc, [id, el]) => {
      if (el) acc[id] = el;
      return acc;
    }, {});

    if (Object.keys(els).length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        let best: { id: string; ratio: number } | null = null;
        for (const entry of entries) {
          const id = entry.target.getAttribute("data-section");
          if (!id) continue;
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { id, ratio: entry.intersectionRatio };
          }
        }
        if (best && best.ratio > 0) setActiveSection(best.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const el of Object.values(els)) observer.observe(el);
    return () => observer.disconnect();
  }, [vault]);

  if (error && !vault) {
    return (
      <div className="flex items-center justify-center py-32 text-lg text-destructive">
        failed to load vault
      </div>
    );
  }

  const decimals = vault?.asset.decimals ?? 6;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8 md:py-14">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Vaults
      </Link>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <div className="min-w-0 flex-1">
          {/* header */}
          <div className="mb-6">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              {vault ? (
                <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
                  {vault.name}
                </h1>
              ) : (
                <Skeleton className="h-9 w-64" />
              )}
              <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                V2
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {vault ? (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <img
                      src={networkImages[vault.chain.id.toString()]}
                      className="size-5 rounded-full"
                    />
                    {vault.chain.network}
                  </span>
                  {vault.asset.symbol && (
                    <span className="inline-flex items-center gap-1.5">
                      <img
                        src={tokenImages[vault.asset.symbol.toLowerCase()]}
                        className="size-5 rounded-full"
                      />
                      {vault.asset.symbol}
                    </span>
                  )}
                </>
              ) : (
                <div className="flex gap-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              )}
            </div>
          </div>

          {vault?.metadata?.description && (
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
              {vault.metadata.description}
            </p>
          )}

          {/* stats grid */}
          <div className="mb-8 grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">TVL</p>
              {totalAssets.isLoading || !vault ? (
                <Skeleton className="mt-1 h-7 w-28" />
              ) : (
                <>
                  <p className="text-xl font-semibold">
                    {formatTokenAmount(totalAssets.data, decimals)}{" "}
                    {vault.asset.symbol ?? ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatUsd(vault.totalAssetsUsd)}
                  </p>
                </>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Liquidity</p>
              {!vault ? (
                <Skeleton className="mt-1 h-7 w-24" />
              ) : (
                <p className="text-xl font-semibold">
                  {formatUsd(vault.liquidityUsd)}
                </p>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">APY</p>
              {!vault ? (
                <Skeleton className="mt-1 h-7 w-20" />
              ) : (
                <p className="text-xl font-semibold">
                  {formatPct(vault.avgNetApy)}
                </p>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Total Supply</p>
              {totalSupply.isLoading ? (
                <Skeleton className="mt-1 h-7 w-24" />
              ) : (
                <p className="text-xl font-semibold">
                  {formatTokenAmount(totalSupply.data, 18)}
                </p>
              )}
            </div>
          </div>

          {/* section nav */}
          <Tabs
            value={activeSection}
            onValueChange={(id) => {
              setActiveSection(id);
              isScrollingRef.current = true;
              sectionRefs.current[id]?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
              setTimeout(() => {
                isScrollingRef.current = false;
              }, 800);
            }}
            className="sticky top-0 z-20 mb-6 bg-background"
          >
            <TabsList variant="line" className="w-full">
              {sections.map((section) => (
                <TabsTrigger key={section.id} value={section.id}>
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* all sections */}
          <div
            data-section="share-price"
            ref={(el) => {
              sectionRefs.current["share-price"] = el;
            }}
            className="scroll-mt-14"
          >
            <SharePriceChart address={address} chainId={chainId} />
          </div>

          <div
            data-section="transactions"
            ref={(el) => {
              sectionRefs.current["transactions"] = el;
            }}
            className="mt-10 scroll-mt-14"
          >
            <VaultTransactions
              address={address}
              assetSymbol={vault?.asset.symbol ?? ""}
            />
          </div>

          <div
            data-section="my-deposits"
            ref={(el) => {
              sectionRefs.current["my-deposits"] = el;
            }}
            className="mt-10 scroll-mt-14"
          >
            <UserDepositChart
              vaultAddress={address}
              assetSymbol={vault?.asset.symbol ?? ""}
              decimals={decimals}
            />
          </div>

          <div
            data-section="my-transactions"
            ref={(el) => {
              sectionRefs.current["my-transactions"] = el;
            }}
            className="mt-10 scroll-mt-14"
          >
            <UserTransactions
              vaultAddress={address}
              assetSymbol={vault?.asset.symbol ?? ""}
            />
          </div>
        </div>

        {/* right column — desktop only */}
        <div className="hidden w-full shrink-0 lg:block lg:w-[340px]">
          <div className="lg:sticky lg:top-24">
            {vault ? (
              <DepositForm vault={vault} />
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-36 w-full rounded-2xl" />
                <Skeleton className="h-52 w-full rounded-2xl" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* mobile floating deposit button + drawer */}
      <Drawer>
        <DrawerTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 z-40 size-14 rounded-full shadow-lg lg:hidden cursor-pointer"
          >
            <ChartCandlestick className="size-5 cursor-pointer" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{vault?.name ?? "Vault"}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            {vault ? (
              <DepositForm vault={vault} />
            ) : (
              <div className="space-y-3 py-4">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-36 w-full rounded-2xl" />
                <Skeleton className="h-52 w-full rounded-2xl" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
