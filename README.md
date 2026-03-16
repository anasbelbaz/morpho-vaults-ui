# Morpho Vaults UI

A frontend for browsing and interacting with [Morpho](https://morpho.org) V2 vaults on Ethereum and Base.

## Features

- Browse listed Morpho V2 vaults with infinite scroll
- Filter by 3f.xyz curated vaults
- Vault detail pages with share price chart, TVL, APY, and on-chain stats
- Deposit & withdraw via ERC-4626 with batched transactions (EIP-5792)
- Allowance-aware deposits (skips approve when not needed)
- User deposit history chart and transaction tables
- Wallet connection via ConnectKit
- Dark/light mode with skeleton loading states
- Responsive layout with mobile drawer for the deposit form

## Tech Stack

Next.js 16 · React 19 · Tailwind CSS 4 · shadcn/ui · Wagmi · Viem · ConnectKit · TanStack Query · Recharts · Zod · Framer Motion

## Getting Started

```bash
cp .env.local.example .env.local   # add your keys
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | yes | WalletConnect project ID |

## Project Structure

```
src/
├── app/              # next.js app router pages
│   ├── page.tsx      # vault list
│   └── [id]/         # vault detail
├── components/
│   ├── ui/           # shadcn primitives
│   └── vault/        # vault-specific components
├── hooks/            # data fetching & on-chain hooks
└── lib/              # config, schemas, abis, utils
```

## Scripts

| Command | Description |
|---|---|
| `bun dev` | Start dev server |
| `bun build` | Production build |
| `bun lint` | Biome check |
| `bun format` | Biome format |
