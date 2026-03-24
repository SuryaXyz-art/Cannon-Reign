const { ethers } = require("ethers");

async function checkWebSocket() {
  const wsUrls = [
    "wss://dream-rpc.somnia.network",
    "wss://dream-rpc.somnia.network/ws",
    "wss://rpc.testnet.somnia.network/ws"
  ];

  console.log("Checking Somnia RPC WebSocket for Native Reactivity...");

  for (const url of wsUrls) {
    console.log(`\nTesting connection to: ${url}`);
    
    try {
      await new Promise((resolve, reject) => {
        let isDone = false;
        const provider = new ethers.WebSocketProvider(url);
        
        provider.on("error", (err) => {
            if (!isDone) {
                isDone = true;
                reject(err);
            }
        });

        provider.getNetwork().then(async (network) => {
          try {
            const blockNumber = await provider.getBlockNumber();
            console.log(`✅ Success! Connected to ${url}`);
            console.log(`Network Name: ${network.name}, Chain ID: ${network.chainId}`);
            console.log(`Current Block Number: ${blockNumber}`);
            provider.destroy();
            if (!isDone) {
                isDone = true;
                resolve();
            }
          } catch (e) {
            if (!isDone) {
                isDone = true;
                reject(e);
            }
          }
        }).catch((e) => {
          if (!isDone) {
            isDone = true;
            reject(e);
          }
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (!isDone) {
            isDone = true;
            provider.destroy();
            reject(new Error("Timeout"));
          }
        }, 5000);
      });
    } catch (error) {
      console.error(`❌ Failed to connect to ${url}`);
      console.error(error.message);
    }
  }

  process.exit(0);
}

checkWebSocket();
