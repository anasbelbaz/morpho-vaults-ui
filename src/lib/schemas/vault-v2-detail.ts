import { z } from "zod";

const assetSchema = z.object({
  address: z.string(),
  symbol: z.string().optional(),
  decimals: z.number(),
  yield: z.object({ apr: z.number().nullable() }).nullable().optional(),
});

const chainSchema = z.object({
  id: z.number(),
  network: z.string(),
});

const rewardSchema = z.object({
  asset: z.object({
    address: z.string(),
    chain: z.object({ id: z.number() }),
  }),
  supplyApr: z.number().nullable().optional(),
  yearlySupplyTokens: z.union([z.string(), z.number()]).nullable().optional(),
});

const curatorSchema = z
  .object({
    items: z
      .array(
        z.object({
          addresses: z.array(z.object({ address: z.string() })).optional(),
        }),
      )
      .optional(),
  })
  .optional();

export const vaultV2DetailSchema = z.object({
  address: z.string(),
  name: z.string(),
  symbol: z.string(),
  listed: z.boolean(),
  asset: assetSchema,
  chain: chainSchema,
  totalAssets: z.union([z.string(), z.number()]).nullable().optional(),
  totalAssetsUsd: z.number().nullable().optional(),
  totalSupply: z.union([z.string(), z.number()]).nullable().optional(),
  liquidity: z.union([z.string(), z.number()]).nullable().optional(),
  liquidityUsd: z.number().nullable().optional(),
  avgApy: z.number().nullable().optional(),
  avgNetApy: z.number().nullable().optional(),
  performanceFee: z.number().nullable().optional(),
  managementFee: z.number().nullable().optional(),
  rewards: z.array(rewardSchema).nullable().optional(),
  curators: curatorSchema,
  metadata: z
    .object({
      description: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const vaultV2DetailResponseSchema = z.object({
  data: z.object({
    vaultV2ByAddress: vaultV2DetailSchema.nullable(),
  }),
});

export type VaultV2Detail = z.infer<typeof vaultV2DetailSchema>;
