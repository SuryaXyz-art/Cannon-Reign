require("dotenv").config();
const { SDK } = require("@somnia-chain/reactivity");
const { createPublicClient, createWalletClient, http } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");

const somniaTestnet = {
  id: 50312,
  name: "Somnia Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://dream-rpc.somnia.network"] },
    public: { http: ["https://dream-rpc.somnia.network"] },
  },
};

async function main() {
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY.replace("0x", "")}`);

  const sdk = new SDK({
    public: createPublicClient({ chain: somniaTestnet, transport: http() }),
    wallet: createWalletClient({ account, chain: somniaTestnet, transport: http() }),
  });

  const subs = await sdk.getAllSoliditySubscriptionsForOwner(account.address);
  console.log("Your active subscriptions:", JSON.stringify(subs, null, 2));
}

main().catch(console.error);
