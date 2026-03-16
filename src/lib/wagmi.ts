import { createConfig, fallback, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY_ID;

const mainnetTransports = [
  ...(alchemyId
    ? [http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyId}`)]
    : []),
  http("https://eth.drpc.org"),
  http("https://ethereum-rpc.publicnode.com"),
  http("https://0xrpc.io/eth"),
  http("https://eth.meowrpc.com"),
  http("https://eth-mainnet.public.blastapi.io"),
  http("https://ethereum.public.blockpi.network/v1/rpc/public"),
  http("https://rpc.flashbots.net"),
  http("https://gateway.tenderly.co/public/mainnet"),
  http("https://ethereum-public.nodies.app"),
  http("https://rpc.mevblocker.io"),
];

export const config = createConfig(
  getDefaultConfig({
    chains: [mainnet],
    transports: {
      [mainnet.id]: fallback(mainnetTransports),
    },
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
    appName: "Morpho Vaults",
  }),
);
