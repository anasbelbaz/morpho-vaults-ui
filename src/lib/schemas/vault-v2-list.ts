import { z } from "zod";

const assetSchema = z.object({
  id: z.string(),
  address: z.string(),
  decimals: z.number(),
});

const chainSchema = z.object({
  id: z.number(),
  network: z.string(),
});

export const vaultV2Schema = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  listed: z.boolean(),
  asset: assetSchema,
  chain: chainSchema,
});

export const vaultV2ResponseSchema = z.object({
  data: z.object({
    vaultV2s: z.object({
      items: z.array(vaultV2Schema),
    }),
  }),
});

export type VaultV2 = z.infer<typeof vaultV2Schema>;
