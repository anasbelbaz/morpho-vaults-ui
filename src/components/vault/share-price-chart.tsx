"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { useVaultHistory } from "@/hooks/vault/use-vault-history";
import { Skeleton } from "@/components/ui/skeleton";

const periodOptions = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
] as const;

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function SharePriceChart({
  address,
  chainId,
}: {
  address: string;
  chainId: number;
}) {
  const [days, setDays] = useState(30);
  const { data: points, isLoading } = useVaultHistory(address, chainId, days);

  return (
    <div className="rounded-xl border p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">share price</p>
          {points?.length ? (
            <p className="text-2xl font-semibold">
              {points[points.length - 1].y.toFixed(6)}
            </p>
          ) : null}
        </div>
        <div className="flex gap-1 rounded-lg border p-0.5">
          {periodOptions.map((opt) => (
            <button
              key={opt.days}
              type="button"
              onClick={() => setDays(opt.days)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                days === opt.days
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-[260px] space-y-3 pt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : !points?.length ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
          no historical data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={points}>
            <defs>
              <linearGradient id="sharePriceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBC687" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#FBC687" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="x"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={["dataMin", "dataMax"]}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => v.toFixed(4)}
              width={65}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelFormatter={(label) =>
                new Date(Number(label) * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
              formatter={(value) => [Number(value).toFixed(6), "share price"]}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke="#FBC687"
              strokeWidth={2}
              fill="url(#sharePriceFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
