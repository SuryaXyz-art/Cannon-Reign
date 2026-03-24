require("dotenv").config();
const { SDK } = require("@somnia-chain/reactivity");
const { createPublicClient, createWalletClient, http, parseGwei } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");

// Somnia Testnet chain config
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
  const GAME_CONTRACT = process.env.GAME_CONTRACT_ADDRESS;
  const REACTOR_CONTRACT = process.env.REACTOR_CONTRACT_ADDRESS;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  if (!GAME_CONTRACT || !REACTOR_CONTRACT || !PRIVATE_KEY) {
    throw new Error("Missing env vars: GAME_CONTRACT_ADDRESS, REACTOR_CONTRACT_ADDRESS, PRIVATE_KEY");
  }

  console.log("Creating Somnia Reactivity subscription...");
  console.log("Game Contract:", GAME_CONTRACT);
  console.log("Reactor Contract:", REACTOR_CONTRACT);

  const account = privateKeyToAccount(`0x${PRIVATE_KEY.replace("0x", "")}`);

  const sdk = new SDK({
    public: createPublicClient({
      chain: somniaTestnet,
      transport: http(),
    }),
    wallet: createWalletClient({
      account,
      chain: somniaTestnet,
      transport: http(),
    }),
  });

  // Create subscription — listens to ALL events from game contract
  const subData = {
    handlerContractAddress: REACTOR_CONTRACT,
    emitter: GAME_CONTRACT, // Only react to our game contract
    priorityFeePerGas: parseGwei("2"),
    maxFeePerGas: parseGwei("10"),
    gasLimit: 2_000_000n,
    isGuaranteed: true,  // Retry on failure
    isCoalesced: false,  // React to every event individually
  };

  const txHash = await sdk.createSoliditySubscription(subData);

  if (txHash instanceof Error) {
    console.error("❌ Subscription creation failed:", txHash.message);
    console.log("Make sure your wallet has 32+ SOMI tokens on Somnia Testnet");
    process.exit(1);
  }

  console.log("✅ Subscription created! Transaction hash:", txHash);
  console.log("The reactor will now automatically react to all game events on-chain");
  console.log("Check subscription with: node scripts/listSubscriptions.js");
}

main().catch(console.error);
