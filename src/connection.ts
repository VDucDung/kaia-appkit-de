import { CaipNetwork, createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";


export const kaiaTestNetwork: CaipNetwork = {
  id: 1001,
  chainNamespace: "eip155",
  caipNetworkId: "eip155:1001",
  name: "Kaia Testnet",
  nativeCurrency: {
    name: "Kaia",
    symbol: "KAIA",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_KAIA_TESTNET_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Kaia Explorer", url: import.meta.env.VITE_KAIA_TESTNET_EXPLORER_URL },
  },
};

const projectId = import.meta.env.VITE_APPKIT_PROJECT_ID;

const networks: [CaipNetwork, ...CaipNetwork[]] = [
  kaiaTestNetwork,
];

const metadata = {
  name: "Appkit-sample",
  description: "Appkit sample project",
  url: "https://mywebsite.com",
  icons: ["https://avatars.mywebsite.com/"],
};

export const appkit = createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  metadata,
  projectId,
  allowUnsupportedChain: false,
  allWallets: "SHOW",
  defaultNetwork: kaiaTestNetwork,
  enableEIP6963: true,
  features: {
    analytics: true,
    allWallets: true,
    email: false,
    socials: [],
  },
});

appkit.switchNetwork(kaiaTestNetwork);
