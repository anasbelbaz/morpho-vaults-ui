"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAccount } from "wagmi";

import { useUserDepositHistory } from "@/hooks/vault/use-user-deposit-history";

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatBalance(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (value > 0 && value < 0.01) return "< 0.01";
  return value.toFixed(2);
}

export function UserDepositChart({
  vaultAddress,
  assetSymbol,
  decimals,
}: {
  vaultAddress: string;
  assetSymbol: string;
  decimals: number;
}) {
  const { address: userAddress, isConnected } = useAccount();
  const { data: points, isLoading } = useUserDepositHistory(
    vaultAddress,
    userAddress,
    decimals,
  );

  const currentBalance = points?.length ? points[points.length - 1].y : 0;

  if (!isConnected) {
    return (
      <div className="rounded-xl border p-6">
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
          connect your wallet to view your deposit history
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-6">
      <div className="mb-4">
        <p className="text-xs text-muted-foreground">
          My Deposit ({assetSymbol})
        </p>
        <p className="text-2xl font-semibold">
          {currentBalance.toFixed(5)} {assetSymbol}
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
          loading chart…
        </div>
      ) : !points?.length ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
          no deposit history
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={points}>
            <defs>
              <linearGradient id="userDepositFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBC687" stopOpacity={0.25} />
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
              domain={[0, "auto"]}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatBalance(Number(v))}
              width={50}
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
              formatter={(value) => [
                `${formatBalance(Number(value))} ${assetSymbol}`,
                "balance",
              ]}
            />
            <Area
              type="stepAfter"
              dataKey="y"
              stroke="#FBC687"
              strokeWidth={2}
              fill="url(#userDepositFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
