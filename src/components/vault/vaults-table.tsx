"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useVaultsV2, THREE_F_VAULTS } from "@/hooks/vault/use-vaults-v2-list";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { networkImages } from "@/lib/logos";

export function VaultsTable() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [filterByThreeF, setFilterByThreeF] = useState(true);

  const addressIn = filterByThreeF ? THREE_F_VAULTS : [];

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVaultsV2(addressIn);

  const vaults = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollContainer = scrollRef.current;
    if (!sentinel || !scrollContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: scrollContainer, rootMargin: "600px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <Checkbox
          id="filter-3f"
          checked={filterByThreeF}
          onCheckedChange={(checked) => setFilterByThreeF(checked === true)}
        />
        <label
          htmlFor="filter-3f"
          className="cursor-pointer select-none text-sm font-medium"
        >
          filter by 3f.xyz vaults
        </label>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border bg-background">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow className="hover:bg-transparent">
                <TableHead>Network</TableHead>
                <TableHead>Vault</TableHead>
                <TableHead>Symbol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="size-6 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-32 text-lg text-destructive">
          failed to load vaults
        </div>
      ) : !vaults.length ? (
        <div className="flex items-center justify-center py-32 text-lg text-muted-foreground">
          no vaults found
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="max-h-[calc(100vh-14rem)] overflow-y-auto rounded-2xl border bg-background"
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
              <TableRow className="hover:bg-transparent">
                <TableHead>Network</TableHead>
                <TableHead>Vault</TableHead>
                <TableHead>Symbol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vaults.map((vault) => (
                <TableRow
                  key={`${vault.chain.id}-${vault.address}`}
                  className="cursor-pointer"
                  onClick={() => router.push(`/${vault.address}`)}
                >
                  <TableCell>
                    <img
                      src={networkImages[vault.chain.id.toString()]}
                      alt={vault.chain.network}
                      width={24}
                      height={24}
                    />
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate">
                    {vault.name || "—"}{" "}
                    <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                      V2
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {vault.symbol || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div ref={sentinelRef} className="" />
        </div>
      )}
    </div>
  );
}
